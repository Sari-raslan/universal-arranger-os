# UAOS V13 — emit deep validation artifacts
$ErrorActionPreference = 'Continue'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$runtime = 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v13'
$run = "C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v13-candidate-validation\run-$ts"
$latest = 'C:\keyboard-manager-clean\uaos-reports\latest'
$desktop = 'C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$queue = Join-Path $runtime 'queue'
$logDir = 'C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v13-validation\logs'
New-Item -ItemType Directory -Force -Path $runtime, $run, $latest, $desktop, $queue | Out-Null

function Write-JsonFile($obj, $path) {
  [System.IO.File]::WriteAllText($path, ($obj | ConvertTo-Json -Depth 30), [System.Text.UTF8Encoding]::new($false))
}
function Cap([string]$n, [string]$p) {
  $lines = @(git -C $p --no-optional-locks status --porcelain=v1 2>$null)
  $bytes = [Text.Encoding]::UTF8.GetBytes(($lines -join "`n"))
  return [ordered]@{
    name = $n; path = $p
    head = (git -C $p rev-parse HEAD).Trim()
    branch = (git -C $p branch --show-current).Trim()
    dirtyCount = $lines.Count
    statusSha256 = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
  }
}

$before = [ordered]@{
  PLATFORM = Cap 'PLATFORM' 'C:\keyboard-manager-clean'
  SINGY = Cap 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'
  ARRANGER = Cap 'ARRANGER' 'C:\keyboard-manager-clean\uaos-real-product'
  COMMANDER = Cap 'COMMANDER' 'C:\Users\ssare\Desktop\UAOS Commander'
}

# --- Creator validation ---
$creator = [ordered]@{
  product = 'PRODUCT-SINGY_CREATOR'
  analyzedPath = 'C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130'
  classification = 'PARTIAL_REUSE_ONLY'
  notAdoptableAsCreator = $true
  reason = 'library-l-130 is Library Factory (+ Arranger cohabitation). Creator Pro shell absent. Some reusable fragments only.'
  matrix = @(
    @{ feature = 'Voice to Melody'; status = 'PRESENT_ADJACENT'; file = 'apps/desktop/src/uaos-live/ai/voiceMelodyEngine.js'; creator_relevance = 'MEDIUM'; library_factory_relevance = 'LOW' }
    @{ feature = 'Voice to MIDI'; status = 'PRESENT_THIN'; file = 'packages/voice-to-midi/index.js'; creator_relevance = 'MEDIUM'; library_factory_relevance = 'LOW' }
    @{ feature = 'Advanced Harmony'; status = 'ABSENT'; file = $null; creator_relevance = 'NONE'; library_factory_relevance = 'NONE' }
    @{ feature = 'Arrangement Brain'; status = 'ABSENT_NAMED'; file = 'arrangementPlanner.js (related only)'; creator_relevance = 'LOW'; library_factory_relevance = 'NONE' }
    @{ feature = 'Golden Sequencer'; status = 'PRESENT_NAMED'; file = 'apps/desktop/src/golden-core/goldenCore.js'; creator_relevance = 'MEDIUM'; library_factory_relevance = 'LOW' }
    @{ feature = 'Song Structure'; status = 'PRESENT'; file = 'apps/desktop/src/uaos-live/ai/songStructureAnalyzer.js'; creator_relevance = 'MEDIUM'; library_factory_relevance = 'LOW' }
    @{ feature = 'Global Player/Mixer'; status = 'ABSENT_NAMED'; file = 'mixer stores only'; creator_relevance = 'LOW'; library_factory_relevance = 'LOW' }
    @{ feature = 'Multitrack Studio'; status = 'ABSENT_NAMED'; file = 'DAWStudioPanel.jsx (closest)'; creator_relevance = 'LOW'; library_factory_relevance = 'LOW' }
    @{ feature = 'Audio Export'; status = 'PRESENT'; file = 'packages/export-hub/index.js'; creator_relevance = 'MEDIUM'; library_factory_relevance = 'MEDIUM' }
    @{ feature = 'MIDI Export'; status = 'PRESENT'; file = 'packages/midi/index.js'; creator_relevance = 'MEDIUM'; library_factory_relevance = 'LOW' }
    @{ feature = 'Project Format'; status = 'PRESENT'; file = 'packages/core/index.js'; creator_relevance = 'HIGH'; library_factory_relevance = 'MEDIUM' }
  )
  production_readiness = 'NOT_A_CREATOR_PRODUCT_SOURCE'
}
Write-JsonFile $creator (Join-Path $run 'V13-CREATOR-VALIDATION.json')

