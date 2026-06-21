import fs from "node:fs";
import path from "node:path";
import {
  createYamahaStyExportReadinessGate,
  validateYamahaStyExportReadinessGate
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyExportReadinessGate.js";

const outDir = path.resolve("generated/real-exporter/yamaha-sty");
fs.mkdirSync(outDir, { recursive: true });

const gate = createYamahaStyExportReadinessGate();

const valid = validateYamahaStyExportReadinessGate(gate);
if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-export-readiness-gate.json"),
  JSON.stringify(gate, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-export-readiness-summary.json"),
  JSON.stringify({
    format: "UAOS_YAMAHA_STY_EXPORT_READINESS_SUMMARY",
    version: "60.0.0",
    target: "yamaha",
    futureFormat: ".STY",
    safeStagesCompleted: gate.safeStagesCompleted,
    safeStagesChecked: gate.safeStagesChecked,
    allowRealStyOutput: false,
    allowJsonOutput: true,
    allowUaosbinOutput: true,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    nextPhase: 61,
    nextPhaseName: "Yamaha STY Safe Export Package"
  }, null, 2),
  "utf8"
);

console.log("PHASE 60 YAMAHA STY READINESS GATE GENERATION PASS");
