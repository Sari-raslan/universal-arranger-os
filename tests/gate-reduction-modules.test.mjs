import assert from "node:assert/strict";
import { runGateReductionSuite } from "../backend/src/gates/gateReductionModules.js";

const r = runGateReductionSuite();
assert.equal(r.ok, true);
assert.ok(r.passed >= 20);
console.log("gate-reduction-modules.test.mjs: PASS", r.passed, "/", r.total);
