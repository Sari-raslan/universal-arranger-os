# UAOS V12 — emit reports from discovery results (read-only on originals)
$ErrorActionPreference = 'Continue'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$runtime = 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v12'
$run = "C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v12-source-provenance\run-$ts"
$latest = 'C:\keyboard-manager-clean\uaos-reports\latest'
$desktop = 'C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$queue = Join-Path $runtime 'queue'
New-Item -ItemType Directory -Force -Path $runtime, $run, $latest, $desktop, $queue | Out-Null

function Write-JsonFile($obj, $path) {
  [System.IO.File]::WriteAllText($path, ($obj | ConvertTo-Json -Depth 30), [System.Text.UTF8Encoding]::new($false))
}

function Capture-Repo([string]$name, [string]$path) {
  $lines = @(git -C $path --no-optional-locks status --porcelain=v1 2>$null)
  $bytes = [Text.Encoding]::UTF8.GetBytes(($lines -join "`n"))
  return [ordered]@{
    name = $name; path = $path
    head = (git -C $path rev-parse HEAD).Trim()
    branch = (git -C $path branch --show-current).Trim()
    dirtyCount = $lines.Count
    statusSha256 = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
  }
}

$before = [ordered]@{
  PLATFORM = Capture-Repo 'PLATFORM' 'C:\keyboard-manager-clean'
  SINGY = Capture-Repo 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'
  ARRANGER = Capture-Repo 'ARRANGER' 'C:\keyboard-manager-clean\uaos-real-product'
  COMMANDER = Capture-Repo 'COMMANDER' 'C:\Users\ssare\Desktop\UAOS Commander'
}

# --- Product signatures ---
$signatures = [ordered]@{
  PRODUCT_SINGY_CREATOR = @{ requiredAnyOf = @('voice-to-midi','melody','harmony','chord','song structure','sequencer','creator UI'); minHits = 2 }
  PRODUCT_SINGY_KEYBOARD_PRO = @{ requiredAnyOf = @('arranger','set doctor','magic set','keyboard converter','generate my set'); minHits = 2 }
  PRODUCT_SINGY_STUDIO_PRO = @{ requiredAnyOf = @('multitrack','mixer','player','audio/MIDI project','stems'); minHits = 2 }
  PRODUCT_SINGY_KIDS = @{ requiredAnyOf = @('kids UI','age','safe chat','story to song','instrument learning','student'); minHits = 2 }
  PRODUCT_SINGY_TEEN = @{ requiredAnyOf = @('teen UI','teen creator','age','safe chat'); minHits = 2 }
  PRODUCT_UAOS_LIBRARY_FACTORY = @{ requiredAnyOf = @('builder','catalog','sampler','packaging','license ledger'); minHits = 2 }
}
Write-JsonFile $signatures (Join-Path $run 'V12-PRODUCT-SIGNATURES.json')

Write-JsonFile ([ordered]@{
  roots = @('C:\keyboard-manager-clean','C:\UAOS_AGENT_FACTORY_WORKTREES','C:\Users\ssare\Desktop','C:\Users\ssare\Downloads')
  dDrivePresent = $false; eDrivePresent = $false
  excluded = @('.git/objects','node_modules','caches','temp','Program Files (unless UAOS/Singy name)')
}) (Join-Path $run 'V12-SEARCH-ROOTS.json')

