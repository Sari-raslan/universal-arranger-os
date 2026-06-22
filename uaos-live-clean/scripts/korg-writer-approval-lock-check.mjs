import { assertKorgWriterBlocked } from "../src/korg/korgSafeWriterApprovalLock.js";
const out = assertKorgWriterBlocked({ outputExtension: ".STY" });
const failures = [];
if (out.sale !== "LOCKED") failures.push("sale not locked");
if (out.writerAllowed !== false) failures.push("writer allowed");
if (!out.blocked) failures.push("writer request not blocked");
console.log(JSON.stringify({ result: failures.length ? "FAIL" : "PASS", out, failures }, null, 2));
if (failures.length) process.exit(1);
