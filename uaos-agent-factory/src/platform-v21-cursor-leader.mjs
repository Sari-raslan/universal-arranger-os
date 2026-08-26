import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync, execFileSync } from 'child_process';
const PLATFORM='C:\\keyboard-manager-clean';
const V20ZIP=path.join(PLATFORM,'uaos-agent-factory','.runtime','artifacts','platform-v20-review-builds','run-20260804-213609','UAOS-V20-EVIDENCE-20260804-213609.zip');
const V20SHA='D60417AA6C7E1B9F5B774E766769441EEB6940AB9F4CEF828046C4D170101E7A';
const CENTER="C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v21-execution\\review-center-hardening\\index.html";
const LATEST=path.join(PLATFORM,'uaos-reports','latest','LATEST-V21-REPORT-AR.md');
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();}
console.log('UAOS V21 Cursor Leader');
if(process.platform!=='win32'){console.error('WINDOWS_REQUIRED');process.exit(2);}
if((process.env.COMPUTERNAME||'')!=='BOSS'){console.error('BOSS_REQUIRED');process.exit(2);}
if(sha(V20ZIP)!==V20SHA){console.error('V20_SHA_MISMATCH');process.exit(3);}
console.log('NO_COMMIT NO_PUSH NO_MERGE');
try{execFileSync('cmd',['/c','start','',LATEST],{stdio:'ignore'});}catch{}
try{execFileSync('cmd',['/c','start','',CENTER],{stdio:'ignore'});}catch{}
console.log('LEADER_DONE');
