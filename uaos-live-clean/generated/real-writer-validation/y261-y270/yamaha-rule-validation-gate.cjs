const fs=require("fs"); const path=require("path");
const p=path.join(process.cwd(),"generated","real-writer-validation","y261-y270","y261-y270-rule-validation-report.json");
function fail(m){console.error("[Y261-Y270 GATE FAIL]",m);process.exit(1);}
if(!fs.existsSync(p)) fail("Missing report");
const r=JSON.parse(fs.readFileSync(p,"utf8")); const h=r.hardLimits||{};
if(r.phase!=="Y261-Y270"||r.status!=="PASS") fail("Bad report");
if(r.validationOnly!==true||r.sourceReportsOnly!==true) fail("Not validation/report only");
for(const k of ["fixtureRead","fixtureCopy","fixtureModify","productionParserImplementation","writerImplementation","realStyOutput","realSetPrsStlPatMspKstOutput","deploy"]){ if(h[k]!==false) fail("Hard limit failed: "+k); }
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y261-y270","y261-y270-safety-gate-report.json"),JSON.stringify({phase:"Y261-Y270",status:"PASS",confirmed:["VALIDATION_ONLY","REPORTS_ONLY","NO_PRODUCTION_PARSER","NO_WRITER","NO_REAL_OUTPUT","NO_DEPLOY"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y261-Y270 SAFETY PASS]");
