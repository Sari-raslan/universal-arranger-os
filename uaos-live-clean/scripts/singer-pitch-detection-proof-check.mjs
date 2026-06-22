import { createSingerPitchDetectionProof } from "../src/singer/singerPitchDetectionProof.js";
const out = createSingerPitchDetectionProof([440, 493.88, 523.25]);
const failures = [];
if (out.sale !== "LOCKED") failures.push("sale not locked");
if (out.payment !== "NOT_ACTIVE") failures.push("payment active");
if (out.voicedCount !== 3) failures.push("voiced count failed");
if (out.notes[0].noteName !== "A4") failures.push("A4 failed");
console.log(JSON.stringify({ result: failures.length ? "FAIL" : "PASS", out, failures }, null, 2));
if (failures.length) process.exit(1);
