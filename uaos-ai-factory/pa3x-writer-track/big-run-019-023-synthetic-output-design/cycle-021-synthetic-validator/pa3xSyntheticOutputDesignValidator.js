import fs from 'node:fs';
import path from 'node:path';

const outputRoot = 'E:/keyboard-manager-clean/uaos-ai-factory/pa3x-writer-track/big-run-019-023-synthetic-output-design';
const fixtureRoot = 'E:/keyboard-manager-clean/uaos-ai-factory/pa3x-writer-track/owner-fixtures'.replaceAll('\\','/').toLowerCase();
const nativeExts = new Set(['.set','.sty','.prs','.prf','.kst']);
const forbiddenPositiveClaims = [
  'pa3x' + '-ready',
  'load this ' + 'to keyboard',
  'load ' + 'to keyboard now',
  'copy ' + 'to usb',
  'write ' + 'to usb',
  'transfer ' + 'to keyboard',
  'proprietary sample ' + 'copy',
  'sample extraction ' + 'completed'
];
function walk(dir){ const out=[]; for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); if(e.isDirectory()) out.push(...walk(p)); else out.push(p); } return out; }
const files = walk(outputRoot);
const nativeFiles = files.filter(f => nativeExts.has(path.extname(f).toLowerCase()));
const fixtureWrites = files.filter(f => f.replaceAll('\\','/').toLowerCase().startsWith(fixtureRoot));
const claimHits=[];
for(const f of files){
  const rel = path.relative(outputRoot, f).replaceAll('\\','/');
  if(rel.startsWith('cycle-021-synthetic-validator/')) continue;
  if(!['.md','.json','.txt'].includes(path.extname(f).toLowerCase())) continue;
  const text = fs.readFileSync(f,'utf8').toLowerCase();
  for(const phrase of forbiddenPositiveClaims){ if(text.includes(phrase)) claimHits.push({file:rel, phrase}); }
}
const status = nativeFiles.length===0 && fixtureWrites.length===0 && claimHits.length===0 ? 'PASS' : 'BLOCKED';
const result = {generatedAt:new Date().toISOString(), status, filesChecked:files.length, scanNote:'validator implementation files excluded from claim scan', nativeKeyboardFiles:nativeFiles.map(f=>path.relative(outputRoot,f).replaceAll('\\','/')), fixtureWrites, claimHits, noKeyboardOutput: nativeFiles.length===0, noUsbWriteInstruction: claimHits.filter(h=>h.phrase.includes('usb')).length===0};
fs.writeFileSync(`${outputRoot}/cycle-021-synthetic-validator/UAOS_PA3X_SYNTHETIC_VALIDATOR_RESULTS_021.json`, JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(`${outputRoot}/cycle-021-synthetic-validator/UAOS_PA3X_SYNTHETIC_VALIDATOR_REPORT_021.md`, ['# UAOS PA3X Synthetic Validator Report 021','',`Status: ${status}`,`Files checked: ${files.length}`,`Native keyboard files: ${nativeFiles.length}`,`Fixture writes: ${fixtureWrites.length}`,`Forbidden positive claim hits: ${claimHits.length}`,'','Validator implementation files are excluded from positive-claim body scanning so the rule list does not self-trigger.'].join('\n')+'\n');
console.log(JSON.stringify(result,null,2));
if(status !== 'PASS') process.exit(1);
