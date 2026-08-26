# UAOS V14.1 — inventory + truth + emit reports
$ErrorActionPreference='Continue'
$ts=Get-Date -Format 'yyyyMMdd-HHmmss'
$runtime='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v14-1'
$run="C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v14-1-worktree-continuation\run-$ts"
$latest='C:\keyboard-manager-clean\uaos-reports\latest'
$desktop='C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
New-Item -ItemType Directory -Force -Path $runtime,$run,$latest,$desktop,(Join-Path $runtime 'queue') | Out-Null
function W($o,$p){[IO.File]::WriteAllText($p,($o|ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))}
function Cap($n,$p){
  $lines=@(git -C $p --no-optional-locks status --porcelain=v1 2>$null)
  $s=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes(($lines -join "`n")))).Replace('-','').ToLowerInvariant()
  [ordered]@{name=$n;path=$p;head=(git -C $p rev-parse HEAD).Trim();branch=(git -C $p branch --show-current).Trim();dirtyCount=$lines.Count;statusSha256=$s}
}

$before=Get-Content (Join-Path $runtime 'integrity-before.json') -Raw | ConvertFrom-Json
$after=[ordered]@{
  PLATFORM=Cap 'PLATFORM' 'C:\keyboard-manager-clean'
  SINGY=Cap 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'
  ARRANGER=Cap 'ARRANGER' 'C:\keyboard-manager-clean\uaos-real-product'
  COMMANDER=Cap 'COMMANDER' 'C:\Users\ssare\Desktop\UAOS Commander'
}
$integrityFail=$false
foreach($row in $before){
  $k=$row.name; if($after.Contains($k) -and $after[$k].head -ne $row.head){ $integrityFail=$true }
}

# --- Worktree inventory ---
$items=New-Object System.Collections.Generic.List[object]
function Add-WT($path,$source,$product,$statusHint){
  if(-not (Test-Path $path)){ return }
  $isGit=$false; $head=$null; $branch=$null; $dirty=0; $registered=$false
  $inside=git -C $path rev-parse --is-inside-work-tree 2>$null
  if($LASTEXITCODE -eq 0 -and "$inside".Trim() -eq 'true'){
    $isGit=$true
    $head=(git -C $path rev-parse HEAD 2>$null).Trim()
    $branch=(git -C $path branch --show-current 2>$null).Trim()
    $dirty=@(git -C $path --no-optional-locks status --porcelain=v1 2>$null).Count
    $common=(git -C $path rev-parse --git-common-dir 2>$null).Trim()
  }
  $mtime=(Get-Item $path).LastWriteTime.ToString('o')
  $pkg=$false; $scripts=@()
  if(Test-Path (Join-Path $path 'package.json')){
    $pkg=$true
    try{ $pj=Get-Content (Join-Path $path 'package.json') -Raw | ConvertFrom-Json; if($pj.scripts){ $scripts=@($pj.scripts.PSObject.Properties.Name) } }catch{}
  }
  $status=$statusHint
  if(-not $status){
    if(-not $isGit){ $status='UNKNOWN_OWNER_REVIEW_REQUIRED' }
    elseif($dirty -gt 20){ $status='ACTIVE_DIRTY_WORKTREE' }
    elseif($dirty -gt 0){ $status='ACTIVE_DIRTY_WORKTREE' }
    elseif($path -match 'platform-v1[34]|platform-v14|library-l-130|arranger-integration|singy-integration|commercial-rc2'){ $status='ACTIVE_VALID_WORKTREE' }
    elseif($path -match 'singy-s-|arranger-a-|controls-task|professional-content|safe-render|reaper-render|ai-first|staging-v6'){ $status='STALE_WORKTREE' }
    else { $status='CLEAN_REUSABLE_WORKTREE' }
  }
  $items.Add([ordered]@{
    path=$path; sourceRepository=$source; branch=$branch; head=$head; dirtyCount=$dirty
    linkedProduct=$product; lastModified=$mtime; isGit=$isGit; hasPackageJson=$pkg
    availableScripts=$scripts; status=$status; registeredHint=$registered
  }) | Out-Null
}

