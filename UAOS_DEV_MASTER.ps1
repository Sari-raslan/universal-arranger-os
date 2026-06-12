Write-Host "=================================" -ForegroundColor Cyan
Write-Host "UAOS DEV MASTER START" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$Agents=@(
".\scripts\agents\AUDIO_AGENT.ps1",
".\scripts\agents\MIDI_AGENT.ps1",
".\scripts\agents\BUILD_AGENT.ps1",
".\scripts\agents\DEPLOY_AGENT.ps1",
".\scripts\agents\WATCH_AGENT.ps1"
)

foreach($a in $Agents){

  Write-Host ""
  Write-Host "RUNNING $a" -ForegroundColor Yellow

  powershell -ExecutionPolicy Bypass -File $a
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "UAOS DEV MASTER DONE" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Start-Process "https://universal-arranger-os.vercel.app"
