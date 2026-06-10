
cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

Start-Process powershell -ArgumentList "-NoExit","-File","scripts\UAOS_RUNTIME_MONITOR.ps1"
Start-Sleep 5
Start-Process "control-panel\index.html"
