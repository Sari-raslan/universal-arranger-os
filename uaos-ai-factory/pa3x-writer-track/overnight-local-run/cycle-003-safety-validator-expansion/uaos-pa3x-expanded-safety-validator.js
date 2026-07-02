import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const failures = [];
function walk(dir){ return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const f=path.join(dir,e.name); return e.isDirectory()?walk(f):[f];}); }
for (const file of walk(root)) {
  const rel = path.relative(root, file).replace(/\\/g,'/');
  const ext = path.extname(file).toLowerCase();
  if (rel.includes('owner-fixtures/')) failures.push(`fixture path found: ${rel}`);
  if (['.set','.sty','.prs','.kst'].includes(ext)) failures.push(`forbidden extension found: ${rel}`);
  if (['.md','.json'].includes(ext)) {
    const text = fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
    for (const pattern of [/copy to usb now/i,/load on pa3x now/i,/ready for pa3x/i,/keyboardReady\s*[:=]\s*true/i,/usbWriteApproved\s*[:=]\s*true/i,/keyboardLoadApproved\s*[:=]\s*true/i]) {
      if (pattern.test(text)) failures.push(`unsafe positive wording ${pattern} in ${rel}`);
    }
  }
}
const result = {status: failures.length ? 'FAIL' : 'PASS', checkedAt: new Date().toISOString(), failures};
fs.writeFileSync(path.join(here,'UAOS_PA3X_EXPANDED_SAFETY_VALIDATOR_RESULTS.json'), JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if (failures.length) process.exit(1);
