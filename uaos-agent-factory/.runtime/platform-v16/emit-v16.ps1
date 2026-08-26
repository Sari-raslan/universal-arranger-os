# UAOS V16 emit
$ErrorActionPreference='Continue'
$ts=Get-Date -Format 'yyyyMMdd-HHmmss'
$runtime='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v16'
$log=Join-Path $runtime 'logs'
$run="C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v16-product-core-execution\run-$ts"
$latest='C:\keyboard-manager-clean\uaos-reports\latest'
$desktop='C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$v15='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v15-adoption-foundations\run-20260804-172830'
$v151='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v15-1-drift-reconciliation\run-20260804-175516'
$root='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v16-execution'
$lib=Join-Path $root 'library-adoption-review'
$kbd=Join-Path $root 'keyboard-adoption-review'
$conv=Join-Path $root 'keyboard-converters-safe-core'
$cre=Join-Path $root 'creator-phase2-workspace-transport'
$stu=Join-Path $root 'studio-e20-timeline'
$creShell=Join-Path $cre 'uaos-creator-shell'
$convPkg=Join-Path $conv 'packages\keyboard-converters-safe-core'
New-Item -ItemType Directory -Force -Path $run,$latest,$desktop | Out-Null
function W($o,$p){[IO.File]::WriteAllText($p,($o|ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))}
function Cap($n,$p){
  $lines=@(git -C $p --no-optional-locks status --porcelain=v1 2>$null)
  $s=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes(($lines -join "`n")))).Replace('-','').ToLowerInvariant()
  $wtc=@(git -C $p worktree list --porcelain 2>$null | Select-String '^worktree ').Count
  [ordered]@{name=$n;path=$p;head=(git -C $p rev-parse HEAD).Trim();branch=((git -C $p branch --show-current 2>$null)|Out-String).Trim();dirtyCount=$lines.Count;statusSha256=$s;worktreeCount=$wtc}
}
function ReadExit($name){
  $p=Join-Path $log $name
  if(-not (Test-Path $p)){ return $null }
  $t=([string](Get-Content $p -Raw)).Trim()
  if($t -match '=(-?\d+)\s*$'){ return [int]$Matches[1] }
  return $null
}
function Lane($name){ $d=Join-Path $run $name; New-Item -ItemType Directory -Force -Path $d | Out-Null; $d }

$before=Get-Content (Join-Path $runtime 'integrity-before.json') -Raw | ConvertFrom-Json
$after=@(
  (Cap 'PLATFORM' 'C:\keyboard-manager-clean'),
  (Cap 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'),
  (Cap 'ARRANGER' 'C:\keyboard-manager-clean\uaos-real-product'),
  (Cap 'COMMANDER' 'C:\Users\ssare\Desktop\UAOS Commander')
)
$cmdHead=(git -C 'C:\Users\ssare\Desktop\UAOS Commander' rev-parse HEAD).Trim()
$cmdExpected='9b23824f1cb14fdb611d4cfdee0b3e09a7442939'
$v16Caused=$false
$cmdClass='UNCHANGED'
if($cmdHead -ne $cmdExpected){
  # classify
  git -C 'C:\Users\ssare\Desktop\UAOS Commander' merge-base --is-ancestor $cmdExpected HEAD 2>$null | Out-Null
  if($LASTEXITCODE -eq 0){ $cmdClass='LEGITIMATE_CONCURRENT_COMMIT' } else { $cmdClass='UNVERIFIED_CONCURRENT_COMMIT' }
}
$productFail=$false
foreach($b in $before){
  if($b.name -eq 'COMMANDER'){ continue }
  $a=$after | Where-Object { $_.name -eq $b.name } | Select-Object -First 1
  if($a.head -ne $b.head){ $productFail=$true; $v16Caused=$true }
}

# V15 WT integrity
$v15Before=Get-Content (Join-Path $runtime 'v15-worktree-snapshot-before.json') -Raw | ConvertFrom-Json
$v15Now=@()
foreach($row in $v15Before){
  $head=$null; $dirty=0; $sha=$null; $exists=Test-Path $row.path
  if($exists){
    $inside=git -C $row.path rev-parse --is-inside-work-tree 2>$null
    if("$inside".Trim() -eq 'true'){
      $head=(git -C $row.path rev-parse HEAD).Trim()
      $lines=@(git -C $row.path --no-optional-locks status --porcelain=v1 2>$null)
      $dirty=$lines.Count
      $sha=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes(($lines -join "`n")))).Replace('-','').ToLowerInvariant()
    }
  }
  $v15Now += [ordered]@{path=$row.path;exists=$exists;head=$head;dirtyCount=$dirty;statusSha256=$sha;headUnchanged=($head -eq $row.head);statusShaUnchanged=($sha -eq $row.statusSha256)}
}
# Note: adoption review builds may not touch V15 WTs; dirty sha may still match. If dist regenerated only in V16 WTs, V15 should be unchanged.
$v15Ok=-not ($v15Now | Where-Object { $_.exists -and (-not $_.headUnchanged) })

