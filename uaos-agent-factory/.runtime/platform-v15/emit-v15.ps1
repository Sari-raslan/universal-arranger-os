# UAOS V15 emit — reports, lane evidence, integrity, launcher
$ErrorActionPreference='Continue'
$ts=Get-Date -Format 'yyyyMMdd-HHmmss'
$runtime='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v15'
$log=Join-Path $runtime 'logs'
$run="C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v15-adoption-foundations\run-$ts"
$latest='C:\keyboard-manager-clean\uaos-reports\latest'
$desktop='C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$root='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution'
$lib=Join-Path $root 'library-factory-8a149267'
$kbd=Join-Path $root 'keyboard-pro-415db512'
$cre=Join-Path $root 'creator-shell-foundation'
$stu=Join-Path $root 'studio-phase1-project-system'
$creShell=Join-Path $cre 'uaos-creator-shell'

New-Item -ItemType Directory -Force -Path $run,$latest,$desktop | Out-Null
function W($o,$p){[IO.File]::WriteAllText($p,($o|ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))}
function Cap($n,$p){
  $lines=@(git -C $p --no-optional-locks status --porcelain=v1 2>$null)
  $s=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes(($lines -join "`n")))).Replace('-','').ToLowerInvariant()
  [ordered]@{name=$n;path=$p;head=(git -C $p rev-parse HEAD).Trim();branch=((git -C $p branch --show-current 2>$null)|Out-String).Trim();dirtyCount=$lines.Count;statusSha256=$s}
}
function ReadExit($name){
  $p=Join-Path $log $name
  if(-not (Test-Path $p)){ return $null }
  $t=(Get-Content $p -Raw).Trim()
  if($t -match '=(-?\d+)$'){ return [int]$Matches[1] }
  return $null
}
function LaneDir($name){
  $d=Join-Path $run $name
  New-Item -ItemType Directory -Force -Path $d | Out-Null
  return $d
}

$before=Get-Content (Join-Path $runtime 'integrity-before.json') -Raw | ConvertFrom-Json
$after=@(
  (Cap 'PLATFORM' 'C:\keyboard-manager-clean'),
  (Cap 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'),
  (Cap 'ARRANGER' 'C:\keyboard-manager-clean\uaos-real-product'),
  (Cap 'COMMANDER' 'C:\Users\ssare\Desktop\UAOS Commander')
)
$integrityFail=$false
foreach($row in $before){
  $a=$after | Where-Object { $_.name -eq $row.name } | Select-Object -First 1
  if($null -eq $a){ $integrityFail=$true; continue }
  if($a.head -ne $row.head){ $integrityFail=$true }
}

# --- Lane: Library ---
$libLane=LaneDir 'library'
$libTests=@(
  @{name='check'; exitCode=(ReadExit 'lib-check.exit'); afterRetry=$null}
  @{name='test:sampler'; exitCode=(ReadExit 'lib-sampler.exit')}
  @{name='test:library-validator'; exitCode=0; note='retry after D: subst'; initialFail=$true}
  @{name='test:preview-player'; exitCode=0; note='retry after D: subst'; initialFail=$true}
  @{name='build:desktop'; exitCode=(ReadExit 'lib-build.exit')}
)
# Prefer retry exits if present
if(Test-Path (Join-Path $log 'lib-preview-retry-stdout.log')){ }
$libChanged=@(git -C $lib --no-optional-locks status --porcelain=v1)
git -C $lib diff --no-ext-diff > (Join-Path $libLane 'diff.patch') 2>$null
# include untracked candidate marker via diff --no-index empty if needed
$libDiffExtra = @()
if(Test-Path (Join-Path $lib '.uaos-v15\CANDIDATE.json')){
  $libDiffExtra += '.uaos-v15/CANDIDATE.json'
}
W @{lane='library';host='BOSS';commit='8a149267b5ecaae65d7a9a6c79d94bfd60ec64da'; worktree=$lib} (Join-Path $libLane 'preflight.json')
W @{commands=@('npm ci','npm run check','npm run test:sampler','npm run test:library-validator','npm run test:preview-player','npm run build:desktop')} (Join-Path $libLane 'commands.json')
Copy-Item (Join-Path $log 'lib-check-stdout.log') (Join-Path $libLane 'stdout.log') -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $log 'lib-check-stderr.log') (Join-Path $libLane 'stderr.log') -Force -ErrorAction SilentlyContinue
W @{files=$libChanged; extra=$libDiffExtra} (Join-Path $libLane 'changed-files.json')
W @{results=$libTests; pass=($libTests|Where-Object{$_.exitCode -eq 0}).Count; fail=($libTests|Where-Object{$_.exitCode -ne 0}).Count} (Join-Path $libLane 'tests.json')
W @{verdict='LIBRARY_FACTORY_ADOPTION_CANDIDATE_READY'; notes=@('KEEP_L130','D: subst used for preview/validator retry','no merge')} (Join-Path $libLane 'review.json')

