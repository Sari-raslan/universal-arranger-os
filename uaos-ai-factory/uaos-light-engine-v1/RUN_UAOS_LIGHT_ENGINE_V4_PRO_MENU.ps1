$ErrorActionPreference="Continue"
$Project = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-light-engine-v1"
$ServerUrl = "http://localhost:3000"

function Start-Server {
  cd $Project
  $p = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
  if ($p) {
    Write-Host "Server already running on port 3000." -ForegroundColor Yellow
  } else {
    Write-Host "Starting UAOS Light Engine server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","cd `"$Project`"; npm start"
    Start-Sleep -Seconds 4
  }
}

function Emergency-Stop {
  try {
    Invoke-RestMethod -Uri "$ServerUrl/api/v4/emergency-stop" -Method Post
    Write-Host "Emergency Stop sent." -ForegroundColor Green
  } catch {
    Write-Host "Server not reachable. Start server first." -ForegroundColor Red
  }
  pause
}

while ($true) {
  Clear-Host
  Write-Host "=========================================================" -ForegroundColor Cyan
  Write-Host " UAOS LIGHT ENGINE V4 PRO - LOCAL CONTROLLER" -ForegroundColor Cyan
  Write-Host "=========================================================" -ForegroundColor Cyan
  Write-Host "1 Open V4 Dashboard"
  Write-Host "2 Start Engine Server"
  Write-Host "3 Stop Engine Server"
  Write-Host "4 Open Config Folder"
  Write-Host "5 Open Reports"
  Write-Host "6 Emergency Stop"
  Write-Host "7 Open V3/V3.1 Fallback if exists"
  Write-Host "8 Exit"
  $c = Read-Host "Select"

  switch ($c) {
    "1" { Start-Server; Start-Process "$ServerUrl/src/ui/v4/index.html" }
    "2" { Start-Server; pause }
    "3" { Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Write-Host "Server stopped."; pause }
    "4" { Start-Process explorer.exe "$Project\src\config" }
    "5" { Start-Process explorer.exe "$Project\generated" }
    "6" { Emergency-Stop }
    "7" {
      $v31 = Join-Path $Project "START_UAOS_LIGHT_ENGINE_V31_PRO.cmd"
      $v3  = Join-Path $Project "START_UAOS_LIGHT_ENGINE_V3_HYBRID.cmd"
      $v3old = Join-Path $Project "START_UAOS_LIGHT_ENGINE_V3.cmd"
      if (Test-Path $v31) { Start-Process $v31 }
      elseif (Test-Path $v3) { Start-Process $v3 }
      elseif (Test-Path $v3old) { Start-Process $v3old }
      else { Write-Host "No V3/V3.1 fallback launcher found." -ForegroundColor Red; pause }
    }
    "8" { exit }
  }
}
