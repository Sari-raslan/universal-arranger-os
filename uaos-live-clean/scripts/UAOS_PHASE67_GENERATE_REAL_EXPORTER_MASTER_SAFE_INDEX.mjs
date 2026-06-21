import fs from "node:fs";
import path from "node:path";
import {
  createRealExporterMasterSafeIndex,
  validateRealExporterMasterSafeIndex
} from "../src/hardware/real-exporter/final-safe/realExporterMasterSafeIndex.js";

const outDir = path.resolve("generated/real-exporter/final-safe");
fs.mkdirSync(outDir, { recursive: true });

const index = createRealExporterMasterSafeIndex();
const valid = validateRealExporterMasterSafeIndex(index);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX.json"),
  JSON.stringify(index, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX_SUMMARY",
    version: "67.0.0",
    status: index.qa.status,
    inputCount: index.inputCount,
    safeFoundationReady: index.finalDecision.safeFoundationReady,
    allowSafeJsonPackage: true,
    allowSafeUaosbinPackage: true,
    allowRealKeyboardBinaryOutput: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    nextPhase: 68,
    nextPhaseName: "Real Exporter Final QA Gate"
  }, null, 2),
  "utf8"
);

console.log("PHASE 67 REAL EXPORTER MASTER SAFE INDEX GENERATION PASS");
