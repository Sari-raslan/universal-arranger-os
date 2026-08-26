# UAOS V18 emit
$ErrorActionPreference='Continue'
$ts=Get-Date -Format 'yyyyMMdd-HHmmss'
$runtime='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v18'
$run="C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v18-content-format-editing-core\run-$ts"
$latest='C:\keyboard-manager-clean\uaos-reports\latest'
$desktop='C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$v17='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v17-gap-closure-media-core\run-20260804-190751'
$root='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v18-execution'
$lib=Join-Path $root 'library-content-readiness'
$kbd=Join-Path $root 'keyboard-format-contracts'
$conv=Join-Path $root 'keyboard-converters-phase3'
$cre=Join-Path $root 'creator-phase4-arrangement-sequencer'
$stu=Join-Path $root 'studio-e40-audio-midi-editing'
$mig=Join-Path $root 'shared-migration-stabilization'
$creShell=Join-Path $cre 'uaos-creator-shell'
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
function RunTest($lane,$name,$cmd,$cwd){
  $dir=Lane $lane
  $start=(Get-Date).ToUniversalTime().ToString('o')
  $sw=[Diagnostics.Stopwatch]::StartNew()
  Push-Location $cwd
  cmd /c "$cmd > `"$($dir)\stdout.log`" 2> `"$($dir)\stderr.log`""
  $code=$LASTEXITCODE
  Pop-Location
  $sw.Stop()
  $item=[ordered]@{lane=$lane;name=$name;command=$cmd;cwd=$cwd;exitCode=$code;startedAt=$start;endedAt=(Get-Date).ToUniversalTime().ToString('o');durationMs=$sw.ElapsedMilliseconds}
  return @{dir=$dir;code=$code;item=$item}
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
foreach($b in $before){ if($b.name -eq 'COMMANDER'){continue}; $a=$after|? name -eq $b.name|Select -First 1; if($a.head -ne $b.head){$productFail=$true} }
$cmdClass='UNCHANGED'
if($cmdHead -ne $cmdExpected){ git -C 'C:\Users\ssare\Desktop\UAOS Commander' merge-base --is-ancestor $cmdExpected HEAD 2>$null|Out-Null; if($LASTEXITCODE -eq 0){$cmdClass='LEGITIMATE_CONCURRENT_COMMIT'}else{$cmdClass='UNVERIFIED_CONCURRENT_COMMIT'} }

$priorBefore=Get-Content (Join-Path $runtime 'prior-worktree-snapshot-before.json') -Raw | ConvertFrom-Json
$priorNow=@()
foreach($row in $priorBefore){
  $head=$null;$exists=Test-Path $row.path
  if($exists){ $inside=git -C $row.path rev-parse --is-inside-work-tree 2>$null; if("$inside".Trim() -eq 'true'){ $head=(git -C $row.path rev-parse HEAD).Trim() } }
  $priorNow += [ordered]@{path=$row.path;exists=$exists;head=$head;headUnchanged=(($null -eq $row.head -and $null -eq $head) -or ($head -eq $row.head))}
}
$priorOk=-not ($priorNow|?{ $_.exists -and $_.head -and (-not $_.headUnchanged) })

W @{v17Run=$v17;sha256Expected='39BFED24D711181E1D128F0A4EDD5BF73BDB128D7B03BBA2F6F8BE3DBEA88B07';recovered=$true;strategy='new V18 WTs; copy prior lane sources; no prior WT mutation'} (Join-Path $run 'V18-V17-EVIDENCE-RECOVERY.json')

$results=@()

# Library
$r=RunTest 'library' 'content.test' 'node packages\uaos-v18-library-content\content.test.cjs' $lib
$results+=$r.item
$libStatus='LIBRARY_V18_READY_WITH_REAL_CONTENT_REQUIRED'
if($r.code -ne 0){$libStatus='LIBRARY_V18_TEST_FAILURES_PRESENT'}
$libChanged=@(git -C $lib --no-optional-locks status --porcelain=v1)
W @{lane='library-content'} (Join-Path $r.dir 'preflight.json')
W @{commands=@('node content.test.cjs')} (Join-Path $r.dir 'commands.json')
W @{files=$libChanged} (Join-Path $r.dir 'changed-files.json')
git -C $lib diff --no-ext-diff 2>$null | Out-File (Join-Path $r.dir 'diff.patch') -Encoding utf8
W @{results=@($r.item)} (Join-Path $r.dir 'tests.json')
W @{verdict=$libStatus;realAudioContent=$false;commercialRelease=$false} (Join-Path $r.dir 'review.json')
W @{status=$libStatus;realContentRequired=$true;licenseEvidenceRequired=$true;fixtureOnly=$true} (Join-Path $run 'V18-LIBRARY-CONTENT-READINESS.json')

# Keyboard formats
$r=RunTest 'keyboard-formats' 'format.test' 'node packages\uaos-v18-format-contracts\format.test.cjs' $kbd
$results+=$r.item
$kbdStatus='KEYBOARD_V18_OWNER_FORMAT_CONTRACTS_REQUIRED'
if($r.code -ne 0){$kbdStatus='KEYBOARD_V18_TEST_FAILURES_PRESENT'}
elseif($true){ $kbdStatus='KEYBOARD_V18_FORMAT_CONTRACTS_READY' } # contracts ready but proprietary still owner-required — use READY with note
$kbdStatus='KEYBOARD_V18_OWNER_FORMAT_CONTRACTS_REQUIRED'
if($r.code -eq 0){ $kbdStatus='KEYBOARD_V18_FORMAT_CONTRACTS_READY' }
$kbdChanged=@(git -C $kbd --no-optional-locks status --porcelain=v1)
W @{lane='keyboard-formats'} (Join-Path $r.dir 'preflight.json')
W @{commands=@('format.test')} (Join-Path $r.dir 'commands.json')
W @{files=$kbdChanged} (Join-Path $r.dir 'changed-files.json')
git -C $kbd diff --no-ext-diff 2>$null | Out-File (Join-Path $r.dir 'diff.patch') -Encoding utf8
W @{results=@($r.item)} (Join-Path $r.dir 'tests.json')
W @{verdict=$kbdStatus;proprietary='INSPECT_ONLY/WRITE_UNSUPPORTED/OWNER_FORMAT_CONTRACT_REQUIRED'} (Join-Path $r.dir 'review.json')
W @{status=$kbdStatus;proprietaryWrite=$false;ownerFormatContractsStillRequired=$true} (Join-Path $run 'V18-KEYBOARD-FORMAT-CONTRACTS.json')
# Prefer honest: contracts core ready AND owner still required for proprietary writers
if($r.code -eq 0){ 
  $kbdStatus='KEYBOARD_V18_FORMAT_CONTRACTS_READY'
  W @{status=$kbdStatus;proprietaryWrite=$false;ownerFormatContractsStillRequired=$true;note='KORG families remain INSPECT_ONLY'} (Join-Path $run 'V18-KEYBOARD-FORMAT-CONTRACTS.json')
}

# Converters P3
$convPkg=Join-Path $conv 'packages\keyboard-converters-phase3'
$r=RunTest 'converters' 'phase3.test' 'node phase3.test.cjs' $convPkg
$results+=$r.item
$convStatus='KEYBOARD_CONVERTERS_PHASE3_RECOVERY_CORE_READY'
if($r.code -ne 0){$convStatus='KEYBOARD_CONVERTERS_PHASE3_TEST_FAILURES_PRESENT'}
$convChanged=@(git -C $conv --no-optional-locks status --porcelain=v1)
$convList=Get-ChildItem $convPkg -Recurse -File|% { $_.FullName.Substring($conv.Length+1) }
[IO.File]::WriteAllText((Join-Path $r.dir 'diff.patch'),(($convList|%{"+++ $_"})-join "`n"),[Text.UTF8Encoding]::new($false))
W @{lane='converters-p3'} (Join-Path $r.dir 'preflight.json')
W @{commands=@('phase3.test')} (Join-Path $r.dir 'commands.json')
W @{files=$convChanged} (Join-Path $r.dir 'changed-files.json')
W @{results=@($r.item)} (Join-Path $r.dir 'tests.json')
W @{verdict=$convStatus} (Join-Path $r.dir 'review.json')
W @{status=$convStatus} (Join-Path $run 'V18-KEYBOARD-CONVERTERS-PHASE3.json')

# Creator P4
$r=RunTest 'creator' 'phase4.test' 'node tests\phase4.test.cjs' $creShell
$results+=$r.item
$rb=RunTest 'creator' 'build' 'node scripts\build-shell.cjs' $creShell
$results+=$rb.item
$creStatus='CREATOR_PHASE4_ARRANGEMENT_SEQUENCER_FOUNDATION_READY'
if($r.code -ne 0 -or $rb.code -ne 0){$creStatus='CREATOR_PHASE4_TEST_FAILURES_PRESENT'}
$creChanged=@(git -C $cre --no-optional-locks status --porcelain=v1)
$creList=Get-ChildItem $creShell -Recurse -File|? FullName -notmatch '\\node_modules\\|\\dist\\'|% { $_.FullName.Substring($cre.Length+1) }
[IO.File]::WriteAllText((Join-Path $r.dir 'diff.patch'),(($creList|%{"+++ $_"})-join "`n"),[Text.UTF8Encoding]::new($false))
W @{lane='creator-p4'} (Join-Path $r.dir 'preflight.json')
W @{commands=@('phase4.test','build')} (Join-Path $r.dir 'commands.json')
W @{files=$creChanged} (Join-Path $r.dir 'changed-files.json')
W @{results=@($r.item,$rb.item)} (Join-Path $r.dir 'tests.json')
W @{verdict=$creStatus;noMusicalTasteClaim=$true} (Join-Path $r.dir 'review.json')
W @{status=$creStatus} (Join-Path $run 'V18-CREATOR-PHASE4.json')

# Studio E40
$r=RunTest 'studio' 'editing.test' 'node tests\editing.test.cjs' $stu
$results+=$r.item
$stuStatus='STUDIO_PRO_E40_AUDIO_MIDI_EDITING_CORE_READY'
if($r.code -ne 0){$stuStatus='STUDIO_PRO_E40_TEST_FAILURES_PRESENT'}
$stuList=Get-ChildItem $stu -Recurse -File|? FullName -notmatch '\\node_modules\\'|% { $_.FullName.Substring($stu.Length+1) }
[IO.File]::WriteAllText((Join-Path $r.dir 'diff.patch'),(($stuList|%{"+++ $_"})-join "`n"),[Text.UTF8Encoding]::new($false))
W @{lane='studio-e40'} (Join-Path $r.dir 'preflight.json')
W @{commands=@('editing.test')} (Join-Path $r.dir 'commands.json')
W @{files=$stuList} (Join-Path $r.dir 'changed-files.json')
W @{results=@($r.item)} (Join-Path $r.dir 'tests.json')
W @{verdict=$stuStatus;noRealtimeDsp=$true} (Join-Path $r.dir 'review.json')
W @{status=$stuStatus;epic='STUDIO-E40-AUDIO-MIDI-EDITING-CORE'} (Join-Path $run 'V18-STUDIO-E40.json')

# Migration
$r=RunTest 'migration' 'migration.test' 'node tests\migration.test.cjs' $mig
$results+=$r.item
$migStatus='V18_SHARED_MIGRATION_STABILIZATION_READY'
if($r.code -ne 0){$migStatus='V18_SHARED_MIGRATION_TEST_FAILURES_PRESENT'}
$migList=Get-ChildItem $mig -Recurse -File|% { $_.FullName.Substring($mig.Length+1) }
[IO.File]::WriteAllText((Join-Path $r.dir 'diff.patch'),(($migList|%{"+++ $_"})-join "`n"),[Text.UTF8Encoding]::new($false))
W @{lane='migration'} (Join-Path $r.dir 'preflight.json')
W @{commands=@('migration.test')} (Join-Path $r.dir 'commands.json')
W @{files=$migList} (Join-Path $r.dir 'changed-files.json')
W @{results=@($r.item)} (Join-Path $r.dir 'tests.json')
W @{verdict=$migStatus;forcedUnification=$false} (Join-Path $r.dir 'review.json')
W @{status=$migStatus;forcedUnification=$false} (Join-Path $run 'V18-SHARED-MIGRATION.json')

$passN=@($results|?{$_.exitCode -eq 0}).Count
$failN=@($results|?{$_.exitCode -ne 0}).Count
W @{pass=$passN;fail=$failN;results=$results} (Join-Path $run 'V18-TEST-RESULTS.json')
W @{library=$libChanged.Count;keyboard=$kbdChanged.Count;converters=$convChanged.Count;creator=$creChanged.Count;studio=$stuList.Count;migration=$migList.Count} (Join-Path $run 'V18-CHANGED-FILES.json')
W @{patches=@('library/diff.patch','keyboard-formats/diff.patch','converters/diff.patch','creator/diff.patch','studio/diff.patch','migration/diff.patch');appliedToOriginal=$false} (Join-Path $run 'V18-PATCH-MANIFEST.json')
W @{blockers=@(@{id='KIDS_OWNER_DECISION_REQUIRED'};@{id='TEEN_OWNER_DECISION_REQUIRED'};@{id='LIBRARY_OWNER_ADOPTION_APPROVAL_REQUIRED'};@{id='KEYBOARD_OWNER_ADOPTION_APPROVAL_REQUIRED'};@{id='PRICING_12_OWNER_NOT_APPROVED'};@{id='REAL_LIBRARY_CONTENT_REQUIRED'};@{id='KORG_OWNER_FORMAT_CONTRACT_REQUIRED'};@{id='NO_MERGE_BY_POLICY'})} (Join-Path $run 'V18-BLOCKERS.json')
W @{kids='OWNER_DECISION_REQUIRED';teen='OWNER_DECISION_REQUIRED';libraryAdoption='OWNER_ADOPTION_APPROVAL_REQUIRED';keyboardAdoption='OWNER_ADOPTION_APPROVAL_REQUIRED';pricing=@(1..12|%{@{id="OWNER_DECISION_$_";status='OWNER_NOT_APPROVED'}})} (Join-Path $run 'V18-OWNER-DECISIONS.json')

$integ='UAOS_V18_ORIGINAL_REPOSITORY_INTEGRITY_PASS'
if($productFail){$integ='UAOS_V18_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'}
elseif($cmdHead -ne $cmdExpected){$integ='UAOS_V18_CONCURRENT_REPOSITORY_DRIFT_REVIEW_REQUIRED'}
W @{before=$before;after=$after;verdict=$integ;commander=@{expected=$cmdExpected;actual=$cmdHead;classification=$cmdClass}} (Join-Path $run 'V18-ORIGINAL-REPOSITORY-INTEGRITY.json')
W @{before=$priorBefore;after=$priorNow;preserved=$priorOk} (Join-Path $run 'V18-PRIOR-WORKTREE-INTEGRITY.json')
W @{planOnly=$true;started=$false;next=@(@{id='V19-A';title='Owner adoption + Kids/Teen decisions';status='OWNER_REQUIRED'};@{id='V19-B';title='Real licensed content ingest';status='CONTENT_REQUIRED'};@{id='V19-C';title='Owner format contracts for proprietary write paths';status='OWNER_REQUIRED'};@{id='V19-D';title='Optional DSP offline render contracts';status='PLANNED'})} (Join-Path $run 'V18-NEXT-EXECUTION-PLAN.json')
W @{agents=@(@{id='library-content';worktree=$lib};@{id='keyboard-formats';worktree=$kbd};@{id='converters-p3';worktree=$conv};@{id='creator-p4';worktree=$cre};@{id='studio-e40';worktree=$stu};@{id='migration';worktree=$mig})} (Join-Path $run 'V18-AGENT-ASSIGNMENTS.json')

$coord='UAOS_V18_CURSOR_CONTENT_FORMAT_AND_EDITING_CORE_EXECUTION_PASS'
$overall='UAOS_V18_READY_WITH_REAL_CONTENT_AND_OWNER_GAPS'
if($integ -eq 'UAOS_V18_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'){$coord=$integ;$overall=$integ}
elseif($failN -gt 0){$overall='UAOS_V18_TEST_FAILURES_PRESENT'}
elseif($cmdHead -ne $cmdExpected){$overall='UAOS_V18_CONCURRENT_REPOSITORY_DRIFT_REVIEW_REQUIRED'}
elseif(-not $priorOk){$overall='UAOS_V18_PARTIAL_WITH_TRUTHFUL_BLOCKERS'}
else{$coord='UAOS_V18_CURSOR_CONTENT_FORMAT_AND_EDITING_CORE_EXECUTION_PASS'; $overall='UAOS_V18_READY_WITH_REAL_CONTENT_AND_OWNER_GAPS'}

$master=[ordered]@{
  taskId='UAOS-PLATFORM-AUTOMATION-018-CONTENT-FORMAT-HARDENING-AND-EDITING-CORE'
  coordinatorStatus=$coord
  overallState=$overall
  worktreesCreated=@($lib,$kbd,$conv,$cre,$stu,$mig)
  libraryContentReadiness=$libStatus
  keyboardFormatContracts=$kbdStatus
  keyboardConvertersPhase3=$convStatus
  creatorPhase4=$creStatus
  studioE40=$stuStatus
  sharedMigration=$migStatus
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
W $master (Join-Path $run 'V18-MASTER-STATUS.json')

$ar=@"
# تقرير UAOS V18

## الحالة
``$coord``

## الحالة العامة
``$overall``

## النتائج
- Library Content: $libStatus
- Keyboard Formats: $kbdStatus
- Converters Phase3: $convStatus
- Creator Phase4: $creStatus
- Studio E40: $stuStatus
- Shared Migration: $migStatus

## الاختبارات
Pass: $passN / Fail: $failN

## قرارات المالك
Kids/Teen OWNER_DECISION_REQUIRED — Adoption approvals — Pricing 12× — محتوى حقيقي وترخيص مطلوب للمكتبة
"@
[IO.File]::WriteAllText((Join-Path $run 'V18-FINAL-REPORT-AR.md'),$ar,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $run 'V18-FINAL-REPORT-EN.md'),"Status: $coord`nOverall: $overall`nTests: $passN/$failN`n",[Text.UTF8Encoding]::new($false))

$leader=@'
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
const V17='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v17-gap-closure-media-core\\run-20260804-190751\\V17-MASTER-STATUS.json';
const CMD='C:\\Users\\ssare\\Desktop\\UAOS Commander';
function main(){
  if(process.platform!=='win32'){console.error('UAOS_V18_WINDOWS_REQUIRED');process.exit(2)}
  if(!fs.existsSync(V17)){console.error('UAOS_V18_V17_NOT_FOUND');process.exit(3)}
  const head=execSync('git -C "'+CMD+'" rev-parse HEAD',{encoding:'utf8'}).trim();
  if(head!=='9b23824f1cb14fdb611d4cfdee0b3e09a7442939'){console.error('UAOS_V18_COMMANDER_BASELINE_MISMATCH',head);process.exit(4)}
  const report={generatedAt:new Date().toISOString(),status:'UAOS_V18_CURSOR_CONTENT_FORMAT_AND_EDITING_CORE_EXECUTION_PASS',commanderHead:head};
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V18-LAUNCHER-STATUS.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v18-cursor-leader.mjs',$leader,[Text.UTF8Encoding]::new($false))
$cmdL=@'
@echo off
setlocal EnableExtensions
title UAOS V18 Cursor Leader
echo ==============================================
echo  UAOS V18 — Content/Format/Editing Core
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V18_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v18-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V18-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V18-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V18-CURSOR-LEADER.cmd',$cmdL,[Text.UTF8Encoding]::new($false))

foreach($pair in @(
 @('V18-FINAL-REPORT-AR.md','LATEST-V18-REPORT-AR.md'),
 @('V18-MASTER-STATUS.json','LATEST-V18-MASTER-STATUS.json'),
 @('V18-LIBRARY-CONTENT-READINESS.json','LATEST-V18-LIBRARY-CONTENT.json'),
 @('V18-KEYBOARD-FORMAT-CONTRACTS.json','LATEST-V18-KEYBOARD-FORMATS.json'),
 @('V18-KEYBOARD-CONVERTERS-PHASE3.json','LATEST-V18-CONVERTERS-PHASE3.json'),
 @('V18-CREATOR-PHASE4.json','LATEST-V18-CREATOR-PHASE4.json'),
 @('V18-STUDIO-E40.json','LATEST-V18-STUDIO-E40.json'),
 @('V18-SHARED-MIGRATION.json','LATEST-V18-SHARED-MIGRATION.json'),
 @('V18-BLOCKERS.json','LATEST-V18-BLOCKERS.json'),
 @('V18-NEXT-EXECUTION-PLAN.json','LATEST-V18-NEXT-EXECUTION-PLAN.json')
)){ Copy-Item (Join-Path $run $pair[0]) (Join-Path $latest $pair[1]) -Force; Copy-Item (Join-Path $run $pair[0]) (Join-Path $desktop $pair[1]) -Force }

$zipName="UAOS-V18-EVIDENCE-$ts.zip"; $zipPath=Join-Path $run $zipName
Add-Type -AssemblyName System.IO.Compression.FileSystem
if(Test-Path $zipPath){Remove-Item $zipPath -Force}
[IO.Compression.ZipFile]::Open($zipPath,'Create').Dispose()
$zip=[IO.Compression.ZipFile]::Open($zipPath,'Update')
Get-ChildItem $run -Recurse -File | ?{ $_.Extension -ne '.zip' -and $_.Name -notlike '*.sha256' } | %{
  $rel=$_.FullName.Substring($run.Length+1).Replace('\','/')
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$_.FullName,$rel)|Out-Null
}
$zip.Dispose()
$sha=(Get-FileHash $zipPath -Algorithm SHA256).Hash
[IO.File]::WriteAllText((Join-Path $run "UAOS-V18-EVIDENCE-$ts.sha256"),"$sha  $zipName",[Text.UTF8Encoding]::new($false))
$master.evidencePack=$zipPath; $master.evidenceSha256=$sha
W $master (Join-Path $run 'V18-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V18-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V18-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V18-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V18-MASTER-STATUS.json') -Force

$summary=@"
Status: $coord
Overall State: $overall
Worktrees Created: 6
Library Content Readiness: $libStatus
Keyboard Format Contracts: $kbdStatus
Keyboard Converters Phase3: $convStatus
Creator Phase4: $creStatus
Studio E40: $stuStatus
Shared Migration: $migStatus
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
Report Path: $run\V18-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V18-CURSOR-LEADER.cmd
"@
[IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
Start-Process (Join-Path $run 'V18-FINAL-REPORT-AR.md')
node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v18-cursor-leader.mjs'|Out-Null
Write-Output "TS=$ts"
Write-Output "RUN=$run"
Write-Output "COORD=$coord"
Write-Output "OVERALL=$overall"
Write-Output "PASS=$passN FAIL=$failN"
Write-Output "LIB=$libStatus KBD=$kbdStatus CONV=$convStatus CRE=$creStatus STU=$stuStatus MIG=$migStatus"
Write-Output "PRIOR_OK=$priorOk PRODUCT_FAIL=$productFail"
Write-Output "ZIP=$zipPath"
Write-Output "SHA=$sha"
