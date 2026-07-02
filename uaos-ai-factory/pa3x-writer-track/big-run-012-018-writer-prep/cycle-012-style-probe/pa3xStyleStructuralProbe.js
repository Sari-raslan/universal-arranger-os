import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const WINDOW_BYTES = 256;
const MAX_WINDOWS = 16;
const MAX_BYTES = 8192;

function offsets(size) {
  const values = [0,256,512,1024,2048,4096,6144,8192,12288,16384,32768,65536];
  if (size > WINDOW_BYTES) values.push(Math.max(0, Math.floor((size-WINDOW_BYTES)/2)));
  if (size > WINDOW_BYTES) values.push(Math.max(0, size-WINDOW_BYTES));
  return [...new Set(values.filter(v => v >= 0 && v < size))].slice(0, MAX_WINDOWS);
}
function readWindow(filePath, offset, size) {
  const len = Math.min(WINDOW_BYTES, Math.max(0, size-offset));
  const fd = fs.openSync(filePath, 'r');
  try { const b = Buffer.alloc(len); const n = fs.readSync(fd, b, 0, len, offset); return b.subarray(0,n); }
  finally { fs.closeSync(fd); }
}
function ascii(b) {
  let s=''; for (const x of b) s += (x===9||x===10||x===13||x>=32&&x<=126) ? String.fromCharCode(x) : '.';
  return s.replace(/\s+/g,' ').trim().slice(0,160);
}
function zregions(b, base) {
  const out=[]; let st=-1;
  for(let i=0;i<b.length;i++){ if(b[i]===0&&st<0) st=i; if((b[i]!==0||i===b.length-1)&&st>=0){ const end=(b[i]===0&&i===b.length-1)?i:i-1; const len=end-st+1; if(len>=4) out.push({startOffset:base+st,length:len}); st=-1; }}
  return out.slice(0,24);
}
function reps(b, base) {
  const out=[]; for(let i=0;i<=b.length-8;i++){ const a=b.subarray(i,i+4).toString('hex'); const c=b.subarray(i+4,i+8).toString('hex'); if(a===c){out.push({startOffset:base+i,patternHex:a,repeatedBytes:8}); i+=7;} }
  return out.slice(0,24);
}
function markers(b, base) {
  const txt=b.toString('latin1'); const names=['KORF','STY','PAD','PRF','GBL']; const out=[];
  for(const name of names){ let i=txt.indexOf(name); while(i!==-1){ out.push({marker:name,offset:base+i}); i=txt.indexOf(name,i+1); } }
  return out;
}
function fp(b){let z=0,p=0; const hist=new Array(16).fill(0); for(const x of b){ if(x===0)z++; if(x===9||x===10||x===13||x>=32&&x<=126)p++; hist[Math.floor(x/16)]++; } return {sha256:crypto.createHash('sha256').update(b).digest('hex'),first16Hex:b.subarray(0,Math.min(16,b.length)).toString('hex'),zeroRatio:b.length?Number((z/b.length).toFixed(4)):0,printableRatio:b.length?Number((p/b.length).toFixed(4)):0,histogram16:hist};}
export function probeTargets({fixtureRoot, targets}) {
  return targets.map(t => {
    const full = path.join(fixtureRoot, ...t.relativePath.split('/'));
    const st = fs.statSync(full);
    const wins = offsets(st.size).map(off => { const b=readWindow(full,off,st.size); const zr=zregions(b,off), rp=reps(b,off), mk=markers(b,off); return {offset:off,bytesRead:b.length,first32Hex:b.subarray(0,Math.min(32,b.length)).toString('hex'),asciiSnippet:ascii(b),zeroRegions:zr,repeatedBytePatterns:rp,markerHits:mk,structuralFingerprint:fp(b),possibleBoundary:off===0||zr.some(r=>r.length>=16)||rp.length>0||mk.length>0}; });
    const bytes = wins.reduce((s,w)=>s+w.bytesRead,0);
    const boundaries = [...new Set(wins.filter(w=>w.possibleBoundary).map(w=>w.offset))].sort((a,b)=>a-b);
    return {relativePath:t.relativePath,extension:t.extension,sizeBytes:st.size,bytesReadTotalAcrossWindows:bytes,withinReadLimit:bytes<=MAX_BYTES,windowsRead:wins.length,selectedOffsetWindows:wins,possibleHeaderRegion:{startOffset:0,length:WINDOW_BYTES,confidence:'medium'},possibleSectionLikeBoundariesByOffsetOnly:boundaries,repeatedRegionCandidates:wins.flatMap(w=>w.repeatedBytePatterns).slice(0,64),zeroFilledRegions:wins.flatMap(w=>w.zeroRegions).slice(0,64),candidateRegions:boundaries.map((start,i)=>({startOffset:start,length:(boundaries[i+1]??Math.min(st.size,start+WINDOW_BYTES))-start,label:start===0?'fileHeader':'candidateSectionRegion',confidence:start===0?'medium':'low',decodedValue:false,musicalMeaning:false})),unknownRegions:[{startOffset:bytes,length:Math.max(0,st.size-bytes),note:'Non-contiguous fixed windows only; remaining bytes unknown.'}],confidenceLevel:boundaries.length>1?'low-medium':'low',noValueDecoding:true,noMusicalMeaning:true,noKeyboardOutput:true};
  });
}
