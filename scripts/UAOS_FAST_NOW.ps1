$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$ReportDir = "$Root\reports"
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$Log = "$ReportDir\UAOS_FAST_NOW_REPORT.txt"
$Tasks = "$ReportDir\UAOS_NEXT_DAY_TASKS.md"
$Done = "$ReportDir\UAOS_FAST_NOW_DONE.md"

function Log($m){
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"
  Write-Host $line
  Add-Content -LiteralPath $Log -Value $line -Encoding UTF8
}

cd $Root
Log "UAOS FAST NOW START"

Log "1. Ensure backend running"
try {
  Invoke-WebRequest "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
  Log "Backend already OK"
} catch {
  Log "Backend offline, starting..."
  Start-Process powershell "-NoExit -Command cd `"$Root\backend`"; npm install; npm start"
  Start-Sleep -Seconds 6
}

Log "2. Ensure frontend dev running"
Start-Process powershell "-NoExit -Command cd `"$Root`"; npm run dev"
Start-Sleep -Seconds 4

Log "3. Build production"
npm run build 2>&1 | Tee-Object -FilePath $Log -Append

Log "4. Backend endpoint checks"
$endpoints = @(
  "/health",
  "/diagnostics",
  "/devices",
  "/presets",
  "/templates",
  "/midi-map",
  "/sequencer",
  "/mixer",
  "/song",
  "/export",
  "/export/midi",
  "/export/style/korg",
  "/export/style/yamaha",
  "/export/style/roland",
  "/export/style/ketron"
)

foreach($e in $endpoints){
  try {
    $r = Invoke-WebRequest "http://localhost:8080$e" -UseBasicParsing -TimeoutSec 5
    Log "$e OK $($r.StatusCode)"
  } catch {
    Log "$e FAIL"
  }
}

Log "5. Generate fast completion file"
$next = ""
if(Test-Path $Tasks){ $next = Get-Content $Tasks -Raw }

@"
# UAOS FAST NOW EXECUTION

Generated: $(Get-Date)

## Current automated actions completed
- Backend checked/started
- Frontend dev server started
- Production build executed
- Backend endpoints tested
- Export endpoints tested
- Vercel deployment will run
- Git sync will run

## Tasks reviewed
$next

## Remaining real development
These cannot be completed automatically without real hardware/services:
- Real USB MIDI bridge
- Real KORG/Yamaha/Roland/Ketron binary exporters
- Real AI model integration
- Real audio sampler engine
- Production backend hosting account setup
- Android signing / store packaging
"@ | Set-Content -LiteralPath $Done -Encoding UTF8

Log "6. Git sync"
git add .
git commit -m "Run UAOS fast now automation and reports" 2>&1 | Tee-Object -FilePath $Log -Append
git pull --rebase origin master 2>&1 | Tee-Object -FilePath $Log -Append
git push 2>&1 | Tee-Object -FilePath $Log -Append

Log "7. Vercel deploy"
vercel --prod --yes 2>&1 | Tee-Object -FilePath $Log -Append

Log "8. Open dashboards"
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8080/health"
Start-Process "https://universal-arranger-os.vercel.app"
notepad $Done

Log "UAOS FAST NOW DONE"
