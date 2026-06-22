import { createUaosRealProductProof } from "../src/product/uaosRealProductProof.js";
const out = createUaosRealProductProof();
const failures = [];
if (out.commercialLaunch !== "LOCKED") failures.push("launch not locked");
if (out.payment !== "NOT_ACTIVE") failures.push("payment active");
if (out.deploy !== "NOT_RUN") failures.push("deploy ran");
if (out.productReadyForSale !== false) failures.push("product marked sale ready");
console.log(JSON.stringify({ result: failures.length ? "FAIL" : "PASS", out, failures }, null, 2));
if (failures.length) process.exit(1);
