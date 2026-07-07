# UAOS V1720 R2 ULTRA FAST READONLY KMP STRUCTURE INSPECTOR
# Safe replacement for slow V1720 R1.
# Reads only small header/text windows from KMP files. No cracking. No binary output. No USB/hardware.

[CmdletBinding()]
param(
  [string]$RepoRoot = "E:\keyboard-manager-clean",
  [string]$V1719PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1719-kmp-ksf-sample-map-research",
  [string]$V1718PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1718-real-set-extractability-classifier",
  [string]$PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1720-readonly-kmp-structure-inspector",
  [int]$MaxReadBytesPerFile = 65536,
  [switch]$NoOpen,
  [switch]$NoGitCommit
)

$ErrorActionPreference="Stop"
$ProgressPreference="SilentlyContinue"
Set-StrictMode -Version Latest

$FactoryRoot=Join-Path $RepoRoot "uaos-ai-factory"
$ScriptName="RUN_UAOS_V1720_READONLY_KMP_STRUCTURE_INSPECTOR_R2_ULTRAFAST.ps1"
$FactoryScriptPath=Join-Path $FactoryRoot $ScriptName
$Revision="V1720_R2_ULTRAFAST_READONLY_KMP_STRUCTURE_INSPECTOR"
$ReadyStatus="KMP_STRUCTURE_INSPECTOR_READY"
$NoKmpStatus="WAITING_FOR_V1719_KMP_ROWS"

$V1719ResearchCsv=Join-Path $V1719PhaseRoot "sample-map-research\UAOS_V1719_KMP_KSF_CANDIDATE_RESEARCH.csv"
$V1718PcmCsv=Join-Path $V1718PhaseRoot "next-writer-source\UAOS_V1718_PCM_PARSER_CANDIDATES.csv"

$DataDir=Join-Path $PhaseRoot "data"
$WorkspaceDir=Join-Path $PhaseRoot "workspace"
$ReportsDir=Join-Path $PhaseRoot "reports"
$ValidationDir=Join-Path $PhaseRoot "validation"
$SealDir=Join-Path $PhaseRoot "seal"
$LogsDir=Join-Path $PhaseRoot "logs"
$PackageDir=Join-Path $PhaseRoot "package"
$InspectorDir=Join-Path $PhaseRoot "kmp-structure-inspector"
$NextWriterDir=Join-Path $PhaseRoot "next-writer-source"
$OwnerReviewDir=Join-Path $PhaseRoot "owner-review"

$RunLog=Join-Path $LogsDir "UAOS_V1720_R2_ULTRAFAST_RUN.log"
$PortalHtml=Join-Path $WorkspaceDir "UAOS_V1720_READONLY_KMP_STRUCTURE_INSPECTOR_PORTAL.html"
$ValidationJson=Join-Path $ValidationDir "UAOS_V1720_KMP_STRUCTURE_INSPECTOR_VALIDATION.json"
$ReportMd=Join-Path $ReportsDir "UAOS_V1720_KMP_STRUCTURE_INSPECTOR_REPORT.md"
$SealMd=Join-Path $SealDir "UAOS_V1720_KMP_STRUCTURE_INSPECTOR_SEAL.md"
$PointerJson=Join-Path $FactoryRoot "UAOS_CURRENT_KMP_STRUCTURE_INSPECTOR.json"
$StatusDoc=Join-Path (Join-Path $RepoRoot "docs") "UAOS_KMP_STRUCTURE_INSPECTOR_STATUS.md"

$KmpStructureCsv=Join-Path $InspectorDir "UAOS_V1720_KMP_STRUCTURE_MARKERS.csv"
$KmpStringsCsv=Join-Path $InspectorDir "UAOS_V1720_KMP_READABLE_STRINGS.csv"
$SampleRefsCsv=Join-Path $InspectorDir "UAOS_V1720_KMP_SAMPLE_REFERENCE_TABLE.csv"
$PcmLinkHintsCsv=Join-Path $InspectorDir "UAOS_V1720_KMP_PCM_LINK_HINTS.csv"
$NextSourceCsv=Join-Path $NextWriterDir "UAOS_V1720_NEXT_WRITER_SOURCE_HINTS.csv"
$OwnerReviewCsv=Join-Path $OwnerReviewDir "UAOS_V1720_OWNER_REVIEW_KMP_PCM_HINTS.csv"
$InspectorJson=Join-Path $DataDir "UAOS_V1720_KMP_STRUCTURE_INSPECTOR.json"
$CodeXTasksMd=Join-Path $NextWriterDir "CODEX_V1721_NEXT_TASKS.md"
$ZipPath=Join-Path $PackageDir "UAOS_V1720_KMP_STRUCTURE_INSPECTOR_PACKAGE.zip"
$ShaPath=Join-Path $PackageDir "UAOS_V1720_KMP_STRUCTURE_INSPECTOR_PACKAGE.sha256.txt"

