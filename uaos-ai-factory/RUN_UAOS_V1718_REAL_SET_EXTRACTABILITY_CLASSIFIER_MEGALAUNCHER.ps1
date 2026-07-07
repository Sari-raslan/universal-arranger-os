# UAOS V1718 REAL SET EXTRACTABILITY CLASSIFIER MEGALAUNCHER
# Reads V1717 keyboard metadata and classifies KMP/KSF/PCM/PCG/PRF/STY/PAD/etc.
# No cracking, no source copy, no binary keyboard output, no USB, no hardware load.

[CmdletBinding()]
param(
  [string]$RepoRoot = "E:\keyboard-manager-clean",
  [string]$V1717PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1717-open-library-intake",
  [string]$PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1718-real-set-extractability-classifier",
  [switch]$NoOpen,
  [switch]$NoGitCommit
)

$ErrorActionPreference="Stop"; $ProgressPreference="SilentlyContinue"; Set-StrictMode -Version Latest

$FactoryRoot=Join-Path $RepoRoot "uaos-ai-factory"
$ScriptName="RUN_UAOS_V1718_REAL_SET_EXTRACTABILITY_CLASSIFIER_MEGALAUNCHER.ps1"
$FactoryScriptPath=Join-Path $FactoryRoot $ScriptName
$Revision="V1718_REAL_SET_EXTRACTABILITY_CLASSIFIER"
$ReadyStatus="EXTRACTABILITY_CLASSIFIER_READY"
$NoMetaStatus="WAITING_FOR_V1717_KEYBOARD_METADATA"

$V1717KeyboardCsv=Join-Path $V1717PhaseRoot "data\UAOS_V1717_KEYBOARD_METADATA_ONLY.csv"
$V1717ArchiveCsv=Join-Path $V1717PhaseRoot "data\UAOS_V1717_ARCHIVE_REPORT.csv"

$DataDir=Join-Path $PhaseRoot "data"; $WorkspaceDir=Join-Path $PhaseRoot "workspace"; $ReportsDir=Join-Path $PhaseRoot "reports"; $ValidationDir=Join-Path $PhaseRoot "validation"; $SealDir=Join-Path $PhaseRoot "seal"; $LogsDir=Join-Path $PhaseRoot "logs"; $PackageDir=Join-Path $PhaseRoot "package"; $NextWriterDir=Join-Path $PhaseRoot "next-writer-source"; $ReviewDir=Join-Path $PhaseRoot "owner-review"
$RunLog=Join-Path $LogsDir "UAOS_V1718_EXTRACTABILITY_CLASSIFIER_RUN.log"; $PortalHtml=Join-Path $WorkspaceDir "UAOS_V1718_REAL_SET_EXTRACTABILITY_CLASSIFIER_PORTAL.html"; $ValidationJson=Join-Path $ValidationDir "UAOS_V1718_EXTRACTABILITY_VALIDATION.json"; $ReportMd=Join-Path $ReportsDir "UAOS_V1718_EXTRACTABILITY_CLASSIFIER_REPORT.md"; $SealMd=Join-Path $SealDir "UAOS_V1718_EXTRACTABILITY_CLASSIFIER_SEAL.md"; $PointerJson=Join-Path $FactoryRoot "UAOS_CURRENT_EXTRACTABILITY_CLASSIFIER.json"; $StatusDoc=Join-Path (Join-Path $RepoRoot "docs") "UAOS_EXTRACTABILITY_CLASSIFIER_STATUS.md"; $ZipPath=Join-Path $PackageDir "UAOS_V1718_EXTRACTABILITY_CLASSIFIER_METADATA_PACKAGE.zip"; $ShaPath=Join-Path $PackageDir "UAOS_V1718_EXTRACTABILITY_CLASSIFIER_METADATA_PACKAGE.sha256.txt"

