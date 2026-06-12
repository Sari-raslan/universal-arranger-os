$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
$Reports="$Root\reports"
$Kit="$Root\release-kit"

New-Item -ItemType Directory -Force $Reports,$Kit | Out-Null

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Log="$Reports\UAOS_ONE_CLICK_BLIND_RELEASE_$Stamp.txt"

function L($m){
  $x="[UAOS RELEASE] $m"
  Write-Host $x -ForegroundColor Cyan
  $x | Out-File -LiteralPath $Log -Append -Encoding utf8
}

function FAIL($m){
  L "FAIL: $m"
  notepad $Log
  exit 1
}

$Public="https://universal-arranger-os.vercel.app"

L "START ONE CLICK BLIND RELEASE"
L "Root: $Root"
L "App: $App"

if(!(Test-Path $App)){ FAIL "App folder missing" }

Set-Location $App

L "1 npm install"
npm install 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
if($LASTEXITCODE -ne 0){ FAIL "npm install failed" }

L "2 build"
npm run build 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
if($LASTEXITCODE -ne 0){ FAIL "build failed" }

if(!(Test-Path "$App\dist\index.html")){ FAIL "dist/index.html missing" }
L "PASS build"

L "3 local preview"
$PreviewProc=Start-Process powershell -PassThru -WindowStyle Minimized -ArgumentList "-NoExit","-Command","cd `"$App`"; npx vite preview --host 127.0.0.1 --port 5190"
Start-Sleep 8

try{
  $r=Invoke-WebRequest "http://127.0.0.1:5190" -UseBasicParsing -TimeoutSec 15
  L "PASS local preview => $($r.StatusCode)"
}catch{
  FAIL "local preview failed: $($_.Exception.Message)"
}

L "4 git save"
Set-Location $Root
git add . 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
git diff --cached --quiet

if($LASTEXITCODE -ne 0){
  git commit -m "UAOS one click blind release $Stamp" 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
  L "PASS git commit"
}else{
  L "No git changes"
}

L "5 git push"
git push 2>&1 | Tee-Object -FilePath $Log -Append
if($LASTEXITCODE -ne 0){
  L "WARNING git push failed; continuing Vercel deploy"
}

L "6 Vercel production deploy"
Set-Location $App
vercel --prod --yes 2>&1 | Tee-Object -FilePath $Log -Append
if($LASTEXITCODE -ne 0){ FAIL "Vercel deploy failed" }

L "7 public health check"

$Urls=@(
  "$Public",
  "$Public/#/",
  "$Public/#/audio",
  "$Public/#/midi",
  "$Public/#/sounds",
  "$Public/#/sampler",
  "$Public/#/pricing",
  "$Public/#/downloads",
  "$Public/#/promo"
)

$FailCount=0

foreach($u in $Urls){
  try{
    $x=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 20
    if($x.StatusCode -ge 200 -and $x.StatusCode -lt 400){
      L "PASS $u => $($x.StatusCode)"
    }else{
      L "FAIL $u => $($x.StatusCode)"
      $FailCount++
    }
  }catch{
    L "FAIL $u => $($_.Exception.Message)"
    $FailCount++
  }
}

if($FailCount -gt 0){
  L "WARNING: health check has $FailCount failed routes"
}else{
  L "PASS all public routes"
}

$Result="$Kit\UAOS_ONE_CLICK_BLIND_RELEASE_RESULT.txt"

@"
UAOS ONE CLICK BLIND RELEASE
============================

Time:
$(Get-Date)

Status:
Build: PASS
Local Preview: PASS
Deploy: COMPLETED
Health Fail Count: $FailCount

Public URL:
$Public

Local Preview:
http://127.0.0.1:5190

Report:
$Log

Next daily command:
powershell -ExecutionPolicy Bypass -File ".\UAOS_ONE_CLICK_BLIND_RELEASE.ps1"

Rollback note:
If public deploy is broken, open Vercel dashboard and restore previous production deployment.
"@ | Set-Content -LiteralPath $Result -Encoding utf8

L "DONE ONE CLICK BLIND RELEASE"
L "Result file: $Result"

Start-Process $Public
notepad $Result
notepad $Log
