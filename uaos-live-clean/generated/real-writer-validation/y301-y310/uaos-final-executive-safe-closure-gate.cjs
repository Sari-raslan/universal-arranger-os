const fs=require("fs"); const path=require("path");
const p=path.join(process.cwd(),"generated","real-writer-validation","y301-y310","y301-y310-executive-safe-closure-report.json");
function fail(m){console.error("[Y301-Y310 GATE FAIL]",m);process.exit(1);}
if(!fs.existsSync(p))fail("Missing executive closure");
const r=JSON.parse(fs.readFileSync(p,"utf8"));
if(r.phase!=="Y301-Y310")fail("Wrong phase");
if(r.status!=="PASS_SAFE_LOCAL_PROTOTYPE_CLOSURE")fail("Bad status");
if(r.ctoSummary.productionParser!=="BLOCKED")fail("Production parser not blocked");
if(r.ctoSummary.writer!=="HARD_LOCKED")fail("Writer not hard locked");
if(r.ctoSummary.realKeyboardOutputs!=="HARD_LOCKED")fail("Outputs not hard locked");
if(r.ctoSummary.deploy!=="BLOCKED")fail("Deploy not blocked");
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y301-y310","y301-y310-safety-gate-report.json"),JSON.stringify({phase:"Y301-Y310",status:"PASS",confirmed:["SAFE_LOCAL_PROTOTYPE_CLOSURE","NO_PRODUCTION_PARSER","NO_WRITER","NO_REAL_OUTPUT","NO_DEPLOY"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y301-Y310 SAFETY PASS]");
