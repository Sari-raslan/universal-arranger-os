import { createRealExporterSafetyGate } from "../shared/realExporterSafetyGate.js";

export function createKorgRealExporterScaffold() {
  return {
    exporter: "KORG_REAL_EXPORTER_SCAFFOLD",
    phase: 51,
    target: "korg",
    futureFormats: [".STY", ".SET"],
    currentOutputs: [".uaosbin", ".json"],
    realBinaryWriterReady: false,
    modulesToBuildNext: [
      "korg container analyzer",
      "korg section encoder",
      "korg style metadata mapper",
      "korg checksum/manifest writer",
      "korg validation fixtures"
    ],
    safetyGate: createRealExporterSafetyGate({ target: "korg" })
  };
}