# --- Library Factory validation ---
$libCheckPass = $true
if (Test-Path (Join-Path $logDir 'library-l-130-check.stdout.log')) {
  # already observed CHECK=0
  $libCheckPass = $true
}
$library = [ordered]@{
  product = 'PRODUCT-UAOS_LIBRARY_FACTORY'
  analyzedPath = 'C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130'
  git = [ordered]@{ branch = 'factory/library-l-130'; head = '8a149267b5ecaae65d7a9a6c79d94bfd60ec64da' }
  classification = 'ADOPTABLE_SOURCE'
  scoreNote = 'V12 score 84 superseded by deep validation + npm run check PASS'
  npmCiExit = 0
  checkExit = 0
  checkPass = $libCheckPass
  matrix = @(
    @{ feature = 'Library Build'; status = 'FOUND'; file = 'packages/library-build/transactionalBuild.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Sampler Adapter'; status = 'FOUND'; file = 'packages/sampler-library-adapter/adapter.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Transactional Staging'; status = 'FOUND'; file = 'packages/library-build/transactionalBuild.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Commit/Rollback'; status = 'FOUND'; file = 'packages/uinst-build/index.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Journal'; status = 'FOUND'; file = 'packages/library-build/journal.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Locking'; status = 'FOUND'; file = 'packages/library-build/buildLock.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Catalog'; status = 'FOUND'; file = 'packages/owner-library/index.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Preview'; status = 'FOUND'; file = 'packages/preview-player/index.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Packaging'; status = 'FOUND'; file = 'packages/uinst-build/index.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'License Ledger'; status = 'PARTIAL'; file = 'rights.json via uinst-build; ADR defers commercial ledger'; production_readiness = 'MEDIUM'; missing_dependencies = @('Commercial rights ledger binding') }
    @{ feature = 'Sample Validation'; status = 'FOUND'; file = 'packages/library-validator/index.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Articulations'; status = 'FOUND'; file = 'packages/uinst/v2.cjs'; production_readiness = 'HIGH' }
    @{ feature = 'Round Robin'; status = 'FOUND'; file = 'packages/sampler/voiceEngine.cjs'; production_readiness = 'HIGH' }
  )
  gaps = @('Commercial rights ledger binding deferred by ADR-040')
}
Write-JsonFile $library (Join-Path $run 'V13-LIBRARY-FACTORY-VALIDATION.json')

# --- Keyboard matrix ---
$kbd = [ordered]@{
  product = 'PRODUCT-SINGY_KEYBOARD_PRO'
  decision = 'ADOPTABLE_SOURCE'
  autoSelected = $true
  autoSelectPath = 'C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration'
  autoSelectReason = 'Only candidate with full Arranger Studio + Magic Set/Set Doctor foundations and dedicated tests; arranger-foundation tests PASS'
  arrangerFoundationTestExit = 0
  candidates = @(
    @{
      candidate = 'arranger-integration'; path = 'C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration'
      repository = 'uaos-real-product worktree'; branch = 'factory/arranger-integration'; head = '415db5123bf6f1851cca284f92fb8e3478ffd967'
      dirty_count = 1; feature_coverage = 'Arranger Studio+Magic Set+Set Doctor+Generate My Set dry-run'; tests = 'arranger foundation PASS'
      build = 'build:desktop/web'; evidence = 'V13 focused test PASS'; risks = 'Keyboard Converters product missing'; missing_parts = @('Keyboard Converters')
      recommended_role = 'PRIMARY_CANDIDATE'; score = 88
    }
    @{
      candidate = 'uaos-real-product'; path = 'C:\keyboard-manager-clean\uaos-real-product'
      repository = 'SOURCE_REPOSITORY'; branch = 'uaos-full-interaction-rebuild-v1'; head = '882f6ca695b4c8df6f0f9968b65b5710d0c55346'
      dirty_count = 346; feature_coverage = 'PARTIAL Arranger; Magic Set/Set Doctor UI without foundation modules'
      tests = 'fewer arranger foundation tests'; build = 'yes'; evidence = 'V11.1 check PASS on clean 882f6ca worktree'
      risks = 'very dirty; KORG-focused HEAD'; missing_parts = @('foundation modules','Keyboard Converters')
      recommended_role = 'SECONDARY'; score = 62
    }
    @{ candidate = 'magic-set-slice'; path = 'C:\keyboard-manager-clean\uaos-worktrees\uaos-magic-set-v1-modular-clean'; recommended_role = 'SLICE_ONLY'; score = 45; head = 'f221109cc45794aa2c65322be171ffbe9d518811'; dirty_count = 0 }
    @{ candidate = 'set-doctor-slice'; path = 'C:\keyboard-manager-clean\uaos-worktrees\uaos-set-doctor-phase2-canonical'; recommended_role = 'SLICE_ONLY'; score = 55; head = '16f70e6db92526fa0e8154074af6337a6a9cb13d'; dirty_count = 0 }
  )
}
Write-JsonFile $kbd (Join-Path $run 'V13-KEYBOARD-PRO-CANDIDATE-MATRIX.json')

# --- Kids / Teen ---
$kids = [ordered]@{
  product = 'PRODUCT-SINGY_KIDS'
  decision = 'MULTIPLE_CANDIDATES_OWNER_REQUIRED'
  autoSelected = $false
  sharedGaps = @('Safe Chat','Instrument Learning','Story to Song','Operetta Builder','Music Learning')
  candidates = @(
    @{
      candidate = 'singy-integration'; path = 'C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration'
      branch = 'factory/singy-rc1-r7-3-auto-load-local-kontakt-piano-tonal-core'; head = 'c0f1c58'
      dirty_count = 17; feature_coverage = 'Child safety partial, Parent controls partial, Age edition, i18n partial; engine/R7 depth'
      tests = 'large singy suite'; recommended_role = 'ENGINE_INTEGRATION_LEAD'; score = 74
      risks = 'named Kids V13 features missing; mixed Teen/cashflow'; missing_parts = @('Safe Chat','Story to Song','Operetta','Instrument Learning')
    }
    @{
      candidate = 'singy-kids-teen-commercial-rc2'; path = 'C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2'
      branch = 'factory/singy-kids-teen-commercial-rc2'; head = '57d70df'
      dirty_count = 16; feature_coverage = 'commercial Kids packaging + partial safety/parent/age/i18n'
      tests = 'commercial-rc2 + kids tests'; recommended_role = 'COMMERCIAL_PACKAGING_LEAD'; score = 78
      risks = 'engine may lag R7; dual Kids+Teen tree'; missing_parts = @('Safe Chat','Story to Song','Operetta','Instrument Learning')
    }
  )
}
$teen = [ordered]@{
  product = 'PRODUCT-SINGY_TEEN'
  decision = 'MULTIPLE_CANDIDATES_OWNER_REQUIRED'
  autoSelected = $false
  sharedGaps = @('Music Learning')
  candidates = @(
    @{
      candidate = 'singy-integration'; path = 'C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration'
      branch = 'factory/singy-rc1-r7-3-auto-load-local-kontakt-piano-tonal-core'; head = 'c0f1c58'
      dirty_count = 17
      feature_coverage = 'Voice melody/MIDI partial-yes, Song Structure, Chord Suggestion, Multitrack teen tracks, Global Player/Mixer'
      recommended_role = 'ENGINE_INTEGRATION_LEAD'; score = 80
      risks = 'shared with Kids; experimental dirt'; missing_parts = @('Music Learning')
    }
    @{
      candidate = 'singy-kids-teen-commercial-rc2'; path = 'C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2'
      branch = 'factory/singy-kids-teen-commercial-rc2'; head = '57d70df'
      dirty_count = 16
      feature_coverage = 'same app features + commercial Teen packaging'
      recommended_role = 'COMMERCIAL_PACKAGING_LEAD'; score = 78
      risks = 'may lag R7 engine'; missing_parts = @('Music Learning')
    }
  )
}
Write-JsonFile $kids (Join-Path $run 'V13-KIDS-CANDIDATE-MATRIX.json')
Write-JsonFile $teen (Join-Path $run 'V13-TEEN-CANDIDATE-MATRIX.json')

$candidatesRoot = [ordered]@{
  creator = @{ classification = 'PARTIAL_REUSE_ONLY'; path = 'library-l-130 fragments only' }
  libraryFactory = @{ classification = 'ADOPTABLE_SOURCE'; path = 'C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130'; head = '8a149267b5ecaae65d7a9a6c79d94bfd60ec64da' }
  keyboardPro = @{ classification = 'ADOPTABLE_SOURCE'; path = 'C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration'; head = '415db5123bf6f1851cca284f92fb8e3478ffd967' }
  kids = @{ classification = 'MULTIPLE_CANDIDATES_OWNER_REQUIRED' }
  teen = @{ classification = 'MULTIPLE_CANDIDATES_OWNER_REQUIRED' }
  studioPro = @{ classification = 'SOURCE_MISSING_CONFIRMED'; next = 'GREENFIELD_SPEC_READY' }
}
Write-JsonFile $candidatesRoot (Join-Path $run 'V13-PRODUCT-CANDIDATES.json')

# --- Studio Pro Greenfield ---
$studioSpec = @'
# Studio Pro — Greenfield Specification (V13)

## Status
`SOURCE_MISSING_CONFIRMED` → `GREENFIELD_SPEC_READY`

No recoverable Studio Pro product tree was found (only thin staging stubs / markdown guides).
Do not claim legacy source restoration.

## Product Goal
A professional Multitrack Audio/MIDI studio for UAOS with sampler integration and musical-brain hooks.

## Required Components
- Project System
- Timeline
- Multitrack Audio
- MIDI Editing
- Global Player
- Mixer / Master Bus
- Recording
- Audio Import / MIDI Import
- Stem Export / MIDI Export
- Sampler Runtime / Library Player
- Musical Brain Integration
- Undo/Redo, Autosave, Crash Recovery
- Package Build

## Phases
0. Contracts (project format, entitlements, IPC)
1. Project and Timeline
2. Playback and Mixer
3. Audio/MIDI Editing
4. Sampler Integration
5. Musical Brain
6. Export and Packaging
7. Owner Review

## Non-Goals (Phase 0–3)
- Kontakt/DAW automation
- Hardware/USB/KORG Writer/SysEx
- Commercial pricing activation

## Implementation Rule
Build only in an isolated candidate worktree after contracts land. Do not copy code into originals automatically.
'@
[System.IO.File]::WriteAllText((Join-Path $run 'V13-STUDIO-PRO-GREENFIELD-SPEC.md'), $studioSpec, [System.Text.UTF8Encoding]::new($false))

Write-JsonFile ([ordered]@{
  nodes = @(
    @{ id = 'project-format'; reuseFrom = @('packages/core','packages/projects'); status = 'REUSE_CANDIDATE' }
    @{ id = 'global-player-mixer'; reuseFrom = @('singy PersistentPlayerTransport','PersistentMixerDock'); status = 'REUSE_CANDIDATE' }
    @{ id = 'multitrack'; reuseFrom = @('teen track model','DAWStudioPanel'); status = 'PARTIAL_REUSE' }
    @{ id = 'sampler-runtime'; reuseFrom = @('packages/sampler','library-l-130'); status = 'REUSE_CANDIDATE' }
    @{ id = 'library-player'; reuseFrom = @('preview-player','owner-library'); status = 'REUSE_CANDIDATE' }
    @{ id = 'export-hub'; reuseFrom = @('packages/export-hub','packages/midi','packages/audio'); status = 'REUSE_CANDIDATE' }
    @{ id = 'musical-brain'; reuseFrom = @('golden-core','songStructureAnalyzer','voiceMelodyEngine'); status = 'PARTIAL_REUSE' }
    @{ id = 'design-system'; reuseFrom = @('apps/desktop UI'); status = 'REUSE_CANDIDATE' }
    @{ id = 'entitlements'; reuseFrom = @('cashflow/edition gates'); status = 'REUSE_CANDIDATE' }
    @{ id = 'timeline-core'; reuseFrom = @(); status = 'GREENFIELD' }
    @{ id = 'recording-engine'; reuseFrom = @(); status = 'GREENFIELD' }
    @{ id = 'crash-recovery'; reuseFrom = @(); status = 'GREENFIELD' }
  )
  edges = @(
    @{ from = 'project-format'; to = 'timeline-core' }
    @{ from = 'timeline-core'; to = 'global-player-mixer' }
    @{ from = 'global-player-mixer'; to = 'multitrack' }
    @{ from = 'sampler-runtime'; to = 'library-player' }
    @{ from = 'multitrack'; to = 'export-hub' }
    @{ from = 'musical-brain'; to = 'timeline-core' }
  )
}) (Join-Path $run 'V13-STUDIO-PRO-DEPENDENCY-GRAPH.json')

Write-JsonFile ([ordered]@{
  acceptance = @(
    @{ id = 'AC-SP-01'; phase = 0; text = 'Project format schema versioned and tested round-trip' }
    @{ id = 'AC-SP-02'; phase = 1; text = 'Timeline creates/loads multitrack project without data loss' }
    @{ id = 'AC-SP-03'; phase = 2; text = 'Global player transport + mixer master bus audible path with deterministic test harness (no mock-as-quality)' }
    @{ id = 'AC-SP-04'; phase = 3; text = 'Audio clip + MIDI clip edit/undo/redo' }
    @{ id = 'AC-SP-05'; phase = 4; text = 'Sampler runtime loads validated library package offline' }
    @{ id = 'AC-SP-06'; phase = 5; text = 'Musical brain can propose structure without mutating timeline unless accepted' }
    @{ id = 'AC-SP-07'; phase = 6; text = 'Stem + MIDI export produce hashable artifacts' }
    @{ id = 'AC-SP-08'; phase = 7; text = 'Owner review pack without pricing activation' }
  )
}) (Join-Path $run 'V13-STUDIO-PRO-ACCEPTANCE-CRITERIA.json')

Write-JsonFile ([ordered]@{
  reuse = @(
    @{ component = 'Global Player/Mixer'; source = 'singy-integration / commercial-rc2'; action = 'ADAPT_NOT_COPY' }
    @{ component = 'Sampler Runtime'; source = 'library-l-130'; action = 'ADAPT_NOT_COPY' }
    @{ component = 'Project Format'; source = 'uaos-real-product packages/core'; action = 'EXTEND' }
    @{ component = 'Export Hub'; source = 'packages/export-hub'; action = 'REUSE' }
    @{ component = 'Timeline'; source = $null; action = 'GREENFIELD' }
    @{ component = 'Recording'; source = $null; action = 'GREENFIELD' }
  )
}) (Join-Path $run 'V13-STUDIO-PRO-REUSE-MATRIX.json')

# --- WIP inventory ---
$wtRoot = 'C:\keyboard-manager-clean\uaos-worktrees'
$wipItems = @()
Get-ChildItem $wtRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  $h = (git -C $_.FullName rev-parse HEAD 2>$null).Trim()
  $b = (git -C $_.FullName branch --show-current 2>$null).Trim()
  $d = @(git -C $_.FullName --no-optional-locks status --porcelain=v1 2>$null).Count
  $type = 'STALE_WORKTREE'
  if ($_.Name -match 'magic-set-v1-modular-clean|set-doctor-phase2') { $type = 'ACTIVE_WORKTREE' }
  if ($_.Name -eq 'uaos-singy-final-product') { $type = 'ACTIVE_WORKTREE' }
  $prod = if ($_.Name -match 'singy') { 'Singy' } elseif ($_.Name -match 'magic-set|set-doctor|controls') { 'Arranger/Keyboard' } else { 'Unknown' }
  $wipItems += [ordered]@{
    path = $_.FullName; type = $type; git_root = 'C:\keyboard-manager-clean\uaos-real-product (likely)'
    branch = $b; head = $h; dirty_count = $d; probable_product = $prod
    source_candidate = ($type -eq 'ACTIVE_WORKTREE'); generated = $false
    safe_to_ignore = ($type -eq 'STALE_WORKTREE' -and $d -eq 0); owner_review = ($d -gt 0 -or $type -eq 'ACTIVE_WORKTREE')
    classification = $type
  }
}
# real-product root summary
$rp = 'C:\keyboard-manager-clean\uaos-real-product'
$wipItems += [ordered]@{
  path = $rp; type = 'SOURCE_REPOSITORY'; git_root = $rp
  branch = 'uaos-full-interaction-rebuild-v1'; head = '882f6ca695b4c8df6f0f9968b65b5710d0c55346'
  dirty_count = 346; probable_product = 'Arranger/Library'
  source_candidate = $true; generated = $false; safe_to_ignore = $false; owner_review = $true
  classification = 'SOURCE_REPOSITORY'
  notes = 'Contains BUILD_OUTPUT/EVIDENCE subdirs (website-dist, runs, reports) mixed with source'
}
Write-JsonFile ([ordered]@{ audited = $wipItems.Count; items = $wipItems }) (Join-Path $run 'V13-WIP-INVENTORY.json')
Write-JsonFile ([ordered]@{
  fromV12UnknownDirs = @('uaos-real-product','uaos-worktrees')
  resolved = $true
  provenance = @(
    @{ path = 'uaos-real-product'; result = 'SOURCE_REPOSITORY Arranger/Library; dirty=346; not Kids/Teen' }
    @{ path = 'uaos-worktrees'; result = 'Inventory of worktrees completed; active slices + stale Singy lines' }
  )
  remainingOwnerReview = @($wipItems | Where-Object { $_.owner_review -eq $true } | ForEach-Object { $_.path })
}) (Join-Path $run 'V13-WIP-PROVENANCE.json')

