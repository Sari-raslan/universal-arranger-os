import fs from "node:fs";
import {
  createAllSectionBinaryMappingPlans,
  validateSectionBinaryMappingPlan
} from "../src/hardware/real-exporter/mapping/sectionBinaryMappingPlan.js";

const plans = createAllSectionBinaryMappingPlans();

if (plans.length !== 4) throw new Error(`Expected 4 mapping plans, got ${plans.length}`);

for (const plan of plans) {
  const valid = validateSectionBinaryMappingPlan(plan);
  if (!valid.ok) throw new Error(`${plan.target}: ${valid.errors.join(", ")}`);

  if (plan.realBinaryWriterReady !== false) throw new Error(`${plan.target}: unsafe real binary readiness claim.`);
  if (plan.binaryOutputBlocked !== true) throw new Error(`${plan.target}: binary output must be blocked.`);

  const file = `generated/real-exporter/mapping/${plan.target}-section-binary-mapping-plan.json`;
  if (!fs.existsSync(file)) throw new Error(`Missing generated mapping file: ${file}`);

  console.log(`OK ${plan.target}`);
}

if (!fs.existsSync("generated/real-exporter/mapping/all-section-binary-mapping-plans.json")) {
  throw new Error("Missing all mapping plans file.");
}

console.log("PHASE 54 SECTION BINARY MAPPING CHECK PASS");
