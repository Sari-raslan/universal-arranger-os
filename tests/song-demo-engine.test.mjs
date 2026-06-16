import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_TRACKS,
  createSongDemoProject,
  exportProjectPackage,
  writeStandardMidiFile
} from "../uaos-live-clean/src/song/songDemoEngine.js";

test("song demo creates analysis project style draft and real midi", () => {
  const sampleRate = 8000;
  const seconds = 12;
  const samples = new Float32Array(sampleRate * seconds);
  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    const beatPulse = Math.sin(2 * Math.PI * 2 * time) > 0.96 ? 0.55 : 0;
    samples[index] = Math.sin(2 * Math.PI * 220 * time) * 0.18 + beatPulse;
  }

  const project = createSongDemoProject({
    samples,
    sampleRate,
    fileName: "demo.wav",
    fileSize: samples.byteLength,
    mimeType: "audio/wav"
  });

  assert.equal(project.version, "uaos-song-demo-v1");
  assert.equal(project.umsProject.schema, "uaos-ums-project");
  assert.equal(project.styleDraft.schema, "uaos-generic-style-draft");
  assert.equal(project.tracks.length, DEMO_TRACKS.length);
  assert.ok(project.tracks.find((track) => track.id === "drums").notes.length > 0);
  assert.ok(project.sections.length >= 3);
  assert.ok(project.analysis.tempo.bpm >= 70);
  assert.deepEqual(project.styleDraft.verifiedDeviceExports, []);

  const pkg = exportProjectPackage(project);
  assert.ok(pkg.contents["project.ums.json"]);
  assert.ok(pkg.contents["style-draft.uaos-style.json"]);

  const midi = writeStandardMidiFile(project);
  assert.equal(Buffer.from(midi.subarray(0, 4)).toString("ascii"), "MThd");
  assert.ok(Buffer.from(midi).includes(Buffer.from("MTrk")));
  assert.ok(midi.length > 256);
});
