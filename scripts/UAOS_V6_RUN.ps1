$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
npm run setup
npm run build
Start-Process powershell -WindowStyle Minimized -ArgumentList @("-NoExit","-Command","cd `"$Root`"; npm run dev")
Start-Sleep 3
Start-Process powershell -WindowStyle Minimized -ArgumentList @("-NoExit","-Command","cd `"$Root\uaos-live-clean`"; npm run preview")
Start-Sleep 5
$b=Invoke-WebRequest "http://127.0.0.1:5199/health" -UseBasicParsing
$f=Invoke-WebRequest "http://127.0.0.1:5180" -UseBasicParsing
"UAOS V6 PASS $(Get-Date)`nBACKEND $($b.StatusCode)`nFRONTEND $($f.StatusCode)" | Set-Content "agent-output\UAOS_V6_STATUS.txt"
Start-Process "http://127.0.0.1:5180"
notepad "agent-output\UAOS_V6_STATUS.txt"