$MatrixCsv=Join-Path $DataDir "UAOS_V1718_EXTRACTABILITY_MATRIX.csv"
$MatrixJson=Join-Path $DataDir "UAOS_V1718_EXTRACTABILITY_MATRIX.json"
$SampleCsv=Join-Path $NextWriterDir "UAOS_V1718_KMP_KSF_SAMPLE_CANDIDATES.csv"
$PcmCsv=Join-Path $NextWriterDir "UAOS_V1718_PCM_PARSER_CANDIDATES.csv"
$ProgramCsv=Join-Path $NextWriterDir "UAOS_V1718_PROGRAM_PERFORMANCE_METADATA_CANDIDATES.csv"
$StyleCsv=Join-Path $NextWriterDir "UAOS_V1718_STYLE_PAD_METADATA_CANDIDATES.csv"
$SetMapCsv=Join-Path $NextWriterDir "UAOS_V1718_SET_LIBRARY_MAP.csv"
$BlockedCsv=Join-Path $ReviewDir "UAOS_V1718_LOW_PRIORITY_OR_SEPARATE_REVIEW.csv"
$SummaryCsv=Join-Path $DataDir "UAOS_V1718_EXTRACTABILITY_SUMMARY.csv"
$NextPlanMd=Join-Path $NextWriterDir "UAOS_V1718_NEXT_WRITER_SOURCE_PLAN.md"
$CodeXMd=Join-Path $NextWriterDir "CODEX_V1719_NEXT_TASKS.md"

function Mk{param([string]$P) if(!(Test-Path -LiteralPath $P)){New-Item -ItemType Directory -Path $P -Force|Out-Null}}
function Log{param([string]$M,[string]$L="INFO",[ConsoleColor]$C=[ConsoleColor]::Gray) $line="[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] [$L] $M"; Write-Host $line -ForegroundColor $C; try{$line|Add-Content -LiteralPath $RunLog -Encoding UTF8}catch{}}
function J{param([object]$O) $O|ConvertTo-Json -Depth 80}
function ConvertTo-UaosHtmlSafe { param([object]$S) [System.Net.WebUtility]::HtmlEncode([string]$S) }
function U{param([string]$P) try{([System.Uri]::new((Resolve-Path -LiteralPath $P).Path)).AbsoluteUri}catch{$P}}
function Hash{param([string]$P) if(Test-Path -LiteralPath $P){(Get-FileHash -LiteralPath $P -Algorithm SHA256).Hash}else{""}}
function Prop{param([object]$O,[string[]]$Names,[object]$Default="") if($null -eq $O){return $Default}; foreach($n in $Names){foreach($p in @($O.PSObject.Properties)){if($p.Name -ieq $n){return $p.Value}}}; return $Default}
function Ext{param([object]$V) $e=([string]$V).Trim().ToLowerInvariant(); if($e -and !$e.StartsWith(".")){$e="."+$e}; return $e}
function ToInt64{param([object]$V) [int64]$n=0; [void][int64]::TryParse([string]$V,[ref]$n); return $n}

