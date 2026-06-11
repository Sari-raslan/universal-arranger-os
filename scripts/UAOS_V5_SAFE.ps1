$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "UAOS V5 SAFE START" -ForegroundColor Cyan

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "INSTALL..." -ForegroundColor Yellow
npm install --prefix backend
npm install --prefix uaos-live-clean

Write-Host "BUILD..." -ForegroundColor Yellow
npm run build --prefix uaos-live-clean

Write-Host "START BACKEND..." -ForegroundColor Yellow
Start-Process powershell -WindowStyle Minimized -ArgumentList @(
 "-NoExit",
 "-Command",
 "cd `"$Root`"; node backend/server.js"
)

Start-Sleep 3

Write-Host "START FRONTEND..." -ForegroundColor Yellow
Start-Process powershell -WindowStyle Minimized -ArgumentList @(
 "-NoExit",
 "-Command",
 "cd `"$Root\uaos-live-clean`"; npm run preview"
)

Start-Sleep 5

try{
 $b = Invoke-WebRequest "http://127.0.0.1:5199/health" -UseBasicParsing
 Write-Host "BACKEND PASS $($b.StatusCode)" -ForegroundColor Green
}catch{
 Write-Host "BACKEND FAIL" -ForegroundColor Red
}

try{
 $f = Invoke-WebRequest "http://127.0.0.1:5180" -UseBasicParsing
 Write-Host "FRONTEND PASS $($f.StatusCode)" -ForegroundColor Green
 Start-Process "http://127.0.0.1:5180"
}catch{
 Write-Host "FRONTEND FAIL" -ForegroundColor Red
}
