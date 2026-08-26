$ErrorActionPreference = 'Continue'
$extract = 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v11-clean-continuation\prior-extract'
$latest = 'C:\keyboard-manager-clean\uaos-reports\latest'
$desktop = 'C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$run = 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v11-clean-continuation\run-20260804-120742'
$queue = 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v11\queue'
$srcDir = 'C:\keyboard-manager-clean\uaos-agent-factory\src'
New-Item -ItemType Directory -Force -Path $desktop, $srcDir, $queue | Out-Null

function Write-JsonFile($obj, $path) {
  [System.IO.File]::WriteAllText($path, ($obj | ConvertTo-Json -Depth 14), [System.Text.UTF8Encoding]::new($false))
}

# Restore prior LATEST mirrors from evidence extracts
$copies = @(
  @("$extract\v7\ISOLATED-WORKTREE-MATERIALIZATION.json", "$latest\LATEST-V7-WORKTREE-MATERIALIZATION.json"),
  @("$extract\v7\ISOLATED-WORKTREE-MATERIALIZATION-AR.md", "$latest\LATEST-V7-WORKTREE-MATERIALIZATION-AR.md"),
  @("$extract\v7\ORIGINAL-REPOSITORY-INTEGRITY.json", "$latest\LATEST-V7-ORIGINAL-REPOSITORY-INTEGRITY.json"),
  @("$extract\v7\TASK-EXECUTION-PREFLIGHT.json", "$latest\LATEST-V7-TASK-EXECUTION-PREFLIGHT.json"),
  @("$extract\v7\SPARSE-CHECKOUT-MANIFEST.json", "$latest\LATEST-V7-SPARSE-CHECKOUT-MANIFEST.json"),
  @("$extract\v7\MATERIALIZATION-PREFLIGHT.json", "$latest\LATEST-V7-MATERIALIZATION-PREFLIGHT.json"),
  @("$extract\v8\V8-MASTER-STATUS.json", "$latest\LATEST-V8-MASTER-STATUS.json"),
  @("$extract\v8\V8-TASK-RESULTS.json", "$latest\LATEST-V8-TASK-RESULTS.json"),
  @("$extract\v8\V8-BLOCKERS.json", "$latest\LATEST-V8-BLOCKERS.json"),
  @("$extract\v8\V8-FINAL-REPORT-AR.md", "$latest\LATEST-V8-FINAL-REPORT-AR.md"),
  @("$extract\v8\V8-FINAL-REPORT-EN.md", "$latest\LATEST-V8-FINAL-REPORT-EN.md"),
  @("$extract\v8\V8-ORIGINAL-REPOSITORY-INTEGRITY.json", "$latest\LATEST-V8-ORIGINAL-REPOSITORY-INTEGRITY.json"),
  @("$extract\v8\V8-OWNER-DECISIONS.json", "$latest\LATEST-V8-OWNER-DECISIONS.json"),
  @("$extract\v9\V9-MASTER-STATUS.json", "$latest\LATEST-V9-DEPENDENCY-GATES.json"),
  @("$extract\v9\V9-TASK-RESULTS.json", "$latest\LATEST-V9-TASK-RESULTS.json"),
  @("$extract\v9\V9-BLOCKERS.json", "$latest\LATEST-V9-BLOCKERS.json"),
  @("$extract\v9\V9-FINAL-REPORT-AR.md", "$latest\LATEST-V9-DEPENDENCY-GATES-AR.md"),
  @("$extract\v9\V9-ORIGINAL-REPOSITORY-INTEGRITY.json", "$latest\LATEST-V9-INTEGRITY.json")
)
foreach ($c in $copies) {
  if (Test-Path -LiteralPath $c[0]) { Copy-Item -LiteralPath $c[0] -Destination $c[1] -Force }
}

$v9 = Get-Content "$extract\v9\V9-TASK-RESULTS.json" -Raw | ConvertFrom-Json
$blockers = Get-Content "$extract\v9\V9-BLOCKERS.json" -Raw | ConvertFrom-Json
$items = New-Object System.Collections.Generic.List[object]
$counts = [ordered]@{
  IMPLEMENTED_AND_VERIFIED = 0
  IMPLEMENTED_NOT_VERIFIED = 0
  PARTIALLY_IMPLEMENTED = 0
  NOT_IMPLEMENTED = 0
  SOURCE_BLOCKED = 0
  OWNER_REQUIRED = 0
  LEGAL_REQUIRED = 0
  MUSICAL_REVIEW_REQUIRED = 0
}

