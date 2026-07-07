# UAOS V1722 READONLY PCM GROUP REVIEW MEGALAUNCHER
# Approved scope:
# - One MegaLauncher only.
# - Read V1721 relation groups and V1718 PCM candidates.
# - No cracking.
# - No binary keyboard output.
# - No USB.
# - No hardware load.
# - Create PCM group review, PCM feasibility matrix, parser readiness map, owner decision gate, validation, portal, package.
# - Status: PCM_GROUP_REVIEW_READY.

[CmdletBinding()]
param(
  [string]$RepoRoot = "E:\keyboard-manager-clean",
  [string]$V1721PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1721-readonly-kmp-pcm-relation-review",
  [string]$V1718PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1718-real-set-extractability-classifier",
  [string]$PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1722-readonly-pcm-group-review",
  [switch]$NoOpen,
  [switch]$NoGitCommit
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Set-StrictMode -Version Latest

$FactoryRoot = Join-Path $RepoRoot "uaos-ai-factory"
$ScriptName = "RUN_UAOS_V1722_READONLY_PCM_GROUP_REVIEW_MEGALAUNCHER.ps1"
$FactoryScriptPath = Join-Path $FactoryRoot $ScriptName
$Revision = "V1722_READONLY_PCM_GROUP_REVIEW"
$ReadyStatus = "PCM_GROUP_REVIEW_READY"
$NoInputStatus = "WAITING_FOR_V1721_RELATION_GROUPS_OR_V1718_PCM"

$V1721RelationGroupsCsv = Join-Path $V1721PhaseRoot "relation-review\UAOS_V1721_KMP_PCM_RELATION_GROUPS.csv"
$V1721ConfidenceMatrixCsv = Join-Path $V1721PhaseRoot "relation-review\UAOS_V1721_KMP_PCM_CONFIDENCE_MATRIX.csv"
$V1718PcmCsv = Join-Path $V1718PhaseRoot "next-writer-source\UAOS_V1718_PCM_PARSER_CANDIDATES.csv"

$DataDir = Join-Path $PhaseRoot "data"
$WorkspaceDir = Join-Path $PhaseRoot "workspace"
$ReportsDir = Join-Path $PhaseRoot "reports"
$ValidationDir = Join-Path $PhaseRoot "validation"
$SealDir = Join-Path $PhaseRoot "seal"
$LogsDir = Join-Path $PhaseRoot "logs"
$PackageDir = Join-Path $PhaseRoot "package"
$ReviewDir = Join-Path $PhaseRoot "pcm-group-review"
$GateDir = Join-Path $PhaseRoot "owner-decision-gate"
$NextDir = Join-Path $PhaseRoot "next-parser-source"

$RunLog = Join-Path $LogsDir "UAOS_V1722_PCM_GROUP_REVIEW_RUN.log"
$PortalHtml = Join-Path $WorkspaceDir "UAOS_V1722_PCM_GROUP_REVIEW_PORTAL.html"
$ValidationJson = Join-Path $ValidationDir "UAOS_V1722_PCM_GROUP_REVIEW_VALIDATION.json"
$ReportMd = Join-Path $ReportsDir "UAOS_V1722_PCM_GROUP_REVIEW_REPORT.md"
$SealMd = Join-Path $SealDir "UAOS_V1722_PCM_GROUP_REVIEW_SEAL.md"
$PointerJson = Join-Path $FactoryRoot "UAOS_CURRENT_PCM_GROUP_REVIEW.json"
$StatusDoc = Join-Path (Join-Path $RepoRoot "docs") "UAOS_PCM_GROUP_REVIEW_STATUS.md"

$GroupReviewCsv = Join-Path $ReviewDir "UAOS_V1722_PCM_GROUP_REVIEW.csv"
$FeasibilityCsv = Join-Path $ReviewDir "UAOS_V1722_PCM_FEASIBILITY_MATRIX.csv"
$ParserReadinessCsv = Join-Path $NextDir "UAOS_V1722_PARSER_READINESS_MAP.csv"
$OwnerGateCsv = Join-Path $GateDir "UAOS_V1722_OWNER_DECISION_GATE.csv"
$UnlinkedPcmCsv = Join-Path $ReviewDir "UAOS_V1722_UNLINKED_PCM_REVIEW.csv"
$SetCoverageCsv = Join-Path $ReviewDir "UAOS_V1722_PCM_SET_COVERAGE.csv"
$NextPlanMd = Join-Path $NextDir "CODEX_V1723_NEXT_TASKS.md"
$ReviewJson = Join-Path $DataDir "UAOS_V1722_PCM_GROUP_REVIEW.json"
$ZipPath = Join-Path $PackageDir "UAOS_V1722_PCM_GROUP_REVIEW_PACKAGE.zip"
$ShaPath = Join-Path $PackageDir "UAOS_V1722_PCM_GROUP_REVIEW_PACKAGE.sha256.txt"

function New-UaosDir {
  param([string]$Path)
  if (!(Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Write-UaosLog {
  param([string]$Message, [string]$Level = "INFO", [ConsoleColor]$Color = [ConsoleColor]::Gray)
  $line = "[" + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") + "] [" + $Level + "] " + $Message
  Write-Host $line -ForegroundColor $Color
  try { $line | Add-Content -LiteralPath $RunLog -Encoding UTF8 } catch {}
}

function ConvertTo-UaosJson {
  param([object]$Value)
  return ($Value | ConvertTo-Json -Depth 90)
}

function ConvertTo-UaosHtmlSafe {
  param([object]$Value)
  return [System.Net.WebUtility]::HtmlEncode([string]$Value)
}

function Get-UaosFileUri {
  param([string]$Path)
  try { return ([System.Uri]::new((Resolve-Path -LiteralPath $Path).Path)).AbsoluteUri } catch { return $Path }
}

function Get-UaosSha256 {
  param([string]$Path)
  if (Test-Path -LiteralPath $Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash }
  return ""
}

function Import-UaosCsv {
  param([string]$Path)
  if (Test-Path -LiteralPath $Path) { return @(Import-Csv -LiteralPath $Path) }
  return @()
}

function Get-UaosProp {
  param([object]$Object, [string[]]$Names, [object]$Default = "")
  if ($null -eq $Object) { return $Default }
  foreach ($n in $Names) {
    foreach ($p in @($Object.PSObject.Properties)) {
      if ($p.Name -ieq $n) { return $p.Value }
    }
  }
  return $Default
}

function ConvertTo-UaosInt {
  param([object]$Value)
  [int]$n = 0
  [void][int]::TryParse([string]$Value, [ref]$n)
  return $n
}

function ConvertTo-UaosInt64 {
  param([object]$Value)
  [int64]$n = 0
  [void][int64]::TryParse([string]$Value, [ref]$n)
  return $n
}

function Get-UaosSetContext {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) { return "" }
  $m = [regex]::Match($Path, "(?i)([^\\/]+\.SET)([\\/]|$)")
  if ($m.Success) { return $m.Groups[1].Value }
  return ""
}

function Get-UaosDirKey {
  param([string]$Path)
  try {
    $d = Split-Path -Parent $Path
    if ([string]::IsNullOrWhiteSpace($d)) { return "" }
    return $d.ToLowerInvariant()
  } catch { return "" }
}

function Get-UaosFileName {
  param([string]$Path)
  try { return [System.IO.Path]::GetFileName([string]$Path) } catch { return [string]$Path }
}

function Get-UaosSizeBand {
  param([int64]$Bytes)
  if ($Bytes -le 0) { return "UNKNOWN_SIZE" }
  if ($Bytes -lt 1024) { return "TINY_METADATA_OR_EMPTY" }
  if ($Bytes -lt 1048576) { return "SMALL_PCM" }
  if ($Bytes -lt 10485760) { return "MEDIUM_PCM" }
  if ($Bytes -lt 104857600) { return "LARGE_PCM" }
  return "VERY_LARGE_PCM"
}

function Get-UaosParserTier {
  param([int]$Score, [string]$SizeBand)
  if ($Score -ge 120 -and $SizeBand -in @("MEDIUM_PCM","LARGE_PCM","VERY_LARGE_PCM")) { return "TIER_1_RELATION_STRONG_PARSER_RESEARCH" }
  if ($Score -ge 90) { return "TIER_2_RELATION_MEDIUM_PARSER_RESEARCH" }
  if ($Score -ge 60) { return "TIER_3_OWNER_REVIEW_BEFORE_PARSER" }
  return "TIER_4_HOLD_LOW_CONFIDENCE"
}

function Get-UaosFeasibilityStatus {
  param([string]$Tier)
  if ($Tier -like "TIER_1*") { return "PARSER_RESEARCH_FEASIBLE_READONLY" }
  if ($Tier -like "TIER_2*") { return "PARSER_RESEARCH_POSSIBLE_READONLY" }
  if ($Tier -like "TIER_3*") { return "OWNER_REVIEW_REQUIRED" }
  return "HOLD"
}

foreach ($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$PackageDir,$ReviewDir,$GateDir,$NextDir,(Join-Path $RepoRoot "docs"))) {
  New-UaosDir $d
}

Write-UaosLog "UAOS V1722 READONLY PCM GROUP REVIEW started" "STEP" Cyan
Write-UaosLog "Relation groups: $V1721RelationGroupsCsv"
Write-UaosLog "Confidence matrix: $V1721ConfidenceMatrixCsv"
Write-UaosLog "PCM candidates: $V1718PcmCsv"

if (!(Test-Path -LiteralPath $V1718PcmCsv)) { throw "Missing V1718 PCM candidates CSV: $V1718PcmCsv" }

try {
  if ($PSCommandPath) { Copy-Item -LiteralPath $PSCommandPath -Destination $FactoryScriptPath -Force }
} catch {}

$relationGroups = Import-UaosCsv $V1721RelationGroupsCsv
$confidenceRows = Import-UaosCsv $V1721ConfidenceMatrixCsv
$pcmRows = Import-UaosCsv $V1718PcmCsv

Write-UaosLog ("V1721 relation groups: " + @($relationGroups).Count)
Write-UaosLog ("V1721 confidence rows: " + @($confidenceRows).Count)
Write-UaosLog ("V1718 PCM rows: " + @($pcmRows).Count)

# Index PCM candidates by source path for fast lookup.
$pcmByPath = @{}
foreach ($p in $pcmRows) {
  $path = [string](Get-UaosProp $p @("source_path","full_path","path","relative_path") "")
  if (![string]::IsNullOrWhiteSpace($path) -and !$pcmByPath.ContainsKey($path)) { $pcmByPath[$path] = $p }
}

$groupReview = @()
$feasibility = @()
$parserMap = @()
$ownerGate = @()

foreach ($g in $relationGroups) {
  $groupId = [string](Get-UaosProp $g @("group_id") "")
  $kmpId = [string](Get-UaosProp $g @("kmp_id") "")
  $kmpFile = [string](Get-UaosProp $g @("kmp_file") "")
  $topPcmFile = [string](Get-UaosProp $g @("top_pcm_file") "")
  $topScore = ConvertTo-UaosInt (Get-UaosProp $g @("top_score") 0)
  $topConfidence = [string](Get-UaosProp $g @("top_confidence") "")
  $candidateCount = ConvertTo-UaosInt (Get-UaosProp $g @("pcm_candidate_count") 0)

  $relatedRows = @($confidenceRows | Where-Object { [string](Get-UaosProp $_ @("kmp_id") "") -eq $kmpId })
  $topPcm = $null
  if ($pcmByPath.ContainsKey($topPcmFile)) { $topPcm = $pcmByPath[$topPcmFile] }

  $pcmBytes = ConvertTo-UaosInt64 (Get-UaosProp $topPcm @("bytes","size","length") 0)
  $pcmSha = [string](Get-UaosProp $topPcm @("sha256","hash") "")
  $pcmExt = [string](Get-UaosProp $topPcm @("extension","ext") ".pcm")
  $setContext = Get-UaosSetContext $topPcmFile
  $dirKey = Get-UaosDirKey $topPcmFile
  $sizeBand = Get-UaosSizeBand $pcmBytes
  $parserTier = Get-UaosParserTier -Score $topScore -SizeBand $sizeBand
  $feasStatus = Get-UaosFeasibilityStatus $parserTier
  $fileExists = if (![string]::IsNullOrWhiteSpace($topPcmFile)) { Test-Path -LiteralPath $topPcmFile } else { $false }

  $gr = "" | Select-Object review_group_id,source_group_id,kmp_id,kmp_file,top_pcm_file,top_pcm_name,top_pcm_exists,top_pcm_bytes,top_pcm_size_band,top_pcm_sha256,set_context,directory_key,relation_candidate_count,top_score,top_confidence,parser_tier,feasibility_status,review_status,safety_status
  $gr.review_group_id = "V1722_PCM_GROUP_" + (@($groupReview).Count + 1).ToString("000")
  $gr.source_group_id = $groupId
  $gr.kmp_id = $kmpId
  $gr.kmp_file = $kmpFile
  $gr.top_pcm_file = $topPcmFile
  $gr.top_pcm_name = Get-UaosFileName $topPcmFile
  $gr.top_pcm_exists = $fileExists
  $gr.top_pcm_bytes = $pcmBytes
  $gr.top_pcm_size_band = $sizeBand
  $gr.top_pcm_sha256 = $pcmSha
  $gr.set_context = $setContext
  $gr.directory_key = $dirKey
  $gr.relation_candidate_count = @($relatedRows).Count
  $gr.top_score = $topScore
  $gr.top_confidence = $topConfidence
  $gr.parser_tier = $parserTier
  $gr.feasibility_status = $feasStatus
  $gr.review_status = "READONLY_PCM_GROUP_REVIEW_NOT_CONFIRMED"
  $gr.safety_status = "NO_CRACKING_NO_BINARY_OUTPUT"
  $groupReview += $gr

  foreach ($r in $relatedRows) {
    $pcmFile = [string](Get-UaosProp $r @("pcm_file") "")
    $score = ConvertTo-UaosInt (Get-UaosProp $r @("score") 0)
    $pcmCandidate = $null
    if ($pcmByPath.ContainsKey($pcmFile)) { $pcmCandidate = $pcmByPath[$pcmFile] }
    $bytes = ConvertTo-UaosInt64 (Get-UaosProp $pcmCandidate @("bytes","size","length") 0)
    $band = Get-UaosSizeBand $bytes
    $tier = Get-UaosParserTier -Score $score -SizeBand $band

    $f = "" | Select-Object feasibility_id,review_group_id,kmp_id,kmp_file,pcm_file,pcm_name,pcm_exists,pcm_bytes,pcm_size_band,score,confidence_band,reason,parser_tier,feasibility_status,required_next_action,safety_status
    $f.feasibility_id = "V1722_FEAS_" + (@($feasibility).Count + 1).ToString("00000")
    $f.review_group_id = $gr.review_group_id
    $f.kmp_id = $kmpId
    $f.kmp_file = $kmpFile
    $f.pcm_file = $pcmFile
    $f.pcm_name = Get-UaosFileName $pcmFile
    $f.pcm_exists = if (![string]::IsNullOrWhiteSpace($pcmFile)) { Test-Path -LiteralPath $pcmFile } else { $false }
    $f.pcm_bytes = $bytes
    $f.pcm_size_band = $band
    $f.score = $score
    $f.confidence_band = [string](Get-UaosProp $r @("confidence_band") "")
    $f.reason = [string](Get-UaosProp $r @("reason") "")
    $f.parser_tier = $tier
    $f.feasibility_status = Get-UaosFeasibilityStatus $tier
    $f.required_next_action = "OWNER_DECISION_BEFORE_V1723_PARSER_FEASIBILITY"
    $f.safety_status = "READ_ONLY_NO_BINARY_OUTPUT"
    $feasibility += $f
  }

  $pm = "" | Select-Object parser_map_id,review_group_id,kmp_id,top_pcm_file,parser_tier,readiness_status,allowed_work,blocked_work,owner_decision_required,next_phase
  $pm.parser_map_id = "V1722_PARSER_MAP_" + (@($parserMap).Count + 1).ToString("000")
  $pm.review_group_id = $gr.review_group_id
  $pm.kmp_id = $kmpId
  $pm.top_pcm_file = $topPcmFile
  $pm.parser_tier = $parserTier
  $pm.readiness_status = $feasStatus
  $pm.allowed_work = "READONLY_PARSER_FEASIBILITY_ANALYSIS_ONLY"
  $pm.blocked_work = "NO_PCM_DECODE_NO_WRITER_NO_SET_OUTPUT_NO_USB"
  $pm.owner_decision_required = $true
  $pm.next_phase = "UAOS V1723 READONLY_PCM_PARSER_FEASIBILITY_MAP"
  $parserMap += $pm

  $og = "" | Select-Object decision_id,review_group_id,kmp_id,kmp_file,top_pcm_file,parser_tier,feasibility_status,question,decision_options,recommended_default,commercial_status,safety_status
  $og.decision_id = "V1722_DECISION_" + (@($ownerGate).Count + 1).ToString("000")
  $og.review_group_id = $gr.review_group_id
  $og.kmp_id = $kmpId
  $og.kmp_file = $kmpFile
  $og.top_pcm_file = $topPcmFile
  $og.parser_tier = $parserTier
  $og.feasibility_status = $feasStatus
  $og.question = "Should this PCM group continue to V1723 readonly parser feasibility mapping?"
  $og.decision_options = "APPROVE_FOR_V1723 / HOLD_LOW_CONFIDENCE / REMOVE / LICENSE_UNKNOWN"
  $og.recommended_default = if ($parserTier -like "TIER_1*" -or $parserTier -like "TIER_2*") { "APPROVE_FOR_V1723_AFTER_LICENSE_REVIEW" } else { "HOLD_LOW_CONFIDENCE" }
  $og.commercial_status = "NEEDS_LICENSE_REVIEW_BEFORE_SALE"
  $og.safety_status = "NO_CRACKING_NO_BINARY_OUTPUT"
  $ownerGate += $og
}

# Fallback if relation groups are empty: group PCM candidates by SET context.
if (@($groupReview).Count -eq 0 -and @($pcmRows).Count -gt 0) {
  Write-UaosLog "No V1721 relation groups found. Creating SET-level PCM review groups." "WARN" Yellow
  foreach ($setGroup in @($pcmRows | Group-Object { Get-UaosSetContext ([string](Get-UaosProp $_ @("source_path","full_path","path","relative_path") "")) })) {
    $setName = if ([string]::IsNullOrWhiteSpace($setGroup.Name)) { "NO_SET_CONTEXT" } else { $setGroup.Name }
    $items = @($setGroup.Group)
    $top = $items | Sort-Object { ConvertTo-UaosInt64 (Get-UaosProp $_ @("bytes","size","length") 0) } -Descending | Select-Object -First 1
    $topPath = [string](Get-UaosProp $top @("source_path","full_path","path","relative_path") "")
    $bytes = ConvertTo-UaosInt64 (Get-UaosProp $top @("bytes","size","length") 0)
    $band = Get-UaosSizeBand $bytes
    $tier = Get-UaosParserTier -Score 60 -SizeBand $band
    $gr = "" | Select-Object review_group_id,source_group_id,kmp_id,kmp_file,top_pcm_file,top_pcm_name,top_pcm_exists,top_pcm_bytes,top_pcm_size_band,top_pcm_sha256,set_context,directory_key,relation_candidate_count,top_score,top_confidence,parser_tier,feasibility_status,review_status,safety_status
    $gr.review_group_id = "V1722_PCM_GROUP_" + (@($groupReview).Count + 1).ToString("000")
    $gr.source_group_id = "SET_LEVEL_FALLBACK"
    $gr.kmp_id = ""
    $gr.kmp_file = ""
    $gr.top_pcm_file = $topPath
    $gr.top_pcm_name = Get-UaosFileName $topPath
    $gr.top_pcm_exists = if (![string]::IsNullOrWhiteSpace($topPath)) { Test-Path -LiteralPath $topPath } else { $false }
    $gr.top_pcm_bytes = $bytes
    $gr.top_pcm_size_band = $band
    $gr.top_pcm_sha256 = [string](Get-UaosProp $top @("sha256","hash") "")
    $gr.set_context = $setName
    $gr.directory_key = Get-UaosDirKey $topPath
    $gr.relation_candidate_count = @($items).Count
    $gr.top_score = 60
    $gr.top_confidence = "SET_LEVEL_FALLBACK"
    $gr.parser_tier = $tier
    $gr.feasibility_status = Get-UaosFeasibilityStatus $tier
    $gr.review_status = "READONLY_PCM_SET_GROUP_REVIEW_NOT_CONFIRMED"
    $gr.safety_status = "NO_CRACKING_NO_BINARY_OUTPUT"
    $groupReview += $gr
  }
}

# Unlinked PCM review: PCM not used in top/related relation matrix.
$linkedPcm = @($feasibility | ForEach-Object { $_.pcm_file }) + @($groupReview | ForEach-Object { $_.top_pcm_file })
$linkedPcm = @($linkedPcm | Where-Object { ![string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
$unlinked = @()
foreach ($p in $pcmRows) {
  $path = [string](Get-UaosProp $p @("source_path","full_path","path","relative_path") "")
  if ($linkedPcm -contains $path) { continue }
  $u = "" | Select-Object file_name,source_path,bytes,sha256,set_context,size_band,review_status,safety_status
  $u.file_name = [string](Get-UaosProp $p @("file_name","FileName","name") "")
  $u.source_path = $path
  $u.bytes = ConvertTo-UaosInt64 (Get-UaosProp $p @("bytes","size","length") 0)
  $u.sha256 = [string](Get-UaosProp $p @("sha256","hash") "")
  $u.set_context = Get-UaosSetContext $path
  $u.size_band = Get-UaosSizeBand $u.bytes
  $u.review_status = "UNLINKED_PCM_HOLD_FOR_LATER"
  $u.safety_status = "READ_ONLY_NO_BINARY_OUTPUT"
  $unlinked += $u
}

$coverage = @()
foreach ($cg in @($pcmRows | Group-Object { Get-UaosSetContext ([string](Get-UaosProp $_ @("source_path","full_path","path","relative_path") "")) })) {
  $setName = if ([string]::IsNullOrWhiteSpace($cg.Name)) { "NO_SET_CONTEXT" } else { $cg.Name }
  $c = "" | Select-Object set_context,pcm_count,total_bytes
  $c.set_context = $setName
  $c.pcm_count = $cg.Count
  $c.total_bytes = (($cg.Group | ForEach-Object { ConvertTo-UaosInt64 (Get-UaosProp $_ @("bytes","size","length") 0) }) | Measure-Object -Sum).Sum
  $coverage += $c
}

$groupReview | Export-Csv -LiteralPath $GroupReviewCsv -NoTypeInformation -Encoding UTF8
$feasibility | Export-Csv -LiteralPath $FeasibilityCsv -NoTypeInformation -Encoding UTF8
$parserMap | Export-Csv -LiteralPath $ParserReadinessCsv -NoTypeInformation -Encoding UTF8
$ownerGate | Export-Csv -LiteralPath $OwnerGateCsv -NoTypeInformation -Encoding UTF8
$unlinked | Export-Csv -LiteralPath $UnlinkedPcmCsv -NoTypeInformation -Encoding UTF8
$coverage | Sort-Object pcm_count -Descending | Export-Csv -LiteralPath $SetCoverageCsv -NoTypeInformation -Encoding UTF8

$totalPcm = @($pcmRows).Count
$totalRelationGroups = @($relationGroups).Count
$totalPcmGroups = @($groupReview).Count
$totalFeasibilityRows = @($feasibility).Count
$totalParserRows = @($parserMap).Count
$totalOwnerRows = @($ownerGate).Count
$totalUnlinked = @($unlinked).Count
$tier1 = @($parserMap | Where-Object { $_.parser_tier -like "TIER_1*" }).Count
$tier2 = @($parserMap | Where-Object { $_.parser_tier -like "TIER_2*" }).Count
$tier3 = @($parserMap | Where-Object { $_.parser_tier -like "TIER_3*" }).Count
$tier4 = @($parserMap | Where-Object { $_.parser_tier -like "TIER_4*" }).Count
$status = if (($totalPcmGroups -gt 0) -or ($totalPcm -gt 0)) { $ReadyStatus } else { $NoInputStatus }

$payload = "" | Select-Object revision,created_at,status,v1718_pcm_candidates,v1721_relation_groups,pcm_group_count,feasibility_rows,parser_readiness_rows,owner_decision_rows,unlinked_pcm_count,tier1_count,tier2_count,tier3_count,tier4_count,group_review_csv,feasibility_csv,parser_readiness_csv,owner_gate_csv
$payload.revision = $Revision
$payload.created_at = (Get-Date).ToString("s")
$payload.status = $status
$payload.v1718_pcm_candidates = $totalPcm
$payload.v1721_relation_groups = $totalRelationGroups
$payload.pcm_group_count = $totalPcmGroups
$payload.feasibility_rows = $totalFeasibilityRows
$payload.parser_readiness_rows = $totalParserRows
$payload.owner_decision_rows = $totalOwnerRows
$payload.unlinked_pcm_count = $totalUnlinked
$payload.tier1_count = $tier1
$payload.tier2_count = $tier2
$payload.tier3_count = $tier3
$payload.tier4_count = $tier4
$payload.group_review_csv = $GroupReviewCsv
$payload.feasibility_csv = $FeasibilityCsv
$payload.parser_readiness_csv = $ParserReadinessCsv
$payload.owner_gate_csv = $OwnerGateCsv
ConvertTo-UaosJson $payload | Set-Content -LiteralPath $ReviewJson -Encoding UTF8

@(
"# CodeX V1723 Next Tasks",
"",
"Task 1: Read V1722 parser readiness map and owner decision gate.",
"Task 2: For approved Tier 1/Tier 2 groups only, create readonly PCM parser feasibility map.",
"Task 3: Inspect metadata and container boundaries only; no decoding protected payloads.",
"Task 4: Produce parser risk matrix and stop gates.",
"Task 5: Keep all output as CSV/JSON/HTML only.",
"",
"Hard gates:",
"- No cracking.",
"- No PCM decoding claim unless validated.",
"- No binary keyboard output.",
"- No USB.",
"- No hardware load.",
"- No PA3X-ready claim."
) | Set-Content -LiteralPath $NextPlanMd -Encoding UTF8

$html = @(
"<!doctype html><html><head><meta charset='utf-8'><title>UAOS V1722 PCM Group Review</title>",
"<style>body{font-family:Segoe UI,Arial;background:#07101d;color:#eef5ff;padding:28px}.card{background:#101d32;border:1px solid #263a59;border-radius:14px;padding:16px;margin:10px 0}.num{font-size:28px;font-weight:800}.btn{display:inline-block;background:#173456;color:white;padding:10px;margin:4px;border-radius:10px;text-decoration:none}.ok{background:#12351f;border:1px solid #32a062;padding:8px 12px;border-radius:999px;display:inline-block}</style></head><body>",
"<h1>UAOS V1722 Readonly PCM Group Review</h1>",
"<div class='ok'>Status: " + (ConvertTo-UaosHtmlSafe $status) + "</div>",
"<div class='card'>V1718 PCM candidates<div class='num'>$totalPcm</div></div>",
"<div class='card'>V1721 relation groups<div class='num'>$totalRelationGroups</div></div>",
"<div class='card'>PCM group reviews<div class='num'>$totalPcmGroups</div></div>",
"<div class='card'>Feasibility rows<div class='num'>$totalFeasibilityRows</div></div>",
"<div class='card'>Parser readiness rows<div class='num'>$totalParserRows</div></div>",
"<div class='card'>Owner decisions<div class='num'>$totalOwnerRows</div></div>",
"<div class='card'>Tier 1 / Tier 2 / Tier 3 / Tier 4<div class='num'>$tier1 / $tier2 / $tier3 / $tier4</div></div>",
"<div class='card'>Unlinked PCM held for later<div class='num'>$totalUnlinked</div></div>",
"<div class='card'>",
"<a class='btn' href='" + (ConvertTo-UaosHtmlSafe (Get-UaosFileUri $GroupReviewCsv)) + "'>PCM Group Review</a>",
"<a class='btn' href='" + (ConvertTo-UaosHtmlSafe (Get-UaosFileUri $FeasibilityCsv)) + "'>Feasibility Matrix</a>",
"<a class='btn' href='" + (ConvertTo-UaosHtmlSafe (Get-UaosFileUri $ParserReadinessCsv)) + "'>Parser Readiness</a>",
"<a class='btn' href='" + (ConvertTo-UaosHtmlSafe (Get-UaosFileUri $OwnerGateCsv)) + "'>Owner Gate</a>",
"<a class='btn' href='" + (ConvertTo-UaosHtmlSafe (Get-UaosFileUri $ValidationJson)) + "'>Validation</a>",
"</div>",
"<div class='card'>Readonly review only. No cracking. No binary output. No USB. No hardware load.</div>",
"</body></html>"
)
$html | Set-Content -LiteralPath $PortalHtml -Encoding UTF8

$validation = "" | Select-Object phase,revision,status,source_v1721_relation_groups,source_v1718_pcm,v1718_pcm_candidates,v1721_relation_groups,pcm_group_count,feasibility_rows,parser_readiness_rows,owner_decision_rows,unlinked_pcm_count,tier1_count,tier2_count,tier3_count,tier4_count,no_cracking,no_binary_keyboard_output,no_usb,no_hardware_load,commercial_status,recommended_next_phase,portal,group_review_csv,feasibility_csv,parser_readiness_csv,owner_gate_csv,unlinked_pcm_csv,set_coverage_csv,package,package_sha256
$validation.phase = "UAOS V1722"
$validation.revision = $Revision
$validation.status = $status
$validation.source_v1721_relation_groups = $V1721RelationGroupsCsv
$validation.source_v1718_pcm = $V1718PcmCsv
$validation.v1718_pcm_candidates = $totalPcm
$validation.v1721_relation_groups = $totalRelationGroups
$validation.pcm_group_count = $totalPcmGroups
$validation.feasibility_rows = $totalFeasibilityRows
$validation.parser_readiness_rows = $totalParserRows
$validation.owner_decision_rows = $totalOwnerRows
$validation.unlinked_pcm_count = $totalUnlinked
$validation.tier1_count = $tier1
$validation.tier2_count = $tier2
$validation.tier3_count = $tier3
$validation.tier4_count = $tier4
$validation.no_cracking = $true
$validation.no_binary_keyboard_output = $true
$validation.no_usb = $true
$validation.no_hardware_load = $true
$validation.commercial_status = "NEEDS_LICENSE_REVIEW_BEFORE_SALE"
$validation.recommended_next_phase = "UAOS V1723 READONLY_PCM_PARSER_FEASIBILITY_MAP"
$validation.portal = $PortalHtml
$validation.group_review_csv = $GroupReviewCsv
$validation.feasibility_csv = $FeasibilityCsv
$validation.parser_readiness_csv = $ParserReadinessCsv
$validation.owner_gate_csv = $OwnerGateCsv
$validation.unlinked_pcm_csv = $UnlinkedPcmCsv
$validation.set_coverage_csv = $SetCoverageCsv
$validation.package = $ZipPath
$validation.package_sha256 = ""
ConvertTo-UaosJson $validation | Set-Content -LiteralPath $ValidationJson -Encoding UTF8

@(
"# UAOS V1722 Readonly PCM Group Review Report",
"",
"Status: $status",
"V1718 PCM candidates: $totalPcm",
"V1721 relation groups: $totalRelationGroups",
"PCM group reviews: $totalPcmGroups",
"Feasibility rows: $totalFeasibilityRows",
"Parser readiness rows: $totalParserRows",
"Owner decision rows: $totalOwnerRows",
"Unlinked PCM held for later: $totalUnlinked",
"Tier 1: $tier1",
"Tier 2: $tier2",
"Tier 3: $tier3",
"Tier 4: $tier4",
"",
"Outputs:",
"- PCM group review: $GroupReviewCsv",
"- PCM feasibility matrix: $FeasibilityCsv",
"- Parser readiness map: $ParserReadinessCsv",
"- Owner decision gate: $OwnerGateCsv",
"- Unlinked PCM review: $UnlinkedPcmCsv",
"",
"Safety:",
"- No cracking: TRUE",
"- No binary keyboard output: TRUE",
"- No USB: TRUE",
"- No hardware load: TRUE",
"- Commercial use: NEEDS_LICENSE_REVIEW_BEFORE_SALE",
"",
"Recommended next: UAOS V1723 READONLY PCM PARSER FEASIBILITY MAP"
) | Set-Content -LiteralPath $ReportMd -Encoding UTF8

@(
"# UAOS V1722 Readonly PCM Group Review Seal",
"",
"Status: $status",
"PCM groups: $totalPcmGroups",
"Parser readiness rows: $totalParserRows",
"Owner decision rows: $totalOwnerRows",
"No cracking: TRUE",
"No binary keyboard output: TRUE",
"No USB: TRUE",
"No hardware load: TRUE"
) | Set-Content -LiteralPath $SealMd -Encoding UTF8

Write-UaosLog "Packaging V1722 metadata only" "STEP" Cyan
$stage = Join-Path ([IO.Path]::GetTempPath()) ("v1722_" + [guid]::NewGuid().ToString("N"))
New-UaosDir $stage
foreach ($d in @($DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$ReviewDir,$GateDir,$NextDir)) {
  if (Test-Path -LiteralPath $d) {
    Copy-Item -LiteralPath $d -Destination (Join-Path $stage (Split-Path $d -Leaf)) -Recurse -Force
  }
}
if (Test-Path -LiteralPath $ZipPath) { Remove-Item -LiteralPath $ZipPath -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $ZipPath -Force
Remove-Item -LiteralPath $stage -Recurse -Force
$hash = Get-UaosSha256 $ZipPath
($hash + "  " + (Split-Path $ZipPath -Leaf)) | Set-Content -LiteralPath $ShaPath -Encoding UTF8
$validation.package_sha256 = $hash
ConvertTo-UaosJson $validation | Set-Content -LiteralPath $ValidationJson -Encoding UTF8

$pointer = "" | Select-Object current_pcm_group_review,status,revision,phase_root,portal,validation,group_review_csv,parser_readiness_csv,owner_gate_csv,recommended_next_phase,package,package_sha256
$pointer.current_pcm_group_review = "UAOS V1722 READONLY_PCM_GROUP_REVIEW"
$pointer.status = $status
$pointer.revision = $Revision
$pointer.phase_root = $PhaseRoot
$pointer.portal = $PortalHtml
$pointer.validation = $ValidationJson
$pointer.group_review_csv = $GroupReviewCsv
$pointer.parser_readiness_csv = $ParserReadinessCsv
$pointer.owner_gate_csv = $OwnerGateCsv
$pointer.recommended_next_phase = "UAOS V1723 READONLY_PCM_PARSER_FEASIBILITY_MAP"
$pointer.package = $ZipPath
$pointer.package_sha256 = $hash
ConvertTo-UaosJson $pointer | Set-Content -LiteralPath $PointerJson -Encoding UTF8

@(
"# UAOS PCM Group Review Status",
"",
"Current: UAOS V1722 READONLY_PCM_GROUP_REVIEW",
"Status: $status",
"Portal: $PortalHtml",
"PCM group review: $GroupReviewCsv",
"Parser readiness map: $ParserReadinessCsv",
"Owner decision gate: $OwnerGateCsv",
"Recommended next: UAOS V1723 READONLY PCM PARSER FEASIBILITY MAP",
"Package: $ZipPath",
"SHA256: $hash"
) | Set-Content -LiteralPath $StatusDoc -Encoding UTF8

Write-UaosLog "Local git commit only" "STEP" Cyan
$GitStatus = "SKIPPED_BY_FLAG"
$GitHash = ""
if (!$NoGitCommit) {
  try {
    if ((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))) {
      Push-Location $RepoRoot
      try {
        git add -f -- "uaos-ai-factory/$ScriptName" "uaos-ai-factory/uaos-v1722-readonly-pcm-group-review" "uaos-ai-factory/UAOS_CURRENT_PCM_GROUP_REVIEW.json" "docs/UAOS_PCM_GROUP_REVIEW_STATUS.md" | Out-Null
        $st = ((git status --porcelain) | Out-String)
        if ([string]::IsNullOrWhiteSpace($st)) {
          $GitStatus = "NO_CHANGES"
        } else {
          git commit -m "UAOS V1722 readonly PCM group review" | Out-Null
          if ($LASTEXITCODE -eq 0) {
            $GitHash = (git rev-parse --short HEAD).Trim()
            $GitStatus = "COMMITTED"
          } else {
            $GitStatus = "COMMIT_FAILED"
          }
        }
      } finally { Pop-Location }
    }
  } catch {
    $GitStatus = "COMMIT_FAILED: " + $_.Exception.Message
    Write-UaosLog $GitStatus "WARN" Yellow
  }
}

Write-Host ""
Write-UaosLog "UAOS V1722 READONLY PCM GROUP REVIEW complete" "PASS" Green
Write-Host ("Status: " + $status)
Write-Host ("Portal: " + $PortalHtml)
Write-Host ("PCM group review: " + $GroupReviewCsv)
Write-Host ("Feasibility matrix: " + $FeasibilityCsv)
Write-Host ("Parser readiness: " + $ParserReadinessCsv)
Write-Host ("Owner decision gate: " + $OwnerGateCsv)
Write-Host ("Validation: " + $ValidationJson)
Write-Host ("Package: " + $ZipPath)
Write-Host ("Package SHA256: " + $hash)
Write-Host ("Git: " + $GitStatus)
if (![string]::IsNullOrWhiteSpace($GitHash)) { Write-Host ("Git hash: " + $GitHash) }
if (!$NoOpen) { Start-Process $PortalHtml }
if ($status -ne $ReadyStatus) { exit 2 }
exit 0
