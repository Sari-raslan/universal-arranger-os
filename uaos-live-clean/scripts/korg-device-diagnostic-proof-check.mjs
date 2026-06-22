import { createKorgDeviceDiagnosticProof } from "../src/korg/korgDeviceDiagnosticProof.js";
const out = createKorgDeviceDiagnosticProof({sale:"LOCKED",writer:"FORBIDDEN",realKeyboardOutput:"FORBIDDEN",commercialReady:false});
const failures = [];
if (!out.pass) failures.push("diagnostic proof failed");
if (out.sale !== "LOCKED") failures.push("sale not locked");
if (out.writer !== "FORBIDDEN") failures.push("writer not forbidden");
console.log(JSON.stringify({ result: failures.length ? "FAIL" : "PASS", out, failures }, null, 2));
if (failures.length) process.exit(1);
