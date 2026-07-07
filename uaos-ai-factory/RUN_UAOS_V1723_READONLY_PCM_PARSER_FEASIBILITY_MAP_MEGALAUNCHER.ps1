# UAOS V1723 READONLY PCM PARSER FEASIBILITY MAP - MEGALAUNCHER
[CmdletBinding()]
param(
 [string]$RepoRoot="E:\keyboard-manager-clean",
 [string]$V1722PhaseRoot="E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1722-readonly-pcm-group-review",
 [string]$PhaseRoot="E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1723-readonly-pcm-parser-feasibility-map",
 [switch]$NoOpen,
 [switch]$NoGitCommit
)

$ErrorActionPreference="Stop"; $ProgressPreference="SilentlyContinue"; Set-StrictMode -Version Latest

$FactoryRoot=Join-Path $RepoRoot "uaos-ai-factory"
$ScriptName="RUN_UAOS_V1723_READONLY_PCM_PARSER_FEASIBILITY_MAP_MEGALAUNCHER.ps1"
$FactoryScriptPath=Join-Path $FactoryRoot $ScriptName
$StatusReady="PCM_PARSER_FEASIBILITY_READY"
$Revision="V1723_READONLY_PCM_PARSER_FEASIBILITY_MAP"

$ParserCsv=Join-Path $V1722PhaseRoot "next-parser-source\UAOS_V1722_PARSER_READINESS_MAP.csv"
$OwnerCsv=Join-Path $V1722PhaseRoot "owner-decision-gate\UAOS_V1722_OWNER_DECISION_GATE.csv"

$DataDir=Join-Path $PhaseRoot "data"; $WorkspaceDir=Join-Path $PhaseRoot "workspace"; $ReportsDir=Join-Path $PhaseRoot "reports"; $ValidationDir=Join-Path $PhaseRoot "validation"; $SealDir=Join-Path $PhaseRoot "seal"; $LogsDir=Join-Path $PhaseRoot "logs"; $PackageDir=Join-Path $PhaseRoot "package"; $ParserDir=Join-Path $PhaseRoot "parser-feasibility"; $GateDir=Join-Path $PhaseRoot "stop-gates"; $NextDir=Join-Path $PhaseRoot "next-parser-research"

$RunLog=Join-Path $LogsDir "UAOS_V1723_PCM_PARSER_FEASIBILITY_RUN.log"
$PortalHtml=Join-Path $WorkspaceDir "UAOS_V1723_PCM_PARSER_FEASIBILITY_PORTAL.html"
$ValidationJson=Join-Path $ValidationDir "UAOS_V1723_PCM_PARSER_FEASIBILITY_VALIDATION.json"
$ReportMd=Join-Path $ReportsDir "UAOS_V1723_PCM_PARSER_FEASIBILITY_REPORT.md"
$SealMd=Join-Path $SealDir "UAOS_V1723_PCM_PARSER_FEASIBILITY_SEAL.md"
$PointerJson=Join-Path $FactoryRoot "UAOS_CURRENT_PCM_PARSER_FEASIBILITY.json"
$StatusDoc=Join-Path (Join-Path $RepoRoot "docs") "UAOS_PCM_PARSER_FEASIBILITY_STATUS.md"
$TierCsv=Join-Path $ParserDir "UAOS_V1723_TIER1_TIER2_SELECTION.csv"
$RiskCsv=Join-Path $ParserDir "UAOS_V1723_PARSER_FEASIBILITY_RISK_MAP.csv"
$PlanCsv=Join-Path $ParserDir "UAOS_V1723_SAFE_PARSER_PLAN.csv"
$StopCsv=Join-Path $GateDir "UAOS_V1723_STOP_GATES.csv"
$NextCsv=Join-Path $NextDir "UAOS_V1723_NEXT_PARSER_RESEARCH_SOURCE_LIST.csv"
$CodeXMd=Join-Path $NextDir "CODEX_V1724_NEXT_TASKS.md"
$ZipPath=Join-Path $PackageDir "UAOS_V1723_PCM_PARSER_FEASIBILITY_PACKAGE.zip"
$ShaPath=Join-Path $PackageDir "UAOS_V1723_PCM_PARSER_FEASIBILITY_PACKAGE.sha256.txt"

