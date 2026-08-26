import assert from "node:assert/strict";
import { createMixerContract, validateMixerState } from "../backend/src/studio/mixerContract.js";
const c = createMixerContract();
assert.equal(c.ok, true);
assert.equal(validateMixerState(c).ok, true);
assert.equal(validateMixerState({ ...c, realtimeDsp: true }).ok, false);
console.log("mixer-contract.test.mjs: PASS");