function New-UaosDir{param([string]$Path) if(!(Test-Path -LiteralPath $Path)){New-Item -ItemType Directory -Path $Path -Force|Out-Null}}
function Write-UaosLog{param([string]$Msg,[string]$Lvl="INFO",[ConsoleColor]$Color=[ConsoleColor]::Gray) $line="[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] [$Lvl] $Msg"; Write-Host $line -ForegroundColor $Color; try{$line|Add-Content -LiteralPath $RunLog -Encoding UTF8}catch{}}
function ConvertTo-UaosJson{param([object]$Value) $Value|ConvertTo-Json -Depth 80}
function ConvertTo-UaosHtmlSafe{param([object]$Value) [System.Net.WebUtility]::HtmlEncode([string]$Value)}
function Get-UaosUri{param([string]$Path) try{([System.Uri]::new((Resolve-Path -LiteralPath $Path).Path)).AbsoluteUri}catch{$Path}}
function Get-UaosSha{param([string]$Path) if(Test-Path -LiteralPath $Path){(Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash}else{""}}
function Get-UaosProp{param([object]$Obj,[string[]]$Names,[object]$Default="") if($null -eq $Obj){return $Default}; foreach($n in $Names){foreach($p in @($Obj.PSObject.Properties)){if($p.Name -ieq $n){return $p.Value}}}; return $Default}
function Get-UaosExt{param([object]$Value) $e=([string]$Value).Trim().ToLowerInvariant(); if($e -and !$e.StartsWith(".")){$e="."+$e}; return $e}
function Get-UaosSet{param([string]$Path) $m=[regex]::Match([string]$Path,"(?i)([^\\/]+\.SET)([\\/]|$)"); if($m.Success){$m.Groups[1].Value}else{""}}
function Get-UaosDir{param([string]$Path) try{(Split-Path -Parent $Path).ToLowerInvariant()}catch{""}}
function Get-UaosBase{param([string]$Path) try{[IO.Path]::GetFileNameWithoutExtension($Path).ToLowerInvariant()}catch{([string]$Path).ToLowerInvariant()}}
function Get-UaosTokens{param([string]$Text) @((Get-UaosBase $Text) -split "[^a-zA-Z0-9]+") | Where-Object {$_.Length -ge 3} | Select-Object -Unique}
function Read-UaosBytesSmall{
  param([string]$Path,[int]$MaxBytes)
  if(!(Test-Path -LiteralPath $Path)){return ,([byte[]]@())}
  $fs=$null
  try{
    $fs=[IO.File]::Open($Path,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::ReadWrite)
    $n=[Math]::Min([int64]$MaxBytes,$fs.Length)
    if($n -le 0){return ,([byte[]]@())}
    $buf=New-Object byte[] ([int]$n)
    [void]$fs.Read($buf,0,[int]$n)
    return ,$buf
  }finally{if($fs){$fs.Dispose()}}
}
function Get-AsciiText{
  param([byte[]]$Bytes)
  if($Bytes.Length -eq 0){return ""}
  return [Text.Encoding]::GetEncoding(28591).GetString($Bytes)
}
function Get-HexPreview{
  param([byte[]]$Bytes,[int]$Count=64)
  if($Bytes.Length -eq 0){return ""}
  $n=[Math]::Min($Count,$Bytes.Length)
  return (($Bytes[0..($n-1)]|ForEach-Object{$_.ToString("X2")}) -join " ")
}
function Get-ReadableStringsFast{
  param([string]$Text,[int]$MaxRows=80)
  $rows=@()
  $matches=[regex]::Matches($Text,"[ -~]{4,96}")
  $i=0
  foreach($m in $matches){
    $i++
    $o=""|Select-Object offset,text
    $o.offset=$m.Index
    $o.text=$m.Value
    $rows += $o
    if($i -ge $MaxRows){break}
  }
  return @($rows)
}
function Get-LinkScore{
  param([object]$Kmp,[object]$Pcm)
  $score=0;$reasons=@()
  $pPath=[string](Get-UaosProp $Pcm @("source_path","full_path","path","relative_path") "")
  $pName=[string](Get-UaosProp $Pcm @("file_name","FileName","name") "")
  if($Kmp.directory_key -and ((Get-UaosDir $pPath) -eq $Kmp.directory_key)){$score+=80;$reasons+="same_directory"}
  if($Kmp.set_context -and ((Get-UaosSet $pPath) -eq $Kmp.set_context)){$score+=50;$reasons+="same_set_context"}
  $kt=Get-UaosTokens $Kmp.file_name
  $pt=Get-UaosTokens $pName
  $over=@($kt|Where-Object{$pt -contains $_})
  if(@($over).Count -gt 0){$score += [Math]::Min(40,@($over).Count*10);$reasons += ("name_overlap:"+((@($over)|Select-Object -First 5) -join "|"))}
  $o=""|Select-Object score,reason
  $o.score=$score
  $o.reason=if(@($reasons).Count){$reasons -join ";"}else{"no_hint"}
  return $o
}

foreach($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$PackageDir,$InspectorDir,$NextWriterDir,$OwnerReviewDir,(Join-Path $RepoRoot "docs"))){New-UaosDir $d}

