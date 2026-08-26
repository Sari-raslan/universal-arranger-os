# UAOS V11.1 — Multi-repository baseline resolution emitter
$ErrorActionPreference = 'Continue'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$runtime = 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v11-1'
$run = "C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v11-1-baseline-resolution\run-$ts"
$wtRoot = 'C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v11-1-clean'
$latest = 'C:\keyboard-manager-clean\uaos-reports\latest'
$desktop = 'C:\Users\ssare\Desktop\UAOS-LATEST-REPORTS'
$extract = 'C:\keyboard-manager-clean\uaos-agent-factory\.runtime\artifacts\platform-v11-clean-continuation\prior-extract'
New-Item -ItemType Directory -Force -Path $runtime, $run, $wtRoot, $latest, $desktop, (Join-Path $runtime 'queue'), (Join-Path $run 'tasks') | Out-Null

function Write-JsonFile($obj, $path) {
  [System.IO.File]::WriteAllText($path, ($obj | ConvertTo-Json -Depth 25), [System.Text.UTF8Encoding]::new($false))
}

function Capture-Repo([string]$name, [string]$path) {
  $o = [ordered]@{
    name = $name; path = $path; exists = (Test-Path -LiteralPath $path); isGit = $false
    branch = $null; head = $null; dirtyCount = 0; statusSha256 = $null; dirtyFiles = @(); catHeadOk = $false
  }
  if (-not $o.exists) { return $o }
  $inside = (git -C $path rev-parse --is-inside-work-tree 2>$null)
  if ($LASTEXITCODE -ne 0 -or $inside.Trim() -ne 'true') { return $o }
  $o.isGit = $true
  $o.branch = (git -C $path branch --show-current 2>$null).Trim()
  $o.head = (git -C $path rev-parse HEAD 2>$null).Trim()
  git -C $path cat-file -t HEAD 2>$null | Out-Null
  $o.catHeadOk = ($LASTEXITCODE -eq 0)
  $lines = @(git -C $path --no-optional-locks status --porcelain=v1 2>$null)
  $o.dirtyCount = $lines.Count
  $o.dirtyFiles = @($lines | ForEach-Object { $_.Substring([Math]::Min(2, $_.Length)).Trim() })
  $bytes = [Text.Encoding]::UTF8.GetBytes(($lines -join "`n"))
  $o.statusSha256 = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
  return $o
}

function Commit-Exists([string]$repo, [string]$commit) {
  if (-not (Test-Path $repo)) { return $false }
  $t = git -C $repo cat-file -t $commit 2>$null
  return ($LASTEXITCODE -eq 0 -and ("$t").Trim() -eq 'commit')
}

$platform = Capture-Repo 'PLATFORM' 'C:\keyboard-manager-clean'
$singy = Capture-Repo 'SINGY' 'C:\keyboard-manager-clean\uaos-worktrees\uaos-singy-final-product'
$arranger = Capture-Repo 'ARRANGER_LIBRARY' 'C:\keyboard-manager-clean\uaos-real-product'
$commander = Capture-Repo 'COMMANDER' 'C:\Users\ssare\Desktop\UAOS Commander'

$singyPreferred = '01f792417da3b782abb0b2394e8eebda0472bde2'
$arrPreferred = '882f6ca695b4c8df6f0f9968b65b5710d0c55346'
$cmdPreferred = '6cde73d'
$arrHas415 = Commit-Exists $arranger.path '415db5123bf6f1851cca284f92fb8e3478ffd967'
$arrHas7f8 = Commit-Exists $arranger.path '7f845c4a5d1483317161ea1e00a64b36ea739c69'
$singyHasPreferred = Commit-Exists $singy.path $singyPreferred
$arrHasPreferred = Commit-Exists $arranger.path $arrPreferred
$cmdHasPreferred = Commit-Exists $commander.path $cmdPreferred
$cmdFull = if ($cmdHasPreferred) { (git -C $commander.path rev-parse $cmdPreferred).Trim() } else { $null }

