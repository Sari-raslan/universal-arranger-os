import fs from "node:fs";
import {
  createRealExporterMasterSafeIndex,
  validateRealExporterMasterSafeIndex
} from "../src/hardware/real-exporter/final-safe/realExporterMasterSafeIndex.js";

const index = createRealExporterMasterSafeIndex();
const valid = validateRealExporterMasterSafeIndex(index);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (
    json.realKeyboardBinaryWriteAllowed === true ||
    json.realWriterReady === true ||
    json.allowRealKeyboardBinaryOutput === true ||
    json?.finalDecision?.allowRealKeyboardBinaryOutput === true
  ) {
    throw new Error(`Unsafe real binary permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("PHASE 67 REAL EXPORTER MASTER SAFE INDEX CHECK PASS");