function Mk{param($P) if(!(Test-Path -LiteralPath $P)){New-Item -ItemType Directory -Path $P -Force|Out-Null}}
function Log{param($M,$L="INFO",[ConsoleColor]$C=[ConsoleColor]::Gray) $line="[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] [$L] $M"; Write-Host $line -ForegroundColor $C; try{$line|Add-Content -LiteralPath $RunLog -Encoding UTF8}catch{}}
function J{param($O) $O|ConvertTo-Json -Depth 60}
function ConvertTo-UaosHtmlSafe { param($S) [System.Net.WebUtility]::HtmlEncode([string]$S) }
function Uri{param($P) try{([System.Uri]::new((Resolve-Path -LiteralPath $P).Path)).AbsoluteUri}catch{$P}}
function Sha{param($P) if(Test-Path -LiteralPath $P){(Get-FileHash -LiteralPath $P -Algorithm SHA256).Hash}else{""}}
function Csv{param($P) if(Test-Path -LiteralPath $P){@(Import-Csv -LiteralPath $P)}else{@()}}
function Prop{param($O,[string[]]$N,$D="") if($null -eq $O){return $D}; foreach($n in $N){foreach($p in @($O.PSObject.Properties)){if($p.Name -ieq $n){return $p.Value}}}; return $D}
function RiskFor{
 param($Tier,$Readiness,$OwnerDefault)
 $score=50; $why=@()
 if($Tier -like "TIER_1*"){$score-=20;$why+="tier1"}elseif($Tier -like "TIER_2*"){$score-=10;$why+="tier2"}else{$score+=40;$why+="not_tier1_or_tier2"}
 if($Readiness -match "FEASIBLE"){$score-=10;$why+="readiness_feasible"}elseif($Readiness -match "POSSIBLE"){$why+="readiness_possible"}else{$score+=20;$why+="readiness_uncertain"}
 if($OwnerDefault -match "APPROVE"){$score-=5;$why+="owner_default_approve_after_review"}else{$score+=10;$why+="owner_decision_required"}
 if($score -lt 0){$score=0}; if($score -gt 100){$score=100}
 $band=if($score -le 25){"LOW_RISK"}elseif($score -le 50){"MEDIUM_RISK"}elseif($score -le 75){"HIGH_RISK"}else{"STOP_RISK"}
 $o=""|Select-Object score,band,reason
 $o.score=$score;$o.band=$band;$o.reason=$why -join ";"; return $o
}
function ScopeFor{param($Band) if($Band -eq "LOW_RISK"){"HEADER_AND_CONTAINER_BOUNDARY_RESEARCH_ONLY"}elseif($Band -eq "MEDIUM_RISK"){"HEADER_SIZE_TABLE_AND_MARKER_RESEARCH_ONLY"}elseif($Band -eq "HIGH_RISK"){"METADATA_ONLY_OWNER_REVIEW_FIRST"}else{"STOP_NO_PARSER_WORK"}}

foreach($d in @($FactoryRoot,$PhaseRoot,$DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$PackageDir,$ParserDir,$GateDir,$NextDir,(Join-Path $RepoRoot "docs"))){Mk $d}
Log "UAOS V1723 READONLY PCM PARSER FEASIBILITY MAP started" "STEP" Cyan
if(!(Test-Path -LiteralPath $ParserCsv)){throw "Missing V1722 parser readiness map: $ParserCsv"}
try{if($PSCommandPath){Copy-Item -LiteralPath $PSCommandPath -Destination $FactoryScriptPath -Force}}catch{}

