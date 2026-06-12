$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
$Reports="$Root\reports"
$Public="https://universal-arranger-os.vercel.app"

New-Item -ItemType Directory -Force $Reports, "$Root\release-kit" | Out-Null

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Log="$Reports\UAOS_SAFE_TURBO_$Stamp.txt"

function L($m){
  $x="[SAFE TURBO] $m"
  Write-Host $x -ForegroundColor Cyan
  $x | Out-File -LiteralPath $Log -Append -Encoding utf8
}

function Fail($m){
  L "FAIL: $m"
  notepad $Log
  exit 1
}

function Cool(){
  Start-Sleep -Seconds 5
}

L "START UAOS SAFE TURBO PIPELINE"

if(!(Test-Path $App)){ Fail "App missing" }

L "Stop old Vite preview/dev processes on ports 5173/5174/5180/5188/5190"
$Ports=@(5173,5174,5180,5188,5190)
foreach($p in $Ports){
  try{
    $conns=Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    foreach($c in $conns){
      Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
      L "Stopped process on port $p"
    }
  }catch{}
}
Cool

L "AUDIO AGENT SAFE"
powershell -ExecutionPolicy Bypass -File ".\scripts\agents\AUDIO_AGENT_REAL.ps1"
if($LASTEXITCODE -ne 0){ Fail "Audio agent failed" }
Cool

L "MIDI AGENT SAFE"
powershell -ExecutionPolicy Bypass -File ".\scripts\agents\MIDI_AGENT_REAL.ps1"
if($LASTEXITCODE -ne 0){ Fail "MIDI agent failed" }
Cool

Set-Location $App

L "BUILD CHECK"
npm run build 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
if($LASTEXITCODE -ne 0){ Fail "Build failed" }

if(!(Test-Path "$App\dist\index.html")){ Fail "dist/index.html missing" }
L "BUILD PASS"
Cool

L "LOCAL PREVIEW SAFE"
$Preview=Start-Process powershell -PassThru -WindowStyle Minimized -ArgumentList "-NoExit","-Command","cd `"$App`"; npx vite preview --host 127.0.0.1 --port 5195"

Start-Sleep -Seconds 8

try{
  $r=Invoke-WebRequest "http://127.0.0.1:5195" -UseBasicParsing -TimeoutSec 15
  L "LOCAL PREVIEW PASS: $($r.StatusCode)"
}catch{
  Fail "Local preview failed: $($_.Exception.Message)"
}
Cool

L "PUBLIC QUICK CHECK BEFORE DEPLOY"
$PublicOk=$false
try{
  $r=Invoke-WebRequest $Public -UseBasicParsing -TimeoutSec 20
  if($r.StatusCode -ge 200 -and $r.StatusCode -lt 400){
    $PublicOk=$true
    L "PUBLIC CURRENT OK: $($r.StatusCode)"
  }
}catch{
  L "PUBLIC CURRENT WARNING: $($_.Exception.Message)"
}

L "GIT SAVE"
Set-Location $Root
git add . 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
git diff --cached --quiet
if($LASTEXITCODE -ne 0){
  git commit -m "UAOS safe turbo pipeline $Stamp" 2>&1 | Out-File -LiteralPath $Log -Append -Encoding utf8
  L "GIT COMMIT PASS"
}else{
  L "NO GIT CHANGES"
}
Cool

L "DEPLOY SAFE"
Set-Location $App
vercel --prod --yes 2>&1 | Tee-Object -FilePath $Log -Append
if($LASTEXITCODE -ne 0){
  L "WARNING: Vercel deploy failed, continuing health report"
}else{
  L "VERCEL DEPLOY PASS"
}
Cool

L "PUBLIC ROUTE HEALTH"
$Routes=@(
  "$Public",
  "$Public/#/",
  "$Public/#/audio",
  "$Public/#/midi",
  "$Public/#/sounds",
  "$Public/#/sampler",
  "$Public/#/pricing",
  "$Public/#/downloads"
)

$Fails=0
foreach($u in $Routes){
  try{
    $x=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 20
    L "PASS $u => $($x.StatusCode)"
  }catch{
    L "FAIL $u => $($_.Exception.Message)"
    $Fails++
  }
  Start-Sleep -Seconds 1
}

$Result="$Root\release-kit\UAOS_SAFE_TURBO_RESULT.txt"

@"
UAOS SAFE TURBO RESULT
======================

Time:
$(Get-Date)

Build:
PASS

Local Preview:
http://127.0.0.1:5195

Public:
$Public

Health Fail Count:
$Fails

Report:
$Log

Next Command:
powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
"@ | Set-Content -LiteralPath $Result -Encoding utf8

L "DONE SAFE TURBO"
L "Health fails: $Fails"
L "Result: $Result"

Start-Process "http://127.0.0.1:5195"
Start-Process $Public
notepad $Result
notepad $Log