Write-UaosLog "UAOS V1720 R2 ULTRAFAST started" "STEP" Cyan
if(!(Test-Path -LiteralPath $V1719ResearchCsv)){throw "Missing V1719 candidate research CSV: $V1719ResearchCsv"}
try{if($PSCommandPath){Copy-Item -LiteralPath $PSCommandPath -Destination $FactoryScriptPath -Force}}catch{}

$researchRows=@(Import-Csv -LiteralPath $V1719ResearchCsv)
$kmpRows=@($researchRows|Where-Object{(Get-UaosExt (Get-UaosProp $_ @("extension","ext") "")) -eq ".kmp"})
$pcmRows=@()
if(Test-Path -LiteralPath $V1718PcmCsv){$pcmRows=@(Import-Csv -LiteralPath $V1718PcmCsv)}
Write-UaosLog ("KMP rows: "+@($kmpRows).Count)
Write-UaosLog ("PCM rows available for hints: "+@($pcmRows).Count)

$structure=@();$stringsOut=@();$refs=@();$pcmHints=@();$next=@();$review=@()
$idx=0
foreach($k in $kmpRows){
  $idx++
  $file=[string](Get-UaosProp $k @("file_name","FileName","name") "")
  $path=[string](Get-UaosProp $k @("source_path","full_path","path","relative_path") "")
  $exists=Test-Path -LiteralPath $path
  $sha=[string](Get-UaosProp $k @("sha256","hash") "")
  $bytes=0
  if($exists){
    $fi=Get-Item -LiteralPath $path
    $bytes=[int64]$fi.Length
    if([string]::IsNullOrWhiteSpace($sha)){$sha=Get-UaosSha $path}
  }
  $buf=Read-UaosBytesSmall -Path $path -MaxBytes $MaxReadBytesPerFile
  $text=Get-AsciiText -Bytes $buf
  $strings=Get-ReadableStringsFast -Text $text -MaxRows 80
  $possible=@($strings|Where-Object{$_.text -match "(?i)(\.ksf|\.pcm|\.wav|\.aif|sample|loop|root|key|multi|smp|msp)"})
  $set=Get-UaosSet $path
  $dir=Get-UaosDir $path

  $kmpCount=([regex]::Matches($text,"(?i)KMP")).Count
  $ksfCount=([regex]::Matches($text,"(?i)KSF")).Count
  $pcmCount=([regex]::Matches($text,"(?i)PCM")).Count
  $sampleCount=([regex]::Matches($text,"(?i)sample|smp|msp")).Count
  $loopCount=([regex]::Matches($text,"(?i)loop")).Count
  $confidence=if(@($possible).Count -gt 0 -or $ksfCount -gt 0 -or $pcmCount -gt 0){"MEDIUM_READABLE_HINTS"}elseif(@($strings).Count -gt 0){"LOW_MEDIUM_STRINGS"}else{"LOW"}

  $sr=""|Select-Object kmp_id,file_name,source_path,bytes,sha256,file_exists,read_bytes,set_context,directory_key,first64_hex,ascii_string_count,possible_reference_count,kmp_marker_count,ksf_marker_count,pcm_marker_count,sample_word_count,loop_word_count,structure_confidence,safety_status
  $sr.kmp_id="V1720_KMP_"+$idx.ToString("000")
  $sr.file_name=$file;$sr.source_path=$path;$sr.bytes=$bytes;$sr.sha256=$sha;$sr.file_exists=$exists;$sr.read_bytes=@($buf).Count;$sr.set_context=$set;$sr.directory_key=$dir;$sr.first64_hex=Get-HexPreview -Bytes $buf -Count 64
  $sr.ascii_string_count=@($strings).Count;$sr.possible_reference_count=@($possible).Count;$sr.kmp_marker_count=$kmpCount;$sr.ksf_marker_count=$ksfCount;$sr.pcm_marker_count=$pcmCount;$sr.sample_word_count=$sampleCount;$sr.loop_word_count=$loopCount;$sr.structure_confidence=$confidence;$sr.safety_status="READ_ONLY_MARKERS_ONLY_NO_BINARY_OUTPUT"
  $structure += $sr

  foreach($s in $strings){
    $row=""|Select-Object kmp_id,file_name,offset,text
    $row.kmp_id=$sr.kmp_id;$row.file_name=$file;$row.offset=$s.offset;$row.text=$s.text
    $stringsOut += $row
  }

  $ri=0
  foreach($r in @($possible|Select-Object -First 50)){
    $ri++
    $type="READABLE_TEXT_HINT"
    if($r.text -match "(?i)\.ksf"){$type="POSSIBLE_KSF_REFERENCE"}
    elseif($r.text -match "(?i)\.pcm"){$type="POSSIBLE_PCM_REFERENCE"}
    elseif($r.text -match "(?i)\.(wav|aif|aiff)"){$type="POSSIBLE_AUDIO_REFERENCE"}
    elseif($r.text -match "(?i)loop"){$type="POSSIBLE_LOOP_METADATA"}
    elseif($r.text -match "(?i)root|key"){$type="POSSIBLE_KEY_METADATA"}
    $rr=""|Select-Object reference_id,kmp_id,file_name,offset,reference_type,reference_text,confidence,required_next_action
    $rr.reference_id=$sr.kmp_id+"_REF_"+$ri.ToString("000");$rr.kmp_id=$sr.kmp_id;$rr.file_name=$file;$rr.offset=$r.offset;$rr.reference_type=$type;$rr.reference_text=$r.text;$rr.confidence="TEXT_HINT_ONLY";$rr.required_next_action="CONFIRM_WITH_FORMAT_READER_OR_HARDWARE_TEST"
    $refs += $rr
  }

  $localHints=@()
  foreach($pcm in $pcmRows){
    $link=Get-LinkScore -Kmp $sr -Pcm $pcm
    if($link.score -ge 50){
      $ph=""|Select-Object hint_id,kmp_id,kmp_file,pcm_file,pcm_name,score,reason,confidence,required_next_action
      $ph.hint_id=$sr.kmp_id+"_PCM_"+(@($localHints).Count+1).ToString("000")
      $ph.kmp_id=$sr.kmp_id;$ph.kmp_file=$path;$ph.pcm_file=[string](Get-UaosProp $pcm @("source_path","full_path","path","relative_path") "");$ph.pcm_name=[string](Get-UaosProp $pcm @("file_name","FileName","name") "");$ph.score=$link.score;$ph.reason=$link.reason;$ph.confidence=if($link.score -ge 100){"MEDIUM_HIGH_HINT"}else{"MEDIUM_HINT"};$ph.required_next_action="V1721_READONLY_KMP_PCM_RELATION_REVIEW"
      $localHints += $ph
    }
  }
  $pcmHints += @($localHints|Sort-Object score -Descending|Select-Object -First 8)

  $ns=""|Select-Object writer_hint_id,kmp_id,file_name,source_path,sha256,structure_confidence,possible_reference_count,top_next_action,blocked_until,safety_status
  $ns.writer_hint_id="V1720_WRITER_HINT_"+$idx.ToString("000");$ns.kmp_id=$sr.kmp_id;$ns.file_name=$file;$ns.source_path=$path;$ns.sha256=$sha;$ns.structure_confidence=$confidence;$ns.possible_reference_count=@($possible).Count;$ns.top_next_action="V1721_READONLY_KMP_PCM_RELATION_REVIEW";$ns.blocked_until="FORMAT_READER_LICENSE_AND_HARDWARE_VALIDATION";$ns.safety_status="NO_WRITER_OUTPUT"
  $next += $ns

  $or=""|Select-Object owner_review_id,kmp_id,file_name,source_path,question,required_decision
  $or.owner_review_id="V1720_REVIEW_"+$idx.ToString("000");$or.kmp_id=$sr.kmp_id;$or.file_name=$file;$or.source_path=$path;$or.question="Confirm whether this KMP may continue to PCM relation review.";$or.required_decision="KEEP_FOR_V1721 / REMOVE / LICENSE_UNKNOWN"
  $review += $or

  Write-UaosLog ("Processed KMP "+$idx+"/"+@($kmpRows).Count+": "+$file)
}