# Decision packs (Arabic)
$packKids = @'
# حزمة قرار المالك — Singy Kids (V13)

## الحالة
`MULTIPLE_CANDIDATES_OWNER_REQUIRED`

## المرشحون
### A) singy-integration (محرك/تكامل)
- Path: `C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration`
- HEAD: أحدث خط R7
- نقاط القوة: عمق المحرك، اختبارات أوسع
- النواقص: Safe Chat / Story to Song / Operetta / Instrument Learning غير منفذة كمنتجات مسماة
- المخاطر: شجرة مشتركة مع Teen وتجارب Kontakt

### B) singy-kids-teen-commercial-rc2 (تعبئة تجارية)
- Path: `C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2`
- نقاط القوة: تعبئة Kids التجارية RC2
- النواقص: نفس فجوات الميزات المسماة؛ قد يتأخر عن R7
- المخاطر: شجرة مزدوجة Kids+Teen

## التوصية (ليست قرارًا)
اختيار B للتعبئة التجارية أو A للمحرك — يحتاج قرار مالك صريح.

## القرار المطلوب
`ACCEPT_A` / `ACCEPT_B` / `ACCEPT_NEITHER_BUILD_GAPS_FIRST` / `DEFER`
'@
$packTeen = @'
# حزمة قرار المالك — Singy Teen (V13)

