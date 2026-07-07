# UAOS V1719 KMP/KSF SAMPLE MAP RESEARCH MEGALAUNCHER
# Approved scope: one MegaLauncher, read V1718 KMP/KSF candidates, no cracking, no binary output, no USB, no hardware load.
# Creates sample-map research, linkage table, keymap draft, validation, report, portal, package.

[CmdletBinding()]
param(
  [string]$RepoRoot = "E:\keyboard-manager-clean",
  [string]$V1718PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1718-real-set-extractability-classifier",
  [string]$PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1719-kmp-ksf-sample-map-research",
  [switch]$NoOpen,
  [switch]$NoGitCommit
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Set-StrictMode -Version Latest

$FactoryRoot = Join-Path $RepoRoot "uaos-ai-factory"
$ScriptName = "RUN_UAOS_V1719_KMP_KSF_SAMPLE_MAP_RESEARCH_MEGALAUNCHER.ps1"
$FactoryScriptPath = Join-Path $FactoryRoot $ScriptName
$Revision = "V1719_KMP_KSF_SAMPLE_MAP_RESEARCH"
$ReadyStatus = "KMP_KSF_SAMPLE_MAP_READY"
$NoCandidatesStatus = "WAITING_FOR_V1718_KMP_KSF_CANDIDATES"

$V1718SampleCsv = Join-Path $V1718PhaseRoot "next-writer-source\UAOS_V1718_KMP_KSF_SAMPLE_CANDIDATES.csv"
$DataDir = Join-Path $PhaseRoot "data"
$WorkspaceDir = Join-Path $PhaseRoot "workspace"
$ReportsDir = Join-Path $PhaseRoot "reports"
$ValidationDir = Join-Path $PhaseRoot "validation"
$SealDir = Join-Path $PhaseRoot "seal"
$LogsDir = Join-Path $PhaseRoot "logs"
$PackageDir = Join-Path $PhaseRoot "package"
$ResearchDir = Join-Path $PhaseRoot "sample-map-research"
$NextWriterDir = Join-Path $PhaseRoot "next-writer-source"
$OwnerReviewDir = Join-Path $PhaseRoot "owner-review"

$RunLog = Join-Path $LogsDir "UAOS_V1719_KMP_KSF_SAMPLE_MAP_RESEARCH_RUN.log"
$PortalHtml = Join-Path $WorkspaceDir "UAOS_V1719_KMP_KSF_SAMPLE_MAP_RESEARCH_PORTAL.html"
$ValidationJson = Join-Path $ValidationDir "UAOS_V1719_KMP_KSF_SAMPLE_MAP_VALIDATION.json"
$ReportMd = Join-Path $ReportsDir "UAOS_V1719_KMP_KSF_SAMPLE_MAP_RESEARCH_REPORT.md"
$SealMd = Join-Path $SealDir "UAOS_V1719_KMP_KSF_SAMPLE_MAP_RESEARCH_SEAL.md"
$PointerJson = Join-Path $FactoryRoot "UAOS_CURRENT_KMP_KSF_SAMPLE_MAP_RESEARCH.json"
$StatusDoc = Join-Path (Join-Path $RepoRoot "docs") "UAOS_KMP_KSF_SAMPLE_MAP_RESEARCH_STATUS.md"

$CandidateResearchCsv = Join-Path $ResearchDir "UAOS_V1719_KMP_KSF_CANDIDATE_RESEARCH.csv"
$LinkageCsv = Join-Path $ResearchDir "UAOS_V1719_KMP_KSF_LINKAGE_TABLE.csv"
$KeymapDraftCsv = Join-Path $NextWriterDir "UAOS_V1719_KEYMAP_DRAFT.csv"
$WriterSourceCsv = Join-Path $NextWriterDir "UAOS_V1719_NEXT_WRITER_SOURCE_LIST.csv"
$OwnerReviewCsv = Join-Path $OwnerReviewDir "UAOS_V1719_OWNER_REVIEW_REQUIRED.csv"
$SampleMapJson = Join-Path $DataDir "UAOS_V1719_SAMPLE_MAP_RESEARCH.json"
$CodeXTasksMd = Join-Path $NextWriterDir "CODEX_V1720_NEXT_TASKS.md"
$ZipPath = Join-Path $PackageDir "UAOS_V1719_KMP_KSF_SAMPLE_MAP_RESEARCH_PACKAGE.zip"
$ShaPath = Join-Path $PackageDir "UAOS_V1719_KMP_KSF_SAMPLE_MAP_RESEARCH_PACKAGE.sha256.txt"

function New-UaosDir { param([string]$Path) if (!(Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null } }
function Write-UaosLog { param([string]$Message,[string]$Level="INFO",[ConsoleColor]$Color=[ConsoleColor]::Gray) $line="[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] [$Level] $Message"; Write-Host $line -ForegroundColor $Color; try { $line | Add-Content -LiteralPath $RunLog -Encoding UTF8 } catch {} }
function ConvertTo-UaosJson { param([object]$Value) return ($Value | ConvertTo-Json -Depth 90) }
function ConvertTo-UaosHtmlSafe { param([object]$Value) return [System.Net.WebUtility]::HtmlEncode([string]$Value) }
function Get-UaosFileUri { param([string]$Path) try { return ([System.Uri]::new((Resolve-Path -LiteralPath $Path).Path)).AbsoluteUri } catch { return $Path } }
function Get-UaosSha256 { param([string]$Path) if (Test-Path -LiteralPath $Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash }; return "" }
function Get-UaosProp { param([object]$Object,[string[]]$Names,[object]$Default="") if ($null -eq $Object) { return $Default }; foreach ($n in $Names) { foreach ($p in @($Object.PSObject.Properties)) { if ($p.Name -ieq $n) { return $p.Value } } }; return $Default }
function ConvertTo-UaosInt64 { param([object]$Value) [int64]$n=0; [void][int64]::TryParse([string]$Value,[ref]$n); return $n }
function Get-UaosLowerExt { param([object]$Value) $e=([string]$Value).Trim().ToLowerInvariant(); if ($e -and !$e.StartsWith(".")) { $e="."+$e }; return $e }
function Get-UaosDirectoryKey { param([string]$Path) try { $dir=Split-Path -Parent $Path; if ([string]::IsNullOrWhiteSpace($dir)) { return "" }; return $dir.ToLowerInvariant() } catch { return "" } }
function Get-UaosSetContext { param([string]$Path) if ([string]::IsNullOrWhiteSpace($Path)) { return "" }; $m=[regex]::Match($Path,"(?i)([^\\/]+\.SET)([\\/]|$)"); if ($m.Success) { return $m.Groups[1].Value }; return "" }
function Get-UaosPreviewHex { param([string]$Path,[int]$Count=64) if (!(Test-Path -LiteralPath $Path)) { return "" }; $fs=$null; try { $fs=[System.IO.File]::Open($Path,[System.IO.FileMode]::Open,[System.IO.FileAccess]::Read,[System.IO.FileShare]::ReadWrite); $buffer=New-Object byte[] ($Count); $read=$fs.Read($buffer,0,$Count); if ($read -le 0) { return "" }; return (($buffer[0..($read-1)] | ForEach-Object { $_.ToString("X2") }) -join " ") } catch { return "" } finally { if ($fs) { $fs.Dispose() } } }
function Get-UaosAsciiPreview { param([string]$Path,[int]$Count=256) if (!(Test-Path -LiteralPath $Path)) { return "" }; $fs=$null; try { $fs=[System.IO.File]::Open($Path,[System.IO.FileMode]::Open,[System.IO.FileAccess]::Read,[System.IO.FileShare]::ReadWrite); $buffer=New-Object byte[] ($Count); $read=$fs.Read($buffer,0,$Count); if ($read -le 0) { return "" }; $sb=New-Object System.Text.StringBuilder; for ($i=0;$i -lt $read;$i++) { $b=$buffer[$i]; if ($b -ge 32 -and $b -le 126) { [void]$sb.Append([char]$b) } else { [void]$sb.Append(".") } }; return $sb.ToString() } catch { return "" } finally { if ($fs) { $fs.Dispose() } } }
function Get-UaosKeyGuess { param([string]$Name,[int]$Index) $m=[regex]::Match([string]$Name,"(?i)(C#|Db|D#|Eb|F#|Gb|G#|Ab|A#|Bb|C|D|E|F|G|A|B)\s*[-_ ]?\s*([0-8])"); if ($m.Success) { return ($m.Groups[1].Value.ToUpperInvariant()+$m.Groups[2].Value) }; $base=36+(($Index-1)*4); if ($base -gt 96) { $base=60+(($Index-1)%12) }; return ("MIDI_"+$base) }
function New-UaosKeyRange { param([int]$Index) $center=36+(($Index-1)*4); if ($center -gt 96) { $center=60+(($Index-1)%12) }; $low=$center-2; $high=$center+1; if ($low -lt 0) { $low=0 }; if ($high -gt 127) { $high=127 }; $o="" | Select-Object low_key_guess,root_key_guess,high_key_guess; $o.low_key_guess="MIDI_"+$low; $o.root_key_guess="MIDI_"+$center; $o.high_key_guess="MIDI_"+$high; return $o }

foreach ($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$PackageDir,$ResearchDir,$NextWriterDir,$OwnerReviewDir,(Join-Path $RepoRoot "docs"))) { New-UaosDir $d }
Write-UaosLog "UAOS V1719 KMP/KSF SAMPLE MAP RESEARCH started" "STEP" Cyan
if (!(Test-Path -LiteralPath $V1718SampleCsv)) { throw "Missing V1718 KMP/KSF sample candidate CSV: $V1718SampleCsv" }
try { if ($PSCommandPath) { Copy-Item -LiteralPath $PSCommandPath -Destination $FactoryScriptPath -Force } } catch {}

$rows = @(Import-Csv -LiteralPath $V1718SampleCsv)
$research=@(); $existing=@(); $missing=@(); $index=0
foreach ($r in $rows) {
  $index++
  $fileName=[string](Get-UaosProp $r @("file_name","FileName","name") "")
  $path=[string](Get-UaosProp $r @("source_path","full_path","path","relative_path") "")
  $ext=Get-UaosLowerExt (Get-UaosProp $r @("extension","ext") "")
  if ([string]::IsNullOrWhiteSpace($ext) -and $fileName) { $ext=[IO.Path]::GetExtension($fileName).ToLowerInvariant() }
  $bytes=ConvertTo-UaosInt64 (Get-UaosProp $r @("bytes","size","length") 0)
  $sha=[string](Get-UaosProp $r @("sha256","hash") "")
  $exists=Test-Path -LiteralPath $path
  if ($exists -and [string]::IsNullOrWhiteSpace($sha)) { $sha=Get-UaosSha256 $path }
  if ($exists) { $existing += $r } else { $missing += $r }
  $previewHex=""; $previewAscii=""
  if ($exists) { $previewHex=Get-UaosPreviewHex -Path $path -Count 64; $previewAscii=Get-UaosAsciiPreview -Path $path -Count 256 }
  $researchType = if ($ext -eq ".kmp") { "KMP_MULTISAMPLE_STRUCTURE_READONLY_RESEARCH" } elseif ($ext -eq ".ksf") { "KSF_SAMPLE_FILE_READONLY_RESEARCH" } else { "UNKNOWN_KMP_KSF_CANDIDATE" }
  $confidence = if ($exists -and $ext -in @(".kmp",".ksf")) { "MEDIUM_METADATA_ONLY" } else { "LOW_FILE_MISSING_OR_UNKNOWN" }
  $status = if ($exists) { "READONLY_METADATA_RECORDED" } else { "SOURCE_FILE_NOT_FOUND_METADATA_ONLY" }
  $o="" | Select-Object candidate_id,file_name,source_path,extension,bytes,sha256,file_exists,set_context,directory_key,research_type,first64_hex,ascii_preview,confidence,status,safety_status
  $o.candidate_id="V1719_CAND_"+$index.ToString("000"); $o.file_name=$fileName; $o.source_path=$path; $o.extension=$ext; $o.bytes=$bytes; $o.sha256=$sha; $o.file_exists=$exists; $o.set_context=Get-UaosSetContext $path; $o.directory_key=Get-UaosDirectoryKey $path; $o.research_type=$researchType; $o.first64_hex=$previewHex; $o.ascii_preview=$previewAscii; $o.confidence=$confidence; $o.status=$status; $o.safety_status="READ_ONLY_NO_BINARY_OUTPUT_NO_CRACKING"
  $research += $o
}
$research | Export-Csv -LiteralPath $CandidateResearchCsv -NoTypeInformation -Encoding UTF8

Write-UaosLog "Building KMP/KSF linkage table" "STEP" Cyan
$kmpRows=@($research | Where-Object { $_.extension -eq ".kmp" })
$ksfRows=@($research | Where-Object { $_.extension -eq ".ksf" })
$linkage=@()
foreach ($kmp in $kmpRows) {
  $linked=@($ksfRows | Where-Object { $_.directory_key -eq $kmp.directory_key })
  if (@($linked).Count -eq 0) { $linked=@($ksfRows | Where-Object { $_.set_context -eq $kmp.set_context -and ![string]::IsNullOrWhiteSpace($_.set_context) }) }
  if (@($linked).Count -eq 0) {
    $l="" | Select-Object kmp_candidate_id,kmp_file,ksf_candidate_id,ksf_file,link_type,link_confidence,reason,set_context,directory_key
    $l.kmp_candidate_id=$kmp.candidate_id; $l.kmp_file=$kmp.source_path; $l.ksf_candidate_id=""; $l.ksf_file=""; $l.link_type="NO_KSF_MATCH_FOUND"; $l.link_confidence="LOW"; $l.reason="No KSF candidate in same directory or SET context."; $l.set_context=$kmp.set_context; $l.directory_key=$kmp.directory_key; $linkage += $l
  } else {
    foreach ($ksf in $linked) {
      $l="" | Select-Object kmp_candidate_id,kmp_file,ksf_candidate_id,ksf_file,link_type,link_confidence,reason,set_context,directory_key
      $l.kmp_candidate_id=$kmp.candidate_id; $l.kmp_file=$kmp.source_path; $l.ksf_candidate_id=$ksf.candidate_id; $l.ksf_file=$ksf.source_path; $l.link_type=if($ksf.directory_key -eq $kmp.directory_key){"SAME_DIRECTORY"}else{"SAME_SET_CONTEXT"}; $l.link_confidence=if($l.link_type -eq "SAME_DIRECTORY"){"MEDIUM"}else{"LOW_MEDIUM"}; $l.reason="Linked by filesystem proximity only. Needs parser/hardware validation later."; $l.set_context=$kmp.set_context; $l.directory_key=$kmp.directory_key; $linkage += $l
    }
  }
}
if (@($kmpRows).Count -eq 0) {
  foreach ($ksf in $ksfRows) {
    $l="" | Select-Object kmp_candidate_id,kmp_file,ksf_candidate_id,ksf_file,link_type,link_confidence,reason,set_context,directory_key
    $l.kmp_candidate_id=""; $l.kmp_file=""; $l.ksf_candidate_id=$ksf.candidate_id; $l.ksf_file=$ksf.source_path; $l.link_type="STANDALONE_KSF"; $l.link_confidence="LOW_MEDIUM"; $l.reason="KSF candidate without KMP mapping in V1718 list."; $l.set_context=$ksf.set_context; $l.directory_key=$ksf.directory_key; $linkage += $l
  }
}
$linkage | Export-Csv -LiteralPath $LinkageCsv -NoTypeInformation -Encoding UTF8

Write-UaosLog "Building keymap draft" "STEP" Cyan
$keymap=@(); $writerSource=@(); $ownerReview=@(); $sampleRows=@($ksfRows); if (@($sampleRows).Count -eq 0) { $sampleRows=@($kmpRows) }
$ki=0
foreach ($s in $sampleRows) {
  $ki++; $range=New-UaosKeyRange -Index $ki; $rootGuess=Get-UaosKeyGuess -Name $s.file_name -Index $ki
  $km="" | Select-Object map_id,sample_candidate_id,file_name,source_path,extension,source_sha256,low_key_guess,root_key_guess,high_key_guess,velocity_low,velocity_high,loop_mode_guess,linkage_status,confidence,required_next_action,safety_status
  $km.map_id="V1719_MAP_"+$ki.ToString("000"); $km.sample_candidate_id=$s.candidate_id; $km.file_name=$s.file_name; $km.source_path=$s.source_path; $km.extension=$s.extension; $km.source_sha256=$s.sha256; $km.low_key_guess=$range.low_key_guess; $km.root_key_guess=$rootGuess; $km.high_key_guess=$range.high_key_guess; $km.velocity_low=1; $km.velocity_high=127; $km.loop_mode_guess="UNKNOWN_NEEDS_FORMAT_READER"; $km.linkage_status=if($s.extension -eq ".ksf"){"KSF_SAMPLE_CANDIDATE"}else{"KMP_STRUCTURE_PLACEHOLDER"}; $km.confidence="LOW_DRAFT_ONLY"; $km.required_next_action="V1720_READONLY_STRUCTURE_INSPECTOR"; $km.safety_status="DRAFT_ONLY_NO_BINARY_OUTPUT"; $keymap += $km
  $ws="" | Select-Object writer_source_id,map_id,file_name,source_path,extension,source_sha256,allowed_use,blocked_until,commercial_status
  $ws.writer_source_id="V1719_WRITER_SRC_"+$ki.ToString("000"); $ws.map_id=$km.map_id; $ws.file_name=$s.file_name; $ws.source_path=$s.source_path; $ws.extension=$s.extension; $ws.source_sha256=$s.sha256; $ws.allowed_use="READONLY_RESEARCH_AND_DRAFT_MAPPING_ONLY"; $ws.blocked_until="FORMAT_READER_LICENSE_HARDWARE_VALIDATION"; $ws.commercial_status="NEEDS_LICENSE_REVIEW_BEFORE_SALE"; $writerSource += $ws
  $or="" | Select-Object item_id,file_name,source_path,question,required_owner_decision
  $or.item_id="V1719_REVIEW_"+$ki.ToString("000"); $or.file_name=$s.file_name; $or.source_path=$s.source_path; $or.question="Confirm whether this KMP/KSF item should remain in the next writer research list."; $or.required_owner_decision="KEEP_FOR_V1720 / REMOVE / LICENSE_UNKNOWN"; $ownerReview += $or
}
$keymap | Export-Csv -LiteralPath $KeymapDraftCsv -NoTypeInformation -Encoding UTF8
$writerSource | Export-Csv -LiteralPath $WriterSourceCsv -NoTypeInformation -Encoding UTF8
$ownerReview | Export-Csv -LiteralPath $OwnerReviewCsv -NoTypeInformation -Encoding UTF8

$totalCandidates=@($research).Count; $kmpCount=@($kmpRows).Count; $ksfCount=@($ksfRows).Count; $linkageCount=@($linkage).Count; $keymapCount=@($keymap).Count; $missingCount=@($missing).Count; $existingCount=@($existing).Count; $status=if($totalCandidates -gt 0){$ReadyStatus}else{$NoCandidatesStatus}
$payload="" | Select-Object revision,created_at,total_candidates,kmp_count,ksf_count,linkage_count,keymap_rows,research_csv,linkage_csv,keymap_csv,writer_source_csv
$payload.revision=$Revision; $payload.created_at=(Get-Date).ToString("s"); $payload.total_candidates=$totalCandidates; $payload.kmp_count=$kmpCount; $payload.ksf_count=$ksfCount; $payload.linkage_count=$linkageCount; $payload.keymap_rows=$keymapCount; $payload.research_csv=$CandidateResearchCsv; $payload.linkage_csv=$LinkageCsv; $payload.keymap_csv=$KeymapDraftCsv; $payload.writer_source_csv=$WriterSourceCsv
ConvertTo-UaosJson $payload | Set-Content -LiteralPath $SampleMapJson -Encoding UTF8

@("# CodeX V1720 Next Tasks","","Task 1: Build read-only KMP/KSF structure inspector using V1719 candidate research.","Task 2: Improve key/root/loop metadata guesses from readable metadata only.","Task 3: Keep PCM parser as a separate later phase.","Task 4: Prepare owner review workflow for each keymap draft row.","","Hard gates: no cracking, no binary KORG output, no USB, no hardware load, no PA3X-ready claim until real hardware test.") | Set-Content -LiteralPath $CodeXTasksMd -Encoding UTF8

$html=@("<!doctype html><html><head><meta charset='utf-8'><title>UAOS V1719 KMP/KSF Sample Map Research</title><style>body{font-family:Segoe UI,Arial;background:#07101d;color:#eef5ff;padding:28px}.card{background:#101d32;border:1px solid #263a59;border-radius:14px;padding:16px;margin:10px 0}.num{font-size:28px;font-weight:800}.btn{display:inline-block;background:#173456;color:white;padding:10px;margin:4px;border-radius:10px;text-decoration:none}.ok{background:#12351f;border:1px solid #32a062;padding:8px 12px;border-radius:999px;display:inline-block}</style></head><body>","<h1>UAOS V1719 KMP/KSF Sample Map Research</h1>","<div class='ok'>Status: "+(ConvertTo-UaosHtmlSafe $status)+"</div>","<div class='card'>Total KMP/KSF candidates<div class='num'>$totalCandidates</div></div>","<div class='card'>KMP candidates<div class='num'>$kmpCount</div></div>","<div class='card'>KSF candidates<div class='num'>$ksfCount</div></div>","<div class='card'>Existing source files<div class='num'>$existingCount</div></div>","<div class='card'>Missing source files<div class='num'>$missingCount</div></div>","<div class='card'>Linkage rows<div class='num'>$linkageCount</div></div>","<div class='card'>Keymap draft rows<div class='num'>$keymapCount</div></div>","<div class='card'><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosFileUri $CandidateResearchCsv))+"'>Candidate Research</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosFileUri $LinkageCsv))+"'>KMP/KSF Linkage</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosFileUri $KeymapDraftCsv))+"'>Keymap Draft</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosFileUri $WriterSourceCsv))+"'>Writer Source List</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosFileUri $ValidationJson))+"'>Validation</a></div>","<div class='card'>No cracking. No binary keyboard output. No USB. No hardware load. Draft only until parser/license/hardware validation.</div>","</body></html>")
$html | Set-Content -LiteralPath $PortalHtml -Encoding UTF8