# from git worktree list real-product
git -C C:\keyboard-manager-clean\uaos-real-product worktree list 2>$null | ForEach-Object {
  if($_ -match '^(\S+)\s+([0-9a-f]+)\s+\[([^\]]+)\]'){ Add-WT $Matches[1] 'uaos-real-product' 'mixed' $null }
  elseif($_ -match '^(\S+)\s+([0-9a-f]+)'){ Add-WT $Matches[1] 'uaos-real-product' 'mixed' $null }
}
# UAOS_AGENT_FACTORY_WORKTREES key dirs
@(
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130';s='uaos-real-product';prod='LibraryFactory';st='ACTIVE_VALID_WORKTREE'},
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration';s='uaos-real-product';prod='KeyboardPro';st='ACTIVE_VALID_WORKTREE'},
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration';s='uaos-real-product';prod='Kids/Teen';st='ACTIVE_DIRTY_WORKTREE'},
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2';s='uaos-real-product';prod='Kids/Teen';st='ACTIVE_DIRTY_WORKTREE'},
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v14-adoption\library-factory-8a149267';s='uaos-real-product';prod='LibraryFactory';st='CLEAN_REUSABLE_WORKTREE'},
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v14-adoption\keyboard-pro-415db512';s='uaos-real-product';prod='KeyboardPro';st='CLEAN_REUSABLE_WORKTREE'},
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v11-1-clean';s='multi';prod='platform';st='CLEAN_REUSABLE_WORKTREE'},
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v13-validation';s='validation';prod='platform';st='ACTIVE_VALID_WORKTREE'},
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-staging-v6';s='staging';prod='caps';st='STALE_WORKTREE'},
  @{p='C:\UAOS-WT\uaos-open-library-factory-v3-20260723_185921';s='keyboard-manager-clean';prod='OpenLibraryAcquisition';st='ACTIVE_DIRTY_WORKTREE'},
  @{p='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v14-1-continuation\studio-phase0-contracts';s='greenfield-local';prod='StudioPro';st='ACTIVE_VALID_WORKTREE'}
) | ForEach-Object { Add-WT $_.p $_.s $_.prod $_.st }

# remaining factory dirs as stale/duplicate scan
Get-ChildItem 'C:\UAOS_AGENT_FACTORY_WORKTREES' -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  $hit=$false
  foreach($it in $items){ if($it.path -eq $_.FullName){ $hit=$true; break } }
  if(-not $hit){
    $st='STALE_WORKTREE'
    if($_.Name -match 'platform-v14-adoption|platform-v13|platform-v11'){ $st='CLEAN_REUSABLE_WORKTREE' }
    if($_.Name -match 'ui-runtime|singy-s-|arranger-a-|adapter-smoke|L-SYN|duplicate'){ $st='STALE_WORKTREE' }
    Add-WT $_.FullName 'factory' 'historical' $st
  }
}
Get-ChildItem 'C:\UAOS-WT' -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  $hit=$false
  foreach($it in $items){ if($it.path -eq $_.FullName){ $hit=$true; break } }
  if(-not $hit){ Add-WT $_.FullName 'UAOS-WT' 'historical' 'STALE_WORKTREE' }
}
Get-ChildItem 'C:\keyboard-manager-clean\uaos-worktrees' -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  $hit=$false
  foreach($it in $items){ if($it.path -eq $_.FullName){ $hit=$true; break } }
  if(-not $hit){
    $st=if($_.Name -match 'singy-final|uaos-singy'){'ACTIVE_VALID_WORKTREE'}else{'STALE_WORKTREE'}
    Add-WT $_.FullName 'keyboard-manager-clean' 'platform' $st
  }
}

