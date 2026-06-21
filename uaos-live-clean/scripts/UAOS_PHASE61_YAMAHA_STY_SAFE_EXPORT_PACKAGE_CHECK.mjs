import fs from "node:fs";
import {
  createYamahaStySafeExportPackage,
  validateYamahaStySafeExportPackage
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStySafeExportPackage.js";

const pkg = createYamahaStySafeExportPackage();
const valid = validateYamahaStySafeExportPackage(pkg);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);

  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (
    json.realStyWriterReady === true ||
    json.realKeyboardBinaryWriteAllowed === true ||
    json.allowRealStyOutput === true ||
    json.canExportRealSty === true ||
    json?.finalDecision?.canExportRealSty === true
  ) {
    throw new Error(`Unsafe real STY permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("PHASE 61 YAMAHA STY SAFE EXPORT PACKAGE CHECK PASS");
