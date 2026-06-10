
cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os`"; node backend/server.js"

Start-Sleep 5

Start-Process "control-panel\index.html"

Invoke-WebRequest "http://localhost:8090/health"
Invoke-WebRequest "http://localhost:8090/runtime/release-gate"

git add .
git commit -m "Finalize realtime desktop runtime foundation"
git pull --rebase origin v2/core-runtime-alpha
git push origin v2/core-runtime-alpha