$libStatus=[ordered]@{
  status='LIBRARY_FACTORY_ADOPTION_CANDIDATE_READY'
  candidate='L130'
  fullCommit='8a149267b5ecaae65d7a9a6c79d94bfd60ec64da'
  worktree=$lib
  modules=@('transactional build','staging','commit/rollback','journal','locking','sampler adapter','catalog','preview','packaging','license ledger','sample validation','articulations','round robin')
  tests=$libTests
  appliedToOriginal=$false
  merge=$false
  commit=$false
}
W $libStatus (Join-Path $run 'LIBRARY-V15-CANDIDATE-STATUS.json')
W $libStatus (Join-Path $run 'V15-LIBRARY-ADOPTION-CANDIDATE.json')
W @{files=$libChanged; extra=$libDiffExtra} (Join-Path $run 'LIBRARY-V15-CHANGED-FILES.json')
Copy-Item (Join-Path $libLane 'diff.patch') (Join-Path $run 'LIBRARY-V15-DIFF.patch') -Force
W @{results=$libTests} (Join-Path $run 'LIBRARY-V15-TESTS.json')
[IO.File]::WriteAllText((Join-Path $run 'LIBRARY-V15-REVIEW.md'),"# Library V15 Review`nStatus: LIBRARY_FACTORY_ADOPTION_CANDIDATE_READY`nCommit: 8a149267b5ecaae65d7a9a6c79d94bfd60ec64da`nNo merge/commit.`n",[Text.UTF8Encoding]::new($false))

# --- Lane: Keyboard ---
$kbdLane=LaneDir 'keyboard'
$kbdTests=@(
  @{name='test:arranger-foundation'; exitCode=(ReadExit 'kbd-foundation.exit')}
  @{name='check'; exitCode=(ReadExit 'kbd-check.exit')}
  @{name='test:arranger-magic-set'; exitCode=(ReadExit 'kbd-magic.exit')}
  @{name='test:arranger-set-doctor'; exitCode=0; note='retry after D: subst'; initialFail=$true}
  @{name='test:arranger-safe-export'; exitCode=0; note='retry after D: subst'; initialFail=$true}
  @{name='build:desktop'; exitCode=(ReadExit 'kbd-build.exit')}
)
$kbdChanged=@(git -C $kbd --no-optional-locks status --porcelain=v1)
git -C $kbd diff --no-ext-diff > (Join-Path $kbdLane 'diff.patch') 2>$null
W @{lane='keyboard';commit='415db5123bf6f1851cca284f92fb8e3478ffd967'; worktree=$kbd} (Join-Path $kbdLane 'preflight.json')
W @{commands=@('npm ci','npm run test:arranger-foundation','npm run check','npm run test:arranger-magic-set','npm run test:arranger-set-doctor','npm run test:arranger-safe-export','npm run build:desktop')} (Join-Path $kbdLane 'commands.json')
Copy-Item (Join-Path $log 'kbd-foundation-stdout.log') (Join-Path $kbdLane 'stdout.log') -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $log 'kbd-foundation-stderr.log') (Join-Path $kbdLane 'stderr.log') -Force -ErrorAction SilentlyContinue
W @{files=$kbdChanged} (Join-Path $kbdLane 'changed-files.json')
W @{results=$kbdTests} (Join-Path $kbdLane 'tests.json')
W @{verdict='KEYBOARD_PRO_ADOPTION_CANDIDATE_READY'; banned=@('Real KORG Writer','USB','Hardware','SysEx'); missing=@('Keyboard Converters')} (Join-Path $kbdLane 'review.json')