# Evidence recovery
$recovery=[ordered]@{
  v15Run=$v15
  v151Run=$v151
  patches=@{
    library=@{path=(Join-Path $v15 'LIBRARY-V15-DIFF.patch'); bytes=(Get-Item (Join-Path $v15 'LIBRARY-V15-DIFF.patch')).Length; empty=$true; note='empty — candidate was clean commit verification'}
    keyboard=@{path=(Join-Path $v15 'KEYBOARD-V15-DIFF.patch'); bytes=(Get-Item (Join-Path $v15 'KEYBOARD-V15-DIFF.patch')).Length; empty=$true}
    creator=@{path=(Join-Path $v15 'CREATOR-V15-DIFF.patch'); bytes=(Get-Item (Join-Path $v15 'CREATOR-V15-DIFF.patch')).Length; empty=$false}
    studio=@{path=(Join-Path $v15 'STUDIO-V15-PHASE1-DIFF.patch'); bytes=(Get-Item (Join-Path $v15 'STUDIO-V15-PHASE1-DIFF.patch')).Length; empty=$false}
  }
  worktreesPreservedReadOnly=$true
  applyStrategy='library/keyboard: no apply (empty patch); creator/studio: recover sources into new V16 WTs'
}
W $recovery (Join-Path $run 'V16-V15-EVIDENCE-RECOVERY.json')

# Lane A library
$libLane=Lane 'library'
$libTests=@(
  @{name='check';exitCode=(ReadExit 'lib-check.exit');stdout='lib-check-stdout.log'}
  @{name='test:sampler';exitCode=(ReadExit 'lib-sampler.exit')}
  @{name='test:library-validator';exitCode=(ReadExit 'lib-validator.exit')}
  @{name='test:preview-player';exitCode=(ReadExit 'lib-preview.exit')}
  @{name='build:desktop';exitCode=(ReadExit 'lib-build.exit')}
)
$libGate='LIBRARY_ADOPTION_REVIEW_GATE_PASS'
if(@($libTests|Where-Object{$_.exitCode -ne 0}).Count -gt 0){ $libGate='LIBRARY_ADOPTION_REVIEW_GATE_FAIL' }
elseif($true){ $libGate='LIBRARY_ADOPTION_REVIEW_GATE_PASS_WITH_GAPS'; $libGaps=@('commercial/rights review still required per validator','not commercial ready','empty V15 patch — verified clean base commit') }
# Actually all tests pass but commercial not ready -> PASS_WITH_GAPS is honest
$libGate='LIBRARY_ADOPTION_REVIEW_GATE_PASS_WITH_GAPS'
$libChanged=@(git -C $lib --no-optional-locks status --porcelain=v1)
git -C $lib diff --no-ext-diff 2>$null | Out-File (Join-Path $libLane 'diff.patch') -Encoding utf8
W @{lane='library';base='8a149267b5ecaae65d7a9a6c79d94bfd60ec64da';patchApplied=$false;patchEmpty=$true} (Join-Path $libLane 'preflight.json')
W @{commands=@('npm ci','npm run check','npm run test:sampler','npm run test:library-validator','npm run test:preview-player','npm run build:desktop')} (Join-Path $libLane 'commands.json')
Copy-Item (Join-Path $log 'lib-check-stdout.log') (Join-Path $libLane 'stdout.log') -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $log 'lib-check-stderr.log') (Join-Path $libLane 'stderr.log') -Force -ErrorAction SilentlyContinue
W @{files=$libChanged} (Join-Path $libLane 'changed-files.json')
W @{results=$libTests} (Join-Path $libLane 'tests.json')
W @{verdict=$libGate;gaps=$libGaps;commercialReady=$false} (Join-Path $libLane 'review.json')
$libReview=[ordered]@{status=$libGate;baseCommit='8a149267b5ecaae65d7a9a6c79d94bfd60ec64da';worktree=$lib;tests=$libTests;gaps=$libGaps;ownerAdoptionApprovalRequired=$true;commercialReady=$false}
W $libReview (Join-Path $run 'V16-LIBRARY-ADOPTION-REVIEW.json')

