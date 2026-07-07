# UAOS V1717 INTAKE REPAIR CONTINUE R3 - MINIMAL SAFE
# Fixes Arabic path / 7-Zip path issues by copying source to ASCII folder first.
# Extracts open ZIP archives only. Other archives are reported as skipped. No password bypass.

[CmdletBinding()]
param(
  [string]$RepoRoot = "E:\keyboard-manager-clean",
  [string]$OriginalSourceRoot = "",
  [string]$AsciiSourceRoot = "E:\UAOS_OPEN_LIBRARY_SOURCE",
  [string]$PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1717-open-library-intake",
  [switch]$RefreshAsciiCopy,
  [switch]$NoOpen,
  [switch]$NoGitCommit
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Set-StrictMode -Version Latest

$FactoryRoot = Join-Path $RepoRoot "uaos-ai-factory"
$ScriptName = "RUN_UAOS_V1717_INTAKE_REPAIR_CONTINUE_R3.ps1"
$FactoryScriptPath = Join-Path $FactoryRoot $ScriptName
$Revision = "V1717_INTAKE_REPAIR_CONTINUE_R3"
$ReadyStatus = "OPEN_LIBRARY_INTAKE_READY"
$NoDataStatus = "OPEN_LIBRARY_INTAKE_DONE_NO_DATA"

$DataDir = Join-Path $PhaseRoot "data"
$WorkspaceDir = Join-Path $PhaseRoot "workspace"
$ReportsDir = Join-Path $PhaseRoot "reports"
$ValidationDir = Join-Path $PhaseRoot "validation"
$SealDir = Join-Path $PhaseRoot "seal"
$LogsDir = Join-Path $PhaseRoot "logs"
$PackageDir = Join-Path $PhaseRoot "package"
$ExtractedDir = Join-Path $PhaseRoot "extracted-open-archives"
$CandidateDir = Join-Path $PhaseRoot "candidate-samples"
$KeyboardDir = Join-Path $PhaseRoot "keyboard-metadata-only"
$LicenseDir = Join-Path $PhaseRoot "license-review"

$RunLog = Join-Path $LogsDir "UAOS_V1717_INTAKE_REPAIR_CONTINUE_R3_RUN.log"
$PortalHtml = Join-Path $WorkspaceDir "UAOS_V1717_OPEN_LIBRARY_INTAKE_PORTAL.html"
$ValidationJson = Join-Path $ValidationDir "UAOS_V1717_OPEN_LIBRARY_INTAKE_VALIDATION.json"
$InventoryCsv = Join-Path $DataDir "UAOS_V1717_FULL_INVENTORY.csv"
$CandidateCsv = Join-Path $DataDir "UAOS_V1717_CANDIDATE_SAMPLES.csv"
$KeyboardCsv = Join-Path $DataDir "UAOS_V1717_KEYBOARD_METADATA_ONLY.csv"
$ArchiveCsv = Join-Path $DataDir "UAOS_V1717_ARCHIVE_REPORT.csv"
$SkippedCsv = Join-Path $DataDir "UAOS_V1717_SKIPPED.csv"
$LicenseCsv = Join-Path $LicenseDir "UAOS_V1717_LICENSE_REVIEW_LEDGER.csv"
$PolicyMd = Join-Path $LicenseDir "UAOS_V1717_COMMERCIAL_USE_POLICY.md"
$ReportMd = Join-Path $ReportsDir "UAOS_V1717_OPEN_LIBRARY_INTAKE_REPORT.md"
$SealMd = Join-Path $SealDir "UAOS_V1717_OPEN_LIBRARY_INTAKE_SEAL.md"
$ZipPath = Join-Path $PackageDir "UAOS_V1717_OPEN_LIBRARY_INTAKE_METADATA_PACKAGE.zip"
$ShaPath = Join-Path $PackageDir "UAOS_V1717_OPEN_LIBRARY_INTAKE_METADATA_PACKAGE.sha256.txt"
$PointerJson = Join-Path $FactoryRoot "UAOS_CURRENT_OPEN_LIBRARY_INTAKE.json"
$StatusDoc = Join-Path (Join-Path $RepoRoot "docs") "UAOS_OPEN_LIBRARY_INTAKE_STATUS.md"

$AudioExt = @(".wav",".aif",".aiff",".flac",".ogg",".mp3")
$ArchiveExt = @(".zip",".7z",".rar",".tar",".gz",".tgz")
$KeyboardExt = @(".set",".pcm",".sty",".pcg",".prf",".pad",".kmp",".ksf",".sbd",".sbl",".gbl",".voc",".mxp",".bkp",".ksc",".kst",".prg",".dk",".dkp")

function Mk { param([string]$Path) if (!(Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null } }
function Log { param([string]$Msg,[string]$Lvl="INFO",[ConsoleColor]$Color=[ConsoleColor]::Gray) $line="[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] [$Lvl] $Msg"; Write-Host $line -ForegroundColor $Color; try { $line | Add-Content -LiteralPath $RunLog -Encoding UTF8 } catch {} }
function J { param([object]$Value) return ($Value | ConvertTo-Json -Depth 80) }
function ConvertTo-UaosHtmlSafe { param([object]$Value) return [System.Net.WebUtility]::HtmlEncode([string]$Value) }
function U { param([string]$Path) try { return ([System.Uri]::new((Resolve-Path -LiteralPath $Path).Path)).AbsoluteUri } catch { return $Path } }
function Hash { param([string]$Path) if (Test-Path -LiteralPath $Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash } return "" }
function Safe { param([string]$Name) $r=$Name; foreach($c in [IO.Path]::GetInvalidFileNameChars()){ $r=$r.Replace([string]$c,"_") }; return ($r -replace "\s+","_") }
function Rel { param([string]$Base,[string]$Full) try { $b=[IO.Path]::GetFullPath($Base).TrimEnd([char]'\',[char]'/'); $f=[IO.Path]::GetFullPath($Full); if($f.StartsWith($b,[StringComparison]::OrdinalIgnoreCase)){ return $f.Substring($b.Length).TrimStart([char]'\',[char]'/') } return $Full } catch { return $Full } }
function ArabicDefaultFolder { $s=""; foreach($c in @(0x0645,0x062C,0x0644,0x062F,0x0020,0x062C,0x062F,0x064A,0x062F)){ $s += [char]$c }; return ("E:\" + $s) }

foreach($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$PackageDir,$ExtractedDir,$CandidateDir,$KeyboardDir,$LicenseDir,(Join-Path $RepoRoot "docs"))){ Mk $d }

Log "UAOS V1717 INTAKE REPAIR CONTINUE R3 started" "STEP" Cyan

if([string]::IsNullOrWhiteSpace($OriginalSourceRoot)){
  if(Test-Path -LiteralPath $AsciiSourceRoot){ $OriginalSourceRoot = $AsciiSourceRoot } else { $OriginalSourceRoot = ArabicDefaultFolder }
}
Log "OriginalSourceRoot: $OriginalSourceRoot"
Log "AsciiSourceRoot: $AsciiSourceRoot"

if(!(Test-Path -LiteralPath $OriginalSourceRoot)){ throw "Original source not found: $OriginalSourceRoot" }

$origPath = (Resolve-Path -LiteralPath $OriginalSourceRoot).Path
$asciiFull = [IO.Path]::GetFullPath($AsciiSourceRoot)
if(![string]::Equals($origPath, $asciiFull, [StringComparison]::OrdinalIgnoreCase)){
  if($RefreshAsciiCopy -and (Test-Path -LiteralPath $AsciiSourceRoot)){ Remove-Item -LiteralPath $AsciiSourceRoot -Recurse -Force }
  Mk $AsciiSourceRoot
  Log "Copying to ASCII-safe source folder" "STEP" Cyan
  & robocopy.exe $OriginalSourceRoot $AsciiSourceRoot /E /R:1 /W:1 /NFL /NDL /NP | Out-Null
  $rc = $LASTEXITCODE
  if($rc -gt 7){ throw "Robocopy failed with exit code $rc" }
}else{
  Log "Using existing ASCII-safe source folder"
}

try { if($PSCommandPath){ Copy-Item -LiteralPath $PSCommandPath -Destination $FactoryScriptPath -Force } } catch {}

Log "Extracting open ZIP archives" "STEP" Cyan
$archiveRows = @()
$zips = @(Get-ChildItem -LiteralPath $AsciiSourceRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension.ToLowerInvariant() -eq ".zip" })
foreach($z in $zips){
  $dest = Join-Path $ExtractedDir ((Safe ([IO.Path]::GetFileNameWithoutExtension($z.Name))) + "_" + (Hash $z.FullName).Substring(0,8))
  Mk $dest
  $r = "" | Select-Object archive, extension, status, output_dir, note
  $r.archive = $z.FullName; $r.extension = ".zip"; $r.output_dir = $dest
  try{
    Expand-Archive -LiteralPath $z.FullName -DestinationPath $dest -Force
    $r.status = "EXTRACTED_OPEN_OR_UNPROTECTED"; $r.note = "Extracted with Expand-Archive"
  }catch{
    $r.status = "SKIPPED_LOCKED_OR_UNSUPPORTED"; $r.note = $_.Exception.Message
  }
  $archiveRows += $r
}
$otherArchives = @(Get-ChildItem -LiteralPath $AsciiSourceRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $ArchiveExt -contains $_.Extension.ToLowerInvariant() -and $_.Extension.ToLowerInvariant() -ne ".zip" })
foreach($a in $otherArchives){
  $r = "" | Select-Object archive, extension, status, output_dir, note
  $r.archive = $a.FullName; $r.extension = $a.Extension.ToLowerInvariant(); $r.output_dir = ""
  $r.status = "SKIPPED_NEEDS_7ZIP_OR_TAR_OR_LOCKED"; $r.note = "Not extracted by R3 minimal. No bypass attempted."
  $archiveRows += $r
}
$archiveRows | Export-Csv -LiteralPath $ArchiveCsv -NoTypeInformation -Encoding UTF8

Log "Inventory source and extracted files" "STEP" Cyan
$all = @()
foreach($root in @($AsciiSourceRoot,$ExtractedDir)){
  if(Test-Path -LiteralPath $root){ $all += @(Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue) }
}
$all = @($all | Sort-Object FullName -Unique)
$inv=@(); $cand=@(); $kbd=@(); $skip=@(); $lic=@(); $idx=0

foreach($f in $all){
  $ext = $f.Extension.ToLowerInvariant()
  $sha = Hash $f.FullName
  if($AudioExt -contains $ext){ $class="AUDIO_CANDIDATE"; $handling="COPY_TO_CANDIDATE_SAMPLES" }
  elseif($KeyboardExt -contains $ext){ $class="KEYBOARD_DEVICE_METADATA"; $handling="METADATA_ONLY_NOT_COPIED" }
  elseif($ArchiveExt -contains $ext){ $class="ARCHIVE_SOURCE"; $handling="ARCHIVE_REPORTED" }
  else { $class="UNSUPPORTED_OR_DOCUMENT"; $handling="METADATA_ONLY" }

  $o = "" | Select-Object file_name, full_path, relative_path, extension, bytes, sha256, classification, handling
  $o.file_name=$f.Name; $o.full_path=$f.FullName; $o.relative_path=Rel $AsciiSourceRoot $f.FullName; $o.extension=$ext; $o.bytes=[int64]$f.Length; $o.sha256=$sha; $o.classification=$class; $o.handling=$handling
  $inv += $o

  if($class -eq "AUDIO_CANDIDATE"){
    $idx++
    $dest = Join-Path $CandidateDir ("CAND_"+$idx.ToString("00000")+"_"+(Safe $f.Name))
    Copy-Item -LiteralPath $f.FullName -Destination $dest -Force
    $c = "" | Select-Object candidate_id, original_name, source_path, source_sha256, candidate_file, bytes, license_status, commercial_use_status, note
    $c.candidate_id="CAND_"+$idx.ToString("00000"); $c.original_name=$f.Name; $c.source_path=$f.FullName; $c.source_sha256=$sha; $c.candidate_file=$dest; $c.bytes=[int64]$f.Length
    $c.license_status="USER_CLAIMED_OPEN_UNVERIFIED"; $c.commercial_use_status="NEEDS_LICENSE_REVIEW_BEFORE_SALE"; $c.note="Verify sample/loop/full song and license before product use."
    $cand += $c
    $l = "" | Select-Object candidate_id, file_name, source_path, license_status, commercial_use_status, required_action
    $l.candidate_id=$c.candidate_id; $l.file_name=$f.Name; $l.source_path=$f.FullName; $l.license_status=$c.license_status; $l.commercial_use_status=$c.commercial_use_status; $l.required_action="Verify license/origin before selling."
    $lic += $l
  }elseif($class -eq "KEYBOARD_DEVICE_METADATA"){
    $kbd += $o
  }elseif($class -eq "UNSUPPORTED_OR_DOCUMENT"){
    $skip += $o
  }
}
$inv | Export-Csv -LiteralPath $InventoryCsv -NoTypeInformation -Encoding UTF8
$cand | Export-Csv -LiteralPath $CandidateCsv -NoTypeInformation -Encoding UTF8
$kbd | Export-Csv -LiteralPath $KeyboardCsv -NoTypeInformation -Encoding UTF8
$skip | Export-Csv -LiteralPath $SkippedCsv -NoTypeInformation -Encoding UTF8
$lic | Export-Csv -LiteralPath $LicenseCsv -NoTypeInformation -Encoding UTF8
@("# UAOS V1717 Commercial Use Policy","","- No cracking or password bypass.","- Locked/protected files are skipped only.","- No selling before license/origin review.","- Device formats are metadata/parser candidates only.","- No deploy/payment in this phase.") | Set-Content -LiteralPath $PolicyMd -Encoding UTF8

$ok=@($archiveRows | Where-Object { $_.status -eq "EXTRACTED_OPEN_OR_UNPROTECTED" }).Count
$fail=@($archiveRows | Where-Object { $_.status -ne "EXTRACTED_OPEN_OR_UNPROTECTED" }).Count
$audio=@($cand).Count
$key=@($kbd).Count
$status = if($audio -gt 0 -or $key -gt 0){ $ReadyStatus } else { $NoDataStatus }

$html = @(
"<!doctype html><html><head><meta charset='utf-8'><title>UAOS V1717 Intake R3</title><style>body{font-family:Segoe UI,Arial;background:#07101d;color:#eef5ff;padding:28px}.card{background:#101d32;border:1px solid #263a59;border-radius:14px;padding:16px;margin:10px 0}.btn{display:inline-block;background:#173456;color:white;padding:10px;margin:4px;border-radius:10px;text-decoration:none}.num{font-size:28px;font-weight:800}.path{font-family:Consolas,monospace;word-break:break-all;color:#cfe5ff}</style></head><body>",
"<h1>UAOS V1717 Intake Repair Continue R3</h1>",
"<div class='card'><b>Status:</b> "+(ConvertTo-UaosHtmlSafe $status)+"</div>",
"<div class='card'><b>Original:</b><div class='path'>"+(ConvertTo-UaosHtmlSafe $OriginalSourceRoot)+"</div><b>ASCII:</b><div class='path'>"+(ConvertTo-UaosHtmlSafe $AsciiSourceRoot)+"</div></div>",
"<div class='card'><div>Files scanned</div><div class='num'>$(@($all).Count)</div><div>Archives extracted</div><div class='num'>$ok</div><div>Archives skipped/failed</div><div class='num'>$fail</div><div>Audio candidates</div><div class='num'>$audio</div><div>Keyboard metadata</div><div class='num'>$key</div></div>",
"<div class='card'><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $CandidateDir))+"'>Candidate Samples</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $InventoryCsv))+"'>Inventory</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $ArchiveCsv))+"'>Archive Report</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $LicenseCsv))+"'>License Ledger</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $ValidationJson))+"'>Validation</a></div>",
"<div class='card'>Commercial use requires license review. No password bypass. No keyboard binary output.</div></body></html>"
)
$html | Set-Content -LiteralPath $PortalHtml -Encoding UTF8

$v = "" | Select-Object phase, revision, status, original_source_root, ascii_source_root, total_files_scanned, archives_extracted, archives_failed_or_skipped, candidate_audio_count, keyboard_metadata_count, license_status, commercial_use_status, no_password_bypass, no_protected_files_opened, no_keyboard_binary_output, portal, inventory_csv, candidate_samples_csv, keyboard_metadata_csv, archive_report_csv, license_ledger_csv, package, package_sha256
$v.phase="UAOS V1717"; $v.revision=$Revision; $v.status=$status; $v.original_source_root=$OriginalSourceRoot; $v.ascii_source_root=$AsciiSourceRoot
$v.total_files_scanned=@($all).Count; $v.archives_extracted=$ok; $v.archives_failed_or_skipped=$fail; $v.candidate_audio_count=$audio; $v.keyboard_metadata_count=$key
$v.license_status="USER_CLAIMED_OPEN_UNVERIFIED"; $v.commercial_use_status="NEEDS_LICENSE_REVIEW_BEFORE_SALE"; $v.no_password_bypass=$true; $v.no_protected_files_opened=$true; $v.no_keyboard_binary_output=$true
$v.portal=$PortalHtml; $v.inventory_csv=$InventoryCsv; $v.candidate_samples_csv=$CandidateCsv; $v.keyboard_metadata_csv=$KeyboardCsv; $v.archive_report_csv=$ArchiveCsv; $v.license_ledger_csv=$LicenseCsv; $v.package=$ZipPath; $v.package_sha256=""
J $v | Set-Content -LiteralPath $ValidationJson -Encoding UTF8

@("# UAOS V1717 Intake Repair Continue R3 Report","","Status: $status","Original source: $OriginalSourceRoot","ASCII source: $AsciiSourceRoot","Files scanned: "+@($all).Count,"Archives extracted: $ok","Archives skipped/failed: $fail","Audio candidates: $audio","Keyboard metadata: $key","Commercial use: NEEDS_LICENSE_REVIEW_BEFORE_SALE","No password bypass: TRUE","No keyboard binary output: TRUE") | Set-Content -LiteralPath $ReportMd -Encoding UTF8
@("# UAOS V1717 Intake Repair Continue R3 Seal","","Status: $status","No password bypass: TRUE","No protected files opened: TRUE","No keyboard binary output: TRUE","Commercial use: NEEDS_LICENSE_REVIEW_BEFORE_SALE") | Set-Content -LiteralPath $SealMd -Encoding UTF8

Log "Packaging metadata only" "STEP" Cyan
$stage=Join-Path ([IO.Path]::GetTempPath()) ("v1717_repair_"+[guid]::NewGuid().ToString("N"))
Mk $stage
foreach($d in @($DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$LicenseDir)){ if(Test-Path -LiteralPath $d){ Copy-Item -LiteralPath $d -Destination (Join-Path $stage (Split-Path $d -Leaf)) -Recurse -Force } }
if(Test-Path -LiteralPath $ZipPath){ Remove-Item -LiteralPath $ZipPath -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $ZipPath -Force
Remove-Item -LiteralPath $stage -Recurse -Force
$hash=Hash $ZipPath
($hash+"  "+(Split-Path $ZipPath -Leaf)) | Set-Content -LiteralPath $ShaPath -Encoding UTF8
$v.package_sha256=$hash
J $v | Set-Content -LiteralPath $ValidationJson -Encoding UTF8

$p = "" | Select-Object current_open_library_intake, status, revision, phase_root, original_source_root, ascii_source_root, portal, validation, package, package_sha256
$p.current_open_library_intake="UAOS V1717 INTAKE_REPAIR_CONTINUE_R3"; $p.status=$status; $p.revision=$Revision; $p.phase_root=$PhaseRoot; $p.original_source_root=$OriginalSourceRoot; $p.ascii_source_root=$AsciiSourceRoot; $p.portal=$PortalHtml; $p.validation=$ValidationJson; $p.package=$ZipPath; $p.package_sha256=$hash
J $p | Set-Content -LiteralPath $PointerJson -Encoding UTF8
@("# UAOS Open Library Intake Status","","Current: UAOS V1717 INTAKE_REPAIR_CONTINUE_R3","Status: $status","Original source: $OriginalSourceRoot","ASCII source: $AsciiSourceRoot","Portal: $PortalHtml","Candidate samples: $CandidateDir","License ledger: $LicenseCsv","Package: $ZipPath","SHA256: $hash") | Set-Content -LiteralPath $StatusDoc -Encoding UTF8

Write-Host ""
Log "UAOS V1717 INTAKE REPAIR CONTINUE R3 complete" "PASS" Green
Write-Host ("Status: "+$status)
Write-Host ("Portal: "+$PortalHtml)
Write-Host ("Validation: "+$ValidationJson)
Write-Host ("Candidate samples: "+$CandidateDir)
Write-Host ("Package: "+$ZipPath)
Write-Host ("Package SHA256: "+$hash)
if(!$NoOpen){ Start-Process $PortalHtml }
if($status -ne $ReadyStatus){ exit 2 }
exit 0

