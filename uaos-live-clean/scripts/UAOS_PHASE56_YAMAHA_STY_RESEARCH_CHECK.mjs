import fs from "node:fs";
import {
  createYamahaStyWriterResearchPlan,
  validateYamahaStyWriterResearchPlan
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyWriterResearchPlan.js";

const plan = createYamahaStyWriterResearchPlan();
const valid = validateYamahaStyWriterResearchPlan(plan);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-exporter/yamaha-sty/yamaha-sty-writer-research-plan.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-writer-next-steps.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (json.realStyWriterReady === true || json.realKeyboardBinaryWriteAllowed === true) {
    throw new Error(`Unsafe readiness claim in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("PHASE 56 YAMAHA STY RESEARCH CHECK PASS");