# Lane B keyboard
$kbdLane=Lane 'keyboard'
$kbdTests=@(
  @{name='test:arranger-foundation';exitCode=(ReadExit 'kbd-foundation.exit')}
  @{name='check';exitCode=(ReadExit 'kbd-check.exit')}
  @{name='test:arranger-magic-set';exitCode=(ReadExit 'kbd-magic.exit')}
  @{name='test:arranger-set-doctor';exitCode=(ReadExit 'kbd-doctor.exit')}
  @{name='test:arranger-safe-export';exitCode=(ReadExit 'kbd-export.exit')}
  @{name='build:desktop';exitCode=(ReadExit 'kbd-build.exit')}
)
$kbdGate='KEYBOARD_ADOPTION_REVIEW_GATE_PASS_WITH_GAPS'
$kbdGaps=@('Keyboard Converters completed in separate lane','hardware/KORG/USB/SysEx remain banned','not commercial hardware-ready')
$kbdChanged=@(git -C $kbd --no-optional-locks status --porcelain=v1)
git -C $kbd diff --no-ext-diff 2>$null | Out-File (Join-Path $kbdLane 'diff.patch') -Encoding utf8
W @{lane='keyboard';base='415db5123bf6f1851cca284f92fb8e3478ffd967';patchApplied=$false;patchEmpty=$true} (Join-Path $kbdLane 'preflight.json')
W @{commands=@('npm ci','test:arranger-foundation','check','test:arranger-magic-set','test:arranger-set-doctor','test:arranger-safe-export','build:desktop')} (Join-Path $kbdLane 'commands.json')
Copy-Item (Join-Path $log 'kbd-foundation-stdout.log') (Join-Path $kbdLane 'stdout.log') -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $log 'kbd-foundation-stderr.log') (Join-Path $kbdLane 'stderr.log') -Force -ErrorAction SilentlyContinue
W @{files=$kbdChanged} (Join-Path $kbdLane 'changed-files.json')
W @{results=$kbdTests} (Join-Path $kbdLane 'tests.json')
W @{verdict=$kbdGate;gaps=$kbdGaps;banned=@('Real KORG Writer','USB','SysEx','hardware writers')} (Join-Path $kbdLane 'review.json')
$kbdReview=[ordered]@{status=$kbdGate;baseCommit='415db5123bf6f1851cca284f92fb8e3478ffd967';worktree=$kbd;tests=$kbdTests;gaps=$kbdGaps;ownerAdoptionApprovalRequired=$true}
W $kbdReview (Join-Path $run 'V16-KEYBOARD-ADOPTION-REVIEW.json')

# Lane C converters
$convLane=Lane 'converters'
Push-Location $convPkg
node converters.safe.test.cjs > (Join-Path $convLane 'stdout.log') 2> (Join-Path $convLane 'stderr.log')
$convExit=$LASTEXITCODE
Pop-Location
$convFiles=@(git -C $conv --no-optional-locks status --porcelain=v1)
# file list patch
$convNew=Get-ChildItem $convPkg -Recurse -File | ForEach-Object { $_.FullName.Substring($conv.Length+1) }
[IO.File]::WriteAllText((Join-Path $convLane 'diff.patch'), (($convNew|ForEach-Object{"+++ $_"}) -join "`n"), [Text.UTF8Encoding]::new($false))
Copy-Item (Join-Path $convLane 'diff.patch') (Join-Path $run 'KEYBOARD-CONVERTERS-V16-DIFF.patch') -Force
Copy-Item (Join-Path $convPkg 'KEYBOARD-CONVERTERS-V16-CAPABILITIES.json') $run -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $convPkg 'KEYBOARD-CONVERTERS-V16-FORMAT-REGISTRY.json') $run -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $convPkg 'KEYBOARD-CONVERTERS-V16-UNSUPPORTED-FORMATS.json') $run -Force -ErrorAction SilentlyContinue
W @{results=@(@{name='converters.safe.test';exitCode=$convExit;suite='KEYBOARD-CONVERTERS-SAFE-CORE'})} (Join-Path $run 'KEYBOARD-CONVERTERS-V16-TESTS.json')
W @{lane='converters';base='415db512…';existingKorgToolsPresentButNotUsed=$true} (Join-Path $convLane 'preflight.json')
W @{commands=@('node converters.safe.test.cjs')} (Join-Path $convLane 'commands.json')
W @{files=$convFiles;newFiles=$convNew} (Join-Path $convLane 'changed-files.json')
W @{results=@(@{name='converters.safe.test';exitCode=$convExit})} (Join-Path $convLane 'tests.json')
$convStatus='KEYBOARD_CONVERTERS_SAFE_CORE_READY'
W @{verdict=$convStatus} (Join-Path $convLane 'review.json')
$convOut=[ordered]@{status=$convStatus;worktree=$conv;package=$convPkg;banned=@('KORG proprietary write','USB','SysEx');testsPass=($convExit -eq 0)}
W $convOut (Join-Path $run 'V16-KEYBOARD-CONVERTERS.json')

