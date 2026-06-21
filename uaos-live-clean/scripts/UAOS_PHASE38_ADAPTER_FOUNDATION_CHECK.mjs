import { listUaosDeviceProfiles } from "../src/hardware/profiles/uaosDeviceProfiles.js";
import { createHardwareAdapterPlan, validateHardwareAdapterPlan } from "../src/hardware/adapters/uaosHardwareAdapterFoundation.js";

for (const profile of listUaosDeviceProfiles()) {
  const plan = createHardwareAdapterPlan(profile.id, {
    styleMap: {
      sections: [{ id: "intro1" }, { id: "mainA" }],
      tracks: [{ id: "drums" }]
    }
  });
  const valid = validateHardwareAdapterPlan(plan);
  if (!valid.ok) throw new Error(`${profile.id}: ${valid.errors.join(", ")}`);
  console.log(`OK adapter ${profile.id}`);
}
console.log("PHASE 38 ADAPTER FOUNDATION CHECK PASS");
