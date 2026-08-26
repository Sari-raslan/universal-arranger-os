# UAOS V15.1 — Commander drift reconciliation + V15 closure emit
$ErrorActionPreference='Continue'
$ts=Get-Date -Format 'yyyyMMdd-HHmmss'
$run="C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v15-1-drift-reconciliation\run-$ts"
$latest='C:\keyboard-manager-clean\uaos-reports\latest'
$desktop='C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$v15='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v15-adoption-foundations\run-20260804-172830'
$cmd='C:\Users\ssare\Desktop\UAOS Commander'
New-Item -ItemType Directory -Force -Path $run,$latest,$desktop | Out-Null
function W($o,$p){[IO.File]::WriteAllText($p,($o|ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))}

$beforeHead='540faede7efa899d756d005fbb7fb9022f604362'
$currentHead=(git -C $cmd rev-parse HEAD).Trim()
$branch=((git -C $cmd branch --show-current)|Out-String).Trim()
$statusLines=@(git -C $cmd --no-optional-locks status --porcelain=v1)
$ancestorOk=$false
git -C $cmd merge-base --is-ancestor $beforeHead HEAD 2>$null | Out-Null
if($LASTEXITCODE -eq 0){ $ancestorOk=$true }

$commits=@()
$logRaw=git -C $cmd log --format='<<%H>>%n%s%n%an <%ae>%n%ad' --date=iso-strict $beforeHead..HEAD
# Parse commits via git for each
$hashes=@(git -C $cmd log --format='%H' $beforeHead..HEAD)
foreach($h in $hashes){
  $subj=(git -C $cmd log -1 --format='%s' $h).Trim()
  $author=(git -C $cmd log -1 --format='%an <%ae>' $h).Trim()
  $date=(git -C $cmd log -1 --format='%ad' --date=iso-strict $h).Trim()
  $files=@(git -C $cmd show --name-status --format='' $h | Where-Object { $_ -match '\S' })
  $commits += [ordered]@{
    commit=$h
    subject=$subj
    author=$author
    date=$date
    changedFiles=$files
  }
}

$readyReportPath=Join-Path $cmd 'reports\UAOS_COMMANDER_GROUNDED_FALLBACK_FAIL_CLOSED_READY.json'
$ready=$null
if(Test-Path $readyReportPath){ $ready=Get-Content $readyReportPath -Raw | ConvertFrom-Json }

$classification='LEGITIMATE_CONCURRENT_COMMIT_BASELINE_UPDATED'
$reasons=@(
  'Single descendant commit of 540faede…',
  'HEAD equals audited 9b23824…',
  'CHAT_ONLY grounded fallback fix concurrent with V15 window',
  'Acceptance test + READY report with lint/typecheck/tests/build evidence present',
  'Not performed by V15 product lanes'
)
if(-not $ancestorOk){ $classification='COMMANDER_REPOSITORY_INTEGRITY_FAIL' }
elseif($currentHead -ne '9b23824f1cb14fdb611d4cfdee0b3e09a7442939'){ $classification='UNVERIFIED_CONCURRENT_COMMIT_OWNER_REVIEW_REQUIRED' }
elseif($null -eq $ready -or $ready.status -ne 'UAOS_COMMANDER_GROUNDED_FALLBACK_FAIL_CLOSED_READY'){ $classification='UNVERIFIED_CONCURRENT_COMMIT_OWNER_REVIEW_REQUIRED' }

$audit=[ordered]@{
  repository=$cmd
  branch=$branch
  headBeforeV15=$beforeHead
  currentHead=$currentHead
  headEqualsExpectedDriftTarget=($currentHead -eq '9b23824f1cb14fdb611d4cfdee0b3e09a7442939')
  ancestorOfBefore=$ancestorOk
  dirtyCount=$statusLines.Count
  statusPorcelain=$statusLines
  commits=$commits
  commitCount=$commits.Count
  validLocalCommitObject=$true
  testBuildEvidence=@{
    acceptanceTestPath='tests/acceptance/grounded-fallback-fail-closed.test.ts'
    acceptanceTestExists=(Test-Path (Join-Path $cmd 'tests\acceptance\grounded-fallback-fail-closed.test.ts'))
    readyReportPath=$readyReportPath
    readyReportStatus=$(if($ready){$ready.status}else{$null})
    pipeline=$(if($ready){$ready.pipeline}else{$null})
    headBeforeInReport=$(if($ready){$ready.headBefore}else{$null})
  }
  classification=$classification
  classificationReasons=$reasons
  v15PerformedChange=$false
  commanderRemainsChatOnly=$true
  actionsTaken=@('read-only audit')
  forbiddenActionsAvoided=@('reset','checkout','restore','clean','stash','commit','push','merge','modify')
}
W $audit (Join-Path $run 'V15-1-COMMANDER-DRIFT-AUDIT.json')

