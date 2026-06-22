import { classifyKorgCandidate, getKorgReadOnlyScopeReport } from "../src/korg/korgReadOnlyScope.js";

const samples = [
  { name: "demo.STY", size: 1024 },
  { name: "backup.SET", size: 65536 },
  { name: "song.mid", size: 4096 },
  { name: "large.STY", size: 999999 },
  { name: "image.png", size: 1000 }
];

const classifications = samples.map(classifyKorgCandidate);
const report = getKorgReadOnlyScopeReport();

const failures = [];
if (report.writer !== "FORBIDDEN") failures.push("writer must remain FORBIDDEN");
if (report.productionParser !== "FORBIDDEN") failures.push("production parser must remain FORBIDDEN");
if (report.realKeyboardOutput !== "FORBIDDEN") failures.push("real keyboard output must remain FORBIDDEN");
if (!classifications.some((x) => x.extension === ".sty" && x.status === "READ_ONLY_CANDIDATE")) failures.push("STY should be read-only candidate");
if (!classifications.some((x) => x.extension === ".set" && x.risks.includes("SET_PACKAGE_REQUIRES_SPECIAL_READ_ONLY_BOUNDARY"))) failures.push("SET boundary risk missing");
if (!classifications.some((x) => x.name === "large.STY" && x.risks.includes("FILE_EXCEEDS_SAFE_PREFIX_SCAN_LIMIT"))) failures.push("large file risk missing");

console.log(JSON.stringify({
  result: failures.length ? "FAIL" : "PASS",
  report,
  classifications,
  failures
}, null, 2));

if (failures.length) process.exit(1);
