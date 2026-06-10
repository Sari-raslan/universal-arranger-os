$ErrorActionPreference="Continue"

$Repo=(Get-Location).Path
$End=(Get-Date).AddHours(8)
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"

function Log($m){
  $line="[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$m
  Write-Host $line -ForegroundColor Cyan
  Add-Content "$Repo\reports\UAOS_NIGHT_RUN_$Stamp.log" $line
}

function SafeRun($name,$cmd){
  Log "RUN => $name"
  try{
    cmd /c $cmd 2>&1 | Tee-Object -FilePath "$Repo\reports\$($name)_$Stamp.txt"
  }catch{
    Log "FAIL => $name"
  }
}

Log "UAOS NIGHT AGENT START"

while((Get-Date) -lt $End){

  Log "STOP OLD NODE"
  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

  Log "WRITE TASK QUEUE"

  $Queue=@(
    "Build MIDI runtime",
    "Improve chord engine",
    "Improve arranger engine",
    "Sampler articulation planning",
    "Voice to MIDI planning",
    "Hardware USB MIDI planning",
    "Frontend runtime dashboard",
    "Backend API checks",
    "Git auto maintenance"
  )

  $Queue | ConvertTo-Json | Set-Content "$Repo\agent-output\night-task-queue.json"

  Log "INSTALL"

  SafeRun "npm_backend_install" "npm install --prefix backend"
  SafeRun "npm_frontend_install" "npm install --prefix uaos-live-clean"

  Log "BUILD"

  SafeRun "frontend_build" "npm run build --prefix uaos-live-clean"

  Log "START BACKEND"

  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit","-Command","cd '$Repo'; node backend/server.js"

  Start-Sleep 8

  Log "START FRONTEND"

  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit","-Command","cd '$Repo\uaos-live-clean'; npm run dev"

  Start-Sleep 15

  Log "HEALTH CHECK"

  SafeRun "health_check" "node backend/health-check.js"

  Log "GIT STATUS"

  git status | Out-File "$Repo\reports\git-status-$Stamp.txt"

  Log "AUTO COMMIT"

  git add .

  git commit -m "UAOS automated night cycle $Stamp"

  Log "AUTO PUSH"

  git push origin master

  Log "WRITE AI TASKS"

  @"
# UAOS NIGHT TASKS

Continue improving:
- MIDI runtime
- Chord engine
- Arranger engine
- Sampler system
- Oriental engine
- Agent commander
- Runtime dashboard
- Backend APIs

Keep logs in reports/.
Build before commit.
"@ | Set-Content "$Repo\agent-output\AUTO_AGENT_TASKS.md"

  Log "SLEEP 10 MIN"

  Start-Sleep -Seconds 600
}

Log "UAOS NIGHT AGENT COMPLETE"

Start-Process notepad "$Repo\reports\UAOS_NIGHT_RUN_$Stamp.log"
