import { listUaosDeviceProfiles } from "../src/hardware/profiles/uaosDeviceProfiles.js";
const profiles = listUaosDeviceProfiles();
if (profiles.length < 5) throw new Error("Expected 5+ profiles.");
for (const p of profiles) {
  if (p.realBinaryReady !== false) throw new Error(`${p.id} must not claim binary ready.`);
  console.log(`OK ${p.id}: ${p.brand} ${p.model}`);
}
console.log("PHASE 37 DEVICE PROFILES CHECK PASS");
