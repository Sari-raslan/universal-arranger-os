Write-Host "[BUILD AGENT] START" -ForegroundColor Cyan

$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"

Set-Location $App

npm install
npm run build

if($LASTEXITCODE -eq 0){
  Write-Host "[BUILD AGENT] BUILD PASS" -ForegroundColor Green
}else{
  Write-Host "[BUILD AGENT] BUILD FAIL" -ForegroundColor Red
}
