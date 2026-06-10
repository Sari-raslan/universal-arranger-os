$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $Root

Write-Host "STOP NIGHT AUTOMATION..." -ForegroundColor Yellow

$tasks = @(
  "UAOS Nightly Worker",
  "UAOS Advanced Nightly Worker",
  "UAOS Runtime Watchdog"
)

foreach($t in $tasks){
  try {
    Disable-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue | Out-Null
    Stop-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue
    Write-Host "Disabled: $t" -ForegroundColor Green
  } catch {
    Write-Host "Skip: $t" -ForegroundColor DarkYellow
  }
}

Write-Host "STOP OLD NODE PROCESSES..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "START REAL FAST WORK MODE..." -ForegroundColor Cyan

$ReportDir = "$Root\reports"
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$Log = "$ReportDir\UAOS_REAL_WORK_SPRINT.txt"

function Log($m){
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"
  Write-Host $line
  Add-Content -LiteralPath $Log -Value $line -Encoding UTF8
}

Log "1. Install backend"
cd "$Root\backend"
npm install 2>&1 | Tee-Object -FilePath $Log -Append

Log "2. Start backend"
Start-Process powershell "-NoExit -Command cd `"$Root\backend`"; npm start"
Start-Sleep -Seconds 5

cd $Root

Log "3. Build frontend"
npm run build 2>&1 | Tee-Object -FilePath $Log -Append

Log "4. Start frontend"
Start-Process powershell "-NoExit -Command cd `"$Root`"; npm run dev"
Start-Sleep -Seconds 4

Log "5. Fast endpoint validation"
$endpoints = @(
  "/health",
  "/diagnostics",
  "/devices",
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
    Log "$e => $($r.StatusCode)"
  } catch {
    Log "$e => FAIL"
  }
}

Log "6. Git clean sync"
git status 2>&1 | Tee-Object -FilePath $Log -Append
git add .
git commit -m "Run UAOS real work sprint" 2>$null
git pull --rebase origin master
git push

Log "7. Deploy frontend"
vercel --prod --yes 2>&1 | Tee-Object -FilePath $Log -Append

Log "8. Open active work"
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8080/health"
Start-Process "https://universal-arranger-os.vercel.app"

Log "REAL WORK SPRINT DONE"
Write-Host "DONE REAL FAST MODE" -ForegroundColor Green
