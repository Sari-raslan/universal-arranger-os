import { listUaosDeviceProfiles } from "./profiles/uaosDeviceProfiles.js";
import { createHardwareAdapterPlan, validateHardwareAdapterPlan } from "./adapters/uaosHardwareAdapterFoundation.js";
import { listGoldenHardwareFixtures, validateGoldenHardwareFixture } from "./fixtures/uaosGoldenHardwareFixtures.js";

export const UAOS_PHASE40_VERSION = "40.0.0";

export function runFinalHardwareExportGate() {
  const profiles = listUaosDeviceProfiles();
  const fixtures = listGoldenHardwareFixtures();
  const errors = [];

  if (profiles.length < 5) errors.push("Expected at least 5 device profiles.");
  if (fixtures.length < 2) errors.push("Expected at least 2 golden fixtures.");

  for (const fixture of fixtures) {
    const validFixture = validateGoldenHardwareFixture(fixture);
    if (!validFixture.ok) errors.push(`${fixture.id}: ${validFixture.errors.join(", ")}`);

    for (const profile of profiles) {
      const plan = createHardwareAdapterPlan(profile.id, {
        format: "UAOS_HARDWARE_EXPORT_PACKAGE",
        styleMap: {
          sections: fixture.sections,
          tracks: fixture.tracks
        }
      });

      const validPlan = validateHardwareAdapterPlan(plan);
      if (!validPlan.ok) errors.push(`${fixture.id}/${profile.id}: ${validPlan.errors.join(", ")}`);
      if (plan.realBinaryReady !== false) errors.push(`${fixture.id}/${profile.id}: realBinaryReady must be false.`);
    }
  }

  return {
    format: "UAOS_FINAL_HARDWARE_EXPORT_GATE",
    version: UAOS_PHASE40_VERSION,
    ok: errors.length === 0,
    profileCount: profiles.length,
    fixtureCount: fixtures.length,
    adapterPlanCount: profiles.length * fixtures.length,
    realBinaryExportReady: false,
    errors,
    notes: [
      "Safe local hardware export foundation complete.",
      "JSON manifests, adapter plans, device profiles, and fixtures are ready.",
      "Real proprietary keyboard binary export remains future engineering work."
    ]
  };
}
