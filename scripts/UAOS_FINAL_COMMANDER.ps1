$Repo="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Frontend="$Repo\frontend"
$Report="$Repo\reports\UAOS_FINAL_COMMANDER_REPORT.txt"

New-Item -ItemType Directory -Force "$Repo\reports","$Repo\scripts" | Out-Null
"UAOS FINAL COMMANDER" | Set-Content $Report -Encoding UTF8
"TIME: $(Get-Date)" | Out-File $Report -Append

function Step($x){
  Write-Host "`n===== $x =====" -ForegroundColor Cyan
  "`n===== $x =====" | Out-File $Report -Append
}

Step "STOP OLD SERVERS"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

Step "BUILD"
cd $Repo
npm run build 2>&1 | Tee-Object -FilePath $Report -Append
if($LASTEXITCODE -ne 0){ notepad $Report; exit 1 }

Step "START BACKEND"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; npm run dev"
Start-Sleep 5

Step "START FRONTEND PREVIEW"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Frontend'; npx vite preview --host 127.0.0.1 --port 5180 --strictPort"
Start-Sleep 5

Step "LOCAL CHECK"
try {
  $f=Invoke-WebRequest "http://127.0.0.1:5180" -UseBasicParsing -TimeoutSec 10
  "FRONTEND: PASS $($f.StatusCode)" | Out-File $Report -Append
} catch {
  "FRONTEND: FAIL $($_.Exception.Message)" | Out-File $Report -Append
}

try {
  $b=Invoke-WebRequest "http://localhost:8090/health" -UseBasicParsing -TimeoutSec 10
  "BACKEND: PASS $($b.StatusCode)" | Out-File $Report -Append
} catch {
  "BACKEND: FAIL $($_.Exception.Message)" | Out-File $Report -Append
}

Step "RELEASE GATE"
powershell -ExecutionPolicy Bypass -File "$Repo\scripts\UAOS_RELEASE_GATE.ps1" 2>&1 | Tee-Object -FilePath $Report -Append

Step "GIT SAVE"
cd $Repo
git add scripts reports frontend backend v2-runtime v3-future runtime-control docs ops 2>$null
git commit -m "Final offline commander verification package" 2>&1 | Tee-Object -FilePath $Report -Append
git push origin v2/core-runtime-alpha 2>&1 | Tee-Object -FilePath $Report -Append

Step "TOMORROW DEPLOY COMMAND"
@"
TOMORROW:
cd "$Repo"
git pull
npm run build
powershell -ExecutionPolicy Bypass -File ".\scripts\UAOS_RELEASE_GATE.ps1"
vercel deploy --prod --yes
"@ | Out-File $Report -Append

Start-Process "http://127.0.0.1:5180"
notepad $Report
