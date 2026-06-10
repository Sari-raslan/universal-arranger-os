$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Script = "$Root\scripts\UAOS_RUNTIME_WATCHDOG.ps1"

$Action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-ExecutionPolicy Bypass -File `"$Script`""

$Trigger = New-ScheduledTaskTrigger `
  -Once `
  -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes 30)

Register-ScheduledTask `
  -TaskName "UAOS Runtime Watchdog" `
  -Action $Action `
  -Trigger $Trigger `
  -Description "UAOS runtime recovery and validation watchdog" `
  -Force

Write-Host "UAOS Runtime Watchdog installed" -ForegroundColor Green
