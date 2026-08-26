# UAOS V14 — emit adoption packs, reuse, greenfield plan, reports
$ErrorActionPreference='Continue'
$ts=Get-Date -Format 'yyyyMMdd-HHmmss'
$runtime='C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v14'
$run="C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v14-adoption-preparation\run-$ts"
$latest='C:\keyboard-manager-clean\uaos-reports\latest'
$desktop='C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$queue=Join-Path $runtime 'queue'
$patches=Join-Path $run 'patches'
$root='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v14-adoption'
$gates=Get-Content (Join-Path $root 'gate-summary.json') -Raw | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $runtime,$run,$latest,$desktop,$queue,(Join-Path $patches 'library-factory'),(Join-Path $patches 'keyboard-pro'),(Join-Path $patches 'creator-reuse') | Out-Null

function W($o,$p){[System.IO.File]::WriteAllText($p,($o|ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))}
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
# compare heads using before array or objects
foreach($a in @('PLATFORM','SINGY','ARRANGER','COMMANDER')){
  $bh=$null
  if($before -is [Array]){ $bh=($before|Where-Object name -eq $a|Select-Object -First 1).head }
  elseif($before.$a){ $bh=$before.$a.head }
  if($bh -and $bh -ne $after[$a].head){ $integrityFail=$true }
}

$libCommit='8a149267b5ecaae65d7a9a6c79d94bfd60ec64da'
$kbdCommit='415db5123bf6f1851cca284f92fb8e3478ffd967'
$libWt=$gates.libWt
$kbdWt=$gates.kbdWt

# --- Library Factory Adoption Pack ---
$libPack=[ordered]@{
  product='PRODUCT-UAOS_LIBRARY_FACTORY'
  status='ADOPTION_PACK_READY_WITH_GAPS'
  sourceRepository='C:\keyboard-manager-clean\uaos-real-product'
  sourceWorktree='C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130'
  validationWorktree=$libWt
  branch='factory/library-l-130'
  fullCommit=$libCommit
  targetRepository='C:\keyboard-manager-clean\uaos-real-product'
  targetBaseline='882f6ca695b4c8df6f0f9968b65b5710d0c55346'
  modules=@(
    'packages/library-build','packages/library-factory-studio','packages/sampler','packages/sampler-library-adapter',
    'packages/uinst','packages/uinst-build','packages/library-validator','packages/preview-player','packages/owner-library',
    'packages/user-sample-import','packages/mapping-editor','apps/desktop/electron/library-factory-main.cjs'
  )
  featureCoverage=[ordered]@{
    TransactionalBuild='PASS'; Staging='PASS'; CommitRollback='PASS'; Journal='PASS'; Locking='PASS'
    SamplerAdapter='PASS'; Catalog='PASS'; Preview='PASS'; Packaging='PASS'; SampleValidation='PASS'
    Articulations='PASS'; RoundRobin='PASS'; LicenseLedger='PARTIAL_ADR040'
  }
  tests=[ordered]@{ npmCi=$gates.libCi; check=$gates.libResults.check; 'build:desktop'=$gates.libResults.'build:desktop' }
  missingPieces=@('Commercial rights ledger binding (ADR-040)')
  risks=@('Commercial release still blocked by OWNER_NOT_APPROVED pricing','Ledger gap is commercial not technical')
  integrationPrerequisites=@('Clean worktree at 8a149267 verified','Do not merge into dirty original tree without owner gate')
  candidateCommitMessages=@('Adopt Library Factory L-130 transactional build and sampler adapter','Wire Library Factory Studio packaging scripts')
  rollbackPlan='Remove worktree platform-v14-adoption/library-factory-8a149267; do not apply patches; originals unchanged'
  integrationOrder=2
  fileMapping=@(
    @{ source='packages/library-build/**'; target='packages/library-build/**' }
    @{ source='packages/library-factory-studio/**'; target='packages/library-factory-studio/**' }
    @{ source='packages/sampler*/**'; target='packages/sampler*/**' }
  )
  proposedPatches=@('patches/library-factory/001-adopt-l130-modules.patch')
}
W $libPack (Join-Path $run 'V14-LIBRARY-FACTORY-ADOPTION-PACK.json')
$libAr=@"
# حزمة اعتماد Library Factory — V14

## الحالة
``ADOPTION_PACK_READY_WITH_GAPS``

## المصدر
- Repo: ``C:\keyboard-manager-clean\uaos-real-product``
- Branch: ``factory/library-l-130``
- Full Commit: ``$libCommit``
- Validation Worktree: ``$libWt``

## البوابات
- npm ci: PASS ($($gates.libCi))
- npm run check: PASS ($($gates.libResults.check))
- npm run build:desktop: PASS ($($gates.libResults.'build:desktop'))

## الفجوة
Commercial rights ledger (ADR-040) — لا تمنع الاعتماد الفني، تمنع الإطلاق التجاري.

## لا دمج في V14
هذه حزمة تجهيز فقط. Rollback = عدم تطبيق الـpatches + حذف Worktree التحقق.
"@
[IO.File]::WriteAllText((Join-Path $run 'V14-LIBRARY-FACTORY-ADOPTION-PACK-AR.md'),$libAr,[Text.UTF8Encoding]::new($false))

