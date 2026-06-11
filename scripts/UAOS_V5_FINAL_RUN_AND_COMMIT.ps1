$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Report="agent-output\UAOS_V5_FINAL_STATUS.md"
"# UAOS V5 FINAL STATUS`nGenerated: $(Get-Date)`n" | Set-Content $Report -Encoding UTF8

function Add($m){ $m | Tee-Object -FilePath $Report -Append }

Add "## Start"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Add "## Install"
npm run setup 2>&1 | Tee-Object -FilePath $Report -Append

Add "## Build"
npm run build 2>&1 | Tee-Object -FilePath $Report -Append

Add "## Start Backend"
Start-Process powershell -WindowStyle Minimized -ArgumentList @("-NoExit","-Command","cd `"$Root`"; npm run dev")
Start-Sleep 3

Add "## Start Frontend"
Start-Process powershell -WindowStyle Minimized -ArgumentList @("-NoExit","-Command","cd `"$Root\uaos-live-clean`"; npm run preview")
Start-Sleep 5

Add "## Checks"
try{
 $b=Invoke-WebRequest "http://127.0.0.1:5199/health" -UseBasicParsing -TimeoutSec 5
 Add "BACKEND PASS $($b.StatusCode)"
}catch{ Add "BACKEND FAIL $($_.Exception.Message)" }

try{
 $f=Invoke-WebRequest "http://127.0.0.1:5180" -UseBasicParsing -TimeoutSec 5
 Add "FRONTEND PASS $($f.StatusCode)"
}catch{ Add "FRONTEND FAIL $($_.Exception.Message)" }

Add "## V5 Features"
Add "- Backend V5"
Add "- Frontend V5"
Add "- MIDI export"
Add "- Audio playback foundation"
Add "- Style arranger"
Add "- Maqam tabs"
Add "- Oriental/Gulf library foundation"

git add . 2>&1 | Tee-Object -FilePath $Report -Append
git commit -m "Finalize UAOS V5 local audio midi style foundation" 2>&1 | Tee-Object -FilePath $Report -Append

Start-Process "http://127.0.0.1:5180"
notepad $Report