$structure|Export-Csv -LiteralPath $KmpStructureCsv -NoTypeInformation -Encoding UTF8
$stringsOut|Export-Csv -LiteralPath $KmpStringsCsv -NoTypeInformation -Encoding UTF8
$refs|Export-Csv -LiteralPath $SampleRefsCsv -NoTypeInformation -Encoding UTF8
$pcmHints|Export-Csv -LiteralPath $PcmLinkHintsCsv -NoTypeInformation -Encoding UTF8
$next|Export-Csv -LiteralPath $NextSourceCsv -NoTypeInformation -Encoding UTF8
$review|Export-Csv -LiteralPath $OwnerReviewCsv -NoTypeInformation -Encoding UTF8

$totalKmp=@($kmpRows).Count
$existing=@($structure|Where-Object{$_.file_exists -eq $true}).Count
$readable=@($structure|Where-Object{$_.ascii_string_count -gt 0}).Count
$withRefs=@($structure|Where-Object{$_.possible_reference_count -gt 0}).Count
$stringRows=@($stringsOut).Count
$refRows=@($refs).Count
$hintRows=@($pcmHints).Count
$status=if($totalKmp -gt 0){$ReadyStatus}else{$NoKmpStatus}

$payload=""|Select-Object revision,created_at,status,total_kmp,existing_kmp,readable_kmp,kmp_with_possible_refs,string_rows,sample_reference_rows,pcm_link_hint_rows,structure_csv,strings_csv,sample_refs_csv,pcm_hints_csv,next_writer_source_csv
$payload.revision=$Revision;$payload.created_at=(Get-Date).ToString("s");$payload.status=$status;$payload.total_kmp=$totalKmp;$payload.existing_kmp=$existing;$payload.readable_kmp=$readable;$payload.kmp_with_possible_refs=$withRefs;$payload.string_rows=$stringRows;$payload.sample_reference_rows=$refRows;$payload.pcm_link_hint_rows=$hintRows;$payload.structure_csv=$KmpStructureCsv;$payload.strings_csv=$KmpStringsCsv;$payload.sample_refs_csv=$SampleRefsCsv;$payload.pcm_hints_csv=$PcmLinkHintsCsv;$payload.next_writer_source_csv=$NextSourceCsv
ConvertTo-UaosJson $payload|Set-Content -LiteralPath $InspectorJson -Encoding UTF8

