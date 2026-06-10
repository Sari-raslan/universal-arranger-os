$Repo="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Report="$Repo\reports\UAOS_RELEASE_GATE_REPORT.txt"

New-Item -ItemType Directory -Force "$Repo\reports" | Out-Null

"UAOS RELEASE GATE" | Set-Content $Report -Encoding UTF8
"TIME: $(Get-Date)" | Out-File $Report -Append

cd $Repo

$ok=$true

"CHECK: BUILD" | Out-File $Report -Append
npm run build 2>&1 | Tee-Object -FilePath $Report -Append
if($LASTEXITCODE -ne 0){ $ok=$false }

try {
  $f=Invoke-WebRequest "http://127.0.0.1:5180" -UseBasicParsing -TimeoutSec 10
  "FRONTEND PREVIEW: PASS $($f.StatusCode)" | Out-File $Report -Append
} catch {
  "FRONTEND PREVIEW: FAIL $($_.Exception.Message)" | Out-File $Report -Append
  $ok=$false
}

try {
  $b=Invoke-WebRequest "http://localhost:8090/health" -UseBasicParsing -TimeoutSec 10
  "BACKEND HEALTH: PASS $($b.StatusCode)" | Out-File $Report -Append
} catch {
  "BACKEND HEALTH: FAIL $($_.Exception.Message)" | Out-File $Report -Append
  $ok=$false
}

if($ok){
  "RELEASE GATE: PASS" | Out-File $Report -Append
  Write-Host "RELEASE GATE PASS ✅" -ForegroundColor Green
}else{
  "RELEASE GATE: FAIL" | Out-File $Report -Append
  Write-Host "RELEASE GATE FAIL ❌" -ForegroundColor Red
}

notepad $Report
