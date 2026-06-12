$Root="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location "$Root"
npm run build --prefix uaos-live-clean
Start-Process "http://127.0.0.1:5173/#/audio"
npm run dev --prefix uaos-live-clean
