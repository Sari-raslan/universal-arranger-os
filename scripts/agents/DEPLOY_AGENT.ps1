Write-Host "[DEPLOY AGENT] START" -ForegroundColor Cyan

$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"

Set-Location $App

vercel --prod --yes

if($LASTEXITCODE -eq 0){
  Write-Host "[DEPLOY AGENT] DEPLOY PASS" -ForegroundColor Green
}else{
  Write-Host "[DEPLOY AGENT] DEPLOY FAIL" -ForegroundColor Red
}
