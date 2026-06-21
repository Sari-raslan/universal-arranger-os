import fs from "node:fs";
import {
  createRealExporterFinalQaGate,
  validateRealExporterFinalQaGate
} from "../src/hardware/real-exporter/final-safe/realExporterFinalQaGate.js";

const gate = createRealExporterFinalQaGate();
const valid = validateRealExporterFinalQaGate(gate);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_FINAL_QA_GATE.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_FINAL_QA_GATE_SUMMARY.json"
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

console.log("PHASE 68 REAL EXPORTER FINAL QA GATE CHECK PASS");
