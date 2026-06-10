
cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os`"; node backend/server.js"

Start-Sleep 5

Start-Process "http://localhost:8090/health"
Start-Process "http://localhost:8090/runtime"
Start-Process "http://localhost:8090/runtime/realtime"
Start-Process "http://localhost:8090/runtime/native-midi"
Start-Process "http://localhost:8090/runtime/release-gate"
