import fs from "node:fs";

const required = [
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_FINAL_QA_GATE.json",
  "generated/real-exporter/device-tracks/korg-safe-track.json",
  "generated/real-exporter/device-tracks/roland-safe-track.json",
  "generated/real-exporter/device-tracks/ketron-safe-track.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing final build artifact: ${file}`);
  console.log(`OK ${file}`);
}

const gate = JSON.parse(fs.readFileSync("generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_FINAL_QA_GATE.json", "utf8"));

if (gate.status !== "PASS") throw new Error("Final QA gate is not PASS.");

if (
  gate.realKeyboardBinaryWriteAllowed === true ||
  gate.realWriterReady === true ||
  gate?.finalDecision?.allowRealKeyboardBinaryOutput === true
) {
  throw new Error("Unsafe real binary claim in final QA gate.");
}

console.log("PHASE 69 FINAL BUILD GATE CHECK PASS");
