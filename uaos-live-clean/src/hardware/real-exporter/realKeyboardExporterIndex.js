import { assertNoRealBinaryClaim } from "./shared/realExporterSafetyGate.js";
import { createKorgRealExporterScaffold } from "./korg/korgRealExporterScaffold.js";
import { createYamahaRealExporterScaffold } from "./yamaha/yamahaRealExporterScaffold.js";
import { createRolandRealExporterScaffold } from "./roland/rolandRealExporterScaffold.js";
import { createKetronRealExporterScaffold } from "./ketron/ketronRealExporterScaffold.js";

export const UAOS_PHASE51_VERSION = "51.0.0";

export function createRealKeyboardExporterScaffoldIndex() {
  const exporters = [
    createKorgRealExporterScaffold(),
    createYamahaRealExporterScaffold(),
    createRolandRealExporterScaffold(),
    createKetronRealExporterScaffold()
  ];

  for (const exporter of exporters) {
    assertNoRealBinaryClaim(exporter.safetyGate);
    if (exporter.realBinaryWriterReady !== false) {
      throw new Error(`${exporter.target}: unsafe real binary writer claim.`);
    }
  }

  return {
    format: "UAOS_REAL_KEYBOARD_EXPORTER_SCAFFOLD_INDEX",
    version: UAOS_PHASE51_VERSION,
    phase: 51,
    status: "SCAFFOLD_READY",
    realBinaryWriterReady: false,
    exporters,
    nextRecommendedPhase: 52,
    nextRecommendedWork: "Build legal-safe binary structure analyzers using documented fixtures only."
  };
}