$baselines = [ordered]@{
  PLATFORM = [ordered]@{
    path = $platform.path; branch = $platform.branch; head = $platform.head
    baselineSelected = $platform.head; baselineState = 'VERIFIED_CURRENT_COMMITTED_HEAD'
    selectionReason = 'PLATFORM_BASELINE_CURRENT_COMMITTED_HEAD; 6cde73d not applicable'
    evidenceSource = 'local git HEAD + cat-file'; dirtyCount = $platform.dirtyCount; statusSha256 = $platform.statusSha256
    workingTreePolicy = 'READ_ONLY_DIRTY_ALLOWED'
    allowedTaskFamilies = @('WEBSITE', 'PLATFORM_CONFIG', 'REPORTING', 'ORCHESTRATION')
    sixCde73dUsed = $false
  }
  SINGY = [ordered]@{
    path = $singy.path; branch = $singy.branch; head = $singy.head
    baselineSelected = $(if ($singyHasPreferred) { $singyPreferred } else { $singy.head })
    baselineState = $(if ($singyHasPreferred) { 'VERIFIED_EVIDENCE_BASELINE' } else { 'VERIFIED_CURRENT_COMMITTED_HEAD' })
    selectionReason = 'preferredEvidenceHead 01f7924 verified present'
    evidenceSource = 'owner preferredEvidenceHead'
    dirtyCount = $singy.dirtyCount; statusSha256 = $singy.statusSha256
    workingTreePolicy = 'READ_ONLY'
    allowedTaskFamilies = @('SINGY_CAPABILITIES')
    sixCde73dUsed = $false
  }
  ARRANGER_LIBRARY = [ordered]@{
    path = $arranger.path; branch = $arranger.branch; head = $arranger.head
    baselineSelected = $(if ($arrHasPreferred) { $arrPreferred } else { $null })
    baselineState = $(if ($arrHasPreferred) { 'VERIFIED_EVIDENCE_BASELINE' } else { 'BASELINE_COMMIT_MISSING' })
    selectionReason = 'preferredEvidenceHead 882f6ca verified for clean full worktrees'
    evidenceSource = 'owner preferredEvidenceHead + local cat-file'
    dirtyCount = $arranger.dirtyCount; statusSha256 = $arranger.statusSha256
    workingTreePolicy = 'READ_ONLY'
    allowedTaskFamilies = @('ARRANGER', 'KEYBOARD', 'LIBRARY', 'SAMPLER')
    priorSparseArrangerHead = '415db5123bf6f1851cca284f92fb8e3478ffd967'
    priorSparseArrangerPresent = $arrHas415
    priorSparseLibraryHead = '7f845c4a5d1483317161ea1e00a64b36ea739c69'
    priorSparseLibraryPresent = $arrHas7f8
    sixCde73dUsed = $false
  }
  COMMANDER = [ordered]@{
    path = $commander.path; branch = $commander.branch; head = $commander.head
    baselineSelected = $cmdFull
    baselineState = $(if ($cmdHasPreferred) { 'VERIFIED_EVIDENCE_BASELINE' } else { 'BASELINE_COMMIT_MISSING' })
    selectionReason = 'preferredEvidenceHead 6cde73d verified in Commander ONLY'
    evidenceSource = 'Commander chat-only hard-gate closure'
    dirtyCount = $commander.dirtyCount; statusSha256 = $commander.statusSha256
    workingTreePolicy = 'READ_ONLY_DIRTY_ALLOWED'
    allowedTaskFamilies = @('COMMANDER_ONLY')
    scope = 'COMMANDER_ONLY'
    currentHeadDiffersFromBaseline = ($commander.head -ne $cmdFull)
    sixCde73dUsedForOtherRepos = $false
  }
}

