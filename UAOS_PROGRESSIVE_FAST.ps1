Write-Host "UAOS PROGRESSIVE FAST AUTO" -ForegroundColor Cyan

$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
$Public="https://universal-arranger-os.vercel.app"

if(!(Test-Path $App)){
  Write-Host "APP MISSING" -ForegroundColor Red
  exit
}

Set-Location $App

Write-Host "STEP 1 BUILD..." -ForegroundColor Yellow
npm run build

if($LASTEXITCODE -ne 0){
  Write-Host "BUILD FAIL" -ForegroundColor Red
  exit
}

Write-Host "BUILD PASS" -ForegroundColor Green

Write-Host "STEP 2 LOCAL DEV..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$App`"; npm run dev -- --host 127.0.0.1 --port 5180"

Start-Sleep 8

try{
  $r=Invoke-WebRequest "http://127.0.0.1:5180" -UseBasicParsing
  Write-Host "LOCAL PASS: $($r.StatusCode)" -ForegroundColor Green
}catch{
  Write-Host "LOCAL FAIL" -ForegroundColor Red
}

Write-Host "STEP 3 DEPLOY..." -ForegroundColor Yellow

vercel --prod --yes

if($LASTEXITCODE -eq 0){
  Write-Host "DEPLOY PASS" -ForegroundColor Green
}else{
  Write-Host "DEPLOY FAIL" -ForegroundColor Red
}

Start-Sleep 8

Write-Host "STEP 4 PUBLIC HEALTH..." -ForegroundColor Yellow

$Urls=@(
  $Public,
  "$Public/#/",
  "$Public/#/audio",
  "$Public/#/midi",
  "$Public/#/sounds",
  "$Public/#/sampler",
  "$Public/#/pricing",
  "$Public/#/downloads"
)

foreach($u in $Urls){

  try{
    $x=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 20
    Write-Host "PASS $u => $($x.StatusCode)" -ForegroundColor Green
  }catch{
    Write-Host "FAIL $u" -ForegroundColor Red
  }
}

Start-Process "http://127.0.0.1:5180"
Start-Process $Public

Write-Host "UAOS AUTO PIPELINE READY" -ForegroundColor Cyan
