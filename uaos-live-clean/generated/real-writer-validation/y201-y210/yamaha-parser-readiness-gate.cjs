const fs=require("fs"); const path=require("path");
const p=path.join(process.cwd(),"generated","real-writer-validation","y201-y210","y201-y210-parser-readiness-report.json");
function fail(m){console.error("[Y201-Y210 GATE FAIL]",m);process.exit(1);}
if(!fs.existsSync(p))fail("Missing report");
const r=JSON.parse(fs.readFileSync(p,"utf8")); const h=r.hardLimits||{};
if(r.phase!=="Y201-Y210"||r.status!=="PASS")fail("Bad report");
if(h.productionParser!==false||h.writerImplementation!==false||h.realStyOutput!==false||h.deploy!==false)fail("Hard lock failed");
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y201-y210","y201-y210-safety-gate-report.json"),JSON.stringify({phase:"Y201-Y210",status:"PASS",confirmed:["READINESS_ONLY","NO_PRODUCTION_PARSER","NO_WRITER","NO_REAL_STY_OUTPUT","NO_DEPLOY"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y201-Y210 SAFETY PASS]");
