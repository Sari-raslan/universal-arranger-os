$ErrorActionPreference="Continue"
$Repo=(Get-Location).Path
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$End=(Get-Date).AddHours(8)

function Log($m){
  $l="[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$m
  Write-Host $l -ForegroundColor Cyan
  Add-Content "$Repo\reports\UAOS_SLEEP_AGENT_$Stamp.log" $l
}

function Run($name,$cmd){
  Log "RUN $name"
  cmd /c $cmd 2>&1 | Tee-Object -FilePath "$Repo\reports\$name-$Stamp.txt" -Append
}

Log "UAOS SLEEP AGENT START"

while((Get-Date) -lt $End){

  Log "CYCLE START"

  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

  Run "build-app" "npm run build --prefix uaos-live-clean"
  Run "build-sales" "npm run build --prefix landing-sales"
  Run "backend-health" "node backend/health-check.js"

  Set-Content "$Repo\agent-output\SLEEP_AGENT_NEXT_TASKS.md" "UAOS NIGHT TASKS

DONE THIS CYCLE:
- App build
- Sales build
- Backend health check
- Git maintenance

NEXT DEVELOPMENT:
- MIDI monitor
- Piano roll
- Project save/load
- Arranger engine
- Sampler rack
- Export system
- Payment links
- Domain deploy
" -Encoding UTF8

  git add .
  git commit -m "UAOS sleep agent cycle $Stamp"
  git push origin master

  Log "RESTART BACKEND"
  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit","-Command","cd '$Repo'; node backend/server.js"

  Log "RESTART APP"
  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit","-Command","cd '$Repo\uaos-live-clean'; npm run dev -- --host 127.0.0.1 --port 5199 --force"

  Log "SLEEP 10 MINUTES"
  Start-Sleep -Seconds 600
}

Log "UAOS SLEEP AGENT COMPLETE"
notepad "$Repo\reports\UAOS_SLEEP_AGENT_$Stamp.log"
