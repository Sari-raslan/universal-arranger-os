import assert from "node:assert/strict";
import { auditProductAutomations } from "../backend/src/productRuntime/automationAudit.js";

const r = auditProductAutomations(".");
assert.equal(r.ok, true);
assert.equal(r.skus.length, 3);
assert.equal(r.productionDeploy, false);
console.log("product-automation-audit.test.mjs: PASS");
