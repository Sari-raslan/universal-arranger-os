$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location "$Root\uaos-live-clean"

npm install
npm run build

if (Get-Command vercel -ErrorAction SilentlyContinue) {
  vercel --prod --yes
} else {
  Write-Host "Vercel CLI not found. Install with: npm i -g vercel"
}