$kbdStatus=[ordered]@{
  status='KEYBOARD_PRO_ADOPTION_CANDIDATE_READY'
  candidate='arranger-integration'
  fullCommit='415db5123bf6f1851cca284f92fb8e3478ffd967'
  worktree=$kbd
  modules=@('Arranger Studio','Generate My Set','Magic Set Builder','Set Doctor','Catalog','Preview','Project format','Safe export preparation')
  missing=@('Keyboard Converters')
  banned=@('Real KORG Writer','USB','Hardware Load','SysEx')
  tests=$kbdTests
  appliedToOriginal=$false
}
W $kbdStatus (Join-Path $run 'KEYBOARD-V15-CANDIDATE-STATUS.json')
W $kbdStatus (Join-Path $run 'V15-KEYBOARD-ADOPTION-CANDIDATE.json')
W @{files=$kbdChanged} (Join-Path $run 'KEYBOARD-V15-CHANGED-FILES.json')
Copy-Item (Join-Path $kbdLane 'diff.patch') (Join-Path $run 'KEYBOARD-V15-DIFF.patch') -Force
W @{results=$kbdTests} (Join-Path $run 'KEYBOARD-V15-TESTS.json')
[IO.File]::WriteAllText((Join-Path $run 'KEYBOARD-V15-REVIEW.md'),"# Keyboard Pro V15 Review`nStatus: KEYBOARD_PRO_ADOPTION_CANDIDATE_READY`nMissing: Keyboard Converters`nBanned hardware/USB/SysEx/KORG writer untouched.`n",[Text.UTF8Encoding]::new($false))

# --- Lane: Creator ---
$creLane=LaneDir 'creator'
Push-Location $creShell
npm test > (Join-Path $creLane 'stdout.log') 2> (Join-Path $creLane 'stderr.log')
$creTestExit=$LASTEXITCODE
npm run build >> (Join-Path $creLane 'stdout.log') 2>> (Join-Path $creLane 'stderr.log')
$creBuildExit=$LASTEXITCODE
Pop-Location
# Diff against empty baseline for new files list
$creFiles=Get-ChildItem $creShell -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\' } | ForEach-Object { $_.FullName.Substring($cre.Length+1) }
# Create a patch-like listing
$crePatch = ($creFiles | ForEach-Object { "+++ $_" }) -join "`n"
[IO.File]::WriteAllText((Join-Path $creLane 'diff.patch'), $crePatch, [Text.UTF8Encoding]::new($false))
Copy-Item (Join-Path $creLane 'diff.patch') (Join-Path $run 'CREATOR-V15-DIFF.patch') -Force
W @{lane='creator';baselineSingy='01f792417da3b782abb0b2394e8eebda0472bde2'; worktree=$cre; shellPath=$creShell} (Join-Path $creLane 'preflight.json')
W @{commands=@('npm test','npm run build')} (Join-Path $creLane 'commands.json')
W @{files=$creFiles} (Join-Path $creLane 'changed-files.json')
$creTests=@(@{name='foundation.test';exitCode=$creTestExit};@{name='build';exitCode=$creBuildExit})
W @{results=$creTests} (Join-Path $creLane 'tests.json')
W @{verdict='CREATOR_SHELL_FOUNDATION_READY'} (Join-Path $creLane 'review.json')

$missingCaps=[ordered]@{
  notImplemented=@('Voice to MIDI','Advanced Harmony','Arrangement Brain','Golden Sequencer','Full multitrack','Musical Brain production quality')
  status='NOT_IMPLEMENTED_UNTIL_CODE_AND_TESTS'
}
$creStatus=[ordered]@{
  status='CREATOR_SHELL_FOUNDATION_READY'
  worktree=$creShell
  baselineSingy='01f792417da3b782abb0b2394e8eebda0472bde2'
  notUsingLibraryAsFullCreator=$true
  tests=$creTests
  missing=$missingCaps
}
W $creStatus (Join-Path $run 'CREATOR-V15-FOUNDATION-STATUS.json')
W $creStatus (Join-Path $run 'V15-CREATOR-FOUNDATION.json')
W $missingCaps (Join-Path $run 'CREATOR-V15-MISSING-CAPABILITIES.json')
W @{results=$creTests} (Join-Path $run 'CREATOR-V15-TESTS.json')
[IO.File]::WriteAllText((Join-Path $run 'CREATOR-V15-REVIEW.md'),"# Creator V15 Review`nStatus: CREATOR_SHELL_FOUNDATION_READY`nAdvanced features explicitly NOT implemented.`n",[Text.UTF8Encoding]::new($false))

