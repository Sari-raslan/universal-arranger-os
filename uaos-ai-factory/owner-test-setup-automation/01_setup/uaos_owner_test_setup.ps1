$ErrorActionPreference = "Stop"

$Root = "E:\keyboard-manager-clean"
$App = Join-Path $Root "uaos-live-clean"
$Run = Join-Path $Root "uaos-ai-factory\owner-test-setup-automation"
$RepairRun = Join-Path $Root "uaos-ai-factory\owner-test-launcher-repair"
$StatusPath = Join-Path $Run "01_setup\UAOS_OWNER_TEST_SETUP_STATUS.json"
$Dashboard = Join-Path $Run "02_owner_flow\UAOS_OWNER_TEST_FLOW_DASHBOARD.html"
$RepairDashboard = Join-Path $RepairRun "dashboards\UAOS_OWNER_TEST_LAUNCHER_REPAIR_DASHBOARD.html"
$PreviewPort = 5180
$FallbackUrl = "http://127.0.0.1:5180/universal-arranger-os/"
$CandidateUrls = @(
  "http://127.0.0.1:5180/",
  "http://127.0.0.1:5180/universal-arranger-os/",
  "http://127.0.0.1:4173/",
  "http://127.0.0.1:4173/universal-arranger-os/",
  "http://127.0.0.1:5173/",
  "http://127.0.0.1:5173/universal-arranger-os/"
)

$PreviewStarted = $false
$BuildPass = $false
$WorkingUrl = $null
$ProbeResults = @()
$Errors = @()

function Test-UaosUrl {
  param([string]$Url)
  try {
    $request = [System.Net.HttpWebRequest]::Create($Url)
    $request.Timeout = 5000
    $response = $request.GetResponse()
    $stream = $response.GetResponseStream()
    $memory = New-Object System.IO.MemoryStream
    $stream.CopyTo($memory)
    $content = [System.Text.Encoding]::UTF8.GetString($memory.ToArray())
    $stream.Close()
    $response.Close()
    return [ordered]@{
      url = $Url
      reachable = $true
      status = [int]$response.StatusCode
      title = ([regex]::Match($content, "<title>(.*?)</title>")).Groups[1].Value
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
  fallback_url = $FallbackUrl
  fallback = "If no URL opens, run npm run preview from E:\keyboard-manager-clean\uaos-live-clean and open $FallbackUrl."
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
