const fs=require("fs"); const path=require("path");
const p=path.join(process.cwd(),"generated","real-writer-validation","y291-y300","y291-y300-universal-output-lock-report.json");
function fail(m){console.error("[Y291-Y300 GATE FAIL]",m);process.exit(1);}
if(!fs.existsSync(p))fail("Missing lock report");
const r=JSON.parse(fs.readFileSync(p,"utf8")); const h=r.hardLocks||{};
if(r.phase!=="Y291-Y300")fail("Wrong phase");
if(r.status!=="PASS_WITH_ALL_REAL_OUTPUTS_BLOCKED")fail("Bad status");
for(const k of ["yamahaSty","korgSet","rolandStl","ketronPat","mspKst","writerImplementation"]){ if(h[k]!=="HARD_LOCKED")fail("Not hard locked: "+k); }
if(h.deploy!=="BLOCKED")fail("Deploy not blocked");
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y291-y300","y291-y300-safety-gate-report.json"),JSON.stringify({phase:"Y291-Y300",status:"PASS",confirmed:["ALL_REAL_OUTPUTS_HARD_LOCKED","WRITER_HARD_LOCKED","DEPLOY_BLOCKED"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y291-Y300 SAFETY PASS]");
