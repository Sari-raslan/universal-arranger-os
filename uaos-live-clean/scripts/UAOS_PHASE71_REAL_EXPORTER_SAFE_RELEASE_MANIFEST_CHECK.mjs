import fs from "node:fs";
import {
  createRealExporterSafeReleaseManifest,
  validateRealExporterSafeReleaseManifest
} from "../src/hardware/real-exporter/final-release/realExporterSafeReleaseManifest.js";

const manifest = createRealExporterSafeReleaseManifest();
const valid = validateRealExporterSafeReleaseManifest(manifest);
if (!valid.ok) throw new Error(valid.errors.join(", "));

const files = [
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST_SUMMARY.json"
];

for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (json.realKeyboardBinaryWriteAllowed === true || json.realWriterReady === true || json.allowRealKeyboardBinaryOutput === true) {
    throw new Error(`Unsafe binary claim in ${file}`);
  }
  console.log(`OK ${file}`);
}

console.log("PHASE 71 REAL EXPORTER SAFE RELEASE MANIFEST CHECK PASS");
