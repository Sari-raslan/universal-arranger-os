import fs from "node:fs";
import {
  createUaosFinalClosurePack,
  validateUaosFinalClosurePack
} from "../src/final-closure/uaosFinalClosurePack.js";

const pack = createUaosFinalClosurePack();
const valid = validateUaosFinalClosurePack(pack);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/final-closure/UAOS_FINAL_CLOSURE_PACK.json",
  "generated/final-closure/UAOS_FINAL_CLOSURE_SUMMARY.json",
  "generated/final-closure/UAOS_HANDOVER_FINAL.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing final closure file: ${file}`);
  console.log(`OK ${file}`);
}

const summary = JSON.parse(fs.readFileSync("generated/final-closure/UAOS_FINAL_CLOSURE_SUMMARY.json", "utf8"));

if (
  summary.allowRealKeyboardBinaryOutput === true ||
  summary.realKeyboardBinaryWriteAllowed === true ||
  summary.realWriterReady === true
) {
  throw new Error("Unsafe real binary claim in final closure summary.");
}

console.log("PHASES 81-90 FINAL CLOSURE CHECK PASS");