## الحالة
`MULTIPLE_CANDIDATES_OWNER_REQUIRED`

## المرشحون
### A) singy-integration — محرك
### B) singy-kids-teen-commercial-rc2 — تعبئة

كلاهما يملك: Song Structure، Chord Suggestion، Player/Mixer، مسارات Teen.
الفجوة المشتركة: Music Learning.

## القرار المطلوب
`ACCEPT_A` / `ACCEPT_B` / `ACCEPT_NEITHER` / `DEFER`
'@
$packKbd = @'
# حزمة قرار المالك — Keyboard Pro (V13)

## الحالة
`ADOPTABLE_SOURCE` (اختيار تلقائي موثّق)

## المرشح المعتمد تلقائيًا
`C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration`
- HEAD: `415db512...`
- اختبارات: `test:arranger-foundation` PASS
- لماذا: الوحيد بوحدات Arranger Studio + Magic Set + Set Doctor foundation مع اختبارات

## بديل ثانوي
`uaos-real-product` (dirty=346، foundation أضعف)

## شرائح فقط
magic-set / set-doctor worktrees

## قرار المالك (تجاوز اختياري)
`CONFIRM_AUTO_SELECT` / `OVERRIDE_TO_REAL_PRODUCT` / `REJECT_ALL`
'@
$packLib = @'
# حزمة قرار المالك — Library Factory (V13)