$parser=Csv $ParserCsv
$owners=Csv $OwnerCsv
Log ("Parser readiness rows: "+@($parser).Count)
Log ("Owner gate rows: "+@($owners).Count)

$ownerByGroup=@{}
foreach($o in $owners){$gid=[string](Prop $o @("review_group_id","group_id") ""); if($gid -and !$ownerByGroup.ContainsKey($gid)){$ownerByGroup[$gid]=$o}}

$selected=@()
foreach($p in $parser){
 $tier=[string](Prop $p @("parser_tier") "")
 if($tier -like "TIER_1*" -or $tier -like "TIER_2*"){$selected+=$p}
}

$selRows=@();$riskRows=@();$planRows=@();$nextRows=@()
foreach($p in $selected){
 $gid=[string](Prop $p @("review_group_id") "")
 $kmp=[string](Prop $p @("kmp_id") "")
 $pcm=[string](Prop $p @("top_pcm_file") "")
 $tier=[string](Prop $p @("parser_tier") "")
 $ready=[string](Prop $p @("readiness_status","feasibility_status") "")
 $owner=$null; if($ownerByGroup.ContainsKey($gid)){$owner=$ownerByGroup[$gid]}
 $ownerDefault=[string](Prop $owner @("recommended_default") "OWNER_DECISION_REQUIRED")
 $risk=RiskFor $tier $ready $ownerDefault
 $scope=ScopeFor $risk.band

 $s=""|Select-Object selection_id,review_group_id,kmp_id,top_pcm_file,parser_tier,readiness_status,owner_recommended_default,selected_for_v1723,selection_reason,safety_status
 $s.selection_id="V1723_SELECT_"+(@($selRows).Count+1).ToString("000");$s.review_group_id=$gid;$s.kmp_id=$kmp;$s.top_pcm_file=$pcm;$s.parser_tier=$tier;$s.readiness_status=$ready;$s.owner_recommended_default=$ownerDefault;$s.selected_for_v1723=$true;$s.selection_reason="Tier 1/Tier 2 only per approval";$s.safety_status="READONLY_FEASIBILITY_ONLY"
 $selRows+=$s

 $r=""|Select-Object risk_id,review_group_id,kmp_id,top_pcm_file,parser_tier,readiness_status,risk_score,risk_band,risk_reason,allowed_parse_scope,blocked_parse_scope,required_stop_condition,safety_status
 $r.risk_id="V1723_RISK_"+(@($riskRows).Count+1).ToString("000");$r.review_group_id=$gid;$r.kmp_id=$kmp;$r.top_pcm_file=$pcm;$r.parser_tier=$tier;$r.readiness_status=$ready;$r.risk_score=$risk.score;$r.risk_band=$risk.band;$r.risk_reason=$risk.reason;$r.allowed_parse_scope=$scope;$r.blocked_parse_scope="NO_PAYLOAD_DECODE_NO_SAMPLE_EXTRACTION_NO_BINARY_WRITER_NO_SET_OUTPUT";$r.required_stop_condition="STOP_IF_ENCRYPTED_COMPRESSED_UNKNOWN_PROTECTED_OR_WRITER_NEEDED";$r.safety_status="NO_CRACKING_NO_BINARY_OUTPUT"
 $riskRows+=$r

 $pl=""|Select-Object plan_id,review_group_id,kmp_id,top_pcm_file,stage1,stage2,stage3,explicitly_blocked,next_phase_candidate,commercial_status,safety_status
 $pl.plan_id="V1723_PLAN_"+(@($planRows).Count+1).ToString("000");$pl.review_group_id=$gid;$pl.kmp_id=$kmp;$pl.top_pcm_file=$pcm;$pl.stage1="READ_FILE_METADATA_SIZE_HASH_EXTENSION_ONLY";$pl.stage2="READ_SMALL_HEADER_WINDOW_AND_MARKER_TABLE_ONLY";$pl.stage3="COMPARE_WITH_KMP_RELATION_HINTS_AND_STOP_AT_UNKNOWN_BOUNDARY";$pl.explicitly_blocked="NO_CRACKING_NO_DECRYPT_NO_DECOMPRESS_UNKNOWN_NO_SAMPLE_PAYLOAD_EXTRACTION_NO_BINARY_OUTPUT";$pl.next_phase_candidate="UAOS V1724 READONLY_PCM_HEADER_MARKER_RESEARCH";$pl.commercial_status="NEEDS_LICENSE_REVIEW_BEFORE_SALE";$pl.safety_status="SAFE_PARSER_PLAN_ONLY"
 $planRows+=$pl

 $n=""|Select-Object next_source_id,review_group_id,kmp_id,top_pcm_file,parser_tier,risk_band,allowed_work,blocked_work,next_phase
 $n.next_source_id="V1723_NEXT_"+(@($nextRows).Count+1).ToString("000");$n.review_group_id=$gid;$n.kmp_id=$kmp;$n.top_pcm_file=$pcm;$n.parser_tier=$tier;$n.risk_band=$risk.band;$n.allowed_work=$scope;$n.blocked_work="NO_CRACKING_NO_BINARY_OUTPUT_NO_USB_NO_HARDWARE_LOAD";$n.next_phase="UAOS V1724 READONLY_PCM_HEADER_MARKER_RESEARCH"
 $nextRows+=$n
}