@("# CodeX V1721 Next Tasks","","Task 1: Review V1720 PCM link hints.","Task 2: Build read-only PCM relation review.","Task 3: No decode of protected content; no keyboard binary output.","Hard gates: no cracking, no USB, no hardware load, no PA3X-ready claim.")|Set-Content -LiteralPath $CodeXTasksMd -Encoding UTF8

$html=@("<!doctype html><html><head><meta charset='utf-8'><title>UAOS V1720 KMP Structure Inspector</title><style>body{font-family:Segoe UI,Arial;background:#07101d;color:#eef5ff;padding:28px}.card{background:#101d32;border:1px solid #263a59;border-radius:14px;padding:16px;margin:10px 0}.num{font-size:28px;font-weight:800}.btn{display:inline-block;background:#173456;color:white;padding:10px;margin:4px;border-radius:10px;text-decoration:none}.ok{background:#12351f;border:1px solid #32a062;padding:8px 12px;border-radius:999px;display:inline-block}</style></head><body>",
"<h1>UAOS V1720 Readonly KMP Structure Inspector R2</h1><div class='ok'>Status: "+(ConvertTo-UaosHtmlSafe $status)+"</div>",
"<div class='card'>KMP files<div class='num'>$totalKmp</div></div><div class='card'>Existing KMP files<div class='num'>$existing</div></div><div class='card'>Readable KMP files<div class='num'>$readable</div></div><div class='card'>KMP with possible refs<div class='num'>$withRefs</div></div><div class='card'>Readable string rows<div class='num'>$stringRows</div></div><div class='card'>Sample/reference rows<div class='num'>$refRows</div></div><div class='card'>PCM link hints<div class='num'>$hintRows</div></div>",
"<div class='card'><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $KmpStructureCsv))+"'>KMP Structure</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $KmpStringsCsv))+"'>Readable Strings</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $SampleRefsCsv))+"'>Sample References</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $PcmLinkHintsCsv))+"'>PCM Link Hints</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $ValidationJson))+"'>Validation</a></div>",
"<div class='card'>Readonly markers only. No cracking. No binary output. No USB. No hardware load.</div></body></html>")
$html|Set-Content -LiteralPath $PortalHtml -Encoding UTF8