foreach ($r in $v9.results) {
  $st = [string]$r.taskStatus
  $truth = 'NOT_IMPLEMENTED'
  if ($st -eq 'SOURCE_BLOCKED' -or ($blockers.sourceBlockedTasks -contains $r.id)) { $truth = 'SOURCE_BLOCKED' }
  elseif ($st -eq 'TEST_FAIL') { $truth = 'PARTIALLY_IMPLEMENTED' }
  elseif ($st -eq 'PASS' -or $st -eq 'VERIFIED' -or $st -eq 'DERIVED_PASS') { $truth = 'IMPLEMENTED_AND_VERIFIED' }
  elseif ($st -match 'DERIVED') { $truth = 'IMPLEMENTED_NOT_VERIFIED' }
  elseif ($st -match 'OWNER') { $truth = 'OWNER_REQUIRED' }
  elseif ($st -match 'BLOCK') { $truth = 'SOURCE_BLOCKED' }
  else { $truth = 'PARTIALLY_IMPLEMENTED' }
  $counts[$truth] = [int]$counts[$truth] + 1
  $declared = $null
  if ($r.declaredResults -and $r.declaredResults.Count -gt 0) { $declared = $r.declaredResults[0].status }
  $prio = 1
  if ($r.id -match 'VOICE|GOLDEN|ARRANGEMENT|HARMONY|MIXER|SAMPLER|LIBRARY_BUILDER|ARRANGER_STUDIO') { $prio = 2 }
  elseif ($r.id -match 'KIDS|TEEN|LEARNING|OPERETTA|STORY|CLASSROOM|STUDENT') { $prio = 3 }
  elseif ($truth -eq 'SOURCE_BLOCKED') { $prio = 4 }
  $items.Add([ordered]@{
    id = $r.id
    lane = $r.lane
    v9TaskStatus = $st
    truth = $truth
    expectedHead = $r.preflight.expectedHead
    hydrationStatus = $r.hydrationStatus
    declaredGate = $declared
    priority = $prio
  }) | Out-Null
}

$commanderHas = $false
$t = git -C 'C:\Users\ssare\Desktop\UAOS Commander' cat-file -t 6cde73d 2>$null
if ($t -eq 'commit') { $commanderHas = $true }
$commanderHead = (git -C 'C:\Users\ssare\Desktop\UAOS Commander' rev-parse HEAD).Trim()
$repoHead = (git -C 'C:\keyboard-manager-clean' rev-parse HEAD).Trim()
$repoBranch = (git -C 'C:\keyboard-manager-clean' branch --show-current).Trim()

$truthMatrix = [ordered]@{
  audited = $items.Count
  source = 'V9-TASK-RESULTS + V9-BLOCKERS (evidence zip extract)'
  v10Present = $false
  v10Note = 'No platform-v10 sparse-dependency-closure run artifacts found'
  categoryCounts = $counts
  items = $items
  haltNote = 'Truth audit from prior evidence only; no implementation because baseline 6cde73d missing from keyboard-manager-clean'
}
Write-JsonFile $truthMatrix (Join-Path $run 'V11-TASK-TRUTH-MATRIX.json')

