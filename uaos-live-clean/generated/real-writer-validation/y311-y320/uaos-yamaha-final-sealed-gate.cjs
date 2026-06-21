const fs=require("fs"); const path=require("path");
const p=path.join(process.cwd(),"generated","real-writer-validation","y311-y320","y311-y320-final-sealed-qa-dashboard-report.json");
function fail(m){console.error("[Y311-Y320 GATE FAIL]",m);process.exit(1);}
if(!fs.existsSync(p))fail("Missing sealed report");
const r=JSON.parse(fs.readFileSync(p,"utf8"));
if(r.phase!=="Y311-Y320")fail("Wrong phase");
if(r.status!=="SEALED_SAFE_STOP")fail("Not sealed");
if(r.productionParser!=="BLOCKED")fail("Parser not blocked");
if(r.writer!=="HARD_LOCKED")fail("Writer not hard locked");
if(r.realOutputs!=="HARD_LOCKED")fail("Outputs not hard locked");
if(r.deploy!=="BLOCKED")fail("Deploy not blocked");
if(r.appJsxModified!==false)fail("App.jsx flag bad");
if(r.fixtureModification!==false)fail("Fixture modification flag bad");
if(r.fixtureCopy!==false)fail("Fixture copy flag bad");
if(r.destructiveWrites!==false)fail("Destructive writes flag bad");
fs.writeFileSync(path.join(process.cwd(),"generated","real-writer-validation","y311-y320","y311-y320-final-safety-gate-report.json"),JSON.stringify({phase:"Y311-Y320",status:"PASS",confirmed:["SEALED_SAFE_STOP","NO_APP_JSX","NO_FIXTURE_MODIFY","NO_FIXTURE_COPY","NO_DESTRUCTIVE_WRITES","NO_PRODUCTION_PARSER","NO_WRITER","NO_REAL_OUTPUT","NO_DEPLOY"],generatedAt:new Date().toISOString()},null,2),"utf8");
console.log("[Y311-Y320 FINAL SAFETY PASS]");
