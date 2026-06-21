import fs from "node:fs";
import {
  createYamahaStyTrackFinalLocalGate,
  validateYamahaStyTrackFinalLocalGate
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyTrackFinalLocalGate.js";

const gate = createYamahaStyTrackFinalLocalGate();
const valid = validateYamahaStyTrackFinalLocalGate(gate);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (
    json.realStyWriterReady === true ||
    json.allowRealStyOutput === true ||
    json.canExportRealSty === true ||
    json?.finalDecision?.allowRealStyOutput === true ||
    json?.finalDecision?.canExportRealSty === true
  ) {
    throw new Error(`Unsafe real STY permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("PHASE 64 YAMAHA STY FINAL LOCAL GATE CHECK PASS");
