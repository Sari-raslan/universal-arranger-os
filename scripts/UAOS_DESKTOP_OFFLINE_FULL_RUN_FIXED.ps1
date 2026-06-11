$ErrorActionPreference="Continue"
$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Log="reports\UAOS_FIXED_RUN_REPORT.txt"
"UAOS FIXED OFFLINE RUN $(Get-Date)" | Set-Content $Log -Encoding UTF8

function Log($m){
  $m | Tee-Object -FilePath $Log -Append
}

Log "===== STOP OLD NODE ====="
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Log "===== BUILD FRONTEND ====="
npm run build 2>&1 | Tee-Object -FilePath $Log -Append

Log "===== START BACKEND ====="
Start-Process powershell -WindowStyle Minimized -ArgumentList '-NoExit','-Command','cd "'+$Root+'"; npm run dev'

Start-Sleep 3

Log "===== START FRONTEND PREVIEW ====="
Start-Process powershell -WindowStyle Minimized -ArgumentList '-NoExit','-Command','cd "'+$Root+'\landing-sales"; npx vite preview --host 127.0.0.1 --port 5180'

Log "===== WAIT FRONTEND ====="
$FrontOk=$false
for($i=1;$i -le 25;$i++){
  try{
    $r=Invoke-WebRequest "http://127.0.0.1:5180" -UseBasicParsing -TimeoutSec 3
    if($r.StatusCode -eq 200){
      $FrontOk=$true
      Log "FRONTEND: PASS 200"
      break
    }
  } catch {
    Log "FRONTEND WAIT $i : $($_.Exception.Message)"
    Start-Sleep 1
  }
}

Log "===== CHECK BACKEND ====="
try{
  $b=Invoke-WebRequest "http://127.0.0.1:5199/health" -UseBasicParsing -TimeoutSec 5
  Log "BACKEND: PASS $($b.StatusCode)"
}catch{
  Log "BACKEND: FAIL $($_.Exception.Message)"
}

Log "===== FINAL STATUS ====="
if($FrontOk){
  Log "STATUS: OFFLINE APP READY"
  Start-Process "http://127.0.0.1:5180"
}else{
  Log "STATUS: FRONTEND STILL FAILING - CHECK PORT 5180"
}

notepad $Log
