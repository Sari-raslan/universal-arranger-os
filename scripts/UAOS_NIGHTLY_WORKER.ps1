$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$ReportDir = "$Root\reports"
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$Report = "$ReportDir\UAOS_NIGHTLY_REPORT.txt"

function Log($m){
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"
  Write-Host $line
  Add-Content -LiteralPath $Report -Value $line -Encoding UTF8
}

cd $Root
Log "UAOS nightly start"

Log "Frontend build"
npm run build 2>&1 | Tee-Object -FilePath $Report -Append

Log "Git status"
git status 2>&1 | Tee-Object -FilePath $Report -Append

Log "Backend health"
try {
  $r = Invoke-WebRequest "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5
  Log "Backend OK"
  Add-Content -LiteralPath $Report -Value $r.Content -Encoding UTF8
} catch {
  Log "Backend offline, starting backend"
  Start-Process powershell "-NoExit -Command cd `"$Root\backend`"; npm install; npm start"
}

Log "Frontend local start"
Start-Process powershell "-NoExit -Command cd `"$Root`"; npm run dev"

Start-Sleep -Seconds 5

Log "Open local UI"
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8080/health"

Log "Vercel deployments"
vercel ls 2>&1 | Tee-Object -FilePath $Report -Append

Log "UAOS nightly done"