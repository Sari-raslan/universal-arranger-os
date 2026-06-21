import fs from "node:fs";
import path from "node:path";
import {
  createRealExporterCompatibilityMatrix,
  validateRealExporterCompatibilityMatrix
} from "../src/hardware/real-exporter/final-release/realExporterCompatibilityMatrix.js";

const outDir = path.resolve("generated/real-exporter/final-release");
fs.mkdirSync(outDir, { recursive: true });

const matrix = createRealExporterCompatibilityMatrix();
const valid = validateRealExporterCompatibilityMatrix(matrix);
if (!valid.ok) throw new Error(valid.errors.join(", "));

fs.writeFileSync(path.join(outDir, "UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX.json"), JSON.stringify(matrix, null, 2), "utf8");

fs.writeFileSync(path.join(outDir, "UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX_SUMMARY.json"), JSON.stringify({
  format: "UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX_SUMMARY",
  version: "72.0.0",
  deviceGroupCount: matrix.devices.length,
  safeJsonReady: true,
  safeUaosbinReady: true,
  realBinaryOutputAllowed: false,
  realKeyboardBinaryWriteAllowed: false
}, null, 2), "utf8");

console.log("PHASE 72 REAL EXPORTER COMPATIBILITY MATRIX GENERATION PASS");
