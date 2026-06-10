$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$ReportDir = "$Root\reports"
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$Report = "$ReportDir\UAOS_ADVANCED_NIGHTLY_REPORT.txt"

function Log($m){
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"
  Write-Host $line
  Add-Content -LiteralPath $Report -Value $line -Encoding UTF8
}

cd $Root

Log "UAOS Advanced Nightly Start"

Log "1. Frontend build"
npm run build 2>&1 | Tee-Object -FilePath $Report -Append

Log "2. Backend health"
try {
  $r = Invoke-WebRequest "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5
  Log "Backend OK"
  Add-Content -LiteralPath $Report -Value $r.Content -Encoding UTF8
} catch {
  Log "Backend offline - starting backend"
  Start-Process powershell "-NoExit -Command cd `"$Root\backend`"; npm install; npm start"
}

Log "3. MIDI engine check"
try {
  Invoke-WebRequest "http://localhost:8080/devices" -UseBasicParsing -TimeoutSec 5 | Out-File -FilePath $Report -Append
  Log "MIDI profiles OK"
} catch { Log "MIDI check failed" }

Log "4. Sequencer check"
try {
  Invoke-WebRequest "http://localhost:8080/sequencer" -UseBasicParsing -TimeoutSec 5 | Out-File -FilePath $Report -Append
  Log "Sequencer OK"
} catch { Log "Sequencer check failed" }

Log "5. Mixer check"
try {
  Invoke-WebRequest "http://localhost:8080/mixer" -UseBasicParsing -TimeoutSec 5 | Out-File -FilePath $Report -Append
  Log "Mixer OK"
} catch { Log "Mixer check failed" }

Log "6. Song engine check"
try {
  Invoke-WebRequest "http://localhost:8080/song" -UseBasicParsing -TimeoutSec 5 | Out-File -FilePath $Report -Append
  Log "Song engine OK"
} catch { Log "Song engine check failed" }

Log "7. Export checks"
foreach($url in @(
  "http://localhost:8080/export",
  "http://localhost:8080/export/midi",
  "http://localhost:8080/export/style/korg",
  "http://localhost:8080/export/style/yamaha",
  "http://localhost:8080/export/style/roland",
  "http://localhost:8080/export/style/ketron"
)){
  try {
    Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 5 | Out-File -FilePath $Report -Append
    Log "$url OK"
  } catch {
    Log "$url FAILED"
  }
}

Log "8. Diagnostics"
try {
  Invoke-WebRequest "http://localhost:8080/diagnostics" -UseBasicParsing -TimeoutSec 5 | Out-File -FilePath $Report -Append
  Log "Diagnostics OK"
} catch { Log "Diagnostics failed" }

Log "9. Git status"
git status 2>&1 | Tee-Object -FilePath $Report -Append

Log "10. Vercel status"
vercel ls 2>&1 | Tee-Object -FilePath $Report -Append

Log "11. Generate TODO for next day"
@"
# UAOS Next-Day Tasks

Generated: $(Get-Date)

## Real development still needed
- Real MIDI bridge app
- Hardware USB MIDI detection
- Real audio engine
- Real sampler
- Real style binary exporters
- AI arranger model integration
- Android production build
- Desktop installer
- Cloud project sync
- User accounts
- Database backend
"@ | Set-Content -LiteralPath "$ReportDir\UAOS_NEXT_DAY_TASKS.md" -Encoding UTF8

Log "UAOS Advanced Nightly Done"
