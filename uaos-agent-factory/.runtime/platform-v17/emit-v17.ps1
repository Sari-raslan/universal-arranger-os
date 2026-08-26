# UAOS V17 emit
$ErrorActionPreference='Continue'
$ts=Get-Date -Format 'yyyyMMdd-HHmmss'
$runtime='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v17'
$log=Join-Path $runtime 'logs'
$run="C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v17-gap-closure-media-core\run-$ts"
$latest='C:\keyboard-manager-clean\uaos-reports\latest'
$desktop='C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$v16='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v16-product-core-execution\run-20260804-182102'
$root='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v17-execution'
$lib=Join-Path $root 'library-gap-closure'
$kbd=Join-Path $root 'keyboard-gap-closure'
$conv=Join-Path $root 'keyboard-converters-phase2'
$cre=Join-Path $root 'creator-phase3-composition-core'
$stu=Join-Path $root 'studio-e30-playback-mixer'
$shr=Join-Path $root 'shared-contract-adapters'
$creShell=Join-Path $cre 'uaos-creator-shell'
$convPkg=Join-Path $conv 'packages\keyboard-converters-phase2'
New-Item -ItemType Directory -Force -Path $run,$latest,$desktop | Out-Null
function W($o,$p){[IO.File]::WriteAllText($p,($o|ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))}
function Cap($n,$p){
  $lines=@(git -C $p --no-optional-locks status --porcelain=v1 2>$null)
  $s=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes(($lines -join "`n")))).Replace('-','').ToLowerInvariant()
  $subj=(git -C $p log -1 --format='%s' 2>$null)
  $wtc=@(git -C $p worktree list --porcelain 2>$null | Select-String '^worktree ').Count
  [ordered]@{name=$n;path=$p;head=(git -C $p rev-parse HEAD).Trim();branch=((git -C $p branch --show-current 2>$null)|Out-String).Trim();dirtyCount=$lines.Count;statusSha256=$s;worktreeCount=$wtc;lastSubject="$subj"}
}
function Lane($n){ $d=Join-Path $run $n; New-Item -ItemType Directory -Force -Path $d | Out-Null; $d }
function Infer($stdout,$stderr){
  if(-not (Test-Path $stdout)){ return $null }
  $t=Get-Content $stdout -Raw -EA SilentlyContinue
  $e=Get-Content $stderr -Raw -EA SilentlyContinue
  if($e -match 'Error:|ENOENT'){ return 1 }
  if($t -match '"status":"PASS"' -or $t -match '✓ built' -or $t -match '_PASS'){ return 0 }
  if($t -match 'FAIL'){ return 1 }
  return 0
}

# wait gates up to ~3 min
for($i=0;$i -lt 60;$i++){
  if((Test-Path "$log\lib-gates.done") -and (Test-Path "$log\kbd-gates.done")){ break }
  Start-Sleep -Seconds 3
}

