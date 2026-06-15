import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { AudioEngine } from "../uaos-live-clean/src/audio/audioEngine.js";
import {
  SampleCache,
  SamplerEngine,
  migrateSamplerPreset,
  validateSamplerPreset,
} from "../uaos-live-clean/src/sampler/samplerEngine.js";
import {
  buildArrangerPlaybackContract,
  normalizeArrangerAssignments,
  routeArrangerEventToSampler,
} from "../uaos-live-clean/src/arranger/arrangerAudioIntegration.js";
import {
  LIBRARY_CATEGORIES,
  createLibraryCatalog,
  markFavorite,
  markRecent,
  searchLibrary,
  validateCatalog,
} from "../uaos-live-clean/src/library/libraryCatalog.js";
import { createDefaultOpenStyle } from "../uaos-live-clean/src/arranger/openStyleEngine.js";
import { detectRecordingSupport, RecordingEngine } from "../uaos-live-clean/src/recording/recordingEngine.js";
import {
  createDefaultSession,
  exportSession,
  importSession,
  migrateSession,
  validateSession,
} from "../uaos-live-clean/src/session/sessionStore.js";

function param(value = 1) {
  return {
    value,
    setTargetAtTime(next) { this.value = next; },
    setValueAtTime(next) { this.value = next; },
    linearRampToValueAtTime(next) { this.value = next; },
    exponentialRampToValueAtTime(next) { this.value = next; },
    cancelScheduledValues() {},
  };
}

class FakeNode {
  constructor() {
    this.gain = param(1);
    this.pan = param(0);
  }
  connect() { return this; }
  disconnect() {}
}

class FakeAudioContext {
  constructor() {
    this.state = "suspended";
    this.currentTime = 0;
    this.sampleRate = 48000;
    this.destination = new FakeNode();
  }
  createGain() { return new FakeNode(); }
  createStereoPanner() { return new FakeNode(); }
  createAnalyser() {
    return {
      fftSize: 4,
      connect() {},
      disconnect() {},
      getByteTimeDomainData(array) {
        array.set([128, 255, 1, 128]);
      },
    };
  }
  resume() { this.state = "running"; return Promise.resolve(); }
  suspend() { this.state = "suspended"; return Promise.resolve(); }
}

test("Phase 4 AudioEngine handles lifecycle, mix, sustain, panic, meter, and clipping", async () => {
  const engine = new AudioEngine({ AudioContextClass: FakeAudioContext, maxPolyphony: 2 });
  assert.equal((await engine.resume()).state, "running");

  engine.setMasterGain(1.2);
  engine.setChannelGain("sampler", 0.7);
  engine.setChannelPan("sampler", -0.25);
  engine.setMute("arranger", true);
  engine.setSolo("sampler", true);
  engine.setTranspose(12);
  engine.setFineTune(-6);
  engine.setPitchBend(2048);

  engine.allocateVoice({ note: 60, velocity: 100, sampleId: "a", startedAt: 1 });
  engine.allocateVoice({ note: 61, velocity: 100, sampleId: "b", startedAt: 2 });
  const stolen = engine.allocateVoice({ note: 62, velocity: 100, sampleId: "c", startedAt: 3 });
  assert.equal(stolen.stolenVoice.sampleId, "a");

  engine.setSustain(true);
  assert.equal(engine.noteOff(72).length, 0);
  assert.deepEqual(engine.setSustain(false), [84]);

  assert.equal(engine.updateMeter([0, 0.5, -1]).clipping, true);
  assert.equal(engine.panic().length, 2);
  assert.equal((await engine.suspend()).state, "suspended");
});

test("Phase 4 sampler validates presets, migrates legacy data, caches decode results, and reports WAV decode errors", async () => {
  const preset = migrateSamplerPreset({
    schemaVersion: 1,
    name: "Legacy",
    samples: [{ id: "s1", fileName: "Oud_C4.wav", loaded: true, keyLow: 0, keyHigh: 127 }],
    drumMap: { 36: 60 },
  });

  assert.equal(preset.schemaVersion, 2);
  assert.equal(validateSamplerPreset(preset).valid, true);
  assert.equal(validateSamplerPreset({ ...preset, legal: { commercialCopy: true } }).valid, false);

  const cache = new SampleCache({
    decodeAudioData: async () => ({ duration: 1.25, sampleRate: 48000 }),
  });
  assert.equal((await cache.loadArrayBuffer("s1", new ArrayBuffer(8))).duration, 1.25);
  assert.equal(cache.has("s1"), true);

  const failing = new SampleCache({
    decodeAudioData: async () => { throw new Error("bad wav"); },
  });
  await assert.rejects(() => failing.loadArrayBuffer("broken", new ArrayBuffer(8)), /WAV decode failed/);
});

test("Phase 4 sampler routes note-on/off, key zones, drum maps, one-shot mode, and missing assets safely", () => {
  const audioEngine = new AudioEngine({ AudioContextClass: FakeAudioContext, maxPolyphony: 8 });
  const sampler = new SamplerEngine({ audioEngine });

  sampler.loadPreset({
    schemaVersion: 2,
    name: "Drums",
    mode: "one-shot",
    drumMap: { 36: 60 },
    samples: [{ id: "kick", fileName: "Kick_C4.wav", loaded: true, keyLow: 60, keyHigh: 60 }],
  });

  assert.equal(sampler.noteOn(36, 100).sample.id, "kick");
  assert.deepEqual(sampler.noteOff(36), []);
  assert.equal(sampler.noteOn(48, 100).ok, false);
});