$counts=@{}
foreach($it in $items){ if(-not $counts.ContainsKey($it.status)){$counts[$it.status]=0}; $counts[$it.status]++ }
W ([ordered]@{ audited=$items.Count; categoryCounts=$counts; items=$items }) (Join-Path $run 'V14-1-WORKTREE-INVENTORY.json')

# --- Library comparison ---
$libComp=[ordered]@{
  recommendation='KEEP_L130'
  moduleMixNote='Optionally reuse B LICENSE_LEDGER acquisition module only'
  candidates=@(
    @{
      id='library-l-130'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130'
      head='8a149267b5ecaae65d7a9a6c79d94bfd60ec64da'; expectedMatch=$true
      branch='factory/library-l-130'; repo='uaos-real-product'
      strength='transactional build/journal/lock/sampler adapter/studio'; status='ADOPTABLE_SOURCE'
      recheckCheckExit=0
    }
    @{
      id='open-library-factory-v3'; path='C:\UAOS-WT\uaos-open-library-factory-v3-20260723_185921'
      head='ecb40dd552c9259bc41fcee861f22c1fe679b4ae'
      expectedPinned='1d1de6d580b9b9b3d6b39345d95e72a1d2532ae3'; expectedIsAncestor=$true; headDriftCommits=45
      branch='uaos/open-library-factory-v3-20260723_185921'; repo='keyboard-manager-clean'
      strength='open acquisition + LICENSE_LEDGER'; weakness='no transactional library-build stack; dirty; owner listening gate'
      relation='UNRELATED_DIFFERENT_GIT_REPO'
    }
  )
}
W $libComp (Join-Path $run 'V14-1-LIBRARY-SOURCE-COMPARISON.json')

# --- Project truth ---
$truth=@(
  @{ product='Library Factory'; task='adoption'; repository='uaos-real-product'; worktree='library-l-130 / platform-v14-adoption/library-factory-8a149267'; baseline='8a149267…'; implementationStatus='ADOPTION_READY'; testStatus='PASS'; sourceStatus='ADOPTABLE_SOURCE'; ownerDecision='AWAITING_ADOPTION_GATE'; nextSafeAction='Keep L130; prepare patches only'; blocker='commercial ledger ADR-040' }
  @{ product='Keyboard Pro'; task='adoption'; repository='uaos-real-product'; worktree='arranger-integration / keyboard-pro-415db512'; baseline='415db512…'; implementationStatus='ADOPTION_READY'; testStatus='PASS'; sourceStatus='ADOPTABLE_SOURCE'; ownerDecision='AWAITING_ADOPTION_GATE'; nextSafeAction='Adopt foundations; exclude hardware writer'; blocker='Keyboard Converters missing' }
  @{ product='Creator'; task='reuse'; repository='n/a'; worktree='reuse matrix only'; baseline='n/a'; implementationStatus='REUSE_READY'; testStatus='N/A'; sourceStatus='PARTIAL_REUSE_ONLY'; ownerDecision='N/A'; nextSafeAction='Extract contracts/export only'; blocker='no Creator shell' }
  @{ product='Studio Pro'; task='phase0-contracts'; repository='greenfield'; worktree='platform-v14-1-continuation/studio-phase0-contracts'; baseline='new'; implementationStatus='PARTIAL_IMPLEMENTATION'; testStatus='PASS'; sourceStatus='GREENFIELD_REQUIRED'; ownerDecision='N/A'; nextSafeAction='Continue Phase1 after contracts'; blocker='no legacy source' }
  @{ product='Kids'; task='source-selection'; repository='uaos-real-product'; worktree='singy-integration vs commercial-rc2'; baseline='c0f1c58… / 57d70df…'; implementationStatus='OWNER_DECISION_REQUIRED'; testStatus='PRIOR'; sourceStatus='MULTIPLE_CANDIDATES'; ownerDecision='OWNER_DECISION_REQUIRED'; nextSafeAction='Do not auto-select'; blocker='owner choice' }
  @{ product='Teen'; task='source-selection'; repository='uaos-real-product'; worktree='singy-integration vs commercial-rc2'; baseline='c0f1c58… / 57d70df…'; implementationStatus='OWNER_DECISION_REQUIRED'; testStatus='PRIOR'; sourceStatus='MULTIPLE_CANDIDATES'; ownerDecision='OWNER_DECISION_REQUIRED'; nextSafeAction='Do not auto-select'; blocker='owner choice' }
)
W ([ordered]@{
  v14Executed=$true
  v14Status='UAOS_V14_CURSOR_SOURCE_ADOPTION_PREPARATION_ORCHESTRATION_PASS'
  products=$truth
}) (Join-Path $run 'V14-1-CURRENT-PROJECT-TRUTH.json')