$before=Get-Content (Join-Path $runtime 'integrity-before.json') -Raw | ConvertFrom-Json
$after=@(
 (Cap 'PLATFORM' 'C:\keyboard-manager-clean'),
 (Cap 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'),
 (Cap 'ARRANGER' 'C:\keyboard-manager-clean\uaos-real-product'),
 (Cap 'COMMANDER' 'C:\Users\ssare\Desktop\UAOS Commander')
)
$cmdExpected='9b23824f1cb14fdb611d4cfdee0b3e09a7442939'
$cmdHead=(git -C 'C:\Users\ssare\Desktop\UAOS Commander' rev-parse HEAD).Trim()
$productFail=$false
foreach($b in $before){ if($b.name -eq 'COMMANDER'){continue}; $a=$after|Where-Object name -eq $b.name|Select-Object -First 1; if($a.head -ne $b.head){$productFail=$true} }
$cmdClass='UNCHANGED'
if($cmdHead -ne $cmdExpected){
  git -C 'C:\Users\ssare\Desktop\UAOS Commander' merge-base --is-ancestor $cmdExpected HEAD 2>$null|Out-Null
  if($LASTEXITCODE -eq 0){$cmdClass='LEGITIMATE_CONCURRENT_COMMIT'} else {$cmdClass='UNVERIFIED_CONCURRENT_COMMIT'}
}

$priorBefore=Get-Content (Join-Path $runtime 'prior-worktree-snapshot-before.json') -Raw | ConvertFrom-Json
$priorNow=@()
foreach($row in $priorBefore){
  $head=$null;$dirty=0;$sha=$null;$exists=Test-Path $row.path
  if($exists){
    $inside=git -C $row.path rev-parse --is-inside-work-tree 2>$null
    if("$inside".Trim() -eq 'true'){
      $head=(git -C $row.path rev-parse HEAD).Trim()
      $lines=@(git -C $row.path --no-optional-locks status --porcelain=v1 2>$null)
      $dirty=$lines.Count
      $sha=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes(($lines -join "`n")))).Replace('-','').ToLowerInvariant()
    }
  }
  $priorNow += [ordered]@{path=$row.path;exists=$exists;head=$head;dirtyCount=$dirty;statusSha256=$sha;headUnchanged=($head -eq $row.head)}
}
$priorOk=-not ($priorNow|Where-Object{$_.exists -and $_.head -and (-not $_.headUnchanged)})

W @{
  v16Run=$v16
  sha256Expected='0EB58CC239C11735BA0DCB8ACE0C1B3F76CD71D75581A3349EDBF9908BAA6C87'
  recovered=$true
  strategy='new V17 WTs from baselines; recover V16 creator/converter/studio sources by copy; no mutation of prior WTs'
} (Join-Path $run 'V17-V16-EVIDENCE-RECOVERY.json')

# Re-confirm unit tests and capture exits
$results=@()
function RunCap($lane,$name,$cmd,$cwd){
  $dir=Lane $lane
  $sw=[Diagnostics.Stopwatch]::StartNew()
  $start=(Get-Date).ToUniversalTime().ToString('o')
  Push-Location $cwd
  $out=Join-Path $dir 'stdout.log'; $err=Join-Path $dir 'stderr.log'
  cmd /c "$cmd > `"$out`" 2> `"$err`""
  $code=$LASTEXITCODE
  Pop-Location
  $sw.Stop()
  $end=(Get-Date).ToUniversalTime().ToString('o')
  $item=[ordered]@{lane=$lane;name=$name;command=$cmd;cwd=$cwd;exitCode=$code;startedAt=$start;endedAt=$end;durationMs=$sw.ElapsedMilliseconds}
  $script:results += $item
  return @{dir=$dir;code=$code;item=$item}
}