$v=""|Select-Object phase,revision,status,total_kmp,existing_kmp,readable_kmp,kmp_with_possible_refs,string_rows,sample_reference_rows,pcm_link_hint_rows,no_cracking,no_binary_keyboard_output,no_usb,no_hardware_load,commercial_status,recommended_next_phase,portal,kmp_structure_csv,kmp_strings_csv,sample_refs_csv,pcm_link_hints_csv,next_writer_source_csv,package,package_sha256
$v.phase="UAOS V1720";$v.revision=$Revision;$v.status=$status;$v.total_kmp=$totalKmp;$v.existing_kmp=$existing;$v.readable_kmp=$readable;$v.kmp_with_possible_refs=$withRefs;$v.string_rows=$stringRows;$v.sample_reference_rows=$refRows;$v.pcm_link_hint_rows=$hintRows;$v.no_cracking=$true;$v.no_binary_keyboard_output=$true;$v.no_usb=$true;$v.no_hardware_load=$true;$v.commercial_status="NEEDS_LICENSE_REVIEW_BEFORE_SALE";$v.recommended_next_phase="UAOS V1721 READONLY_KMP_PCM_RELATION_REVIEW";$v.portal=$PortalHtml;$v.kmp_structure_csv=$KmpStructureCsv;$v.kmp_strings_csv=$KmpStringsCsv;$v.sample_refs_csv=$SampleRefsCsv;$v.pcm_link_hints_csv=$PcmLinkHintsCsv;$v.next_writer_source_csv=$NextSourceCsv;$v.package=$ZipPath;$v.package_sha256=""
ConvertTo-UaosJson $v|Set-Content -LiteralPath $ValidationJson -Encoding UTF8

@("# UAOS V1720 Readonly KMP Structure Inspector Report","","Status: $status","KMP files: $totalKmp","Existing KMP files: $existing","Readable KMP files: $readable","KMP with possible refs: $withRefs","Readable string rows: $stringRows","Sample/reference rows: $refRows","PCM link hints: $hintRows","","Safety: no cracking, no binary output, no USB, no hardware load.","Recommended next: UAOS V1721 READONLY KMP/PCM RELATION REVIEW")|Set-Content -LiteralPath $ReportMd -Encoding UTF8
@("# UAOS V1720 Readonly KMP Structure Inspector Seal","","Status: $status","KMP files: $totalKmp","Existing KMP files: $existing","PCM link hints: $hintRows","No cracking: TRUE","No binary keyboard output: TRUE")|Set-Content -LiteralPath $SealMd -Encoding UTF8