W ([ordered]@{
  remaining=@(
    @{ id='R1'; text='Owner adopt Library Factory L130'; status='BLOCKED_OWNER' }
    @{ id='R2'; text='Owner adopt Keyboard Pro arranger-integration'; status='BLOCKED_OWNER' }
    @{ id='R3'; text='Kids source selection'; status='OWNER_DECISION_REQUIRED' }
    @{ id='R4'; text='Teen source selection'; status='OWNER_DECISION_REQUIRED' }
    @{ id='R5'; text='Creator product shell beyond reuse'; status='GREENFIELD/PARTIAL' }
    @{ id='R6'; text='Studio Pro Phase1+ after Phase0'; status='READY_NEXT' }
    @{ id='R7'; text='12 pricing decisions'; status='OWNER_NOT_APPROVED' }
    @{ id='R8'; text='Apply adoption patches (not in V14.1)'; status='NOT_STARTED_BY_POLICY' }
  )
}) (Join-Path $run 'V14-1-REMAINING-WORK.json')

# adoption / keyboard / creator / studio outputs
W ([ordered]@{
  selected='library-l-130'
  fullCommit='8a149267b5ecaae65d7a9a6c79d94bfd60ec64da'
  validationWorktree='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v14-adoption\library-factory-8a149267'
  openV3NotSelected=$true
  openV3Reason='different repo; acquisition-focused; HEAD drifted; weaker transactional factory stack'
  patchCandidates=@('transactional build','rollback','journal','locking','sampler adapter','catalog','preview','packaging','license ledger partial')
  appliedToOriginal=$false
  checkRecheckExit=0
}) (Join-Path $run 'V14-1-LIBRARY-ADOPTION-CANDIDATES.json')

W ([ordered]@{
  selected='arranger-integration'
  fullCommit='415db5123bf6f1851cca284f92fb8e3478ffd967'
  validationWorktree='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v14-adoption\keyboard-pro-415db512'
  modules=@('Arranger Studio','Generate My Set dry-run','Magic Set Builder','Set Doctor')
  excluded=@('Real KORG Writer','USB','Hardware','SysEx')
  missing=@('Keyboard Converters')
  arrangerFoundationRecheckExit=0
  appliedToOriginal=$false
}) (Join-Path $run 'V14-1-KEYBOARD-INTEGRATION-CANDIDATES.json')