$stops=@(
 @("STOP_001","Encrypted/protected/compressed unknown payload detected","STOP_IMMEDIATELY","No cracking or bypass."),
 @("STOP_002","Parser requires password/decryption/protection bypass","STOP_IMMEDIATELY","No protected-content access."),
 @("STOP_003","Need to write SET/PCM/STY/KMP/KSF binary output","STOP_IMMEDIATELY","Writer phase not approved."),
 @("STOP_004","Need to load USB or hardware keyboard","STOP_IMMEDIATELY","Hardware phase not approved."),
 @("STOP_005","Need to claim PA3X-ready compatibility","STOP_IMMEDIATELY","Hardware validation required."),
 @("STOP_006","PCM group has no Tier 1/Tier 2 parser readiness","HOLD","Outside approved V1723 scope."),
 @("STOP_007","License or commercial origin unclear","HOLD","Commercial use blocked until review.")
)
$stopRows=@()
foreach($g in $stops){$x=""|Select-Object stop_gate_id,trigger,required_action,reason;$x.stop_gate_id=$g[0];$x.trigger=$g[1];$x.required_action=$g[2];$x.reason=$g[3];$stopRows+=$x}

$selRows|Export-Csv -LiteralPath $TierCsv -NoTypeInformation -Encoding UTF8
$riskRows|Export-Csv -LiteralPath $RiskCsv -NoTypeInformation -Encoding UTF8
$planRows|Export-Csv -LiteralPath $PlanCsv -NoTypeInformation -Encoding UTF8
$stopRows|Export-Csv -LiteralPath $StopCsv -NoTypeInformation -Encoding UTF8
$nextRows|Export-Csv -LiteralPath $NextCsv -NoTypeInformation -Encoding UTF8

$totalParser=@($parser).Count;$totalOwner=@($owners).Count;$selectedCount=@($selRows).Count;$riskCount=@($riskRows).Count;$planCount=@($planRows).Count;$stopCount=@($stopRows).Count
$tier1=@($selRows|Where-Object{$_.parser_tier -like "TIER_1*"}).Count
$tier2=@($selRows|Where-Object{$_.parser_tier -like "TIER_2*"}).Count
$low=@($riskRows|Where-Object{$_.risk_band -eq "LOW_RISK"}).Count
$med=@($riskRows|Where-Object{$_.risk_band -eq "MEDIUM_RISK"}).Count
$high=@($riskRows|Where-Object{$_.risk_band -eq "HIGH_RISK"}).Count
$stop=@($riskRows|Where-Object{$_.risk_band -eq "STOP_RISK"}).Count
$status=if($totalParser -gt 0){$StatusReady}else{"WAITING_FOR_V1722_PARSER_READINESS"}

