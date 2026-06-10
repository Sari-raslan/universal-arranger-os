$ErrorActionPreference = "Continue"

$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Reports = "$Root\reports"
New-Item -ItemType Directory -Force -Path $Reports | Out-Null

$Log = "$Reports\UAOS_PHASE3_FINAL_AUTONOMOUS_REPORT.txt"

function Log($m){
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"
  Write-Host $line
  Add-Content -LiteralPath $Log -Value $line -Encoding UTF8
}

cd $Root
Log "PHASE 3 FINAL SAFE RUN START"

Log "1. Stop old node"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Log "2. Start backend"
Start-Process powershell -ArgumentList `
  '-NoExit',
  '-ExecutionPolicy','Bypass',
  '-Command',
  'cd "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os\backend"; npm install; npm start'

Start-Sleep -Seconds 8

Log "3. Start MIDI bridge"
Start-Process powershell -ArgumentList `
  '-NoExit',
  '-ExecutionPolicy','Bypass',
  '-Command',
  'cd "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os\backend"; node midi-bridge.js'

Start-Sleep -Seconds 4

Log "4. Start frontend"
Start-Process powershell -ArgumentList `
  '-NoExit',
  '-ExecutionPolicy','Bypass',
  '-Command',
  'cd "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"; npm run dev'

Start-Sleep -Seconds 5

Log "5. Build"
npm run build 2>&1 | Tee-Object -FilePath $Log -Append

Log "6. Endpoint checks"
$checks = @(
  "http://localhost:8080/health",
  "http://localhost:8080/export/midi",
  "http://localhost:8080/export/style/korg",
  "http://localhost:8080/ai/analyze",
  "http://localhost:8080/audio/status",
  "http://localhost:8080/audio/render",
  "http://localhost:8080/phase3/report",
  "http://localhost:8090/health",
  "http://localhost:8090/scan"
)

foreach($c in $checks){
  try {
    $r = Invoke-WebRequest $c -UseBasicParsing -TimeoutSec 5
    Log "$c => $($r.StatusCode)"
  } catch {
    Log "$c => FAIL"
  }
}

Log "7. Git sync"
git add .
git commit -m "Run UAOS phase 3 final safe launcher" 2>$null
git pull --rebase origin master 2>&1 | Tee-Object -FilePath $Log -Append
git push 2>&1 | Tee-Object -FilePath $Log -Append

Log "8. Vercel deploy"
vercel --prod --yes 2>&1 | Tee-Object -FilePath $Log -Append

Log "9. Open dashboards"
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8080/phase3/report"
Start-Process "http://localhost:8090/health"
Start-Process "https://universal-arranger-os.vercel.app"

Log "PHASE 3 FINAL SAFE RUN DONE"
