$ErrorActionPreference="Stop"
$Project = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-light-engine-v1"
$BaseUrl = "http://localhost:3000"

function Start-UAOSServerIfNeeded {
  try { Invoke-RestMethod -Uri "$BaseUrl/api/music/status" -Method GET -TimeoutSec 2 | Out-Null }
  catch {
    Write-Host "Starting server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","cd `"$Project`"; npm start"
    Start-Sleep -Seconds 4
  }
}

function Open-V4Dashboard {
  Start-UAOSServerIfNeeded
  Start-Process "$Project\src\ui\v4\index.html"
}

function Run-ExistingV3 {
  $v31 = Join-Path $Project "START_UAOS_LIGHT_ENGINE_V31_PRO.cmd"
  $v3 = Join-Path $Project "START_UAOS_LIGHT_ENGINE_V3_HYBRID.cmd"
  if (Test-Path $v31) { Start-Process $v31 }
  elseif (Test-Path $v3) { Start-Process $v3 }
  else { Write-Host "No V3 fallback launcher found." -ForegroundColor Red }
}

function EmergencyStop {
  Start-UAOSServerIfNeeded
  Invoke-RestMethod -Uri "$BaseUrl/api/music/emergency-stop" -Method POST -Body "{}" -ContentType "application/json" | Out-Null
  Write-Host "Emergency Stop sent." -ForegroundColor Green
}

while($true){
  Clear-Host
  Write-Host "====================================" -ForegroundColor Cyan
  Write-Host " UAOS Light Engine V4 PRO" -ForegroundColor Cyan
  Write-Host "====================================" -ForegroundColor Cyan
  Write-Host "1 Open V4 Dashboard"
  Write-Host "2 Party Mode (existing V3/V3.1 launcher)"
  Write-Host "3 Oriental Live (existing V3/V3.1 launcher)"
  Write-Host "4 Calm (existing V3/V3.1 launcher)"
  Write-Host "5 Candle (V4 scene config)"
  Write-Host "6 Fireplace (V4 scene config)"
  Write-Host "7 Scene Studio"
  Write-Host "8 Favorites"
  Write-Host "9 Manual BPM"
  Write-Host "10 Emergency Stop"
  Write-Host "11 Open Logs"
  Write-Host "12 Exit"
  $c = Read-Host "Choose 1-12"
  switch($c){
    "1" { Open-V4Dashboard; Read-Host "Press ENTER" | Out-Null }
    "2" { Run-ExistingV3 }
    "3" { Run-ExistingV3 }
    "4" { Run-ExistingV3 }
    "5" { Open-V4Dashboard; Write-Host "Candle scene available in V4 dashboard/config."; Read-Host "Press ENTER" | Out-Null }
    "6" { Open-V4Dashboard; Write-Host "Fireplace scene available in V4 dashboard/config."; Read-Host "Press ENTER" | Out-Null }
    "7" { Open-V4Dashboard; Read-Host "Press ENTER" | Out-Null }
    "8" { Open-V4Dashboard; Read-Host "Press ENTER" | Out-Null }
    "9" { Run-ExistingV3 }
    "10" { EmergencyStop; Read-Host "Press ENTER" | Out-Null }
    "11" { Start-Process explorer.exe "$Project\generated"; Read-Host "Press ENTER" | Out-Null }
    "12" { break }
    default { Write-Host "Invalid choice"; Start-Sleep -Seconds 1 }
  }
}