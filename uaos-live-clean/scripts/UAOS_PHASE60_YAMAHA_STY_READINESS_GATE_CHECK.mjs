import fs from "node:fs";
import {
  createYamahaStyExportReadinessGate,
  validateYamahaStyExportReadinessGate
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyExportReadinessGate.js";

const gate = createYamahaStyExportReadinessGate();
const valid = validateYamahaStyExportReadinessGate(gate);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-exporter/yamaha-sty/yamaha-sty-export-readiness-gate.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-export-readiness-summary.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);

  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (
    json.realStyWriterReady === true ||
    json.realKeyboardBinaryWriteAllowed === true ||
    json.allowRealStyOutput === true ||
    json?.finalDecision?.allowRealStyOutput === true
  ) {
    throw new Error(`Unsafe real STY permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("PHASE 60 YAMAHA STY READINESS GATE CHECK PASS");
