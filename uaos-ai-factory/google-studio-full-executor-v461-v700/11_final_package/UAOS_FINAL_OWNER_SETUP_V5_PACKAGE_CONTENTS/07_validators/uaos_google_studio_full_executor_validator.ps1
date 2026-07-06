$ErrorActionPreference='Stop'
$target='E:\keyboard-manager-clean\uaos-ai-factory\google-studio-full-executor-v461-v700'
$required=@(
'04_final_owner_setup_v5\UAOS_FINAL_OWNER_SETUP_V5_HOME.html',
'04_final_owner_setup_v5\UAOS_FINAL_OWNER_SETUP_V5_DECISION_CENTER.html',
'04_final_owner_setup_v5\UAOS_FINAL_OWNER_SETUP_V5_SAFETY_CENTER.html',
'05_writer_track_status\UAOS_WRITER_TRACK_STATUS.json',
'06_safety_evidence\UAOS_MASTER_SAFETY_EVIDENCE_INDEX.md',
'08_dashboards\UAOS_GOOGLE_STUDIO_FULL_EXECUTOR_DASHBOARD.html',
'10_owner_gates\UAOS_FINAL_OWNER_DECISION_GATE_AFTER_V700.md',
'11_final_package\UAOS_FINAL_OWNER_SETUP_V5_PACKAGE.zip',
'13_seal\UAOS_GOOGLE_STUDIO_FULL_EXECUTOR_FINAL_SEAL.md'
)
$missing=@()
foreach($r in $required){ if(!(Test-Path (Join-Path $target $r))){ $missing += $r } }
$forbiddenExt=@('.STY','.SET','.PRS','.PRF','.KST')
$violations=@()
Get-ChildItem $target -Recurse -File | ForEach-Object {
  if($forbiddenExt -contains $_.Extension.ToUpper()){ $violations += $_.FullName }
}
$writerStatusPath=Join-Path $target '05_writer_track_status\UAOS_WRITER_TRACK_STATUS.json'
$writerOk=$false
if(Test-Path $writerStatusPath){
  $ws=Get-Content $writerStatusPath -Raw | ConvertFrom-Json
  $writerOk = ($ws.writer_ready -eq $false -and $ws.real_writer_implemented -eq $false)
}
$pass = ($missing.Count -eq 0 -and $violations.Count -eq 0 -and $writerOk)
$result=[ordered]@{
  validator_pass=$pass
  missing=$missing
  forbidden_extension_violations=$violations
  writer_ready_false=$writerOk
  timestamp=(Get-Date).ToString('s')
}
$result | ConvertTo-Json -Depth 20 | Out-File (Join-Path $target '07_validators\UAOS_GOOGLE_STUDIO_FULL_EXECUTOR_RESULTS.json') -Encoding utf8
if(!$pass){ throw 'UAOS validator failed. Check UAOS_GOOGLE_STUDIO_FULL_EXECUTOR_RESULTS.json' }
Write-Host 'UAOS VALIDATOR PASS' -ForegroundColor Green