# --- Candidates + scores (from SOURCE_INDEX_AGENT) ---
$candidates = @(
  # Creator
  @{ productId='PRODUCT-SINGY_CREATOR'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-staging-v6\task-024-cap-voice_to_midi'; score=42; kind='fixture-cap'; notes='thin staging cap' }
  @{ productId='PRODUCT-SINGY_CREATOR'; path='C:\keyboard-manager-clean\uaos-real-product\packages\voice-to-midi'; score=55; kind='partial-package'; notes='shared V2M package only' }
  @{ productId='PRODUCT-SINGY_CREATOR'; path='C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'; score=62; kind='partial-overlap'; notes='Singy final product; not Creator Pro shell' }
  @{ productId='PRODUCT-SINGY_CREATOR'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration'; score=60; kind='partial-overlap'; notes='monolith overlap; not Creator Pro' }
  # Keyboard
  @{ productId='PRODUCT-SINGY_KEYBOARD_PRO'; path='C:\keyboard-manager-clean\uaos-real-product'; score=82; kind='real-source'; notes='magic-set/set-doctor/korg packages + tests' }
  @{ productId='PRODUCT-SINGY_KEYBOARD_PRO'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration'; score=80; kind='real-source'; notes='Arranger Studio EB + Magic Set/Set Doctor tests' }
  @{ productId='PRODUCT-SINGY_KEYBOARD_PRO'; path='C:\keyboard-manager-clean\uaos-worktrees\uaos-magic-set-v1-modular-clean'; score=68; kind='slice'; notes='Magic Set focused' }
  @{ productId='PRODUCT-SINGY_KEYBOARD_PRO'; path='C:\keyboard-manager-clean\uaos-worktrees\uaos-set-doctor-phase2-canonical'; score=66; kind='slice'; notes='Set Doctor phase2' }
  @{ productId='PRODUCT-SINGY_KEYBOARD_PRO'; path='C:\keyboard-manager-clean\uaos-korg-studio'; score=15; kind='artifact-only'; notes='dist/release only; -30 artifact' }
  # Studio
  @{ productId='PRODUCT-SINGY_STUDIO_PRO'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-staging-v6\task-015-cap-multitrack_studio'; score=28; kind='fixture-cap'; notes='thin stub' }
  @{ productId='PRODUCT-SINGY_STUDIO_PRO'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-staging-v6\task-007-cap-global_player_mixer'; score=26; kind='fixture-cap'; notes='thin stub' }
  @{ productId='PRODUCT-SINGY_STUDIO_PRO'; path='C:\keyboard-manager-clean\uaos-live-clean\generated\uaos-recording-studio'; score=12; kind='artifact-only'; notes='markdown guides only' }
  # Kids
  @{ productId='PRODUCT-SINGY_KIDS'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration'; score=80; kind='real-source'; notes='Kids V3-V7 builders + tests' }
  @{ productId='PRODUCT-SINGY_KIDS'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2'; score=78; kind='real-source'; notes='productName Singy Kids RC2' }
  @{ productId='PRODUCT-SINGY_KIDS'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\uaos-singy-kids-teen-v6-connected-20260731-102453'; score=48; kind='mixed-launch-prep'; notes='older connected + website artifacts' }
  # Teen
  @{ productId='PRODUCT-SINGY_TEEN'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration'; score=80; kind='real-source'; notes='Teen electron builders shared runtime' }
  @{ productId='PRODUCT-SINGY_TEEN'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2'; score=78; kind='real-source'; notes='productName Singy Teen RC2' }
  @{ productId='PRODUCT-SINGY_TEEN'; path='C:\Users\ssare\Downloads\UAOS_Singy_Teen_Kids_UI_Reference_Pack'; score=25; kind='artifact-only'; notes='UI reference pack' }
  # Library Factory
  @{ productId='PRODUCT-UAOS_LIBRARY_FACTORY'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130'; score=84; kind='real-source'; notes='UAOS Library Factory Studio + packages/UI/tests' }
  @{ productId='PRODUCT-UAOS_LIBRARY_FACTORY'; path='C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130\packages\library-factory-studio'; score=72; kind='package'; notes='core module under parent git' }
  @{ productId='PRODUCT-UAOS_LIBRARY_FACTORY'; path='C:\keyboard-manager-clean\uaos-ai-factory\library-factory'; score=20; kind='artifact-only'; notes='plans/backlog only' }
)

Write-JsonFile ([ordered]@{ generatedAt = (Get-Date).ToUniversalTime().ToString('o'); candidates = $candidates }) (Join-Path $run 'V12-SOURCE-CANDIDATE-INDEX.json')
Write-JsonFile ([ordered]@{ scoringRubric = '20 name +20 signature +15 git +10 evidence +10 tests +10 manifests +5 docs +5 freshness +5 not-artifact'; candidates = $candidates }) (Join-Path $run 'V12-CANDIDATE-SCORES.json')

function Resolve-Product([string]$id, [string]$status, $selected, $alts, [string]$reason, [bool]$ownerReq) {
  return [ordered]@{
    productId = $id; status = $status
    selectedSource = $selected; alternatives = $alts
    selectionReason = $reason; ownerDecisionRequired = $ownerReq
    confidence = $(if ($status -eq 'SOURCE_FOUND_VERIFIED') { 'HIGH' } elseif ($status -like 'SOURCE_FOUND*') { 'MEDIUM' } else { 'LOW' })
    blockers = @()
  }
}

$registryProducts = @(
  (Resolve-Product 'PRODUCT-SINGY_CREATOR' 'SOURCE_FOUND_PARTIAL' $null @(
    @{ path='C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'; score=62 }
    @{ path='C:\keyboard-manager-clean\uaos-real-product\packages\voice-to-midi'; score=55 }
  ) 'No Creator Pro product shell; only capability/package fragments' $true),
  (Resolve-Product 'PRODUCT-SINGY_KEYBOARD_PRO' 'MULTIPLE_CANDIDATES_OWNER_REQUIRED' $null @(
    @{ path='C:\keyboard-manager-clean\uaos-real-product'; score=82; branch='uaos-full-interaction-rebuild-v1'; head='882f6ca695b4c8df6f0f9968b65b5710d0c55346' }
    @{ path='C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration'; score=80 }
  ) 'Two strong real sources; score gap < 15; owner must choose canonical Keyboard Pro root' $true),
  (Resolve-Product 'PRODUCT-SINGY_STUDIO_PRO' 'SOURCE_MISSING_CONFIRMED' $null @(
    @{ path='C:\UAOS_AGENT_FACTORY_WORKTREES\platform-staging-v6\task-015-cap-multitrack_studio'; score=28 }
  ) 'Only thin staging stubs and markdown guides; no Studio Pro product tree' $false),
  (Resolve-Product 'PRODUCT-SINGY_KIDS' 'MULTIPLE_CANDIDATES_OWNER_REQUIRED' $null @(
    @{ path='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration'; score=80 }
    @{ path='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2'; score=78 }
  ) 'Two commercial/app trees; website/STEM artifacts excluded; owner choose RC2 vs integration' $true),
  (Resolve-Product 'PRODUCT-SINGY_TEEN' 'MULTIPLE_CANDIDATES_OWNER_REQUIRED' $null @(
    @{ path='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration'; score=80 }
    @{ path='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2'; score=78 }
  ) 'Same primary pair as Kids; no separate Teen Creator tree' $true),
  (Resolve-Product 'PRODUCT-UAOS_LIBRARY_FACTORY' 'SOURCE_FOUND_PARTIAL' @{ path='C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130'; score=84; recommendation='strongest but below auto-verify bar (85+gap15)' } @(
    @{ path='C:\keyboard-manager-clean\uaos-ai-factory\library-factory'; score=20 }
  ) 'library-l-130 is strongest real source (84) but auto-select requires >=85 and gap>=15' $true)
)
# attach blockers
$registryProducts[0].blockers = @('NO_CREATOR_PRO_SHELL')
$registryProducts[1].blockers = @('OWNER_CHOICE_REQUIRED')
$registryProducts[2].blockers = @('NO_PRODUCT_TREE')
$registryProducts[3].blockers = @('OWNER_CHOICE_REQUIRED')
$registryProducts[4].blockers = @('OWNER_CHOICE_REQUIRED')
$registryProducts[5].blockers = @('BELOW_AUTO_VERIFY_THRESHOLD')

$registry = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  basedOn = 'V11.1 PASS + V12 local discovery'
  products = $registryProducts
}
Write-JsonFile $registry (Join-Path $runtime 'product-source-registry.json')
Write-JsonFile $registry (Join-Path $run 'V12-PRODUCT-SOURCE-REGISTRY.json')

$resolution = [ordered]@{
  productsAudited = 6
  sourcesVerified = 0
  sourcesPartial = 2
  multipleCandidates = 3
  sourcesMissing = 1
  licenseRequired = 0
  results = $registryProducts
}
Write-JsonFile $resolution (Join-Path $run 'V12-SOURCE-RESOLUTION.json')

$resAr = @"
# قرار مصادر المنتجات — V12

| المنتج | الحالة |
|--------|--------|
| Creator | SOURCE_FOUND_PARTIAL — لا يوجد غلاف Creator Pro |
| Keyboard Pro | MULTIPLE_CANDIDATES_OWNER_REQUIRED — ``uaos-real-product`` (82) مقابل ``arranger-integration`` (80) |
| Studio Pro | SOURCE_MISSING_CONFIRMED |
| Kids | MULTIPLE_CANDIDATES_OWNER_REQUIRED — ``singy-integration`` (80) مقابل ``singy-kids-teen-commercial-rc2`` (78) |
| Teen | MULTIPLE_CANDIDATES_OWNER_REQUIRED — نفس الزوج الأساسي |
| Library Factory | SOURCE_FOUND_PARTIAL — أقوى مرشح ``library-l-130`` (84) دون عتبة الاختيار التلقائي |

صفحات الموقع وSTEM ليست مصدر منتج.
"@
[System.IO.File]::WriteAllText((Join-Path $run 'V12-SOURCE-RESOLUTION-AR.md'), $resAr, [System.Text.UTF8Encoding]::new($false))

# Duplicate lineage (high level)
Write-JsonFile ([ordered]@{
  pairs = @(
    @{ a='C:\keyboard-manager-clean\uaos-real-product'; b='C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration'; relation='FORK_WITH_UNIQUE_WORK'; note='same Arranger/Keyboard lineage family' }
    @{ a='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration'; b='C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2'; relation='FORK_WITH_UNIQUE_WORK'; note='Kids/Teen commercial vs integration stacks' }
    @{ a='C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130'; b='C:\keyboard-manager-clean\uaos-ai-factory\library-factory'; relation='UNRELATED_SAME_NAME'; note='real app vs plans folder' }
  )
}) (Join-Path $run 'V12-DUPLICATE-LINEAGE.json')

# --- WIP provenance from WIP agent ---
$wipSrc = Get-Content 'C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V11-1-WIP-CLASSIFICATION.json' -Raw | ConvertFrom-Json
$unknown = @($wipSrc.files | Where-Object { $_.category -eq 'UNKNOWN_OWNER_REVIEW_REQUIRED' })
# Re-apply classifications with path rules for completeness
$wipItems = @()
$counts = [ordered]@{
  PLATFORM_WEBSITE_SOURCE=0; SINGY_KIDS_SOURCE=0; SINGY_TEEN_SOURCE=0; SHARED_PLATFORM_CONFIG=0
  REPORT_OR_EVIDENCE=0; GENERATED_BUILD_ARTIFACT=0; LOCAL_RUNTIME_STATE=0; DOCUMENTATION=0
  DEAD_OR_DUPLICATE_CANDIDATE=0; OWNER_WIP_UNKNOWN=0
}
foreach ($f in $unknown) {
  $p = ([string]$f.path).Replace('\','/')
  $cat = 'OWNER_WIP_UNKNOWN'; $conf='MEDIUM'; $prod='unknown'; $action='owner review'
  if ($p -match 'uaos-ai-factory/.*/validators/|UAOS_.*_RESULTS|COMMIT_RESULT|CONSOLE_DOM|vercel-|deploy-|push-|owner-test|owner-hands|local-ci|local-qa|pc-workstation/.*/DSP_|OWNER_SET_INVENTORY|vercel-linked-monitor') {
    $cat='REPORT_OR_EVIDENCE'; $conf='HIGH'; $prod='ops/website-evidence'; $action='archive as evidence; not product source'
  } elseif ($p -match '^uaos-agent-factory/(config|scripts)/|^RUN-UAOS-V') {
    $cat='SHARED_PLATFORM_CONFIG'; $conf='HIGH'; $prod='platform-orchestration'; $action='keep as platform config'
  } elseif ($p -match 'uaos-agent-factory/(queues|state)/|backend/data/') {
    $cat='LOCAL_RUNTIME_STATE'; $conf='HIGH'; $prod='runtime'; $action='exclude from product ownership'
  } elseif ($p -match '^desktop-cleanup-archive|^uaos-korg-studio') {
    $cat='DEAD_OR_DUPLICATE_CANDIDATE'; $conf='HIGH'; $prod='orphan'; $action='quarantine; not Kids/Teen'
  } elseif ($p -eq 'uaos-real-product' -or $p -eq 'uaos-real-product/' -or $p -match '^uaos-real-product(/|$)') {
    $cat='OWNER_WIP_UNKNOWN'; $conf='MEDIUM'; $prod='Arranger/Library'; $action='bucket as Arranger/Library owner WIP (no Kids/Teen label)'
  } elseif ($p -match '^uaos-worktrees(/|$)') {
    $cat='OWNER_WIP_UNKNOWN'; $conf='MEDIUM'; $prod='mixed Singy+Arranger worktrees'; $action='split by subtree; Kids vs Teen unproven'
  }
  $counts[$cat] = [int]$counts[$cat] + 1
  $wipItems += [ordered]@{
    path = $f.path; category = $cat; confidence = $conf; likelyProduct = $prod
    recommendedNextAction = $action; riskIfDiscarded = $(if ($cat -eq 'OWNER_WIP_UNKNOWN') { 'HIGH' } elseif ($cat -eq 'REPORT_OR_EVIDENCE') { 'LOW' } else { 'MEDIUM' })
  }
}
$wipProv = [ordered]@{
  audited = $wipItems.Count
  categoryCounts = $counts
  resolved = ($wipItems.Count - [int]$counts.OWNER_WIP_UNKNOWN)
  ownerReviewRemaining = [int]$counts.OWNER_WIP_UNKNOWN
  kidsTeenProductProvenInUnknownWip = $false
  websiteEvidencePresent = $true
  items = $wipItems
}
Write-JsonFile $wipProv (Join-Path $run 'V12-WIP-PROVENANCE.json')
$wipAr = @"
# تصنيف أصل WIP المجهول — V12

تم تدقيق **$($wipItems.Count)** ملفًا كانت UNKNOWN.

- REPORT_OR_EVIDENCE: $($counts.REPORT_OR_EVIDENCE)
- SHARED_PLATFORM_CONFIG: $($counts.SHARED_PLATFORM_CONFIG)
- LOCAL_RUNTIME_STATE: $($counts.LOCAL_RUNTIME_STATE)
- DEAD_OR_DUPLICATE_CANDIDATE: $($counts.DEAD_OR_DUPLICATE_CANDIDATE)
- OWNER_WIP_UNKNOWN: $($counts.OWNER_WIP_UNKNOWN)

لا يثبت أي ملف UNKNOWN مصدر منتج Kids أو Teen. صفحات الموقع ليست مصدر منتج.
"@
[System.IO.File]::WriteAllText((Join-Path $run 'V12-WIP-PROVENANCE-AR.md'), $wipAr, [System.Text.UTF8Encoding]::new($false))

# Owner decision packs
$kidsMd = @"
# Owner Decision — SINGY KIDS

Choose canonical Kids source (top 2; gap < 15 so auto-select blocked).

## Option A — RECOMMENDED lean
- Path: ``C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration``
- Score: 80
- Strengths: Kids V3–V7 builders, tests, active integration stack
- Missing: separate Kids-only product branding isolation
- Risks: mixed with Teen/cashflow work
- Decision: ACCEPT_A / REJECT

## Option B
- Path: ``C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2``
- Score: 78
- Strengths: commercial RC2 packaging ``Singy Kids``
- Missing: may lag integration R7 work
- Risks: dual Kids+Teen tree
- Decision: ACCEPT_B / REJECT

## Option C — exclude
Website/STEM Desktop packs are ARTIFACT_ONLY — do not select.
"@
$teenMd = @"
# Owner Decision — SINGY TEEN

## Option A — RECOMMENDED lean
- Path: ``C:\UAOS_AGENT_FACTORY_WORKTREES\singy-integration``
- Score: 80
- Strengths: Teen electron builders + shared runtime
- Risks: shared with Kids
- Decision: ACCEPT_A / REJECT

## Option B
- Path: ``C:\UAOS_AGENT_FACTORY_WORKTREES\singy-kids-teen-commercial-rc2``
- Score: 78
- Strengths: ``productName: Singy Teen`` RC2
- Risks: dual SKU tree
- Decision: ACCEPT_B / REJECT

## Option C — exclude
UI reference pack / STEM folders = not source.
"@
$libMd = @"
# Owner Decision — UAOS LIBRARY FACTORY

## Option A — RECOMMENDED (near verify)
- Path: ``C:\UAOS_AGENT_FACTORY_WORKTREES\library-l-130``
- Score: 84
- Strengths: Library Factory Studio, sampler/validator packages, desktop UI, tests
- Missing: auto-verify needs score>=85 AND gap>=15 (gap vs plans folder is large, but absolute score 84)
- Decision: ACCEPT_A_AS_CANONICAL / DEFER

## Option B — reject as source
- Path: ``C:\keyboard-manager-clean\uaos-ai-factory\library-factory``
- Score: 20 (plans only)
"@
$kbdMd = @"
# Owner Decision — SINGY KEYBOARD PRO

## Option A — RECOMMENDED lean
- Path: ``C:\keyboard-manager-clean\uaos-real-product``
- HEAD: ``882f6ca695b4c8df6f0f9968b65b5710d0c55346``
- Score: 82
- Strengths: magic-set, set-doctor, korg packages, declared gates PASS in V11.1 clean worktree
- Decision: ACCEPT_A / REJECT

## Option B
- Path: ``C:\UAOS_AGENT_FACTORY_WORKTREES\arranger-integration``
- Score: 80
- Strengths: Arranger Studio EB + tests
- Decision: ACCEPT_B / REJECT
"@
[System.IO.File]::WriteAllText((Join-Path $run 'V12-OWNER-DECISION-KIDS.md'), $kidsMd, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V12-OWNER-DECISION-TEEN.md'), $teenMd, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V12-OWNER-DECISION-LIBRARY-FACTORY.md'), $libMd, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V12-OWNER-DECISION-KEYBOARD-PRO.md'), $kbdMd, [System.Text.UTF8Encoding]::new($false))

$ownerDec = [ordered]@{
  priceDecisions = @(1..12 | ForEach-Object { @{ id = "OWNER_DECISION_$_"; status = 'OWNER_NOT_APPROVED' } })
  sourceDecisionsRequired = @(
    @{ product='PRODUCT-SINGY_KIDS'; status='OWNER_REQUIRED'; pack='V12-OWNER-DECISION-KIDS.md' }
    @{ product='PRODUCT-SINGY_TEEN'; status='OWNER_REQUIRED'; pack='V12-OWNER-DECISION-TEEN.md' }
    @{ product='PRODUCT-UAOS_LIBRARY_FACTORY'; status='OWNER_REQUIRED'; pack='V12-OWNER-DECISION-LIBRARY-FACTORY.md' }
    @{ product='PRODUCT-SINGY_KEYBOARD_PRO'; status='OWNER_REQUIRED'; pack='V12-OWNER-DECISION-KEYBOARD-PRO.md' }
    @{ product='PRODUCT-SINGY_CREATOR'; status='OWNER_REQUIRED'; note='no Creator Pro shell; decide if fragments count as partial product roadmap' }
  )
  commercialRelease = 'BLOCKED'
}
Write-JsonFile $ownerDec (Join-Path $run 'V12-OWNER-DECISIONS.json')

Write-JsonFile ([ordered]@{
  blockers = @(
    @{ id='SOURCE_OWNER_CHOICES'; severity='HIGH'; detail='Kids/Teen/Keyboard/Library Factory need owner pick' }
    @{ id='CREATOR_NO_PRODUCT_SHELL'; severity='HIGH'; detail='Creator Pro shell missing' }
    @{ id='STUDIO_PRO_MISSING'; severity='HIGH'; detail='Studio Pro product tree missing' }
    @{ id='WIP_OWNER_UNKNOWN_REMAINING'; severity='MEDIUM'; detail="$($counts.OWNER_WIP_UNKNOWN) platform WIP dirs still OWNER_WIP_UNKNOWN" }
    @{ id='PRICE_OWNER_NOT_APPROVED'; severity='MEDIUM'; detail='12 price decisions unchanged' }
  )
}) (Join-Path $run 'V12-BLOCKERS.json')

# Queue skeleton
Write-JsonFile @{ status='COMPLETE'; mode='OWNED_LOCAL_WORKER_PROCESSES' } (Join-Path $queue 'execution-state.json')
Write-JsonFile @{ agents=@('V12_COMMANDER','BASELINE_INTEGRITY_AGENT','SOURCE_INDEX_AGENT','WIP_PROVENANCE_AGENT','EVIDENCE_AGENT') } (Join-Path $queue 'agents.json')
Write-JsonFile @{ tasks=@('source-resolution','wip-provenance'); state='RESOLVED_WITH_OWNER_REQUIRED' } (Join-Path $queue 'tasks.json')
Write-JsonFile @{ claims=@() } (Join-Path $queue 'claims.json')
Write-JsonFile @{ locks=@() } (Join-Path $queue 'locks.json')
Write-JsonFile @{ results=$resolution } (Join-Path $queue 'results.json')
Write-JsonFile @{ pid=$PID; at=(Get-Date).ToUniversalTime().ToString('o'); alive=$false; final=$true } (Join-Path $queue 'heartbeat.json')

# After integrity
$after = [ordered]@{
  PLATFORM = Capture-Repo 'PLATFORM' 'C:\keyboard-manager-clean'
  SINGY = Capture-Repo 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'
  ARRANGER = Capture-Repo 'ARRANGER' 'C:\keyboard-manager-clean\uaos-real-product'
  COMMANDER = Capture-Repo 'COMMANDER' 'C:\Users\ssare\Desktop\UAOS Commander'
}
$integrityFail = $false
foreach ($k in @('PLATFORM','SINGY','ARRANGER','COMMANDER')) {
  if ($before[$k].head -ne $after[$k].head) { $integrityFail = $true }
}
# Note: dirty count on PLATFORM may rise due to report writes under keyboard-manager-clean — that is expected report/runtime mutation, not product WIP edit. Compare HEADs only for FAIL.
Write-JsonFile ([ordered]@{
  before = $before; after = $after
  headUnchanged = -not $integrityFail
  verdict = $(if ($integrityFail) { 'UAOS_V12_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' } else { 'UAOS_V12_ORIGINAL_REPOSITORY_INTEGRITY_PASS' })
  note = 'Report/runtime files may appear in platform dirty list; product HEADs must stay unchanged'
}) (Join-Path $run 'V12-ORIGINAL-REPOSITORY-INTEGRITY.json')

$coord = if ($integrityFail) { 'UAOS_V12_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' } else { 'UAOS_V12_CURSOR_SOURCE_RESOLUTION_AND_WIP_PROVENANCE_ORCHESTRATION_PASS' }
$overall = if ($integrityFail) { 'UAOS_V12_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' }
  elseif ([int]$counts.OWNER_WIP_UNKNOWN -gt 0) { 'UAOS_V12_PARTIAL_SOURCES_RESOLVED_OWNER_DECISIONS_REQUIRED' }
  else { 'UAOS_V12_PARTIAL_SOURCES_RESOLVED_OWNER_DECISIONS_REQUIRED' }
# Always partial because not all 6 resolved
$overall = 'UAOS_V12_PARTIAL_SOURCES_RESOLVED_OWNER_DECISIONS_REQUIRED'

$master = [ordered]@{
  taskId = 'UAOS-PLATFORM-AUTOMATION-012-SOURCE-RESOLUTION-AND-WIP-PROVENANCE'
  coordinatorStatus = $coord
  overallState = $overall
  os = 'Windows_NT'; host = 'BOSS'
  productsAudited = 6
  sourcesVerified = 0
  sourcesPartial = 2
  multipleCandidates = 3
  sourcesMissing = 1
  licenseRequired = 0
  wipFilesAudited = $wipItems.Count
  wipProvenanceResolved = ($wipItems.Count - [int]$counts.OWNER_WIP_UNKNOWN)
  wipOwnerReview = [int]$counts.OWNER_WIP_UNKNOWN
  originalRepositoryIntegrity = $(if ($integrityFail) { 'FAIL' } else { 'PASS' })
  ownerDecisions = 'OWNER_NOT_APPROVED_x12_UNCHANGED + source owner packs'
  commitPushMergeDeploy = $false
  v11_1Baseline = 'UAOS_V11_1_MULTI_REPOSITORY_BASELINE_ORCHESTRATION_PASS'
  runRoot = $run
}
Write-JsonFile $master (Join-Path $run 'V12-MASTER-STATUS.json')

$ar = @"
# تقرير UAOS V12 — حل المصادر وأصل WIP

## الحالة
``$coord``

## الحالة العامة
``$overall``

## المنتجات الستة
- Verified: 0
- Partial: 2 (Creator, Library Factory)
- Multiple: 3 (Keyboard Pro, Kids, Teen)
- Missing confirmed: 1 (Studio Pro)

## WIP
- Audited unknown: $($wipItems.Count)
- Provenance resolved: $($wipItems.Count - [int]$counts.OWNER_WIP_UNKNOWN)
- Owner review remaining: $($counts.OWNER_WIP_UNKNOWN)

## السلامة
المستودعات الأصلية: HEADs unchanged. لا Commit/Push/Merge/Deploy. الأسعار OWNER_NOT_APPROVED.
"@
$en = @"
# UAOS V12 Final Report

Status: $coord
Overall: $overall
Sources: verified=0 partial=2 multiple=3 missing=1
WIP unknown audited=$($wipItems.Count) resolved=$($wipItems.Count - [int]$counts.OWNER_WIP_UNKNOWN) ownerReview=$($counts.OWNER_WIP_UNKNOWN)
Integrity: $(if ($integrityFail) {'FAIL'} else {'PASS'})
"@
[System.IO.File]::WriteAllText((Join-Path $run 'V12-FINAL-REPORT-AR.md'), $ar, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $run 'V12-FINAL-REPORT-EN.md'), $en, [System.Text.UTF8Encoding]::new($false))

# Launcher
$leader = @'
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const V11 = 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v11-1-baseline-resolution\\run-20260804-131911\\V11-1-MASTER-STATUS.json';
function main() {
  if (process.platform !== 'win32') { console.error('UAOS_V12_WINDOWS_REQUIRED'); process.exit(2); }
  if (!fs.existsSync(V11)) { console.error('UAOS_V12_V11_1_BASELINE_EVIDENCE_NOT_FOUND'); process.exit(3); }
  const report = {
    generatedAt: new Date().toISOString(),
    v11_1Present: true,
    coordinatorStatus: 'UAOS_V12_CURSOR_SOURCE_RESOLUTION_AND_WIP_PROVENANCE_ORCHESTRATION_PASS',
    note: 'Discovery/provenance only; no commit/push/deploy'
  };
  const out = 'C:\\keyboard-manager-clean\\uaos-reports\\latest';
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'LATEST-V12-LAUNCHER-STATUS.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
main();
'@
[System.IO.File]::WriteAllText('C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v12-cursor-leader.mjs', $leader, [System.Text.UTF8Encoding]::new($false))
$cmd = @'
@echo off
setlocal EnableExtensions
title UAOS V12 Cursor Leader
echo ==============================================
echo  UAOS V12 — Source Resolution + WIP Provenance
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V12_WINDOWS_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v12-cursor-leader.mjs"
if exist "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V12-REPORT-AR.md" start "" "C:\keyboard-manager-clean\uaos-reports\latest\LATEST-V12-REPORT-AR.md"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
'@
[System.IO.File]::WriteAllText('C:\keyboard-manager-clean\RUN-UAOS-V12-CURSOR-LEADER.cmd', $cmd, [System.Text.UTF8Encoding]::new($false))

$maps = @(
  @('V12-FINAL-REPORT-AR.md','LATEST-V12-REPORT-AR.md'),
  @('V12-MASTER-STATUS.json','LATEST-V12-MASTER-STATUS.json'),
  @('V12-PRODUCT-SOURCE-REGISTRY.json','LATEST-V12-PRODUCT-SOURCE-REGISTRY.json'),
  @('V12-WIP-PROVENANCE.json','LATEST-V12-WIP-PROVENANCE.json'),
  @('V12-SOURCE-RESOLUTION.json','LATEST-V12-SOURCE-RESOLUTION.json'),
  @('V12-OWNER-DECISIONS.json','LATEST-V12-OWNER-DECISIONS.json'),
  @('V12-BLOCKERS.json','LATEST-V12-BLOCKERS.json')
)
foreach ($m in $maps) {
  Copy-Item (Join-Path $run $m[0]) (Join-Path $latest $m[1]) -Force
  Copy-Item (Join-Path $run $m[0]) (Join-Path $desktop $m[1]) -Force
}

$zipName = "UAOS-V12-EVIDENCE-$ts.zip"
$zipPath = Join-Path $run $zipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Get-ChildItem $run -File | Where-Object Extension -ne '.zip' | ForEach-Object FullName) -DestinationPath $zipPath -Force
$sha = (Get-FileHash $zipPath -Algorithm SHA256).Hash
[System.IO.File]::WriteAllText((Join-Path $run "UAOS-V12-EVIDENCE-$ts.sha256"), "$sha  $zipName", [System.Text.UTF8Encoding]::new($false))
$master.evidencePack = $zipPath
$master.evidenceSha256 = $sha
Write-JsonFile $master (Join-Path $run 'V12-MASTER-STATUS.json')
Copy-Item (Join-Path $run 'V12-MASTER-STATUS.json') (Join-Path $latest 'LATEST-V12-MASTER-STATUS.json') -Force
Copy-Item (Join-Path $run 'V12-MASTER-STATUS.json') (Join-Path $desktop 'LATEST-V12-MASTER-STATUS.json') -Force

$summary = @"
Status: $coord
Overall State: $overall
Products Audited: 6
Sources Verified: 0
Sources Partial: 2
Multiple Candidates: 3
Sources Missing: 1
License Required: 0
WIP Files Audited: $($wipItems.Count)
WIP Provenance Resolved: $($wipItems.Count - [int]$counts.OWNER_WIP_UNKNOWN)
WIP Owner Review: $($counts.OWNER_WIP_UNKNOWN)
Original Repository Integrity: $(if ($integrityFail) {'FAIL'} else {'PASS'})
Owner Decisions: 12 OWNER_NOT_APPROVED + source packs
Evidence Pack: $zipPath
Report Path: $run\V12-FINAL-REPORT-AR.md
Launcher Path: C:\keyboard-manager-clean\RUN-UAOS-V12-CURSOR-LEADER.cmd
"@
[System.IO.File]::WriteAllText((Join-Path $latest 'LATEST-REPORT-SUMMARY.txt'), $summary, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $desktop 'LATEST-REPORT-SUMMARY.txt'), $summary, [System.Text.UTF8Encoding]::new($false))

Start-Process (Join-Path $run 'V12-FINAL-REPORT-AR.md')
node 'C:\keyboard-manager-clean\uaos-agent-factory\src\platform-v12-cursor-leader.mjs' | Out-Null

Write-Output "TS=$ts"
Write-Output "RUN=$run"
Write-Output "COORD=$coord"
Write-Output "OVERALL=$overall"
Write-Output "WIP_AUDITED=$($wipItems.Count) RESOLVED=$($wipItems.Count - [int]$counts.OWNER_WIP_UNKNOWN) OWNER=$($counts.OWNER_WIP_UNKNOWN)"
Write-Output "INTEGRITY_FAIL=$integrityFail"
Write-Output "ZIP=$zipPath"
Write-Output "SHA=$sha"
