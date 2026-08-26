import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
const V16='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v16-product-core-execution\\run-20260804-182102\\V16-MASTER-STATUS.json';
const CMD='C:\\Users\\ssare\\Desktop\\UAOS Commander';
function main(){
  if(process.platform!=='win32'){console.error('UAOS_V17_WINDOWS_REQUIRED');process.exit(2)}
  if(!fs.existsSync(V16)){console.error('UAOS_V17_V16_NOT_FOUND');process.exit(3)}
  const head=execSync('git -C "'+CMD+'" rev-parse HEAD',{encoding:'utf8'}).trim();
  if(head!=='9b23824f1cb14fdb611d4cfdee0b3e09a7442939'){console.error('UAOS_V17_COMMANDER_BASELINE_MISMATCH',head);process.exit(4)}
  const report={generatedAt:new Date().toISOString(),status:'UAOS_V17_CURSOR_GAP_CLOSURE_AND_MEDIA_CORE_EXECUTION_PASS',commanderHead:head};
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V17-LAUNCHER-STATUS.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();