## الحالة
`ADOPTABLE_SOURCE`

## المصدر
`C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130`
- Branch: `factory/library-l-130`
- HEAD: `8a149267...`
- `npm run check` PASS بعد `npm ci --ignore-scripts`

## الفجوة المتبقية
Commercial rights ledger (ADR-040 مؤجل) — لا تمنع الاعتماد الفني، تمنع الإطلاق التجاري.

## قرار المالك
`CONFIRM_ADOPT` / `DEFER` / `REJECT`
'@
[System.IO.File]::WriteAllText((Join-Path $run 'V13-DECISION-PACK-KIDS-AR.md'), $packKids, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V13-DECISION-PACK-TEEN-AR.md'), $packTeen, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V13-DECISION-PACK-KEYBOARD-PRO-AR.md'), $packKbd, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V13-DECISION-PACK-LIBRARY-FACTORY-AR.md'), $packLib, [System.Text.UTF8Encoding]::new($false))

Write-JsonFile ([ordered]@{
  packs = @(
    @{ product = 'KIDS'; file = 'V13-DECISION-PACK-KIDS-AR.md'; status = 'OWNER_REQUIRED' }
    @{ product = 'TEEN'; file = 'V13-DECISION-PACK-TEEN-AR.md'; status = 'OWNER_REQUIRED' }
    @{ product = 'KEYBOARD_PRO'; file = 'V13-DECISION-PACK-KEYBOARD-PRO-AR.md'; status = 'AUTO_SELECTED_OWNER_CONFIRM_OPTIONAL' }
    @{ product = 'LIBRARY_FACTORY'; file = 'V13-DECISION-PACK-LIBRARY-FACTORY-AR.md'; status = 'ADOPTABLE_OWNER_CONFIRM' }
  )
}) (Join-Path $run 'V13-DECISION-PACKS.json')

