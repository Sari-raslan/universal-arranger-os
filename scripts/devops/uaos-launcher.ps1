$ErrorActionPreference = "Continue"

$Repo = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$LogDir = Join-Path $Repo "reports\devops-launcher"
$Log = Join-Path $LogDir "uaos-launcher.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($m) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $m" |
    Tee-Object -FilePath $Log -Append
}

function Start-Agent($Name, $Command) {
  Log "Starting $Name"
  Start-Process powershell `
    -WindowStyle Minimized `
    -ArgumentList "-NoExit", "-Command", "cd '$Repo'; $Command *>> '$LogDir\$Name.log'"
}

cd $Repo

Log "UAOS DevOps launcher started"

Start-Agent "backend" "cd backend; node src/server.js"
Start-Agent "omr" "cd backend; node omr-professional-server.mjs"
Start-Agent "paypal" "cd backend; node paypal-secure-server.mjs"
Start-Agent "live-audio" "cd backend; node live-audio-server.mjs"
Start-Agent "sound-library" "cd backend; node sound-library-server.mjs"
Start-Agent "frontend" "cd frontend; npm run dev"

Start-Sleep -Seconds 15

Start-Process "http://localhost:5173"
Start-Process "http://localhost:3001/api/health"
Start-Process "http://localhost:3002/api/omr/health"
Start-Process "http://localhost:3010/api/paypal/health"
Start-Process "http://localhost:3020/api/live-audio/health"
Start-Process "http://localhost:3030/api/sounds/health"

Log "UAOS DevOps launcher complete"
