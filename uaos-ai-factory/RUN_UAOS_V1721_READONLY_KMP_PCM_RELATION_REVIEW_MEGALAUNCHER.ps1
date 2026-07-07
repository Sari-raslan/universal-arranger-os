# UAOS V1721 READONLY KMP/PCM RELATION REVIEW MEGALAUNCHER
# Safe metadata-only phase. No cracking, no keyboard binary output, no USB, no hardware load.

[CmdletBinding()]
param(
  [string]$RepoRoot = "E:\keyboard-manager-clean",
  [string]$V1720PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1720-readonly-kmp-structure-inspector",
  [string]$V1718PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1718-real-set-extractability-classifier",
  [string]$PhaseRoot = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1721-readonly-kmp-pcm-relation-review",
  [int]$TopPcmPerKmp = 12,
  [switch]$NoOpen,
  [switch]$NoGitCommit
)

$ErrorActionPreference="Stop"
$ProgressPreference="SilentlyContinue"
Set-StrictMode -Version Latest

$FactoryRoot=Join-Path $RepoRoot "uaos-ai-factory"
$ScriptName="RUN_UAOS_V1721_READONLY_KMP_PCM_RELATION_REVIEW_MEGALAUNCHER.ps1"
$FactoryScriptPath=Join-Path $FactoryRoot $ScriptName
$ReadyStatus="KMP_PCM_RELATION_REVIEW_READY"
$NoInputStatus="WAITING_FOR_V1720_PCM_HINTS_OR_V1718_PCM"
$Revision="V1721_READONLY_KMP_PCM_RELATION_REVIEW"

$HintsCsv=Join-Path $V1720PhaseRoot "kmp-structure-inspector\UAOS_V1720_KMP_PCM_LINK_HINTS.csv"
$KmpCsv=Join-Path $V1720PhaseRoot "kmp-structure-inspector\UAOS_V1720_KMP_STRUCTURE_MARKERS.csv"
$PcmCsv=Join-Path $V1718PhaseRoot "next-writer-source\UAOS_V1718_PCM_PARSER_CANDIDATES.csv"

$DataDir=Join-Path $PhaseRoot "data"
$WorkspaceDir=Join-Path $PhaseRoot "workspace"
$ReportsDir=Join-Path $PhaseRoot "reports"
$ValidationDir=Join-Path $PhaseRoot "validation"
$SealDir=Join-Path $PhaseRoot "seal"
$LogsDir=Join-Path $PhaseRoot "logs"
$PackageDir=Join-Path $PhaseRoot "package"
$RelationDir=Join-Path $PhaseRoot "relation-review"
$GateDir=Join-Path $PhaseRoot "owner-decision-gate"
$NextDir=Join-Path $PhaseRoot "next-writer-source"

$RunLog=Join-Path $LogsDir "UAOS_V1721_KMP_PCM_RELATION_REVIEW_RUN.log"
$PortalHtml=Join-Path $WorkspaceDir "UAOS_V1721_KMP_PCM_RELATION_REVIEW_PORTAL.html"
$ValidationJson=Join-Path $ValidationDir "UAOS_V1721_KMP_PCM_RELATION_REVIEW_VALIDATION.json"
$ReportMd=Join-Path $ReportsDir "UAOS_V1721_KMP_PCM_RELATION_REVIEW_REPORT.md"
$SealMd=Join-Path $SealDir "UAOS_V1721_KMP_PCM_RELATION_REVIEW_SEAL.md"
$PointerJson=Join-Path $FactoryRoot "UAOS_CURRENT_KMP_PCM_RELATION_REVIEW.json"
$StatusDoc=Join-Path (Join-Path $RepoRoot "docs") "UAOS_KMP_PCM_RELATION_REVIEW_STATUS.md"

