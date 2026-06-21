import fs from "node:fs";
import path from "node:path";
import {
  listFormatResearchFixtures,
  validateFormatResearchFixture
} from "../src/hardware/real-exporter/fixtures/formatResearchFixtures.js";

const fixtures = listFormatResearchFixtures();

if (fixtures.length !== 4) {
  throw new Error(`Expected 4 fixtures, got ${fixtures.length}`);
}

for (const fixture of fixtures) {
  const valid = validateFormatResearchFixture(fixture);
  if (!valid.ok) {
    throw new Error(`${fixture.target}: ${valid.errors.join(", ")}`);
  }

  const file = path.join("src/hardware/real-exporter/fixtures", fixture.fixtureFile);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing fixture file: ${file}`);
  }

  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (json.realBinarySampleIncluded !== false) {
    throw new Error(`${fixture.target}: unsafe real binary sample claim`);
  }
  if (json.safeOnly !== true) {
    throw new Error(`${fixture.target}: fixture must be safeOnly`);
  }

  console.log(`OK ${fixture.target}: ${fixture.futureFormats.join(", ")}`);
}

console.log("PHASE 52 FORMAT RESEARCH FIXTURES CHECK PASS");