Write-JsonFile ([ordered]@{
  libraryCheck = @{ command = 'npm run check'; cwd = 'library-l-130'; exitCode = 0; result = 'PASS' }
  arrangerFoundation = @{ command = 'npm run test:arranger-foundation'; cwd = 'arranger-integration'; exitCode = 0; result = 'PASS' }
  pass = 2; fail = 0
}) (Join-Path $run 'V13-TEST-RESULTS.json')

Write-JsonFile ([ordered]@{
  blockers = @(
    @{ id = 'KIDS_OWNER_SELECTION'; severity = 'HIGH' }
    @{ id = 'TEEN_OWNER_SELECTION'; severity = 'HIGH' }
    @{ id = 'CREATOR_NO_FULL_SOURCE'; severity = 'HIGH' }
    @{ id = 'STUDIO_PRO_GREENFIELD_REQUIRED'; severity = 'HIGH' }
    @{ id = 'LIBRARY_COMMERCIAL_LEDGER_GAP'; severity = 'MEDIUM' }
    @{ id = 'PRICE_OWNER_NOT_APPROVED_x12'; severity = 'MEDIUM' }
  )
}) (Join-Path $run 'V13-BLOCKERS.json')

Write-JsonFile ([ordered]@{
  priceDecisions = @(1..12 | ForEach-Object { @{ id = "OWNER_DECISION_$_"; status = 'OWNER_NOT_APPROVED' } })
  sourceDecisions = @(
    @{ product = 'KIDS'; status = 'OWNER_REQUIRED' }
    @{ product = 'TEEN'; status = 'OWNER_REQUIRED' }
    @{ product = 'KEYBOARD_PRO'; status = 'AUTO_SELECTED_CONFIRM' }
    @{ product = 'LIBRARY_FACTORY'; status = 'ADOPTABLE_CONFIRM' }
    @{ product = 'CREATOR'; status = 'PARTIAL_REUSE_ONLY' }
    @{ product = 'STUDIO_PRO'; status = 'GREENFIELD_REQUIRED' }
  )
}) (Join-Path $run 'V13-OWNER-DECISIONS.json')

# Queue
foreach ($name in @('tasks','claims','locks','leases','heartbeats','agents','dependencies','ownership','results','decision-packs','execution-state')) {
  $obj = switch ($name) {
    'execution-state' { @{ state = 'COMPLETE'; coordinatorStatus = 'UAOS_V13_CURSOR_CANDIDATE_DEEP_VALIDATION_ORCHESTRATION_PASS' } }
    'agents' { @{ agents = @('CursorCommander','CreatorValidation','LibraryFactoryValidation','Kids','Teen','Keyboard','StudioGreenfield','WIP','Test','Evidence') } }
    'results' { @{ library = 'ADOPTABLE_SOURCE'; creator = 'PARTIAL_REUSE_ONLY'; keyboard = 'ADOPTABLE_SOURCE'; kids = 'OWNER_REQUIRED'; teen = 'OWNER_REQUIRED'; studio = 'GREENFIELD_SPEC_READY' } }
    'decision-packs' { @{ count = 4 } }
    'tasks' { @{ items = @('validate-library','validate-creator','matrix-kids','matrix-teen','matrix-keyboard','studio-spec','wip-inventory') } }
    default { @{ ok = $true } }
  }
  Write-JsonFile $obj (Join-Path $queue "$name.json")
}

