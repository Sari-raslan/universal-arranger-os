import fs from "node:fs";
import path from "node:path";
import {
  createUaosFinalClosurePack,
  validateUaosFinalClosurePack
} from "../src/final-closure/uaosFinalClosurePack.js";

const outDir = path.resolve("generated/final-closure");
fs.mkdirSync(outDir, { recursive: true });

const pack = createUaosFinalClosurePack();
const valid = validateUaosFinalClosurePack(pack);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_FINAL_CLOSURE_PACK.json"),
  JSON.stringify(pack, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_FINAL_CLOSURE_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_FINAL_CLOSURE_SUMMARY",
    version: "81-90.0.0",
    status: pack.status,
    localStatus: pack.project.localStatus,
    productionStatus: pack.project.productionStatus,
    finalClosurePass: pack.finalDecision.finalClosurePass,
    allowSafeJsonPackage: true,
    allowSafeUaosbinPackage: true,
    allowRealKeyboardBinaryOutput: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    nextProgram: pack.nextProgram.name,
    firstRecommendedTarget: pack.nextProgram.firstRecommendedTarget
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_HANDOVER_FINAL.md"),
  [
    "# UAOS Final Handover",
    "",
    "Status: SAFE_FOUNDATION_FINAL_CLOSED",
    "",
    "Completed:",
    "- Hardware Export Safe Foundation",
    "- Agent Workspace",
    "- Real Exporter Safe Foundation",
    "- Yamaha Safe STY Track",
    "- KORG/Roland/Ketron Safe Tracks",
    "- Final Safe Release Manifest",
    "- Final Compatibility Matrix",
    "- Final Roadmap",
    "- Final Audit",
    "- Final Closure Pack",
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
    "Next real program:",
    "Real Keyboard Binary Writer Validation Program.",
    "",
    "First recommended target:",
    "Yamaha .STY",
    "",
    "Important:",
    "This project does not yet write real proprietary keyboard binary files."
  ].join("\n"),
  "utf8"
);

console.log("PHASES 81-90 FINAL CLOSURE PACK GENERATION PASS");
