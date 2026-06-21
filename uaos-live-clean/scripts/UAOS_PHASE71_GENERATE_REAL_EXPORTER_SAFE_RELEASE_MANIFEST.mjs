import fs from "node:fs";
import path from "node:path";
import {
  createRealExporterSafeReleaseManifest,
  validateRealExporterSafeReleaseManifest
} from "../src/hardware/real-exporter/final-release/realExporterSafeReleaseManifest.js";

const outDir = path.resolve("generated/real-exporter/final-release");
fs.mkdirSync(outDir, { recursive: true });

const manifest = createRealExporterSafeReleaseManifest();
const valid = validateRealExporterSafeReleaseManifest(manifest);
if (!valid.ok) throw new Error(valid.errors.join(", "));

fs.writeFileSync(path.join(outDir, "UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST.json"), JSON.stringify(manifest, null, 2), "utf8");

fs.writeFileSync(path.join(outDir, "UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST_SUMMARY.json"), JSON.stringify({
  format: "UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST_SUMMARY",
  version: "71.0.0",
  status: manifest.status,
  includedTrackCount: manifest.includedTracks.length,
  allowSafeJsonPackage: true,
  allowSafeUaosbinPackage: true,
  allowRealKeyboardBinaryOutput: false,
  realKeyboardBinaryWriteAllowed: false,
  realWriterReady: false
}, null, 2), "utf8");

console.log("PHASE 71 REAL EXPORTER SAFE RELEASE MANIFEST GENERATION PASS");