$GroupsCsv=Join-Path $RelationDir "UAOS_V1721_KMP_PCM_RELATION_GROUPS.csv"
$MatrixCsv=Join-Path $RelationDir "UAOS_V1721_KMP_PCM_CONFIDENCE_MATRIX.csv"
$CoverageCsv=Join-Path $RelationDir "UAOS_V1721_PCM_COVERAGE_BY_SET.csv"
$GateCsv=Join-Path $GateDir "UAOS_V1721_OWNER_DECISION_GATE.csv"
$NextCsv=Join-Path $NextDir "UAOS_V1721_NEXT_REVIEW_SOURCE_LIST.csv"
$RelationJson=Join-Path $DataDir "UAOS_V1721_KMP_PCM_RELATION_REVIEW.json"
$CodeXMd=Join-Path $NextDir "CODEX_V1722_NEXT_TASKS.md"
$ZipPath=Join-Path $PackageDir "UAOS_V1721_KMP_PCM_RELATION_REVIEW_PACKAGE.zip"
$ShaPath=Join-Path $PackageDir "UAOS_V1721_KMP_PCM_RELATION_REVIEW_PACKAGE.sha256.txt"

function New-UaosDir{param([string]$Path) if(!(Test-Path -LiteralPath $Path)){New-Item -ItemType Directory -Path $Path -Force|Out-Null}}
function Write-UaosLog{param([string]$Msg,[string]$Lvl="INFO",[ConsoleColor]$Color=[ConsoleColor]::Gray) $line="[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] [$Lvl] $Msg"; Write-Host $line -ForegroundColor $Color; try{$line|Add-Content -LiteralPath $RunLog -Encoding UTF8}catch{}}
function ConvertTo-UaosJson{param([object]$Value) $Value|ConvertTo-Json -Depth 80}
function ConvertTo-UaosHtmlSafe{param([object]$Value) [System.Net.WebUtility]::HtmlEncode([string]$Value)}
function Get-UaosUri{param([string]$Path) try{([System.Uri]::new((Resolve-Path -LiteralPath $Path).Path)).AbsoluteUri}catch{$Path}}
function Get-UaosSha{param([string]$Path) if(Test-Path -LiteralPath $Path){(Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash}else{""}}
function Import-UaosCsv{param([string]$Path) if(Test-Path -LiteralPath $Path){@(Import-Csv -LiteralPath $Path)}else{@()}}
function Get-UaosProp{param([object]$Obj,[string[]]$Names,[object]$Default="") if($null -eq $Obj){return $Default}; foreach($n in $Names){foreach($p in @($Obj.PSObject.Properties)){if($p.Name -ieq $n){return $p.Value}}}; return $Default}
function ConvertTo-UaosInt{param([object]$Value) [int]$n=0; [void][int]::TryParse([string]$Value,[ref]$n); return $n}
function Get-UaosSet{param([string]$Path) $m=[regex]::Match([string]$Path,"(?i)([^\\/]+\.SET)([\\/]|$)"); if($m.Success){$m.Groups[1].Value}else{""}}
function Get-UaosDir{param([string]$Path) try{(Split-Path -Parent $Path).ToLowerInvariant()}catch{""}}
function Get-UaosBase{param([string]$Path) try{[IO.Path]::GetFileNameWithoutExtension($Path).ToLowerInvariant()}catch{([string]$Path).ToLowerInvariant()}}
function Get-UaosTokens{param([string]$Text) @((Get-UaosBase $Text) -split "[^a-zA-Z0-9]+") | Where-Object {$_.Length -ge 3} | Select-Object -Unique}
function Get-UaosBand{param([int]$Score) if($Score -ge 120){"HIGH_HINT"}elseif($Score -ge 90){"MEDIUM_HIGH_HINT"}elseif($Score -ge 60){"MEDIUM_HINT"}elseif($Score -ge 40){"LOW_MEDIUM_HINT"}else{"LOW_HINT"}}
function Get-UaosDecision{param([int]$Score) if($Score -ge 120){"KEEP_FOR_V1722_READONLY_PCM_GROUP_REVIEW"}elseif($Score -ge 90){"KEEP_BUT_OWNER_CONFIRM_SET_CONTEXT"}elseif($Score -ge 60){"OWNER_REVIEW_REQUIRED_BEFORE_NEXT_PHASE"}else{"LOW_CONFIDENCE_HOLD"}}
function Get-UaosDerivedScore{
  param([object]$Kmp,[object]$Pcm)
  $score=0;$reasons=@()
  $kmpFile=[string](Get-UaosProp $Kmp @("source_path","kmp_file","file_name") "")
  $pcmFile=[string](Get-UaosProp $Pcm @("source_path","full_path","path","relative_path") "")
  $kmpName=[string](Get-UaosProp $Kmp @("file_name","kmp_file") "")
  $pcmName=[string](Get-UaosProp $Pcm @("file_name","FileName","name","pcm_name") "")
  if((Get-UaosDir $kmpFile) -and (Get-UaosDir $kmpFile) -eq (Get-UaosDir $pcmFile)){$score+=80;$reasons+="same_directory"}
  if((Get-UaosSet $kmpFile) -and (Get-UaosSet $kmpFile) -eq (Get-UaosSet $pcmFile)){$score+=50;$reasons+="same_set_context"}
  $kt=Get-UaosTokens $kmpName;$pt=Get-UaosTokens $pcmName
  $over=@($kt|Where-Object{$pt -contains $_})
  if(@($over).Count -gt 0){$score += [Math]::Min(40,@($over).Count*10);$reasons += ("name_overlap:"+((@($over)|Select-Object -First 5)-join "|"))}
  $o=""|Select-Object score,reason
  $o.score=$score;$o.reason=if(@($reasons).Count){$reasons -join ";"}else{"no_hint"}
  return $o
}

foreach($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$PackageDir,$RelationDir,$GateDir,$NextDir,(Join-Path $RepoRoot "docs"))){New-UaosDir $d}