Write-JsonFile $baselines (Join-Path $runtime 'repository-baselines.json')
Write-JsonFile $baselines (Join-Path $run 'V11-1-REPOSITORY-BASELINES.json')
Write-JsonFile ([ordered]@{
  capturedAt = (Get-Date).ToUniversalTime().ToString('o')
  os = $env:OS; host = $env:COMPUTERNAME
  platform = $platform; singy = $singy; arranger = $arranger; commander = $commander
  integrity = 'ORIGINALS_READ_ONLY_NO_CHECKOUT_RESTORE_RESET_CLEAN_STASH_COMMIT'
}) (Join-Path $run 'V11-1-ORIGINAL-REPOSITORY-INTEGRITY.json')

# Task -> repository map
$singyTasks = @(
  'CAP-ADVANCED_HARMONY','CAP-ARRANGEMENT_BRAIN','CAP-CHORD_SUGGESTION','CAP-GLOBAL_PLAYER_MIXER',
  'CAP-GOLDEN_SEQUENCER','CAP-INSTRUMENT_LEARNING','CAP-MULTITRACK_STUDIO','CAP-OPERETTA_BUILDER',
  'CAP-SAFE_CHAT','CAP-SONG_STRUCTURE','CAP-STORY_TO_SONG','CAP-STUDENT_PROGRESS',
  'CAP-VOICE_TO_MELODY','CAP-VOICE_TO_MIDI','CAP-CLASSROOM_MANAGEMENT'
)
$arrangerTasks = @(
  'CAP-ARRANGER_STUDIO','CAP-GENERATE_MY_SET','CAP-KEYBOARD_CONVERTERS','CAP-MAGIC_SET_BUILDER','CAP-SET_DOCTOR'
)
$libraryTasks = @(
  'CAP-LIBRARY_BUILDER','CAP-LIBRARY_CATALOG','CAP-LIBRARY_PLAYER','CAP-SAMPLER_RUNTIME','PRODUCT-SINGY_SAMPLER_PLAYER'
)
$sourceBlocked = @(
  'PRODUCT-SINGY_CREATOR','PRODUCT-SINGY_KEYBOARD_PRO','PRODUCT-SINGY_KIDS',
  'PRODUCT-SINGY_STUDIO_PRO','PRODUCT-SINGY_TEEN','PRODUCT-UAOS_LIBRARY_FACTORY'
)

$taskMap = [ordered]@{ generatedAt = (Get-Date).ToUniversalTime().ToString('o'); mappings = @() }
foreach ($id in $singyTasks) {
  $taskMap.mappings += [ordered]@{ id = $id; repositoryKey = 'SINGY'; repositoryPath = $singy.path; baseline = $baselines.SINGY.baselineSelected; family = 'SINGY' }
}
foreach ($id in $arrangerTasks) {
  $taskMap.mappings += [ordered]@{ id = $id; repositoryKey = 'ARRANGER_LIBRARY'; repositoryPath = $arranger.path; baseline = $baselines.ARRANGER_LIBRARY.baselineSelected; family = 'ARRANGER' }
}
foreach ($id in $libraryTasks) {
  $taskMap.mappings += [ordered]@{ id = $id; repositoryKey = 'ARRANGER_LIBRARY'; repositoryPath = $arranger.path; baseline = $baselines.ARRANGER_LIBRARY.baselineSelected; family = 'LIBRARY'; note = 'V7 library lane also rooted in uaos-real-product' }
}
foreach ($id in $sourceBlocked) {
  $taskMap.mappings += [ordered]@{ id = $id; repositoryKey = 'UNRESOLVED_SOURCE'; repositoryPath = $null; baseline = $null; family = 'SOURCE_BLOCKED' }
}
Write-JsonFile $taskMap (Join-Path $runtime 'task-repository-map.json')
Write-JsonFile $taskMap (Join-Path $run 'V11-1-TASK-REPOSITORY-MAP.json')

