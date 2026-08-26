import assert from "node:assert/strict";
import { runAccessibilityTestsImplementation } from "../backend/src/qa/accessibilityTestsImplementation.js";
const r = runAccessibilityTestsImplementation({ websiteRoot: "public-website" });
assert.equal(r.ok, true);
assert.equal(r.liveBrowserProof, false);
console.log("accessibility-tests-implementation.test.mjs: PASS");