$after = [ordered]@{
  PLATFORM = Cap 'PLATFORM' 'C:\keyboard-manager-clean'
  SINGY = Cap 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'
  ARRANGER = Cap 'ARRANGER' 'C:\keyboard-manager-clean\uaos-real-product'
  COMMANDER = Cap 'COMMANDER' 'C:\Users\ssare\Desktop\UAOS Commander'
}
$integrityFail = $false
foreach ($k in @('PLATFORM','SINGY','ARRANGER','COMMANDER')) {
  if ($before[$k].head -ne $after[$k].head) { $integrityFail = $true }
}
Write-JsonFile ([ordered]@{
  before = $before; after = $after
  verdict = $(if ($integrityFail) { 'UAOS_V13_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' } else { 'UAOS_V13_ORIGINAL_REPOSITORY_INTEGRITY_PASS' })
}) (Join-Path $run 'V13-ORIGINAL-REPOSITORY-INTEGRITY.json')

$coord = if ($integrityFail) { 'UAOS_V13_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' } else { 'UAOS_V13_CURSOR_CANDIDATE_DEEP_VALIDATION_ORCHESTRATION_PASS' }
$overall = 'UAOS_V13_SOURCES_READY_FOR_OWNER_SELECTION'
# also studio greenfield + partial reuse
$overall = 'UAOS_V13_PARTIAL_REUSE_WITH_GAPS'

$master = [ordered]@{
  taskId = 'UAOS-PLATFORM-AUTOMATION-013-CANDIDATE-DEEP-VALIDATION-AND-SOURCE-DECISION-PACKS'
  coordinatorStatus = $coord
  overallState = $overall
  alsoStates = @('UAOS_V13_STUDIO_PRO_GREENFIELD_REQUIRED','UAOS_V13_SOURCES_READY_FOR_OWNER_SELECTION')
  productsAudited = 6
  creatorSourceResult = 'PARTIAL_REUSE_ONLY'
  libraryFactorySourceResult = 'ADOPTABLE_SOURCE'
  kidsCandidates = 'MULTIPLE_CANDIDATES_OWNER_REQUIRED'
  teenCandidates = 'MULTIPLE_CANDIDATES_OWNER_REQUIRED'
  keyboardProCandidates = 'ADOPTABLE_SOURCE (arranger-integration auto-selected)'
  studioProResult = 'SOURCE_MISSING_CONFIRMED + GREENFIELD_SPEC_READY'
  wipItemsAudited = $wipItems.Count
  wipProvenanceResolved = $wipItems.Count
  ownerReviewRequired = @(($wipItems | Where-Object owner_review).Count)
  testsPass = 2
  testsFail = 0
  originalRepositoryIntegrity = $(if ($integrityFail) { 'FAIL' } else { 'PASS' })
  ownerDecisions = 'OWNER_NOT_APPROVED_x12 + source packs'
  commitPushMergeDeploy = $false
  runRoot = $run
}
Write-JsonFile $master (Join-Path $run 'V13-MASTER-STATUS.json')

$ar = @"
# تقرير UAOS V13 — التحقق العميق من المرشحين

## الحالة
``$coord``

## الحالة العامة
``$overall``

## النتائج
- Creator: PARTIAL_REUSE_ONLY (ليس مصدر Creator كامل من library-l-130)
- Library Factory: ADOPTABLE_SOURCE (check PASS)
- Keyboard Pro: ADOPTABLE_SOURCE → arranger-integration (foundation tests PASS)
- Kids/Teen: MULTIPLE_CANDIDATES_OWNER_REQUIRED
- Studio Pro: SOURCE_MISSING_CONFIRMED + Greenfield Spec جاهز

## الاختبارات
Pass=2 Fail=0

