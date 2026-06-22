import { createSingerLearningExportPackage } from "../src/singer/singerLearningExportPackage.js";
const out = createSingerLearningExportPackage([{midi:60,start:0,duration:.5},{midi:64,start:.5,duration:.5}], "violin");
const failures = [];
if (out.sale !== "LOCKED") failures.push("sale not locked");
if (out.payment !== "NOT_ACTIVE") failures.push("payment active");
if (!out.hasMidiHeader || !out.hasTrackHeader) failures.push("midi headers failed");
if (out.instrument !== "violin") failures.push("instrument failed");
console.log(JSON.stringify({ result: failures.length ? "FAIL" : "PASS", out, failures }, null, 2));
if (failures.length) process.exit(1);
