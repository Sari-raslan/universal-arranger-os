import assert from "node:assert/strict";
import { runLicenseGenerationSuite, generateOfflineLicense } from "../backend/src/commercial/licenseGeneration.js";
const suite = runLicenseGenerationSuite();
assert.equal(suite.ok, true);
const one = generateOfflineLicense({ sku: "singy" });
assert.equal(one.ok, true);
assert.equal(one.paymentActivation, false);
console.log("license-generation.test.mjs: PASS");