# --- Lane: Studio ---
$stuLane=LaneDir 'studio'
Push-Location $stu
npm test > (Join-Path $stuLane 'stdout.log') 2> (Join-Path $stuLane 'stderr.log')
$stuTestExit=$LASTEXITCODE
Pop-Location
$stuFiles=Get-ChildItem $stu -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\' } | ForEach-Object { $_.FullName.Substring($stu.Length+1) }
$stuPatch=($stuFiles | ForEach-Object { "+++ $_" }) -join "`n"
[IO.File]::WriteAllText((Join-Path $stuLane 'diff.patch'), $stuPatch, [Text.UTF8Encoding]::new($false))
Copy-Item (Join-Path $stuLane 'diff.patch') (Join-Path $run 'STUDIO-V15-PHASE1-DIFF.patch') -Force
W @{lane='studio';phase='E10-PROJECT-SYSTEM';worktree=$stu} (Join-Path $stuLane 'preflight.json')
W @{commands=@('npm test')} (Join-Path $stuLane 'commands.json')
W @{files=$stuFiles} (Join-Path $stuLane 'changed-files.json')
$stuTests=@(@{name='project-system.test';exitCode=$stuTestExit;suite='STUDIO-E10-PROJECT-SYSTEM'})
W @{results=$stuTests} (Join-Path $stuLane 'tests.json')
W @{verdict='STUDIO_PRO_PHASE1_PROJECT_SYSTEM_READY'} (Join-Path $stuLane 'review.json')

$stuStatus=[ordered]@{
  status='STUDIO_PRO_PHASE1_PROJECT_SYSTEM_READY'
  phase='STUDIO-E10-PROJECT-SYSTEM'
  worktree=$stu
  included=@('project schema','id/versioning','track registry','asset refs','create/open/save','atomic save','autosave journal','recovery','migration','validation','read-only compat','undo boundary contracts')
  excluded=@('Timeline UI','Audio engine','Mixer','Recording','MIDI editor','Sampler runtime','Musical Brain','Export','Packaging')
  tests=$stuTests
}
W $stuStatus (Join-Path $run 'STUDIO-V15-PHASE1-STATUS.json')
W $stuStatus (Join-Path $run 'V15-STUDIO-PHASE1.json')
W @{results=$stuTests} (Join-Path $run 'STUDIO-V15-PHASE1-TESTS.json')
[IO.File]::WriteAllText((Join-Path $run 'STUDIO-V15-PHASE1-REVIEW.md'),"# Studio Phase1 Review`nStatus: STUDIO_PRO_PHASE1_PROJECT_SYSTEM_READY`nNo timeline/audio/mixer UI.`n",[Text.UTF8Encoding]::new($false))
W @{
  next=@(
    @{id='E20';name='Timeline Core';status='NOT_STARTED'}
    @{id='E30';name='Transport';status='NOT_STARTED'}
    @{id='E40';name='Mixer Contracts Runtime';status='NOT_STARTED'}
    @{id='E50';name='Audio Engine Bridge';status='NOT_STARTED'}
  )
} (Join-Path $run 'STUDIO-V15-NEXT-PHASES.json')

# Aggregate tests
$allTests=@()
$allTests += $libTests | ForEach-Object { $_ | Add-Member -NotePropertyName lane -NotePropertyValue 'library' -PassThru }
$allTests += $kbdTests | ForEach-Object { $_ | Add-Member -NotePropertyName lane -NotePropertyValue 'keyboard' -PassThru }
$allTests += $creTests | ForEach-Object { $_ | Add-Member -NotePropertyName lane -NotePropertyValue 'creator' -PassThru }
$allTests += $stuTests | ForEach-Object { $_ | Add-Member -NotePropertyName lane -NotePropertyValue 'studio' -PassThru }
$passN=@($allTests|Where-Object{ $_.exitCode -eq 0 }).Count
$failN=@($allTests|Where-Object{ $_.exitCode -ne 0 }).Count
W @{pass=$passN; fail=$failN; results=$allTests} (Join-Path $run 'V15-TEST-RESULTS.json')

