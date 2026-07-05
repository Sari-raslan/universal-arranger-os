$ErrorActionPreference = "Stop"
$Root = "E:\keyboard-manager-clean"
$App = Join-Path $Root "uaos-live-clean"
$Run = Join-Path $Root "uaos-ai-factory\owner-test-setup-automation"
$StatusPath = Join-Path $Run "01_setup\UAOS_OWNER_TEST_SETUP_STATUS.json"
$Dashboard = Join-Path $Run "02_owner_flow\UAOS_OWNER_TEST_FLOW_DASHBOARD.html"
$LocalUrl = "http://127.0.0.1:4173/universal-arranger-os/"
$PreviewStarted = $false
$BuildPass = $false
$Errors = @()
try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js not found" }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm not found" }
  if (-not (Test-Path -LiteralPath (Join-Path $App "package.json"))) { throw "package.json missing" }
  Push-Location $App
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
  $BuildPass = $true
  $existing = Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue
  if (-not $existing) {
    Start-Process -FilePath "npm" -ArgumentList @("run","preview","--","--host","127.0.0.1","--port","4173") -WorkingDirectory $App -WindowStyle Hidden
    Start-Sleep -Seconds 3
    $PreviewStarted = $true
  }
  Pop-Location
  Start-Process $Dashboard
  Start-Process $LocalUrl
} catch {
  $Errors += $_.Exception.Message
  try { Pop-Location } catch {}
}
$status = [ordered]@{
  created_at = (Get-Date).ToString("s")
  local_only = $true
  build_pass = $BuildPass
  preview_started_or_existing = ($PreviewStarted -or [bool](Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue))
  local_url = $LocalUrl
  fallback = "Run START_UAOS_OWNER_TEST.cmd. If the browser does not open, run npm run preview -- --host 127.0.0.1 --port 4173 from the React app folder, then open the local URL."
  deploy = "NO"
  push = "NO"
  payment_activation = "NO"
  korg_writer = "BLOCKED"
  sty_set_generated = "NO"
  usb = "NO"
  pa3x = "NO"
  errors = $Errors
}
$status | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $StatusPath -Encoding UTF8
if ($Errors.Count -gt 0) { exit 1 }
exit 0
