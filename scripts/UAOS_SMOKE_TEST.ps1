$Base = "http://localhost:8080"
$Endpoints = @("/health","/diagnostics","/devices","/presets","/midi-map","/sequencer","/mixer","/song","/export")
foreach($e in $Endpoints){
  try {
    $r = Invoke-WebRequest "$Base$e" -UseBasicParsing -TimeoutSec 5
    Write-Host "$e => $($r.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "$e => FAIL $($_.Exception.Message)" -ForegroundColor Red
  }
}