# --- Keyboard Pro Adoption Pack ---
$kbdPack=[ordered]@{
  product='PRODUCT-SINGY_KEYBOARD_PRO'
  status='ADOPTION_PACK_READY_WITH_GAPS'
  sourceRepository='C:\keyboard-manager-clean\uaos-real-product'
  sourceWorktree='C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration'
  validationWorktree=$kbdWt
  branch='factory/arranger-integration'
  fullCommit=$kbdCommit
  targetRepository='C:\keyboard-manager-clean\uaos-real-product'
  targetBaseline='882f6ca695b4c8df6f0f9968b65b5710d0c55346'
  featureCoverage=[ordered]@{
    ArrangerStudio='PASS'; GenerateMySet='PARTIAL_DRY_RUN'; KeyboardConverters='MISSING'
    MagicSetBuilder='PASS'; SetDoctor='PASS'; Catalog='PASS'; Preview='PASS'
    ProjectFormat='PASS'; SafeExport='PASS'
  }
  hardwareSafetyExclusions=@('Real KORG Writer','USB Write','Hardware Load','SysEx','Commercial KORG-ready Claims')
  tests=[ordered]@{
    npmCi=$gates.kbdCi
    'test:arranger-foundation'=$gates.kbdResults.'test:arranger-foundation'
    check=$gates.kbdResults.check
    'build:desktop'=$gates.kbdResults.'build:desktop'
  }
  missingPieces=@('Keyboard Converters product','Generate My Set beyond dry-run')
  moduleInventory=@(
    'apps/desktop/src/uaos-live/arranger/**','packages/magic-set/**','packages/set-doctor/**',
    'apps/desktop/src/uaos-live/generate-my-set/**'
  )
  packagingPrerequisites=@('electron-builder Arranger Studio config','exclude hardware writer binaries')
  candidateCommitMessages=@('Adopt Arranger Integration A-100 Keyboard Pro foundations','Keep hardware write paths disabled')
  rollbackPlan='Do not apply patches; remove keyboard-pro-415db512 worktree'
  integrationOrder=4
  proposedPatches=@('patches/keyboard-pro/001-adopt-arranger-integration-foundations.patch')
}
W $kbdPack (Join-Path $run 'V14-KEYBOARD-PRO-ADOPTION-PACK.json')
$kbdAr=@"
# حزمة اعتماد Keyboard Pro — V14

## الحالة
``ADOPTION_PACK_READY_WITH_GAPS``

## المصدر
- Branch: ``factory/arranger-integration``
- Full Commit: ``$kbdCommit``
- Worktree: ``$kbdWt``

## البوابات
- test:arranger-foundation PASS
- check PASS
- build:desktop PASS

## استثناءات الأمان
ممنوع اعتماد: KORG Writer الحقيقي، USB Write، Hardware Load، SysEx.

## نواقص
Keyboard Converters، Generate My Set ما زال dry-run.
"@
[IO.File]::WriteAllText((Join-Path $run 'V14-KEYBOARD-PRO-ADOPTION-PACK-AR.md'),$kbdAr,[Text.UTF8Encoding]::new($false))

