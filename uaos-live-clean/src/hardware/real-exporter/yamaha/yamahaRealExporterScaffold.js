import { createRealExporterSafetyGate } from "../shared/realExporterSafetyGate.js";

export function createYamahaRealExporterScaffold() {
  return {
    exporter: "YAMAHA_REAL_EXPORTER_SCAFFOLD",
    phase: 51,
    target: "yamaha",
    futureFormats: [".STY"],
    currentOutputs: [".uaosbin", ".json"],
    realBinaryWriterReady: false,
    modulesToBuildNext: [
      "yamaha style container analyzer",
      "yamaha section encoder",
      "yamaha OTS metadata mapper",
      "yamaha checksum writer",
      "yamaha validation fixtures"
    ],
    safetyGate: createRealExporterSafetyGate({ target: "yamaha" })
  };
}
