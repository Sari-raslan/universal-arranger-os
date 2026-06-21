const fs=require("fs"); const path=require("path");
const base=path.join(process.cwd(),"generated","real-writer-validation");
const outDir=path.join(base,"y281-y290"); fs.mkdirSync(outDir,{recursive:true});
function load(rel){const p=path.join(base,rel); if(!fs.existsSync(p)){console.error("[Y281-Y290 FAIL] Missing",rel); process.exit(1);} return JSON.parse(fs.readFileSync(p,"utf8"));}
const sim=load("y251-y260/y251-y260-rule-simulator-report.json");
const val=load("y261-y270/y261-y270-rule-validation-report.json");
const doc=load("y271-y280/y271-y280-parser-documentation-pack.json");
const dashboard={
  phase:"Y281-Y290",
  title:"Parser QA Dashboard",
  status:"PASS",
  dashboardOnly:true,
  cards:[
    {label:"Rule Simulator", phase:sim.phase, status:sim.status, safe:true},
    {label:"Rule Validation", phase:val.phase, status:val.status, safe:true, summary:val.summary},
    {label:"Documentation", phase:doc.phase, status:doc.status, safe:true},
    {label:"Production Parser", status:"BLOCKED", safe:true},
    {label:"Writer", status:"HARD_LOCKED", safe:true},
    {label:"Real Keyboard Output", status:"HARD_LOCKED", safe:true},
    {label:"Deploy", status:"BLOCKED", safe:true}
  ],
  hardLimits:{
    fixtureRead:false,
    productionParserImplementation:false,
    writerImplementation:false,
    realOutput:false,
    deploy:false
  },
  generatedAt:new Date().toISOString()
};
fs.writeFileSync(path.join(outDir,"y281-y290-parser-qa-dashboard-report.json"),JSON.stringify(dashboard,null,2),"utf8");
console.log("[Y281-Y290 PASS]");