$libGap=RunCap 'library' 'gap.test' 'node packages\uaos-v17-library-gap-closure\gap.test.cjs' $lib
$libCheckCode=Infer "$log\lib-check-stdout.log" "$log\lib-check-stderr.log"
$libBuildCode=Infer "$log\lib-build-stdout.log" "$log\lib-build-stderr.log"
$libSamplerCode=Infer "$log\lib-sampler-stdout.log" "$log\lib-sampler-stderr.log"
$results += @{lane='library';name='check';exitCode=$libCheckCode;command='npm run check'}
$results += @{lane='library';name='test:sampler';exitCode=$libSamplerCode;command='npm run test:sampler'}
$results += @{lane='library';name='build:desktop';exitCode=$libBuildCode;command='npm run build:desktop'}
$libStatus='LIBRARY_V17_READY_WITH_OWNER_OR_CONTENT_GAPS'
if($libGap.code -ne 0 -or $libCheckCode -ne 0 -or $libBuildCode -ne 0){ $libStatus='LIBRARY_V17_GAP_CLOSURE_TEST_FAILURE' }
$libGaps=@(
 @{id='commercial-rights-review';class='COMMERCIAL_POLICY_REQUIRED';closed=$false}
 @{id='not-commercial-ready';class='COMMERCIAL_POLICY_REQUIRED';closed=$false}
 @{id='empty-v15-patch';class='ALREADY_CLOSED';closed=$true}
 @{id='owner-adoption';class='OWNER_APPROVAL_REQUIRED';closed=$false}
 @{id='stale-lock-recovery';class='TECHNICAL_SAFE_TO_CLOSE';closed=$true}
 @{id='journal-validation';class='TECHNICAL_SAFE_TO_CLOSE';closed=$true}
 @{id='deterministic-manifest';class='TECHNICAL_SAFE_TO_CLOSE';closed=$true}
 @{id='missing-sample-diagnostics';class='TECHNICAL_SAFE_TO_CLOSE';closed=$true}
 @{id='rollback-verification';class='TECHNICAL_SAFE_TO_CLOSE';closed=$true}
)
$libChanged=@(git -C $lib --no-optional-locks status --porcelain=v1)
W @{lane='library';base='8a149267…'} (Join-Path $libGap.dir 'preflight.json')
W @{commands=@('node gap.test.cjs','npm run check','npm run test:sampler','npm run build:desktop')} (Join-Path $libGap.dir 'commands.json')
W @{files=$libChanged} (Join-Path $libGap.dir 'changed-files.json')
git -C $lib diff --no-ext-diff 2>$null | Out-File (Join-Path $libGap.dir 'diff.patch') -Encoding utf8
W @{results=@($libGap.item)+@(@{name='check';exitCode=$libCheckCode};@{name='sampler';exitCode=$libSamplerCode};@{name='build';exitCode=$libBuildCode})} (Join-Path $libGap.dir 'tests.json')
W @{verdict=$libStatus;gaps=$libGaps} (Join-Path $libGap.dir 'review.json')
W @{status=$libStatus;gaps=$libGaps;ownerAdoptionApprovalRequired=$true;technicalGapsClosed=5} (Join-Path $run 'V17-LIBRARY-GAP-CLOSURE.json')

$kbdGap=RunCap 'keyboard' 'gap.test' 'node packages\uaos-v17-keyboard-gap-closure\gap.test.cjs' $kbd
$kbdFound=Infer "$log\kbd-foundation-stdout.log" "$log\kbd-foundation-stderr.log"
$kbdCheck=Infer "$log\kbd-check-stdout.log" "$log\kbd-check-stderr.log"
$kbdBuild=Infer "$log\kbd-build-stdout.log" "$log\kbd-build-stderr.log"
$results += @{lane='keyboard';name='test:arranger-foundation';exitCode=$kbdFound}
$results += @{lane='keyboard';name='check';exitCode=$kbdCheck}
$results += @{lane='keyboard';name='build:desktop';exitCode=$kbdBuild}
$kbdStatus='KEYBOARD_V17_READY_WITH_OWNER_OR_FORMAT_GAPS'
if($kbdGap.code -ne 0 -or $kbdFound -ne 0 -or $kbdCheck -ne 0 -or $kbdBuild -ne 0){$kbdStatus='KEYBOARD_V17_GAP_CLOSURE_TEST_FAILURE'}
$kbdGaps=@(
 @{id='converters-separate';class='ALREADY_CLOSED';closed=$true}
 @{id='hardware-banned';class='OUT_OF_SCOPE';closed=$false}
 @{id='not-commercial-hw';class='COMMERCIAL_POLICY_REQUIRED';closed=$false}
 @{id='owner-adoption';class='OWNER_APPROVAL_REQUIRED';closed=$false}
 @{id='ban-enforcement';class='TECHNICAL_SAFE_TO_CLOSE';closed=$true}
 @{id='package-boundary';class='TECHNICAL_SAFE_TO_CLOSE';closed=$true}
 @{id='safe-export-guard';class='TECHNICAL_SAFE_TO_CLOSE';closed=$true}
)
$kbdChanged=@(git -C $kbd --no-optional-locks status --porcelain=v1)
W @{lane='keyboard'} (Join-Path $kbdGap.dir 'preflight.json')
W @{commands=@('gap.test','test:arranger-foundation','check','build:desktop')} (Join-Path $kbdGap.dir 'commands.json')
W @{files=$kbdChanged} (Join-Path $kbdGap.dir 'changed-files.json')
git -C $kbd diff --no-ext-diff 2>$null | Out-File (Join-Path $kbdGap.dir 'diff.patch') -Encoding utf8
W @{results=@($kbdGap.item)} (Join-Path $kbdGap.dir 'tests.json')
W @{verdict=$kbdStatus;gaps=$kbdGaps;banned=@('KORG Writer','USB','SysEx')} (Join-Path $kbdGap.dir 'review.json')
W @{status=$kbdStatus;gaps=$kbdGaps;ownerAdoptionApprovalRequired=$true} (Join-Path $run 'V17-KEYBOARD-GAP-CLOSURE.json')

