import { createRealExporterSafetyGate } from "../shared/realExporterSafetyGate.js";

export function createKetronRealExporterScaffold() {
  return {
    exporter: "KETRON_REAL_EXPORTER_SCAFFOLD",
    phase: 51,
    target: "ketron",
    futureFormats: [".PAT", ".MSP", ".KST"],
    currentOutputs: [".uaosbin", ".json"],
    realBinaryWriterReady: false,
    modulesToBuildNext: [
      "ketron style package analyzer",
      "ketron section phrase mapper",
      "ketron audio drum reference mapper",
      "ketron package writer scaffold",
      "ketron validation fixtures"
    ],
    safetyGate: createRealExporterSafetyGate({ target: "ketron" })
  };
}
