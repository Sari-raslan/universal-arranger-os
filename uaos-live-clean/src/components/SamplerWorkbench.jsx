import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "./StatusBadge.jsx";
import { VoiceAllocator } from "../sampler/voiceAllocator.js";
import { SampleVoiceEngine } from "../sampler/sampleVoiceEngine.js";
import {
  createInstrumentPreset,
  DEFAULT_ENVELOPE,
  DEFAULT_FILTER,
  inferRootNoteFromFileName,
  normalizeSampleZone,
  parseInstrumentPreset,
  selectSampleZone,
} from "../sampler/instrumentPreset.js";
import { useWebMidiInput } from "../hooks/useWebMidiInput.js";
import {
  formatMidiEvent,
  isPanicController,
  isSustainController,
  matchesMidiChannel,
} from "../midi/midiMessageParser.js";
import { detectRecordingSupport } from "../recording/recordingEngine.js";

const keyboardNotes = [
  { note: 60, label: "C4" },
  { note: 62, label: "D4" },
  { note: 64, label: "E4" },
  { note: 65, label: "F4" },
  { note: 67, label: "G4" },
  { note: 69, label: "A4" },
  { note: 71, label: "B4" },
  { note: 72, label: "C5" },
];

const computerKeyMap = Object.freeze({
  a: 60,
  s: 62,
  d: 64,
  f: 65,
  g: 67,
  h: 69,
  j: 71,
  k: 72,
});

function nowIso() {
  return new Date().toISOString();
}

function clampMidi(value) {
  return Math.min(127, Math.max(0, Number(value)));
}

