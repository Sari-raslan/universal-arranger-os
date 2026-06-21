import fs from "node:fs";
import path from "node:path";
import {
  createAllSectionBinaryMappingPlans,
  validateSectionBinaryMappingPlan
} from "../src/hardware/real-exporter/mapping/sectionBinaryMappingPlan.js";

const outDir = path.resolve("generated/real-exporter/mapping");
fs.mkdirSync(outDir, { recursive: true });

const plans = createAllSectionBinaryMappingPlans({
  sections: [
    { id: "intro1", type: "intro", bars: 4, chord: "Dm" },
    { id: "mainA", type: "main", bars: 8, chord: "Dm" },
    { id: "fill1", type: "fill", bars: 1, chord: "A7" },
    { id: "mainB", type: "main", bars: 8, chord: "Gm" },
    { id: "ending1", type: "ending", bars: 4, chord: "Dm" }
  ]
});

for (const plan of plans) {
  const valid = validateSectionBinaryMappingPlan(plan);
  if (!valid.ok) throw new Error(`${plan.target}: ${valid.errors.join(", ")}`);

  const file = path.join(outDir, `${plan.target}-section-binary-mapping-plan.json`);
  fs.writeFileSync(file, JSON.stringify(plan, null, 2), "utf8");
  console.log(`WROTE ${file}`);
}

fs.writeFileSync(
  path.join(outDir, "all-section-binary-mapping-plans.json"),
  JSON.stringify({
    format: "UAOS_ALL_SECTION_BINARY_MAPPING_PLANS",
    version: "54.0.0",
    realBinaryWriterReady: false,
    binaryOutputBlocked: true,
    count: plans.length,
    plans
  }, null, 2),
  "utf8"
);

console.log("PHASE 54 SECTION BINARY MAPPING GENERATION PASS");
