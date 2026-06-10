$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Reports = "$Root\reports"
$Snapshots = "$Root\runtime-snapshots"

New-Item -ItemType Directory -Force -Path $Reports | Out-Null
New-Item -ItemType Directory -Force -Path $Snapshots | Out-Null

$Log = "$Reports\UAOS_RUNTIME_WATCHDOG.txt"

function Log($m){
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"
  Write-Host $line
  Add-Content -LiteralPath $Log -Value $line -Encoding UTF8
}

function BackendAlive {
  try {
    Invoke-WebRequest "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 4 | Out-Null
    return $true
  } catch {
    return $false
  }
}

function FrontendAlive {
  try {
    Invoke-WebRequest "http://localhost:5173" -UseBasicParsing -TimeoutSec 4 | Out-Null
    return $true
  } catch {
    return $false
  }
}

cd $Root

Log "UAOS WATCHDOG START"

if(!(BackendAlive)){
  Log "Backend offline -> restart"

  Start-Process powershell `
    "-NoExit -Command cd `"$Root\backend`"; npm install; npm start"

  Start-Sleep -Seconds 6
}
else {
  Log "Backend alive"
}

if(!(FrontendAlive)){
  Log "Frontend offline -> restart"

  Start-Process powershell `
    "-NoExit -Command cd `"$Root`"; npm run dev"

  Start-Sleep -Seconds 6
}
else {
  Log "Frontend alive"
}

Log "Runtime snapshot"

try {
  $health = Invoke-WebRequest "http://localhost:8080/health" -UseBasicParsing
  $snap = "$Snapshots\health-$(Get-Date -Format yyyyMMdd-HHmmss).json"
  [System.IO.File]::WriteAllText($snap, $health.Content, (New-Object System.Text.UTF8Encoding($false)))
  Log "Snapshot saved $snap"
} catch {
  Log "Snapshot failed"
}

Log "Export validation"

foreach($u in @(
  "http://localhost:8080/export",
  "http://localhost:8080/export/midi",
  "http://localhost:8080/export/style/korg",
  "http://localhost:8080/export/style/yamaha",
  "http://localhost:8080/export/style/roland",
  "http://localhost:8080/export/style/ketron"
)){
  try {
    $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 5
    Log "$u => $($r.StatusCode)"
  } catch {
    Log "$u => FAIL"
  }
}

Log "Cleanup old snapshots"

Get-ChildItem $Snapshots -File -ErrorAction SilentlyContinue |
Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-7) } |
Remove-Item -Force -ErrorAction SilentlyContinue

Log "Git quick sync"

git add . 2>$null
git commit -m "UAOS auto watchdog snapshot" 2>$null

try {
  git pull --rebase origin master
  git push
  Log "Git sync OK"
} catch {
  Log "Git sync skipped"
}

Log "Open dashboards"

Start-Process "http://localhost:5173"
Start-Process "http://localhost:8080/health"
Start-Process "https://universal-arranger-os.vercel.app"

Log "UAOS WATCHDOG DONE"
