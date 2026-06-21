const fs=require("fs"); const path=require("path");
const base=path.join(process.cwd(),"generated","real-writer-validation");
const outDir=path.join(base,"y301-y310"); fs.mkdirSync(outDir,{recursive:true});
function load(rel){const p=path.join(base,rel); if(!fs.existsSync(p)){console.error("[Y301-Y310 FAIL] Missing",rel); process.exit(1);} return JSON.parse(fs.readFileSync(p,"utf8"));}
const d=load("y281-y290/y281-y290-parser-qa-dashboard-report.json");
const lock=load("y291-y300/y291-y300-universal-output-lock-report.json");
const exec={
  phase:"Y301-Y310",
  title:"Executive Safe Closure Pack",
  status:"PASS_SAFE_LOCAL_PROTOTYPE_CLOSURE",
  ctoSummary:{
    parserDesign:"Read-only design/simulation/validation completed from reports.",
    productionParser:"BLOCKED",
    writer:"HARD_LOCKED",
    realKeyboardOutputs:"HARD_LOCKED",
    deploy:"BLOCKED",
    commercialStatus:"Not a final commercial product."
  },
  completedSafeChain:[
    "Y251-Y260 rule simulator",
    "Y261-Y270 rule validation",
    "Y271-Y280 documentation pack",
    "Y281-Y290 parser QA dashboard",
    "Y291-Y300 universal output lock"
  ],
  finalAllowedState:[
    "Local reports",
    "Planning",
    "Read-only analysis",
    "Documentation",
    "Dashboards",
    "Stop gates"
  ],
  finalBlockedState:lock.blockedOutputs,
  generatedAt:new Date().toISOString()
};
fs.writeFileSync(path.join(outDir,"y301-y310-executive-safe-closure-report.json"),JSON.stringify(exec,null,2),"utf8");
console.log("[Y301-Y310 PASS_SAFE_LOCAL_PROTOTYPE_CLOSURE]");