$payload=""|Select-Object revision,created_at,status,parser_readiness_rows,owner_gate_rows,selected_tier1_tier2_count,tier1_count,tier2_count,risk_rows,plan_rows,stop_gate_count,low_risk,medium_risk,high_risk,stop_risk,tier_selection_csv,risk_map_csv,safe_parser_plan_csv,stop_gates_csv,next_research_csv
$payload.revision=$Revision;$payload.created_at=(Get-Date).ToString("s");$payload.status=$status;$payload.parser_readiness_rows=$totalParser;$payload.owner_gate_rows=$totalOwner;$payload.selected_tier1_tier2_count=$selectedCount;$payload.tier1_count=$tier1;$payload.tier2_count=$tier2;$payload.risk_rows=$riskCount;$payload.plan_rows=$planCount;$payload.stop_gate_count=$stopCount;$payload.low_risk=$low;$payload.medium_risk=$med;$payload.high_risk=$high;$payload.stop_risk=$stop;$payload.tier_selection_csv=$TierCsv;$payload.risk_map_csv=$RiskCsv;$payload.safe_parser_plan_csv=$PlanCsv;$payload.stop_gates_csv=$StopCsv;$payload.next_research_csv=$NextCsv
J $payload|Set-Content -LiteralPath (Join-Path $DataDir "UAOS_V1723_PCM_PARSER_FEASIBILITY_MAP.json") -Encoding UTF8

@("# CodeX V1724 Next Tasks","","Task 1: Read V1723 Tier 1/Tier 2 selection and risk map.","Task 2: For LOW_RISK and MEDIUM_RISK rows only, create readonly PCM header marker research.","Task 3: Read small header windows only and stop at unknown/protected/compressed content.","Task 4: Do not decode samples, do not extract payloads, do not write keyboard binary files.","Hard gates: no cracking, no binary output, no USB, no hardware load, no PA3X-ready claim.")|Set-Content -LiteralPath $CodeXMd -Encoding UTF8

$html=@("<!doctype html><html><head><meta charset='utf-8'><title>UAOS V1723 PCM Parser Feasibility</title><style>body{font-family:Segoe UI,Arial;background:#07101d;color:#eef5ff;padding:28px}.card{background:#101d32;border:1px solid #263a59;border-radius:14px;padding:16px;margin:10px 0}.num{font-size:28px;font-weight:800}.btn{display:inline-block;background:#173456;color:white;padding:10px;margin:4px;border-radius:10px;text-decoration:none}.ok{background:#12351f;border:1px solid #32a062;padding:8px 12px;border-radius:999px;display:inline-block}</style></head><body>",
"<h1>UAOS V1723 Readonly PCM Parser Feasibility Map</h1><div class='ok'>Status: "+(ConvertTo-UaosHtmlSafe $status)+"</div>",
"<div class='card'>Parser readiness rows<div class='num'>$totalParser</div></div><div class='card'>Selected Tier 1/Tier 2<div class='num'>$selectedCount</div></div><div class='card'>Tier 1 / Tier 2<div class='num'>$tier1 / $tier2</div></div><div class='card'>Risk rows<div class='num'>$riskCount</div></div><div class='card'>Low / Medium / High / Stop Risk<div class='num'>$low / $med / $high / $stop</div></div><div class='card'>Stop gates<div class='num'>$stopCount</div></div>",
"<div class='card'><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Uri $TierCsv))+"'>Tier Selection</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Uri $RiskCsv))+"'>Risk Map</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Uri $PlanCsv))+"'>Safe Parser Plan</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Uri $StopCsv))+"'>Stop Gates</a><a class='btn' href='"+(ConvertTo-UaosHtmlSafe (Uri $ValidationJson))+"'>Validation</a></div>",
"<div class='card'>Readonly feasibility only. No cracking. No binary output. No USB. No hardware load.</div></body></html>")
$html|Set-Content -LiteralPath $PortalHtml -Encoding UTF8