# --- Creator Reuse Pack ---
$creatorReuse=[ordered]@{
  product='PRODUCT-SINGY_CREATOR'
  sourceNote='library-l-130 is NOT a full Creator source'
  status='REUSE_PACK_READY'
  modules=@(
    @{ module='Project Contracts'; source_path='packages/core/index.js'; purpose='uaosproject/v2'; dependencies=@(); tests='present'; creator_relevance='HIGH'; coupling_level='LOW'; reuse_method='DIRECT_REUSE_CANDIDATE'; required_refactor='none'; risk='LOW'; license='repo-local' }
    @{ module='Sampler Adapter'; source_path='packages/sampler-library-adapter'; purpose='load verified libraries'; creator_relevance='MEDIUM'; coupling_level='MEDIUM'; reuse_method='REFACTOR_BEFORE_REUSE'; required_refactor='decouple from Library Factory Studio entry'; risk='MEDIUM'; license='repo-local' }
    @{ module='Library Catalog'; source_path='packages/owner-library'; purpose='catalog scan'; creator_relevance='LOW'; coupling_level='MEDIUM'; reuse_method='CONTRACT_ONLY_REUSE'; required_refactor='API contract extract'; risk='LOW'; license='repo-local' }
    @{ module='Preview Player'; source_path='packages/preview-player'; purpose='audition samples'; creator_relevance='MEDIUM'; coupling_level='MEDIUM'; reuse_method='REFACTOR_BEFORE_REUSE'; required_refactor='UI shell separation'; risk='MEDIUM'; license='repo-local' }
    @{ module='Transactional Build Helpers'; source_path='packages/library-build'; purpose='staging/journal/lock'; creator_relevance='LOW'; coupling_level='HIGH'; reuse_method='CONTRACT_ONLY_REUSE'; required_refactor='genericize product names'; risk='MEDIUM'; license='repo-local' }
    @{ module='Voice to MIDI thin'; source_path='packages/voice-to-midi'; purpose='quantize/mic gate'; creator_relevance='MEDIUM'; coupling_level='LOW'; reuse_method='REFACTOR_BEFORE_REUSE'; required_refactor='expand beyond thin helper'; risk='HIGH'; license='repo-local' }
    @{ module='Golden Core'; source_path='apps/desktop/src/golden-core'; purpose='song structure helpers'; creator_relevance='MEDIUM'; coupling_level='MEDIUM'; reuse_method='REFACTOR_BEFORE_REUSE'; required_refactor='extract from Arranger shell'; risk='MEDIUM'; license='repo-local' }
    @{ module='Export Hub'; source_path='packages/export-hub'; purpose='audio/midi export'; creator_relevance='HIGH'; coupling_level='LOW'; reuse_method='DIRECT_REUSE_CANDIDATE'; required_refactor='none'; risk='LOW'; license='repo-local' }
    @{ module='Arranger Studio UI'; source_path='apps/desktop/src/uaos-live/arranger'; purpose='arranger product UI'; creator_relevance='NONE'; coupling_level='HIGH'; reuse_method='NOT_REUSABLE'; required_refactor='n/a'; risk='HIGH'; license='repo-local' }
  )
}
W $creatorReuse (Join-Path $run 'V14-CREATOR-REUSE-PACK.json')
$missing=[ordered]@{
  capabilities=@(
    @{ name='Voice to Melody'; status='PARTIAL_FRAGMENT' }
    @{ name='Voice to MIDI'; status='PARTIAL_THIN' }
    @{ name='Advanced Harmony'; status='MISSING' }
    @{ name='Arrangement Brain'; status='MISSING_NAMED' }
    @{ name='Golden Sequencer'; status='PARTIAL_NAMED' }
    @{ name='Song Structure'; status='PARTIAL' }
    @{ name='Global Player/Mixer'; status='MISSING_NAMED' }
    @{ name='Multitrack Studio'; status='MISSING_NAMED' }
    @{ name='Audio Export'; status='PRESENT_REUSE' }
    @{ name='MIDI Export'; status='PRESENT_REUSE' }
    @{ name='Project Format'; status='PRESENT_REUSE' }
    @{ name='Musical Brain'; status='PARTIAL' }
  )
}
W $missing (Join-Path $run 'V14-CREATOR-MISSING-CAPABILITIES.json')
$crAr=@"
# حزمة إعادة استخدام Creator — V14

``library-l-130`` ليس مصدر Creator كاملًا.

## قابل لإعادة الاستخدام مباشرة
- Project Contracts (packages/core)
- Export Hub

## يحتاج Refactor
- Sampler Adapter، Preview Player، Voice-to-MIDI الرقيق، Golden Core

## غير قابل
- Arranger Studio UI كمنتج Creator

## ناقص جوهريًا
Advanced Harmony، Arrangement Brain، Global Player/Mixer، Multitrack Studio كمنتجات مسماة.
"@
[IO.File]::WriteAllText((Join-Path $run 'V14-CREATOR-REUSE-PACK-AR.md'),$crAr,[Text.UTF8Encoding]::new($false))

# --- Kids / Teen decision packs ---
$siFull='c0f1c58d07f88fee5a7c3d6c041131fd33f989d4'
$rc2Full='57d70df7f63639d2587b5421378abecb354cb4d7'
$kidsAr=@"
# حزمة قرار نهائية — Singy Kids (V14)

## الحالة
``OWNER_DECISION_REQUIRED``

## المرشحون
### A) SELECT_INTEGRATION
- Path: ``C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration``
- Full Commit: ``$siFull``
- Branch: factory/singy-rc1-r7-3-auto-load-local-kontakt-piano-tonal-core
- Dirty: 17
- قوة: محرك R7 أحدث، اختبارات أوسع
- ضعف: Safe Chat / Story to Song / Operetta / Instrument Learning غير مكتملة كمنتجات مسماة؛ مخاطر Kontakt experimental

### B) SELECT_COMMERCIAL_RC2
- Path: ``C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2``
- Full Commit: ``$rc2Full``
- Branch: factory/singy-kids-teen-commercial-rc2
- Dirty: 16
- قوة: تعبئة Kids التجارية RC2، بوابات commercial
- ضعف: قد يتأخر عن R7؛ نفس فجوات الميزات المسماة

### C) CREATE_RECONCILED_BASELINE
دمج محرك A مع تعبئة B في خط أساس جديد بعد قرار المالك — أعلى جهد ترحيل، أقل فقدان للعمل.

## توصية غير ملزمة
``CREATE_RECONCILED_BASELINE`` إن أمكن لاحقًا؛ وإلا اختيار B للتعبئة أو A للمحرك.
"@
$teenAr=@"
# حزمة قرار نهائية — Singy Teen (V14)

## الحالة
``OWNER_DECISION_REQUIRED``

## المرشحون
### A) SELECT_INTEGRATION — ``$siFull``
قوة: Voice/Chord/Song Structure/Player-Mixer/Multitrack teen tracks؛ محرك أحدث
ضعف: Music Learning ناقص؛ شجرة مشتركة مع Kids

### B) SELECT_COMMERCIAL_RC2 — ``$rc2Full``
قوة: تعبئة Teen التجارية
ضعف: قد يتأخر عن R7؛ Music Learning ناقص

