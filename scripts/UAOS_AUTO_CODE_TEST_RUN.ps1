Write-Host "UAOS AUTO TEST SCRIPT WORKING" -ForegroundColor Green

$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"

Write-Host "ROOT: $Root"
Write-Host "APP: $App"

if(Test-Path $App){
  Write-Host "UAOS FOUND" -ForegroundColor Green
} else {
  Write-Host "UAOS MISSING" -ForegroundColor Red
  exit
}

Set-Location $App

Write-Host "RUNNING NPM INSTALL..."
npm install

Write-Host "RUNNING BUILD..."
npm run build

Write-Host "STARTING DEV SERVER..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$App`"; npm run dev -- --host 127.0.0.1"

Start-Sleep 8

try{
  $r=Invoke-WebRequest "http://127.0.0.1:5173" -UseBasicParsing
  Write-Host "SERVER PASS: $($r.StatusCode)" -ForegroundColor Green
}catch{
  Write-Host "SERVER FAIL" -ForegroundColor Red
}

Start-Process "http://127.0.0.1:5173"
