$ErrorActionPreference = "Continue"

function Check($Name, $Url) {
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    "OK   $Name   HTTP $($r.StatusCode)   $Url"
  } catch {
    "FAIL $Name   $Url   $($_.Exception.Message)"
  }
}

Check "Frontend" "http://localhost:5173"
Check "Backend" "http://localhost:3001/api/health"
Check "OMR" "http://localhost:3002/api/omr/health"
Check "PayPal" "http://localhost:3010/api/paypal/health"
Check "Live Audio" "http://localhost:3020/api/live-audio/health"
Check "Sound Library" "http://localhost:3030/api/sounds/health"