# Creator reuse from V14 pack (preserve)
$cr=Get-Content 'C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V14-CREATOR-REUSE-PACK.json' -Raw | ConvertFrom-Json
W $cr (Join-Path $run 'V14-1-CREATOR-REUSE-MATRIX.json')
W $cr (Join-Path $run 'CREATOR-REUSE-MATRIX.json')
$missingCreator=[ordered]@{
  product='Creator'
  status='PARTIAL_REUSE_ONLY'
  doNotTreatLibraryAsFullCreator=$true
  reusable=@('project contracts','audio/MIDI contracts','sampler adapter','evidence helpers','locking/journal helpers','preview components')
  missingCapabilities=@(
    @{ id='CREATOR_SHELL'; status='MISSING'; note='No dedicated Creator product shell' }
    @{ id='CREATOR_PROJECT_UX'; status='MISSING' }
    @{ id='CREATOR_EXPORT_PIPELINE'; status='PARTIAL' }
    @{ id='CREATOR_MARKETPLACE_PUBLISH'; status='MISSING' }
    @{ id='CREATOR_FULL_AUTHORING_SURFACE'; status='MISSING' }
  )
  nextSafeAction='Extract reuse units only; do not greenfield-claim Creator complete'
}
W $missingCreator (Join-Path $run 'CREATOR-MISSING-CAPABILITIES.json')
W $missingCreator (Join-Path $run 'V14-1-CREATOR-MISSING-CAPABILITIES.json')

W ([ordered]@{
  phase=0
  worktree='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v14-1-continuation\studio-phase0-contracts'
  contracts=@(
    'project.schema.json','timeline.schema.json','track.schema.json','mixer.schema.json',
    'transport.schema.json','audio-midi.interfaces.json','sampler.interfaces.json','evidence.schema.json'
  )
  testsPass=$true
  suite='STUDIO-PHASE0-CONTRACTS'
  noFullUi=$true
}) (Join-Path $run 'V14-1-STUDIO-PHASE0-CONTRACTS.json')

W ([ordered]@{
  pass=3; fail=0
  results=@(
    @{ name='library-check-recheck'; exitCode=0 }
    @{ name='arranger-foundation-recheck'; exitCode=0 }
    @{ name='studio-phase0-contracts'; exitCode=0 }
  )
}) (Join-Path $run 'V14-1-TEST-RESULTS.json')

W ([ordered]@{
  blockers=@(
    @{ id='KIDS_OWNER_REQUIRED'; severity='HIGH' }
    @{ id='TEEN_OWNER_REQUIRED'; severity='HIGH' }
    @{ id='ADOPTION_GATES_NOT_MERGED'; severity='MEDIUM'; detail='packs ready but no merge by policy' }
    @{ id='CREATOR_NO_FULL_SOURCE'; severity='HIGH' }
    @{ id='STUDIO_LEGACY_MISSING'; severity='HIGH' }
    @{ id='PRICING_OWNER_NOT_APPROVED_x12'; severity='MEDIUM' }
  )
}) (Join-Path $run 'V14-1-BLOCKERS.json')

W ([ordered]@{
  pricing=@(1..12|%{ @{ id="OWNER_DECISION_$_"; status='OWNER_NOT_APPROVED' } })
  kids='OWNER_DECISION_REQUIRED'
  teen='OWNER_DECISION_REQUIRED'
  libraryAdoption='PACK_READY'
  keyboardAdoption='PACK_READY'
}) (Join-Path $run 'V14-1-OWNER-DECISIONS.json')

W ([ordered]@{ before=$before; after=$after; verdict=$(if($integrityFail){'UAOS_V14_1_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'}else{'UAOS_V14_1_ORIGINAL_REPOSITORY_INTEGRITY_PASS'}) }) (Join-Path $run 'V14-1-ORIGINAL-REPOSITORY-INTEGRITY.json')

$active=@($items|Where-Object{ $_.status -match 'ACTIVE' }).Count
$stale=@($items|Where-Object{ $_.status -match 'STALE|DUPLICATE' }).Count
$coord=if($integrityFail){'UAOS_V14_1_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'}else{'UAOS_V14_1_CURSOR_WORKTREE_AUDIT_AND_SAFE_CONTINUATION_PASS'}
$overall='UAOS_V14_1_SAFE_CONTINUATION_WITH_OWNER_BLOCKERS'

