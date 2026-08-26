import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const REPOS = [
  { key: 'PLATFORM', path: 'C:\\keyboard-manager-clean', useHead: true },
  { key: 'SINGY', path: 'C:\\keyboard-manager-clean\\uaos-worktrees\\uaos-singy-final-product', preferred: '01f792417da3b782abb0b2394e8eebda0472bde2' },
  { key: 'ARRANGER_LIBRARY', path: 'C:\\keyboard-manager-clean\\uaos-real-product', preferred: '882f6ca695b4c8df6f0f9968b65b5710d0c55346' },
  { key: 'COMMANDER', path: 'C:\\Users\\ssare\\Desktop\\UAOS Commander', preferred: '6cde73d', scope: 'COMMANDER_ONLY' }
];
function git(cwd, args) { return spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }); }
function main() {
  if (process.platform !== 'win32') { console.error('UAOS_V11_1_WINDOWS_REQUIRED'); process.exit(2); }
  const report = { generatedAt: new Date().toISOString(), repos: [], sixCde73dOutsideCommander: false };
  let ok = true;
  for (const r of REPOS) {
    const entry = { key: r.key, path: r.path, exists: fs.existsSync(r.path), baselineOk: false, scope: r.scope || null };
    if (!entry.exists) { ok = false; report.repos.push(entry); continue; }
    const pref = r.useHead ? String(git(r.path, ['rev-parse', 'HEAD']).stdout || '').trim() : r.preferred;
    const t = git(r.path, ['cat-file', '-t', pref]);
    entry.preferredOrHead = pref;
    entry.baselineOk = t.status === 0 && String(t.stdout).trim() === 'commit';
    entry.head = String(git(r.path, ['rev-parse', 'HEAD']).stdout || '').trim();
    entry.branch = String(git(r.path, ['branch', '--show-current']).stdout || '').trim();
    if (!entry.baselineOk) ok = false;
    report.repos.push(entry);
  }
  report.coordinatorStatus = ok ? 'UAOS_V11_1_MULTI_REPOSITORY_BASELINE_ORCHESTRATION_PASS' : 'UAOS_V11_1_REPOSITORY_BASELINE_AMBIGUOUS';
  const outDir = 'C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'LATEST-V11-1-LAUNCHER-STATUS.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(ok ? 0 : 3);
}
main();