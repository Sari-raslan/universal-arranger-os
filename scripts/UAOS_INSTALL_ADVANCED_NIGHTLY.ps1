$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Script = "$Root\scripts\UAOS_ADVANCED_NIGHTLY_WORKER.ps1"

$Action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-ExecutionPolicy Bypass -File `"$Script`""

$Trigger = New-ScheduledTaskTrigger -Daily -At 3:00AM

Register-ScheduledTask `
  -TaskName "UAOS Advanced Nightly Worker" `
  -Action $Action `
  -Trigger $Trigger `
  -Description "Run UAOS advanced V2/V3 checks every night" `
  -Force

Write-Host "UAOS Advanced Nightly Worker installed for 3:00 AM daily" -ForegroundColor Green
