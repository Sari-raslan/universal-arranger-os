$ErrorActionPreference = "Continue"

$Repo = (Get-Location).Path
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"

New-Item -ItemType Directory -Force reports,scripts,docs | Out-Null

function Log($m){
$line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m
Write-Host $line
Add-Content "$Repo\reports\UAOS_MASTER_$Stamp.log" $line
}

Log "UAOS MASTER START"

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Log "INSTALL BACKEND"
npm install --prefix backend

Log "INSTALL FRONTEND"
npm install --prefix frontend

Log "BUILD FRONTEND"
npm run build --prefix frontend

if($LASTEXITCODE -ne 0){
Log "BUILD FAILED"
exit 1
}

Log "WRITE MASTER BACKLOG"

$Backlog = "# UAOS MASTER STATUS`r`n`r`nREADY:`r`n- Frontend`r`n- Backend`r`n- Vercel Deploy`r`n- Monitoring`r`n- Runtime Dashboard`r`n- One Click Scripts`r`n`r`nNEXT:`r`n- MIDI Runtime`r`n- Chord Engine`r`n- Arranger Engine`r`n- USB MIDI Layer`r`n- Cubase Export`r`n- Voice To MIDI`r`n- Sampler Engine`r`n- AI Music System`r`n"

Set-Content "$Repo\docs\UAOS_MASTER_BACKLOG.md" $Backlog -Encoding UTF8

Log "START BACKEND"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; node backend/server.js"

Start-Sleep 5

Log "START FRONTEND"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; npm run dev --prefix frontend"

Start-Sleep 8

Start-Process "http://127.0.0.1:5173"

Log "DONE"