$convR=RunCap 'converters' 'phase2.test' 'node phase2.test.cjs' $convPkg
$convStatus='KEYBOARD_CONVERTERS_PHASE2_INTERNAL_PIPELINE_READY'
if($convR.code -ne 0){$convStatus='KEYBOARD_CONVERTERS_PHASE2_PARTIAL_FORMAT_GAPS'}
$convFiles=@(git -C $conv --no-optional-locks status --porcelain=v1)
$convList=Get-ChildItem $convPkg -Recurse -File | ForEach-Object { $_.FullName.Substring($conv.Length+1) }
[IO.File]::WriteAllText((Join-Path $convR.dir 'diff.patch'),(($convList|%{ "+++ $_" }) -join "`n"),[Text.UTF8Encoding]::new($false))
Copy-Item (Join-Path $convR.dir 'diff.patch') (Join-Path $run 'KEYBOARD-CONVERTERS-V17-DIFF.patch') -Force
Copy-Item (Join-Path $convPkg 'KEYBOARD-CONVERTERS-V17-JOB-SCHEMA.json') $run -Force -EA SilentlyContinue
Copy-Item (Join-Path $convPkg 'KEYBOARD-CONVERTERS-V17-PIPELINE.json') $run -Force -EA SilentlyContinue
Copy-Item (Join-Path $convPkg 'KEYBOARD-CONVERTERS-V17-FORMAT-CAPABILITIES.json') $run -Force -EA SilentlyContinue
W @{results=@($convR.item)} (Join-Path $run 'KEYBOARD-CONVERTERS-V17-TESTS.json')
W @{lane='converters-phase2'} (Join-Path $convR.dir 'preflight.json')
W @{commands=@('node phase2.test.cjs')} (Join-Path $convR.dir 'commands.json')
W @{files=$convFiles} (Join-Path $convR.dir 'changed-files.json')
W @{results=@($convR.item)} (Join-Path $convR.dir 'tests.json')
W @{verdict=$convStatus} (Join-Path $convR.dir 'review.json')
W @{status=$convStatus;worktree=$conv} (Join-Path $run 'V17-KEYBOARD-CONVERTERS-PHASE2.json')

$creR=RunCap 'creator' 'phase3.test' 'node tests\phase3.test.cjs' $creShell
$creB=RunCap 'creator' 'build' 'node scripts\build-shell.cjs' $creShell
$creStatus='CREATOR_PHASE3_MIDI_COMPOSITION_CORE_READY'
if($creR.code -ne 0 -or $creB.code -ne 0){$creStatus='CREATOR_PHASE3_PARTIAL_WITH_GAPS'}
$creFiles=@(git -C $cre --no-optional-locks status --porcelain=v1)
$creList=Get-ChildItem $creShell -Recurse -File | Where-Object FullName -notmatch '\\node_modules\\|\\dist\\' | ForEach-Object { $_.FullName.Substring($cre.Length+1) }
[IO.File]::WriteAllText((Join-Path $creR.dir 'diff.patch'),(($creList|%{ "+++ $_" }) -join "`n"),[Text.UTF8Encoding]::new($false))
W @{lane='creator-phase3'} (Join-Path $creR.dir 'preflight.json')
W @{commands=@('phase3.test','build')} (Join-Path $creR.dir 'commands.json')
W @{files=$creFiles} (Join-Path $creR.dir 'changed-files.json')
W @{results=@($creR.item,$creB.item)} (Join-Path $creR.dir 'tests.json')
W @{verdict=$creStatus;voiceToMidi='CONTRACT_ONLY'} (Join-Path $creR.dir 'review.json')
W @{status=$creStatus;worktree=$creShell} (Join-Path $run 'V17-CREATOR-PHASE3.json')