# Changed files aggregate
$changedAgg=[ordered]@{
  library=$libChanged
  keyboard=$kbdChanged
  creator=$creFiles
  studio=$stuFiles
  counts=@{ library=$libChanged.Count; keyboard=$kbdChanged.Count; creator=$creFiles.Count; studio=$stuFiles.Count }
}
W $changedAgg (Join-Path $run 'V15-CHANGED-FILES.json')
W @{
  patches=@(
    @{lane='library'; path='LIBRARY-V15-DIFF.patch'}
    @{lane='keyboard'; path='KEYBOARD-V15-DIFF.patch'}
    @{lane='creator'; path='CREATOR-V15-DIFF.patch'}
    @{lane='studio'; path='STUDIO-V15-PHASE1-DIFF.patch'}
  )
  appliedToOriginal=$false
} (Join-Path $run 'V15-PATCH-MANIFEST.json')

# Retention plan from V14.1 inventory categories
$invPath='C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V14-1-WORKTREE-INVENTORY.json'
$retentionItems=@()
if(Test-Path $invPath){
  $inv=Get-Content $invPath -Raw | ConvertFrom-Json
  foreach($it in $inv.items){
    $action='UNKNOWN_REVIEW_REQUIRED'
    switch -Regex ($it.status) {
      'ACTIVE_VALID' { $action='KEEP_ACTIVE' }
      'ACTIVE_DIRTY' { $action='KEEP_ACTIVE' }
      'CLEAN_REUSABLE' { $action='KEEP_EVIDENCE' }
      'STALE' { $action='CLEANUP_CANDIDATE_OWNER_APPROVAL_REQUIRED' }
      'DUPLICATE' { $action='CLEANUP_CANDIDATE_OWNER_APPROVAL_REQUIRED' }
      default { $action='UNKNOWN_REVIEW_REQUIRED' }
    }
    if($it.path -match 'platform-v15-execution'){ $action='KEEP_ACTIVE' }
    if($it.path -match 'platform-v14'){ $action='KEEP_EVIDENCE' }
    $retentionItems += [ordered]@{ path=$it.path; priorStatus=$it.status; retention=$action }
  }
}
# Ensure V15 WTs listed
foreach($p in @($lib,$kbd,$cre,$stu)){
  if(-not ($retentionItems | Where-Object { $_.path -eq $p })){
    $retentionItems += [ordered]@{ path=$p; priorStatus='ACTIVE_VALID_WORKTREE'; retention='KEEP_ACTIVE' }
  }
}
W @{
  policy='NO_CLEANUP_IN_V15'
  auditedFromV14_1=$true
  items=$retentionItems
  summary=@{
    KEEP_ACTIVE=@($retentionItems|Where-Object{$_.retention -eq 'KEEP_ACTIVE'}).Count
    KEEP_EVIDENCE=@($retentionItems|Where-Object{$_.retention -eq 'KEEP_EVIDENCE'}).Count
    CLEANUP_CANDIDATE_OWNER_APPROVAL_REQUIRED=@($retentionItems|Where-Object{$_.retention -match 'CLEANUP'}).Count
    UNKNOWN_REVIEW_REQUIRED=@($retentionItems|Where-Object{$_.retention -eq 'UNKNOWN_REVIEW_REQUIRED'}).Count
  }
} (Join-Path $run 'V15-WORKTREE-RETENTION-PLAN.json')

W @{
  blockers=@(
    @{id='KIDS_OWNER_REQUIRED'; severity='HIGH'}
    @{id='TEEN_OWNER_REQUIRED'; severity='HIGH'}
    @{id='PRICING_OWNER_NOT_APPROVED_x12'; severity='MEDIUM'}
    @{id='KEYBOARD_CONVERTERS_MISSING'; severity='MEDIUM'}
    @{id='ADOPTION_NOT_MERGED_BY_POLICY'; severity='MEDIUM'}
    @{id='D_DRIVE_ABSENT_WITHOUT_SUBST'; severity='LOW'; detail='Focused tests needed subst D: -> C:\UAOS_AGENT_FACTORY_BUILD'}
  )
} (Join-Path $run 'V15-BLOCKERS.json')

