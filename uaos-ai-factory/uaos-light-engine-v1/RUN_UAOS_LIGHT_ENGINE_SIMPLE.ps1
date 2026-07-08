$ErrorActionPreference="Continue"
$Project = "E:\keyboard-manager-clean\uaos-ai-factory\uaos-light-engine-v1"
$Url = "http://localhost:3000/src/ui/v5/index.html"
$Local = Join-Path $Project "src\ui\v5\index.html"

function Port-Open {
  return [bool](Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue)
}

function Wait-Server {
  for($i=0; $i -lt 20; $i++){
    try {
      Invoke-RestMethod -Uri "http://localhost:3000/api/v4/status" -Method GET -TimeoutSec 1 | Out-Null
      return $true
    } catch { Start-Sleep -Milliseconds 700 }
  }
  return $false
}

Clear-Host
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " UAOS Light Engine - Simple Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

cd $Project

if (Port-Open) {
  Write-Host "Engine server already running." -ForegroundColor Yellow
} else {
  Write-Host "Starting engine server..." -ForegroundColor Green
  Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","cd `"$Project`"; npm start"
}

if (Wait-Server) {
  Write-Host "Opening simple app..." -ForegroundColor Green
  Start-Process $Url
} else {
  Write-Host "Server did not respond fast enough. Opening local UI fallback." -ForegroundColor Yellow
  if (Test-Path $Local) { Start-Process $Local }
  Write-Host "If buttons do not control lights, start server manually from V4 PRO launcher." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done. You can close this window." -ForegroundColor Green
Start-Sleep -Seconds 3