import fs from "node:fs";
import { createAllDeviceSafeTracks, validateDeviceSafeTrack } from "../src/hardware/real-exporter/final-safe/multiDeviceSafeTrack.js";

const tracks = createAllDeviceSafeTracks();

if (tracks.length !== 3) throw new Error(`Expected 3 tracks, got ${tracks.length}`);

for (const track of tracks) {
  const valid = validateDeviceSafeTrack(track);
  if (!valid.ok) throw new Error(`${track.target}: ${valid.errors.join(", ")}`);

  const file = `generated/real-exporter/device-tracks/${track.target}-safe-track.json`;
  if (!fs.existsSync(file)) throw new Error(`Missing generated track: ${file}`);

  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    json.realKeyboardBinaryWriteAllowed === true ||
    json.realWriterReady === true ||
    json.allowRealBinaryOutput === true ||
    json?.finalDecision?.canExportRealKeyboardBinary === true
  ) {
    throw new Error(`Unsafe real binary claim in ${file}`);
  }

  console.log(`OK ${track.target}`);
}

console.log("PHASES 65-66 MULTI DEVICE SAFE TRACK CHECK PASS");