function Classify{
  param([string]$E,[string]$Path,[int64]$Bytes)
  $o=""|Select-Object group,extractability,next_action,reason,priority
  $o.group="OTHER";$o.extractability="METADATA_ONLY";$o.next_action="OWNER_REVIEW";$o.reason="Metadata only."; $o.priority=50
  switch($E){
    ".ksf"{$o.group="KSF_SAMPLE";$o.extractability="SAMPLE_FILE_CANDIDATE";$o.next_action="V1719_KMP_KSF_SAMPLE_MAP_RESEARCH";$o.reason="Best sample-file candidate."; $o.priority=100}
    ".kmp"{$o.group="KMP_MULTISAMPLE";$o.extractability="SAMPLE_STRUCTURE_CANDIDATE";$o.next_action="V1719_KMP_KSF_SAMPLE_MAP_RESEARCH";$o.reason="Multisample mapping candidate."; $o.priority=95}
    ".pcm"{$o.group="PCM_CONTAINER";$o.extractability="PARSER_CANDIDATE";$o.next_action="V1719_PCM_CONTAINER_RESEARCH";$o.reason="Likely sample container; parser/hardware validation needed."; $o.priority=90}
    ".pcg"{$o.group="PCG_PROGRAM_BANK";$o.extractability="PROGRAM_METADATA_CANDIDATE";$o.next_action="V1719_PROGRAM_METADATA_READER";$o.reason="Program bank metadata candidate."; $o.priority=80}
    ".prf"{$o.group="PRF_PERFORMANCE";$o.extractability="PERFORMANCE_METADATA_CANDIDATE";$o.next_action="V1719_PROGRAM_METADATA_READER";$o.reason="Performance metadata candidate."; $o.priority=78}
    ".sty"{$o.group="STYLE";$o.extractability="STYLE_METADATA_CANDIDATE";$o.next_action="V1719_STYLE_METADATA_READER";$o.reason="Style metadata candidate."; $o.priority=70}
    ".pad"{$o.group="PAD";$o.extractability="PAD_METADATA_CANDIDATE";$o.next_action="V1719_STYLE_METADATA_READER";$o.reason="Pad metadata candidate."; $o.priority=68}
    ".bkp"{$o.group="BACKUP_CONTAINER";$o.extractability="SEPARATE_APPROVAL_REQUIRED";$o.next_action="OWNER_SEPARATE_APPROVAL_BEFORE_PARSE";$o.reason="Backup container isolated."; $o.priority=20}
    ".gbl"{$o.group="GLOBAL_METADATA";$o.extractability="GLOBAL_METADATA_CANDIDATE";$o.next_action="LOW_PRIORITY_GLOBAL_METADATA_REVIEW";$o.reason="Global metadata."; $o.priority=45}
    ".sbd"{$o.group="DEVICE_METADATA";$o.extractability="METADATA_ONLY";$o.next_action="LOW_PRIORITY_METADATA_REVIEW";$o.reason="Device metadata."; $o.priority=40}
    ".sbl"{$o.group="DEVICE_METADATA";$o.extractability="METADATA_ONLY";$o.next_action="LOW_PRIORITY_METADATA_REVIEW";$o.reason="Device metadata."; $o.priority=40}
    ".voc"{$o.group="VOCALIZER_METADATA";$o.extractability="METADATA_ONLY";$o.next_action="LOW_PRIORITY_METADATA_REVIEW";$o.reason="Vocalizer metadata."; $o.priority=35}
    ".mxp"{$o.group="MIX_MISC_METADATA";$o.extractability="METADATA_ONLY";$o.next_action="LOW_PRIORITY_METADATA_REVIEW";$o.reason="Misc/mix metadata."; $o.priority=35}
  }
  if($Path -match "(?i)(^|[\\/])[^\\/]+\.SET([\\/]|$)" -and $o.priority -lt 60){$o.group="SET_FOLDER_CONTEXT";$o.extractability="LIBRARY_MAP_ONLY";$o.next_action="MAP_SET_STRUCTURE";$o.reason="Inside SET folder context.";$o.priority=60}
  return $o
}

foreach($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$PackageDir,$NextWriterDir,$ReviewDir,(Join-Path $RepoRoot "docs"))){Mk $d}
Log "UAOS V1718 REAL SET EXTRACTABILITY CLASSIFIER started" "STEP" Cyan
if(!(Test-Path -LiteralPath $V1717KeyboardCsv)){throw "Missing V1717 keyboard metadata CSV: $V1717KeyboardCsv"}
try{if($PSCommandPath){Copy-Item -LiteralPath $PSCommandPath -Destination $FactoryScriptPath -Force}}catch{}