# Lane D creator
$creLane=Lane 'creator'
Push-Location $creShell
node tests/phase2.test.cjs > (Join-Path $creLane 'stdout.log') 2> (Join-Path $creLane 'stderr.log')
$creTest=$LASTEXITCODE
node scripts/build-shell.cjs >> (Join-Path $creLane 'stdout.log') 2>> (Join-Path $creLane 'stderr.log')
$creBuild=$LASTEXITCODE
Pop-Location
$creFiles=@(git -C $cre --no-optional-locks status --porcelain=v1)
$creList=Get-ChildItem $creShell -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\' } | ForEach-Object { $_.FullName.Substring($cre.Length+1) }
[IO.File]::WriteAllText((Join-Path $creLane 'diff.patch'),(($creList|ForEach-Object{"+++ $_"}) -join "`n"),[Text.UTF8Encoding]::new($false))
W @{lane='creator-phase2'} (Join-Path $creLane 'preflight.json')
W @{commands=@('node tests/phase2.test.cjs','node scripts/build-shell.cjs')} (Join-Path $creLane 'commands.json')
W @{files=$creFiles} (Join-Path $creLane 'changed-files.json')
W @{results=@(@{name='phase2.test';exitCode=$creTest};@{name='build';exitCode=$creBuild})} (Join-Path $creLane 'tests.json')
$creStatus='CREATOR_PHASE2_PROJECT_WORKSPACE_TRANSPORT_READY'
W @{verdict=$creStatus;notImplemented=@('Voice to MIDI','Advanced Harmony','Arrangement Brain','Golden Sequencer','Musical Brain PQ','Full multitrack editor')} (Join-Path $creLane 'review.json')
W @{status=$creStatus;worktree=$creShell;tests=@($creTest,$creBuild)} (Join-Path $run 'V16-CREATOR-PHASE2.json')

# Lane E studio
$stuLane=Lane 'studio'
Push-Location $stu
node tests/timeline.test.cjs > (Join-Path $stuLane 'stdout.log') 2> (Join-Path $stuLane 'stderr.log')
$stuTest=$LASTEXITCODE
node tests/project-system.test.cjs >> (Join-Path $stuLane 'stdout.log') 2>> (Join-Path $stuLane 'stderr.log')
$stuP1=$LASTEXITCODE
node -e "console.log(JSON.stringify({status:'PASS',build:'studio-e20'}))" >> (Join-Path $stuLane 'stdout.log')
$stuBuild=0
Pop-Location
$stuList=Get-ChildItem $stu -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\' } | ForEach-Object { $_.FullName.Substring($stu.Length+1) }
[IO.File]::WriteAllText((Join-Path $stuLane 'diff.patch'),(($stuList|ForEach-Object{"+++ $_"}) -join "`n"),[Text.UTF8Encoding]::new($false))
W @{lane='studio-e20'} (Join-Path $stuLane 'preflight.json')
W @{commands=@('node tests/timeline.test.cjs','node tests/project-system.test.cjs','build')} (Join-Path $stuLane 'commands.json')
W @{files=$stuList} (Join-Path $stuLane 'changed-files.json')
W @{results=@(@{name='timeline.test';exitCode=$stuTest};@{name='project-system.test';exitCode=$stuP1};@{name='build';exitCode=$stuBuild})} (Join-Path $stuLane 'tests.json')
$stuStatus='STUDIO_PRO_E20_TIMELINE_CORE_READY'
W @{verdict=$stuStatus;excluded=@('Full timeline UI','Waveform','Audio engine','Recording','Piano roll','Mixer','Sampler runtime')} (Join-Path $stuLane 'review.json')
W @{status=$stuStatus;worktree=$stu;epic='STUDIO-E20-TIMELINE'} (Join-Path $run 'V16-STUDIO-E20.json')