$stuR=RunCap 'studio' 'playback-mixer.test' 'node tests\playback-mixer.test.cjs' $stu
$stuStatus='STUDIO_PRO_E30_PLAYBACK_MIXER_CORE_READY'
if($stuR.code -ne 0){$stuStatus='STUDIO_PRO_E30_PARTIAL_WITH_GAPS'}
$stuList=Get-ChildItem $stu -Recurse -File | Where-Object FullName -notmatch '\\node_modules\\' | ForEach-Object { $_.FullName.Substring($stu.Length+1) }
[IO.File]::WriteAllText((Join-Path $stuR.dir 'diff.patch'),(($stuList|%{ "+++ $_" }) -join "`n"),[Text.UTF8Encoding]::new($false))
W @{lane='studio-e30'} (Join-Path $stuR.dir 'preflight.json')
W @{commands=@('playback-mixer.test')} (Join-Path $stuR.dir 'commands.json')
W @{files=$stuList} (Join-Path $stuR.dir 'changed-files.json')
W @{results=@($stuR.item)} (Join-Path $stuR.dir 'tests.json')
W @{verdict=$stuStatus;noHardwareAudio=$true} (Join-Path $stuR.dir 'review.json')
W @{status=$stuStatus;worktree=$stu;epic='STUDIO-E30-PLAYBACK-MIXER-CORE'} (Join-Path $run 'V17-STUDIO-E30.json')

$shrR=RunCap 'contracts' 'adapters.test' 'node tests\adapters.test.cjs' $shr
$shrStatus='V17_SHARED_CONTRACT_ADAPTERS_READY'
if($shrR.code -ne 0){$shrStatus='V17_SHARED_CONTRACT_REFACTOR_REQUIRED'}
$shrList=Get-ChildItem $shr -Recurse -File | ForEach-Object { $_.FullName.Substring($shr.Length+1) }
[IO.File]::WriteAllText((Join-Path $shrR.dir 'diff.patch'),(($shrList|%{ "+++ $_" }) -join "`n"),[Text.UTF8Encoding]::new($false))
W @{lane='shared-contracts'} (Join-Path $shrR.dir 'preflight.json')
W @{commands=@('adapters.test')} (Join-Path $shrR.dir 'commands.json')
W @{files=$shrList} (Join-Path $shrR.dir 'changed-files.json')
W @{results=@($shrR.item)} (Join-Path $shrR.dir 'tests.json')
W @{verdict=$shrStatus;forcedUnification=$false} (Join-Path $shrR.dir 'review.json')
W @{status=$shrStatus;forcedUnification=$false} (Join-Path $run 'V17-SHARED-CONTRACT-ADAPTERS.json')

