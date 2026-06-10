import { createArrangerState, switchSection, applyChord } from "./arranger/arrangerCore.js";
import { parseChord } from "./chords/chordEngine.js";
import { loadSetFile } from "./set-reader/setReader.js";
import { sendMidi } from "./midi/midiRouter.js";

let state = createArrangerState();
state = applyChord(state, "Dm");
state = switchSection(state, "Fill");

console.log(JSON.stringify({
  uaos: "Arranger Core Ready",
  set: loadSetFile("local-user-set.SET"),
  chord: parseChord(state.chord),
  state,
  midi: sendMidi({ type: "noteOn", note: 60, velocity: 100 })
}, null, 2));