Write-UaosLog "Packaging V1720 R2 metadata only" "STEP" Cyan
$stage=Join-Path ([IO.Path]::GetTempPath()) ("v1720r2_"+[guid]::NewGuid().ToString("N"));New-UaosDir $stage
foreach($d in @($DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$InspectorDir,$NextWriterDir,$OwnerReviewDir)){if(Test-Path -LiteralPath $d){Copy-Item -LiteralPath $d -Destination (Join-Path $stage (Split-Path $d -Leaf)) -Recurse -Force}}
if(Test-Path -LiteralPath $ZipPath){Remove-Item -LiteralPath $ZipPath -Force}
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $ZipPath -Force
Remove-Item -LiteralPath $stage -Recurse -Force
$hash=Get-UaosSha $ZipPath
($hash+"  "+(Split-Path $ZipPath -Leaf))|Set-Content -LiteralPath $ShaPath -Encoding UTF8
$v.package_sha256=$hash
ConvertTo-UaosJson $v|Set-Content -LiteralPath $ValidationJson -Encoding UTF8

$p=""|Select-Object current_kmp_structure_inspector,status,revision,phase_root,portal,validation,kmp_structure_csv,sample_refs_csv,pcm_link_hints_csv,recommended_next_phase,package,package_sha256
$p.current_kmp_structure_inspector="UAOS V1720 R2 READONLY_KMP_STRUCTURE_INSPECTOR";$p.status=$status;$p.revision=$Revision;$p.phase_root=$PhaseRoot;$p.portal=$PortalHtml;$p.validation=$ValidationJson;$p.kmp_structure_csv=$KmpStructureCsv;$p.sample_refs_csv=$SampleRefsCsv;$p.pcm_link_hints_csv=$PcmLinkHintsCsv;$p.recommended_next_phase="UAOS V1721 READONLY_KMP_PCM_RELATION_REVIEW";$p.package=$ZipPath;$p.package_sha256=$hash
ConvertTo-UaosJson $p|Set-Content -LiteralPath $PointerJson -Encoding UTF8
@("# UAOS KMP Structure Inspector Status","","Current: UAOS V1720 R2 READONLY_KMP_STRUCTURE_INSPECTOR","Status: $status","Portal: $PortalHtml","KMP structure: $KmpStructureCsv","Sample refs: $SampleRefsCsv","PCM hints: $PcmLinkHintsCsv","Recommended next: UAOS V1721 READONLY KMP/PCM RELATION REVIEW","Package: $ZipPath","SHA256: $hash")|Set-Content -LiteralPath $StatusDoc -Encoding UTF8

$GitStatus="SKIPPED_BY_FLAG";$GitHash=""
if(!$NoGitCommit){
  try{
    if((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))){
      Push-Location $RepoRoot
      try{
        git add -f -- "uaos-ai-factory/$ScriptName" "uaos-ai-factory/uaos-v1720-readonly-kmp-structure-inspector" "uaos-ai-factory/UAOS_CURRENT_KMP_STRUCTURE_INSPECTOR.json" "docs/UAOS_KMP_STRUCTURE_INSPECTOR_STATUS.md"|Out-Null
        $st=((git status --porcelain)|Out-String)
        if([string]::IsNullOrWhiteSpace($st)){$GitStatus="NO_CHANGES"}else{git commit -m "UAOS V1720 readonly KMP structure inspector"|Out-Null;if($LASTEXITCODE -eq 0){$GitHash=(git rev-parse --short HEAD).Trim();$GitStatus="COMMITTED"}else{$GitStatus="COMMIT_FAILED"}}
      }finally{Pop-Location}
    }
  }catch{$GitStatus="COMMIT_FAILED: "+$_.Exception.Message;Write-UaosLog $GitStatus "WARN" Yellow}
}

Write-Host ""
Write-UaosLog "UAOS V1720 R2 ULTRAFAST complete" "PASS" Green
Write-Host ("Status: "+$status)
Write-Host ("Portal: "+$PortalHtml)
Write-Host ("KMP structure: "+$KmpStructureCsv)
Write-Host ("Sample refs: "+$SampleRefsCsv)
Write-Host ("PCM hints: "+$PcmLinkHintsCsv)
Write-Host ("Validation: "+$ValidationJson)
Write-Host ("Package: "+$ZipPath)
Write-Host ("Package SHA256: "+$hash)
Write-Host ("Git: "+$GitStatus)
if($GitHash){Write-Host ("Git hash: "+$GitHash)}
if(!$NoOpen){Start-Process $PortalHtml}
if($status -ne $ReadyStatus){exit 2}
exit 0