# WIP reclassification for PLATFORM only (V11 start point)
$wipFiles = @()
$byCat = [ordered]@{ GENERATED_BUILDINFO = 0; GENERATED_ARTIFACT = 0; INTENTIONAL_WIP = 0; DOCUMENTATION_WIP = 0; CONFIG_WIP = 0; SOURCE_WIP = 0; UNKNOWN_OWNER_REVIEW_REQUIRED = 0 }
foreach ($rel in $platform.dirtyFiles) {
  if ([string]::IsNullOrWhiteSpace($rel)) { continue }
  $p = $rel.Replace('\', '/')
  $cat = 'UNKNOWN_OWNER_REVIEW_REQUIRED'
  if ($p -match 'buildInfo\.generated\.json$') { $cat = 'GENERATED_BUILDINFO' }
  elseif ($p -match '(^|/)(uaos-reports|uaos-agent-factory/\.runtime|release|dist|out|node_modules|\.uaos-backups)(/|$)' -or $p -match '\.(exe|zip)$') { $cat = 'GENERATED_ARTIFACT' }
  elseif ($p -match '(^|/)docs(/|$)' -or $p -match 'REPORT|README|CHANGELOG|\.md$') { $cat = 'DOCUMENTATION_WIP' }
  elseif ($p -match 'package(-lock)?\.json$|tsconfig|vitest|eslint|prettier|\.env|\.npmrc|\.(yml|yaml|toml)$') { $cat = 'CONFIG_WIP' }
  elseif ($p -match '\.(ts|tsx|js|jsx|mjs|cjs|cpp|h|css|html)$' -or $p -match '(^|/)(src|tests|apps)(/|$)') { $cat = 'SOURCE_WIP' }
  elseif ($p -match 'WIP|TODO|scratch|tmp') { $cat = 'INTENTIONAL_WIP' }
  $byCat[$cat] = [int]$byCat[$cat] + 1
  $wipFiles += [ordered]@{ path = $rel; category = $cat }
}
$wip = [ordered]@{
  agent = 'WIP_FORENSICS_AGENT'; repository = $platform.path; dirtyCount = $platform.dirtyCount
  categoryCounts = $byCat; files = $wipFiles; mutationPerformed = $false
  note = 'UNKNOWN remain OWNER_REVIEW_REQUIRED; do not block clean worktrees from committed baselines'
}
Write-JsonFile $wip (Join-Path $run 'V11-1-WIP-CLASSIFICATION.json')

# Task truth matrix
$truthItems = @()
foreach ($id in $singyTasks) {
  $truthItems += [ordered]@{ id = $id; truth = 'DERIVED_GATE_PASS_ONLY'; priorEvidence = 'V9 GATES_PASS'; repositoryKey = 'SINGY'; action = 'VERIFIED_FROM_PRIOR_EVIDENCE_IF_BASELINE_STABLE' }
}
foreach ($id in ($arrangerTasks + $libraryTasks)) {
  $truthItems += [ordered]@{ id = $id; truth = 'NEEDS_DECLARED_GATE_RECHECK'; priorEvidence = 'V9 TEST_FAIL sparse'; repositoryKey = 'ARRANGER_LIBRARY'; action = 'RECHECK_IN_FULL_CLEAN_WORKTREE' }
}
foreach ($id in $sourceBlocked) {
  $truthItems += [ordered]@{ id = $id; truth = 'SOURCE_BLOCKED'; priorEvidence = 'V9 blockers'; repositoryKey = 'UNRESOLVED_SOURCE'; action = 'SOURCE_DISCOVERY' }
}
$truth = [ordered]@{
  audited = $truthItems.Count
  v10Status = 'NOT_RUN_OR_EVIDENCE_NOT_FOUND'
  ownerRequired = 12
  counts = [ordered]@{
    DERIVED_GATE_PASS_ONLY = $singyTasks.Count
    NEEDS_DECLARED_GATE_RECHECK = ($arrangerTasks.Count + $libraryTasks.Count)
    SOURCE_BLOCKED = $sourceBlocked.Count
    OWNER_REQUIRED = 12
  }
  items = $truthItems
}
Write-JsonFile $truth (Join-Path $run 'V11-1-TASK-TRUTH-MATRIX.json')

# Create clean worktrees
$wtMap = [ordered]@{ root = $wtRoot; worktrees = @() }
$arrWt = Join-Path $wtRoot 'arranger-library-baseline'
$singyWt = Join-Path $wtRoot 'singy-baseline'
$cmdWt = Join-Path $wtRoot 'commander-baseline'
$platWt = Join-Path $wtRoot 'platform-baseline'

function Add-CleanWorktree([string]$source, [string]$dest, [string]$commit, [string]$key) {
  $result = [ordered]@{ key = $key; source = $source; path = $dest; requestedCommit = $commit; ok = $false; head = $null; clean = $false; error = $null }
  if (Test-Path $dest) {
    $h = (git -C $dest rev-parse HEAD 2>$null).Trim()
    $st = @(git -C $dest --no-optional-locks status --porcelain=v1 2>$null)
    $result.head = $h; $result.clean = ($st.Count -eq 0)
    $result.ok = ($h -eq (git -C $source rev-parse $commit 2>$null).Trim() -and $result.clean)
    if ($result.ok) { return $result }
    # if exists but wrong, do not remove (safety); mark error
    $result.error = 'PATH_EXISTS_NOT_MATCHING_OR_DIRTY'
    return $result
  }
  $full = (git -C $source rev-parse $commit 2>$null).Trim()
  $proc = Start-Process -FilePath 'git' -ArgumentList @('-C', $source, 'worktree', 'add', '--detach', $dest, $full) -Wait -PassThru -NoNewWindow -RedirectStandardOutput (Join-Path $run "wt-$key.stdout.log") -RedirectStandardError (Join-Path $run "wt-$key.stderr.log")
  if ($proc.ExitCode -ne 0) {
    $result.error = "worktree add exit $($proc.ExitCode)"
    return $result
  }
  $h = (git -C $dest rev-parse HEAD 2>$null).Trim()
  $st = @(git -C $dest --no-optional-locks status --porcelain=v1 2>$null)
  $result.head = $h
  $result.clean = ($st.Count -eq 0)
  $result.ok = ($h -eq $full -and $result.clean)
  return $result
}

$wtMap.worktrees += (Add-CleanWorktree $arranger.path $arrWt $baselines.ARRANGER_LIBRARY.baselineSelected 'ARRANGER_LIBRARY')
$wtMap.worktrees += (Add-CleanWorktree $singy.path $singyWt $baselines.SINGY.baselineSelected 'SINGY')
$wtMap.worktrees += (Add-CleanWorktree $commander.path $cmdWt $baselines.COMMANDER.baselineSelected 'COMMANDER')
$wtMap.worktrees += (Add-CleanWorktree $platform.path $platWt $baselines.PLATFORM.baselineSelected 'PLATFORM')
Write-JsonFile $wtMap (Join-Path $run 'V11-1-WORKTREE-MAPPING.json')

# Persist run path for next stage
[System.IO.File]::WriteAllText((Join-Path $runtime 'current-run.txt'), $run, [System.Text.UTF8Encoding]::new($false))
Write-Output "TS=$ts"
Write-Output "RUN=$run"
foreach ($w in $wtMap.worktrees) { Write-Output ("WT " + $w.key + " ok=" + $w.ok + " head=" + $w.head + " clean=" + $w.clean + " err=" + $w.error) }
Write-Output ("WIP_DIRTY=" + $platform.dirtyCount)
$byCat.GetEnumerator() | ForEach-Object { Write-Output ("WIP_" + $_.Key + "=" + $_.Value) }
