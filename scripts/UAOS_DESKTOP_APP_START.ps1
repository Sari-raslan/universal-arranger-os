
cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os`"; node backend/server.js"

Start-Sleep 5

npm install --prefix electron-app
npm start --prefix electron-app
