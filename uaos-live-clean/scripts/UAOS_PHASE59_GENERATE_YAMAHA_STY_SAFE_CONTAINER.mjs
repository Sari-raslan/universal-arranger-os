import fs from "node:fs";
import path from "node:path";
import {
  createYamahaStySafeContainerPlan,
  validateYamahaStySafeContainerPlan
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStySafeContainerPlan.js";

const outDir = path.resolve("generated/real-exporter/yamaha-sty");
fs.mkdirSync(outDir, { recursive: true });

const plan = createYamahaStySafeContainerPlan({
  styleName: "UAOS Oriental Yamaha Safe Container",
  tempo: 104,
  timeSignature: "4/4"
});

const valid = validateYamahaStySafeContainerPlan(plan);
if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-safe-container-plan.json"),
  JSON.stringify(plan, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-safe-container-summary.json"),
  JSON.stringify({
    format: "UAOS_YAMAHA_STY_SAFE_CONTAINER_SUMMARY",
    version: "59.0.0",
    target: "yamaha",
    futureFormat: ".STY",
    chunkCount: plan.container.chunks.length,
    eventCount: plan.payload.phraseSchema.phraseEventSummary.eventCount,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    binaryContainerReady: false,
    nextPhase: 60,
    nextPhaseName: "Yamaha STY Export Readiness Gate"
  }, null, 2),
  "utf8"
);

console.log("PHASE 59 YAMAHA STY SAFE CONTAINER GENERATION PASS");