$validation="" | Select-Object phase,revision,status,source_v1718_phase,total_candidates,kmp_count,ksf_count,existing_source_files,missing_source_files,linkage_rows,keymap_rows,no_cracking,no_binary_keyboard_output,no_usb,no_hardware_load,commercial_status,recommended_next_phase,portal,candidate_research_csv,linkage_csv,keymap_draft_csv,writer_source_csv,package,package_sha256
$validation.phase="UAOS V1719"; $validation.revision=$Revision; $validation.status=$status; $validation.source_v1718_phase=$V1718PhaseRoot; $validation.total_candidates=$totalCandidates; $validation.kmp_count=$kmpCount; $validation.ksf_count=$ksfCount; $validation.existing_source_files=$existingCount; $validation.missing_source_files=$missingCount; $validation.linkage_rows=$linkageCount; $validation.keymap_rows=$keymapCount; $validation.no_cracking=$true; $validation.no_binary_keyboard_output=$true; $validation.no_usb=$true; $validation.no_hardware_load=$true; $validation.commercial_status="NEEDS_LICENSE_REVIEW_BEFORE_SALE"; $validation.recommended_next_phase="UAOS V1720 READONLY_KMP_KSF_STRUCTURE_INSPECTOR"; $validation.portal=$PortalHtml; $validation.candidate_research_csv=$CandidateResearchCsv; $validation.linkage_csv=$LinkageCsv; $validation.keymap_draft_csv=$KeymapDraftCsv; $validation.writer_source_csv=$WriterSourceCsv; $validation.package=$ZipPath; $validation.package_sha256=""
ConvertTo-UaosJson $validation | Set-Content -LiteralPath $ValidationJson -Encoding UTF8

