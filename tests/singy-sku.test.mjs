/**
 * Singy SKU V12 customer workflow tests
 */
import assert from "node:assert/strict";
import {
  runAllSingyCustomerWorkflows,
  runSingyCleanInstallEquivalent,
  getSingyProductStatus,
  runSingyCleanFirstRun
} from "../backend/src/sku/singySku.js";

const wf = runAllSingyCustomerWorkflows();
assert.equal(wf.ok, true, `workflows failed: ${JSON.stringify(wf.results?.filter((r) => !r.ok))}`);
assert.equal(wf.p0, 0);
assert.equal(wf.p1, 0);

const clean = runSingyCleanInstallEquivalent();
assert.equal(clean.ok, true);
assert.equal(clean.KIDS_FIRST_RUN, "PASS");
assert.equal(clean.TEEN_FIRST_RUN, "PASS");
assert.equal(clean.NO_DEV_ENV_REQUIRED, true);

const kids = runSingyCleanFirstRun("KIDS");
const teen = runSingyCleanFirstRun("TEEN");
assert.equal(kids.ok, true);
assert.equal(teen.ok, true);

const status = getSingyProductStatus();
assert.equal(status.UNCLEARED_SHIPPED_ASSETS, 0);
assert.equal(status.FINAL_MUSICAL_ACCEPTANCE_DEFERRED, true);
assert.equal(status.singyV12InternalWorkComplete, true);

console.log("singy-sku.test.mjs: PASS", wf.pass, "workflows");