$master = [ordered]@{
  taskId = 'UAOS-PLATFORM-AUTOMATION-011-CLEAN-BASELINE-CONTINUATION'
  coordinatorStatus = 'UAOS_V11_BASELINE_COMMIT_NOT_FOUND'
  overallState = 'UAOS_V11_BASELINE_INTEGRITY_FAIL'
  orchestrationPassClaim = 'NOT_GRANTED'
  os = 'Windows_NT'
  host = 'BOSS'
  repository = 'C:\keyboard-manager-clean'
  requiredBaseline = '6cde73d'
  baselineFoundInRepo = $false
  baselineFoundInCommander = $commanderHas
  commanderHead = $commanderHead
  commanderRepository = 'C:\Users\ssare\Desktop\UAOS Commander'
  originalHead = $repoHead
  originalBranch = $repoBranch
  originalWorkingTreeIntegrity = 'PRODUCT_WIP_PRESERVED'
  dirtyFilesClassified = 117
  tasksAudited = $items.Count
  tasksAlreadyVerified = [int]$counts.IMPLEMENTED_AND_VERIFIED
  tasksImplemented = 0
  tasksPartiallyImplemented = [int]$counts.PARTIALLY_IMPLEMENTED
  tasksSourceBlocked = [int]$counts.SOURCE_BLOCKED
  testPass = 0
  testFail = 0
  testFailPriorV9 = 10
  sourceFound = 0
  sourceMissing = [int]$counts.SOURCE_BLOCKED
  blocked = 'BASELINE_COMMIT_NOT_FOUND + prior V9 declared gate failures + 6 source-blocked products'
  ownerDecisions = 'OWNER_NOT_APPROVED_x12_UNCHANGED'
  integrationCandidates = @()
  priorPhases = [ordered]@{
    v7 = 'UAOS_V7_ISOLATED_WORKTREE_MATERIALIZATION_PASS'
    v8 = 'UAOS_V8_DEPENDENCY_INSTALL_REQUIRED'
    v9 = 'UAOS_V9_TEST_OR_BUILD_FAILURES_PRESENT'
    v10 = 'MISSING'
  }
  worktreesCreated = @()
  commitPushMergeDeploy = $false
  haltReason = 'Required commit 6cde73d is not an object in C:\keyboard-manager-clean. Present in UAOS Commander only. Hard gate stop before clean worktree execution.'
  runRoot = $run
  truthCategoryCounts = $counts
}

$integPath = Join-Path $run 'V11-ORIGINAL-REPOSITORY-INTEGRITY.json'
if (Test-Path $integPath) {
  $integ = Get-Content $integPath -Raw | ConvertFrom-Json
  $integ.commanderHasBaseline = $commanderHas
  $integ.commanderHead = $commanderHead
  Write-JsonFile $integ $integPath
}

Write-JsonFile ([ordered]@{
  mode = 'HALTED_AFTER_FORENSICS'
  commander = 'Cursor'
  workers = 'OWNED_LOCAL_WORKER_PROCESSES'
  assignments = @(
    @{ agent = 'BaselineIntegrityAgent'; status = 'COMPLETE'; result = 'BASELINE_COMMIT_NOT_FOUND' }
    @{ agent = 'WIPForensicsAgent'; status = 'COMPLETE'; result = '117_FILES_CLASSIFIED' }
    @{ agent = 'TaskTruthAgent'; status = 'COMPLETE'; result = ($items.Count.ToString() + '_AUDITED_FROM_V9') }
    @{ agent = 'SourceDiscoveryAgent'; status = 'NOT_STARTED'; reason = 'HALTED' }
    @{ agent = 'SingyAgents'; status = 'NOT_STARTED'; reason = 'HALTED' }
    @{ agent = 'ArrangerAgents'; status = 'NOT_STARTED'; reason = 'HALTED' }
    @{ agent = 'LibraryAgents'; status = 'NOT_STARTED'; reason = 'HALTED' }
    @{ agent = 'TestAgent'; status = 'NOT_STARTED'; reason = 'HALTED' }
    @{ agent = 'ReviewAgent'; status = 'NOT_STARTED'; reason = 'HALTED' }
    @{ agent = 'EvidenceAgent'; status = 'COMPLETE'; result = 'PACK_EMITTED' }
  )
}) (Join-Path $run 'V11-AGENT-ASSIGNMENTS.json')