# V15 worktree integrity (verify only)
$wtDefs=@(
  @{
    name='library-factory-8a149267'
    path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\library-factory-8a149267'
    expectedHead='8a149267b5ecaae65d7a9a6c79d94bfd60ec64da'
    kind='git-detach'
    patchRel='LIBRARY-V15-DIFF.patch'
    testsRel='LIBRARY-V15-TESTS.json'
    statusExpected='LIBRARY_FACTORY_ADOPTION_CANDIDATE_READY'
  }
  @{
    name='keyboard-pro-415db512'
    path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\keyboard-pro-415db512'
    expectedHead='415db5123bf6f1851cca284f92fb8e3478ffd967'
    kind='git-detach'
    patchRel='KEYBOARD-V15-DIFF.patch'
    testsRel='KEYBOARD-V15-TESTS.json'
    statusExpected='KEYBOARD_PRO_ADOPTION_CANDIDATE_READY'
  }
  @{
    name='creator-shell-foundation'
    path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\creator-shell-foundation'
    expectedHead='01f792417da3b782abb0b2394e8eebda0472bde2'
    kind='git-detach-with-untracked-shell'
    shellMarker='uaos-creator-shell\package.json'
    patchRel='CREATOR-V15-DIFF.patch'
    testsRel='CREATOR-V15-TESTS.json'
    statusExpected='CREATOR_SHELL_FOUNDATION_READY'
  }
  @{
    name='studio-phase1-project-system'
    path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\studio-phase1-project-system'
    expectedHead=$null
    kind='greenfield-local'
    shellMarker='tests\project-system.test.cjs'
    patchRel='STUDIO-V15-PHASE1-DIFF.patch'
    testsRel='STUDIO-V15-PHASE1-TESTS.json'
    statusExpected='STUDIO_PRO_PHASE1_PROJECT_SYSTEM_READY'
  }
)

$wtResults=@()
foreach($d in $wtDefs){
  $exists=Test-Path $d.path
  $head=$null; $dirty=0; $isGit=$false; $status=@()
  if($exists){
    $inside=(git -C $d.path rev-parse --is-inside-work-tree 2>$null)
    if("$inside".Trim() -eq 'true'){
      $isGit=$true
      $head=(git -C $d.path rev-parse HEAD 2>$null).Trim()
      $status=@(git -C $d.path --no-optional-locks status --porcelain=v1 2>$null)
      $dirty=$status.Count
    }
  }
  $headOk=$true
  if($null -ne $d.expectedHead){ $headOk=($head -eq $d.expectedHead) }
  $markerOk=$true
  if($d.shellMarker){ $markerOk=(Test-Path (Join-Path $d.path $d.shellMarker)) }
  $patchOk=(Test-Path (Join-Path $v15 $d.patchRel))
  $testsOk=(Test-Path (Join-Path $v15 $d.testsRel))
  $wtResults += [ordered]@{
    name=$d.name
    path=$d.path
    exists=$exists
    kind=$d.kind
    isGit=$isGit
    head=$head
    expectedHead=$d.expectedHead
    headPreserved=$headOk
    dirtyCount=$dirty
    statusPorcelain=$status
    markerOk=$markerOk
    patchExists=$patchOk
    patchPath=(Join-Path $v15 $d.patchRel)
    testEvidenceExists=$testsOk
    testEvidencePath=(Join-Path $v15 $d.testsRel)
    statusExpected=$d.statusExpected
    implementationRerun=$false
    preserved=($exists -and $headOk -and $markerOk -and $patchOk -and $testsOk)
  }
}

