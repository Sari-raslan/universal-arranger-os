Write-Host "UAOS SAFE DEV MASTER" -ForegroundColor Cyan

$Agents=@(
".\scripts\agents\AUDIO_AGENT_REAL.ps1",
".\scripts\agents\MIDI_AGENT_REAL.ps1",
".\scripts\agents\BUILD_AGENT_STRICT.ps1",
".\scripts\agents\WATCH_AGENT_FULL.ps1"
)

foreach($a in $Agents){

  Write-Host ""
  Write-Host "RUNNING $a" -ForegroundColor Yellow

  powershell -ExecutionPolicy Bypass -File $a

  Write-Host "COOLDOWN..." -ForegroundColor DarkGray
  Start-Sleep -Seconds 8
}

Write-Host ""
Write-Host "SAFE MODE COMPLETE" -ForegroundColor Green
