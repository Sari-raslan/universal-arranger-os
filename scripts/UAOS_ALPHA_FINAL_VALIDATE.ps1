
cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force reports | Out-Null

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

$proc = Start-Process node -ArgumentList "backend/server.js" -PassThru -WindowStyle Hidden
Start-Sleep 5

$tests = @(
@{ Method="GET"; Url="http://localhost:8090/health" },
@{ Method="GET"; Url="http://localhost:8090/runtime" },
@{ Method="POST"; Url="http://localhost:8090/runtime/midi/input/PA5X" },
@{ Method="POST"; Url="http://localhost:8090/runtime/midi/output/KONTAKT" },
@{ Method="POST"; Url="http://localhost:8090/runtime/midi/noteon/60" },
@{ Method="POST"; Url="http://localhost:8090/runtime/midi/noteon/64" },
@{ Method="POST"; Url="http://localhost:8090/runtime/midi/noteon/67" },
@{ Method="GET"; Url="http://localhost:8090/runtime/chord" },
@{ Method="POST"; Url="http://localhost:8090/runtime/style/load/OrientalPop" },
@{ Method="POST"; Url="http://localhost:8090/runtime/style/tempo/96" },
@{ Method="POST"; Url="http://localhost:8090/runtime/style/variation/B" },
@{ Method="POST"; Url="http://localhost:8090/runtime/style/start" },
@{ Method="POST"; Url="http://localhost:8090/runtime/sampler/load/OrientalKit" },
@{ Method="POST"; Url="http://localhost:8090/runtime/sampler/trigger/Oud/60" },
@{ Method="POST"; Url="http://localhost:8090/runtime/hardware/add/midi/PA5X" },
@{ Method="POST"; Url="http://localhost:8090/runtime/ai/analyze/OrientalDemo" },
@{ Method="GET"; Url="http://localhost:8090/runtime/ai/suggest/C-major" },
@{ Method="POST"; Url="http://localhost:8090/runtime/mixer/channel/audio/Drums" },
@{ Method="POST"; Url="http://localhost:8090/runtime/mixer/channel/audio/Oud" },
@{ Method="GET"; Url="http://localhost:8090/runtime/diagnostics" },
@{ Method="GET"; Url="http://localhost:8090/runtime/release-gate" }
)

$Report = "reports\alpha-final-validation-$Stamp.txt"

foreach($t in $tests){
try{
$r = Invoke-WebRequest -Method $t.Method $t.Url -UseBasicParsing
"$($t.Method) $($t.Url) => $($r.StatusCode)" | Tee-Object $Report -Append
}catch{
"$($t.Method) $($t.Url) => FAIL $($_.Exception.Message)" | Tee-Object $Report -Append
}
}

try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}

notepad $Report