@("# UAOS V1719 KMP/KSF Sample Map Research Report","","Status: $status","Total KMP/KSF candidates: $totalCandidates","KMP candidates: $kmpCount","KSF candidates: $ksfCount","Existing source files: $existingCount","Missing source files: $missingCount","KMP/KSF linkage rows: $linkageCount","Keymap draft rows: $keymapCount","","Outputs:","- Candidate research: $CandidateResearchCsv","- Linkage table: $LinkageCsv","- Keymap draft: $KeymapDraftCsv","- Writer source list: $WriterSourceCsv","","Safety: no cracking, no binary output, no USB, no hardware load.","Commercial use: NEEDS_LICENSE_REVIEW_BEFORE_SALE","Recommended next: UAOS V1720 READONLY KMP/KSF STRUCTURE INSPECTOR") | Set-Content -LiteralPath $ReportMd -Encoding UTF8
@("# UAOS V1719 KMP/KSF Sample Map Research Seal","","Status: $status","Total candidates: $totalCandidates","KMP candidates: $kmpCount","KSF candidates: $ksfCount","Keymap draft rows: $keymapCount","No cracking: TRUE","No binary keyboard output: TRUE","No USB: TRUE","No hardware load: TRUE") | Set-Content -LiteralPath $SealMd -Encoding UTF8