$v=""|Select-Object phase,revision,status,source_v1722_parser_map,source_v1722_owner_gate,parser_readiness_rows,owner_gate_rows,selected_tier1_tier2_count,tier1_count,tier2_count,risk_rows,plan_rows,stop_gate_count,low_risk,medium_risk,high_risk,stop_risk,no_cracking,no_binary_keyboard_output,no_usb,no_hardware_load,commercial_status,recommended_next_phase,portal,tier_selection_csv,risk_map_csv,safe_parser_plan_csv,stop_gates_csv,next_research_csv,package,package_sha256
$v.phase="UAOS V1723";$v.revision=$Revision;$v.status=$status;$v.source_v1722_parser_map=$ParserCsv;$v.source_v1722_owner_gate=$OwnerCsv;$v.parser_readiness_rows=$totalParser;$v.owner_gate_rows=$totalOwner;$v.selected_tier1_tier2_count=$selectedCount;$v.tier1_count=$tier1;$v.tier2_count=$tier2;$v.risk_rows=$riskCount;$v.plan_rows=$planCount;$v.stop_gate_count=$stopCount;$v.low_risk=$low;$v.medium_risk=$med;$v.high_risk=$high;$v.stop_risk=$stop;$v.no_cracking=$true;$v.no_binary_keyboard_output=$true;$v.no_usb=$true;$v.no_hardware_load=$true;$v.commercial_status="NEEDS_LICENSE_REVIEW_BEFORE_SALE";$v.recommended_next_phase="UAOS V1724 READONLY_PCM_HEADER_MARKER_RESEARCH";$v.portal=$PortalHtml;$v.tier_selection_csv=$TierCsv;$v.risk_map_csv=$RiskCsv;$v.safe_parser_plan_csv=$PlanCsv;$v.stop_gates_csv=$StopCsv;$v.next_research_csv=$NextCsv;$v.package=$ZipPath;$v.package_sha256=""
J $v|Set-Content -LiteralPath $ValidationJson -Encoding UTF8

@("# UAOS V1723 Readonly PCM Parser Feasibility Map Report","","Status: $status","Parser readiness rows: $totalParser","Owner gate rows: $totalOwner","Selected Tier 1/Tier 2 rows: $selectedCount","Tier 1: $tier1","Tier 2: $tier2","Risk rows: $riskCount","Plan rows: $planCount","Stop gates: $stopCount","Low risk: $low","Medium risk: $med","High risk: $high","Stop risk: $stop","","Safety: no cracking, no binary output, no USB, no hardware load.","Recommended next: UAOS V1724 READONLY PCM HEADER MARKER RESEARCH")|Set-Content -LiteralPath $ReportMd -Encoding UTF8
@("# UAOS V1723 Readonly PCM Parser Feasibility Map Seal","","Status: $status","Selected Tier 1/Tier 2 rows: $selectedCount","Risk rows: $riskCount","Stop gates: $stopCount","No cracking: TRUE","No binary keyboard output: TRUE")|Set-Content -LiteralPath $SealMd -Encoding UTF8

Log "Packaging V1723 metadata only" "STEP" Cyan
$stage=Join-Path ([IO.Path]::GetTempPath()) ("v1723_"+[guid]::NewGuid().ToString("N"));Mk $stage
foreach($d in @($DataDir,$WorkspaceDir,$ReportsDir,$ValidationDir,$SealDir,$LogsDir,$ParserDir,$GateDir,$NextDir)){if(Test-Path -LiteralPath $d){Copy-Item -LiteralPath $d -Destination (Join-Path $stage (Split-Path $d -Leaf)) -Recurse -Force}}
if(Test-Path -LiteralPath $ZipPath){Remove-Item -LiteralPath $ZipPath -Force}
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $ZipPath -Force
Remove-Item -LiteralPath $stage -Recurse -Force
$hash=Sha $ZipPath
($hash+"  "+(Split-Path $ZipPath -Leaf))|Set-Content -LiteralPath $ShaPath -Encoding UTF8
$v.package_sha256=$hash
J $v|Set-Content -LiteralPath $ValidationJson -Encoding UTF8

