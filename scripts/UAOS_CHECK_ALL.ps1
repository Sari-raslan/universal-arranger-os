$Repo="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd "$Repo"

Write-Host "CHECK V1 BUILD" -ForegroundColor Cyan
npm run build

if(Test-Path "$Repo\v2-runtime\package.json"){
  Write-Host "CHECK V2" -ForegroundColor Cyan
  cd "$Repo\v2-runtime"
  npm install
  npm run check
}

if(Test-Path "$Repo\v3-future\package.json"){
  Write-Host "CHECK V3" -ForegroundColor Cyan
  cd "$Repo\v3-future"
  npm install
  npm run check
  npm test
}
