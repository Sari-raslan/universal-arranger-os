import fs from "node:fs";
import path from "node:path";
import {
  createRealExporterNextRoadmap,
  validateRealExporterNextRoadmap
} from "../src/hardware/real-exporter/final-release/realExporterNextRoadmap.js";

const outDir = path.resolve("generated/real-exporter/final-release");
fs.mkdirSync(outDir, { recursive: true });

const roadmap = createRealExporterNextRoadmap();
const valid = validateRealExporterNextRoadmap(roadmap);
if (!valid.ok) throw new Error(valid.errors.join(", "));

fs.writeFileSync(path.join(outDir, "UAOS_REAL_EXPORTER_NEXT_ROADMAP.json"), JSON.stringify(roadmap, null, 2), "utf8");

fs.writeFileSync(path.join(outDir, "UAOS_REAL_EXPORTER_NEXT_ROADMAP_SUMMARY.json"), JSON.stringify({
  format: "UAOS_REAL_EXPORTER_NEXT_ROADMAP_SUMMARY",
  version: "73.0.0",
  currentStatus: roadmap.currentStatus,
  recommendedFirstRealTarget: roadmap.recommendedFirstRealTarget,
  roadmapSteps: roadmap.roadmap.length,
  realBinaryOutputAllowed: false,
  realKeyboardBinaryWriteAllowed: false
}, null, 2), "utf8");

console.log("PHASE 73 REAL EXPORTER NEXT ROADMAP GENERATION PASS");
