const fs=require("fs"); const path=require("path");
const p=path.join(process.cwd(),"generated","real-writer-validation","y271-y280","y271-y280-parser-documentation-pack.json");
function fail(m){console.error("[Y271-Y280 GATE FAIL]",m);process.exit(1);}
if(!fs.existsSync(p))fail("Missing doc pack");
const r=JSON.parse(fs.readFileSync(p,"utf8")); const h=r.hardLimits||{};
if(r.phase!=="Y271-Y280"||r.status!=="PASS"||r.documentOnly!==true)fail("Bad doc pack");
for(const k of ["fixtureRead","productionParserImplementation","writerImplementation","realOutput","deploy"]){ if(h[k]!==false)fail("Hard limit failed "+k); }
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y271-y280","y271-y280-safety-gate-report.json"),JSON.stringify({phase:"Y271-Y280",status:"PASS",confirmed:["DOCUMENTATION_ONLY","NO_PARSER","NO_WRITER","NO_REAL_OUTPUT","NO_DEPLOY"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y271-Y280 SAFETY PASS]");
