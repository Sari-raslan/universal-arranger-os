import fs from "node:fs";
import {
  createRealExporterNextRoadmap,
  validateRealExporterNextRoadmap
} from "../src/hardware/real-exporter/final-release/realExporterNextRoadmap.js";

const roadmap = createRealExporterNextRoadmap();
const valid = validateRealExporterNextRoadmap(roadmap);
if (!valid.ok) throw new Error(valid.errors.join(", "));

const files = [
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_NEXT_ROADMAP.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_NEXT_ROADMAP_SUMMARY.json"
];

for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (json.realKeyboardBinaryWriteAllowed === true || json.realBinaryOutputAllowed === true) {
    throw new Error(`Unsafe binary claim in ${file}`);
  }
  console.log(`OK ${file}`);
}

console.log("PHASE 73 REAL EXPORTER NEXT ROADMAP CHECK PASS");