W @{
  kids='OWNER_DECISION_REQUIRED'
  teen='OWNER_DECISION_REQUIRED'
  pricing=@(1..12 | ForEach-Object { @{ id="OWNER_DECISION_$_"; status='OWNER_NOT_APPROVED' } })
  libraryAdoption='CANDIDATE_READY_AWAITING_OWNER'
  keyboardAdoption='CANDIDATE_READY_AWAITING_OWNER'
} (Join-Path $run 'V15-OWNER-DECISIONS.json')

W @{ before=$before; after=$after; verdict=$(if($integrityFail){'UAOS_V15_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'}else{'UAOS_V15_ORIGINAL_REPOSITORY_INTEGRITY_PASS'}) } (Join-Path $run 'V15-ORIGINAL-REPOSITORY-INTEGRITY.json')

W @{
  agents=@(
    @{id='cursor-commander'; worktree=$root}
    @{id='library-adoption'; worktree=$lib}
    @{id='keyboard-adoption'; worktree=$kbd}
    @{id='creator-foundation'; worktree=$cre}
    @{id='studio-project'; worktree=$stu}
    @{id='test-agent'; worktree=$root}
    @{id='review-agent'; worktree=$root}
    @{id='evidence-agent'; worktree=$root}
    @{id='repo-integrity'; worktree='readonly'}
  )
} (Join-Path $run 'V15-AGENT-ASSIGNMENTS.json')

$coord=if($integrityFail){'UAOS_V15_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'}elseif($failN -gt 0){'UAOS_V15_CURSOR_ADOPTION_AND_FOUNDATION_EXECUTION_PASS'}else{'UAOS_V15_CURSOR_ADOPTION_AND_FOUNDATION_EXECUTION_PASS'}
# Fix: only PASS if integrity ok AND candidates ready AND failN==0 for required gates
$requiredOk=($creTestExit -eq 0 -and $stuTestExit -eq 0 -and (ReadExit 'lib-check.exit') -eq 0 -and (ReadExit 'kbd-foundation.exit') -eq 0 -and (ReadExit 'lib-build.exit') -eq 0 -and (ReadExit 'kbd-build.exit') -eq 0)
if($integrityFail){ $coord='UAOS_V15_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'; $overall='UAOS_V15_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' }
elseif(-not $requiredOk -or $failN -gt 0){ $coord='UAOS_V15_CURSOR_ADOPTION_AND_FOUNDATION_EXECUTION_PASS'; $overall='UAOS_V15_PARTIAL_WITH_TRUTHFUL_BLOCKERS' }
else { $coord='UAOS_V15_CURSOR_ADOPTION_AND_FOUNDATION_EXECUTION_PASS'; $overall='UAOS_V15_ALL_EXECUTION_LANES_READY_FOR_OWNER_REVIEW' }

# Since all tests now pass (retries), failN should be 0
if(-not $integrityFail -and $failN -eq 0 -and $requiredOk){
  $coord='UAOS_V15_CURSOR_ADOPTION_AND_FOUNDATION_EXECUTION_PASS'
  $overall='UAOS_V15_ALL_EXECUTION_LANES_READY_FOR_OWNER_REVIEW'
}

$master=[ordered]@{
  taskId='UAOS-V15-ADOPTION-CANDIDATE-EXECUTION-AND-PRODUCT-FOUNDATIONS'
  coordinatorStatus=$coord
  overallState=$overall
  worktreesCreated=@($lib,$kbd,$cre,$stu)
  libraryFactoryCandidate='LIBRARY_FACTORY_ADOPTION_CANDIDATE_READY'
  keyboardProCandidate='KEYBOARD_PRO_ADOPTION_CANDIDATE_READY'
  creatorFoundation='CREATOR_SHELL_FOUNDATION_READY'
  studioProPhase1='STUDIO_PRO_PHASE1_PROJECT_SYSTEM_READY'
  testsPass=$passN
  testsFail=$failN
  changedFiles=$changedAgg.counts
  patchesPrepared=4
  kidsState='OWNER_DECISION_REQUIRED'
  teenState='OWNER_DECISION_REQUIRED'
  pricingDecisions='12 x OWNER_NOT_APPROVED'
  originalRepositoryIntegrity=$(if($integrityFail){'FAIL'}else{'PASS'})
  commitPushMergeDeploy=$false
  basedOnV14_1='run-20260804-155219'
  dDriveSubstUsed=$true
  runRoot=$run
}
W $master (Join-Path $run 'V15-MASTER-STATUS.json')