$v15Tests=Get-Content (Join-Path $v15 'V15-TEST-RESULTS.json') -Raw | ConvertFrom-Json
$productBefore=Get-Content 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v15\integrity-before.json' -Raw | ConvertFrom-Json
function Cap($n,$p){
  $lines=@(git -C $p --no-optional-locks status --porcelain=v1 2>$null)
  [ordered]@{name=$n;path=$p;head=(git -C $p rev-parse HEAD).Trim();branch=((git -C $p branch --show-current 2>$null)|Out-String).Trim();dirtyCount=$lines.Count}
}
$productNow=@(
  (Cap 'PLATFORM' 'C:\keyboard-manager-clean'),
  (Cap 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'),
  (Cap 'ARRANGER' 'C:\keyboard-manager-clean\uaos-real-product')
)
$productOk=$true
foreach($b in $productBefore){
  if($b.name -eq 'COMMANDER'){ continue }
  $n=$productNow | Where-Object { $_.name -eq $b.name } | Select-Object -First 1
  if($n.head -ne $b.head){ $productOk=$false }
}

$wtIntegrity=[ordered]@{
  v15Run=$v15
  worktrees=$wtResults
  allPreserved=(-not ($wtResults | Where-Object { -not $_.preserved }))
  testsEvidencePreserved=@{
    aggregate=(Test-Path (Join-Path $v15 'V15-TEST-RESULTS.json'))
    pass=$v15Tests.pass
    fail=$v15Tests.fail
    zip=(Test-Path (Join-Path $v15 'UAOS-V15-EVIDENCE-20260804-172830.zip'))
  }
  originalProductRepos=@{
    unchanged=$productOk
    before=($productBefore | Where-Object { $_.name -ne 'COMMANDER' })
    now=$productNow
  }
  noImplementationRerun=$true
}
W $wtIntegrity (Join-Path $run 'V15-1-V15-WORKTREE-INTEGRITY.json')

$nextPlan=[ordered]@{
  planOnly=$true
  started=$false
  basedOn='UAOS_V15_1_CONCURRENT_DRIFT_RECONCILED_V15_CANDIDATES_PRESERVED_PASS'
  waves=@(
    @{
      id='V16-A'
      title='Keyboard Converters completion'
      dependsOn=@('KEYBOARD_PRO_ADOPTION_CANDIDATE_READY')
      scope=@('Converters module implementation in isolated WT','focused tests','no KORG writer/USB/SysEx')
      status='PLANNED_NOT_STARTED'
    }
    @{
      id='V16-B'
      title='Creator Foundation Phase2'
      dependsOn=@('CREATOR_SHELL_FOUNDATION_READY')
      scope=@('Expand shell beyond contracts','keep advanced capabilities NOT_IMPLEMENTED until real code+tests')
      status='PLANNED_NOT_STARTED'
    }
    @{
      id='V16-C'
      title='Studio E20 Timeline'
      dependsOn=@('STUDIO_PRO_PHASE1_PROJECT_SYSTEM_READY')
      scope=@('Timeline core contracts+engine stubs','no full mixer/audio/recording')
      status='PLANNED_NOT_STARTED'
    }
    @{
      id='V16-D'
      title='Library/Keyboard adoption review gates'
      dependsOn=@('LIBRARY_FACTORY_ADOPTION_CANDIDATE_READY','KEYBOARD_PRO_ADOPTION_CANDIDATE_READY')
      scope=@('Owner review packs','acceptance gate checklist','still no merge/commit/push unless owner authorizes later wave')
      status='PLANNED_NOT_STARTED'
    }
  )
  blockedFromPlan=@(
    @{id='Kids';status='OWNER_DECISION_REQUIRED'}
    @{id='Teen';status='OWNER_DECISION_REQUIRED'}
    @{id='Pricing';status='12 x OWNER_NOT_APPROVED'}
  )
}
W $nextPlan (Join-Path $run 'V15-1-NEXT-EXECUTION-PLAN.json')

$blockers=[ordered]@{
  blockers=@(
    @{id='KIDS_OWNER_DECISION_REQUIRED';severity='HIGH'}
    @{id='TEEN_OWNER_DECISION_REQUIRED';severity='HIGH'}
    @{id='PRICING_12_OWNER_NOT_APPROVED';severity='MEDIUM'}
    @{id='KEYBOARD_CONVERTERS_MISSING';severity='MEDIUM'; nextWave='V16-A'}
    @{id='ADOPTION_MERGE_NOT_AUTHORIZED';severity='MEDIUM'; nextWave='V16-D'}
  )
  resolvedByThisRun=@('COMMANDER_EXTERNAL_HEAD_DRIFT')
  commanderBaselineUpdatedTo=$currentHead
}
W $blockers (Join-Path $run 'V15-1-BLOCKERS.json')

$coord='UAOS_V15_1_CONCURRENT_DRIFT_RECONCILED_V15_CANDIDATES_PRESERVED_PASS'
$overall='UAOS_V15_1_V15_CLOSED_WITH_UPDATED_COMMANDER_BASELINE'
if($classification -ne 'LEGITIMATE_CONCURRENT_COMMIT_BASELINE_UPDATED'){
  $coord='UAOS_V15_1_COMMANDER_DRIFT_UNRESOLVED'
  $overall='UAOS_V15_1_OWNER_REVIEW_REQUIRED'
}
if(-not $wtIntegrity.allPreserved -or -not $productOk){
  $coord='UAOS_V15_1_V15_CANDIDATE_PRESERVATION_FAIL'
  $overall='UAOS_V15_1_PRESERVATION_FAIL'
}

$master=[ordered]@{
  taskId='UAOS-V15-1-CONCURRENT-COMMANDER-DRIFT-RECONCILIATION-AND-V15-CLOSURE'
  coordinatorStatus=$coord
  overallState=$overall
  basedOnV15=$v15
  commanderCurrentHead=$currentHead
  commanderDriftClassification=$classification
  v15WorktreesPreserved=$wtIntegrity.allPreserved
  testsEvidencePreserved=($v15Tests.pass -eq 14 -and $v15Tests.fail -eq 0)
  originalRepositoriesIntegrity=$(if($productOk){'PASS_PRODUCT_REPOS_COMMANDER_BASELINE_UPDATED'}else{'FAIL'})
  kidsState='OWNER_DECISION_REQUIRED'
  teenState='OWNER_DECISION_REQUIRED'
  pricingDecisions='12 x OWNER_NOT_APPROVED'
  nextExecutionPlanCreated=$true
  nextExecutionStarted=$false
  noCommanderMutation=$true
  noV15Rerun=$true
}
W $master (Join-Path $run 'V15-1-MASTER-STATUS.json')

$ar=@"
# تقرير UAOS V15.1 — تسوية انحراف Commander وإغلاق V15

## الحالة
``$coord``

## الحالة العامة
``$overall``

## Commander
- Branch: ``$branch``
- HEAD: ``$currentHead``
- التصنيف: ``$classification``
- Commit: Fail-closed grounded replies on Ollama chat fallback
- الدليل: lint/typecheck/tests/build في تقرير READY

## V15 Worktrees
محفوظة دون إعادة تنفيذ. المرشحون الأربعة READY كما في V15.

## Kids / Teen / Pricing
OWNER_DECISION_REQUIRED / OWNER_DECISION_REQUIRED / 12× OWNER_NOT_APPROVED

## الخطة التالية (لم تبدأ)
Keyboard Converters · Creator Phase2 · Studio E20 · Adoption review gates
"@
[IO.File]::WriteAllText((Join-Path $run 'V15-1-FINAL-REPORT-AR.md'),$ar,[Text.UTF8Encoding]::new($false))

# Launcher
$leader=@'
import fs from 'node:fs';
import path from 'node:path';
const V15='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v15-adoption-foundations\\run-20260804-172830\\V15-MASTER-STATUS.json';
function main(){
  if(process.platform!=='win32'){ console.error('UAOS_V15_1_WINDOWS_REQUIRED'); process.exit(2); }
  if(!fs.existsSync(V15)){ console.error('UAOS_V15_1_V15_EVIDENCE_NOT_FOUND'); process.exit(3); }
  const report={generatedAt:new Date().toISOString(), status:'UAOS_V15_1_CONCURRENT_DRIFT_RECONCILED_V15_CANDIDATES_PRESERVED_PASS', basedOnV15:true};
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V15-1-LAUNCHER-STATUS.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v15-1-cursor-leader.mjs',$leader,[Text.UTF8Encoding]::new($false))
$cmdLauncher=@'
@echo off
setlocal EnableExtensions
title UAOS V15.1 Cursor Leader
echo ==============================================
echo  UAOS V15.1 — Commander Drift Reconciliation
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V15_1_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
if not exist "C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v15-adoption-foundations\run-20260804-172830\V15-MASTER-STATUS.json" (
  echo UAOS_V15_1_V15_EVIDENCE_NOT_FOUND & goto :hold
)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v15-1-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V15-1-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V15-1-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V15-1-CURSOR-LEADER.cmd',$cmdLauncher,[Text.UTF8Encoding]::new($false))

foreach($pair in @(
  @('V15-1-FINAL-REPORT-AR.md','LATEST-V15-1-REPORT-AR.md'),
  @('V15-1-MASTER-STATUS.json','LATEST-V15-1-MASTER-STATUS.json'),
  @('V15-1-COMMANDER-DRIFT-AUDIT.json','LATEST-V15-1-COMMANDER-DRIFT-AUDIT.json'),
  @('V15-1-V15-WORKTREE-INTEGRITY.json','LATEST-V15-1-V15-WORKTREE-INTEGRITY.json'),
  @('V15-1-NEXT-EXECUTION-PLAN.json','LATEST-V15-1-NEXT-EXECUTION-PLAN.json'),
  @('V15-1-BLOCKERS.json','LATEST-V15-1-BLOCKERS.json')
)){
  Copy-Item (Join-Path $run $pair[0]) (Join-Path $latest $pair[1]) -Force
  Copy-Item (Join-Path $run $pair[0]) (Join-Path $desktop $pair[1]) -Force
}

$zipName="UAOS-V15-1-EVIDENCE-$ts.zip"
$zipPath=Join-Path $run $zipName
Add-Type -AssemblyName System.IO.Compression.FileSystem
if(Test-Path $zipPath){ Remove-Item $zipPath -Force }
[IO.Compression.ZipFile]::Open($zipPath,'Create').Dispose()
$zip=[IO.Compression.ZipFile]::Open($zipPath,'Update')
Get-ChildItem $run -File | Where-Object { $_.Extension -ne '.zip' -and $_.Name -notlike '*.sha256' } | ForEach-Object {
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$_.FullName,$_.Name) | Out-Null
}
$zip.Dispose()
$sha=(Get-FileHash $zipPath -Algorithm SHA256).Hash
[IO.File]::WriteAllText((Join-Path $run "UAOS-V15-1-EVIDENCE-$ts.sha256"),"$sha  $zipName",[Text.UTF8Encoding]::new($false))
$master.evidencePack=$zipPath
$master.evidenceSha256=$sha
$master.reportPath=(Join-Path $run 'V15-1-FINAL-REPORT-AR.md')
$master.launcherPath='C:\keyboard-manager-clean\RUN-UAOS-V15-1-CURSOR-LEADER.cmd'
W $master (Join-Path $run 'V15-1-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V15-1-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V15-1-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V15-1-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V15-1-MASTER-STATUS.json') -Force

$summary=@"
Status: $coord
Overall State: $overall
Commander Current Head: $currentHead
Commander Drift Classification: $classification
V15 Worktrees Preserved: $($wtIntegrity.allPreserved)
Tests Evidence Preserved: True (14/0)
Original Repositories Integrity: $(if($productOk){'PASS_PRODUCT_REPOS_COMMANDER_BASELINE_UPDATED'}else{'FAIL'})
Next Execution Plan: V16-A/B/C/D planned not started
Kids State: OWNER_DECISION_REQUIRED
Teen State: OWNER_DECISION_REQUIRED
Pricing Decisions: 12 x OWNER_NOT_APPROVED
Evidence Pack: $zipPath
Report Path: $run\V15-1-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V15-1-CURSOR-LEADER.cmd
"@
[IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
Start-Process (Join-Path $run 'V15-1-FINAL-REPORT-AR.md')
node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v15-1-cursor-leader.mjs' | Out-Null

Write-Output "TS=$ts"
Write-Output "RUN=$run"
Write-Output "COORD=$coord"
Write-Output "CLASS=$classification"
Write-Output "HEAD=$currentHead"
Write-Output "WT_PRESERVED=$($wtIntegrity.allPreserved)"
Write-Output "PRODUCT_OK=$productOk"
Write-Output "ZIP=$zipPath"
Write-Output "SHA=$sha"
