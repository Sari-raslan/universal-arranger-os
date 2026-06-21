import fs from "node:fs";
import path from "node:path";
import {
  createYamahaStySafeUaosbinPackage,
  validateYamahaStySafeUaosbinPackage,
  writeYamahaStySafeUaosbinPackage
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStySafeUaosbinPackage.js";

const outDir = path.resolve("generated/real-exporter/yamaha-sty/package");
fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, "UAOS_YAMAHA_STY_SAFE_PACKAGE.uaosbin");
const result = writeYamahaStySafeUaosbinPackage(outFile);

const valid = validateYamahaStySafeUaosbinPackage(result.container);
if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_STY_SAFE_UAOSBIN_PACKAGE.json"),
  JSON.stringify(result.container, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_STY_SAFE_UAOSBIN_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_YAMAHA_STY_SAFE_UAOSBIN_SUMMARY",
    version: "62.0.0",
    target: "yamaha",
    futureFormat: ".STY",
    uaosbinFile: "UAOS_YAMAHA_STY_SAFE_PACKAGE.uaosbin",
    byteLength: result.byteLength,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    allowRealStyOutput: false,
    allowUaosbinOutput: true,
    nextPhase: 63,
    nextPhaseName: "Yamaha STY Safe Package QA Gate"
  }, null, 2),
  "utf8"
);

console.log("PHASE 62 YAMAHA STY SAFE UAOSBIN GENERATION PASS");
