/**
 * MIDI Toolkit SKU V12 customer workflow tests
 */
import assert from "node:assert/strict";
import {
  CUSTOMER_MODES,
  runAllMidiCustomerWorkflows,
  runMidiCleanInstallEquivalent,
  getMidiProductStatus,
  runMidiToolkitCustomerMode
} from "../backend/src/sku/midiToolkitSku.js";

const wf = runAllMidiCustomerWorkflows();
assert.equal(wf.ok, true, `workflows failed: ${JSON.stringify(wf.results?.filter((r) => !r.ok))}`);
assert.equal(wf.p0, 0);
assert.equal(wf.p1, 0);
assert.equal(wf.SUPPORTED_ROUNDTRIP, "PASS");

const clean = runMidiCleanInstallEquivalent();
assert.equal(clean.ok, true);
assert.equal(clean.CLEAN_MACHINE_EQUIVALENT, true);
assert.equal(clean.NO_DEV_ENV_REQUIRED, true);

for (const mode of CUSTOMER_MODES) {
  const r = runMidiToolkitCustomerMode(mode);
  assert.notEqual(r.errorCode, "MODE_NOT_FOUND", mode);
}

const status = getMidiProductStatus();
assert.equal(status.midiToolkitV12InternalWorkComplete, true);

console.log("midi-toolkit-sku.test.mjs: PASS", wf.pass, "workflows");