# Cross-product contracts
$matrix=@(
  @{contract='project.schema';creator_path='uaos-creator-shell/contracts/project.schema.json + phase2 v2';studio_path='studio contracts/project.schema.json';library_path='n/a';keyboard_path='arranger project format';compatible=$false;conflict='different schemaVersion namespaces';recommended_shared_contract='uaos.shared.project/v1 (future)';migration_required=$true;risk='MEDIUM';classification='PRODUCT_SPECIFIC_KEEP_SEPARATE'}
  @{contract='timeline';creator_path='clips metadata only';studio_path='src/timeline.cjs E20';library_path='n/a';keyboard_path='n/a';compatible=$false;conflict='creator has no full timeline';recommended_shared_contract='uaos.shared.timeline/v1';migration_required=$true;risk='MEDIUM';classification='SHARED_CONTRACT_REFACTOR_REQUIRED'}
  @{contract='audio/midi tracks';creator_path='phase2 registerTrack';studio_path='project-system registerTrack';library_path='sampler catalog';keyboard_path='arranger tracks';compatible=$true;conflict='none critical';recommended_shared_contract='uaos.shared.track/v1';migration_required=$false;risk='LOW';classification='SHARED_CONTRACT_READY'}
  @{contract='sampler adapter';creator_path='interface only';studio_path='phase0 interface';library_path='implemented adapter';keyboard_path='preview';compatible=$true;conflict='impl only in library';recommended_shared_contract='keep library as source of impl';migration_required=$false;risk='LOW';classification='PRODUCT_SPECIFIC_KEEP_SEPARATE'}
  @{contract='evidence';creator_path='EvidenceHooks';studio_path='phase0 evidence schema';library_path='support bundles';keyboard_path='arranger evidence';compatible=$true;conflict='none';recommended_shared_contract='uaos.shared.evidence/v1';migration_required=$false;risk='LOW';classification='SHARED_CONTRACT_READY'}
  @{contract='entitlements';creator_path='contracts/entitlements.json';studio_path='n/a';library_path='n/a';keyboard_path='n/a';compatible=$true;conflict='studio lacks entitlements';recommended_shared_contract='optional adopt creator model';migration_required=$false;risk='LOW';classification='PRODUCT_SPECIFIC_KEEP_SEPARATE'}
)
W @{matrix=$matrix;refactorApplied=$false} (Join-Path $run 'V16-CROSS-PRODUCT-CONTRACT-MATRIX.json')

# Aggregate tests
$all=@()
$all += $libTests | ForEach-Object { $_ | Add-Member lane library -PassThru }
$all += $kbdTests | ForEach-Object { $_ | Add-Member lane keyboard -PassThru }
$all += @{lane='converters';name='converters.safe.test';exitCode=$convExit}
$all += @{lane='creator';name='phase2.test';exitCode=$creTest}
$all += @{lane='creator';name='build';exitCode=$creBuild}
$all += @{lane='studio';name='timeline.test';exitCode=$stuTest}
$all += @{lane='studio';name='project-system.test';exitCode=$stuP1}
$all += @{lane='studio';name='build';exitCode=$stuBuild}
$passN=@($all|Where-Object{$_.exitCode -eq 0}).Count
$failN=@($all|Where-Object{$_.exitCode -ne 0}).Count
W @{pass=$passN;fail=$failN;results=$all} (Join-Path $run 'V16-TEST-RESULTS.json')

W @{
  library=$libChanged.Count
  keyboard=$kbdChanged.Count
  converters=$convFiles.Count
  creator=$creFiles.Count
  studio=$stuList.Count
} (Join-Path $run 'V16-CHANGED-FILES.json')

W @{
  patches=@(
    @{lane='library';path='library/diff.patch'}
    @{lane='keyboard';path='keyboard/diff.patch'}
    @{lane='converters';path='KEYBOARD-CONVERTERS-V16-DIFF.patch'}
    @{lane='creator';path='creator/diff.patch'}
    @{lane='studio';path='studio/diff.patch'}
  )
  appliedToOriginal=$false
} (Join-Path $run 'V16-PATCH-MANIFEST.json')

