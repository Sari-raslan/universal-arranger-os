const fs=require("fs"); const path=require("path");
const base=path.join(process.cwd(),"generated","real-writer-validation");
const outDir=path.join(base,"y271-y280"); fs.mkdirSync(outDir,{recursive:true});
function load(rel){const p=path.join(base,rel); if(!fs.existsSync(p)){console.error("[Y271-Y280 FAIL] Missing",rel); process.exit(1);} return JSON.parse(fs.readFileSync(p,"utf8"));}
const val=load("y261-y270/y261-y270-rule-validation-report.json");
const block=load("y211-y220/y211-y220-writer-unlock-blocker-report.json");
const doc={
  phase:"Y271-Y280",
  title:"Yamaha Parser Documentation Pack",
  status:"PASS",
  documentOnly:true,
  sections:[
    {title:"Scope", body:"Safe read-only Yamaha parser design documentation. No production parser, no writer, no real output."},
    {title:"Inputs", body:"Existing reports under generated/real-writer-validation only."},
    {title:"Rule Simulator", body:"Y251-Y260 produced simulation-only outputs."},
    {title:"Rule Validation", body:`Y261-Y270 summary total=${val.summary.total}, good=${val.summary.good}, weak=${val.summary.weak}, none=${val.summary.none}.`},
    {title:"Writer Lock", body:"Writer remains HARD_LOCKED. Real .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST outputs remain blocked."},
    {title:"Next Safe Work", body:"More documentation, dashboards, and stop gates only unless new explicit approval is provided."}
  ],
  writerUnlock:block.writerUnlock,
  hardLimits:{
    fixtureRead:false,
    productionParserImplementation:false,
    writerImplementation:false,
    realOutput:false,
    deploy:false
  },
  generatedAt:new Date().toISOString()
};
fs.writeFileSync(path.join(outDir,"y271-y280-parser-documentation-pack.json"),JSON.stringify(doc,null,2),"utf8");
fs.writeFileSync(path.join(outDir,"YAMAHA_PARSER_SAFE_DOCUMENTATION.md"),"# UAOS Yamaha Parser Safe Documentation\n\nThis pack is documentation-only.\n\nNo production parser.\nNo writer.\nNo real keyboard output.\nNo deploy.\n","utf8");
console.log("[Y271-Y280 PASS]");
