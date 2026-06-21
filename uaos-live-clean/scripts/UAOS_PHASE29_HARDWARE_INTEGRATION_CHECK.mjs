import {
  createPhase29StyleProject,
  createPhase29MidiReference,
  createIntegratedHardwareExport,
  validateIntegratedHardwareExport,
  serializeIntegratedHardwareExport
} from "../src/hardware/uaosHardwareIntegration.js";

const targets = ["korg", "yamaha", "roland", "ketron"];

for (const target of targets) {
  const styleProject = createPhase29StyleProject({
    projectName: `UAOS Phase 29 ${target}`,
    tempo: 104,
    key: "D minor",
    chordProgression: ["Dm", "Bb", "Gm", "A7"]
  });

  const midiReference = createPhase29MidiReference(styleProject);

  if (!midiReference.timeline.length) {
    throw new Error(`${target}: MIDI timeline missing`);
  }

  const pkg = createIntegratedHardwareExport({
    target,
    styleProject,
    midiReference
  });

  const valid = validateIntegratedHardwareExport(pkg);
  if (!valid.ok) {
    throw new Error(`${target}: ${valid.errors.join(", ")}`);
  }

  const text = serializeIntegratedHardwareExport(pkg);
  if (!text.includes("UAOS_PHASE29_MIDI_REFERENCE")) {
    throw new Error(`${target}: missing midi reference in serialization`);
  }

  console.log(`PASS ${target}: integrated style + midi + hardware export`);
}

console.log("PHASE 29 HARDWARE INTEGRATION CHECK PASS");