$rows=@(Import-Csv -LiteralPath $V1717KeyboardCsv)
$matrix=@()
foreach($r in $rows){
  $file=[string](Prop $r @("file_name","FileName","name") "")
  $path=[string](Prop $r @("source_path","full_path","path","relative_path") "")
  $e=Ext (Prop $r @("extension","ext") "")
  if(!$e -and $file){$e=[IO.Path]::GetExtension($file).ToLowerInvariant()}
  $bytes=ToInt64 (Prop $r @("bytes","size","length") 0)
  $sha=[string](Prop $r @("sha256","hash") "")
  $c=Classify $e $path $bytes
  $m=""|Select-Object file_name,source_path,extension,bytes,sha256,group,extractability,next_action,reason,priority,can_copy_now,can_parse_now,needs_hardware_test,safety_status
  $m.file_name=$file;$m.source_path=$path;$m.extension=$e;$m.bytes=$bytes;$m.sha256=$sha;$m.group=$c.group;$m.extractability=$c.extractability;$m.next_action=$c.next_action;$m.reason=$c.reason;$m.priority=$c.priority;$m.can_copy_now=$false;$m.can_parse_now=$false;$m.needs_hardware_test=$true;$m.safety_status="NO_BINARY_OUTPUT_METADATA_ONLY"
  $matrix += $m
}
$matrix=@($matrix|Sort-Object @{Expression="priority";Descending=$true},extension,file_name)
$matrix|Export-Csv -LiteralPath $MatrixCsv -NoTypeInformation -Encoding UTF8
J $matrix|Set-Content -LiteralPath $MatrixJson -Encoding UTF8

$sample=@($matrix|Where-Object{$_.extension -in @(".kmp",".ksf")})
$pcm=@($matrix|Where-Object{$_.extension -eq ".pcm"})
$prog=@($matrix|Where-Object{$_.extension -in @(".pcg",".prf")})
$style=@($matrix|Where-Object{$_.extension -in @(".sty",".pad")})
$setmap=@($matrix|Where-Object{$_.source_path -match "(?i)(^|[\\/])[^\\/]+\.SET([\\/]|$)"})
$blocked=@($matrix|Where-Object{$_.priority -lt 50})
$sample|Export-Csv -LiteralPath $SampleCsv -NoTypeInformation -Encoding UTF8
$pcm|Export-Csv -LiteralPath $PcmCsv -NoTypeInformation -Encoding UTF8
$prog|Export-Csv -LiteralPath $ProgramCsv -NoTypeInformation -Encoding UTF8
$style|Export-Csv -LiteralPath $StyleCsv -NoTypeInformation -Encoding UTF8
$setmap|Export-Csv -LiteralPath $SetMapCsv -NoTypeInformation -Encoding UTF8
$blocked|Export-Csv -LiteralPath $BlockedCsv -NoTypeInformation -Encoding UTF8

$summary=@()
foreach($g in @($matrix|Group-Object group|Sort-Object Count -Descending)){
  $s=""|Select-Object group,count
  $s.group=$g.Name;$s.count=$g.Count;$summary+=$s
}
$summary|Export-Csv -LiteralPath $SummaryCsv -NoTypeInformation -Encoding UTF8

@("# UAOS V1718 Next Writer Source Plan","","Status: classifier only. No binary output.","","Priority order:","1. KSF/KMP sample structure candidates: "+@($sample).Count,"2. PCM parser candidates: "+@($pcm).Count,"3. PCG/PRF program metadata candidates: "+@($prog).Count,"4. STY/PAD style metadata candidates: "+@($style).Count,"5. SET folder map rows: "+@($setmap).Count,"","Next recommended phase: UAOS V1719 KMP/KSF SAMPLE MAP RESEARCH","","Rules: no cracking, no binary output, no USB, no hardware load.")|Set-Content -LiteralPath $NextPlanMd -Encoding UTF8
@("# CodeX V1719 Next Tasks","","Task 1: Build read-only KMP/KSF structure inspector.","Task 2: Build preview keymap draft only, no binary writer.","Task 3: Keep PCM/PCG/PRF/STY/PAD metadata-only until parser gates exist.","Hard gates: no cracking, no binary KORG writer, no USB, no hardware load.")|Set-Content -LiteralPath $CodeXMd -Encoding UTF8

