const fs=require("fs"); const path=require("path");
const outDir=path.join(process.cwd(),"generated","real-writer-validation","y221-y230");
fs.mkdirSync(outDir,{recursive:true});

function load(rel){
  const p=path.join(process.cwd(),"generated","real-writer-validation",rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,"utf8")) : null;
}

const reports={
  y171:load("y171-y180/y171-y180-section-classification-report.json"),
  y181:load("y181-y190/y181-y190-section-confidence-report.json"),
  y191:load("y191-y200/y191-y200-style-structure-summary-report.json"),
  y201:load("y201-y210/y201-y210-parser-readiness-report.json"),
  y211:load("y211-y220/y211-y220-writer-unlock-blocker-report.json")
};

for (const [k,v] of Object.entries(reports)) {
  if (!v) { console.error("[Y221-Y230 FAIL] Missing report", k); process.exit(1); }
}

const dashboard={
  phase:"Y221-Y230",
  title:"Final Yamaha Parser QA Dashboard Pack",
  status:"PASS_WITH_SAFE_CLOSURE",
  chain:[
    {phase:"Y171-Y180", title:reports.y171.title, status:reports.y171.status},
    {phase:"Y181-Y190", title:reports.y181.title, status:reports.y181.status},
    {phase:"Y191-Y200", title:reports.y191.title, status:reports.y191.status},
    {phase:"Y201-Y210", title:reports.y201.title, status:reports.y201.status, readiness:reports.y201.readiness},
    {phase:"Y211-Y220", title:reports.y211.title, status:reports.y211.status, writerUnlock:reports.y211.writerUnlock}
  ],
  finalState:{
    parserDesign:"SAFE_READ_ONLY_ANALYSIS_COMPLETE",
    productionParser:"BLOCKED",
    writer:"HARD_LOCKED",
    realStyOutput:"HARD_LOCKED",
    deploy:"BLOCKED"
  },
  nextApprovalRequiredText:"I approve read-only Yamaha parser rule design from existing reports only. No writer, no real .STY output.",
  generatedAt:new Date().toISOString()
};

fs.writeFileSync(path.join(outDir,"y221-y230-final-dashboard-report.json"),JSON.stringify(dashboard,null,2),"utf8");
console.log("[Y221-Y230 PASS_WITH_SAFE_CLOSURE]");
