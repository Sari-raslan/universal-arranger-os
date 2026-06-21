import fs from "node:fs";
import {
  createRealExporterCompatibilityMatrix,
  validateRealExporterCompatibilityMatrix
} from "../src/hardware/real-exporter/final-release/realExporterCompatibilityMatrix.js";

const matrix = createRealExporterCompatibilityMatrix();
const valid = validateRealExporterCompatibilityMatrix(matrix);
if (!valid.ok) throw new Error(valid.errors.join(", "));

const files = [
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX_SUMMARY.json"
];

for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (json.realKeyboardBinaryWriteAllowed === true || json.realBinaryOutputAllowed === true) {
    throw new Error(`Unsafe binary claim in ${file}`);
  }
  console.log(`OK ${file}`);
}

console.log("PHASE 72 REAL EXPORTER COMPATIBILITY MATRIX CHECK PASS");