Write-UaosLog "UAOS V1721 READONLY KMP/PCM RELATION REVIEW started" "STEP" Cyan
if(!(Test-Path -LiteralPath $PcmCsv)){throw "Missing V1718 PCM candidates CSV: $PcmCsv"}
try{if($PSCommandPath){Copy-Item -LiteralPath $PSCommandPath -Destination $FactoryScriptPath -Force}}catch{}

$hints=Import-UaosCsv $HintsCsv
$kmps=Import-UaosCsv $KmpCsv
$pcms=Import-UaosCsv $PcmCsv
Write-UaosLog ("V1720 hint rows: "+@($hints).Count)
Write-UaosLog ("V1720 KMP rows: "+@($kmps).Count)
Write-UaosLog ("V1718 PCM rows: "+@($pcms).Count)

$matrix=@()

foreach($h in $hints){
  $score=ConvertTo-UaosInt (Get-UaosProp $h @("score") 0)
  $row=""|Select-Object relation_id,kmp_id,kmp_file,pcm_file,pcm_name,score,confidence_band,reason,source,relation_status,required_next_action,safety_status
  $row.relation_id="V1721_REL_"+(@($matrix).Count+1).ToString("00000")
  $row.kmp_id=[string](Get-UaosProp $h @("kmp_id") "")
  $row.kmp_file=[string](Get-UaosProp $h @("kmp_file") "")
  $row.pcm_file=[string](Get-UaosProp $h @("pcm_file") "")
  $row.pcm_name=[string](Get-UaosProp $h @("pcm_name") "")
  $row.score=$score
  $row.confidence_band=Get-UaosBand $score
  $row.reason=[string](Get-UaosProp $h @("reason") "")
  $row.source="V1720_PCM_LINK_HINT"
  $row.relation_status="RELATION_HINT_ONLY_NOT_CONFIRMED"
  $row.required_next_action="OWNER_DECISION_AND_V1722_READONLY_PCM_GROUP_REVIEW"
  $row.safety_status="READ_ONLY_NO_BINARY_OUTPUT"
  $matrix += $row
}

if(@($matrix).Count -eq 0 -and @($kmps).Count -gt 0){
  Write-UaosLog "No V1720 hints found. Deriving relation hints from directory/SET/name only." "WARN" Yellow
  foreach($k in $kmps){
    $local=@()
    foreach($p in $pcms){
      $link=Get-UaosDerivedScore -Kmp $k -Pcm $p
      if($link.score -ge 40){
        $row=""|Select-Object relation_id,kmp_id,kmp_file,pcm_file,pcm_name,score,confidence_band,reason,source,relation_status,required_next_action,safety_status
        $row.relation_id="PENDING"
        $row.kmp_id=[string](Get-UaosProp $k @("kmp_id") "")
        $row.kmp_file=[string](Get-UaosProp $k @("source_path") "")
        $row.pcm_file=[string](Get-UaosProp $p @("source_path","full_path","path","relative_path") "")
        $row.pcm_name=[string](Get-UaosProp $p @("file_name","FileName","name") "")
        $row.score=$link.score
        $row.confidence_band=Get-UaosBand $link.score
        $row.reason=$link.reason
        $row.source="V1721_DERIVED_HINT"
        $row.relation_status="RELATION_HINT_ONLY_NOT_CONFIRMED"
        $row.required_next_action="OWNER_DECISION_AND_V1722_READONLY_PCM_GROUP_REVIEW"
        $row.safety_status="READ_ONLY_NO_BINARY_OUTPUT"
        $local += $row
      }
    }
    foreach($best in @($local|Sort-Object score -Descending|Select-Object -First $TopPcmPerKmp)){
      $best.relation_id="V1721_REL_"+(@($matrix).Count+1).ToString("00000")
      $matrix += $best
    }
  }
}

