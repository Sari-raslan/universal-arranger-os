import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync, execFileSync } from 'child_process';
const PLATFORM='C:\\keyboard-manager-clean';
const V19ZIP=path.join(PLATFORM,'uaos-agent-factory','.runtime','artifacts','platform-v19-integrated-candidates','run-20260804-203745','UAOS-V19-EVIDENCE-20260804-203745.zip');
const V19SHA='9BE81C7227C566916BD7128B2CD2665A5B7F5016FF63039AC515953782960F16';
const CMD='C:\\Users\\ssare\\Desktop\\UAOS Commander';
const LATEST=path.join(PLATFORM,'uaos-reports','latest','LATEST-V20-REPORT-AR.md');
const CENTER="C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v20-review-builds\\run-20260804-213609\\review-center\\index.html";
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();}
console.log('UAOS V20 Cursor Leader');
if(process.platform!=='win32'){console.error('WINDOWS_REQUIRED');process.exit(2);}
if((process.env.COMPUTERNAME||'')!=='BOSS'){console.error('BOSS_REQUIRED');process.exit(2);}
if(sha(V19ZIP)!==V19SHA){console.error('V19_SHA_MISMATCH');process.exit(3);}
const head=spawnSync('git',['-C',CMD,'rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();
console.log('COMMANDER_BASELINE='+head);
console.log('NO_COMMIT NO_PUSH NO_MERGE');
try{execFileSync('cmd',['/c','start','',LATEST],{stdio:'ignore'});}catch{}
try{execFileSync('cmd',['/c','start','',CENTER],{stdio:'ignore'});}catch{}
console.log('LEADER_DONE');
