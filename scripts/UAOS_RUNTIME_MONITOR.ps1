
cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

$Log = "reports\runtime-monitor.log"
New-Item -ItemType Directory -Force reports | Out-Null

function Log($m){
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m
  Write-Host $line
  Add-Content $Log $line
}

while($true){
  try{
    $r = Invoke-WebRequest "http://localhost:8090/health" -UseBasicParsing -TimeoutSec 3
    Log "Runtime OK $($r.StatusCode)"
  }catch{
    Log "Runtime DOWN. Restarting..."
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os`"; node backend/server.js"
    Start-Sleep 5
  }

  Start-Sleep 10
}
