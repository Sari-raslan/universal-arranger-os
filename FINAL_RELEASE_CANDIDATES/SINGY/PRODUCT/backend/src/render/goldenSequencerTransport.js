/**
 * Golden Sequencer transport polish — state machine (backend).
 */
import { Sequencer } from "../sequencer.js";
import { renderGoldenSequencerSketch } from "../render/goldenSequencerStudio.js";
import { exportGoldenSequencerMidi } from "../export/goldenSequencerMidi.js";

export function createTransport({ tempo = 100 } = {}) {
  return {
    state: "stopped",
    tempo,
    position: 0,
    loop: true,
    musicalQualityPass: false
  };
}

export function transportCommand(transport, command) {
  const next = { ...transport };
  if (command === "play") {
    if (next.state === "stopped" || next.state === "paused") next.state = "playing";
  } else if (command === "pause") {
    if (next.state === "playing") next.state = "paused";
  } else if (command === "stop") {
    next.state = "stopped";
    next.position = 0;
  } else if (command === "toggle-loop") {
    next.loop = !next.loop;
  } else {
    return { ok: false, errorCode: "UNKNOWN_TRANSPORT_COMMAND", transport };
  }
  return { ok: true, transport: next };
}

export function goldenSequencerEndToEnd({ tempo = 100, bars = 2 } = {}) {
  const seq = new Sequencer();
  seq.start();
  seq.tick();
  let transport = createTransport({ tempo });
  transport = transportCommand(transport, "play").transport;
  const sketch = renderGoldenSequencerSketch({ tempo, bars });
  const midi = exportGoldenSequencerMidi({ tempo, bars });
  transport = transportCommand(transport, "stop").transport;
  return {
    ok: sketch.rendered.ok && midi.ok && transport.state === "stopped",
    sequencer: seq.status(),
    transport,
    sketchOk: sketch.rendered.ok,
    midiOk: midi.ok,
    commercialReady: false,
    musicalQualityPass: false,
    capabilityId: "uaos.golden-sequencer.e2e/v1"
  };
}