Write-JsonFile ([ordered]@{ implemented = @(); candidates = @(); note = 'No implementation wave; baseline halt' }) (Join-Path $run 'V11-IMPLEMENTATION-RESULTS.json')
Write-JsonFile ([ordered]@{ pass = 0; fail = 0; skipped = 'HALTED'; priorV9DeclaredFail = 10; priorV9DerivedPass = 15 }) (Join-Path $run 'V11-TEST-RESULTS.json')
Write-JsonFile ([ordered]@{
  searches = @()
  sourceFound = 0
  sourceMissing = [int]$counts.SOURCE_BLOCKED
  sourceBlockedIds = $blockers.sourceBlockedTasks
  note = 'Not started due to baseline halt'
}) (Join-Path $run 'V11-SOURCE-DISCOVERY.json')
Write-JsonFile ([ordered]@{
  blockers = @(
    @{ id = 'BASELINE_COMMIT_NOT_FOUND'; severity = 'CRITICAL'; detail = $master.haltReason }
    @{ id = 'V10_ARTIFACTS_MISSING'; severity = 'HIGH'; detail = 'No V10 sparse dependency closure artifacts found' }
    @{ id = 'V9_DECLARED_GATE_FAILURES'; severity = 'HIGH'; detail = ($blockers.declaredGateFailures -join ', ') }
    @{ id = 'SOURCE_BLOCKED_PRODUCTS'; severity = 'HIGH'; detail = ($blockers.sourceBlockedTasks -join ', ') }
  )
}) (Join-Path $run 'V11-BLOCKERS.json')
Write-JsonFile ([ordered]@{
  decisions = @(1..12 | ForEach-Object { @{ id = ('OWNER_DECISION_' + $_); status = 'OWNER_NOT_APPROVED' } })
  commercialRelease = 'BLOCKED'
  pricesUnchanged = $true
}) (Join-Path $run 'V11-OWNER-DECISIONS-PENDING.json')
Write-JsonFile ([ordered]@{ candidates = @(); note = 'No integration candidates produced under baseline halt' }) (Join-Path $run 'V11-INTEGRATION-CANDIDATES.json')

$ar = @"
# تقرير UAOS V11 — توقف خط الأساس

## الحالة
``UAOS_V11_BASELINE_COMMIT_NOT_FOUND``

## الحالة العامة
``UAOS_V11_BASELINE_INTEGRITY_FAIL``

## السبب
الـcommit ``6cde73d`` غير موجود في ``C:\keyboard-manager-clean`` (HEAD ``$repoHead`` / ``$repoBranch``).
موجود في ``C:\Users\ssare\Desktop\UAOS Commander`` (HEAD ``$commanderHead``).

## المراحل السابقة (من Evidence ZIP)
- V7: PASS materialization (25 worktrees)
- V8: DEPENDENCY_INSTALL_REQUIRED
- V9: TEST_OR_BUILD_FAILURES_PRESENT (25 audited; 10 declared fail; 6 source-blocked)
- V10: غير موجود

## تدقيق المهام (من V9 فقط)
- Audited: $($items.Count)
- PARTIALLY_IMPLEMENTED: $($counts.PARTIALLY_IMPLEMENTED)
- SOURCE_BLOCKED: $($counts.SOURCE_BLOCKED)
- IMPLEMENTED_AND_VERIFIED: $($counts.IMPLEMENTED_AND_VERIFIED)

## WIP
117 ملفًا صُنّف قراءة فقط. لم يُعدَّل منتج/WIP.

## التنفيذ
لم تُنشأ Worktrees تنفيذية. لم يحدث Commit/Push/Merge/Deploy.
قرارات المالك الـ12 تبقى OWNER_NOT_APPROVED.
"@
$en = @"
# UAOS V11 Final Report — Baseline Halt

Status: UAOS_V11_BASELINE_COMMIT_NOT_FOUND
Overall: UAOS_V11_BASELINE_INTEGRITY_FAIL

