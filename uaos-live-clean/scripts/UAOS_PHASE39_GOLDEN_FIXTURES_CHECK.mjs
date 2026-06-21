import { listGoldenHardwareFixtures, validateGoldenHardwareFixture } from "../src/hardware/fixtures/uaosGoldenHardwareFixtures.js";

const fixtures = listGoldenHardwareFixtures();
if (fixtures.length < 2) throw new Error("Expected 2+ fixtures.");

for (const fixture of fixtures) {
  const valid = validateGoldenHardwareFixture(fixture);
  if (!valid.ok) throw new Error(`${fixture.id}: ${valid.errors.join(", ")}`);
  console.log(`OK fixture ${fixture.id}`);
}

console.log("PHASE 39 GOLDEN FIXTURES CHECK PASS");
