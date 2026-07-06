# UAOS V1713 FINAL WRITER MEGALAUNCHER - R3 STATIC FINALIZER
# Same V1713 phase. No V1714.
# Static finalizer: no JavaScript portal, no JSON injection into HTML, no source copy, no keyboard binary output.

[CmdletBinding()]
param(
  [string]$RepoRoot = "E:\keyboard-manager-clean",
  [string]$SourceV1712PhaseRoot = "",
  [string]$OwnerDecisionsCsv = "",
  [switch]$NoOpen,
  [switch]$NoGitCommit
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Set-StrictMode -Version Latest

$FactoryRoot = Join-Path $RepoRoot "uaos-ai-factory"
$PhaseName = "uaos-v1713-final-writer"
$PhaseRoot = Join-Path $FactoryRoot $PhaseName
$ScriptName = "RUN_UAOS_V1713_FINAL_WRITER_MEGALAUNCHER.ps1"
$FactoryScriptPath = Join-Path $FactoryRoot $ScriptName
$Revision = "R3_STATIC_FINALIZER"
$WriterMode = "FINAL_OWNER_DECISION_WRITER"
$FinalStatusReady = "UAOS_FINAL_WRITER_READY"

if ([string]::IsNullOrWhiteSpace($SourceV1712PhaseRoot)) { $SourceV1712PhaseRoot = Join-Path $FactoryRoot "uaos-v1712-owner-experimental-codewriter" }
if ([string]::IsNullOrWhiteSpace($OwnerDecisionsCsv)) { $OwnerDecisionsCsv = Join-Path $SourceV1712PhaseRoot "data\UAOS_V1712_OWNER_DECISIONS_APPROVED_BASELINE.csv" }

$V1712ValidationJson = Join-Path $SourceV1712PhaseRoot "validation\UAOS_V1712_VALIDATION.json"
$V1712ReviewQueueCsv = Join-Path $SourceV1712PhaseRoot "data\UAOS_V1712_OWNER_EXPERIMENTAL_REVIEW_QUEUE.csv"

$DataDir = Join-Path $PhaseRoot "data"
$WorkspaceDir = Join-Path $PhaseRoot "workspace"
$ReportsDir = Join-Path $PhaseRoot "reports"
$ValidationDir = Join-Path $PhaseRoot "validation"
$SealDir = Join-Path $PhaseRoot "seal"
$PackageDir = Join-Path $PhaseRoot "package"
$LogsDir = Join-Path $PhaseRoot "logs"
$WriterDir = Join-Path $PhaseRoot "final-writer"
$ReleaseDir = Join-Path $PhaseRoot "release"

$RunLog = Join-Path $LogsDir "UAOS_V1713_FINAL_WRITER_RUN.log"
$FinalLedgerCsv = Join-Path $DataDir "UAOS_V1713_FINAL_OWNER_LEDGER.csv"
$FinalLedgerJson = Join-Path $DataDir "UAOS_V1713_FINAL_OWNER_LEDGER.json"
$FinalDecisionSummaryCsv = Join-Path $DataDir "UAOS_V1713_FINAL_DECISION_SUMMARY.csv"
$FinalExtensionSummaryCsv = Join-Path $DataDir "UAOS_V1713_FINAL_EXTENSION_SUMMARY.csv"
$FinalFolderSummaryCsv = Join-Path $DataDir "UAOS_V1713_FINAL_FOLDER_SUMMARY.csv"
$FinalManifestJson = Join-Path $DataDir "UAOS_V1713_FINAL_WRITER_MANIFEST.json"
$FinalPortalHtml = Join-Path $WorkspaceDir "UAOS_V1713_FINAL_WRITER_PORTAL.html"
$FinalReportMd = Join-Path $ReportsDir "UAOS_V1713_FINAL_WRITER_REPORT.md"
$FinalSealMd = Join-Path $SealDir "UAOS_V1713_FINAL_OWNER_SEAL.md"
$FinalValidationJson = Join-Path $ValidationDir "UAOS_V1713_FINAL_VALIDATION.json"
$FinalWriterInstructionsMd = Join-Path $WriterDir "UAOS_V1713_FINAL_WRITER_INSTRUCTIONS.md"
$FinalStopFile = Join-Path $ReleaseDir "UAOS_FINAL_STOP_HERE.txt"
$FinalPointerJson = Join-Path $FactoryRoot "UAOS_CURRENT_FINAL.json"
$PackageZip = Join-Path $PackageDir "UAOS_V1713_FINAL_WRITER_OWNER_PACKAGE.zip"
$PackageSha256Txt = Join-Path $PackageDir "UAOS_V1713_FINAL_WRITER_OWNER_PACKAGE.sha256.txt"

$AllowedFinalDecisions = @("KEEP_BLOCKED","DOCUMENT_ONLY","REQUEST_SEPARATE_APPROVAL_PHASE")
$ForbiddenKeyboardExts = @(".SET",".PCM",".STY",".PRF",".PCG",".PAD",".KMP",".KSF",".SBD",".SBL",".GBL",".VOC",".MXP",".BKP",".KSC",".KST",".PRG",".DK",".DKP")

function New-UaosDir([string]$Path) { if (!(Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null } }
function Write-Uaos([string]$Message, [string]$Level = "INFO", [ConsoleColor]$Color = [ConsoleColor]::Gray) { $line = "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] [$Level] $Message"; Write-Host $line -ForegroundColor $Color; try { $line | Add-Content -LiteralPath $RunLog -Encoding UTF8 } catch {} }
function HtmlSafe([object]$Value) { return [System.Net.WebUtility]::HtmlEncode([string]$Value) }
function JsonOut([object]$Value) { return ($Value | ConvertTo-Json -Depth 100) }
function CountOf([object]$Value) { if ($null -eq $Value) { return 0 }; if ($Value -is [string]) { return 1 }; if ($Value -is [System.Collections.IEnumerable]) { return @($Value).Count }; return 1 }
function Int64Of([object]$Value) { try { if ($null -eq $Value) { return [int64]0 }; $s=([string]$Value).Trim(); if ([string]::IsNullOrWhiteSpace($s)) { return [int64]0 }; return [int64]$s } catch { return [int64]0 } }
function Prop([object]$Object, [string[]]$Names, [object]$Default = $null) { if ($null -eq $Object) { return $Default }; foreach ($n in $Names) { foreach ($p in @($Object.PSObject.Properties)) { if ($p.Name -ieq $n) { return $p.Value } } }; return $Default }
function ExtNorm([object]$Value) { $e=([string]$Value).Trim(); if ([string]::IsNullOrWhiteSpace($e)) { return "" }; if (!$e.StartsWith(".")) { $e="."+$e }; return $e.ToLowerInvariant() }
function FileUri([string]$Path) { try { return ([System.Uri]::new((Resolve-Path -LiteralPath $Path).Path)).AbsoluteUri } catch { return $Path } }
function Sha256([string]$Path) { if (!(Test-Path -LiteralPath $Path)) { return "" }; return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash }
function AddSummary([hashtable]$Map, [string]$Key, [int64]$Bytes) { if ([string]::IsNullOrWhiteSpace($Key)) { $Key="[blank]" }; if (!$Map.ContainsKey($Key)) { $Map[$Key]=@{count=0; total_bytes=[int64]0} }; $Map[$Key].count=[int]$Map[$Key].count+1; $Map[$Key].total_bytes=[int64]$Map[$Key].total_bytes+[int64]$Bytes }
function MapToRows([hashtable]$Map, [string]$Field) { $rows=@(); foreach($k in @($Map.Keys | Sort-Object)) { $o="" | Select-Object name,owner_decision,extension,source_top_folder,count,total_bytes; $o.name=[string]$k; $o.owner_decision=""; $o.extension=""; $o.source_top_folder=""; if($Field -eq "owner_decision"){$o.owner_decision=[string]$k}; if($Field -eq "extension"){$o.extension=[string]$k}; if($Field -eq "source_top_folder"){$o.source_top_folder=[string]$k}; $o.count=[int]$Map[$k].count; $o.total_bytes=[int64]$Map[$k].total_bytes; $rows += $o }; return @($rows) }
function CopyDirStage([string]$Source, [string]$DestRoot) { if (!(Test-Path -LiteralPath $Source)) { return }; $dest=Join-Path $DestRoot (Split-Path -Path $Source -Leaf); if(Test-Path -LiteralPath $dest){Remove-Item -LiteralPath $dest -Recurse -Force}; Copy-Item -LiteralPath $Source -Destination $dest -Recurse -Force }

foreach($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$PackageDir,$LogsDir,$WriterDir,$ReleaseDir)){ New-UaosDir $d }

Write-Uaos "UAOS V1713 FINAL WRITER R3 started" "STEP" Cyan
Write-Uaos "SourceV1712PhaseRoot: $SourceV1712PhaseRoot"
Write-Uaos "OwnerDecisionsCsv: $OwnerDecisionsCsv"
Write-Uaos "Final policy: static final portal; no source copy; no keyboard binary output."

try { $currentScript=$PSCommandPath; if([string]::IsNullOrWhiteSpace($currentScript)){ $currentScript=$MyInvocation.MyCommand.Path }; if(![string]::IsNullOrWhiteSpace($currentScript) -and (Test-Path -LiteralPath $currentScript)){ $src=(Resolve-Path -LiteralPath $currentScript).Path; if(!(Test-Path -LiteralPath $FactoryScriptPath) -or ![string]::Equals($src,(Resolve-Path -LiteralPath $FactoryScriptPath).Path,[System.StringComparison]::OrdinalIgnoreCase)){ Copy-Item -LiteralPath $src -Destination $FactoryScriptPath -Force; Write-Uaos "MegaLauncher copied to factory: $FactoryScriptPath" "PASS" Green } else { Write-Uaos "MegaLauncher already running from factory path." } } } catch { Write-Uaos ("Could not self-copy launcher: "+$_.Exception.Message) "WARN" Yellow }

Write-Uaos "Loading V1712 baseline and owner decisions" "STEP" Cyan
if(!(Test-Path -LiteralPath $V1712ValidationJson)){ throw "Missing V1712 validation: $V1712ValidationJson" }
if(!(Test-Path -LiteralPath $V1712ReviewQueueCsv)){ throw "Missing V1712 review queue: $V1712ReviewQueueCsv" }
if(!(Test-Path -LiteralPath $OwnerDecisionsCsv)){ throw "Missing owner decisions CSV: $OwnerDecisionsCsv" }

$V1712Validation = Get-Content -LiteralPath $V1712ValidationJson -Raw -Encoding UTF8 | ConvertFrom-Json
$ReviewRows = @(Import-Csv -LiteralPath $V1712ReviewQueueCsv)
$DecisionRows = @(Import-Csv -LiteralPath $OwnerDecisionsCsv)
$V1712Status = [string](Prop $V1712Validation @("status") "")
$ReviewCount = [int](CountOf $ReviewRows)
$DecisionCount = [int](CountOf $DecisionRows)
Write-Uaos "V1712 status: $V1712Status" "PASS" Green
Write-Uaos "Review rows: $ReviewCount" "PASS" Green
Write-Uaos "Decision rows: $DecisionCount" "PASS" Green

$DecisionIndex=@{}
foreach($d in $DecisionRows){ $rid=[string](Prop $d @("review_id") ""); if(![string]::IsNullOrWhiteSpace($rid)){ $DecisionIndex[$rid]=$d } }

Write-Uaos "Building final owner ledger R3" "STEP" Cyan
$FinalRows=@(); $MissingDecisionCount=0; $InvalidDecisionCount=0; $PendingDecisionCount=0; $BkpNotSeparatedCount=0; $UnexpectedAllowCount=0; $TotalBytes=[int64]0; $rowNumber=0
foreach($review in $ReviewRows){
  $rowNumber++
  $reviewId=[string](Prop $review @("review_id") "")
  $relativePath=[string](Prop $review @("relative_path") "")
  $extension=ExtNorm (Prop $review @("extension") "")
  $classification=[string](Prop $review @("classification") "")
  $riskTier=[string](Prop $review @("risk_tier") "")
  $bytes=Int64Of (Prop $review @("bytes") 0)
  $sourceTopFolder=[string](Prop $review @("source_top_folder") "")
  $blockedReason=[string](Prop $review @("blocked_reason") "")
  $safeCopyAllowedRaw=[string](Prop $review @("safe_copy_allowed","safe_copy_allowed_text") "false")
  $writerReadyRaw=[string](Prop $review @("writer_ready") "false")
  $ownerDecision="MISSING"; $ownerNotes=""
  if(![string]::IsNullOrWhiteSpace($reviewId) -and $DecisionIndex.ContainsKey($reviewId)){ $dr=$DecisionIndex[$reviewId]; $ownerDecision=([string](Prop $dr @("owner_decision") "")).Trim().ToUpperInvariant(); $ownerNotes=[string](Prop $dr @("owner_notes","reviewer_notes","notes") "") } else { $MissingDecisionCount++ }
  if([string]::IsNullOrWhiteSpace($ownerDecision)){ $ownerDecision="MISSING" }
  if($ownerDecision -eq "PENDING_REVIEW"){ $PendingDecisionCount++ }
  if(!($AllowedFinalDecisions -contains $ownerDecision)){ $InvalidDecisionCount++ }
  if($extension -ieq ".bkp" -and $ownerDecision -ne "REQUEST_SEPARATE_APPROVAL_PHASE"){ $BkpNotSeparatedCount++ }
  $safeText=$safeCopyAllowedRaw.Trim().ToLowerInvariant(); $writerText=$writerReadyRaw.Trim().ToLowerInvariant(); if($safeText -in @("true","yes","1") -or $writerText -in @("true","yes","1")){ $UnexpectedAllowCount++ }
  $finalAction="DOCUMENT_BLOCKED_ONLY"; if($ownerDecision -eq "KEEP_BLOCKED"){$finalAction="FINAL_KEEP_BLOCKED"}; if($ownerDecision -eq "DOCUMENT_ONLY"){$finalAction="FINAL_DOCUMENT_ONLY_NO_COPY"}; if($ownerDecision -eq "REQUEST_SEPARATE_APPROVAL_PHASE"){$finalAction="FINAL_ISOLATE_FOR_SEPARATE_APPROVAL"}
  $o="" | Select-Object final_id,review_id,extension,source_top_folder,relative_path,classification,risk_tier,bytes,blocked_reason,owner_decision,owner_notes,final_action,final_writer_mode,final_safe_copy_allowed,final_writer_ready,source_file_copied,keyboard_output_generated,usb_write,hardware_load,deploy,payment
  $o.final_id=("V1713-F{0:D4}" -f $rowNumber); $o.review_id=$reviewId; $o.extension=$extension; $o.source_top_folder=$sourceTopFolder; $o.relative_path=$relativePath; $o.classification=$classification; $o.risk_tier=$riskTier; $o.bytes=[int64]$bytes; $o.blocked_reason=$blockedReason; $o.owner_decision=$ownerDecision; $o.owner_notes=$ownerNotes; $o.final_action=$finalAction; $o.final_writer_mode=$WriterMode; $o.final_safe_copy_allowed=$false; $o.final_writer_ready=$false; $o.source_file_copied=$false; $o.keyboard_output_generated=$false; $o.usb_write=$false; $o.hardware_load=$false; $o.deploy=$false; $o.payment=$false
  $FinalRows += $o; $TotalBytes += [int64]$bytes
}
$FinalCount=[int](CountOf $FinalRows)
$FinalRows | Export-Csv -LiteralPath $FinalLedgerCsv -NoTypeInformation -Encoding UTF8
(JsonOut $FinalRows) | Set-Content -LiteralPath $FinalLedgerJson -Encoding UTF8
Write-Uaos "Final ledger rows: $FinalCount" "PASS" Green
Write-Uaos "Missing decisions: $MissingDecisionCount" "PASS" Green
Write-Uaos "Invalid decisions: $InvalidDecisionCount" "PASS" Green
Write-Uaos "Pending decisions: $PendingDecisionCount" "PASS" Green
Write-Uaos "BKP not separated: $BkpNotSeparatedCount" "PASS" Green
Write-Uaos "Unexpected allow rows: $UnexpectedAllowCount" "PASS" Green

Write-Uaos "Building summaries R3" "STEP" Cyan
$DecisionMap=@{}; $ExtensionMap=@{}; $FolderMap=@{}
foreach($r in $FinalRows){ $b=Int64Of $r.bytes; AddSummary $DecisionMap ([string]$r.owner_decision) $b; AddSummary $ExtensionMap ([string]$r.extension) $b; AddSummary $FolderMap ([string]$r.source_top_folder) $b }
$DecisionSummary=@(MapToRows $DecisionMap "owner_decision"); $ExtensionSummary=@(MapToRows $ExtensionMap "extension"); $FolderSummary=@(MapToRows $FolderMap "source_top_folder")
$DecisionSummary | Export-Csv -LiteralPath $FinalDecisionSummaryCsv -NoTypeInformation -Encoding UTF8
$ExtensionSummary | Export-Csv -LiteralPath $FinalExtensionSummaryCsv -NoTypeInformation -Encoding UTF8
$FolderSummary | Export-Csv -LiteralPath $FinalFolderSummaryCsv -NoTypeInformation -Encoding UTF8

$V1712ReadyPass=($V1712Status -eq "OWNER_EXPERIMENTAL_READY"); $CountPass=($ReviewCount -gt 0 -and $DecisionCount -eq $ReviewCount -and $FinalCount -eq $ReviewCount); $DecisionPass=($MissingDecisionCount -eq 0 -and $InvalidDecisionCount -eq 0 -and $PendingDecisionCount -eq 0); $BkpPass=($BkpNotSeparatedCount -eq 0); $SafetyPass=($UnexpectedAllowCount -eq 0)
$FinalStatusText = if($V1712ReadyPass -and $CountPass -and $DecisionPass -and $BkpPass -and $SafetyPass){ $FinalStatusReady } else { "CHECK" }

Write-Uaos "Writing static final portal R3" "STEP" Cyan
$keepBlockedCount=0; $separateCount=0; foreach($r in $FinalRows){ if($r.owner_decision -eq "KEEP_BLOCKED"){$keepBlockedCount++}; if($r.owner_decision -eq "REQUEST_SEPARATE_APPROVAL_PHASE"){$separateCount++} }
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>UAOS V1713 Final Writer Portal</title><meta name="viewport" content="width=device-width, initial-scale=1">')
[void]$sb.AppendLine('<style>body{margin:0;background:#07101e;color:#eef5ff;font-family:Segoe UI,Arial,sans-serif}header{background:#0d1a2f;border-bottom:1px solid #263a59;padding:28px 32px}.wrap{padding:22px 32px 34px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}.card{background:#101d32;border:1px solid #28405f;border-radius:16px;padding:16px}.metric{font-size:32px;font-weight:800}.badge{display:inline-block;margin:4px 6px 4px 0;padding:5px 9px;border-radius:999px;border:1px solid #43658c;background:#142943;font-size:12px}.pass{border-color:#32a062;background:#12351f}.block{border-color:#a44848;background:#3a1618}.small{color:#aec0d8;font-size:13px;line-height:1.55}.path{font-family:Consolas,monospace;color:#cfe5ff;word-break:break-all}.btn{background:#142943;color:#eef5ff;border:1px solid #426187;border-radius:10px;padding:9px 11px;text-decoration:none;display:inline-block;margin:4px}table{border-collapse:collapse;width:100%;min-width:1100px}th,td{padding:8px 10px;border-bottom:1px solid #20324b;vertical-align:top}th{background:#14243c;text-align:left}.tableWrap{overflow:auto;border:1px solid #263a59;border-radius:14px;max-height:640px}</style></head><body>')
[void]$sb.AppendLine('<header><h1>UAOS V1713 Final Writer Portal</h1><span class="badge pass">status: '+(HtmlSafe $FinalStatusText)+'</span><span class="badge pass">revision: '+(HtmlSafe $Revision)+'</span><span class="badge pass">owner decisions sealed</span><span class="badge block">safe copy allowed: 0</span><span class="badge block">keyboard output: 0</span><span class="badge pass">no USB / no hardware / no deploy</span><p class="small">Final static owner portal. No keyboard binaries are generated.</p></header><div class="wrap">')
[void]$sb.AppendLine('<section class="grid"><div class="card"><div class="small">Final ledger rows</div><div class="metric">'+$FinalCount+'</div></div><div class="card"><div class="small">KEEP_BLOCKED</div><div class="metric">'+$keepBlockedCount+'</div></div><div class="card"><div class="small">Separate approval</div><div class="metric">'+$separateCount+'</div></div><div class="card"><div class="small">Bytes documented</div><div class="metric">'+$TotalBytes+'</div></div></section>')
[void]$sb.AppendLine('<section class="card" style="margin-top:16px"><h2>Final files</h2><p class="small">Phase root: <span class="path">'+(HtmlSafe $PhaseRoot)+'</span></p><p class="small">Source V1712: <span class="path">'+(HtmlSafe $SourceV1712PhaseRoot)+'</span></p><p class="small">Owner decisions: <span class="path">'+(HtmlSafe $OwnerDecisionsCsv)+'</span></p><a class="btn" href="'+(HtmlSafe (FileUri $FinalLedgerCsv))+'">Open Final Ledger CSV</a><a class="btn" href="'+(HtmlSafe (FileUri $FinalReportMd))+'">Open Final Report</a><a class="btn" href="'+(HtmlSafe (FileUri $FinalSealMd))+'">Open Final Seal</a><a class="btn" href="'+(HtmlSafe (FileUri $FinalValidationJson))+'">Open Validation</a><a class="btn" href="'+(HtmlSafe (FileUri $PackageZip))+'">Open Package</a></section>')
[void]$sb.AppendLine('<section class="card" style="margin-top:16px"><h2>Final gate summary</h2><table><tr><th>Gate</th><th>Status</th></tr><tr><td>V1712 ready</td><td>'+$V1712ReadyPass+'</td></tr><tr><td>Counts match</td><td>'+$CountPass+'</td></tr><tr><td>Decisions valid</td><td>'+$DecisionPass+'</td></tr><tr><td>BKP separated</td><td>'+$BkpPass+'</td></tr><tr><td>Safety pass</td><td>'+$SafetyPass+'</td></tr></table></section>')
[void]$sb.AppendLine('<section class="card" style="margin-top:16px"><h2>Decision summary</h2><table><tr><th>Decision</th><th>Count</th><th>Bytes</th></tr>')
foreach($s in $DecisionSummary){ [void]$sb.AppendLine('<tr><td>'+(HtmlSafe $s.owner_decision)+'</td><td>'+(HtmlSafe $s.count)+'</td><td>'+(HtmlSafe $s.total_bytes)+'</td></tr>') }
[void]$sb.AppendLine('</table></section><section class="card" style="margin-top:16px"><h2>Final ledger preview</h2><div class="tableWrap"><table><tr><th>Final</th><th>Review</th><th>Ext</th><th>Decision</th><th>Action</th><th>Path</th></tr>')
foreach($r in $FinalRows){ [void]$sb.AppendLine('<tr><td>'+(HtmlSafe $r.final_id)+'</td><td>'+(HtmlSafe $r.review_id)+'</td><td>'+(HtmlSafe $r.extension)+'</td><td>'+(HtmlSafe $r.owner_decision)+'</td><td>'+(HtmlSafe $r.final_action)+'</td><td class="path">'+(HtmlSafe $r.relative_path)+'</td></tr>') }
[void]$sb.AppendLine('</table></div></section></div><footer style="padding:20px 32px 32px;color:#9eb1c9">UAOS V1713 Final Writer R3. Owner decisions sealed. No source copy. No keyboard binary output.</footer></body></html>')
$sb.ToString() | Set-Content -LiteralPath $FinalPortalHtml -Encoding UTF8

Write-Uaos "Writing report, seal, validation R3" "STEP" Cyan
@"
# UAOS V1713 Final Writer Instructions - R3

Status target: $FinalStatusReady

This closes the current owner package. It does not create keyboard binaries and does not copy source files.

Inputs:
- V1712 phase: `$SourceV1712PhaseRoot`
- Owner decisions: `$OwnerDecisionsCsv`

Outputs:
- Portal: `$FinalPortalHtml`
- Ledger: `$FinalLedgerCsv`
- Validation: `$FinalValidationJson`
- Report: `$FinalReportMd`
- Seal: `$FinalSealMd`
- Package: `$PackageZip`
"@ | Set-Content -LiteralPath $FinalWriterInstructionsMd -Encoding UTF8

@"
# UAOS V1713 Final Writer Report - R3

Created: $((Get-Date).ToString("s"))

Status: **$FinalStatusText**
Revision: $Revision

## Counts

- Review rows: $ReviewCount
- Decision rows: $DecisionCount
- Final ledger rows: $FinalCount
- Total bytes documented: $TotalBytes
- Missing decisions: $MissingDecisionCount
- Invalid decisions: $InvalidDecisionCount
- Pending decisions: $PendingDecisionCount
- BKP not separated: $BkpNotSeparatedCount
- Unexpected allow rows: $UnexpectedAllowCount

## Gates

- V1712 ready pass: $V1712ReadyPass
- Count pass: $CountPass
- Decision pass: $DecisionPass
- BKP separate approval pass: $BkpPass
- Safety pass: $SafetyPass

## Final policy

- Writer mode: $WriterMode
- Safe copy allowed: 0
- writer_ready: false
- Source files copied: NO
- Keyboard outputs generated: NO
- USB write: NO
- Hardware load: NO
- Deploy: NO
- Payment: NO
"@ | Set-Content -LiteralPath $FinalReportMd -Encoding UTF8

@"
# UAOS V1713 Final Owner Seal - R3

Seal status: **$(if ($FinalStatusText -eq $FinalStatusReady) { "SEALED_FINAL_WRITER_READY" } else { "SEALED_CHECK" })**

Final status: $FinalStatusText
Revision: $Revision

- Review rows: $ReviewCount
- Decision rows: $DecisionCount
- Final ledger rows: $FinalCount
- Safe copy allowed: 0
- writer_ready: false
- Source files copied: NO
- Keyboard outputs generated: NO
- USB write: NO
- Hardware load: NO
- Deploy: NO
- Payment: NO
- BKP separate approval required: YES

Closing rule:
This closes the current owner package. No more experimental launchers are needed for this package.

Created: $((Get-Date).ToString("s"))
"@ | Set-Content -LiteralPath $FinalSealMd -Encoding UTF8

@"
UAOS FINAL STOP HERE

Current final: UAOS V1713 FINAL WRITER R3
Status: $FinalStatusText

Open:
$FinalPortalHtml

Keep:
$PackageZip

Do not create more experimental launchers for this owner package.
Do not enable source copy.
Do not enable keyboard binary output.
Do not enable USB or hardware load.
"@ | Set-Content -LiteralPath $FinalStopFile -Encoding UTF8

$ForbiddenGeneratedFiles=@(); foreach($f in @(Get-ChildItem -LiteralPath $PhaseRoot -Recurse -File -ErrorAction SilentlyContinue)){ if($ForbiddenKeyboardExts -contains ([string]$f.Extension).ToUpperInvariant()){ $ForbiddenGeneratedFiles += [string]$f.FullName } }
$ForbiddenGeneratedCount=[int](CountOf $ForbiddenGeneratedFiles); $NoForbiddenGeneratedPass=($ForbiddenGeneratedCount -eq 0)
$PortalPass=Test-Path -LiteralPath $FinalPortalHtml; $LedgerPass=((Test-Path -LiteralPath $FinalLedgerCsv) -and (Test-Path -LiteralPath $FinalLedgerJson)); $ReportPass=Test-Path -LiteralPath $FinalReportMd; $SealPass=Test-Path -LiteralPath $FinalSealMd
$OverallPassBeforePackage=($V1712ReadyPass -and $CountPass -and $DecisionPass -and $BkpPass -and $SafetyPass -and $NoForbiddenGeneratedPass -and $PortalPass -and $LedgerPass -and $ReportPass -and $SealPass)

$Manifest="" | Select-Object phase,stage,revision,status,created_at,repo_root,phase_root,source_v1712_phase_root,owner_decisions_csv,writer_mode,rows,source_copy,keyboard_output,usb_write,hardware_load,deploy,payment,launcher,portal,ledger_csv,validation,report,seal,package,stop_file
$Manifest.phase="UAOS V1713"; $Manifest.stage="FINAL_WRITER"; $Manifest.revision=$Revision; $Manifest.status=if($OverallPassBeforePackage){$FinalStatusReady}else{"CHECK"}; $Manifest.created_at=(Get-Date).ToString("s"); $Manifest.repo_root=$RepoRoot; $Manifest.phase_root=$PhaseRoot; $Manifest.source_v1712_phase_root=$SourceV1712PhaseRoot; $Manifest.owner_decisions_csv=$OwnerDecisionsCsv; $Manifest.writer_mode=$WriterMode; $Manifest.rows=$FinalCount; $Manifest.source_copy="NO"; $Manifest.keyboard_output="NO"; $Manifest.usb_write="NO"; $Manifest.hardware_load="NO"; $Manifest.deploy="NO"; $Manifest.payment="NO"; $Manifest.launcher=$FactoryScriptPath; $Manifest.portal=$FinalPortalHtml; $Manifest.ledger_csv=$FinalLedgerCsv; $Manifest.validation=$FinalValidationJson; $Manifest.report=$FinalReportMd; $Manifest.seal=$FinalSealMd; $Manifest.package=$PackageZip; $Manifest.stop_file=$FinalStopFile
(JsonOut $Manifest) | Set-Content -LiteralPath $FinalManifestJson -Encoding UTF8

$Validation="" | Select-Object phase,stage,revision,status,created_at,writer_mode,source_v1712_phase_root,owner_decisions_csv,v1712_status,v1712_ready_pass,review_count,decision_count,final_count,total_bytes,count_pass,missing_decision_count,invalid_decision_count,pending_decision_count,decision_pass,bkp_not_separated_count,bkp_pass,unexpected_allow_count,safety_pass,safe_copy_allowed_count,writer_ready,source_files_copied,keyboard_outputs_generated,usb_write,hardware_load,deploy,payment,forbidden_generated_files_count,no_forbidden_generated_pass,portal_pass,ledger_pass,report_pass,seal_pass,package,package_pass,package_sha256,overall_pass,final_portal,final_ledger_csv,final_report,final_seal
$Validation.phase="UAOS V1713"; $Validation.stage="FINAL_WRITER"; $Validation.revision=$Revision; $Validation.status=if($OverallPassBeforePackage){$FinalStatusReady}else{"CHECK"}; $Validation.created_at=(Get-Date).ToString("s"); $Validation.writer_mode=$WriterMode; $Validation.source_v1712_phase_root=$SourceV1712PhaseRoot; $Validation.owner_decisions_csv=$OwnerDecisionsCsv; $Validation.v1712_status=$V1712Status; $Validation.v1712_ready_pass=$V1712ReadyPass; $Validation.review_count=$ReviewCount; $Validation.decision_count=$DecisionCount; $Validation.final_count=$FinalCount; $Validation.total_bytes=$TotalBytes; $Validation.count_pass=$CountPass; $Validation.missing_decision_count=$MissingDecisionCount; $Validation.invalid_decision_count=$InvalidDecisionCount; $Validation.pending_decision_count=$PendingDecisionCount; $Validation.decision_pass=$DecisionPass; $Validation.bkp_not_separated_count=$BkpNotSeparatedCount; $Validation.bkp_pass=$BkpPass; $Validation.unexpected_allow_count=$UnexpectedAllowCount; $Validation.safety_pass=$SafetyPass; $Validation.safe_copy_allowed_count=0; $Validation.writer_ready=$false; $Validation.source_files_copied="NO"; $Validation.keyboard_outputs_generated="NO"; $Validation.usb_write="NO"; $Validation.hardware_load="NO"; $Validation.deploy="NO"; $Validation.payment="NO"; $Validation.forbidden_generated_files_count=$ForbiddenGeneratedCount; $Validation.no_forbidden_generated_pass=$NoForbiddenGeneratedPass; $Validation.portal_pass=$PortalPass; $Validation.ledger_pass=$LedgerPass; $Validation.report_pass=$ReportPass; $Validation.seal_pass=$SealPass; $Validation.package=$PackageZip; $Validation.package_pass=$false; $Validation.package_sha256=""; $Validation.overall_pass=$OverallPassBeforePackage; $Validation.final_portal=$FinalPortalHtml; $Validation.final_ledger_csv=$FinalLedgerCsv; $Validation.final_report=$FinalReportMd; $Validation.final_seal=$FinalSealMd
(JsonOut $Validation) | Set-Content -LiteralPath $FinalValidationJson -Encoding UTF8

Write-Uaos "Packaging final owner release R3" "STEP" Cyan
$staging=Join-Path ([System.IO.Path]::GetTempPath()) ("uaos_v1713_final_writer_r3_"+[guid]::NewGuid().ToString("N")); if(Test-Path -LiteralPath $staging){Remove-Item -LiteralPath $staging -Recurse -Force}; New-UaosDir $staging
foreach($d in @($DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$WriterDir,$ReleaseDir)){ CopyDirStage $d $staging }
if(Test-Path -LiteralPath $FactoryScriptPath){ Copy-Item -LiteralPath $FactoryScriptPath -Destination (Join-Path $staging $ScriptName) -Force }
if(Test-Path -LiteralPath $PackageZip){ Remove-Item -LiteralPath $PackageZip -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $PackageZip -Force
Remove-Item -LiteralPath $staging -Recurse -Force
$PackagePass=((Test-Path -LiteralPath $PackageZip) -and ((Get-Item -LiteralPath $PackageZip).Length -gt 0)); $PackageHash=Sha256 $PackageZip
if($PackagePass){ ($PackageHash+"  "+(Split-Path -Path $PackageZip -Leaf)) | Set-Content -LiteralPath $PackageSha256Txt -Encoding UTF8; Write-Uaos "Package: $PackageZip" "PASS" Green; Write-Uaos "Package SHA256: $PackageHash" "PASS" Green }
$OverallPass=($OverallPassBeforePackage -and $PackagePass); $FinalStatus=if($OverallPass){$FinalStatusReady}else{"CHECK"}
$Validation.status=$FinalStatus; $Validation.package_pass=$PackagePass; $Validation.package_sha256=$PackageHash; $Validation.overall_pass=$OverallPass; (JsonOut $Validation) | Set-Content -LiteralPath $FinalValidationJson -Encoding UTF8

$Pointer="" | Select-Object current_final,status,revision,created_at,phase_root,launcher,portal,ledger_csv,validation,report,seal,package,package_sha256,source_v1712_phase_root,owner_decisions_csv,stop_rule
$Pointer.current_final="UAOS V1713 FINAL_WRITER"; $Pointer.status=$FinalStatus; $Pointer.revision=$Revision; $Pointer.created_at=(Get-Date).ToString("s"); $Pointer.phase_root=$PhaseRoot; $Pointer.launcher=$FactoryScriptPath; $Pointer.portal=$FinalPortalHtml; $Pointer.ledger_csv=$FinalLedgerCsv; $Pointer.validation=$FinalValidationJson; $Pointer.report=$FinalReportMd; $Pointer.seal=$FinalSealMd; $Pointer.package=$PackageZip; $Pointer.package_sha256=$PackageHash; $Pointer.source_v1712_phase_root=$SourceV1712PhaseRoot; $Pointer.owner_decisions_csv=$OwnerDecisionsCsv; $Pointer.stop_rule="This is the final owner package for the current phase. No more experimental launchers unless explicitly approved."
(JsonOut $Pointer) | Set-Content -LiteralPath $FinalPointerJson -Encoding UTF8

try { $DocsDir=Join-Path $RepoRoot "docs"; New-UaosDir $DocsDir; $FinalStatusDoc=Join-Path $DocsDir "UAOS_FINAL_WRITER_STATUS.md"; "# UAOS Final Writer Status`n`nCurrent final: **UAOS V1713 FINAL_WRITER R3**`n`nStatus: **$FinalStatus**`n`nPortal: `$FinalPortalHtml`nLedger: `$FinalLedgerCsv`nValidation: `$FinalValidationJson`nReport: `$FinalReportMd`nSeal: `$FinalSealMd`nPackage: `$PackageZip`nSHA256: `$PackageHash`n`nPolicy: safe_copy_allowed=0, writer_ready=false, no source copy, no keyboard output, no USB, no hardware load, no deploy, no payment.`n" | Set-Content -LiteralPath $FinalStatusDoc -Encoding UTF8; Write-Uaos "Final status doc: $FinalStatusDoc" "PASS" Green } catch { Write-Uaos ("Could not write docs final status: "+$_.Exception.Message) "WARN" Yellow }

Write-Uaos "Optional git commit" "STEP" Cyan
$GitStatus="SKIPPED_BY_FLAG"; $GitHash=""
if(!$NoGitCommit){ try { if((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))){ Push-Location $RepoRoot; try { git add -- "uaos-ai-factory/$ScriptName" "uaos-ai-factory/$PhaseName" "uaos-ai-factory/UAOS_CURRENT_FINAL.json" "docs/UAOS_FINAL_WRITER_STATUS.md" | Out-Null; $statusText=((git status --porcelain) | Out-String); if([string]::IsNullOrWhiteSpace($statusText)){ $GitStatus="NO_CHANGES" } else { git commit -m "UAOS V1713 final writer owner package" | Out-Null; if($LASTEXITCODE -eq 0){ $GitHash=(git rev-parse --short HEAD).Trim(); $GitStatus="COMMITTED" } else { $GitStatus="COMMIT_FAILED" } } } finally { Pop-Location } } else { $GitStatus="GIT_NOT_AVAILABLE_OR_NOT_REPO" } } catch { $GitStatus="COMMIT_FAILED: "+$_.Exception.Message } }

Write-Host ""
if($FinalStatus -eq $FinalStatusReady){ Write-Uaos "UAOS V1713 FINAL WRITER R3 complete" "PASS" Green } else { Write-Uaos "UAOS V1713 FINAL WRITER R3 completed with CHECK status" "FAIL" Red }
Write-Host ("Status: "+$FinalStatus) -ForegroundColor $(if($FinalStatus -eq $FinalStatusReady){"Green"}else{"Yellow"})
Write-Host ("Portal: "+$FinalPortalHtml)
Write-Host ("Final ledger CSV: "+$FinalLedgerCsv)
Write-Host ("Validation: "+$FinalValidationJson)
Write-Host ("Report: "+$FinalReportMd)
Write-Host ("Seal: "+$FinalSealMd)
Write-Host ("Package: "+$PackageZip)
Write-Host ("Package SHA256: "+$PackageHash)
Write-Host ("Current final pointer: "+$FinalPointerJson)
Write-Host ("Git: "+$GitStatus+$(if($GitHash){" "+$GitHash}else{""}))
Write-Host "FINAL: no source files copied, no keyboard binary output, no USB, no hardware load."
if(!$NoOpen -and (Test-Path -LiteralPath $FinalPortalHtml)){ Start-Process $FinalPortalHtml }
if($FinalStatus -ne $FinalStatusReady){ exit 2 }
exit 0
