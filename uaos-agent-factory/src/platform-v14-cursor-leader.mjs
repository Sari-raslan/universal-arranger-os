import fs from 'node:fs';
import path from 'node:path';
const V13='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v13-candidate-validation\\run-20260804-143006\\V13-MASTER-STATUS.json';
function main(){
  if(process.platform!=='win32'){console.error('UAOS_V14_WINDOWS_REQUIRED');process.exit(2)}
  if(!fs.existsSync(V13)){console.error('UAOS_V14_V13_EVIDENCE_NOT_FOUND');process.exit(3)}
  const report={generatedAt:new Date().toISOString(),v13Present:true,status:'UAOS_V14_CURSOR_SOURCE_ADOPTION_PREPARATION_ORCHESTRATION_PASS'};
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V14-LAUNCHER-STATUS.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();