Write-UaosLog "Packaging V1719 metadata only" "STEP" Cyan
$stage=Join-Path ([IO.Path]::GetTempPath()) ("v1719_"+[guid]::NewGuid().ToString("N")); New-UaosDir $stage
foreach($d in @($DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$ResearchDir,$NextWriterDir,$OwnerReviewDir)){ if(Test-Path -LiteralPath $d){ Copy-Item -LiteralPath $d -Destination (Join-Path $stage (Split-Path $d -Leaf)) -Recurse -Force } }
if(Test-Path -LiteralPath $ZipPath){ Remove-Item -LiteralPath $ZipPath -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $ZipPath -Force
Remove-Item -LiteralPath $stage -Recurse -Force
$hash=Get-UaosSha256 $ZipPath; ($hash+"  "+(Split-Path $ZipPath -Leaf)) | Set-Content -LiteralPath $ShaPath -Encoding UTF8
$validation.package_sha256=$hash; ConvertTo-UaosJson $validation | Set-Content -LiteralPath $ValidationJson -Encoding UTF8

$pointer="" | Select-Object current_kmp_ksf_sample_map_research,status,revision,phase_root,portal,validation,keymap_draft_csv,writer_source_csv,recommended_next_phase,package,package_sha256
$pointer.current_kmp_ksf_sample_map_research="UAOS V1719 KMP_KSF_SAMPLE_MAP_RESEARCH"; $pointer.status=$status; $pointer.revision=$Revision; $pointer.phase_root=$PhaseRoot; $pointer.portal=$PortalHtml; $pointer.validation=$ValidationJson; $pointer.keymap_draft_csv=$KeymapDraftCsv; $pointer.writer_source_csv=$WriterSourceCsv; $pointer.recommended_next_phase="UAOS V1720 READONLY_KMP_KSF_STRUCTURE_INSPECTOR"; $pointer.package=$ZipPath; $pointer.package_sha256=$hash
ConvertTo-UaosJson $pointer | Set-Content -LiteralPath $PointerJson -Encoding UTF8
@("# UAOS KMP/KSF Sample Map Research Status","","Current: UAOS V1719 KMP_KSF_SAMPLE_MAP_RESEARCH","Status: $status","Portal: $PortalHtml","Keymap draft: $KeymapDraftCsv","Writer source list: $WriterSourceCsv","Recommended next: UAOS V1720 READONLY KMP/KSF STRUCTURE INSPECTOR","Package: $ZipPath","SHA256: $hash") | Set-Content -LiteralPath $StatusDoc -Encoding UTF8

Write-UaosLog "Local git commit only" "STEP" Cyan
$GitStatus="SKIPPED_BY_FLAG"; $GitHash=""
if(!$NoGitCommit){
  try{
    if((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))){
      Push-Location $RepoRoot
      try{
        git add -f -- "uaos-ai-factory/$ScriptName" "uaos-ai-factory/uaos-v1719-kmp-ksf-sample-map-research" "uaos-ai-factory/UAOS_CURRENT_KMP_KSF_SAMPLE_MAP_RESEARCH.json" "docs/UAOS_KMP_KSF_SAMPLE_MAP_RESEARCH_STATUS.md" | Out-Null
        $st=((git status --porcelain) | Out-String)
        if([string]::IsNullOrWhiteSpace($st)){ $GitStatus="NO_CHANGES" } else { git commit -m "UAOS V1719 KMP KSF sample map research" | Out-Null; if($LASTEXITCODE -eq 0){ $GitHash=(git rev-parse --short HEAD).Trim(); $GitStatus="COMMITTED" } else { $GitStatus="COMMIT_FAILED" } }
      } finally { Pop-Location }
    }
  } catch { $GitStatus="COMMIT_FAILED: "+$_.Exception.Message; Write-UaosLog $GitStatus "WARN" Yellow }
}

Write-Host ""
Write-UaosLog "UAOS V1719 KMP/KSF SAMPLE MAP RESEARCH complete" "PASS" Green
Write-Host ("Status: "+$status)
Write-Host ("Portal: "+$PortalHtml)
Write-Host ("Candidate research: "+$CandidateResearchCsv)
Write-Host ("Linkage table: "+$LinkageCsv)
Write-Host ("Keymap draft: "+$KeymapDraftCsv)
Write-Host ("Writer source list: "+$WriterSourceCsv)
Write-Host ("Validation: "+$ValidationJson)
Write-Host ("Package: "+$ZipPath)
Write-Host ("Package SHA256: "+$hash)
Write-Host ("Git: "+$GitStatus)
if($GitHash){ Write-Host ("Git hash: "+$GitHash) }
if(!$NoOpen){ Start-Process $PortalHtml }
if($status -ne $ReadyStatus){ exit 2 }
exit 0
