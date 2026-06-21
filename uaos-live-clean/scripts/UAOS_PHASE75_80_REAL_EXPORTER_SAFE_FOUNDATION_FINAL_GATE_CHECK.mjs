import fs from "node:fs";

const required = [
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_NEXT_ROADMAP.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_FINAL_QA_GATE.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing final file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    json.realKeyboardBinaryWriteAllowed === true ||
    json.realWriterReady === true ||
    json.realBinaryOutputAllowed === true ||
    json.allowRealKeyboardBinaryOutput === true ||
    json?.finalDecision?.allowRealKeyboardBinaryOutput === true
  ) {
    throw new Error(`Unsafe real binary permission in ${file}`);
  }
  console.log(`OK ${file}`);
}

console.log("PHASES 75-80 REAL EXPORTER SAFE FOUNDATION FINAL GATE CHECK PASS");