test("Phase 4 arranger contract maps parts to sampler presets and handles missing presets", () => {
  const style = createDefaultOpenStyle();
  const assignments = normalizeArrangerAssignments({ drums: { presetId: "kit", role: "drum-kit", midiChannel: 10 } });
  const contract = buildArrangerPlaybackContract(style, assignments, "variation1");
  assert.equal(contract.tempo, 100);
  assert.equal(contract.parts.find((part) => part.lane === "drums").assignment.presetId, "kit");

  const sampler = { noteOn: () => ({ ok: true, sample: { id: "kick" } }) };
  assert.equal(
    routeArrangerEventToSampler(contract.parts[0].events[0], contract.parts[0], new Map([["kit", sampler]])).sampleId,
    "kick",
  );
  assert.equal(routeArrangerEventToSampler(contract.parts[1].events[0], contract.parts[1], new Map()).reason, "missing-preset");
});

test("Phase 4 library catalog supports categories, search, favorites, recents, and metadata-only legal state", () => {
  assert.equal(LIBRARY_CATEGORIES.includes("Oriental"), true);
  const catalog = createLibraryCatalog([
    {
      libraryId: "oud",
      stableInstrumentId: "uaos.oud",
      name: "Oud",
      vendor: "UAOS",
      licenseStatus: "original-uaos",
      instrumentFamily: "oud",
      keyRange: { low: 36, high: 84 },
      velocityRange: { low: 1, high: 127 },
      tags: ["oriental", "plucked"],
      filePath: "original/oud.wav",
      category: "Oriental",
    },
  ]);

  assert.equal(validateCatalog(catalog).length, 0);
  assert.equal(searchLibrary(catalog, { query: "oud", category: "Oriental" }).length, 1);
  assert.equal(markFavorite(catalog, "oud", true).items[0].favorite, true);
  assert.equal(markRecent(catalog, "oud", "2026-06-13T00:00:00.000Z").items[0].lastUsedAt, "2026-06-13T00:00:00.000Z");
  assert.equal(catalog.items[0].legal.fileReferenceOnly, true);
});

test("Phase 4 recording support reports unsupported browser states and records local clip metadata through MediaRecorder", async () => {
  assert.equal(detectRecordingSupport({ navigator: {} }).mediaDevices, false);

  class FakeRecorder {
    static isTypeSupported(type) { return type === "audio/webm"; }
    constructor(stream, options) {
      this.stream = stream;
      this.mimeType = options.mimeType;
      this.state = "inactive";
    }
    start() {
      this.state = "recording";
      this.ondataavailable?.({ data: new Blob(["audio"], { type: this.mimeType }) });
    }
    pause() { this.state = "paused"; }
    resume() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      this.onstop?.();
    }
  }

  const scope = {
    MediaRecorder: FakeRecorder,
    navigator: {
      mediaDevices: {
        getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
      },
    },
  };

  const engine = new RecordingEngine(scope);
  await engine.selectMicrophone();
  assert.equal(engine.start(), "recording");
  assert.equal(engine.pause(), "paused");
  assert.equal(engine.resume(), "recording");
  const clip = await engine.stop();
  assert.equal(clip.type, "audio/webm");
  assert.equal(engine.updateLevel([0.1, -0.99]).clipping, true);
});

test("Phase 4 session migration preserves older sessions and serializes audio/sampler/library/recording state", () => {
  const migrated = migrateSession({ version: 1, name: "Old", bpm: 90, timeline: [] });
  assert.equal(migrated.version, 7);
  assert.equal(migrated.cloud.schemaVersion, 1);
  assert.equal(migrated.beta.schemaVersion, 1);
  assert.equal(migrated.audio.masterGain, 0.9);
  assert.equal(migrated.sampler.schemaVersion, 2);
  assert.equal(migrated.library.schemaVersion, 2);
  assert.deepEqual(migrated.recording.clips, []);
  assert.equal(migrated.aiMusic.schemaVersion, 1);
  assert.equal(validateSession(migrated).ok, true);

  const roundTrip = importSession(exportSession(createDefaultSession()));
  assert.equal(roundTrip.version, 7);
  assert.equal(roundTrip.cloud.schemaVersion, 1);
  assert.equal(roundTrip.beta.schemaVersion, 1);
  assert.equal(roundTrip.hardware.schemaVersion, 1);
  assert.equal(roundTrip.dawProject.schemaVersion, 1);
});

test("Phase 4 UI and docs expose professional sampler controls without fake commercial claims", () => {
  const samplerSource = fs.readFileSync(
    path.join(process.cwd(), "uaos-live-clean", "src", "components", "SamplerWorkbench.jsx"),
    "utf8",
  );
  const librarySource = fs.readFileSync(
    path.join(process.cwd(), "uaos-live-clean", "src", "components", "LibraryBrowser.jsx"),
    "utf8",
  );

  for (const text of [
    "Audio engine core",
    "Channel gain",
    "Channel pan",
    "Transpose",
    "Fine tuning",
    "Pitch bend",
    "Recording foundation",
    "CLIP",
    "Import WAV files",
    "Panic / All Notes Off",
  ]) {
    assert.equal(samplerSource.includes(text), true);
  }

  assert.equal(librarySource.includes("Filter by category"), true);
  assert.equal(samplerSource.includes("Commercial style parsing"), false);
});
