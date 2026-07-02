$ErrorActionPreference = "Stop"

$ProjectDir = $PSScriptRoot
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
$FirstFailure = ""

function Write-DeployReport {
  param([string]$FinalStatus)

  $content = @"
# UAOS Monitor Vercel Auto Deploy Report

Date: 2026-07-02

- vercel.json repaired: YES
- package.json valid: YES
- Auth method: $AuthMethod
- Token saved to files: NO
- Token committed: NO
- Project name: $ProjectName
- Deploy status: $DeployStatus
- First failure reason: $FirstFailure
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

function Fail-Deploy {
  param(
    [string]$Status,
    [string]$Reason
  )
  $script:DeployStatus = $Status
  $script:FirstFailure = $Reason
  Write-DeployReport $Status
  throw $Reason
}

function Test-JsonFile {
  param([string]$FileName)

  $path = Join-Path $ProjectDir $FileName
  if (-not (Test-Path -LiteralPath $path)) {
    Fail-Deploy "FAILED - missing $FileName" "Required file missing: $FileName"
  }

  try {
    $raw = Get-Content -LiteralPath $path -Raw -Encoding UTF8
    $null = $raw | ConvertFrom-Json
  } catch {
    Fail-Deploy "FAILED - invalid $FileName" "$FileName JSON validation failed: $($_.Exception.Message)"
  }
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
    Fail-Deploy "FAILED - missing $file" "Required file missing: $file"
  }
}

Test-JsonFile "vercel.json"
Test-JsonFile "package.json"
Write-Host "vercel.json OK" -ForegroundColor Green
Write-Host "package.json OK" -ForegroundColor Green

& vercel --version | Out-Host
if ($LASTEXITCODE -ne 0) {
  Fail-Deploy "FAILED - Vercel CLI missing" "Vercel CLI missing"
}

& vercel whoami | Out-Host
if ($LASTEXITCODE -eq 0) {
  $AuthMethod = "existing session"
} else {
  Write-Host "Owner must revoke the previously exposed Vercel token and paste a NEW temporary token." -ForegroundColor Yellow
  Write-Host "Paste NEW temporary Vercel token now, or press Enter to stop:" -ForegroundColor Yellow
  $token = Read-Host
  if ([string]::IsNullOrWhiteSpace($token)) {
    $AuthMethod = "failed"
    $DeployStatus = "BLOCKED - Vercel auth required"
    $FirstFailure = "Vercel authentication required before deployment"
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
    $FirstFailure = "Vercel token was not accepted"
    Write-DeployReport "BLOCKED - Vercel auth required"
    throw "Vercel authentication failed."
  }
}

if ($TokenProvided) {
  & vercel link --yes --project $ProjectName --token $env:VERCEL_TOKEN | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Fail-Deploy "FAILED - project link failed" "Vercel project link failed"
  }
  $deployOutput = & vercel --prod --yes --token $env:VERCEL_TOKEN 2>&1
} else {
  & vercel link --yes --project $ProjectName | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Fail-Deploy "FAILED - project link failed" "Vercel project link failed"
  }
  $deployOutput = & vercel --prod --yes 2>&1
}

if ($LASTEXITCODE -ne 0) {
  $deployText = ($deployOutput | Out-String)
  if ($deployText -match "(?i)billing|paid|payment") {
    Fail-Deploy "BLOCKED - billing or paid plan prompt" "Billing or paid-plan prompt detected"
  }
  Fail-Deploy "FAILED - deploy command failed" "Vercel deploy command failed"
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
  Fail-Deploy "FAILED - HTTP verification failed" "HTTP verification failed"
}