# Trim top N per KMP
$trim=@()
foreach($g in @($matrix|Group-Object kmp_id)){
  $trim += @($g.Group|Sort-Object score -Descending|Select-Object -First $TopPcmPerKmp)
}
$matrix=@($trim|Sort-Object kmp_id,@{Expression="score";Descending=$true})
$matrix|Export-Csv -LiteralPath $MatrixCsv -NoTypeInformation -Encoding UTF8

$groups=@()
foreach($g in @($matrix|Group-Object kmp_id)){
  $items=@($g.Group|Sort-Object score -Descending)
  $top=$items|Select-Object -First 1
  $avg=0;if(@($items).Count){$avg=[Math]::Round((($items|Measure-Object -Property score -Average).Average),2)}
  $rg=""|Select-Object group_id,kmp_id,kmp_file,pcm_candidate_count,top_pcm_file,top_pcm_name,top_score,top_confidence,average_score,high_hint_count,medium_high_hint_count,medium_hint_count,low_hint_count,group_status,owner_decision_required,next_action
  $rg.group_id="V1721_GROUP_"+(@($groups).Count+1).ToString("000")
  $rg.kmp_id=$g.Name;$rg.kmp_file=[string]$top.kmp_file;$rg.pcm_candidate_count=@($items).Count;$rg.top_pcm_file=[string]$top.pcm_file;$rg.top_pcm_name=[string]$top.pcm_name;$rg.top_score=[int]$top.score;$rg.top_confidence=[string]$top.confidence_band;$rg.average_score=$avg
  $rg.high_hint_count=@($items|Where-Object{$_.score -ge 120}).Count
  $rg.medium_high_hint_count=@($items|Where-Object{$_.score -ge 90 -and $_.score -lt 120}).Count
  $rg.medium_hint_count=@($items|Where-Object{$_.score -ge 60 -and $_.score -lt 90}).Count
  $rg.low_hint_count=@($items|Where-Object{$_.score -lt 60}).Count
  $rg.group_status="RELATION_GROUP_HINT_ONLY_NOT_CONFIRMED"
  $rg.owner_decision_required=$true
  $rg.next_action=Get-UaosDecision ([int]$top.score)
  $groups += $rg
}
$groups|Export-Csv -LiteralPath $GroupsCsv -NoTypeInformation -Encoding UTF8

$coverage=@()
foreach($g in @($pcms|Group-Object {Get-UaosSet ([string](Get-UaosProp $_ @("source_path","full_path","path","relative_path") ""))})){
  $c=""|Select-Object set_context,pcm_count
  $c.set_context=if([string]::IsNullOrWhiteSpace($g.Name)){"NO_SET_CONTEXT"}else{$g.Name}
  $c.pcm_count=$g.Count
  $coverage += $c
}
$coverage|Sort-Object pcm_count -Descending|Export-Csv -LiteralPath $CoverageCsv -NoTypeInformation -Encoding UTF8