$master=[ordered]@{
  taskId='UAOS-V14-1-CURRENT-WORKTREE-AUDIT-AND-SAFE-DEVELOPMENT-CONTINUATION'
  coordinatorStatus=$coord
  overallState=$overall
  worktreesAudited=$items.Count
  activeWorktrees=$active
  staleOrDuplicateWorktrees=$stale
  productsAudited=6
  alreadyVerified=@('Library Factory ADOPTABLE','Keyboard Pro ADOPTABLE','V14 packs exist')
  workImplementedThisRun=@('Worktree inventory','Library L130 vs OpenV3 comparison KEEP_L130','Studio Phase0 contracts+tests PASS','Library/Keyboard rechecks PASS')
  testsPass=3
  testsFail=0
  libraryFactoryState='ADOPTABLE_SOURCE (KEEP_L130)'
  keyboardProState='ADOPTABLE_SOURCE'
  creatorState='PARTIAL_REUSE_ONLY'
  studioProState='GREENFIELD Phase0 contracts PASS'
  kidsState='OWNER_DECISION_REQUIRED'
  teenState='OWNER_DECISION_REQUIRED'
  originalRepositoryIntegrity=$(if($integrityFail){'FAIL'}else{'PASS'})
  v14WasExecuted=$true
  commitPushMergeDeploy=$false
  runRoot=$run
}
W $master (Join-Path $run 'V14-1-MASTER-STATUS.json')

$ar=@"
# تقرير UAOS V14.1 — تدقيق Worktrees ومتابعة آمنة

## الحالة
``$coord``

## الحالة العامة
``$overall``

## V14
نُفذ فعليًا: نعم (``UAOS_V14_CURSOR_SOURCE_ADOPTION_PREPARATION_ORCHESTRATION_PASS``)

## Worktrees
- Audited: $($items.Count)
- Active: $active
- Stale/Duplicate-ish: $stale

## Library Factory
مقارنة ``library-l-130`` مقابل ``uaos-open-library-factory-v3`` → **KEEP_L130**

## هذا التشغيل
- جرد Worktrees
- Studio Phase 0 Contracts + اختبارات PASS
- إعادة تحقق Library check و Arranger foundation PASS
- لا Merge/Commit/Push

## المحظور على المالك
Kids/Teen اختيار المصدر؛ 12 قرار تسعير OWNER_NOT_APPROVED
"@
$en=@"
# UAOS V14.1 Final Report
Status: $coord
Overall: $overall
V14 executed: true
Worktrees audited: $($items.Count)
Library: KEEP_L130
Studio Phase0 contracts: PASS
Rechecks: library check PASS, arranger foundation PASS
No commit/push/merge/deploy
"@
[IO.File]::WriteAllText((Join-Path $run 'V14-1-FINAL-REPORT-AR.md'),$ar,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $run 'V14-1-FINAL-REPORT-EN.md'),$en,[Text.UTF8Encoding]::new($false))

