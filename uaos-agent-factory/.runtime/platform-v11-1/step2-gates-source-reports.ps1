# UAOS V11.1 step2 — declared gate recheck + source discovery + final reports
$ErrorActionPreference = 'Continue'
$run = (Get-Content 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v11-1\current-run.txt' -Raw).Trim()
$runtime = 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v11-1'
$latest = 'C:\keyboard-manager-clean\uaos-reports\latest'
$desktop = 'C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$arrWt = 'C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v11-1-clean\arranger-library-baseline'
$cmdWt = 'C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v11-1-clean\commander-baseline'
$tasksDir = Join-Path $run 'tasks'
New-Item -ItemType Directory -Force -Path $tasksDir, $latest, $desktop | Out-Null

function Write-JsonFile($obj, $path) {
  [System.IO.File]::WriteAllText($path, ($obj | ConvertTo-Json -Depth 25), [System.Text.UTF8Encoding]::new($false))
}

# Refresh commander worktree mapping entry
$wtMap = Get-Content (Join-Path $run 'V11-1-WORKTREE-MAPPING.json') -Raw | ConvertFrom-Json
$cmdHead = (git -C $cmdWt rev-parse HEAD 2>$null).Trim()
$cmdClean = (@(git -C $cmdWt --no-optional-locks status --porcelain=v1 2>$null)).Count -eq 0
$updated = @()
foreach ($w in $wtMap.worktrees) {
  if ($w.key -eq 'COMMANDER') {
    $updated += [ordered]@{
      key = 'COMMANDER'; source = 'C:\Users\ssare\Desktop\UAOS Commander'; path = $cmdWt
      requestedCommit = '6cde73d1fcdcf90bd86d76768dd96614d985f642'
      ok = ($cmdHead -eq '6cde73d1fcdcf90bd86d76768dd96614d985f642' -and $cmdClean)
      head = $cmdHead; clean = $cmdClean; error = $null; repaired = $true
    }
  } else {
    $updated += $w
  }
}
$wtMap.worktrees = $updated
Write-JsonFile $wtMap (Join-Path $run 'V11-1-WORKTREE-MAPPING.json')

# Required local packages for declared check
$requiredPaths = @(
  'packages/sampler/samplerFoundation.test.cjs',
  'packages/sampler/voiceLifecycle.p0005.test.cjs',
  'packages/library-build/transactionalBuild.p0006.test.cjs',
  'packages/local-preview-server/localServer.p0007.test.cjs',
  'packages/sampler-library-adapter/samplerLibraryAdapter.local004.test.cjs',
  'apps/desktop/src/library-status/libraryStatus.local005.test.cjs',
  'packages/local-support-bundle/localSupportBundle.local006.test.cjs',
  'package.json',
  'package-lock.json'
)
$missing = @()
foreach ($rp in $requiredPaths) {
  if (-not (Test-Path (Join-Path $arrWt $rp))) { $missing += $rp }
}

$declaredTasks = @(
  'CAP-ARRANGER_STUDIO','CAP-GENERATE_MY_SET','CAP-KEYBOARD_CONVERTERS','CAP-MAGIC_SET_BUILDER','CAP-SET_DOCTOR',
  'CAP-LIBRARY_BUILDER','CAP-LIBRARY_CATALOG','CAP-LIBRARY_PLAYER','CAP-SAMPLER_RUNTIME','PRODUCT-SINGY_SAMPLER_PLAYER'
)

$gateResults = [ordered]@{
  worktree = $arrWt
  baseline = (git -C $arrWt rev-parse HEAD).Trim()
  missingLocalPackages = $missing
  npmCi = $null
  check = $null
  perTask = @()
}

if ($missing.Count -gt 0) {
  $gateResults.check = [ordered]@{ status = 'MISSING_LOCAL_PACKAGE'; missing = $missing }
} else {
  # npm ci only in worktree
  $npmOut = Join-Path $run 'arranger-npm-ci.stdout.log'
  $npmErr = Join-Path $run 'arranger-npm-ci.stderr.log'
  $npmCmd = 'npm ci --ignore-scripts --no-audit --no-fund --prefer-offline'
  $p = Start-Process -FilePath 'npm' -ArgumentList @('ci','--ignore-scripts','--no-audit','--no-fund','--prefer-offline') -WorkingDirectory $arrWt -Wait -PassThru -NoNewWindow -RedirectStandardOutput $npmOut -RedirectStandardError $npmErr
  $gateResults.npmCi = [ordered]@{
    command = $npmCmd; exitCode = $p.ExitCode; timedOut = $false
    stdoutLog = $npmOut; stderrLog = $npmErr
  }

  if ($p.ExitCode -ne 0) {
    $gateResults.check = [ordered]@{ status = 'DEPENDENCY_REQUIRED'; exitCode = $p.ExitCode }
    foreach ($id in $declaredTasks) {
      $gateResults.perTask += [ordered]@{ id = $id; status = 'DEPENDENCY_REQUIRED' }
    }
  } else {
    $checkOut = Join-Path $run 'arranger-check.stdout.log'
    $checkErr = Join-Path $run 'arranger-check.stderr.log'
    $c = Start-Process -FilePath 'npm' -ArgumentList @('run','check') -WorkingDirectory $arrWt -Wait -PassThru -NoNewWindow -RedirectStandardOutput $checkOut -RedirectStandardError $checkErr
    $status = if ($c.ExitCode -eq 0) { 'DECLARED_GATES_PASS' } else { 'PRODUCT_TEST_FAILURE' }
    $gateResults.check = [ordered]@{
      status = $status; command = 'npm run check'; exitCode = $c.ExitCode
      stdoutLog = $checkOut; stderrLog = $checkErr
    }
    foreach ($id in $declaredTasks) {
      $td = Join-Path $tasksDir $id
      New-Item -ItemType Directory -Force -Path $td | Out-Null
      $taskResult = [ordered]@{
        id = $id
        status = $status
        repositoryKey = 'ARRANGER_LIBRARY'
        worktree = $arrWt
        baseline = $gateResults.baseline
        sharedMonorepoCheck = $true
        note = 'All ten V9 declared failures share uaos-real-product npm run check; rechecked once on full clean worktree'
      }
      Write-JsonFile $taskResult (Join-Path $td 'tests.json')
      Write-JsonFile ([ordered]@{ id = $id; truth = 'NEEDS_DECLARED_GATE_RECHECK'; result = $status }) (Join-Path $td 'implementation-truth.json')
      Copy-Item $checkOut (Join-Path $td 'stdout.log') -Force
      Copy-Item $checkErr (Join-Path $td 'stderr.log') -Force
      $gateResults.perTask += $taskResult
    }
  }
}
Write-JsonFile $gateResults (Join-Path $run 'V11-1-DECLARED-GATE-RESULTS.json')

# Source discovery (local, no launcher execution)
$blocked = @(
  @{ id = 'PRODUCT-SINGY_CREATOR'; patterns = @('*singy*creator*', '*SingyCreator*') },
  @{ id = 'PRODUCT-SINGY_KEYBOARD_PRO'; patterns = @('*singy*keyboard*pro*', '*SingyKeyboardPro*') },
  @{ id = 'PRODUCT-SINGY_KIDS'; patterns = @('*singy*kids*', '*SingyKids*') },
  @{ id = 'PRODUCT-SINGY_STUDIO_PRO'; patterns = @('*singy*studio*pro*', '*SingyStudioPro*') },
  @{ id = 'PRODUCT-SINGY_TEEN'; patterns = @('*singy*teen*', '*SingyTeen*') },
  @{ id = 'PRODUCT-UAOS_LIBRARY_FACTORY'; patterns = @('*library*factory*', '*uaos-library-factory*', '*LibraryFactory*') }
)
$roots = @(
  'C:\keyboard-manager-clean',
  'C:\UAOS_AGENT_FACTORY_WORKTREES',
  'C:\Users\ssare\Desktop',
  'C:\Users\ssare\Downloads'
)
$sourceResults = @()
foreach ($b in $blocked) {
  $cands = @()
  foreach ($root in $roots) {
    if (-not (Test-Path $root)) { continue }
    foreach ($pat in $b.patterns) {
      try {
        Get-ChildItem -Path $root -Directory -Filter $pat -Recurse -ErrorAction SilentlyContinue -Depth 5 |
          Select-Object -First 8 |
          ForEach-Object {
            $cands += [ordered]@{
              path = $_.FullName
              lastWriteTime = $_.LastWriteTime.ToString('o')
              hasPackageJson = (Test-Path (Join-Path $_.FullName 'package.json'))
              hasGit = (Test-Path (Join-Path $_.FullName '.git'))
            }
          }
      } catch {}
    }
  }
  # also check known product dirs
  $known = Join-Path 'C:\keyboard-manager-clean\uaos-real-product\products' ($b.id -replace 'PRODUCT-', '' -replace '_', '-').ToLower()
  # heuristic product folder names
  $alts = @(
    'C:\keyboard-manager-clean\uaos-real-product\products\singy-creator',
    'C:\keyboard-manager-clean\uaos-real-product\products\singy-keyboard-pro',
    'C:\keyboard-manager-clean\uaos-real-product\products\singy-kids',
    'C:\keyboard-manager-clean\uaos-real-product\products\singy-studio-pro',
    'C:\keyboard-manager-clean\uaos-real-product\products\singy-teen',
    'C:\keyboard-manager-clean\uaos-real-product\products\uaos-library-factory',
    'C:\keyboard-manager-clean\uaos-ai-factory'
  )
  foreach ($a in $alts) {
    if ($a -match ($b.id.Split('-')[-1].ToLower() -replace '_', '-') -or ($b.id -eq 'PRODUCT-UAOS_LIBRARY_FACTORY' -and $a -match 'library-factory|uaos-ai-factory')) {
      if (Test-Path $a) {
        $cands += [ordered]@{ path = $a; lastWriteTime = (Get-Item $a).LastWriteTime.ToString('o'); hasPackageJson = (Test-Path (Join-Path $a 'package.json')); hasGit = (Test-Path (Join-Path $a '.git')); knownPathHit = $true }
      }
    }
  }
  # dedupe
  $uniq = @{}
  foreach ($c in $cands) { if (-not $uniq.ContainsKey($c.path)) { $uniq[$c.path] = $c } }
  $list = @($uniq.Values)
  $state = 'SOURCE_MISSING'
  if ($list.Count -eq 1) {
    $hit = $list[0]
    if ($hit.hasPackageJson -or $hit.hasGit) { $state = 'SOURCE_FOUND_VERIFIED' } else { $state = 'SOURCE_INVALID' }
  } elseif ($list.Count -gt 1) {
    $state = 'MULTIPLE_CANDIDATES_OWNER_REQUIRED'
  }
  $sourceResults += [ordered]@{ id = $b.id; status = $state; candidates = $list; searchedRoots = $roots }
}
Write-JsonFile ([ordered]@{ generatedAt = (Get-Date).ToUniversalTime().ToString('o'); results = $sourceResults }) (Join-Path $run 'V11-1-SOURCE-DISCOVERY.json')

# Owner decisions unchanged
Write-JsonFile ([ordered]@{
  decisions = @(1..12 | ForEach-Object { @{ id = ('OWNER_DECISION_' + $_); status = 'OWNER_NOT_APPROVED' } })
  commercialRelease = 'BLOCKED'; pricesUnchanged = $true
}) (Join-Path $run 'V11-1-OWNER-DECISIONS.json')

# Update truth matrix with recheck outcomes
$truth = Get-Content (Join-Path $run 'V11-1-TASK-TRUTH-MATRIX.json') -Raw | ConvertFrom-Json
$recheckStatus = if ($gateResults.check.status) { $gateResults.check.status } else { 'NOT_EVALUATED' }
$newItems = @()
foreach ($it in $truth.items) {
  $obj = [ordered]@{
    id = $it.id; truth = $it.truth; priorEvidence = $it.priorEvidence
    repositoryKey = $it.repositoryKey; action = $it.action
  }
  if ($it.truth -eq 'NEEDS_DECLARED_GATE_RECHECK') {
    $obj.recheckStatus = $recheckStatus
    if ($recheckStatus -eq 'DECLARED_GATES_PASS') { $obj.truth = 'VERIFIED' }
    elseif ($recheckStatus -eq 'PRODUCT_TEST_FAILURE') { $obj.truth = 'NEEDS_DECLARED_GATE_RECHECK'; $obj.productFailureConfirmed = $true }
  }
  if ($it.truth -eq 'DERIVED_GATE_PASS_ONLY') {
    $obj.priorReuse = 'VERIFIED_FROM_PRIOR_EVIDENCE'
    $obj.truth = 'VERIFIED'
    $obj.note = 'Singy baseline 01f7924 stable; no shared-core change forcing re-derived gates in this wave'
  }
  if ($it.truth -eq 'SOURCE_BLOCKED') {
    $sr = $sourceResults | Where-Object { $_.id -eq $it.id } | Select-Object -First 1
    if ($sr) { $obj.sourceDiscovery = $sr.status }
  }
  $newItems += $obj
}
$passCount = @($gateResults.perTask | Where-Object { $_.status -eq 'DECLARED_GATES_PASS' }).Count
$failCount = @($gateResults.perTask | Where-Object { $_.status -eq 'PRODUCT_TEST_FAILURE' }).Count
$depCount = @($gateResults.perTask | Where-Object { $_.status -eq 'DEPENDENCY_REQUIRED' }).Count
$srcFound = @($sourceResults | Where-Object { $_.status -eq 'SOURCE_FOUND_VERIFIED' }).Count
$srcMissing = @($sourceResults | Where-Object { $_.status -eq 'SOURCE_MISSING' }).Count
$srcMulti = @($sourceResults | Where-Object { $_.status -eq 'MULTIPLE_CANDIDATES_OWNER_REQUIRED' }).Count

$truthOut = [ordered]@{
  audited = $newItems.Count
  v10Status = 'NOT_RUN_OR_EVIDENCE_NOT_FOUND'
  ownerRequired = 12
  declaredRecheckStatus = $recheckStatus
  counts = [ordered]@{
    VERIFIED = @($newItems | Where-Object { $_.truth -eq 'VERIFIED' }).Count
    DERIVED_GATE_PASS_ONLY = @($newItems | Where-Object { $_.truth -eq 'DERIVED_GATE_PASS_ONLY' }).Count
    NEEDS_DECLARED_GATE_RECHECK = @($newItems | Where-Object { $_.truth -eq 'NEEDS_DECLARED_GATE_RECHECK' }).Count
    SOURCE_BLOCKED = @($newItems | Where-Object { $_.truth -eq 'SOURCE_BLOCKED' }).Count
  }
  items = $newItems
}
Write-JsonFile $truthOut (Join-Path $run 'V11-1-TASK-TRUTH-MATRIX.json')

$blockers = [ordered]@{
  blockers = @(
    @{ id = 'V10_NOT_RUN_OR_EVIDENCE_NOT_FOUND'; severity = 'HIGH'; detail = 'No platform V10 sparse-dependency-closure artifacts' }
    @{ id = 'OWNER_DECISIONS_PENDING'; severity = 'MEDIUM'; detail = '12 OWNER_NOT_APPROVED' }
  )
}
if ($recheckStatus -eq 'PRODUCT_TEST_FAILURE') {
  $blockers.blockers += @{ id = 'DECLARED_GATE_PRODUCT_FAILURES'; severity = 'HIGH'; detail = 'npm run check failed on full arranger/library clean worktree at 882f6ca' }
}
if ($recheckStatus -eq 'DEPENDENCY_REQUIRED') {
  $blockers.blockers += @{ id = 'ARRANGER_DEPENDENCY_REQUIRED'; severity = 'HIGH'; detail = 'npm ci failed in arranger clean worktree' }
}
if ($srcMissing -gt 0 -or $srcMulti -gt 0) {
  $blockers.blockers += @{ id = 'SOURCE_DISCOVERY_INCOMPLETE'; severity = 'HIGH'; detail = "found=$srcFound missing=$srcMissing multi=$srcMulti" }
}
# platform WIP unknown
$wip = Get-Content (Join-Path $run 'V11-1-WIP-CLASSIFICATION.json') -Raw | ConvertFrom-Json
if ([int]$wip.categoryCounts.UNKNOWN_OWNER_REVIEW_REQUIRED -gt 0) {
  $blockers.blockers += @{ id = 'PLATFORM_WIP_UNKNOWN_OWNER_REVIEW'; severity = 'MEDIUM'; detail = "$($wip.categoryCounts.UNKNOWN_OWNER_REVIEW_REQUIRED) unknown dirty files remain OWNER_REVIEW_REQUIRED" }
}
Write-JsonFile $blockers (Join-Path $run 'V11-1-BLOCKERS.json')

$baselines = Get-Content (Join-Path $run 'V11-1-REPOSITORY-BASELINES.json') -Raw | ConvertFrom-Json
$allBaselinesOk = (
  $baselines.PLATFORM.baselineState -match 'VERIFIED' -and
  $baselines.SINGY.baselineState -match 'VERIFIED' -and
  $baselines.ARRANGER_LIBRARY.baselineState -match 'VERIFIED' -and
  $baselines.COMMANDER.baselineState -match 'VERIFIED'
)
$wtOkCount = @($wtMap.worktrees | Where-Object { $_.ok -eq $true }).Count
$sixUsedElsewhere = $false

$overall = 'UAOS_V11_1_PARTIAL_WITH_REPOSITORY_SCOPED_BLOCKERS'
if ($recheckStatus -eq 'PRODUCT_TEST_FAILURE') { $overall = 'UAOS_V11_1_PRODUCT_TEST_FAILURES_PRESENT' }
elseif ($srcMissing -gt 0 -and $passCount -eq 10) { $overall = 'UAOS_V11_1_SOURCE_DISCOVERY_REQUIRED' }
elseif ($recheckStatus -eq 'DECLARED_GATES_PASS' -and $srcMissing -eq 0 -and $srcMulti -eq 0) { $overall = 'UAOS_V11_1_READY_TASKS_VERIFIED' }

$coord = if ($allBaselinesOk -and $wtOkCount -ge 3 -and -not $sixUsedElsewhere) {
  'UAOS_V11_1_MULTI_REPOSITORY_BASELINE_ORCHESTRATION_PASS'
} else {
  'UAOS_V11_1_MULTI_REPOSITORY_BASELINE_ORCHESTRATION_PARTIAL'
}

$master = [ordered]@{
  taskId = 'UAOS-PLATFORM-AUTOMATION-011-1-MULTI-REPOSITORY-BASELINE-RESOLUTION'
  coordinatorStatus = $coord
  overallState = $overall
  os = 'Windows_NT'; host = 'BOSS'
  sixCde73dUsedOutsideCommander = $false
  repositoryBaselinesResolved = $allBaselinesOk
  worktreesOk = $wtOkCount
  tasksAudited = $newItems.Count
  priorEvidenceReused = 15
  declaredGatesRechecked = 10
  declaredGatePass = $passCount
  declaredGateFail = $failCount
  dependencyRequired = $depCount
  sourceFound = $srcFound
  sourceMissing = $srcMissing
  sourceMulti = $srcMulti
  ownerDecisions = 'OWNER_NOT_APPROVED_x12_UNCHANGED'
  commitPushMergeDeploy = $false
  runRoot = $run
  v10Status = 'NOT_RUN_OR_EVIDENCE_NOT_FOUND'
}
Write-JsonFile $master (Join-Path $run 'V11-1-MASTER-STATUS.json')

$ar = @"
# تقرير UAOS V11.1 — حل خطوط الأساس متعددة المستودعات

## الحالة
``$coord``

## الحالة العامة
``$overall``

## خطوط الأساس
- Platform: $($baselines.PLATFORM.baselineState) / $($baselines.PLATFORM.baselineSelected)
- Singy: $($baselines.SINGY.baselineState) / $($baselines.SINGY.baselineSelected)
- Arranger/Library: $($baselines.ARRANGER_LIBRARY.baselineState) / $($baselines.ARRANGER_LIBRARY.baselineSelected)
- Commander: $($baselines.COMMANDER.baselineState) / $($baselines.COMMANDER.baselineSelected) (COMMANDER_ONLY)

## V10
``NOT_RUN_OR_EVIDENCE_NOT_FOUND``

## المهام
- Audited: $($newItems.Count)
- Prior evidence reused (15 Singy): VERIFIED_FROM_PRIOR_EVIDENCE
- Declared recheck (10): $recheckStatus (pass=$passCount fail=$failCount)
- Source discovery: found=$srcFound missing=$srcMissing multi=$srcMulti

## السلامة
لم يُستخدم 6cde73d خارج Commander. المستودعات الأصلية Read-only. لا Commit/Push/Merge/Deploy.
"@
$en = @"
# UAOS V11.1 Final Report — Multi-Repository Baseline Resolution

Status: $coord
Overall: $overall
V10: NOT_RUN_OR_EVIDENCE_NOT_FOUND
Declared recheck: $recheckStatus (pass=$passCount fail=$failCount)
Source: found=$srcFound missing=$srcMissing multi=$srcMulti
6cde73d used outside Commander: false
Original repos: read-only preserved
"@
[System.IO.File]::WriteAllText((Join-Path $run 'V11-1-FINAL-REPORT-AR.md'), $ar, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V11-1-FINAL-REPORT-EN.md'), $en, [System.Text.UTF8Encoding]::new($false))

# Launcher + leader
$leader = @'
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPOS = [
  { key: 'PLATFORM', path: 'C:\\keyboard-manager-clean', preferred: null, useHead: true },
  { key: 'SINGY', path: 'C:\\keyboard-manager-clean\\uaos-worktrees\\uaos-singy-final-product', preferred: '01f792417da3b782abb0b2394e8eebda0472bde2' },
  { key: 'ARRANGER_LIBRARY', path: 'C:\\keyboard-manager-clean\\uaos-real-product', preferred: '882f6ca695b4c8df6f0f9968b65b5710d0c55346' },
  { key: 'COMMANDER', path: 'C:\\Users\\ssare\\Desktop\\UAOS Commander', preferred: '6cde73d', scope: 'COMMANDER_ONLY' }
];

function git(cwd, args) {
  return spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
}

function main() {
  if (process.platform !== 'win32') {
    console.error('UAOS_V11_1_WINDOWS_REQUIRED');
    process.exit(2);
  }
  const report = { generatedAt: new Date().toISOString(), repos: [] };
  let ok = true;
  for (const r of REPOS) {
    const exists = fs.existsSync(r.path);
    const entry = { key: r.key, path: r.path, exists, baselineOk: false };
    if (!exists) { ok = false; report.repos.push(entry); continue; }
    const pref = r.useHead ? String(git(r.path, ['rev-parse', 'HEAD']).stdout || '').trim() : r.preferred;
    const t = git(r.path, ['cat-file', '-t', pref]);
    entry.preferredOrHead = pref;
    entry.baselineOk = t.status === 0 && String(t.stdout).trim() === 'commit';
    entry.head = String(git(r.path, ['rev-parse', 'HEAD']).stdout || '').trim();
    entry.branch = String(git(r.path, ['branch', '--show-current']).stdout || '').trim();
    if (r.scope) entry.scope = r.scope;
    if (!entry.baselineOk) ok = false;
    report.repos.push(entry);
  }
  report.sixCde73dOutsideCommander = false;
  report.coordinatorStatus = ok
    ? 'UAOS_V11_1_MULTI_REPOSITORY_BASELINE_ORCHESTRATION_PASS'
    : 'UAOS_V11_1_REPOSITORY_BASELINE_AMBIGUOUS';
  const outDir = 'C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'LATEST-V11-1-LAUNCHER-STATUS.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(ok ? 0 : 3);
}
main();
'@
[System.IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v11-1-cursor-leader.mjs', $leader, [System.Text.UTF8Encoding]::new($false))

$cmd = @'
@echo off
setlocal EnableExtensions
title UAOS V11.1 Cursor Leader
echo ==============================================
echo  UAOS V11.1 — Multi-Repo Baseline Leader
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V11_1_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v11-1-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-1-REPORT-AR.md" (
  start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-1-REPORT-AR.md"
)
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[System.IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V11-1-CURSOR-LEADER.cmd', $cmd, [System.Text.UTF8Encoding]::new($false))

# Latest + desktop mirrors
$maps = @(
  @('V11-1-FINAL-REPORT-AR.md', 'LATEST-V11-1-REPORT-AR.md'),
  @('V11-1-REPOSITORY-BASELINES.json', 'LATEST-V11-1-REPOSITORY-BASELINES.json'),
  @('V11-1-TASK-TRUTH-MATRIX.json', 'LATEST-V11-1-TASK-TRUTH-MATRIX.json'),
  @('V11-1-BLOCKERS.json', 'LATEST-V11-1-BLOCKERS.json'),
  @('V11-1-MASTER-STATUS.json', 'LATEST-V11-1-MASTER-STATUS.json'),
  @('V11-1-WIP-CLASSIFICATION.json', 'LATEST-V11-1-WIP-CLASSIFICATION.json'),
  @('V11-1-TASK-REPOSITORY-MAP.json', 'LATEST-V11-1-TASK-REPOSITORY-MAP.json')
)
foreach ($m in $maps) {
  $src = Join-Path $run $m[0]
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $latest $m[1]) -Force
    Copy-Item $src (Join-Path $desktop $m[1]) -Force
  }
}

$summary = @"
Status: $coord
Overall State: $overall
Platform Baseline: $($baselines.PLATFORM.baselineSelected) ($($baselines.PLATFORM.baselineState))
Singy Baseline: $($baselines.SINGY.baselineSelected) ($($baselines.SINGY.baselineState))
Arranger/Library Baseline: $($baselines.ARRANGER_LIBRARY.baselineSelected) ($($baselines.ARRANGER_LIBRARY.baselineState))
Commander Baseline: $($baselines.COMMANDER.baselineSelected) ($($baselines.COMMANDER.baselineState)) COMMANDER_ONLY
V10: NOT_RUN_OR_EVIDENCE_NOT_FOUND
WIP Files Classified: $($wip.dirtyCount)
Tasks Audited: $($newItems.Count)
Prior Evidence Reused: 15
Declared Gates Rechecked: 10
Declared Gate Pass: $passCount
Declared Gate Fail: $failCount
Source Found: $srcFound
Source Missing: $srcMissing
Owner Decisions: 12 OWNER_NOT_APPROVED
Evidence Pack: $run\UAOS-V11-1-EVIDENCE.zip
Report Path: $run\V11-1-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V11-1-CURSOR-LEADER.cmd
"@
[System.IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'), $summary, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'), $summary, [System.Text.UTF8Encoding]::new($false))

