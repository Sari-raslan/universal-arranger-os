import fs from "node:fs";
import {
  createYamahaStySafePackageQaGate,
  validateYamahaStySafePackageQaGate
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStySafePackageQaGate.js";

const gate = createYamahaStySafePackageQaGate();
const valid = validateYamahaStySafePackageQaGate(gate);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_GATE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);

  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (
    json.realStyWriterReady === true ||
    json.realKeyboardBinaryWriteAllowed === true ||
    json.allowRealStyOutput === true ||
    json.canExportRealSty === true ||
    json?.finalDecision?.allowRealStyOutput === true ||
    json?.finalDecision?.canExportRealSty === true
  ) {
    throw new Error(`Unsafe real STY permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

const summary = JSON.parse(fs.readFileSync("generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_SUMMARY.json", "utf8"));
if (summary.qaStatus !== "PASS") throw new Error("QA summary is not PASS.");

console.log("PHASE 63 YAMAHA STY SAFE PACKAGE QA CHECK PASS");
