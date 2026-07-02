$ErrorActionPreference = "Stop"

$ProjectDir = "E:\keyboard-manager-clean\uaos-ai-factory\jobcenter-monitor-vercel-dashboard-ready"
$Report = Join-Path $ProjectDir "UAOS_MONITOR_VERCEL_AUTO_DEPLOY_REPORT_2026-07-02.md"
$ProjectName = "uaos-jobcenter-monitor"
$JobcenterUrl = "https://uaos-jobcenter-monitor.vercel.app/jobcenter/"
$StatusUrl = "https://uaos-jobcenter-monitor.vercel.app/status/"
$TokenProvided = $false
$AuthMethod = "failed"
$DeployStatus = "NOT STARTED"
$ProductionUrl = ""
$JobcenterStatus = "not checked"
$StatusStatus = "not checked"

function Write-DeployReport {
  param(
    [string]$FinalStatus
  )

  $content = @"
# UAOS Monitor Vercel Auto Deploy Report

Date: 2026-07-02

- Auth method: $AuthMethod
- Token saved to files: NO
- Project name: $ProjectName
- Deploy status: $DeployStatus
- Production URL: $ProductionUrl
- HTTP status /jobcenter/: $JobcenterStatus
- HTTP status /status/: $StatusStatus
- Safety status: PASS
- App.jsx touched: NO
- Payment: NO
- Keyboard output: NO
- Final status: $FinalStatus
"@
  Set-Content -LiteralPath $Report -Value $content -Encoding UTF8
}

Set-Location -LiteralPath $ProjectDir
Write-Host "UAOS JOBCENTER MONITOR DEPLOY - NO PAYMENT - NO KEYBOARD OUTPUT" -ForegroundColor Cyan

$requiredFiles = @(
  "public\jobcenter\index.html",
  "public\status\index.html",
  "public\data\project-status.json",
  "public\data\files-index.json",
  "public\data\changelog.json",
  "package.json",
  "vercel.json"
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $ProjectDir $file))) {
    $DeployStatus = "FAILED - missing $file"
    Write-DeployReport "FAILED - required file missing"
    throw "Required file missing: $file"
  }
}

& vercel --version | Out-Host
if ($LASTEXITCODE -ne 0) {
  $DeployStatus = "FAILED - Vercel CLI missing"
  Write-DeployReport "FAILED - Vercel CLI missing"
  throw "Vercel CLI missing"
}

& vercel whoami | Out-Host
if ($LASTEXITCODE -eq 0) {
  $AuthMethod = "existing session"
} else {
  Write-Host "Paste temporary Vercel token now, or press Enter to stop:" -ForegroundColor Yellow
  $token = Read-Host
  if ([string]::IsNullOrWhiteSpace($token)) {
    $AuthMethod = "failed"
    $DeployStatus = "BLOCKED - Vercel auth required"
    Write-DeployReport "BLOCKED - Vercel auth required"
    Write-Host "BLOCKED - Vercel auth required." -ForegroundColor Yellow
    exit 2
  }

  $env:VERCEL_TOKEN = $token
  $TokenProvided = $true
  $AuthMethod = "token"
  & vercel whoami --token $env:VERCEL_TOKEN | Out-Host
  if ($LASTEXITCODE -ne 0) {
    $AuthMethod = "failed"
    $DeployStatus = "BLOCKED - Vercel auth required"
    Write-DeployReport "BLOCKED - Vercel auth required"
    throw "Vercel token was not accepted."
  }
}

if ($TokenProvided) {
  & vercel link --yes --project $ProjectName --token $env:VERCEL_TOKEN | Out-Host
  if ($LASTEXITCODE -ne 0) {
    $DeployStatus = "FAILED - project link failed"
    Write-DeployReport "FAILED - project link failed"
    throw "Vercel project link failed."
  }
  $deployOutput = & vercel --prod --yes --token $env:VERCEL_TOKEN 2>&1
} else {
  & vercel link --yes --project $ProjectName | Out-Host
  if ($LASTEXITCODE -ne 0) {
    $DeployStatus = "FAILED - project link failed"
    Write-DeployReport "FAILED - project link failed"
    throw "Vercel project link failed."
  }
  $deployOutput = & vercel --prod --yes 2>&1
}

if ($LASTEXITCODE -ne 0) {
  $DeployStatus = "FAILED - deploy command failed"
  Write-DeployReport "FAILED - deploy command failed"
  throw "Vercel deploy command failed."
}

$deployText = ($deployOutput | Out-String)
Write-Host $deployText
$DeployStatus = "DEPLOY COMMAND COMPLETED"
$matchedUrl = [regex]::Match($deployText, "https://[^\s]+")
if ($matchedUrl.Success) {
  $ProductionUrl = $matchedUrl.Value
}

$jobcenterResponse = Invoke-WebRequest -Uri $JobcenterUrl -Method Get -MaximumRedirection 5 -TimeoutSec 30 -UseBasicParsing
$statusResponse = Invoke-WebRequest -Uri $StatusUrl -Method Get -MaximumRedirection 5 -TimeoutSec 30 -UseBasicParsing
$JobcenterStatus = [string]$jobcenterResponse.StatusCode
$StatusStatus = [string]$statusResponse.StatusCode

if ($jobcenterResponse.StatusCode -eq 200 -and $statusResponse.StatusCode -eq 200) {
  $DeployStatus = "PASS"
  Write-DeployReport "PASS"
  Write-Host "PASS - public monitor URLs returned HTTP 200." -ForegroundColor Green
} else {
  $DeployStatus = "FAILED - HTTP verification failed"
  Write-DeployReport "FAILED - HTTP verification failed"
  throw "HTTP verification failed."
}
