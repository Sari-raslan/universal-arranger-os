import {
  UAOS_REAL_HARDWARE_EXPORT_ROADMAP,
  getRealHardwareExportReadiness
} from "../src/hardware/uaosRealHardwareExportRoadmap.js";

const readiness = getRealHardwareExportReadiness();

if (readiness.phase !== 34) throw new Error("Wrong phase.");
if (readiness.targetCount < 4) throw new Error("Missing hardware targets.");
if (readiness.realBinaryExportReady !== false) throw new Error("Roadmap must not claim real binary export ready.");
if (!UAOS_REAL_HARDWARE_EXPORT_ROADMAP.engineeringGates.length) throw new Error("Missing engineering gates.");

for (const target of readiness.targets) {
  if (!target.formats.length) throw new Error(`${target.id}: formats missing.`);
  if (target.requiredNextCount < 4) throw new Error(`${target.id}: required next steps too weak.`);
  console.log(`OK ${target.id}: ${target.formats.join(", ")}`);
}

console.log("PHASE 34 REAL HARDWARE ROADMAP CHECK PASS");
