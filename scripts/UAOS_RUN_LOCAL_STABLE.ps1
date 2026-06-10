$Repo="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Frontend="$Repo\frontend"
$Report="$Repo\reports\UAOS_LOCAL_STABLE_RUN.txt"

New-Item -ItemType Directory -Force "$Repo\reports" | Out-Null

"UAOS LOCAL STABLE RUN" | Set-Content $Report -Encoding UTF8
"TIME: $(Get-Date)" | Out-File $Report -Append

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

cd $Repo
npm run build 2>&1 | Tee-Object -FilePath $Report -Append

if($LASTEXITCODE -ne 0){
  "BUILD FAILED" | Out-File $Report -Append
  notepad $Report
  exit 1
}

Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; npm run dev"
Start-Sleep 4

Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Frontend'; npx vite preview --host 127.0.0.1 --port 5180 --strictPort"
Start-Sleep 5

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

Start-Process "http://127.0.0.1:5180"
notepad $Report
