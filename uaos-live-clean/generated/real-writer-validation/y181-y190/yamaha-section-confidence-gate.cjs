const fs = require("fs");
const path = require("path");
const p = path.join(process.cwd(), "generated", "real-writer-validation", "y181-y190", "y181-y190-section-confidence-report.json");
function fail(m){ console.error("[Y181-Y190 GATE FAIL]", m); process.exit(1); }
if (!fs.existsSync(p)) fail("Missing report");
const r = JSON.parse(fs.readFileSync(p,"utf8")); const h = r.hardLimits || {};
if (r.phase !== "Y181-Y190") fail("Wrong phase");
if (r.status !== "PASS") fail("Not PASS");
if (h.fixtureRead !== false || h.fixtureCopy !== false || h.fixtureModify !== false) fail("Fixture safety failed");
if (h.writerImplementation !== false || h.realStyOutput !== false || h.deploy !== false) fail("Hard lock failed");
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y181-y190","y181-y190-safety-gate-report.json"), JSON.stringify({phase:"Y181-Y190",status:"PASS",confirmed:["SCORING_ONLY","NO_WRITER","NO_REAL_STY_OUTPUT","NO_DEPLOY"],generatedAt:new Date().toISOString()},null,2), "utf8");
console.log("[Y181-Y190 SAFETY PASS]");
