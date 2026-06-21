import fs from "node:fs";
import {
  createRealExporterSafeFinalAudit,
  validateRealExporterSafeFinalAudit
} from "../src/hardware/real-exporter/final-release/realExporterSafeFinalAudit.js";

const audit = createRealExporterSafeFinalAudit();
const valid = validateRealExporterSafeFinalAudit(audit);
if (!valid.ok) throw new Error(valid.errors.join(", "));

const files = [
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT_SUMMARY.json"
];

for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    json.realWriterReady === true ||
    json.allowRealKeyboardBinaryOutput === true ||
    json?.finalDecision?.allowRealKeyboardBinaryOutput === true
  ) {
    throw new Error(`Unsafe binary claim in ${file}`);
  }
  console.log(`OK ${file}`);
}

console.log("PHASE 74 REAL EXPORTER SAFE FINAL AUDIT CHECK PASS");