$total=@($matrix).Count;$status=if($total -gt 0){$ReadyStatus}else{$NoMetaStatus}
$sc=@($sample).Count;$pc=@($pcm).Count;$pr=@($prog).Count;$st=@($style).Count;$sm=@($setmap).Count

$html=@("<!doctype html><html><head><meta charset='utf-8'><title>UAOS V1718 Extractability</title><style>body{font-family:Segoe UI,Arial;background:#07101d;color:#eef5ff;padding:28px}.card{background:#101d32;border:1px solid #263a59;border-radius:14px;padding:16px;margin:10px 0}.num{font-size:28px;font-weight:800}.btn{display:inline-block;background:#173456;color:white;padding:10px;margin:4px;border-radius:10px;text-decoration:none}</style></head><body>",
"<h1>UAOS V1718 Extractability Classifier</h1><div class='card'>Status: "+(ConvertTo-UaosHtmlSafe $status)+"</div>",
"<div class='card'>Total metadata rows<div class='num'>$total</div></div>",
"<div class='card'>KMP/KSF sample candidates<div class='num'>$sc</div></div>",
"<div class='card'>PCM parser candidates<div class='num'>$pc</div></div>",
"<div class='card'>PCG/PRF program metadata<div class='num'>$pr</div></div>",
"<div class='card'>STY/PAD style metadata<div class='num'>$st</div></div>",
"<div class='card'>SET folder map rows<div class='num'>$sm</div></div>",
"<div class='card'><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $MatrixCsv))+"'>Matrix</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $SampleCsv))+"'>KMP/KSF</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $PcmCsv))+"'>PCM</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $ProgramCsv))+"'>Programs</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (U $ValidationJson))+"'>Validation</a></div>",
"<div class='card'>No cracking. No binary output. Recommended next: V1719 KMP/KSF sample map research.</div></body></html>")
$html|Set-Content -LiteralPath $PortalHtml -Encoding UTF8

$v=""|Select-Object phase,revision,status,source_v1717_phase,total_metadata_rows,sample_candidate_count,pcm_parser_candidate_count,program_metadata_candidate_count,style_metadata_candidate_count,set_map_count,no_cracking,no_binary_keyboard_output,no_usb,no_hardware_load,recommended_next_phase,portal,matrix_csv,package,package_sha256
$v.phase="UAOS V1718";$v.revision=$Revision;$v.status=$status;$v.source_v1717_phase=$V1717PhaseRoot;$v.total_metadata_rows=$total;$v.sample_candidate_count=$sc;$v.pcm_parser_candidate_count=$pc;$v.program_metadata_candidate_count=$pr;$v.style_metadata_candidate_count=$st;$v.set_map_count=$sm;$v.no_cracking=$true;$v.no_binary_keyboard_output=$true;$v.no_usb=$true;$v.no_hardware_load=$true;$v.recommended_next_phase="UAOS V1719 KMP_KSF_SAMPLE_MAP_RESEARCH";$v.portal=$PortalHtml;$v.matrix_csv=$MatrixCsv;$v.package=$ZipPath;$v.package_sha256=""
J $v|Set-Content -LiteralPath $ValidationJson -Encoding UTF8

@("# UAOS V1718 Extractability Classifier Report","","Status: $status","Total metadata rows: $total","KMP/KSF sample candidates: $sc","PCM parser candidates: $pc","PCG/PRF program metadata candidates: $pr","STY/PAD style metadata candidates: $st","SET folder map rows: $sm","","Safety: no cracking, no binary output, no USB, no hardware load.","Recommended next: UAOS V1719 KMP/KSF SAMPLE MAP RESEARCH")|Set-Content -LiteralPath $ReportMd -Encoding UTF8
@("# UAOS V1718 Extractability Classifier Seal","","Status: $status","Total metadata rows: $total","Sample candidates KMP/KSF: $sc","PCM parser candidates: $pc","No binary output: TRUE","No cracking: TRUE")|Set-Content -LiteralPath $SealMd -Encoding UTF8

