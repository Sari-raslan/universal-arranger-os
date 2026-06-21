import fs from "node:fs";
import {
  createUaosUltimateFinalClosure,
  validateUaosUltimateFinalClosure
} from "../src/ultimate-final/uaosUltimateFinalClosure.js";

const pack = createUaosUltimateFinalClosure();
const valid = validateUaosUltimateFinalClosure(pack);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/ultimate-final/UAOS_ULTIMATE_FINAL_CLOSURE.json",
  "generated/ultimate-final/UAOS_ULTIMATE_FINAL_SUMMARY.json",
  "generated/ultimate-final/UAOS_ULTIMATE_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ultimate final file: ${file}`);
  console.log(`OK ${file}`);
}

const summary = JSON.parse(fs.readFileSync("generated/ultimate-final/UAOS_ULTIMATE_FINAL_SUMMARY.json", "utf8"));

if (
  summary.allowRealKeyboardBinaryOutput === true ||
  summary.realKeyboardBinaryWriteAllowed === true ||
  summary.realWriterReady === true ||
  summary.noDeploy !== true
) {
  throw new Error("Unsafe or invalid ultimate final summary.");
}

console.log("PHASES 93-100 ULTIMATE FINAL CLOSURE CHECK PASS");
