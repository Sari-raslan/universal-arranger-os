$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root
npm install --prefix uaos-live-clean
npm run build --prefix uaos-live-clean
git status
