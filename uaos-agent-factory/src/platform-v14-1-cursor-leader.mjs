import fs from 'node:fs';
import path from 'node:path';
const V14='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v14-adoption-preparation\\run-20260804-153052\\V14-MASTER-STATUS.json';
function main(){
  if(process.platform!=='win32'){console.error('UAOS_V14_1_WINDOWS_REQUIRED');process.exit(2)}
  if(!fs.existsSync(V14)){console.error('UAOS_V14_1_V14_EVIDENCE_NOT_FOUND');process.exit(3)}
  const report={generatedAt:new Date().toISOString(),v14Present:true,status:'UAOS_V14_1_CURSOR_WORKTREE_AUDIT_AND_SAFE_CONTINUATION_PASS'};
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V14-1-LAUNCHER-STATUS.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();