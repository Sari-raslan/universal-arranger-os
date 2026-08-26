'use strict';
/**
 * UAOS V19 Cursor Leader — verifies baselines, opens Arabic report + review launchers.
 * Does NOT commit/push/merge. CHAT_ONLY Commander. Local Windows BOSS only.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLATFORM = 'C:\\keyboard-manager-clean';
const ARTIFACTS_ROOT = path.join(PLATFORM, 'uaos-agent-factory', '.runtime', 'artifacts', 'platform-v19-integrated-candidates');
const V18_ZIP = path.join(PLATFORM, 'uaos-agent-factory', '.runtime', 'artifacts', 'platform-v18-content-format-editing-core', 'run-20260804-195859', 'UAOS-V18-EVIDENCE-20260804-195859.zip');
const V18_SHA = 'EDB940C8747D4C486CCED8464D1DFEBA19062059CEC255F8A1B2A4C8E405A99D';
const CMD_REPO = 'C:\\Users\\ssare\\Desktop\\UAOS Commander';
const CMD_BASELINE = '9b23824f1cb14fdb611d4cfdee0b3e09a7442939';
const LATEST_AR = path.join(PLATFORM, 'uaos-reports', 'latest', 'LATEST-V19-REPORT-AR.md');

function sha256File(p) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(p));
  return h.digest('hex').toUpperCase();
}

function git(cwd, args) {
  const r = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
  return { code: r.status ?? 1, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

function main() {
  console.log('UAOS V19 Cursor Leader');
  if (process.platform !== 'win32') {
    console.error('UAOS_V19_WINDOWS_REQUIRED');
    process.exit(2);
  }
  const host = process.env.COMPUTERNAME || '';
  console.log('HOST=' + host);

  if (!fs.existsSync(V18_ZIP)) {
    console.error('V18_EVIDENCE_MISSING');
    process.exit(3);
  }
  const sha = sha256File(V18_ZIP);
  if (sha !== V18_SHA) {
    console.error('V18_SHA_MISMATCH expected=' + V18_SHA + ' actual=' + sha);
    process.exit(4);
  }
  console.log('V18_SHA_OK');

  const cmdHead = git(CMD_REPO, ['rev-parse', 'HEAD']).out;
  console.log('COMMANDER_HEAD=' + cmdHead);
  console.log('COMMANDER_BASELINE=' + CMD_BASELINE);
  if (cmdHead !== CMD_BASELINE) {
    const anc = git(CMD_REPO, ['merge-base', '--is-ancestor', CMD_BASELINE, 'HEAD']);
    console.log('COMMANDER_DRIFT_CLASS=' + (anc.code === 0 ? 'LEGITIMATE_CONCURRENT_COMMIT' : 'UNVERIFIED_CONCURRENT_COMMIT'));
  } else {
    console.log('COMMANDER_BASELINE_MATCH');
  }

  for (const [name, p] of [
    ['PLATFORM', PLATFORM],
    ['SINGY', path.join(PLATFORM, 'uaos-worktrees', 'uaos-singy-final-product')],
    ['ARRANGER', path.join(PLATFORM, 'uaos-real-product')],
    ['COMMANDER', CMD_REPO]
  ]) {
    const h = git(p, ['rev-parse', 'HEAD']);
    console.log(`${name}_HEAD=${h.out} ok=${h.code === 0}`);
  }

  // Find latest run
  let latest = null;
  if (fs.existsSync(ARTIFACTS_ROOT)) {
    const runs = fs.readdirSync(ARTIFACTS_ROOT).filter((n) => n.startsWith('run-')).sort();
    if (runs.length) latest = path.join(ARTIFACTS_ROOT, runs[runs.length - 1]);
  }
  console.log('LATEST_RUN=' + (latest || 'NONE'));

  if (fs.existsSync(LATEST_AR)) {
    try { execFileSync('cmd', ['/c', 'start', '', LATEST_AR], { stdio: 'ignore' }); } catch {}
  } else if (latest) {
    const ar = path.join(latest, 'V19-FINAL-REPORT-AR.md');
    if (fs.existsSync(ar)) {
      try { execFileSync('cmd', ['/c', 'start', '', ar], { stdio: 'ignore' }); } catch {}
    }
  }

  const desk = path.join(process.env.USERPROFILE || '', 'Desktop');
  for (const name of [
    'UAOS V19 Library Factory Review.lnk',
    'UAOS V19 Keyboard Pro Review.lnk',
    'UAOS V19 Creator Runtime Review.lnk',
    'UAOS V19 Studio Pro Runtime Review.lnk'
  ]) {
    const lnk = path.join(desk, name);
    console.log('LAUNCHER=' + name + ' exists=' + fs.existsSync(lnk));
  }

  console.log('NO_COMMIT NO_PUSH NO_MERGE');
  console.log('LEADER_DONE');
}

main();