Log "Packaging V1718 metadata only" "STEP" Cyan
$stage=Join-Path ([IO.Path]::GetTempPath()) ("v1718_"+[guid]::NewGuid().ToString("N"));Mk $stage
foreach($d in @($DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$NextWriterDir,$ReviewDir)){if(Test-Path -LiteralPath $d){Copy-Item -LiteralPath $d -Destination (Join-Path $stage (Split-Path $d -Leaf)) -Recurse -Force}}
if(Test-Path -LiteralPath $ZipPath){Remove-Item -LiteralPath $ZipPath -Force}
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $ZipPath -Force
Remove-Item -LiteralPath $stage -Recurse -Force
$hash=Hash $ZipPath;($hash+"  "+(Split-Path $ZipPath -Leaf))|Set-Content -LiteralPath $ShaPath -Encoding UTF8
$v.package_sha256=$hash;J $v|Set-Content -LiteralPath $ValidationJson -Encoding UTF8

$p=""|Select-Object current_extractability_classifier,status,revision,phase_root,portal,validation,matrix_csv,recommended_next_phase,package,package_sha256
$p.current_extractability_classifier="UAOS V1718 REAL_SET_EXTRACTABILITY_CLASSIFIER";$p.status=$status;$p.revision=$Revision;$p.phase_root=$PhaseRoot;$p.portal=$PortalHtml;$p.validation=$ValidationJson;$p.matrix_csv=$MatrixCsv;$p.recommended_next_phase="UAOS V1719 KMP_KSF_SAMPLE_MAP_RESEARCH";$p.package=$ZipPath;$p.package_sha256=$hash
J $p|Set-Content -LiteralPath $PointerJson -Encoding UTF8
@("# UAOS Extractability Classifier Status","","Current: UAOS V1718 REAL_SET_EXTRACTABILITY_CLASSIFIER","Status: $status","Portal: $PortalHtml","Matrix: $MatrixCsv","Recommended next: UAOS V1719 KMP/KSF sample map research","Package: $ZipPath","SHA256: $hash")|Set-Content -LiteralPath $StatusDoc -Encoding UTF8

Log "Local git commit only" "STEP" Cyan
$GitStatus="SKIPPED_BY_FLAG";$GitHash=""
if(!$NoGitCommit){
 try{
  if((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))){
   Push-Location $RepoRoot
   try{
    git add -f -- "uaos-ai-factory/$ScriptName" "uaos-ai-factory/uaos-v1718-real-set-extractability-classifier" "uaos-ai-factory/UAOS_CURRENT_EXTRACTABILITY_CLASSIFIER.json" "docs/UAOS_EXTRACTABILITY_CLASSIFIER_STATUS.md"|Out-Null
    $st=((git status --porcelain)|Out-String)
    if([string]::IsNullOrWhiteSpace($st)){$GitStatus="NO_CHANGES"}else{git commit -m "UAOS V1718 real set extractability classifier"|Out-Null;if($LASTEXITCODE -eq 0){$GitHash=(git rev-parse --short HEAD).Trim();$GitStatus="COMMITTED"}else{$GitStatus="COMMIT_FAILED"}}
   }finally{Pop-Location}
  }
 }catch{$GitStatus="COMMIT_FAILED: "+$_.Exception.Message;Log $GitStatus "WARN" Yellow}
}

Write-Host "";Log "UAOS V1718 REAL SET EXTRACTABILITY CLASSIFIER complete" "PASS" Green
Write-Host ("Status: "+$status);Write-Host ("Portal: "+$PortalHtml);Write-Host ("Matrix: "+$MatrixCsv);Write-Host ("Sample candidates: "+$SampleCsv);Write-Host ("Validation: "+$ValidationJson);Write-Host ("Package: "+$ZipPath);Write-Host ("Package SHA256: "+$hash);Write-Host ("Git: "+$GitStatus);if($GitHash){Write-Host ("Git hash: "+$GitHash)}
if(!$NoOpen){Start-Process $PortalHtml}
if($status -ne $ReadyStatus){exit 2}
exit 0

