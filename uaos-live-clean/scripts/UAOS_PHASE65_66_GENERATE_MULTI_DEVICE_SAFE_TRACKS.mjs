import fs from "node:fs";
import path from "node:path";
import { createAllDeviceSafeTracks, validateDeviceSafeTrack } from "../src/hardware/real-exporter/final-safe/multiDeviceSafeTrack.js";

const outDir = path.resolve("generated/real-exporter/device-tracks");
fs.mkdirSync(outDir, { recursive: true });

const tracks = createAllDeviceSafeTracks();

for (const track of tracks) {
  const valid = validateDeviceSafeTrack(track);
  if (!valid.ok) throw new Error(`${track.target}: ${valid.errors.join(", ")}`);

  const file = path.join(outDir, `${track.target}-safe-track.json`);
  fs.writeFileSync(file, JSON.stringify(track, null, 2), "utf8");
  console.log(`WROTE ${file}`);
}

fs.writeFileSync(
  path.join(outDir, "all-device-safe-tracks.json"),
  JSON.stringify({
    format: "UAOS_ALL_DEVICE_SAFE_TRACKS",
    version: "65-66.0.0",
    count: tracks.length,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    tracks
  }, null, 2),
  "utf8"
);

console.log("PHASES 65-66 MULTI DEVICE SAFE TRACK GENERATION PASS");