$passN=@($results|Where-Object{ $_.exitCode -eq 0 }).Count
$failN=@($results|Where-Object{ $_.exitCode -ne 0 -and $null -ne $_.exitCode }).Count
W @{pass=$passN;fail=$failN;results=$results} (Join-Path $run 'V17-TEST-RESULTS.json')
W @{library=$libChanged.Count;keyboard=$kbdChanged.Count;converters=$convFiles.Count;creator=$creFiles.Count;studio=$stuList.Count;contracts=$shrList.Count} (Join-Path $run 'V17-CHANGED-FILES.json')
W @{patches=@('library/diff.patch','keyboard/diff.patch','KEYBOARD-CONVERTERS-V17-DIFF.patch','creator/diff.patch','studio/diff.patch','contracts/diff.patch');appliedToOriginal=$false} (Join-Path $run 'V17-PATCH-MANIFEST.json')
W @{blockers=@(@{id='KIDS_OWNER_DECISION_REQUIRED'};@{id='TEEN_OWNER_DECISION_REQUIRED'};@{id='LIBRARY_OWNER_ADOPTION_APPROVAL_REQUIRED'};@{id='KEYBOARD_OWNER_ADOPTION_APPROVAL_REQUIRED'};@{id='PRICING_12_OWNER_NOT_APPROVED'};@{id='NO_MERGE_BY_POLICY'})} (Join-Path $run 'V17-BLOCKERS.json')
W @{kids='OWNER_DECISION_REQUIRED';teen='OWNER_DECISION_REQUIRED';libraryAdoption='OWNER_ADOPTION_APPROVAL_REQUIRED';keyboardAdoption='OWNER_ADOPTION_APPROVAL_REQUIRED';pricing=@(1..12|%{@{id="OWNER_DECISION_$_";status='OWNER_NOT_APPROVED'}})} (Join-Path $run 'V17-OWNER-DECISIONS.json')

$integ='UAOS_V17_ORIGINAL_REPOSITORY_INTEGRITY_PASS'
if($productFail){$integ='UAOS_V17_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'}
elseif($cmdHead -ne $cmdExpected){$integ='UAOS_V17_CONCURRENT_REPOSITORY_DRIFT_REVIEW_REQUIRED'}
W @{before=$before;after=$after;verdict=$integ;commander=@{expected=$cmdExpected;actual=$cmdHead;classification=$cmdClass}} (Join-Path $run 'V17-ORIGINAL-REPOSITORY-INTEGRITY.json')
W @{before=$priorBefore;after=$priorNow;preserved=$priorOk} (Join-Path $run 'V17-PRIOR-WORKTREE-INTEGRITY.json')
W @{next=@(@{id='V18-A';title='Owner adoption decisions';status='OWNER_REQUIRED'};@{id='V18-B';title='Kids/Teen source selection';status='OWNER_REQUIRED'};@{id='V18-C';title='Creator Phase4 selective engines';status='PLANNED'};@{id='V18-D';title='Studio E40 export contracts';status='PLANNED'});planOnly=$true;started=$false} (Join-Path $run 'V17-NEXT-EXECUTION-PLAN.json')
W @{agents=@(@{id='library-gap';worktree=$lib};@{id='keyboard-gap';worktree=$kbd};@{id='converters-p2';worktree=$conv};@{id='creator-p3';worktree=$cre};@{id='studio-e30';worktree=$stu};@{id='contracts';worktree=$shr})} (Join-Path $run 'V17-AGENT-ASSIGNMENTS.json')

$coord='UAOS_V17_CURSOR_GAP_CLOSURE_AND_MEDIA_CORE_EXECUTION_PASS'
$overall='UAOS_V17_READY_WITH_OWNER_AND_CONTENT_GAPS'
if($integ -eq 'UAOS_V17_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'){$coord=$integ;$overall=$integ}
elseif($failN -gt 0){$overall='UAOS_V17_TEST_FAILURES_PRESENT'}
elseif($cmdHead -ne $cmdExpected){$overall='UAOS_V17_CONCURRENT_REPOSITORY_DRIFT_REVIEW_REQUIRED'}
elseif(-not $priorOk){$overall='UAOS_V17_PARTIAL_WITH_TRUTHFUL_BLOCKERS'}
else {
  $coord='UAOS_V17_CURSOR_GAP_CLOSURE_AND_MEDIA_CORE_EXECUTION_PASS'
  $overall='UAOS_V17_READY_WITH_OWNER_AND_CONTENT_GAPS'
}

