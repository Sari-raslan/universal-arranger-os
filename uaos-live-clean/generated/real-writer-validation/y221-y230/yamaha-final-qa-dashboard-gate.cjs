const fs=require("fs"); const path=require("path");
const p=path.join(process.cwd(),"generated","real-writer-validation","y221-y230","y221-y230-final-dashboard-report.json");
function fail(m){console.error("[Y221-Y230 GATE FAIL]",m);process.exit(1);}
if(!fs.existsSync(p))fail("Missing dashboard report");
const r=JSON.parse(fs.readFileSync(p,"utf8"));
if(r.phase!=="Y221-Y230")fail("Wrong phase");
if(r.status!=="PASS_WITH_SAFE_CLOSURE")fail("Not safe closure");
if(r.finalState.writer!=="HARD_LOCKED")fail("Writer not hard locked");
if(r.finalState.realStyOutput!=="HARD_LOCKED")fail("Real STY not hard locked");
if(r.finalState.deploy!=="BLOCKED")fail("Deploy not blocked");
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y221-y230","y221-y230-safety-gate-report.json"),JSON.stringify({phase:"Y221-Y230",status:"PASS",confirmed:["SAFE_CLOSURE","WRITER_HARD_LOCKED","REAL_STY_HARD_LOCKED","DEPLOY_BLOCKED"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y221-Y230 SAFETY PASS]");
