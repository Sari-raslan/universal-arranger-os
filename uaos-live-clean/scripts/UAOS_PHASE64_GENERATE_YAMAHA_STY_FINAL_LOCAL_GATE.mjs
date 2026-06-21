import fs from "node:fs";
import path from "node:path";
import {
  createYamahaStyTrackFinalLocalGate,
  validateYamahaStyTrackFinalLocalGate
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyTrackFinalLocalGate.js";

const outDir = path.resolve("generated/real-exporter/yamaha-sty/package");
fs.mkdirSync(outDir, { recursive: true });

const gate = createYamahaStyTrackFinalLocalGate();
const valid = validateYamahaStyTrackFinalLocalGate(gate);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE.json"),
  JSON.stringify(gate, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE_SUMMARY",
    version: "64.0.0",
    target: "yamaha",
    futureFormat: ".STY",
    status: gate.status,
    requiredArtifactCount: gate.requiredArtifactCount,
    passedArtifactCount: gate.passedArtifactCount,
    failedArtifactCount: gate.failedArtifactCount,
    localYamahaSafeTrackPass: gate.finalDecision.localYamahaSafeTrackPass,
    allowSafeJsonPackage: gate.finalDecision.allowSafeJsonPackage,
    allowSafeUaosbinPackage: gate.finalDecision.allowSafeUaosbinPackage,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realStyWriterReady: false,
    nextPhase: 65,
    nextPhaseName: "Yamaha STY Safe Track Commit And Push Gate"
  }, null, 2),
  "utf8"
);

console.log("PHASE 64 YAMAHA STY FINAL LOCAL GATE GENERATION PASS");
