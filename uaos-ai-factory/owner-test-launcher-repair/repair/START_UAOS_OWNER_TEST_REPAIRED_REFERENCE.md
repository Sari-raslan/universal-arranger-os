# START_UAOS_OWNER_TEST Repaired Reference

## CMD

```bat
@echo off
setlocal
set "UAOS_ROOT=E:\keyboard-manager-clean"
set "UAOS_RUN=%UAOS_ROOT%\uaos-ai-factory\owner-test-setup-automation"
set "UAOS_APP=%UAOS_ROOT%\uaos-live-clean"
set "UAOS_HELPER=%UAOS_RUN%\01_setup\uaos_owner_test_setup.ps1"
echo UAOS Owner Test Setup - local only
echo No deploy. No push. No USB. No PA3X. KORG Writer blocked.
if not exist "%UAOS_HELPER%" (
  echo Missing setup helper: %UAOS_HELPER%
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%UAOS_HELPER%"
if errorlevel 1 (
  echo Setup helper reported a problem. Open the status file in 01_setup for details.
  exit /b 1
)
echo Owner test setup finished.
echo Working URL is recorded in:
echo %UAOS_RUN%\01_setup\UAOS_OWNER_TEST_SETUP_STATUS.json
echo Dashboard: %UAOS_RUN%\02_owner_flow\UAOS_OWNER_TEST_FLOW_DASHBOARD.html
endlocal

```

## PowerShell Helper

```powershell
$ErrorActionPreference = "Stop"

$Root = "E:\keyboard-manager-clean"
$App = Join-Path $Root "uaos-live-clean"
$Run = Join-Path $Root "uaos-ai-factory\owner-test-setup-automation"
$RepairRun = Join-Path $Root "uaos-ai-factory\owner-test-launcher-repair"
$StatusPath = Join-Path $Run "01_setup\UAOS_OWNER_TEST_SETUP_STATUS.json"
$Dashboard = Join-Path $Run "02_owner_flow\UAOS_OWNER_TEST_FLOW_DASHBOARD.html"
$RepairDashboard = Join-Path $RepairRun "dashboards\UAOS_OWNER_TEST_LAUNCHER_REPAIR_DASHBOARD.html"
$PreviewPort = 5180
$CandidateUrls = @(
  "http://127.0.0.1:4173/",
  "http://127.0.0.1:4173/universal-arranger-os/",
  "http://127.0.0.1:5173/",
  "http://127.0.0.1:5173/universal-arranger-os/",
  "http://127.0.0.1:5180/",
  "http://127.0.0.1:5180/universal-arranger-os/"
)

$PreviewStarted = $false
$BuildPass = $false
$WorkingUrl = $null
$ProbeResults = @()
$Errors = @()

function Test-UaosUrl {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    return [ordered]@{
      url = $Url
      reachable = $true
      status = [int]$response.StatusCode
      title = ([regex]::Match($response.Content, "<title>(.*?)</title>")).Groups[1].Value
    }
  } catch {
    $status = "ERR"
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
    }
    return [ordered]@{
      url = $Url
      reachable = $false
      status = $status
      error = $_.Exception.Message
    }
  }
}

try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js not found" }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm not found" }
  if (-not (Test-Path -LiteralPath (Join-Path $App "package.json"))) { throw "package.json missing" }

  Push-Location $App
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
  $BuildPass = $true

  $existing = Get-NetTCPConnection -LocalPort $PreviewPort -State Listen -ErrorAction SilentlyContinue
  if (-not $existing) {
    Start-Process -FilePath "npm" -ArgumentList @("run", "preview") -WorkingDirectory $App -WindowStyle Hidden
    Start-Sleep -Seconds 4
    $PreviewStarted = $true
  }
  Pop-Location

  foreach ($url in $CandidateUrls) {
    $result = Test-UaosUrl -Url $url
    $ProbeResults += $result
    if (-not $WorkingUrl -and $result.reachable -and $result.status -eq 200) {
      $WorkingUrl = $url
    }
  }

  if ($WorkingUrl) {
    Start-Process $Dashboard
    Start-Process $WorkingUrl
  } else {
    if (Test-Path -LiteralPath $RepairDashboard) {
      Start-Process $RepairDashboard
    } else {
      Start-Process $Dashboard
    }
    $Errors += "No working local URL detected. Open the repair dashboard or run npm run preview from the React app folder."
  }
} catch {
  $Errors += $_.Exception.Message
  try { Pop-Location } catch {}
}

$status = [ordered]@{
  created_at = (Get-Date).ToString("s")
  local_only = $true
  build_pass = $BuildPass
  preview_started_or_existing = ($PreviewStarted -or [bool](Get-NetTCPConnection -LocalPort $PreviewPort -State Listen -ErrorAction SilentlyContinue))
  preview_port = $PreviewPort
  candidate_urls = $CandidateUrls
  probe_results = $ProbeResults
  working_url = $WorkingUrl
  fallback = "If no URL opens, run npm run preview from E:\keyboard-manager-clean\uaos-live-clean and open http://127.0.0.1:5180/universal-arranger-os/."
  deploy = "NO"
  push = "NO"
  payment_activation = "NO"
  korg_writer = "BLOCKED"
  sty_set_generated = "NO"
  usb = "NO"
  pa3x = "NO"
  errors = $Errors
}

$status | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $StatusPath -Encoding UTF8
if ($Errors.Count -gt 0) { exit 1 }
exit 0

```
