$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

Start-Process powershell "-NoExit -Command cd `"$Root\backend`"; node midi-bridge.js"

Start-Sleep -Seconds 3

Invoke-WebRequest "http://localhost:8090/health" -UseBasicParsing
Invoke-WebRequest "http://localhost:8090/scan" -UseBasicParsing