export function SamplerWorkbench() {
  const allocatorRef = useRef(new VoiceAllocator({ maxVoices: 16 }));
  const audioContextRef = useRef(null);
  const engineRef = useRef(null);
  const buffersRef = useRef(new Map());
  const filesRef = useRef(new Map());
  const roundRobinCursorRef = useRef(0);
  const sustainRef = useRef(false);
  const sustainedNotesRef = useRef(new Set());
  const heldComputerKeysRef = useRef(new Set());
  const eventCounterRef = useRef(0);
  const sampleCounterRef = useRef(0);

  const [presetName, setPresetName] = useState("UAOS Local Instrument");
  const [samples, setSamples] = useState([]);
  const [velocity, setVelocity] = useState(100);
  const [maxVoices, setMaxVoices] = useState(16);
  const [activeVoices, setActiveVoices] = useState([]);
  const [lastEvent, setLastEvent] = useState("Ready");
  const [audioState, setAudioState] = useState("suspended");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [sustain, setSustain] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [recording, setRecording] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [masterGain, setMasterGain] = useState(0.9);
  const [channelGain, setChannelGain] = useState(1);
  const [channelPan, setChannelPan] = useState(0);
  const [channelMuted, setChannelMuted] = useState(false);
  const [channelSolo, setChannelSolo] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [fineTune, setFineTune] = useState(0);
  const [pitchBend, setPitchBend] = useState(0);
  const [masterMeter, setMasterMeter] = useState({ peak: 0, clipping: false });
  const [audioSupport, setAudioSupport] = useState("unknown");
  const [envelope, setEnvelope] = useState({ ...DEFAULT_ENVELOPE });
  const [filter, setFilter] = useState({ ...DEFAULT_FILTER });
  const recordingSupport = useMemo(() => detectRecordingSupport(window), []);

  const addEvent = useCallback((event) => {
    setEventLog((current) => [
      {
        id: `${performance.now()}-${eventCounterRef.current++}`,
        at: nowIso(),
        ...event,
      },
      ...current,
    ].slice(0, 150));
  }, []);

  const refreshVoices = useCallback(() => {
    setActiveVoices(allocatorRef.current.getActiveVoices());
  }, []);

  const ensureAudio = useCallback(async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Web Audio is not available in this runtime.");
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
      engineRef.current = new SampleVoiceEngine(audioContextRef.current);
      engineRef.current.setMasterGain(masterGain);
      setAudioSupport("available");
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    setAudioState(audioContextRef.current.state);
    return audioContextRef.current;
  }, [masterGain]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMasterGain(masterGain);
    }
  }, [masterGain]);

  useEffect(() => {
    if (!engineRef.current) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const peak = Math.min(1, activeVoices.length / Math.max(1, maxVoices));
      setMasterMeter({
        peak,
        clipping: peak >= 0.98 || masterGain > 1.6 || channelGain > 1.6,
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [activeVoices.length, channelGain, masterGain, maxVoices]);

  const releaseVoiceList = useCallback((voices, immediate = false) => {
    for (const voice of voices) {
      if (immediate) {
        engineRef.current?.stopImmediately(voice.id);
      } else {
        engineRef.current?.release(voice.id, envelope.release);
      }
    }
  }, [envelope.release]);

  const releaseNote = useCallback(
    (note, source = "ui") => {
      const playedNote = clampMidi(Number(note) + Number(transpose || 0));
      if (sustainRef.current) {
        sustainedNotesRef.current.add(playedNote);
        setLastEvent(`Sustain holding note ${playedNote}`);
        addEvent({ source, type: "sustainHold", note: playedNote });
        return;
      }

      const released = allocatorRef.current.noteOff(playedNote);
      releaseVoiceList(released);
      setLastEvent(`Released note ${playedNote}`);
      addEvent({ source, type: "noteOff", note: playedNote });
      refreshVoices();
    },
    [addEvent, refreshVoices, releaseVoiceList, transpose],
  );

  const triggerNote = useCallback(
    async (note, noteVelocity = velocity, source = "ui") => {
      try {
        await ensureAudio();
        const playedNote = clampMidi(Number(note) + Number(transpose || 0));

        const selection = selectSampleZone(
          samples,
          playedNote,
          noteVelocity,
          roundRobinCursorRef.current,
        );

        if (!selection.item) {
          throw new Error(
            samples.length === 0
              ? "Import one or more WAV files first."
              : "No loaded sample matches this note and velocity.",
          );
        }

        roundRobinCursorRef.current = selection.nextCursor;

        const buffer = buffersRef.current.get(selection.item.id);

        if (!buffer) {
          throw new Error(`Sample is not decoded: ${selection.item.fileName}`);
        }

        const allocation = allocatorRef.current.noteOn({
          note: playedNote,
          velocity: noteVelocity,
          sampleId: selection.item.id,
          startedAt: performance.now(),
        });

        if (allocation.stolenVoice) {
          engineRef.current?.stopImmediately(allocation.stolenVoice.id);
        }

        engineRef.current.play({
          voiceId: allocation.voice.id,
          buffer,
          note: playedNote,
          rootNote: selection.item.rootNote,
          velocity: noteVelocity,
          sampleGain: selection.item.gain * (channelMuted ? 0 : channelGain),
          samplePan: Math.min(1, Math.max(-1, Number(selection.item.pan) + channelPan)),
          envelope,
          filter,
        });

        const description = `${selection.item.displayName} آ· note ${note} آ· velocity ${noteVelocity}`;
        setLastEvent(description);

        addEvent({
          source,
          type: "noteOn",
          note: playedNote,
          velocity: noteVelocity,
          sampleId: selection.item.id,
          fileName: selection.item.fileName,
          stolenVoiceId: allocation.stolenVoice?.id || null,
          transpose,
          fineTune,
          pitchBend,
        });

        refreshVoices();
      } catch (error) {
        setLastEvent(error.message);
        addEvent({
          source,
          type: "error",
          message: error.message,
        });
      }
    },
    [
      addEvent,
      ensureAudio,
      envelope,
      filter,
      channelGain,
      channelMuted,
      channelPan,
      fineTune,
      pitchBend,
      refreshVoices,
      samples,
      transpose,
      velocity,
    ],
  );

  const panic = useCallback(
    (source = "ui") => {
      const released = allocatorRef.current.panic();
      releaseVoiceList(released, true);
      engineRef.current?.panic();
      sustainedNotesRef.current.clear();
      sustainRef.current = false;
      setSustain(false);
      setActiveVoices([]);
      setLastEvent(`Panic released ${released.length} voices`);
      addEvent({
        source,
        type: "panic",
        releasedVoices: released.length,
      });
    },
    [addEvent, releaseVoiceList],
  );

  const setSustainState = useCallback(
    (enabled, source = "midi") => {
      sustainRef.current = enabled;
      setSustain(enabled);
      setLastEvent(enabled ? "Sustain pedal on" : "Sustain pedal off");
      addEvent({
        source,
        type: "sustain",
        enabled,
      });

      if (!enabled && sustainedNotesRef.current.size > 0) {
        const notes = [...sustainedNotesRef.current];
        sustainedNotesRef.current.clear();

        for (const note of notes) {
          const released = allocatorRef.current.noteOff(note);
          releaseVoiceList(released);
        }

        refreshVoices();
      }
    },
    [addEvent, refreshVoices, releaseVoiceList],
  );

  const handleMidiEvent = useCallback(
    (message) => {
      if (!matchesMidiChannel(message, selectedChannel)) {
        return;
      }

      setLastEvent(formatMidiEvent(message));

      if (recording) {
        addEvent({
          source: "midi",
          type: message.type,
          channel: message.channel,
          note: message.note,
          velocity: message.velocity,
          controller: message.controller,
          value: message.value,
          centeredValue: message.centeredValue,
          inputName: message.inputName,
        });
      }

      if (message.type === "noteOn") {
        triggerNote(message.note, message.velocity, "midi");
        return;
      }

      if (message.type === "noteOff") {
        releaseNote(message.note, "midi");
        return;
      }

      if (message.type === "controlChange") {
        if (isSustainController(message.controller)) {
          setSustainState(message.value >= 64, "midi");
          return;
        }

        if (isPanicController(message.controller)) {
          panic("midi");
        }
      }
    },
    [
      addEvent,
      panic,
      recording,
      releaseNote,
      selectedChannel,
      setSustainState,
      triggerNote,
    ],
  );

  const midi = useWebMidiInput({
    onMidiEvent: handleMidiEvent,
  });

  useEffect(() => {
    function onKeyDown(event) {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        ["INPUT", "SELECT", "TEXTAREA"].includes(
          document.activeElement?.tagName,
        )
      ) {
        return;
      }

      const note = computerKeyMap[event.key.toLowerCase()];

      if (note == null || heldComputerKeysRef.current.has(event.key)) {
        return;
      }

      heldComputerKeysRef.current.add(event.key);
      triggerNote(note, velocity, "computer-keyboard");
    }

    function onKeyUp(event) {
      const note = computerKeyMap[event.key.toLowerCase()];

      if (note == null) {
        return;
      }

      heldComputerKeysRef.current.delete(event.key);
      releaseNote(note, "computer-keyboard");
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [releaseNote, triggerNote, velocity]);

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      audioContextRef.current?.close();
    };
  }, []);

  async function decodeAndAttachFile(file, existingSample = null) {
    const context = await ensureAudio();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    const id = existingSample?.id || `local-sample-${sampleCounterRef.current++}`;

    filesRef.current.set(id, file);
    buffersRef.current.set(id, decoded);

    return normalizeSampleZone({
      ...existingSample,
      id,
      fileName: file.name,
      displayName: existingSample?.displayName ||
        file.name.replace(/\.[^.]+$/, ""),
      rootNote: existingSample?.rootNote ??
        inferRootNoteFromFileName(file.name, 60),
      loaded: true,
      size: file.size,
      type: file.type || "audio/wav",
    });
  }

  async function importWavFiles(event) {
    const files = [...(event.target.files || [])];

    if (files.length === 0) {
      return;
    }

    setLoadingFiles(true);

    try {
      const next = [];

      for (const file of files) {
        if (!/\.wav$/i.test(file.name)) {
          addEvent({
            source: "file",
            type: "ignored",
            fileName: file.name,
            reason: "Only WAV is accepted in this phase.",
          });
          continue;
        }

        const existing = samples.find((sample) => (
          sample.fileName.toLowerCase() === file.name.toLowerCase()
        ));

        const decodedSample = await decodeAndAttachFile(file, existing);
        next.push(decodedSample);

        addEvent({
          source: "file",
          type: "sampleLoaded",
          sampleId: decodedSample.id,
          fileName: decodedSample.fileName,
          duration: buffersRef.current.get(decodedSample.id)?.duration || 0,
        });
      }

      setSamples((current) => {
        const byId = new Map(current.map((sample) => [sample.id, sample]));

        for (const sample of next) {
          byId.set(sample.id, sample);
        }

        return [...byId.values()];
      });

      setLastEvent(`Loaded ${next.length} WAV sample(s)`);
    } catch (error) {
      setLastEvent(error.message);
      addEvent({
        source: "file",
        type: "error",
        message: error.message,
      });
    } finally {
      setLoadingFiles(false);
      event.target.value = "";
    }
  }

  function updateSample(id, field, value) {
    setSamples((current) => current.map((sample) => {
      if (sample.id !== id) {
        return sample;
      }

      const numericFields = new Set([
        "rootNote",
        "keyLow",
        "keyHigh",
        "velocityLow",
        "velocityHigh",
        "gain",
        "pan",
      ]);

      return normalizeSampleZone({
        ...sample,
        [field]: numericFields.has(field) ? Number(value) : value,
      });
    }));
  }

  function removeSample(id) {
    panic("sample-remove");
    filesRef.current.delete(id);
    buffersRef.current.delete(id);
    setSamples((current) => current.filter((sample) => sample.id !== id));
    setLastEvent("Sample removed from runtime memory");
  }

  function clearSamples() {
    panic("sample-clear");
    filesRef.current.clear();
    buffersRef.current.clear();
    setSamples([]);
    setLastEvent("All runtime samples cleared");
  }

  function exportPreset() {
    const preset = createInstrumentPreset({
      name: presetName,
      samples,
      envelope,
      filter,
      masterGain,
    });

    const blob = new Blob(
      [JSON.stringify(preset, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${presetName.replace(/[^a-z0-9_-]+/gi, "-") || "uaos-instrument"}.uaos-instrument.json`;
    anchor.click();

    URL.revokeObjectURL(url);
    setLastEvent("Instrument preset exported");
  }

  async function importPreset(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const preset = parseInstrumentPreset(await file.text());
      panic("preset-import");
      buffersRef.current.clear();
      filesRef.current.clear();

      setPresetName(preset.name);
      setEnvelope(preset.envelope);
      setFilter(preset.filter);
      setMasterGain(preset.masterGain);
      setSamples(preset.samples.map((sample) => ({
        ...sample,
        loaded: false,
      })));

      setLastEvent(
        `Preset imported. Re-select ${preset.samples.length} WAV file(s) to relink audio.`,
      );
    } catch (error) {
      setLastEvent(error.message);
    } finally {
      event.target.value = "";
    }
  }

  function changePolyphony(event) {
    const nextMax = Number(event.target.value);
    panic("polyphony-change");
    allocatorRef.current = new VoiceAllocator({
      maxVoices: nextMax,
    });
    setMaxVoices(nextMax);
    setLastEvent(`Polyphony changed to ${nextMax}`);
  }

  async function resumeAudio() {
    try {
      await ensureAudio();
      setLastEvent("Audio engine resumed");
    } catch (error) {
      setAudioSupport("unavailable");
      setLastEvent(error.message);
    }
  }

  async function suspendAudio() {
    try {
      if (audioContextRef.current?.state === "running") {
        await audioContextRef.current.suspend();
      }
      setAudioState(audioContextRef.current?.state || "suspended");
      setLastEvent("Audio engine suspended");
    } catch (error) {
      setLastEvent(error.message);
    }
  }

  function exportEventLog() {
    const payload = {
      schemaVersion: 1,
      exportedAt: nowIso(),
      selectedInput: midi.selectedInput,
      deviceProfile: midi.deviceProfile,
      channelFilter: selectedChannel,
      events: [...eventLog].reverse(),
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "uaos-midi-sampler-events.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  const voiceUsage = useMemo(
    () => `${activeVoices.length} / ${maxVoices}`,
    [activeVoices.length, maxVoices],
  );

  const loadedSampleCount = useMemo(
    () => samples.filter((sample) => sample.loaded).length,
    [samples],
  );

  return (
    <section className="samplerWorkbench">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Local WAV + MIDI sampler</p>
          <h1>Sampler Workbench</h1>
          <p className="lead">
            Import local WAV files, map notes and velocity, shape them with ADSR,
            filter and pan, then play from MIDI or the computer keyboard.
          </p>
        </div>
        <StatusBadge status="experimental" />
      </div>

      <div className="samplerStatusGrid">
        <div><span>Audio</span><strong>{audioState}</strong></div>
        <div><span>Web Audio</span><strong>{audioSupport}</strong></div>
        <div><span>Samples</span><strong>{loadedSampleCount} / {samples.length}</strong></div>
        <div><span>Voices</span><strong>{voiceUsage}</strong></div>
        <div><span>MIDI</span><strong>{midi.connection}</strong></div>
        <div><span>Profile</span><strong>{midi.deviceProfile.name}</strong></div>
        <div><span>Sustain</span><strong>{sustain ? "on" : "off"}</strong></div>
        <div><span>Meter</span><strong>{Math.round(masterMeter.peak * 100)}% {masterMeter.clipping ? "CLIP" : ""}</strong></div>
        <div className="wide"><span>Last event</span><strong>{lastEvent}</strong></div>
      </div>

      <section className="panelSection live">
        <div className="sectionHeader">
          <div>
            <h2>Audio engine core</h2>
            <p>Lifecycle, channel mix, transpose, tuning, pitch bend foundation, meter, clipping, mute, solo, sustain, and panic.</p>
          </div>
          <StatusBadge status={audioSupport === "unavailable" ? "planned" : "available"} />
        </div>
        <div className="controlRow">
          <button onClick={resumeAudio}>Resume AudioContext</button>
          <button className="secondary" onClick={suspendAudio}>Suspend</button>
          <button className={channelMuted ? "active" : "secondary"} onClick={() => setChannelMuted((current) => !current)}>
            Mute
          </button>
          <button className={channelSolo ? "active" : "secondary"} onClick={() => setChannelSolo((current) => !current)}>
            Solo
          </button>
        </div>
        <div className="parameterGrid">
          <label>
            Channel gain
            <input type="range" min="0" max="2" step="0.01" value={channelGain} onChange={(event) => setChannelGain(Number(event.target.value))} />
            <strong>{channelGain.toFixed(2)}</strong>
          </label>
          <label>
            Channel pan
            <input type="range" min="-1" max="1" step="0.01" value={channelPan} onChange={(event) => setChannelPan(Number(event.target.value))} />
            <strong>{channelPan.toFixed(2)}</strong>
          </label>
          <label>
            Transpose
            <input type="range" min="-24" max="24" step="1" value={transpose} onChange={(event) => setTranspose(Number(event.target.value))} />
            <strong>{transpose} st</strong>
          </label>
          <label>
            Fine tuning
            <input type="range" min="-100" max="100" step="1" value={fineTune} onChange={(event) => setFineTune(Number(event.target.value))} />
            <strong>{fineTune} cents</strong>
          </label>
          <label>
            Pitch bend
            <input type="range" min="-8192" max="8191" step="1" value={pitchBend} onChange={(event) => setPitchBend(Number(event.target.value))} />
            <strong>{pitchBend}</strong>
          </label>
          <label>
            Master meter
            <progress max="1" value={masterMeter.peak}></progress>
            <strong>{masterMeter.clipping ? "clipping" : "clear"}</strong>
          </label>
        </div>
      </section>

      <section className="panelSection">
        <div className="sectionHeader">
          <div>
            <h2>Instrument and local WAV files</h2>
            <p>
              Audio remains in browser memory. WAV files are not copied to Git
              and are not uploaded by this interface.
            </p>
          </div>
        </div>

        <div className="controlRow">
          <label>
            Instrument name
            <input
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
            />
          </label>

          <label className="fileButton">
            {loadingFiles ? "Decoding WAV..." : "Import WAV files"}
            <input
              type="file"
              accept=".wav,audio/wav"
              multiple
              disabled={loadingFiles}
              onChange={importWavFiles}
            />
          </label>

          <label className="fileButton secondary">
            Import preset
            <input
              type="file"
              accept=".json,.uaos-instrument.json"
              onChange={importPreset}
            />
          </label>

          <button onClick={exportPreset} disabled={samples.length === 0}>
            Export preset
          </button>

          <button className="secondary danger" onClick={clearSamples}>
            Clear samples
          </button>
        </div>

        {samples.length === 0 ? (
          <p className="emptyState">
            Import a WAV such as Oud_C4.wav or Piano_root60.wav.
          </p>
        ) : (
          <div className="sampleZoneTableWrap">
            <table className="sampleZoneTable">
              <thead>
                <tr>
                  <th>Sample</th>
                  <th>Root</th>
                  <th>Keys</th>
                  <th>Velocity</th>
                  <th>Gain</th>
                  <th>Pan</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample) => (
                  <tr key={sample.id}>
                    <td>
                      <input
                        value={sample.displayName}
                        onChange={(event) => updateSample(
                          sample.id,
                          "displayName",
                          event.target.value,
                        )}
                      />
                      <small>{sample.fileName}</small>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="127"
                        value={sample.rootNote}
                        onChange={(event) => updateSample(
                          sample.id,
                          "rootNote",
                          event.target.value,
                        )}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="127"
                        value={sample.keyLow}
                        onChange={(event) => updateSample(
                          sample.id,
                          "keyLow",
                          event.target.value,
                        )}
                      />
                      <input
                        type="number"
                        min="0"
                        max="127"
                        value={sample.keyHigh}
                        onChange={(event) => updateSample(
                          sample.id,
                          "keyHigh",
                          event.target.value,
                        )}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max="127"
                        value={sample.velocityLow}
                        onChange={(event) => updateSample(
                          sample.id,
                          "velocityLow",
                          event.target.value,
                        )}
                      />
                      <input
                        type="number"
                        min="1"
                        max="127"
                        value={sample.velocityHigh}
                        onChange={(event) => updateSample(
                          sample.id,
                          "velocityHigh",
                          event.target.value,
                        )}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        step="0.05"
                        value={sample.gain}
                        onChange={(event) => updateSample(
                          sample.id,
                          "gain",
                          event.target.value,
                        )}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="-1"
                        max="1"
                        step="0.05"
                        value={sample.pan}
                        onChange={(event) => updateSample(
                          sample.id,
                          "pan",
                          event.target.value,
                        )}
                      />
                    </td>
                    <td>
                      <StatusBadge status={sample.loaded ? "available" : "planned"} />
                    </td>
                    <td>
                      <button
                        className="secondary danger"
                        onClick={() => removeSample(sample.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panelSection">
        <div className="sectionHeader">
          <div>
            <h2>Envelope and tone</h2>
            <p>ADSR, master gain, low-pass cutoff and resonance.</p>
          </div>
        </div>

        <div className="parameterGrid">
          {[
            ["Attack", "attack", 0, 5, 0.01],
            ["Decay", "decay", 0, 5, 0.01],
            ["Sustain", "sustain", 0, 1, 0.01],
            ["Release", "release", 0.01, 10, 0.01],
          ].map(([label, key, min, max, step]) => (
            <label key={key}>
              {label}
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={envelope[key]}
                onChange={(event) => setEnvelope((current) => ({
                  ...current,
                  [key]: Number(event.target.value),
                }))}
              />
              <strong>{Number(envelope[key]).toFixed(2)}</strong>
            </label>
          ))}

          <label>
            Master gain
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={masterGain}
              onChange={(event) => setMasterGain(Number(event.target.value))}
            />
            <strong>{masterGain.toFixed(2)}</strong>
          </label>

          <label>
            Filter cutoff
            <input
              type="range"
              min="20"
              max="22000"
              step="10"
              value={filter.cutoff}
              onChange={(event) => setFilter((current) => ({
                ...current,
                cutoff: Number(event.target.value),
              }))}
            />
            <strong>{Math.round(filter.cutoff)} Hz</strong>
          </label>

          <label>
            Resonance
            <input
              type="range"
              min="0.0001"
              max="30"
              step="0.1"
              value={filter.resonance}
              onChange={(event) => setFilter((current) => ({
                ...current,
                resonance: Number(event.target.value),
              }))}
            />
            <strong>{Number(filter.resonance).toFixed(1)}</strong>
          </label>
        </div>
      </section>

      <section className="panelSection midiConnectionPanel">
        <div className="sectionHeader">
          <div>
            <h2>MIDI input</h2>
            <p>
              Standard MIDI only. SysEx and MIDI output remain disabled.
            </p>
          </div>
          <StatusBadge status={midi.support === "available" ? "available" : "planned"} />
        </div>

        <div className="controlRow">
          <button
            onClick={midi.connect}
            disabled={midi.connection === "requesting-permission"}
          >
            Connect MIDI
          </button>

          <button className="secondary" onClick={midi.disconnect}>
            Disconnect
          </button>

          <select
            aria-label="MIDI input"
            value={midi.selectedInputId}
            onChange={(event) => midi.setSelectedInputId(event.target.value)}
            disabled={midi.inputs.length === 0}
          >
            {midi.inputs.length === 0 && (
              <option value="">No MIDI input detected</option>
            )}

            {midi.inputs.map((input) => (
              <option key={input.id} value={input.id}>
                {input.manufacturer ? `${input.manufacturer} ` : ""}
                {input.name}
              </option>
            ))}
          </select>

          <select
            aria-label="MIDI channel filter"
            value={selectedChannel}
            onChange={(event) => setSelectedChannel(event.target.value)}
          >
            <option value="all">All MIDI channels</option>
            {Array.from({ length: 16 }, (_, index) => (
              <option value={index} key={index}>
                Channel {index + 1}
              </option>
            ))}
          </select>
        </div>

        {midi.error && <p className="errorText">{midi.error}</p>}
      </section>

      <section className="panelSection">
        <div className="sectionHeader">
          <div>
            <h2>Recording foundation</h2>
            <p>Microphone selection, MediaRecorder support, level and clipping contracts, local clip metadata, and offline export contracts are guarded by browser support checks.</p>
          </div>
          <StatusBadge status={recordingSupport.mediaRecorder ? "available" : "planned"} />
        </div>
        <div className="samplerStatusGrid">
          <div><span>Microphone</span><strong>{recordingSupport.mediaDevices ? "available" : "unsupported"}</strong></div>
          <div><span>MediaRecorder</span><strong>{recordingSupport.mediaRecorder ? "available" : "unsupported"}</strong></div>
          <div className="wide"><span>Formats</span><strong>{recordingSupport.supportedMimeTypes.join(", ") || "none reported"}</strong></div>
          <div><span>Offline render</span><strong>contract only</strong></div>
        </div>
      </section>

      <div className="controlRow">
        <label>
          Test velocity
          <input
            type="range"
            min="1"
            max="127"
            value={velocity}
            onChange={(event) => setVelocity(
              clampMidi(event.target.value),
            )}
          />
        </label>

        <strong>{velocity}</strong>

        <label>
          Polyphony
          <select value={maxVoices} onChange={changePolyphony}>
            {[4, 8, 16, 32, 64].map((value) => (
              <option value={value} key={value}>
                {value} voices
              </option>
            ))}
          </select>
        </label>

        <button
          className={recording ? "active" : "secondary"}
          onClick={() => setRecording((current) => !current)}
        >
          {recording ? "Recording MIDI Events" : "Record MIDI Events"}
        </button>

        <button className="secondary danger" onClick={() => panic("ui")}>
          Panic / All Notes Off
        </button>
      </div>

      <p className="keyboardHint">Computer keys: A S D F G H J K</p>

      <div className="samplerKeyboard" role="group" aria-label="Sampler keyboard">
        {keyboardNotes.map(({ note, label }) => (
          <button
            key={note}
            onPointerDown={() => triggerNote(note, velocity, "ui")}
            onPointerUp={() => releaseNote(note, "ui")}
            onPointerCancel={() => releaseNote(note, "ui")}
            onPointerLeave={() => releaseNote(note, "ui")}
          >
            <span>{label}</span>
            <small>{note}</small>
          </button>
        ))}
      </div>

      <section className="panelSection compact">
        <div className="sectionHeader">
          <div>
            <h2>Active voices</h2>
            <p>Oldest voices are stolen at the selected polyphony limit.</p>
          </div>
        </div>

        {activeVoices.length === 0 ? (
          <p className="emptyState">No active voice.</p>
        ) : (
          <div className="eventList">
            {activeVoices.map((voice) => (
              <p key={voice.id}>
                Voice {voice.id} آ· note {voice.note} آ· velocity {voice.velocity}
                {" آ· "}{voice.sampleId}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="panelSection compact">
        <div className="sectionHeader">
          <div>
            <h2>Event log</h2>
            <p>Maximum 150 events. Export remains local.</p>
          </div>

          <div className="controlRow">
            <button
              className="secondary"
              onClick={() => setEventLog([])}
            >
              Clear
            </button>

            <button
              className="secondary"
              onClick={exportEventLog}
            >
              Export JSON
            </button>
          </div>
        </div>

        {eventLog.length === 0 ? (
          <p className="emptyState">No recorded event.</p>
        ) : (
          <div className="eventList tall">
            {eventLog.map((event) => (
              <p key={event.id}>
                {event.at} آ· {event.source} آ· {event.type}
                {event.note != null ? ` آ· note ${event.note}` : ""}
                {event.velocity != null ? ` آ· velocity ${event.velocity}` : ""}
                {event.fileName ? ` آ· ${event.fileName}` : ""}
              </p>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
