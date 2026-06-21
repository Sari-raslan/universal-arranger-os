import fs from "node:fs";
import path from "node:path";
import {
  createYamahaStySafePackageQaGate,
  validateYamahaStySafePackageQaGate
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStySafePackageQaGate.js";

const outDir = path.resolve("generated/real-exporter/yamaha-sty/package");
fs.mkdirSync(outDir, { recursive: true });

const gate = createYamahaStySafePackageQaGate();
const valid = validateYamahaStySafePackageQaGate(gate);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_GATE.json"),
  JSON.stringify(gate, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_SUMMARY",
    version: "63.0.0",
    target: "yamaha",
    futureFormat: ".STY",
    qaStatus: gate.qa.status,
    requiredFileCount: gate.requiredFileCount,
    passedFileCount: gate.passedFileCount,
    failedFileCount: gate.failedFileCount,
    allowSafeJsonPackage: gate.finalDecision.allowSafeJsonPackage,
    allowSafeUaosbinPackage: gate.finalDecision.allowSafeUaosbinPackage,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    nextPhase: 64,
    nextPhaseName: "Yamaha STY Track Final Local Gate"
  }, null, 2),
  "utf8"
);

console.log("PHASE 63 YAMAHA STY SAFE PACKAGE QA GENERATION PASS");