$gate=@();$next=@()
foreach($rg in $groups){
  $og=""|Select-Object decision_id,group_id,kmp_id,kmp_file,top_pcm_file,pcm_candidate_count,top_confidence,question,decision_options,recommended_default,commercial_status,safety_status
  $og.decision_id="V1721_DECISION_"+(@($gate).Count+1).ToString("000")
  $og.group_id=$rg.group_id;$og.kmp_id=$rg.kmp_id;$og.kmp_file=$rg.kmp_file;$og.top_pcm_file=$rg.top_pcm_file;$og.pcm_candidate_count=$rg.pcm_candidate_count;$og.top_confidence=$rg.top_confidence
  $og.question="Should this KMP/PCM relation group continue to V1722 readonly PCM group review?"
  $og.decision_options="APPROVE_FOR_V1722 / HOLD_LOW_CONFIDENCE / REMOVE / LICENSE_UNKNOWN"
  $og.recommended_default=$rg.next_action
  $og.commercial_status="NEEDS_LICENSE_REVIEW_BEFORE_SALE"
  $og.safety_status="NO_BINARY_OUTPUT_NO_CRACKING"
  $gate += $og

  $ns=""|Select-Object next_source_id,group_id,kmp_id,kmp_file,top_pcm_file,top_score,top_confidence,allowed_use,blocked_until,next_phase
  $ns.next_source_id="V1721_NEXT_"+(@($next).Count+1).ToString("000")
  $ns.group_id=$rg.group_id;$ns.kmp_id=$rg.kmp_id;$ns.kmp_file=$rg.kmp_file;$ns.top_pcm_file=$rg.top_pcm_file;$ns.top_score=$rg.top_score;$ns.top_confidence=$rg.top_confidence
  $ns.allowed_use="READONLY_RELATION_REVIEW_ONLY";$ns.blocked_until="OWNER_DECISION_LICENSE_FORMAT_READER_HARDWARE_VALIDATION";$ns.next_phase="UAOS V1722 READONLY_PCM_GROUP_REVIEW"
  $next += $ns
}
$gate|Export-Csv -LiteralPath $GateCsv -NoTypeInformation -Encoding UTF8
$next|Export-Csv -LiteralPath $NextCsv -NoTypeInformation -Encoding UTF8

$totalHints=@($hints).Count;$totalPcm=@($pcms).Count;$totalMatrix=@($matrix).Count;$totalGroups=@($groups).Count;$totalGate=@($gate).Count
$high=@($groups|Where-Object{$_.top_score -ge 120}).Count
$medHigh=@($groups|Where-Object{$_.top_score -ge 90 -and $_.top_score -lt 120}).Count
$med=@($groups|Where-Object{$_.top_score -ge 60 -and $_.top_score -lt 90}).Count
$low=@($groups|Where-Object{$_.top_score -lt 60}).Count
$status=if(($totalGroups -gt 0) -or ($totalPcm -gt 0)){$ReadyStatus}else{$NoInputStatus}

$payload=""|Select-Object revision,created_at,status,v1720_hint_rows,v1718_pcm_candidates,confidence_matrix_rows,relation_group_count,owner_decision_count,high_groups,medium_high_groups,medium_groups,low_groups,relation_groups_csv,confidence_matrix_csv,owner_decision_csv,next_source_csv
$payload.revision=$Revision;$payload.created_at=(Get-Date).ToString("s");$payload.status=$status;$payload.v1720_hint_rows=$totalHints;$payload.v1718_pcm_candidates=$totalPcm;$payload.confidence_matrix_rows=$totalMatrix;$payload.relation_group_count=$totalGroups;$payload.owner_decision_count=$totalGate;$payload.high_groups=$high;$payload.medium_high_groups=$medHigh;$payload.medium_groups=$med;$payload.low_groups=$low;$payload.relation_groups_csv=$GroupsCsv;$payload.confidence_matrix_csv=$MatrixCsv;$payload.owner_decision_csv=$GateCsv;$payload.next_source_csv=$NextCsv
ConvertTo-UaosJson $payload|Set-Content -LiteralPath $RelationJson -Encoding UTF8

@("# CodeX V1722 Next Tasks","","Task 1: Read V1721 relation groups and owner decision gate.","Task 2: For approved groups only, create readonly PCM group review.","Task 3: Keep PCM as metadata/container candidate only; no decode claim unless validated.","Hard gates: no cracking, no binary keyboard output, no USB, no hardware load, no PA3X-ready claim.")|Set-Content -LiteralPath $CodeXMd -Encoding UTF8

