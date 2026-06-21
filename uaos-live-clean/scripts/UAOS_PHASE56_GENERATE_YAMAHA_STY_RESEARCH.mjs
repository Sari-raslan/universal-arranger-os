import fs from "node:fs";
import path from "node:path";
import {
  createYamahaStyWriterResearchPlan,
  validateYamahaStyWriterResearchPlan
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyWriterResearchPlan.js";

const outDir = path.resolve("generated/real-exporter/yamaha-sty");
fs.mkdirSync(outDir, { recursive: true });

const plan = createYamahaStyWriterResearchPlan();

const valid = validateYamahaStyWriterResearchPlan(plan);
if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-writer-research-plan.json"),
  JSON.stringify(plan, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-writer-next-steps.json"),
  JSON.stringify({
    format: "UAOS_YAMAHA_STY_WRITER_NEXT_STEPS",
    version: "56.0.0",
    realStyWriterReady: false,
    nextPhase: 57,
    nextPhaseName: "Yamaha STY Intermediate Schema",
    steps: plan.researchModel.requiredBeforeWriter
  }, null, 2),
  "utf8"
);

console.log("PHASE 56 YAMAHA STY RESEARCH GENERATION PASS");
