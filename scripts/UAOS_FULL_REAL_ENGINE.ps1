$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $Root

Write-Host "UAOS FULL REAL ENGINE LAUNCHER START" -ForegroundColor Cyan

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "1. Start backend 8080" -ForegroundColor Yellow
Start-Process powershell -ArgumentList `
'-NoExit',
'-ExecutionPolicy','Bypass',
'-Command',
'cd "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os\backend"; npm install; npm start'

Start-Sleep -Seconds 6

Write-Host "2. Start MIDI bridge 8090" -ForegroundColor Yellow
Start-Process powershell -ArgumentList `
'-NoExit',
'-ExecutionPolicy','Bypass',
'-Command',
'cd "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os\backend"; node midi-bridge.js'

Start-Sleep -Seconds 4

Write-Host "3. Start frontend 5173" -ForegroundColor Yellow
Start-Process powershell -ArgumentList `
'-NoExit',
'-ExecutionPolicy','Bypass',
'-Command',
'cd "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"; npm run dev'

Start-Sleep -Seconds 5

Write-Host "4. Build" -ForegroundColor Cyan
npm run build

Write-Host "5. Check all endpoints" -ForegroundColor Cyan

$checks = @(
  "http://localhost:8080/health",
  "http://localhost:8080/export",
  "http://localhost:8080/export/midi",
  "http://localhost:8080/export/style/korg",
  "http://localhost:8080/export/style/yamaha",
  "http://localhost:8080/export/style/roland",
  "http://localhost:8080/export/style/ketron",
  "http://localhost:8090/health",
  "http://localhost:8090/scan"
)

foreach($c in $checks){
  try {
    $r = Invoke-WebRequest $c -UseBasicParsing -TimeoutSec 5
    Write-Host "$c => $($r.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "$c => FAIL" -ForegroundColor Red
  }
}

Write-Host "6. Git sync" -ForegroundColor Cyan
git add .
git commit -m "Run UAOS full real engine launcher" 2>$null
git pull --rebase origin master
git push

Write-Host "7. Deploy frontend" -ForegroundColor Cyan
vercel --prod --yes

Write-Host "8. Open dashboards" -ForegroundColor Cyan
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8080/health"
Start-Process "http://localhost:8090/health"
Start-Process "https://universal-arranger-os.vercel.app"

Write-Host "DONE UAOS FULL REAL ENGINE" -ForegroundColor Green