$html=@("<!doctype html><html><head><meta charset='utf-8'><title>UAOS V1721 KMP/PCM Relation Review</title><style>body{font-family:Segoe UI,Arial;background:#07101d;color:#eef5ff;padding:28px}.card{background:#101d32;border:1px solid #263a59;border-radius:14px;padding:16px;margin:10px 0}.num{font-size:28px;font-weight:800}.btn{display:inline-block;background:#173456;color:white;padding:10px;margin:4px;border-radius:10px;text-decoration:none}.ok{background:#12351f;border:1px solid #32a062;padding:8px 12px;border-radius:999px;display:inline-block}</style></head><body>",
"<h1>UAOS V1721 Readonly KMP/PCM Relation Review</h1><div class='ok'>Status: "+(ConvertTo-UaosHtmlSafe $status)+"</div>",
"<div class='card'>V1720 hint rows<div class='num'>$totalHints</div></div><div class='card'>V1718 PCM candidates<div class='num'>$totalPcm</div></div><div class='card'>Confidence matrix rows<div class='num'>$totalMatrix</div></div><div class='card'>Relation groups<div class='num'>$totalGroups</div></div><div class='card'>Owner decisions<div class='num'>$totalGate</div></div>",
"<div class='card'>High / medium-high / medium / low groups<div class='num'>$high / $medHigh / $med / $low</div></div>",
"<div class='card'><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $GroupsCsv))+"'>Relation Groups</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $MatrixCsv))+"'>Confidence Matrix</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $GateCsv))+"'>Owner Decision Gate</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $CoverageCsv))+"'>PCM Coverage</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Get-UaosUri $ValidationJson))+"'>Validation</a></div>",
"<div class='card'>Readonly relation hints only. No cracking. No binary output. No USB. No hardware load.</div></body></html>")
$html|Set-Content -LiteralPath $PortalHtml -Encoding UTF8

$v=""|Select-Object phase,revision,status,source_v1720_hints,source_v1718_pcm,v1720_hint_rows,v1718_pcm_candidates,confidence_matrix_rows,relation_group_count,owner_decision_count,high_groups,medium_high_groups,medium_groups,low_groups,no_cracking,no_binary_keyboard_output,no_usb,no_hardware_load,commercial_status,recommended_next_phase,portal,relation_groups_csv,confidence_matrix_csv,owner_decision_csv,pcm_coverage_csv,next_source_csv,package,package_sha256
$v.phase="UAOS V1721";$v.revision=$Revision;$v.status=$status;$v.source_v1720_hints=$HintsCsv;$v.source_v1718_pcm=$PcmCsv;$v.v1720_hint_rows=$totalHints;$v.v1718_pcm_candidates=$totalPcm;$v.confidence_matrix_rows=$totalMatrix;$v.relation_group_count=$totalGroups;$v.owner_decision_count=$totalGate;$v.high_groups=$high;$v.medium_high_groups=$medHigh;$v.medium_groups=$med;$v.low_groups=$low;$v.no_cracking=$true;$v.no_binary_keyboard_output=$true;$v.no_usb=$true;$v.no_hardware_load=$true;$v.commercial_status="NEEDS_LICENSE_REVIEW_BEFORE_SALE";$v.recommended_next_phase="UAOS V1722 READONLY_PCM_GROUP_REVIEW";$v.portal=$PortalHtml;$v.relation_groups_csv=$GroupsCsv;$v.confidence_matrix_csv=$MatrixCsv;$v.owner_decision_csv=$GateCsv;$v.pcm_coverage_csv=$CoverageCsv;$v.next_source_csv=$NextCsv;$v.package=$ZipPath;$v.package_sha256=""
ConvertTo-UaosJson $v|Set-Content -LiteralPath $ValidationJson -Encoding UTF8

@("# UAOS V1721 Readonly KMP/PCM Relation Review Report","","Status: $status","V1720 hint rows: $totalHints","V1718 PCM candidates: $totalPcm","Confidence matrix rows: $totalMatrix","Relation groups: $totalGroups","Owner decision rows: $totalGate","High groups: $high","Medium-high groups: $medHigh","Medium groups: $med","Low groups: $low","","Safety: no cracking, no binary output, no USB, no hardware load.","Recommended next: UAOS V1722 READONLY PCM GROUP REVIEW")|Set-Content -LiteralPath $ReportMd -Encoding UTF8
@("# UAOS V1721 Readonly KMP/PCM Relation Review Seal","","Status: $status","Relation groups: $totalGroups","Confidence matrix rows: $totalMatrix","Owner decision rows: $totalGate","No cracking: TRUE","No binary keyboard output: TRUE","No USB: TRUE","No hardware load: TRUE")|Set-Content -LiteralPath $SealMd -Encoding UTF8

