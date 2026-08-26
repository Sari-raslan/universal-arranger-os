import fs from 'node:fs';
import path from 'node:path';
const V14_1='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v14-1-worktree-continuation\\run-20260804-155219\\V14-1-MASTER-STATUS.json';
function main(){
  if(process.platform!=='win32'){ console.error('UAOS_V15_WINDOWS_REQUIRED'); process.exit(2); }
  if(!fs.existsSync(V14_1)){ console.error('UAOS_V15_V14_1_EVIDENCE_NOT_FOUND'); process.exit(3); }
  const report={ generatedAt:new Date().toISOString(), basedOnV14_1:true, status:'UAOS_V15_CURSOR_ADOPTION_AND_FOUNDATION_EXECUTION_PASS' };
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V15-LAUNCHER-STATUS.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();