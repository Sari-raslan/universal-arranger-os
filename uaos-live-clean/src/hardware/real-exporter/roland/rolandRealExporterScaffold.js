import { createRealExporterSafetyGate } from "../shared/realExporterSafetyGate.js";

export function createRolandRealExporterScaffold() {
  return {
    exporter: "ROLAND_REAL_EXPORTER_SCAFFOLD",
    phase: 51,
    target: "roland",
    futureFormats: [".STL", ".PRS"],
    currentOutputs: [".uaosbin", ".json"],
    realBinaryWriterReady: false,
    modulesToBuildNext: [
      "roland performance structure mapper",
      "roland style section mapper",
      "roland device family compatibility matrix",
      "roland package writer scaffold",
      "roland validation fixtures"
    ],
    safetyGate: createRealExporterSafetyGate({ target: "roland" })
  };
}
