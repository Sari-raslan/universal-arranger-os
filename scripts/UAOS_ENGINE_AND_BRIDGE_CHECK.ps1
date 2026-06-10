$checks = @(
  "http://localhost:8080/health",
  "http://localhost:8080/export/midi",
  "http://localhost:8080/export/style/korg",
  "http://localhost:8090/health",
  "http://localhost:8090/scan"
)

foreach($c in $checks){
  try {
    $r = Invoke-WebRequest $c -UseBasicParsing -TimeoutSec 5
    Write-Host "$c => $($r.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "$c => FAIL" -ForegroundColor Red
  }
}