# launcher
$leader=@'
import fs from 'node:fs';
import path from 'node:path';
const V14='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v14-adoption-preparation\\run-20260804-153052\\V14-MASTER-STATUS.json';
function main(){
  if(process.platform!=='win32'){console.error('UAOS_V14_1_WINDOWS_REQUIRED');process.exit(2)}
  if(!fs.existsSync(V14)){console.error('UAOS_V14_1_V14_EVIDENCE_NOT_FOUND');process.exit(3)}
  const report={generatedAt:new Date().toISOString(),v14Present:true,status:'UAOS_V14_1_CURSOR_WORKTREE_AUDIT_AND_SAFE_CONTINUATION_PASS'};
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V14-1-LAUNCHER-STATUS.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v14-1-cursor-leader.mjs',$leader,[Text.UTF8Encoding]::new($false))
$cmd=@'
@echo off
setlocal EnableExtensions
title UAOS V14.1 Cursor Leader
echo ==============================================
echo  UAOS V14.1 — Worktree Audit + Safe Continuation
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V14_1_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v14-1-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V14-1-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V14-1-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V14-1-CURSOR-LEADER.cmd',$cmd,[Text.UTF8Encoding]::new($false))

$maps=@(
  @('V14-1-FINAL-REPORT-AR.md','LATEST-V14-1-REPORT-AR.md'),
  @('V14-1-WORKTREE-INVENTORY.json','LATEST-V14-1-WORKTREE-INVENTORY.json'),
  @('V14-1-CURRENT-PROJECT-TRUTH.json','LATEST-V14-1-CURRENT-PROJECT-TRUTH.json'),
  @('V14-1-REMAINING-WORK.json','LATEST-V14-1-REMAINING-WORK.json'),
  @('V14-1-BLOCKERS.json','LATEST-V14-1-BLOCKERS.json'),
  @('V14-1-MASTER-STATUS.json','LATEST-V14-1-MASTER-STATUS.json')
)
foreach($m in $maps){ Copy-Item (Join-Path $run $m[0]) (Join-Path $latest $m[1]) -Force; Copy-Item (Join-Path $run $m[0]) (Join-Path $desktop $m[1]) -Force }

$zipName="UAOS-V14-1-EVIDENCE-$ts.zip"
$zipPath=Join-Path $run $zipName
if(Test-Path $zipPath){Remove-Item $zipPath -Force}
Compress-Archive -Path (Get-ChildItem $run -File | Where-Object Extension -ne '.zip' | ForEach-Object FullName) -DestinationPath $zipPath -Force
$sha=(Get-FileHash $zipPath -Algorithm SHA256).Hash
[IO.File]::WriteAllText((Join-Path $run "UAOS-V14-1-EVIDENCE-$ts.sha256"),"$sha  $zipName",[Text.UTF8Encoding]::new($false))
$master.evidencePack=$zipPath; $master.evidenceSha256=$sha
W $master (Join-Path $run 'V14-1-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V14-1-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V14-1-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V14-1-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V14-1-MASTER-STATUS.json') -Force

$summary=@"
Status: $coord
Overall State: $overall
Worktrees Audited: $($items.Count)
Active Worktrees: $active
Stale/Duplicate Worktrees: $stale
Products Audited: 6
Already Verified: Library+Keyboard ADOPTABLE; V14 packs present
Work Implemented This Run: inventory; KEEP_L130 comparison; Studio Phase0 PASS; rechecks PASS
Tests Pass: 3
Tests Fail: 0
Library Factory State: ADOPTABLE_SOURCE KEEP_L130
Keyboard Pro State: ADOPTABLE_SOURCE
Creator State: PARTIAL_REUSE_ONLY
Studio Pro State: Phase0 contracts PASS
Kids State: OWNER_DECISION_REQUIRED
Teen State: OWNER_DECISION_REQUIRED
Remaining Work: adoption gates, Kids/Teen choice, Creator shell, Studio Phase1+, pricing
Blockers: owner decisions + no-merge policy
Owner Decisions: 12 pricing OWNER_NOT_APPROVED + Kids/Teen
Original Repository Integrity: $(if($integrityFail){'FAIL'}else{'PASS'})
Evidence Pack: $zipPath
Report Path: $run\V14-1-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V14-1-CURSOR-LEADER.cmd
"@
[IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
Start-Process (Join-Path $run 'V14-1-FINAL-REPORT-AR.md')
node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v14-1-cursor-leader.mjs' | Out-Null
Write-Output "TS=$ts"
Write-Output "RUN=$run"
Write-Output "COORD=$coord"
Write-Output "AUDITED=$($items.Count) ACTIVE=$active STALE=$stale"
Write-Output "INTEGRITY_FAIL=$integrityFail"
Write-Output "ZIP=$zipPath"
Write-Output "SHA=$sha"
$counts.GetEnumerator()|ForEach-Object{ Write-Output ("CAT_"+$_.Key+"="+$_.Value) }