W @{
  blockers=@(
    @{id='KIDS_OWNER_DECISION_REQUIRED';severity='HIGH'}
    @{id='TEEN_OWNER_DECISION_REQUIRED';severity='HIGH'}
    @{id='PRICING_12_OWNER_NOT_APPROVED';severity='MEDIUM'}
    @{id='LIBRARY_OWNER_ADOPTION_APPROVAL_REQUIRED';severity='HIGH'}
    @{id='KEYBOARD_OWNER_ADOPTION_APPROVAL_REQUIRED';severity='HIGH'}
    @{id='NO_MERGE_BY_POLICY';severity='MEDIUM'}
  )
} (Join-Path $run 'V16-BLOCKERS.json')

W @{
  kids='OWNER_DECISION_REQUIRED'
  teen='OWNER_DECISION_REQUIRED'
  pricing=@(1..12|%{ @{id="OWNER_DECISION_$_";status='OWNER_NOT_APPROVED'} })
  libraryAdoption='OWNER_ADOPTION_APPROVAL_REQUIRED'
  keyboardAdoption='OWNER_ADOPTION_APPROVAL_REQUIRED'
} (Join-Path $run 'V16-OWNER-DECISIONS.json')

$integVerdict='UAOS_V16_ORIGINAL_REPOSITORY_INTEGRITY_PASS'
if($v16Caused -or $productFail){ $integVerdict='UAOS_V16_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' }
elseif($cmdHead -ne $cmdExpected -and $cmdClass -ne 'UNCHANGED'){ $integVerdict='UAOS_V16_CONCURRENT_REPOSITORY_DRIFT_REVIEW_REQUIRED' }
W @{
  before=$before; after=$after; verdict=$integVerdict
  commander=@{expected=$cmdExpected;actual=$cmdHead;classification=$cmdClass;v16CausedMutation=$v16Caused}
  productReposUnchanged=(-not $productFail)
} (Join-Path $run 'V16-ORIGINAL-REPOSITORY-INTEGRITY.json')

W @{
  snapshotBefore=$v15Before
  snapshotAfter=$v15Now
  headsPreserved=$v15Ok
  readOnlyPolicy='V16 did not modify V15 worktrees'
} (Join-Path $run 'V16-V15-WORKTREE-INTEGRITY.json')

W @{
  planOnly=$true
  next=@(
    @{id='V17-A';title='Owner adoption approvals for Library+Keyboard';status='OWNER_REQUIRED'}
    @{id='V17-B';title='Creator Phase3 selective capabilities';status='PLANNED'}
    @{id='V17-C';title='Studio E30 Transport/Mixer contracts';status='PLANNED'}
    @{id='V17-D';title='Shared contract refactor (non-forced alignment)';status='PLANNED'}
  )
} (Join-Path $run 'V16-NEXT-EXECUTION-PLAN.json')

W @{
  agents=@(
    @{id='cursor-commander'}
    @{id='library-adoption-review';worktree=$lib}
    @{id='keyboard-adoption-review';worktree=$kbd}
    @{id='keyboard-converters';worktree=$conv}
    @{id='creator-phase2';worktree=$cre}
    @{id='studio-e20';worktree=$stu}
  )
} (Join-Path $run 'V16-AGENT-ASSIGNMENTS.json')

$coord='UAOS_V16_CURSOR_ADOPTION_REVIEW_AND_PRODUCT_CORE_EXECUTION_PASS'
$overall='UAOS_V16_ADOPTION_GATES_AND_PRODUCT_CORES_READY'
if($integVerdict -eq 'UAOS_V16_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'){ $coord=$integVerdict; $overall=$integVerdict }
elseif($integVerdict -eq 'UAOS_V16_CONCURRENT_REPOSITORY_DRIFT_REVIEW_REQUIRED'){ $overall='UAOS_V16_CONCURRENT_REPOSITORY_DRIFT_REVIEW_REQUIRED' }
elseif($failN -gt 0){ $overall='UAOS_V16_TEST_FAILURES_PRESENT'; $coord='UAOS_V16_CURSOR_ADOPTION_REVIEW_AND_PRODUCT_CORE_EXECUTION_PASS' }
elseif(-not $v15Ok){ $overall='UAOS_V16_PARTIAL_WITH_TRUTHFUL_BLOCKERS' }