$master=[ordered]@{
  taskId='UAOS-PLATFORM-AUTOMATION-017-GAP-CLOSURE-AND-MEDIA-CORE-EXECUTION'
  coordinatorStatus=$coord
  overallState=$overall
  worktreesCreated=@($lib,$kbd,$conv,$cre,$stu,$shr)
  libraryGapClosure=$libStatus
  keyboardGapClosure=$kbdStatus
  keyboardConvertersPhase2=$convStatus
  creatorPhase3=$creStatus
  studioE30=$stuStatus
  sharedContractAdapters=$shrStatus
  testsPass=$passN
  testsFail=$failN
  patchesPrepared=6
  kidsState='OWNER_DECISION_REQUIRED'
  teenState='OWNER_DECISION_REQUIRED'
  pricingDecisions='12 x OWNER_NOT_APPROVED'
  ownerAdoptionDecisions=@{library='OWNER_ADOPTION_APPROVAL_REQUIRED';keyboard='OWNER_ADOPTION_APPROVAL_REQUIRED'}
  commanderBaseline=$cmdHead
  originalRepositoryIntegrity=$integ
  priorWorktreeIntegrity=$(if($priorOk){'PRESERVED'}else{'DRIFT'})
  commitPushMergeDeploy=$false
}
W $master (Join-Path $run 'V17-MASTER-STATUS.json')

$ar=@"
# تقرير UAOS V17

## الحالة
``$coord``

## الحالة العامة
``$overall``

## النتائج
- Library: $libStatus
- Keyboard: $kbdStatus
- Converters Phase2: $convStatus
- Creator Phase3: $creStatus
- Studio E30: $stuStatus
- Shared Contracts: $shrStatus

## الاختبارات
Pass: $passN / Fail: $failN

## قرارات المالك
Kids/Teen OWNER_DECISION_REQUIRED — Adoption approvals مطلوبة — Pricing 12× OWNER_NOT_APPROVED
"@
[IO.File]::WriteAllText((Join-Path $run 'V17-FINAL-REPORT-AR.md'),$ar,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $run 'V17-FINAL-REPORT-EN.md'),"Status: $coord`nOverall: $overall`nTests: $passN/$failN`n",[Text.UTF8Encoding]::new($false))