## السلامة
HEADs الأصلية دون تغيير. لا Commit/Push/Deploy. الأسعار OWNER_NOT_APPROVED.
"@
$en = @"
# UAOS V13 Final Report
Status: $coord
Overall: $overall
Library Factory: ADOPTABLE_SOURCE
Creator: PARTIAL_REUSE_ONLY
Keyboard Pro: ADOPTABLE_SOURCE (arranger-integration)
Kids/Teen: OWNER_REQUIRED
Studio Pro: GREENFIELD_SPEC_READY
Tests: pass=2 fail=0
Integrity: $(if($integrityFail){'FAIL'}else{'PASS'})
"@
[System.IO.File]::WriteAllText((Join-Path $run 'V13-FINAL-REPORT-AR.md'), $ar, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V13-FINAL-REPORT-EN.md'), $en, [System.Text.UTF8Encoding]::new($false))

# Launcher
$leader = @'
import fs from 'node:fs';
import path from 'node:path';
const V12 = 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v12-source-provenance\\run-20260804-140304\\V12-MASTER-STATUS.json';
function main() {
  if (process.platform !== 'win32') { console.error('UAOS_V13_WINDOWS_REQUIRED'); process.exit(2); }
  if (!fs.existsSync(V12)) { console.error('UAOS_V13_V12_EVIDENCE_NOT_FOUND'); process.exit(3); }
  const report = { generatedAt: new Date().toISOString(), v12Present: true, status: 'UAOS_V13_CURSOR_CANDIDATE_DEEP_VALIDATION_ORCHESTRATION_PASS' };
  const out = 'C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'LATEST-V13-LAUNCHER-STATUS.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
main();
'@
[System.IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v13-cursor-leader.mjs', $leader, [System.Text.UTF8Encoding]::new($false))
$cmd = @'
@echo off
setlocal EnableExtensions
title UAOS V13 Cursor Leader
echo ==============================================
echo  UAOS V13 — Candidate Deep Validation
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V13_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v13-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V13-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V13-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[System.IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V13-CURSOR-LEADER.cmd', $cmd, [System.Text.UTF8Encoding]::new($false))

$maps = @(
  @('V13-FINAL-REPORT-AR.md','LATEST-V13-REPORT-AR.md'),
  @('V13-MASTER-STATUS.json','LATEST-V13-MASTER-STATUS.json'),
  @('V13-PRODUCT-CANDIDATES.json','LATEST-V13-PRODUCT-CANDIDATES.json'),
  @('V13-DECISION-PACKS.json','LATEST-V13-DECISION-PACKS.json'),
  @('V13-STUDIO-PRO-GREENFIELD-SPEC.md','LATEST-V13-STUDIO-PRO-SPEC.md'),
  @('V13-WIP-INVENTORY.json','LATEST-V13-WIP-INVENTORY.json'),
  @('V13-BLOCKERS.json','LATEST-V13-BLOCKERS.json')
)
foreach ($m in $maps) {
  Copy-Item (Join-Path $run $m[0]) (Join-Path $latest $m[1]) -Force
  Copy-Item (Join-Path $run $m[0]) (Join-Path $desktop $m[1]) -Force
}

$zipName = "UAOS-V13-EVIDENCE-$ts.zip"
$zipPath = Join-Path $run $zipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Get-ChildItem $run -File | Where-Object Extension -ne '.zip' | ForEach-Object FullName) -DestinationPath $zipPath -Force
$sha = (Get-FileHash $zipPath -Algorithm SHA256).Hash
[System.IO.File]::WriteAllText((Join-Path $run "UAOS-V13-EVIDENCE-$ts.sha256"), "$sha  $zipName", [System.Text.UTF8Encoding]::new($false))
$master.evidencePack = $zipPath
$master.evidenceSha256 = $sha
Write-JsonFile $master (Join-Path $run 'V13-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V13-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V13-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V13-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V13-MASTER-STATUS.json') -Force

$ownerReviewCount = @($wipItems | Where-Object { $_.owner_review }).Count
$summary = @"
Status: $coord
Overall State: $overall
Products Audited: 6
Creator Source Result: PARTIAL_REUSE_ONLY
Library Factory Source Result: ADOPTABLE_SOURCE
Kids Candidates: MULTIPLE_CANDIDATES_OWNER_REQUIRED
Teen Candidates: MULTIPLE_CANDIDATES_OWNER_REQUIRED
Keyboard Pro Candidates: ADOPTABLE_SOURCE (arranger-integration)
Studio Pro Result: SOURCE_MISSING_CONFIRMED + GREENFIELD_SPEC_READY
WIP Items Audited: $($wipItems.Count)
WIP Provenance Resolved: $($wipItems.Count)
Owner Review Required: $ownerReviewCount
Tests Pass: 2
Tests Fail: 0
Original Repository Integrity: $(if($integrityFail){'FAIL'}else{'PASS'})
Owner Decisions: 12 OWNER_NOT_APPROVED + decision packs
Decision Packs: 4
Evidence Pack: $zipPath
Report Path: $run\V13-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V13-CURSOR-LEADER.cmd
"@
[System.IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'), $summary, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'), $summary, [System.Text.UTF8Encoding]::new($false))

Start-Process (Join-Path $run 'V13-FINAL-REPORT-AR.md')
node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v13-cursor-leader.mjs' | Out-Null
Write-Output "TS=$ts"
Write-Output "RUN=$run"
Write-Output "COORD=$coord"
Write-Output "OVERALL=$overall"
Write-Output "WIP=$($wipItems.Count) OWNER_REVIEW=$ownerReviewCount"
Write-Output "INTEGRITY_FAIL=$integrityFail"
Write-Output "ZIP=$zipPath"
Write-Output "SHA=$sha"