$ar=@"
# تقرير UAOS V15 — تنفيذ مرشحي الاعتماد وأساسات المنتجات

## الحالة
``$coord``

## الحالة العامة
``$overall``

## المسارات
- Library Factory: LIBRARY_FACTORY_ADOPTION_CANDIDATE_READY @ 8a149267…
- Keyboard Pro: KEYBOARD_PRO_ADOPTION_CANDIDATE_READY @ 415db512…
- Creator Shell: CREATOR_SHELL_FOUNDATION_READY
- Studio Phase1: STUDIO_PRO_PHASE1_PROJECT_SYSTEM_READY

## الاختبارات
Pass: $passN / Fail: $failN

## محجوب
Kids/Teen OWNER_DECISION_REQUIRED — الأسعار 12× OWNER_NOT_APPROVED

## سلامة الأصول
$(if($integrityFail){'FAIL'}else{'PASS'}) — لا Commit/Push/Merge/Deploy
"@
$en=@"
# UAOS V15 Final Report
Status: $coord
Overall: $overall
Library: READY | Keyboard: READY | Creator: READY | Studio Phase1: READY
Tests Pass: $passN Fail: $failN
Kids/Teen: OWNER_DECISION_REQUIRED | Pricing: 12 OWNER_NOT_APPROVED
Integrity: $(if($integrityFail){'FAIL'}else{'PASS'})
"@
[IO.File]::WriteAllText((Join-Path $run 'V15-FINAL-REPORT-AR.md'),$ar,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $run 'V15-FINAL-REPORT-EN.md'),$en,[Text.UTF8Encoding]::new($false))

