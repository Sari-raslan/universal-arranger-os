import fs from "node:fs";
import path from "node:path";
import {
  createYamahaStySafeExportPackage,
  validateYamahaStySafeExportPackage
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStySafeExportPackage.js";

const outDir = path.resolve("generated/real-exporter/yamaha-sty/package");
fs.mkdirSync(outDir, { recursive: true });

const pkg = createYamahaStySafeExportPackage();
const valid = validateYamahaStySafeExportPackage(pkg);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE.json"),
  JSON.stringify(pkg, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE_SUMMARY",
    version: "61.0.0",
    target: "yamaha",
    futureFormat: ".STY",
    inputCount: pkg.inputs.length,
    canExportSafeJsonPackage: true,
    canExportSafeUaosbinPackage: true,
    canExportRealSty: false,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    nextPhase: 62,
    nextPhaseName: "Yamaha STY Safe UAOSBIN Package"
  }, null, 2),
  "utf8"
);

console.log("PHASE 61 YAMAHA STY SAFE EXPORT PACKAGE GENERATION PASS");