$p=""|Select-Object current_pcm_parser_feasibility,status,revision,phase_root,portal,validation,risk_map_csv,safe_parser_plan_csv,stop_gates_csv,recommended_next_phase,package,package_sha256
$p.current_pcm_parser_feasibility="UAOS V1723 READONLY_PCM_PARSER_FEASIBILITY_MAP";$p.status=$status;$p.revision=$Revision;$p.phase_root=$PhaseRoot;$p.portal=$PortalHtml;$p.validation=$ValidationJson;$p.risk_map_csv=$RiskCsv;$p.safe_parser_plan_csv=$PlanCsv;$p.stop_gates_csv=$StopCsv;$p.recommended_next_phase="UAOS V1724 READONLY_PCM_HEADER_MARKER_RESEARCH";$p.package=$ZipPath;$p.package_sha256=$hash
J $p|Set-Content -LiteralPath $PointerJson -Encoding UTF8
@("# UAOS PCM Parser Feasibility Status","","Current: UAOS V1723 READONLY_PCM_PARSER_FEASIBILITY_MAP","Status: $status","Portal: $PortalHtml","Risk map: $RiskCsv","Safe parser plan: $PlanCsv","Stop gates: $StopCsv","Recommended next: UAOS V1724 READONLY PCM HEADER MARKER RESEARCH","Package: $ZipPath","SHA256: $hash")|Set-Content -LiteralPath $StatusDoc -Encoding UTF8

Log "Local git commit only" "STEP" Cyan
$GitStatus="SKIPPED_BY_FLAG";$GitHash=""
if(!$NoGitCommit){
 try{
  if((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))){
   Push-Location $RepoRoot
   try{
    git add -f -- "uaos-ai-factory/$ScriptName" "uaos-ai-factory/uaos-v1723-readonly-pcm-parser-feasibility-map" "uaos-ai-factory/UAOS_CURRENT_PCM_PARSER_FEASIBILITY.json" "docs/UAOS_PCM_PARSER_FEASIBILITY_STATUS.md"|Out-Null
    $st=((git status --porcelain)|Out-String)
    if([string]::IsNullOrWhiteSpace($st)){$GitStatus="NO_CHANGES"}else{git commit -m "UAOS V1723 readonly PCM parser feasibility map"|Out-Null;if($LASTEXITCODE -eq 0){$GitHash=(git rev-parse --short HEAD).Trim();$GitStatus="COMMITTED"}else{$GitStatus="COMMIT_FAILED"}}
   }finally{Pop-Location}
  }
 }catch{$GitStatus="COMMIT_FAILED: "+$_.Exception.Message;Log $GitStatus "WARN" Yellow}
}

Write-Host "";Log "UAOS V1723 READONLY PCM PARSER FEASIBILITY MAP complete" "PASS" Green
Write-Host ("Status: "+$status);Write-Host ("Portal: "+$PortalHtml);Write-Host ("Tier selection: "+$TierCsv);Write-Host ("Risk map: "+$RiskCsv);Write-Host ("Safe parser plan: "+$PlanCsv);Write-Host ("Stop gates: "+$StopCsv);Write-Host ("Validation: "+$ValidationJson);Write-Host ("Package: "+$ZipPath);Write-Host ("Package SHA256: "+$hash);Write-Host ("Git: "+$GitStatus);if($GitHash){Write-Host ("Git hash: "+$GitHash)}
if(!$NoOpen){Start-Process $PortalHtml}
if($status -ne $StatusReady){exit 2}
exit 0