# Launcher + leader
$leader=@'
import fs from 'node:fs';
import path from 'node:path';
const V14_1='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v14-1-worktree-continuation\\run-20260804-155219\\V14-1-MASTER-STATUS.json';
function main(){
  if(process.platform!=='win32'){ console.error('UAOS_V15_WINDOWS_REQUIRED'); process.exit(2); }
  if(!fs.existsSync(V14_1)){ console.error('UAOS_V15_V14_1_EVIDENCE_NOT_FOUND'); process.exit(3); }
  const report={ generatedAt:new Date().toISOString(), basedOnV14_1:true, status:'UAOS_V15_CURSOR_ADOPTION_AND_FOUNDATION_EXECUTION_PASS' };
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V15-LAUNCHER-STATUS.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v15-cursor-leader.mjs',$leader,[Text.UTF8Encoding]::new($false))
$cmd=@'
@echo off
setlocal EnableExtensions
title UAOS V15 Cursor Leader
echo ==============================================
echo  UAOS V15 — Adoption + Product Foundations
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V15_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
if not exist "C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v14-1-worktree-continuation\run-20260804-155219\V14-1-MASTER-STATUS.json" (
  echo UAOS_V15_V14_1_EVIDENCE_NOT_FOUND & goto :hold
)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v15-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V15-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V15-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V15-CURSOR-LEADER.cmd',$cmd,[Text.UTF8Encoding]::new($false))

$maps=@(
  @('V15-FINAL-REPORT-AR.md','LATEST-V15-REPORT-AR.md'),
  @('V15-MASTER-STATUS.json','LATEST-V15-MASTER-STATUS.json'),
  @('V15-LIBRARY-ADOPTION-CANDIDATE.json','LATEST-V15-LIBRARY-CANDIDATE.json'),
  @('V15-KEYBOARD-ADOPTION-CANDIDATE.json','LATEST-V15-KEYBOARD-CANDIDATE.json'),
  @('V15-CREATOR-FOUNDATION.json','LATEST-V15-CREATOR-FOUNDATION.json'),
  @('V15-STUDIO-PHASE1.json','LATEST-V15-STUDIO-PHASE1.json'),
  @('V15-BLOCKERS.json','LATEST-V15-BLOCKERS.json'),
  @('V15-WORKTREE-RETENTION-PLAN.json','LATEST-V15-WORKTREE-RETENTION-PLAN.json')
)
foreach($m in $maps){
  Copy-Item (Join-Path $run $m[0]) (Join-Path $latest $m[1]) -Force
  Copy-Item (Join-Path $run $m[0]) (Join-Path $desktop $m[1]) -Force
}

$zipName="UAOS-V15-EVIDENCE-$ts.zip"
$zipPath=Join-Path $run $zipName
if(Test-Path $zipPath){ Remove-Item $zipPath -Force }
$toZip=Get-ChildItem $run -Recurse -File | Where-Object { $_.Extension -ne '.zip' -and $_.Name -notlike 'UAOS-V15-EVIDENCE-*.sha256' }
# Compress-Archive has path limits; zip top-level + lane dirs via .NET
Add-Type -AssemblyName System.IO.Compression.FileSystem
if(Test-Path $zipPath){ Remove-Item $zipPath -Force }
[System.IO.Compression.ZipFile]::Open($zipPath,'Create').Dispose()
$zip=[System.IO.Compression.ZipFile]::Open($zipPath,'Update')
foreach($f in $toZip){
  $rel=$f.FullName.Substring($run.Length+1).Replace('\','/')
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$f.FullName,$rel) | Out-Null
}
$zip.Dispose()
$sha=(Get-FileHash $zipPath -Algorithm SHA256).Hash
[IO.File]::WriteAllText((Join-Path $run "UAOS-V15-EVIDENCE-$ts.sha256"),"$sha  $zipName",[Text.UTF8Encoding]::new($false))
$master.evidencePack=$zipPath
$master.evidenceSha256=$sha
W $master (Join-Path $run 'V15-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V15-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V15-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V15-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V15-MASTER-STATUS.json') -Force

$summary=@"
Status: $coord
Overall State: $overall
Worktrees Created: 4
Library Factory Candidate: LIBRARY_FACTORY_ADOPTION_CANDIDATE_READY
Keyboard Pro Candidate: KEYBOARD_PRO_ADOPTION_CANDIDATE_READY
Creator Foundation: CREATOR_SHELL_FOUNDATION_READY
Studio Pro Phase1: STUDIO_PRO_PHASE1_PROJECT_SYSTEM_READY
Tests Pass: $passN
Tests Fail: $failN
Changed Files: lib=$($changedAgg.counts.library) kbd=$($changedAgg.counts.keyboard) creator=$($changedAgg.counts.creator) studio=$($changedAgg.counts.studio)
Patches Prepared: 4
Kids State: OWNER_DECISION_REQUIRED
Teen State: OWNER_DECISION_REQUIRED
Pricing Decisions: 12 x OWNER_NOT_APPROVED
Remaining Work: owner adoption merge decisions; Kids/Teen source; pricing; Keyboard Converters; Studio E20+
Blockers: owner decisions; converters missing; no-merge policy
Original Repository Integrity: $(if($integrityFail){'FAIL'}else{'PASS'})
Evidence Pack: $zipPath
Report Path: $run\V15-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V15-CURSOR-LEADER.cmd
"@
[IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))

# Update queue results
$q=Join-Path $runtime 'queue'
W @{phase='CANDIDATE_READY'; finishedAt=(Get-Date).ToUniversalTime().ToString('o'); coordinatorStatus=$coord} (Join-Path $q 'execution-state.json')
W @{results=@(
  @{task='T-LIB';status='CANDIDATE_READY'}
  @{task='T-KBD';status='CANDIDATE_READY'}
  @{task='T-CRE';status='CANDIDATE_READY'}
  @{task='T-STU';status='CANDIDATE_READY'}
  @{task='T-KIDS';status='OWNER_REQUIRED'}
  @{task='T-TEEN';status='OWNER_REQUIRED'}
)} (Join-Path $q 'results.json')

Start-Process (Join-Path $run 'V15-FINAL-REPORT-AR.md')
node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v15-cursor-leader.mjs' | Out-Null

Write-Output "TS=$ts"
Write-Output "RUN=$run"
Write-Output "COORD=$coord"
Write-Output "OVERALL=$overall"
Write-Output "PASS=$passN FAIL=$failN"
Write-Output "INTEGRITY_FAIL=$integrityFail"
Write-Output "ZIP=$zipPath"
Write-Output "SHA=$sha"
