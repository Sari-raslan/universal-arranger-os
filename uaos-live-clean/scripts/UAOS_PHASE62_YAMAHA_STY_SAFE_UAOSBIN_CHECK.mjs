import fs from "node:fs";
import {
  createYamahaStySafeUaosbinPackage,
  validateYamahaStySafeUaosbinPackage
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStySafeUaosbinPackage.js";

const container = createYamahaStySafeUaosbinPackage();
const valid = validateYamahaStySafeUaosbinPackage(container);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_PACKAGE.uaosbin",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_UAOSBIN_PACKAGE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_UAOSBIN_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);
  console.log(`OK ${file}`);
}

const bin = fs.readFileSync("generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_PACKAGE.uaosbin");
const magic = bin.subarray(0, 8).toString("utf8");

if (magic !== "UAOSBIN1") {
  throw new Error(`Invalid UAOSBIN magic: ${magic}`);
}

const summary = JSON.parse(fs.readFileSync("generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_UAOSBIN_SUMMARY.json", "utf8"));

if (
  summary.realStyWriterReady === true ||
  summary.realKeyboardBinaryWriteAllowed === true ||
  summary.allowRealStyOutput === true
) {
  throw new Error("Unsafe real STY permission in summary.");
}

console.log("PHASE 62 YAMAHA STY SAFE UAOSBIN CHECK PASS");