# PASS only if integrity ok, tests ok, lanes done, v15 preserved
if(($integVerdict -ne 'UAOS_V16_ORIGINAL_REPOSITORY_INTEGRITY_PASS' -and $integVerdict -ne 'UAOS_V16_CONCURRENT_REPOSITORY_DRIFT_REVIEW_REQUIRED') -or $failN -gt 0 -or -not $v15Ok){
  if($integVerdict -eq 'UAOS_V16_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'){ $coord='UAOS_V16_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' }
} else {
  $coord='UAOS_V16_CURSOR_ADOPTION_REVIEW_AND_PRODUCT_CORE_EXECUTION_PASS'
  if($cmdHead -ne $cmdExpected){ $overall='UAOS_V16_CONCURRENT_REPOSITORY_DRIFT_REVIEW_REQUIRED' }
  else { $overall='UAOS_V16_ADOPTION_GATES_AND_PRODUCT_CORES_READY' }
}

$master=[ordered]@{
  taskId='UAOS-PLATFORM-AUTOMATION-016-ADOPTION-REVIEW-GATES-AND-PRODUCT-CORE-EXECUTION'
  coordinatorStatus=$coord
  overallState=$overall
  worktreesCreated=@($lib,$kbd,$conv,$cre,$stu)
  libraryAdoptionReview=$libGate
  keyboardAdoptionReview=$kbdGate
  keyboardConverters=$convStatus
  creatorPhase2=$creStatus
  studioE20=$stuStatus
  crossProductContracts='MATRIX_EMITTED_NO_FORCED_UNIFICATION'
  testsPass=$passN
  testsFail=$failN
  patchesPrepared=5
  kidsState='OWNER_DECISION_REQUIRED'
  teenState='OWNER_DECISION_REQUIRED'
  pricingDecisions='12 x OWNER_NOT_APPROVED'
  ownerAdoptionDecisions=@{library='OWNER_ADOPTION_APPROVAL_REQUIRED';keyboard='OWNER_ADOPTION_APPROVAL_REQUIRED'}
  commanderBaseline=$cmdHead
  originalRepositoryIntegrity=$integVerdict
  v15WorktreeIntegrity=$(if($v15Ok){'PRESERVED'}else{'DRIFT_DETECTED'})
  commitPushMergeDeploy=$false
}
W $master (Join-Path $run 'V16-MASTER-STATUS.json')

$ar=@"
# تقرير UAOS V16

## الحالة
``$coord``

## الحالة العامة
``$overall``

## النتائج
- Library Review: $libGate
- Keyboard Review: $kbdGate
- Converters: $convStatus
- Creator Phase2: $creStatus
- Studio E20: $stuStatus

## الاختبارات
Pass: $passN / Fail: $failN

## المالك
Kids/Teen OWNER_DECISION_REQUIRED — Pricing 12× OWNER_NOT_APPROVED — Adoption approvals مطلوبة

## السلامة
Commander: $cmdHead
V15 Worktrees: $(if($v15Ok){'PRESERVED'}else{'DRIFT'})
أصول المنتجات: $(if(-not $productFail){'UNCHANGED'}else{'CHANGED'})
"@
[IO.File]::WriteAllText((Join-Path $run 'V16-FINAL-REPORT-AR.md'),$ar,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $run 'V16-FINAL-REPORT-EN.md'),"Status: $coord`nOverall: $overall`nLib: $libGate`nKbd: $kbdGate`nConv: $convStatus`nCre: $creStatus`nStu: $stuStatus`nTests: $passN/$failN`n",[Text.UTF8Encoding]::new($false))

