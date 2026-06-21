const fs = require("fs");
const path = require("path");
const p = path.join(process.cwd(), "generated", "real-writer-validation", "y251-y260", "y251-y260-rule-simulator-report.json");
function fail(m){ console.error("[Y251-Y260 GATE FAIL]", m); process.exit(1); }
if (!fs.existsSync(p)) fail("Missing simulator report");
const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};
if (r.phase !== "Y251-Y260" || r.status !== "PASS") fail("Bad report");
if (r.sourceReportsOnly !== true || r.simulationOnly !== true) fail("Not safe simulation only");
for (const k of ["fixtureRead","fixtureCopy","fixtureModify","chunkExtraction","payloadExport","productionParserImplementation","writerImplementation","realStyOutput","realSetPrsStlPatMspKstOutput","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y251-y260","y251-y260-safety-gate-report.json"), JSON.stringify({phase:"Y251-Y260",status:"PASS",confirmed:["REPORTS_ONLY","SIMULATION_ONLY","NO_FIXTURE_READ","NO_WRITER","NO_REAL_OUTPUT","NO_DEPLOY"],generatedAt:new Date().toISOString()},null,2), "utf8");
console.log("[Y251-Y260 SAFETY PASS]");