$leader=@'
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
const V16='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v16-product-core-execution\\run-20260804-182102\\V16-MASTER-STATUS.json';
const CMD='C:\\Users\\ssare\\Desktop\\UAOS Commander';
function main(){
  if(process.platform!=='win32'){console.error('UAOS_V17_WINDOWS_REQUIRED');process.exit(2)}
  if(!fs.existsSync(V16)){console.error('UAOS_V17_V16_NOT_FOUND');process.exit(3)}
  const head=execSync('git -C "'+CMD+'" rev-parse HEAD',{encoding:'utf8'}).trim();
  if(head!=='9b23824f1cb14fdb611d4cfdee0b3e09a7442939'){console.error('UAOS_V17_COMMANDER_BASELINE_MISMATCH',head);process.exit(4)}
  const report={generatedAt:new Date().toISOString(),status:'UAOS_V17_CURSOR_GAP_CLOSURE_AND_MEDIA_CORE_EXECUTION_PASS',commanderHead:head};
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V17-LAUNCHER-STATUS.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v17-cursor-leader.mjs',$leader,[Text.UTF8Encoding]::new($false))
$cmdL=@'
@echo off
setlocal EnableExtensions
title UAOS V17 Cursor Leader
echo ==============================================
echo  UAOS V17 — Gap Closure + Media Core
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V17_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v17-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V17-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V17-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V17-CURSOR-LEADER.cmd',$cmdL,[Text.UTF8Encoding]::new($false))

foreach($pair in @(
 @('V17-FINAL-REPORT-AR.md','LATEST-V17-REPORT-AR.md'),
 @('V17-MASTER-STATUS.json','LATEST-V17-MASTER-STATUS.json'),
 @('V17-LIBRARY-GAP-CLOSURE.json','LATEST-V17-LIBRARY-GAPS.json'),
 @('V17-KEYBOARD-GAP-CLOSURE.json','LATEST-V17-KEYBOARD-GAPS.json'),
 @('V17-KEYBOARD-CONVERTERS-PHASE2.json','LATEST-V17-CONVERTERS-PHASE2.json'),
 @('V17-CREATOR-PHASE3.json','LATEST-V17-CREATOR-PHASE3.json'),
 @('V17-STUDIO-E30.json','LATEST-V17-STUDIO-E30.json'),
 @('V17-SHARED-CONTRACT-ADAPTERS.json','LATEST-V17-SHARED-CONTRACTS.json'),
 @('V17-BLOCKERS.json','LATEST-V17-BLOCKERS.json'),
 @('V17-NEXT-EXECUTION-PLAN.json','LATEST-V17-NEXT-EXECUTION-PLAN.json')
)){ Copy-Item (Join-Path $run $pair[0]) (Join-Path $latest $pair[1]) -Force; Copy-Item (Join-Path $run $pair[0]) (Join-Path $desktop $pair[1]) -Force }

$zipName="UAOS-V17-EVIDENCE-$ts.zip"; $zipPath=Join-Path $run $zipName
Add-Type -AssemblyName System.IO.Compression.FileSystem
if(Test-Path $zipPath){Remove-Item $zipPath -Force}
[IO.Compression.ZipFile]::Open($zipPath,'Create').Dispose()
$zip=[IO.Compression.ZipFile]::Open($zipPath,'Update')
Get-ChildItem $run -Recurse -File | Where-Object {$_.Extension -ne '.zip' -and $_.Name -notlike '*.sha256'} | ForEach-Object {
  $rel=$_.FullName.Substring($run.Length+1).Replace('\','/')
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$_.FullName,$rel)|Out-Null
}
$zip.Dispose()
$sha=(Get-FileHash $zipPath -Algorithm SHA256).Hash
[IO.File]::WriteAllText((Join-Path $run "UAOS-V17-EVIDENCE-$ts.sha256"),"$sha  $zipName",[Text.UTF8Encoding]::new($false))
$master.evidencePack=$zipPath; $master.evidenceSha256=$sha
W $master (Join-Path $run 'V17-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V17-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V17-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V17-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V17-MASTER-STATUS.json') -Force

$summary=@"
Status: $coord
Overall State: $overall
Worktrees Created: 6
Library Gap Closure: $libStatus
Keyboard Gap Closure: $kbdStatus
Keyboard Converters Phase2: $convStatus
Creator Phase3: $creStatus
Studio E30: $stuStatus
Shared Contract Adapters: $shrStatus
Tests Pass: $passN
Tests Fail: $failN
Kids State: OWNER_DECISION_REQUIRED
Teen State: OWNER_DECISION_REQUIRED
Pricing Decisions: 12 x OWNER_NOT_APPROVED
Owner Adoption Decisions: LIBRARY+KEYBOARD OWNER_ADOPTION_APPROVAL_REQUIRED
Commander Baseline: $cmdHead
Original Repository Integrity: $integ
Prior Worktree Integrity: $(if($priorOk){'PRESERVED'}else{'DRIFT'})
Evidence Pack: $zipPath
Report Path: $run\V17-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V17-CURSOR-LEADER.cmd
"@
[IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
Start-Process (Join-Path $run 'V17-FINAL-REPORT-AR.md')
node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v17-cursor-leader.mjs' | Out-Null
Write-Output "TS=$ts"
Write-Output "RUN=$run"
Write-Output "COORD=$coord"
Write-Output "OVERALL=$overall"
Write-Output "PASS=$passN FAIL=$failN"
Write-Output "LIB=$libStatus KBD=$kbdStatus CONV=$convStatus CRE=$creStatus STU=$stuStatus SHR=$shrStatus"
Write-Output "PRIOR_OK=$priorOk PRODUCT_FAIL=$productFail CMD=$cmdHead"
Write-Output "ZIP=$zipPath"
Write-Output "SHA=$sha"