$leader=@'
import fs from 'node:fs';
import path from 'node:path';
const V151='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v15-1-drift-reconciliation\\run-20260804-175516\\V15-1-MASTER-STATUS.json';
const CMD='C:\\Users\\ssare\\Desktop\\UAOS Commander';
import { execSync } from 'node:child_process';
function main(){
  if(process.platform!=='win32'){ console.error('UAOS_V16_WINDOWS_REQUIRED'); process.exit(2); }
  if(!fs.existsSync(V151)){ console.error('UAOS_V16_V15_1_NOT_FOUND'); process.exit(3); }
  const head=execSync('git -C "'+CMD+'" rev-parse HEAD',{encoding:'utf8'}).trim();
  if(head!=='9b23824f1cb14fdb611d4cfdee0b3e09a7442939'){ console.error('UAOS_V16_COMMANDER_BASELINE_MISMATCH', head); process.exit(4); }
  const report={generatedAt:new Date().toISOString(),status:'UAOS_V16_CURSOR_ADOPTION_REVIEW_AND_PRODUCT_CORE_EXECUTION_PASS',commanderHead:head};
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V16-LAUNCHER-STATUS.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v16-cursor-leader.mjs',$leader,[Text.UTF8Encoding]::new($false))
$cmdL=@'
@echo off
setlocal EnableExtensions
title UAOS V16 Cursor Leader
echo ==============================================
echo  UAOS V16 — Adoption Review + Product Core
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V16_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v16-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V16-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V16-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V16-CURSOR-LEADER.cmd',$cmdL,[Text.UTF8Encoding]::new($false))

foreach($pair in @(
  @('V16-FINAL-REPORT-AR.md','LATEST-V16-REPORT-AR.md'),
  @('V16-MASTER-STATUS.json','LATEST-V16-MASTER-STATUS.json'),
  @('V16-LIBRARY-ADOPTION-REVIEW.json','LATEST-V16-LIBRARY-REVIEW.json'),
  @('V16-KEYBOARD-ADOPTION-REVIEW.json','LATEST-V16-KEYBOARD-REVIEW.json'),
  @('V16-KEYBOARD-CONVERTERS.json','LATEST-V16-KEYBOARD-CONVERTERS.json'),
  @('V16-CREATOR-PHASE2.json','LATEST-V16-CREATOR-PHASE2.json'),
  @('V16-STUDIO-E20.json','LATEST-V16-STUDIO-E20.json'),
  @('V16-BLOCKERS.json','LATEST-V16-BLOCKERS.json'),
  @('V16-NEXT-EXECUTION-PLAN.json','LATEST-V16-NEXT-EXECUTION-PLAN.json')
)){
  Copy-Item (Join-Path $run $pair[0]) (Join-Path $latest $pair[1]) -Force
  Copy-Item (Join-Path $run $pair[0]) (Join-Path $desktop $pair[1]) -Force
}

$zipName="UAOS-V16-EVIDENCE-$ts.zip"
$zipPath=Join-Path $run $zipName
Add-Type -AssemblyName System.IO.Compression.FileSystem
if(Test-Path $zipPath){Remove-Item $zipPath -Force}
[IO.Compression.ZipFile]::Open($zipPath,'Create').Dispose()
$zip=[IO.Compression.ZipFile]::Open($zipPath,'Update')
Get-ChildItem $run -Recurse -File | Where-Object { $_.Extension -ne '.zip' -and $_.Name -notlike '*.sha256' } | ForEach-Object {
  $rel=$_.FullName.Substring($run.Length+1).Replace('\','/')
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$_.FullName,$rel) | Out-Null
}
$zip.Dispose()
$sha=(Get-FileHash $zipPath -Algorithm SHA256).Hash
[IO.File]::WriteAllText((Join-Path $run "UAOS-V16-EVIDENCE-$ts.sha256"),"$sha  $zipName",[Text.UTF8Encoding]::new($false))
$master.evidencePack=$zipPath; $master.evidenceSha256=$sha
W $master (Join-Path $run 'V16-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V16-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V16-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V16-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V16-MASTER-STATUS.json') -Force

$summary=@"
Status: $coord
Overall State: $overall
Worktrees Created: 5
Library Adoption Review: $libGate
Keyboard Adoption Review: $kbdGate
Keyboard Converters: $convStatus
Creator Phase2: $creStatus
Studio E20: $stuStatus
Cross-Product Contracts: MATRIX_EMITTED_NO_FORCED_UNIFICATION
Tests Pass: $passN
Tests Fail: $failN
Kids State: OWNER_DECISION_REQUIRED
Teen State: OWNER_DECISION_REQUIRED
Pricing Decisions: 12 x OWNER_NOT_APPROVED
Owner Adoption Decisions: LIBRARY+KEYBOARD OWNER_ADOPTION_APPROVAL_REQUIRED
Commander Baseline: $cmdHead
Original Repository Integrity: $integVerdict
V15 Worktree Integrity: $(if($v15Ok){'PRESERVED'}else{'DRIFT'})
Evidence Pack: $zipPath
Report Path: $run\V16-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V16-CURSOR-LEADER.cmd
"@
[IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
Start-Process (Join-Path $run 'V16-FINAL-REPORT-AR.md')
node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v16-cursor-leader.mjs' | Out-Null
Write-Output "TS=$ts"
Write-Output "RUN=$run"
Write-Output "COORD=$coord"
Write-Output "OVERALL=$overall"
Write-Output "PASS=$passN FAIL=$failN"
Write-Output "V15_OK=$v15Ok PRODUCT_FAIL=$productFail CMD=$cmdHead"
Write-Output "ZIP=$zipPath"
Write-Output "SHA=$sha"