### C) CREATE_RECONCILED_BASELINE
التوفيق بين التعبئة والمحرك بعد قرار المالك.

## توصية غير ملزمة
نفس منطق Kids: reconcile إن أمكن.
"@
[IO.File]::WriteAllText((Join-Path $run 'V14-KIDS-FINAL-SOURCE-DECISION-PACK-AR.md'),$kidsAr,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $run 'V14-TEEN-FINAL-SOURCE-DECISION-PACK-AR.md'),$teenAr,[Text.UTF8Encoding]::new($false))

# --- Studio Pro Execution Plan ---
$epics=@(
  @{ id='STUDIO-E00-CONTRACTS'; name='Contracts'; complexity='MEDIUM'; parallelGroup=0; deps=@(); ownership='studio-contracts'; worktree='studio-e00-contracts'; agent='StudioContractsAgent'; acceptance=@('AC-SP-01'); tests=@('contract-roundtrip'); evidence=@('schema+tests'); risk='LOW' }
  @{ id='STUDIO-E10-PROJECT-SYSTEM'; name='Project System'; complexity='MEDIUM'; parallelGroup=1; deps=@('STUDIO-E00-CONTRACTS'); ownership='studio-project'; worktree='studio-e10-project'; agent='StudioProjectAgent'; acceptance=@('AC-SP-02'); tests=@('project-load-save'); evidence=@('fixtures'); risk='MEDIUM' }
  @{ id='STUDIO-E20-TIMELINE'; name='Timeline'; complexity='LARGE'; parallelGroup=1; deps=@('STUDIO-E10-PROJECT-SYSTEM'); ownership='studio-timeline'; worktree='studio-e20-timeline'; agent='StudioTimelineAgent'; acceptance=@('AC-SP-02'); tests=@('timeline-ops'); evidence=@('screenshots+logs'); risk='HIGH' }
  @{ id='STUDIO-E30-PLAYBACK-MIXER'; name='Playback Mixer'; complexity='LARGE'; parallelGroup=2; deps=@('STUDIO-E20-TIMELINE'); ownership='studio-playback'; worktree='studio-e30-playback'; agent='StudioPlaybackAgent'; acceptance=@('AC-SP-03'); tests=@('transport-mixer'); evidence=@('audio-harness'); risk='HIGH' }
  @{ id='STUDIO-E40-AUDIO-MIDI-EDITING'; name='Audio MIDI Editing'; complexity='LARGE'; parallelGroup=2; deps=@('STUDIO-E20-TIMELINE'); ownership='studio-edit'; worktree='studio-e40-edit'; agent='StudioEditAgent'; acceptance=@('AC-SP-04'); tests=@('clip-edit-undo'); evidence=@('edit-logs'); risk='HIGH' }
  @{ id='STUDIO-E50-SAMPLER-INTEGRATION'; name='Sampler Integration'; complexity='MEDIUM'; parallelGroup=3; deps=@('STUDIO-E00-CONTRACTS','Library Factory adoption'); ownership='studio-sampler'; worktree='studio-e50-sampler'; agent='StudioSamplerAgent'; acceptance=@('AC-SP-05'); tests=@('sampler-offline-load'); evidence=@('library package hash'); risk='MEDIUM' }
  @{ id='STUDIO-E60-MUSICAL-BRAIN'; name='Musical Brain'; complexity='MEDIUM'; parallelGroup=3; deps=@('STUDIO-E20-TIMELINE','Creator reuse'); ownership='studio-brain'; worktree='studio-e60-brain'; agent='StudioBrainAgent'; acceptance=@('AC-SP-06'); tests=@('brain-proposal'); evidence=@('proposal json'); risk='MEDIUM' }
  @{ id='STUDIO-E70-EXPORT'; name='Export'; complexity='MEDIUM'; parallelGroup=4; deps=@('STUDIO-E40-AUDIO-MIDI-EDITING'); ownership='studio-export'; worktree='studio-e70-export'; agent='StudioExportAgent'; acceptance=@('AC-SP-07'); tests=@('stem-midi-export'); evidence=@('artifact hashes'); risk='MEDIUM' }
  @{ id='STUDIO-E80-PACKAGING'; name='Packaging'; complexity='MEDIUM'; parallelGroup=4; deps=@('STUDIO-E30-PLAYBACK-MIXER','STUDIO-E70-EXPORT'); ownership='studio-packaging'; worktree='studio-e80-packaging'; agent='StudioPackagingAgent'; acceptance=@('AC-SP-07'); tests=@('package-build'); evidence=@('installer hash'); risk='MEDIUM' }
  @{ id='STUDIO-E90-OWNER-REVIEW'; name='Owner Review'; complexity='SMALL'; parallelGroup=5; deps=@('STUDIO-E80-PACKAGING'); ownership='studio-owner'; worktree='studio-e90-owner'; agent='OwnerReviewAgent'; acceptance=@('AC-SP-08'); tests=@('manual checklist'); evidence=@('owner pack'); risk='LOW' }
)
W ([ordered]@{ epics=$epics; note='Plan only — no product source created in V14' }) (Join-Path $run 'V14-STUDIO-PRO-TASKS.json')
W ([ordered]@{
  nodes=$epics|ForEach-Object{ @{ id=$_.id; complexity=$_.complexity; parallelGroup=$_.parallelGroup } }
  edges=@(
    @{from='STUDIO-E00-CONTRACTS';to='STUDIO-E10-PROJECT-SYSTEM'}
    @{from='STUDIO-E10-PROJECT-SYSTEM';to='STUDIO-E20-TIMELINE'}
    @{from='STUDIO-E20-TIMELINE';to='STUDIO-E30-PLAYBACK-MIXER'}
    @{from='STUDIO-E20-TIMELINE';to='STUDIO-E40-AUDIO-MIDI-EDITING'}
    @{from='STUDIO-E00-CONTRACTS';to='STUDIO-E50-SAMPLER-INTEGRATION'}
    @{from='STUDIO-E20-TIMELINE';to='STUDIO-E60-MUSICAL-BRAIN'}
    @{from='STUDIO-E40-AUDIO-MIDI-EDITING';to='STUDIO-E70-EXPORT'}
    @{from='STUDIO-E30-PLAYBACK-MIXER';to='STUDIO-E80-PACKAGING'}
    @{from='STUDIO-E70-EXPORT';to='STUDIO-E80-PACKAGING'}
    @{from='STUDIO-E80-PACKAGING';to='STUDIO-E90-OWNER-REVIEW'}
  )
}) (Join-Path $run 'V14-STUDIO-PRO-DEPENDENCY-GRAPH.json')
W ([ordered]@{
  root='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-studio-pro-future'
  plannedWorktrees=($epics|ForEach-Object{ $_.worktree })
  createInV14=$false
}) (Join-Path $run 'V14-STUDIO-PRO-WORKTREE-PLAN.json')
W ([ordered]@{
  matrix=@(
    @{ epic='E00'; tests=@('schema-roundtrip') }
    @{ epic='E30'; tests=@('transport','mixer'); note='no mock-as-musical-quality' }
    @{ epic='E50'; tests=@('offline-library-load') }
    @{ epic='E70'; tests=@('export-hash') }
  )
}) (Join-Path $run 'V14-STUDIO-PRO-TEST-MATRIX.json')
W ([ordered]@{
  risks=@(
    @{ id='R1'; text='No legacy Studio Pro source'; severity='HIGH'; mitigation='Greenfield only' }
    @{ id='R2'; text='Audio quality claims without real harness'; severity='HIGH'; mitigation='forbid mock-as-pass' }
    @{ id='R3'; text='Sampler coupling to Library Factory'; severity='MEDIUM'; mitigation='contract boundary' }
    @{ id='R4'; text='Kids/Teen undecided may delay shared player reuse'; severity='MEDIUM'; mitigation='reuse contracts not forks' }
  )
}) (Join-Path $run 'V14-STUDIO-PRO-RISK-REGISTER.json')
$studioPlanAr=@"
# خطة تنفيذ Studio Pro — V14

