$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root
npm run build --prefix uaos-live-clean
npm install --prefix desktop
npm run pack --prefix desktop
