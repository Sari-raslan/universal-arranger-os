$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
npm run setup
npm run build
Start-Process powershell -WindowStyle Minimized -ArgumentList @("-NoExit","-Command","cd `"$Root`"; npm run dev")
Start-Sleep 3
Start-Process powershell -WindowStyle Minimized -ArgumentList @("-NoExit","-Command","cd `"$Root\uaos-live-clean`"; npm run preview")
Start-Sleep 5
Invoke-WebRequest "http://127.0.0.1:5199/health" -UseBasicParsing
Invoke-WebRequest "http://127.0.0.1:5180" -UseBasicParsing
Start-Process "http://127.0.0.1:5180"
"UAOS V5 DONE $(Get-Date)" | Set-Content "agent-output\UAOS_V5_DONE.txt"
notepad "agent-output\UAOS_V5_DONE.txt"
