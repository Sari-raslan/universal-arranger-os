const fs = require("fs"); const path = require("path");
const p = path.join(process.cwd(),"generated","real-writer-validation","y191-y200","y191-y200-style-structure-summary-report.json");
function fail(m){ console.error("[Y191-Y200 GATE FAIL]", m); process.exit(1); }
if(!fs.existsSync(p)) fail("Missing report");
const r=JSON.parse(fs.readFileSync(p,"utf8")); const h=r.hardLimits||{};
if(r.phase!=="Y191-Y200"||r.status!=="PASS") fail("Bad report");
if(h.fixtureRead!==false||h.fixtureCopy!==false||h.fixtureModify!==false) fail("Fixture lock failed");
if(h.writerImplementation!==false||h.realStyOutput!==false||h.deploy!==false) fail("Output lock failed");
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y191-y200","y191-y200-safety-gate-report.json"), JSON.stringify({phase:"Y191-Y200",status:"PASS",confirmed:["SUMMARY_ONLY","NO_WRITER","NO_REAL_STY_OUTPUT","NO_DEPLOY"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y191-Y200 SAFETY PASS]");
