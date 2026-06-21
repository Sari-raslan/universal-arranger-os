const fs=require("fs"); const path=require("path");
const p=path.join(process.cwd(),"generated","real-writer-validation","y211-y220","y211-y220-writer-unlock-blocker-report.json");
function fail(m){console.error("[Y211-Y220 GATE FAIL]",m);process.exit(1);}
if(!fs.existsSync(p))fail("Missing report");
const r=JSON.parse(fs.readFileSync(p,"utf8")); const h=r.hardLocks||{};
if(r.phase!=="Y211-Y220")fail("Wrong phase");
if(r.writerUnlock!=="BLOCKED")fail("Writer not blocked");
if(h.writerImplementation!=="HARD_LOCKED")fail("Writer not hard locked");
if(h.realStyOutput!=="HARD_LOCKED")fail("Real STY not hard locked");
if(h.deploy!=="BLOCKED")fail("Deploy not blocked");
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y211-y220","y211-y220-safety-gate-report.json"),JSON.stringify({phase:"Y211-Y220",status:"PASS",confirmed:["WRITER_HARD_LOCKED","REAL_STY_HARD_LOCKED","DEPLOY_BLOCKED"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y211-Y220 SAFETY PASS]");
