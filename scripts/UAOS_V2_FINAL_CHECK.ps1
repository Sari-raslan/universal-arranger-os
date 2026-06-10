$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $Root

Write-Host "1. Build frontend" -ForegroundColor Cyan
npm run build

Write-Host "2. Git status" -ForegroundColor Cyan
git status

Write-Host "3. Vercel deployments" -ForegroundColor Cyan
vercel ls

Write-Host "4. Backend check" -ForegroundColor Cyan

try {
  $r = Invoke-WebRequest "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "Backend OK" -ForegroundColor Green
  Write-Host $r.Content
}
catch {
  Write-Host "Backend offline" -ForegroundColor Yellow
}

Write-Host "5. Frontend" -ForegroundColor Green
Write-Host "https://universal-arranger-os.vercel.app"
