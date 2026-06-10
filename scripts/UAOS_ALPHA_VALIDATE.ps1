cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force reports | Out-Null

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

$proc = Start-Process node -ArgumentList "backend/server.js" -PassThru -WindowStyle Hidden
Start-Sleep 5

$urls = @(
"http://localhost:8090/",
"http://localhost:8090/health",
"http://localhost:8090/runtime",
"http://localhost:8090/runtime/mixer",
"http://localhost:8090/api/status"
)

foreach($u in $urls){
try {
$r = Invoke-WebRequest $u -UseBasicParsing
"$u => $($r.StatusCode)" | Tee-Object "reports\alpha-validation-$Stamp.txt" -Append
} catch {
"$u => FAIL $($_.Exception.Message)" | Tee-Object "reports\alpha-validation-$Stamp.txt" -Append
}
}

try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}

notepad "reports\alpha-validation-$Stamp.txt"