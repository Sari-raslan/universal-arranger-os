Write-Host "[WATCH AGENT] START" -ForegroundColor Cyan

$Url="https://universal-arranger-os.vercel.app"

try{
  $r=Invoke-WebRequest $Url -UseBasicParsing -TimeoutSec 20
  Write-Host "[WATCH AGENT] PUBLIC PASS $($r.StatusCode)" -ForegroundColor Green
}catch{
  Write-Host "[WATCH AGENT] PUBLIC FAIL" -ForegroundColor Red
}
