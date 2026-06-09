$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $Root

Write-Host "Build..." -ForegroundColor Cyan
npm run build

Write-Host "Git..." -ForegroundColor Cyan
git status

Write-Host "Vercel..." -ForegroundColor Cyan
vercel ls

Write-Host "Live:" -ForegroundColor Green
Write-Host "https://universal-arranger-os.vercel.app"