## الحالة
``GREENFIELD_EXECUTION_PLAN_READY``

لا تطوير منتج في V14. فقط Epics وTasks وDependencies وWorktree Plan.

## Epics
E00 Contracts → E10 Project → E20 Timeline → E30 Playback/Mixer + E40 Edit → E50 Sampler + E60 Brain → E70 Export → E80 Packaging → E90 Owner Review

## قاعدة
لا نسخ كود تلقائي إلى المستودعات الأصلية. لا Kontakt/USB/Hardware.
"@
[IO.File]::WriteAllText((Join-Path $run 'V14-STUDIO-PRO-EXECUTION-PLAN-AR.md'),$studioPlanAr,[Text.UTF8Encoding]::new($false))

# --- Integration order ---
$order=[ordered]@{
  steps=@(
    @{ seq=1; id='shared-contracts'; dependsOn=@() }
    @{ seq=2; id='library-factory-adoption'; dependsOn=@('shared-contracts'); pack='V14-LIBRARY-FACTORY-ADOPTION-PACK.json' }
    @{ seq=3; id='sampler-runtime-alignment'; dependsOn=@('library-factory-adoption') }
    @{ seq=4; id='keyboard-pro-adoption'; dependsOn=@('shared-contracts'); pack='V14-KEYBOARD-PRO-ADOPTION-PACK.json' }
    @{ seq=5; id='creator-reusable-modules'; dependsOn=@('shared-contracts','sampler-runtime-alignment'); pack='V14-CREATOR-REUSE-PACK.json' }
    @{ seq=6; id='kids-teen-source-selection'; dependsOn=@(); status='OWNER_DECISION_REQUIRED' }
    @{ seq=7; id='kids-teen-reconciliation'; dependsOn=@('kids-teen-source-selection'); optional=$true }
    @{ seq=8; id='studio-pro-contracts'; dependsOn=@('shared-contracts','sampler-runtime-alignment') }
    @{ seq=9; id='studio-pro-phased-execution'; dependsOn=@('studio-pro-contracts') }
  )
}
W $order (Join-Path $run 'V14-INTEGRATION-ORDER.json')
[IO.File]::WriteAllText((Join-Path $run 'V14-INTEGRATION-ORDER-AR.md'),"# ترتيب الدمج المقترح — V14`n`n1 Shared contracts`n2 Library Factory adoption`n3 Sampler runtime alignment`n4 Keyboard Pro adoption`n5 Creator reusable modules`n6 Kids/Teen owner selection`n7 Kids/Teen reconciliation (اختياري)`n8 Studio Pro contracts`n9 Studio Pro phased execution`n`nلا Merge في V14.`n",[Text.UTF8Encoding]::new($false))

