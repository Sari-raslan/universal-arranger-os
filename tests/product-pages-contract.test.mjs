import assert from "node:assert/strict";
import { validateProductPagesContract } from "../backend/src/website/productPagesContract.js";
const r = validateProductPagesContract({ websiteRoot: "public-website" });
assert.equal(r.ok, true);
assert.equal(r.skus.length, 3);
console.log("product-pages-contract.test.mjs: PASS");
