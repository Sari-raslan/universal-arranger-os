const fs=require("fs"); const path=require("path");
const p=path.join(process.cwd(),"generated","real-writer-validation","y281-y290","y281-y290-parser-qa-dashboard-report.json");
function fail(m){console.error("[Y281-Y290 GATE FAIL]",m);process.exit(1);}
if(!fs.existsSync(p))fail("Missing dashboard");
const r=JSON.parse(fs.readFileSync(p,"utf8")); const h=r.hardLimits||{};
if(r.phase!=="Y281-Y290"||r.status!=="PASS"||r.dashboardOnly!==true)fail("Bad dashboard");
for(const k of ["fixtureRead","productionParserImplementation","writerImplementation","realOutput","deploy"]){ if(h[k]!==false)fail("Hard limit failed "+k); }
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y281-y290","y281-y290-safety-gate-report.json"),JSON.stringify({phase:"Y281-Y290",status:"PASS",confirmed:["DASHBOARD_ONLY","NO_PARSER","NO_WRITER","NO_REAL_OUTPUT","NO_DEPLOY"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y281-Y290 SAFETY PASS]");