Write-UaosLog "Packaging V1721 metadata only" "STEP" Cyan
$stage=Join-Path ([IO.Path]::GetTempPath()) ("v1721_"+[guid]::NewGuid().ToString("N"));New-UaosDir $stage
foreach($d in @($DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$RelationDir,$GateDir,$NextDir)){if(Test-Path -LiteralPath $d){Copy-Item -LiteralPath $d -Destination (Join-Path $stage (Split-Path $d -Leaf)) -Recurse -Force}}
if(Test-Path -LiteralPath $ZipPath){Remove-Item -LiteralPath $ZipPath -Force}
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $ZipPath -Force
Remove-Item -LiteralPath $stage -Recurse -Force
$hash=Get-UaosSha $ZipPath
($hash+"  "+(Split-Path $ZipPath -Leaf))|Set-Content -LiteralPath $ShaPath -Encoding UTF8
$v.package_sha256=$hash
ConvertTo-UaosJson $v|Set-Content -LiteralPath $ValidationJson -Encoding UTF8

$p=""|Select-Object current_kmp_pcm_relation_review,status,revision,phase_root,portal,validation,relation_groups_csv,confidence_matrix_csv,owner_decision_csv,recommended_next_phase,package,package_sha256
$p.current_kmp_pcm_relation_review="UAOS V1721 READONLY_KMP_PCM_RELATION_REVIEW";$p.status=$status;$p.revision=$Revision;$p.phase_root=$PhaseRoot;$p.portal=$PortalHtml;$p.validation=$ValidationJson;$p.relation_groups_csv=$GroupsCsv;$p.confidence_matrix_csv=$MatrixCsv;$p.owner_decision_csv=$GateCsv;$p.recommended_next_phase="UAOS V1722 READONLY_PCM_GROUP_REVIEW";$p.package=$ZipPath;$p.package_sha256=$hash
ConvertTo-UaosJson $p|Set-Content -LiteralPath $PointerJson -Encoding UTF8
@("# UAOS KMP/PCM Relation Review Status","","Current: UAOS V1721 READONLY_KMP_PCM_RELATION_REVIEW","Status: $status","Portal: $PortalHtml","Relation groups: $GroupsCsv","Confidence matrix: $MatrixCsv","Owner decision gate: $GateCsv","Recommended next: UAOS V1722 READONLY PCM GROUP REVIEW","Package: $ZipPath","SHA256: $hash")|Set-Content -LiteralPath $StatusDoc -Encoding UTF8

Write-UaosLog "Local git commit only" "STEP" Cyan
$GitStatus="SKIPPED_BY_FLAG";$GitHash=""
if(!$NoGitCommit){
  try{
    if((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))){
      Push-Location $RepoRoot
      try{
        git add -f -- "uaos-ai-factory/$ScriptName" "uaos-ai-factory/uaos-v1721-readonly-kmp-pcm-relation-review" "uaos-ai-factory/UAOS_CURRENT_KMP_PCM_RELATION_REVIEW.json" "docs/UAOS_KMP_PCM_RELATION_REVIEW_STATUS.md"|Out-Null
        $st=((git status --porcelain)|Out-String)
        if([string]::IsNullOrWhiteSpace($st)){$GitStatus="NO_CHANGES"}else{git commit -m "UAOS V1721 readonly KMP PCM relation review"|Out-Null;if($LASTEXITCODE -eq 0){$GitHash=(git rev-parse --short HEAD).Trim();$GitStatus="COMMITTED"}else{$GitStatus="COMMIT_FAILED"}}
      }finally{Pop-Location}
    }
  }catch{$GitStatus="COMMIT_FAILED: "+$_.Exception.Message;Write-UaosLog $GitStatus "WARN" Yellow}
}

Write-Host ""
Write-UaosLog "UAOS V1721 READONLY KMP/PCM RELATION REVIEW complete" "PASS" Green
Write-Host ("Status: "+$status)
Write-Host ("Portal: "+$PortalHtml)
Write-Host ("Relation groups: "+$GroupsCsv)
Write-Host ("Confidence matrix: "+$MatrixCsv)
Write-Host ("Owner decision gate: "+$GateCsv)
Write-Host ("Validation: "+$ValidationJson)
Write-Host ("Package: "+$ZipPath)
Write-Host ("Package SHA256: "+$hash)
Write-Host ("Git: "+$GitStatus)
if($GitHash){Write-Host ("Git hash: "+$GitHash)}
if(!$NoOpen){Start-Process $PortalHtml}
if($status -ne $ReadyStatus){exit 2}
exit 0
