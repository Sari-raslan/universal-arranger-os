import fs from "node:fs";
import path from "node:path";
import {
  createUaosUltimateFinalClosure,
  validateUaosUltimateFinalClosure
} from "../src/ultimate-final/uaosUltimateFinalClosure.js";

const outDir = path.resolve("generated/ultimate-final");
fs.mkdirSync(outDir, { recursive: true });

const pack = createUaosUltimateFinalClosure();
const valid = validateUaosUltimateFinalClosure(pack);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_ULTIMATE_FINAL_CLOSURE.json"),
  JSON.stringify(pack, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_ULTIMATE_FINAL_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_ULTIMATE_FINAL_SUMMARY",
    version: "93-100.0.0",
    status: pack.status,
    localStatus: pack.project.localStatus,
    productionStatus: pack.project.productionStatus,
    realKeyboardBinaryStatus: pack.project.realKeyboardBinaryStatus,
    ultimateFinalClosurePass: pack.finalDecision.ultimateFinalClosurePass,
    allowSafeJsonPackage: true,
    allowSafeUaosbinPackage: true,
    allowRealKeyboardBinaryOutput: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    noDeploy: true,
    nextProgram: pack.nextProgram.name,
    recommendedFirstTarget: pack.nextProgram.recommendedFirstTarget
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_ULTIMATE_HANDOVER.md"),
  [
    "# UAOS Ultimate Final Handover",
    "",
    "Status: FINAL_SAFE_FOUNDATION_CLOSED_AND_PUSH_READY",
    "",
    "Completed:",
    "- Hardware Export Safe Foundation",
    "- Real Exporter Safe Foundation",
    "- Yamaha Safe STY Track",
    "- KORG Safe Track",
    "- Roland Safe Track",
    "- Ketron Safe Track",
    "- Final Closure Pack",
    "- Ultimate Final Closure",
    "",
    "Allowed now:",
    "- .json",
    "- .uaosbin",
    "",
    "Blocked:",
    "- .STY",
    "- .SET",
    "- .PRS",
    "- .STL",
    "- .PAT",
    "- .MSP",
    "- .KST",
    "",
    "No deploy was executed by the final launcher.",
    "",
    "Next program:",
    "Real Keyboard Binary Writer Validation Program.",
    "",
    "First recommended target:",
    "Yamaha .STY.",
    "",
    "Important:",
    "UAOS does not yet write real proprietary keyboard binary files."
  ].join("\n"),
  "utf8"
);

console.log("PHASES 93-100 ULTIMATE FINAL CLOSURE GENERATION PASS");
