$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
npm run setup
npm run build
Start-Process powershell -WindowStyle Minimized -ArgumentList @("-NoExit","-Command","cd `"$Root`"; npm run dev")
Start-Sleep 3
Start-Process powershell -WindowStyle Minimized -ArgumentList @("-NoExit","-Command","cd `"$Root\uaos-live-clean`"; npm run preview")
Start-Sleep 5

$checks=@(
 "http://127.0.0.1:5199/health",
 "http://127.0.0.1:5199/api/status",
 "http://127.0.0.1:5199/api/release/report",
 "http://127.0.0.1:5199/api/qa/routes",
 "http://127.0.0.1:5180"
)

$out="UAOS V10 QA $(Get-Date)`n"
foreach($u in $checks){
 try{
  $r=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 5
  $out += "$u PASS $($r.StatusCode)`n"
 }catch{
  $out += "$u FAIL $($_.Exception.Message)`n"
 }
}
$out | Set-Content "agent-output\UAOS_V10_QA_STATUS.txt"
git add .
git commit -m "Add UAOS V10 QA packaging release gate"
Start-Process "http://127.0.0.1:5180"
notepad "agent-output\UAOS_V10_QA_STATUS.txt"
