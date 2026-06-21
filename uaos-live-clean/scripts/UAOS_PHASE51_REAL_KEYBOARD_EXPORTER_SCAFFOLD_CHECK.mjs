import { createRealKeyboardExporterScaffoldIndex } from "../src/hardware/real-exporter/realKeyboardExporterIndex.js";

const index = createRealKeyboardExporterScaffoldIndex();

if (index.format !== "UAOS_REAL_KEYBOARD_EXPORTER_SCAFFOLD_INDEX") {
  throw new Error("Invalid scaffold index.");
}

if (index.realBinaryWriterReady !== false) {
  throw new Error("Index must not claim real binary writer ready.");
}

if (index.exporters.length !== 4) {
  throw new Error("Expected 4 exporter scaffolds.");
}

for (const exporter of index.exporters) {
  if (exporter.realBinaryWriterReady !== false) {
    throw new Error(`${exporter.target}: unsafe binary readiness claim.`);
  }
  if (!exporter.modulesToBuildNext.length) {
    throw new Error(`${exporter.target}: missing modulesToBuildNext.`);
  }
  console.log(`OK ${exporter.target}: ${exporter.futureFormats.join(", ")}`);
}

console.log("PHASE 51 REAL KEYBOARD EXPORTER SCAFFOLD CHECK PASS");
