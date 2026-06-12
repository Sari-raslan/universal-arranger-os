$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
$ReportDir="$Root\reports"
New-Item -ItemType Directory -Force $ReportDir, "$Root\release-kit" | Out-Null

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Log="$ReportDir\UAOS_BLIND_DEPLOY_FULL_$Stamp.txt"

function L($m){
  $x="[UAOS BLIND] $m"
  Write-Host $x -ForegroundColor Cyan
  $x | Out-File -LiteralPath $Log -Append -Encoding utf8
}

function F($m){
  L "FAIL: $m"
  notepad $Log
  exit 1
}

L "START FULL BLIND DEPLOY"

if(!(Test-Path $App)){ F "App missing: $App" }

Set-Location $App

L "1 npm install"
npm install 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
if($LASTEXITCODE -ne 0){ F "npm install failed" }

L "2 build"
npm run build 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
if($LASTEXITCODE -ne 0){ F "build failed" }

if(!(Test-Path "$App\dist\index.html")){ F "dist/index.html missing" }
L "PASS build"

L "3 preview test"
$Preview=Start-Process powershell -PassThru -WindowStyle Minimized -ArgumentList "-NoExit","-Command","cd `"$App`"; npx vite preview --host 127.0.0.1 --port 5188"
Start-Sleep 7

try{
  $r=Invoke-WebRequest "http://127.0.0.1:5188" -UseBasicParsing -TimeoutSec 12
  L "PASS preview: $($r.StatusCode)"
}catch{
  F "preview failed: $($_.Exception.Message)"
}

L "4 git commit"
Set-Location $Root
git add . 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
git diff --cached --quiet
if($LASTEXITCODE -ne 0){
  git commit -m "UAOS full blind deploy update" 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
  L "PASS commit"
}else{
  L "No changes to commit"
}

L "5 git push"
git push 2>&1 | Tee-Object -FilePath $Log -Append
if($LASTEXITCODE -ne 0){
  L "WARNING git push failed; continuing deploy"
}

L "6 vercel production deploy"
Set-Location $App
vercel --prod --yes 2>&1 | Tee-Object -FilePath $Log -Append
if($LASTEXITCODE -ne 0){
  F "vercel deploy failed"
}

L "7 public check"
$Public="https://universal-arranger-os.vercel.app"
Start-Sleep 5

try{
  $p=Invoke-WebRequest $Public -UseBasicParsing -TimeoutSec 20
  L "PASS public: $Public => $($p.StatusCode)"
}catch{
  L "WARNING public check failed: $($_.Exception.Message)"
}

@"
UAOS FULL BLIND DEPLOY DONE
===========================
Time: $(Get-Date)
Public: https://universal-arranger-os.vercel.app
Preview: http://127.0.0.1:5188
Report: $Log
"@ | Set-Content "$Root\release-kit\UAOS_FULL_BLIND_DEPLOY_DONE.txt" -Encoding utf8

L "DONE"
Start-Process $Public
notepad $Log
