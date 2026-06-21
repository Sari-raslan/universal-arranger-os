import fs from "node:fs";
import path from "node:path";
import {
  createRealExporterSafeFinalAudit,
  validateRealExporterSafeFinalAudit
} from "../src/hardware/real-exporter/final-release/realExporterSafeFinalAudit.js";

const outDir = path.resolve("generated/real-exporter/final-release");
fs.mkdirSync(outDir, { recursive: true });

const audit = createRealExporterSafeFinalAudit();
const valid = validateRealExporterSafeFinalAudit(audit);
if (!valid.ok) throw new Error(valid.errors.join(", "));

fs.writeFileSync(path.join(outDir, "UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT.json"), JSON.stringify(audit, null, 2), "utf8");

fs.writeFileSync(path.join(outDir, "UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT_SUMMARY.json"), JSON.stringify({
  format: "UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT_SUMMARY",
  version: "74.0.0",
  status: audit.status,
  requiredFileCount: audit.requiredFileCount,
  passedFileCount: audit.passedFileCount,
  failedFileCount: audit.failedFileCount,
  realExporterSafeFoundationFinal: audit.finalDecision.realExporterSafeFoundationFinal,
  allowSafeJsonPackage: true,
  allowSafeUaosbinPackage: true,
  allowRealKeyboardBinaryOutput: false,
  realWriterReady: false
}, null, 2), "utf8");

console.log("PHASE 74 REAL EXPORTER SAFE FINAL AUDIT GENERATION PASS");
