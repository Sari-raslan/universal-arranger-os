import fs from 'fs';
import path from 'path';
import os from 'os';

const roots = [
  path.join(os.homedir(), 'Desktop'),
  path.join(os.homedir(), 'Documents'),
  path.join(os.homedir(), 'Downloads'),
  'D:/','E:/','F:/'
];

const ignore = [
  'node_modules',
  'Program Files',
  'Program Files (x86)',
  'Windows',
  'AppData',
  'Native Instruments\\Guitar Rig',
  '$RECYCLE.BIN'
];

const keywords = [
  'kaman', 'kamanjat', 'kamnajat', 'violin', 'arabic violin',
  'arabic', 'oriental', 'strings', 'fayez', 'saidawi',
  'faycel', 'dede', 'juzi', 'maqam', 'quarter',
  'oud', 'ney', 'qanun', 'kanun'
];

const exts = ['.nki','.nkm','.nkb','.nkr','.nkc','.nicnt','.wav','.ncw','.aif','.aiff'];
const found = [];

function scoreFile(file){
  const p = file.toLowerCase();
  const matches = keywords.filter(k => p.includes(k));
  const ext = path.extname(file).toLowerCase();

  let score = matches.length * 10;
  if(['.nki','.nkm','.nicnt'].includes(ext)) score += 40;
  if(p.includes('samples')) score += 5;
  if(p.includes('kontakt')) score += 15;

  return { file, ext, score, matches };
}

function walk(dir, depth=0){
  if(depth > 8) return;
  if(ignore.some(x => dir.toLowerCase().includes(x.toLowerCase()))) return;

  let list;
  try { list = fs.readdirSync(dir); } catch { return; }

  for(const item of list){
    const full = path.join(dir,item);
    let st;
    try { st = fs.statSync(full); } catch { continue; }

    if(st.isDirectory()){
      walk(full, depth+1);
    } else {
      const ext = path.extname(full).toLowerCase();
      if(exts.includes(ext)){
        const r = scoreFile(full);
        if(r.score >= 20) found.push(r);
      }
    }
  }
}

for(const r of roots){
  if(fs.existsSync(r)) walk(r);
}

found.sort((a,b)=>b.score-a.score);

fs.writeFileSync('oriental-library-db.json', JSON.stringify(found,null,2));
fs.writeFileSync('oriental-library-report.txt',
  found.map(x => `${x.score} | ${x.ext} | ${x.matches.join(', ')} | ${x.file}`).join('\n')
);

console.log('FOUND:', found.length);
console.log('REPORT:', path.resolve('oriental-library-report.txt'));
