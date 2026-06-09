$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Start-Process powershell "-NoExit -Command cd `"$Root\backend`"; npm install; npm start"
Start-Sleep -Seconds 2
Start-Process powershell "-NoExit -Command cd `"$Root`"; npm run dev"
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8080/health"