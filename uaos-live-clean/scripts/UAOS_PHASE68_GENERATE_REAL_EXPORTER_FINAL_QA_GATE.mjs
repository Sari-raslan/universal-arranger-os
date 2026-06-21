import fs from "node:fs";
import path from "node:path";
import {
  createRealExporterFinalQaGate,
  validateRealExporterFinalQaGate
} from "../src/hardware/real-exporter/final-safe/realExporterFinalQaGate.js";

const outDir = path.resolve("generated/real-exporter/final-safe");
fs.mkdirSync(outDir, { recursive: true });

const gate = createRealExporterFinalQaGate();
const valid = validateRealExporterFinalQaGate(gate);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_REAL_EXPORTER_FINAL_QA_GATE.json"),
  JSON.stringify(gate, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_REAL_EXPORTER_FINAL_QA_GATE_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_REAL_EXPORTER_FINAL_QA_GATE_SUMMARY",
    version: "68.0.0",
    status: gate.status,
    safeRealExporterFoundationPass: gate.finalDecision.safeRealExporterFoundationPass,
    allowSafeJsonPackage: true,
    allowSafeUaosbinPackage: true,
    allowRealKeyboardBinaryOutput: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    nextPhase: 69,
    nextPhaseName: "Final Build Gate"
  }, null, 2),
  "utf8"
);

console.log("PHASE 68 REAL EXPORTER FINAL QA GATE GENERATION PASS");