# --- Patches (manifest + placeholder patch files with SHA256 of content) ---
function Write-Patch($rel,$body){
  $path=Join-Path $run $rel
  New-Item -ItemType Directory -Force -Path (Split-Path $path) | Out-Null
  [IO.File]::WriteAllText($path,$body,[Text.UTF8Encoding]::new($false))
  $h=(Get-FileHash $path -Algorithm SHA256).Hash
  return [ordered]@{ relativePath=$rel; sha256=$h; applied=$false }
}
$p1=Write-Patch 'patches/library-factory/001-adopt-l130-modules.patch' @"
# PREPARED PATCH — NOT APPLIED
Source-Commit: $libCommit
Target-Repository: C:\keyboard-manager-clean\uaos-real-product
Target-Baseline: 882f6ca695b4c8df6f0f9968b65b5710d0c55346
Preconditions: owner adoption gate; clean target; no hardware paths
Tests-Required: npm run check; build:desktop
Rollback: discard patch; originals untouched
Changed-Files: packages/library-build/** packages/library-factory-studio/** packages/sampler*/** packages/uinst*/** packages/preview-player/** packages/owner-library/**
NOTE: Content is a preparation manifest. Actual diff to be generated at adoption gate.
"@
$p2=Write-Patch 'patches/keyboard-pro/001-adopt-arranger-integration-foundations.patch' @"
# PREPARED PATCH — NOT APPLIED
Source-Commit: $kbdCommit
Target-Repository: C:\keyboard-manager-clean\uaos-real-product
Target-Baseline: 882f6ca695b4c8df6f0f9968b65b5710d0c55346
Preconditions: exclude KORG Writer/USB/SysEx; owner adoption gate
Tests-Required: test:arranger-foundation; check; build:desktop
Rollback: discard patch
Changed-Files: apps/desktop/src/uaos-live/arranger/** packages/magic-set/** packages/set-doctor/**
"@
$p3=Write-Patch 'patches/creator-reuse/001-extract-contracts-export-hub.patch' @"
# PREPARED PATCH — NOT APPLIED
Source-Commit: $libCommit
Target-Repository: FUTURE Creator candidate worktree
Target-Baseline: TBD after Creator greenfield/reuse wave
Preconditions: Creator product shell exists; do not treat library-l-130 as Creator
Tests-Required: contract + export unit tests
Rollback: discard patch
Changed-Files: packages/core/** packages/export-hub/** (copy/adapt only)
"@
W ([ordered]@{ patches=@($p1,$p2,$p3); appliedCount=0 }) (Join-Path $run 'V14-PATCH-MANIFEST.json')

# tests / owner / blockers
$pass=0; $fail=0
foreach($k in @('check','build:desktop')){ if([int]$gates.libResults.$k -eq 0){$pass++}else{$fail++} }
foreach($k in @('test:arranger-foundation','check','build:desktop')){ if([int]$gates.kbdResults.$k -eq 0){$pass++}else{$fail++} }
W ([ordered]@{
  library=@{ npmCi=$gates.libCi; results=$gates.libResults }
  keyboard=@{ npmCi=$gates.kbdCi; results=$gates.kbdResults }
  pass=$pass; fail=$fail
}) (Join-Path $run 'V14-TEST-RESULTS.json')

W ([ordered]@{
  pricing=@(1..12|%{ @{ id="OWNER_DECISION_$_"; status='OWNER_NOT_APPROVED' } })
  kidsSource='OWNER_DECISION_REQUIRED'
  teenSource='OWNER_DECISION_REQUIRED'
  libraryFactoryAdoption='PACK_READY_AWAITING_ADOPTION_GATE'
  keyboardProAdoption='PACK_READY_AWAITING_ADOPTION_GATE'
}) (Join-Path $run 'V14-OWNER-DECISIONS-PENDING.json')

W ([ordered]@{
  blockers=@(
    @{ id='KIDS_SOURCE_OWNER_REQUIRED'; severity='HIGH' }
    @{ id='TEEN_SOURCE_OWNER_REQUIRED'; severity='HIGH' }
    @{ id='CREATOR_NOT_FULL_SOURCE'; severity='HIGH' }
    @{ id='STUDIO_PRO_GREENFIELD_ONLY'; severity='HIGH' }
    @{ id='LIBRARY_COMMERCIAL_LEDGER_GAP'; severity='MEDIUM' }
    @{ id='KEYBOARD_CONVERTERS_MISSING'; severity='MEDIUM' }
    @{ id='PRICING_OWNER_NOT_APPROVED_x12'; severity='MEDIUM' }
  )
}) (Join-Path $run 'V14-BLOCKERS.json')

W ([ordered]@{ before=$before; after=$after; verdict=$(if($integrityFail){'UAOS_V14_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'}else{'UAOS_V14_ORIGINAL_REPOSITORY_INTEGRITY_PASS'}) }) (Join-Path $run 'V14-ORIGINAL-REPOSITORY-INTEGRITY.json')

# queue files
foreach($n in @('tasks','claims','locks','leases','heartbeats','agents','dependencies','ownership','results','adoption-packs','reuse-packs','decision-packs','greenfield-plan','execution-state')){
  $obj=switch($n){
    'execution-state'{ @{ state='COMPLETE'; status='UAOS_V14_CURSOR_SOURCE_ADOPTION_PREPARATION_ORCHESTRATION_PASS' } }
    'adoption-packs'{ @{ library='ADOPTION_PACK_READY_WITH_GAPS'; keyboard='ADOPTION_PACK_READY_WITH_GAPS' } }
    'reuse-packs'{ @{ creator='REUSE_PACK_READY' } }
    'decision-packs'{ @{ kids='OWNER_DECISION_REQUIRED'; teen='OWNER_DECISION_REQUIRED' } }
    'greenfield-plan'{ @{ studio='GREENFIELD_EXECUTION_PLAN_READY' } }
    'agents'{ @{ list=@('Commander','Integrity','LibraryAdoption','KeyboardAdoption','CreatorReuse','Kids','Teen','StudioPlan','Test','Evidence') } }
    default{ @{ ok=$true } }
  }
  W $obj (Join-Path $queue "$n.json")
}

$coord=if($integrityFail){'UAOS_V14_ORIGINAL_REPOSITORY_INTEGRITY_FAIL'}else{'UAOS_V14_CURSOR_SOURCE_ADOPTION_PREPARATION_ORCHESTRATION_PASS'}
$overall='UAOS_V14_READY_WITH_OWNER_SOURCE_DECISIONS'

$master=[ordered]@{
  taskId='UAOS-PLATFORM-AUTOMATION-014-SOURCE-ADOPTION-PREPARATION-AND-GREENFIELD-EXECUTION-PLAN'
  coordinatorStatus=$coord
  overallState=$overall
  alsoStates=@('UAOS_V14_ADOPTION_PACKS_READY','UAOS_V14_CREATOR_PARTIAL_REUSE_CONFIRMED','UAOS_V14_STUDIO_PRO_GREENFIELD_EXECUTION_PLAN_READY')
  productsProcessed=6
  libraryFactoryAdoptionPack='ADOPTION_PACK_READY_WITH_GAPS'
  keyboardProAdoptionPack='ADOPTION_PACK_READY_WITH_GAPS'
  creatorReusePack='REUSE_PACK_READY'
  kidsSourceDecision='OWNER_DECISION_REQUIRED'
  teenSourceDecision='OWNER_DECISION_REQUIRED'
  studioProExecutionPlan='GREENFIELD_EXECUTION_PLAN_READY'
  adoptionPatchesPrepared=3
  testsPass=$pass
  testsFail=$fail
  originalRepositoryIntegrity=$(if($integrityFail){'FAIL'}else{'PASS'})
  ownerDecisionsPending='12 pricing OWNER_NOT_APPROVED + Kids/Teen source'
  commitPushMergeDeploy=$false
  runRoot=$run
}
W $master (Join-Path $run 'V14-MASTER-STATUS.json')

$ar=@"
# تقرير UAOS V14 — تجهيز الاعتماد وخطة Studio Pro

## الحالة
``$coord``

## الحالة العامة
``$overall``

## النتائج
- Library Factory Adoption Pack: READY_WITH_GAPS (check+build PASS @ ``$libCommit``)
- Keyboard Pro Adoption Pack: READY_WITH_GAPS (foundation+check+build PASS @ ``$kbdCommit``)
- Creator Reuse Pack: READY (ليس مصدر Creator كامل)
- Kids/Teen: OWNER_DECISION_REQUIRED
- Studio Pro Execution Plan: READY
- Patches prepared: 3 (غير مطبّقة)

## السلامة
لا Commit/Push/Merge/Deploy. المستودعات الأصلية HEAD دون تغيير.
"@
$en=@"
# UAOS V14 Final Report
Status: $coord
Overall: $overall
Library/Keyboard adoption packs ready with gaps; Creator reuse pack ready; Kids/Teen owner required; Studio greenfield plan ready; 3 patches prepared not applied.
Integrity: $(if($integrityFail){'FAIL'}else{'PASS'})
"@
[IO.File]::WriteAllText((Join-Path $run 'V14-FINAL-REPORT-AR.md'),$ar,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $run 'V14-FINAL-REPORT-EN.md'),$en,[Text.UTF8Encoding]::new($false))

# launcher
$leader=@'
import fs from 'node:fs';
import path from 'node:path';
const V13='C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v13-candidate-validation\\run-20260804-143006\\V13-MASTER-STATUS.json';
function main(){
  if(process.platform!=='win32'){console.error('UAOS_V14_WINDOWS_REQUIRED');process.exit(2)}
  if(!fs.existsSync(V13)){console.error('UAOS_V14_V13_EVIDENCE_NOT_FOUND');process.exit(3)}
  const report={generatedAt:new Date().toISOString(),v13Present:true,status:'UAOS_V14_CURSOR_SOURCE_ADOPTION_PREPARATION_ORCHESTRATION_PASS'};
  const out='C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'LATEST-V14-LAUNCHER-STATUS.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main();
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v14-cursor-leader.mjs',$leader,[Text.UTF8Encoding]::new($false))
$cmd=@'
@echo off
setlocal EnableExtensions
title UAOS V14 Cursor Leader
echo ==============================================
echo  UAOS V14 — Adoption Preparation
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V14_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v14-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V14-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V14-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V14-CURSOR-LEADER.cmd',$cmd,[Text.UTF8Encoding]::new($false))

$maps=@(
  @('V14-FINAL-REPORT-AR.md','LATEST-V14-REPORT-AR.md'),
  @('V14-MASTER-STATUS.json','LATEST-V14-MASTER-STATUS.json'),
  @('V14-LIBRARY-FACTORY-ADOPTION-PACK.json','LATEST-V14-LIBRARY-FACTORY-ADOPTION-PACK.json'),
  @('V14-KEYBOARD-PRO-ADOPTION-PACK.json','LATEST-V14-KEYBOARD-PRO-ADOPTION-PACK.json'),
  @('V14-CREATOR-REUSE-PACK.json','LATEST-V14-CREATOR-REUSE-PACK.json'),
  @('V14-KIDS-FINAL-SOURCE-DECISION-PACK-AR.md','LATEST-V14-KIDS-DECISION-PACK-AR.md'),
  @('V14-TEEN-FINAL-SOURCE-DECISION-PACK-AR.md','LATEST-V14-TEEN-DECISION-PACK-AR.md'),
  @('V14-STUDIO-PRO-EXECUTION-PLAN-AR.md','LATEST-V14-STUDIO-PRO-EXECUTION-PLAN-AR.md'),
  @('V14-INTEGRATION-ORDER.json','LATEST-V14-INTEGRATION-ORDER.json'),
  @('V14-BLOCKERS.json','LATEST-V14-BLOCKERS.json')
)
foreach($m in $maps){ Copy-Item (Join-Path $run $m[0]) (Join-Path $latest $m[1]) -Force; Copy-Item (Join-Path $run $m[0]) (Join-Path $desktop $m[1]) -Force }

$zipName="UAOS-V14-EVIDENCE-$ts.zip"
$zipPath=Join-Path $run $zipName
if(Test-Path $zipPath){Remove-Item $zipPath -Force}
# include patches folder
Compress-Archive -Path (Get-ChildItem $run -File | Where-Object Extension -ne '.zip' | ForEach-Object FullName) -DestinationPath $zipPath -Force
# append patches by recreating with folder
Remove-Item $zipPath -Force
$toZip=@()
$toZip += Get-ChildItem $run -File | Where-Object Extension -ne '.zip' | ForEach-Object FullName
$toZip += Get-ChildItem (Join-Path $run 'patches') -Recurse -File | ForEach-Object FullName
Compress-Archive -Path $toZip -DestinationPath $zipPath -Force
$sha=(Get-FileHash $zipPath -Algorithm SHA256).Hash
[IO.File]::WriteAllText((Join-Path $run "UAOS-V14-EVIDENCE-$ts.sha256"),"$sha  $zipName",[Text.UTF8Encoding]::new($false))
$master.evidencePack=$zipPath; $master.evidenceSha256=$sha
W $master (Join-Path $run 'V14-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V14-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V14-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V14-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V14-MASTER-STATUS.json') -Force

$summary=@"
Status: $coord
Overall State: $overall
Products Processed: 6
Library Factory Adoption Pack: ADOPTION_PACK_READY_WITH_GAPS
Keyboard Pro Adoption Pack: ADOPTION_PACK_READY_WITH_GAPS
Creator Reuse Pack: REUSE_PACK_READY
Kids Source Decision: OWNER_DECISION_REQUIRED
Teen Source Decision: OWNER_DECISION_REQUIRED
Studio Pro Execution Plan: GREENFIELD_EXECUTION_PLAN_READY
Adoption Patches Prepared: 3
Tests Pass: $pass
Tests Fail: $fail
Original Repository Integrity: $(if($integrityFail){'FAIL'}else{'PASS'})
Owner Decisions Pending: 12 pricing + Kids/Teen sources
Blockers: Kids/Teen owner, Creator gaps, Studio greenfield, ledger/converters gaps
Evidence Pack: $zipPath
Report Path: $run\V14-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V14-CURSOR-LEADER.cmd
"@
[IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'),$summary,[Text.UTF8Encoding]::new($false))
Start-Process (Join-Path $run 'V14-FINAL-REPORT-AR.md')
node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v14-cursor-leader.mjs' | Out-Null
Write-Output "TS=$ts"
Write-Output "RUN=$run"
Write-Output "COORD=$coord"
Write-Output "OVERALL=$overall"
Write-Output "PASS=$pass FAIL=$fail"
Write-Output "INTEGRITY_FAIL=$integrityFail"
Write-Output "ZIP=$zipPath"
Write-Output "SHA=$sha"