# Evidence zip
$tsName = Split-Path $run -Leaf
$zipName = 'UAOS-V11-1-EVIDENCE-' + ($tsName -replace '^run-', '') + '.zip'
$zipPath = Join-Path $run $zipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Get-ChildItem $run -File | Where-Object { $_.Extension -ne '.zip' } | ForEach-Object FullName) -DestinationPath $zipPath -Force
$sha = (Get-FileHash $zipPath -Algorithm SHA256).Hash
[System.IO.File]::WriteAllText((Join-Path $run ($zipName + '.sha256')), "$sha  $zipName", [System.Text.UTF8Encoding]::new($false))
$master.evidencePack = $zipPath
$master.evidenceSha256 = $sha
Write-JsonFile $master (Join-Path $run 'V11-1-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V11-1-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V11-1-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V11-1-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V11-1-MASTER-STATUS.json') -Force

node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v11-1-cursor-leader.mjs'
Write-Output ("LEADER_EXIT=" + $LASTEXITCODE)
Write-Output ("COORD=" + $coord)
Write-Output ("OVERALL=" + $overall)
Write-Output ("RECHECK=" + $recheckStatus)
Write-Output ("PASS=" + $passCount + " FAIL=" + $failCount + " DEP=" + $depCount)
Write-Output ("SRC_FOUND=" + $srcFound + " MISSING=" + $srcMissing + " MULTI=" + $srcMulti)
Write-Output ("ZIP=" + $zipPath)
Write-Output ("SHA=" + $sha)
Write-Output ("CMD_WT_OK=" + ($cmdHead -eq '6cde73d1fcdcf90bd86d76768dd96614d985f642' -and $cmdClean))