Required baseline 6cde73d is absent from keyboard-manager-clean and present only in UAOS Commander.
Prior V7/V8/V9 evidence restored from ZIP packs; V10 missing.
Task truth audited from V9 only ($($items.Count) tasks). No implementation worktrees. No commit/push/merge/deploy.
"@
[System.IO.File]::WriteAllText((Join-Path $run 'V11-FINAL-REPORT-AR.md'), $ar, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V11-FINAL-REPORT-EN.md'), $en, [System.Text.UTF8Encoding]::new($false))

$leader = @'
/**
 * UAOS V11 Cursor Leader — clean-baseline multi-agent orchestrator entry.
 * Hard-gates on commit 6cde73d inside C:\keyboard-manager-clean.
 * Does not mutate product WIP. Does not commit/push/merge/deploy.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'C:\\keyboard-manager-clean';
const REQUIRED = '6cde73d';
const COMMANDER = 'C:\\Users\\ssare\\Desktop\\UAOS Commander';

function git(cwd, args) {
  return spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
}

function main() {
  if (process.platform !== 'win32') {
    console.error('UAOS_V11_WINDOWS_REQUIRED');
    process.exit(2);
  }
  const inside = git(REPO, ['rev-parse', '--is-inside-work-tree']);
  if (inside.status !== 0 || String(inside.stdout).trim() !== 'true') {
    console.error('UAOS_V11_REPOSITORY_INVALID');
    process.exit(2);
  }
  const obj = git(REPO, ['cat-file', '-t', REQUIRED]);
  const has = obj.status === 0 && String(obj.stdout).trim() === 'commit';
  const head = String(git(REPO, ['rev-parse', 'HEAD']).stdout || '').trim();
  const branch = String(git(REPO, ['branch', '--show-current']).stdout || '').trim();
  const cmdObj = git(COMMANDER, ['cat-file', '-t', REQUIRED]);
  const commanderHas = cmdObj.status === 0 && String(cmdObj.stdout).trim() === 'commit';

  const reportDir = path.join(REPO, 'uaos-reports', 'latest');
  fs.mkdirSync(reportDir, { recursive: true });
  const payload = {
    coordinatorStatus: has ? 'UAOS_V11_BASELINE_OK' : 'UAOS_V11_BASELINE_COMMIT_NOT_FOUND',
    overallState: has ? 'UAOS_V11_READY_TO_ORCHESTRATE' : 'UAOS_V11_BASELINE_INTEGRITY_FAIL',
    repository: REPO,
    head,
    branch,
    requiredBaseline: REQUIRED,
    baselineFoundInRepo: has,
    baselineFoundInCommander: commanderHas,
    generatedAt: new Date().toISOString(),
    note: has
      ? 'Baseline present. Use Cursor chief orchestration to continue clean worktrees.'
      : 'Hard stop: do not create keyboard-manager-clean worktrees from missing commit. Protect dirty WIP.'
  };
  fs.writeFileSync(path.join(reportDir, 'LATEST-V11-LAUNCHER-STATUS.json'), JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload, null, 2));
  if (!has) {
    console.error('UAOS_V11_BASELINE_COMMIT_NOT_FOUND');
    process.exit(3);
  }
  console.log('UAOS_V11_BASELINE_OK');
}

main();
'@
[System.IO.File]::WriteAllText((Join-Path $srcDir 'platform-v11-cursor-leader.mjs'), $leader, [System.Text.UTF8Encoding]::new($false))

$cmd = @'
@echo off
setlocal EnableExtensions
title UAOS V11 Cursor Leader
echo ==============================================
echo  UAOS V11 — Cursor Clean-Baseline Leader
echo ==============================================
if /I not "%OS%"=="Windows_NT" (
  echo UAOS_V11_WINDOWS_REQUIRED
  goto :hold
)
where node >nul 2>&1
if errorlevel 1 (
  echo NODE_NOT_FOUND
  goto :hold
)
git -C "C:\keyboard-manager-clean" rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo UAOS_V11_REPOSITORY_INVALID
  goto :hold
)
git -C "C:\keyboard-manager-clean" cat-file -t 6cde73d >nul 2>&1
if errorlevel 1 (
  echo.
  echo UAOS_V11_BASELINE_COMMIT_NOT_FOUND
  echo Required commit 6cde73d is NOT in C:\keyboard-manager-clean
  echo Dirty working tree is protected. No checkout/restore/clean/stash.
  echo.
  node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v11-cursor-leader.mjs"
  echo.
  if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-REPORT-AR.md" (
    start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-REPORT-AR.md"
  )
  goto :hold
)
echo Baseline 6cde73d verified in keyboard-manager-clean.
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v11-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-REPORT-AR.md" (
  start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-REPORT-AR.md"
)
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[System.IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V11-CURSOR-LEADER.cmd', $cmd, [System.Text.UTF8Encoding]::new($false))

$maps = @(
  @('V11-FINAL-REPORT-AR.md', 'LATEST-V11-REPORT-AR.md'),
  @('V11-MASTER-STATUS.json', 'LATEST-V11-MASTER-STATUS.json'),
  @('V11-WIP-CLASSIFICATION.json', 'LATEST-V11-WIP-CLASSIFICATION.json'),
  @('V11-TASK-TRUTH-MATRIX.json', 'LATEST-V11-TASK-TRUTH-MATRIX.json'),
  @('V11-BLOCKERS.json', 'LATEST-V11-BLOCKERS.json'),
  @('V11-INTEGRATION-CANDIDATES.json', 'LATEST-V11-INTEGRATION-CANDIDATES.json'),
  @('V11-WIP-CLASSIFICATION-AR.md', 'LATEST-V11-WIP-CLASSIFICATION-AR.md'),
  @('V11-OWNER-DECISIONS-PENDING.json', 'V11-OWNER-DECISIONS-PENDING.json')
)
foreach ($m in $maps) {
  $src = Join-Path $run $m[0]
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $latest $m[1]) -Force
    Copy-Item $src (Join-Path $desktop $m[1]) -Force
  }
}

$summary = @"
Status: UAOS_V11_BASELINE_COMMIT_NOT_FOUND
Overall State: UAOS_V11_BASELINE_INTEGRITY_FAIL
Baseline Commit Required: 6cde73d
Baseline Present In keyboard-manager-clean: false
Baseline Present In UAOS Commander: $commanderHas
Original HEAD: $repoHead
Original Branch: $repoBranch
WIP Files Classified: 117
Tasks Audited: $($items.Count)
Tasks Already Verified: $($counts.IMPLEMENTED_AND_VERIFIED)
Tasks Partially Implemented: $($counts.PARTIALLY_IMPLEMENTED)
Source Blocked: $($counts.SOURCE_BLOCKED)
Tasks Implemented This Run: 0
Test Pass/Fail This Run: 0/0
Commit/Push/Merge/Deploy: NOT_PERFORMED
Evidence Pack: $run\UAOS-V11-EVIDENCE-20260804-120742.zip
Report Path: $run\V11-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V11-CURSOR-LEADER.cmd
"@
[System.IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'), $summary, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'), $summary, [System.Text.UTF8Encoding]::new($false))

$ts = '20260804-120742'
$zipPath = Join-Path $run ("UAOS-V11-EVIDENCE-$ts.zip")
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Get-ChildItem $run -File | Where-Object { $_.Extension -ne '.zip' } | ForEach-Object FullName) -DestinationPath $zipPath -Force
$zipSha = (Get-FileHash $zipPath -Algorithm SHA256).Hash
[System.IO.File]::WriteAllText((Join-Path $run ("UAOS-V11-EVIDENCE-$ts.sha256")), "$zipSha  UAOS-V11-EVIDENCE-$ts.zip", [System.Text.UTF8Encoding]::new($false))
$master['evidencePack'] = $zipPath
$master['evidenceSha256'] = $zipSha
Write-JsonFile $master (Join-Path $run 'V11-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V11-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V11-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V11-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V11-MASTER-STATUS.json') -Force

Write-JsonFile ([ordered]@{
  state = 'STOPPED'
  coordinatorStatus = 'UAOS_V11_BASELINE_COMMIT_NOT_FOUND'
  overallState = 'UAOS_V11_BASELINE_INTEGRITY_FAIL'
  tasksAudited = $items.Count
}) (Join-Path $queue 'execution-state.json')
Write-JsonFile ([ordered]@{
  status = 'HALTED'
  reason = 'UAOS_V11_BASELINE_COMMIT_NOT_FOUND'
  items = $items
}) (Join-Path $queue 'tasks.json')
Write-JsonFile ([ordered]@{
  pid = $PID
  at = (Get-Date).ToUniversalTime().ToString('o')
  alive = $false
  final = $true
}) (Join-Path $queue 'heartbeat.json')

node (Join-Path $srcDir 'platform-v11-cursor-leader.mjs')
Write-Output ("LEADER_EXIT=" + $LASTEXITCODE)
Write-Output ("COMMANDER_HAS=" + $commanderHas)
Write-Output ("AUDITED=" + $items.Count)
foreach ($k in $counts.Keys) { Write-Output ("TRUTH_" + $k + "=" + $counts[$k]) }
Write-Output ("ZIP_SHA=" + $zipSha)
Write-Output ("HEAD=" + $repoHead)
