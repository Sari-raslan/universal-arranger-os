/**
 * Creator / Golden Sequencer → Neutral IR → SMF draft export.
 * Recovered exportMidiDraft + midiSmfAdapter. Not hardware write.
 */
import { renderGoldenSequencerSketch } from "../render/goldenSequencerStudio.js";
import { exportMidiDraft } from "../midi-exporter.js";
import { encodeMidiSmf, parseMidiSmf } from "../convert/midiSmfAdapter.js";
import { normalizeMidiToIr } from "../convert/uaosNeutralIr.js";

export function eventsToIrNoteEvents(events, { ppq = 480, tempo = 100 } = {}) {
  const tickPerSec = (ppq * tempo) / 60;
  return (events || [])
    .filter((e) => Number.isFinite(e.midi) && e.voice !== "kick" && e.voice !== "snare" && e.voice !== "hat")
    .map((e) => ({
      midi: e.midi,
      startTick: Math.max(0, Math.round(e.startSec * tickPerSec)),
      durationTicks: Math.max(1, Math.round(e.durationSec * tickPerSec)),
      velocity: Math.max(1, Math.min(127, Math.round((e.velocity || 0.8) * 100))),
      channel: e.voice === "bass" ? 1 : e.voice === "chord" ? 2 : 0
    }));
}

export function exportGoldenSequencerMidi({ tempo = 100, bars = 4 } = {}) {
  const sketch = renderGoldenSequencerSketch({ tempo, bars });
  const draft = exportMidiDraft({ song: { song: sketch.song }, state: { tempo } });
  const noteEvents = eventsToIrNoteEvents(sketch.events, { tempo, ppq: 480 });
  const bytes = encodeMidiSmf({ noteEvents, ppq: 480, tempoBpm: tempo });
  const parsed = parseMidiSmf(bytes);
  const ir = normalizeMidiToIr(bytes);
  return {
    ok: sketch.rendered.ok && draft.ok && parsed.ok && ir.ok,
    draft,
    noteEvents,
    bytes,
    parsed,
    ir,
    musicalQualityPass: false,
    commercialReady: false,
    hardwareVerified: false,
    capabilityId: "uaos.creator.golden-sequencer-midi/v1"
  };
}
