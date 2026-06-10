
cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force reports | Out-Null

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

$proc = Start-Process node -ArgumentList "backend/server.js" -PassThru -WindowStyle Hidden
Start-Sleep 5

$Report = "reports\realtime-validation-$Stamp.txt"

$tests = @(
@{M="GET";U="[http://localhost:8090/health"}](http://localhost:8090/health%22}),
@{M="GET";U="[http://localhost:8090/runtime"}](http://localhost:8090/runtime%22}),
@{M="GET";U="[http://localhost:8090/runtime/realtime"}](http://localhost:8090/runtime/realtime%22}),
@{M="POST";U="[http://localhost:8090/runtime/realtime/broadcast/test-event"}](http://localhost:8090/runtime/realtime/broadcast/test-event%22}),
@{M="POST";U="[http://localhost:8090/runtime/native-midi/enable"}](http://localhost:8090/runtime/native-midi/enable%22}),
@{M="POST";U="[http://localhost:8090/runtime/native-midi/scan"}](http://localhost:8090/runtime/native-midi/scan%22}),
@{M="POST";U="[http://localhost:8090/runtime/native-midi/send/64"}](http://localhost:8090/runtime/native-midi/send/64%22}),
@{M="POST";U="[http://localhost:8090/runtime/midi/noteon/60"}](http://localhost:8090/runtime/midi/noteon/60%22}),
@{M="POST";U="[http://localhost:8090/runtime/midi/noteon/64"}](http://localhost:8090/runtime/midi/noteon/64%22}),
@{M="POST";U="[http://localhost:8090/runtime/midi/noteon/67"}](http://localhost:8090/runtime/midi/noteon/67%22}),
@{M="GET";U="[http://localhost:8090/runtime/chord"}](http://localhost:8090/runtime/chord%22}),
@{M="GET";U="[http://localhost:8090/runtime/diagnostics"}](http://localhost:8090/runtime/diagnostics%22}),
@{M="GET";U="[http://localhost:8090/runtime/release-gate"}](http://localhost:8090/runtime/release-gate%22})
)

foreach($t in $tests){
try{
$r = Invoke-WebRequest -Method $t.M $t.U -UseBasicParsing
"$($t.M) $($t.U) => $($r.StatusCode)" | Tee-Object $Report -Append
}catch{
"$($t.M) $($t.U) => FAIL $($_.Exception.Message)" | Tee-Object $Report -Append
}
}

try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}

notepad $Report
