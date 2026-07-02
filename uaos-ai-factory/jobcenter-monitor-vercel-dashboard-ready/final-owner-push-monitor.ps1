$ErrorActionPreference = "Stop"

$Root = "E:\keyboard-manager-clean"
$SyncBase = Join-Path $Root "uaos-ai-factory\vercel-linked-monitor-repo-sync"
$Report = Join-Path $Root "uaos-ai-factory\jobcenter-monitor-vercel-dashboard-ready\UAOS_FINAL_OWNER_PUSH_MONITOR_REPORT_2026-07-02.md"
$TargetRepo = "https://github.com/aeplatform-app/uaos-jobcenter-monitor.git"
$ExpectedCommit = "bc910a1"
$JobcenterUrl = "https://uaos-jobcenter-monitor.vercel.app/jobcenter/"
$StatusUrl = "https://uaos-jobcenter-monitor.vercel.app/status/"
$VercelDeployments = "https://vercel.com/aeplatform-apps-projects/uaos-jobcenter-monitor/deployments"

function Write-Report {
  param(
    [string]$GitHubUser,
    [string]$PushStatus,
    [string]$JobcenterHttp,
    [string]$StatusHttp,
    [string]$ContentUpdated,
    [string]$NextAction
  )

  $text = @"
# UAOS Final Owner Push Monitor Report - 2026-07-02

## GitHub user used
$GitHubUser

## Target repo
$TargetRepo

## Commit pushed
$ExpectedCommit

## Push status
$PushStatus

## Public URL status
- Jobcenter URL: $JobcenterUrl
- Jobcenter HTTP: $JobcenterHttp
- Status URL: $StatusUrl
- Status HTTP: $StatusHttp

## Content updated
$ContentUpdated

## Safety
- No Vercel CLI used: YES
- No Vercel token used: YES
- No App.jsx touched: YES
- No payment changes: YES
- No keyboard output changes: YES
- No Businessplan/PPTX changes: YES
- No force push: YES

## Next action
$NextAction
"@
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Report, $text, $utf8NoBom)
}

function Get-GitHubUser {
  try {
    return ((gh api user --jq .login) | Select-Object -Last 1).Trim()
  } catch {
    return "UNKNOWN"
  }
}

Write-Host "Locating prepared UAOS monitor repository..." -ForegroundColor Cyan
$PreparedRepo = $null
Get-ChildItem -LiteralPath $SyncBase -Directory -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
  if ($PreparedRepo) { return }
  $candidate = $_.FullName
  if (-not (Test-Path (Join-Path $candidate ".git"))) { return }
  try {
    $head = (git -C $candidate rev-parse --short HEAD 2>$null).Trim()
    $origin = (git -C $candidate remote get-url origin 2>$null).Trim()
    if ($head -eq $ExpectedCommit -and $origin -eq $TargetRepo) {
      $script:PreparedRepo = $candidate
    }
  } catch {}
}

if (-not $PreparedRepo) {
  Write-Report -GitHubUser "UNKNOWN" -PushStatus "NOT ATTEMPTED - prepared repo not found" -JobcenterHttp "NOT TESTED" -StatusHttp "NOT TESTED" -ContentUpdated "NO" -NextAction "Find or recreate the prepared local commit $ExpectedCommit."
  throw "Prepared repo with commit $ExpectedCommit and origin $TargetRepo was not found under $SyncBase."
}

Set-Location $PreparedRepo
Write-Host "Prepared repo: $PreparedRepo" -ForegroundColor Green
Write-Host "Current commit:" -ForegroundColor Cyan
git rev-parse --short HEAD
Write-Host "Current remote:" -ForegroundColor Cyan
git remote -v

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "GitHub CLI not found. Trying git push with current Git credentials." -ForegroundColor Yellow
} else {
  Write-Host "Current GitHub auth status:" -ForegroundColor Cyan
  gh auth status
  Write-Host ""
  Write-Host "You must login with the GitHub account that owns aeplatform-app or has WRITE access to aeplatform-app/uaos-jobcenter-monitor." -ForegroundColor Yellow
  $switchLogin = Read-Host "Do you want to switch GitHub login now? Type YES to continue"
  if ($switchLogin -eq "YES") {
    gh auth logout --hostname github.com
    gh auth login --hostname github.com --web --git-protocol https
  }
  Write-Host "GitHub auth status after login step:" -ForegroundColor Cyan
  gh auth status
}

$GitHubUser = Get-GitHubUser

Write-Host "Testing repository visibility..." -ForegroundColor Cyan
git ls-remote $TargetRepo | Out-Host

$PushStatus = "FAILED"
try {
  Write-Host "Pushing prepared commit $ExpectedCommit to main..." -ForegroundColor Cyan
  git push origin HEAD:main
  $PushStatus = "PASS"
} catch {
  $PushStatus = "FAILED - $($_.Exception.Message)"
  Write-Report -GitHubUser $GitHubUser -PushStatus $PushStatus -JobcenterHttp "NOT TESTED" -StatusHttp "NOT TESTED" -ContentUpdated "NO" -NextAction "Grant write/admin access to the GitHub user or run this launcher from an owner account."
  throw
}

Start-Process $VercelDeployments
Write-Host "Now click Redeploy, Cache OFF if Vercel did not auto-deploy." -ForegroundColor Yellow
Write-Host "Waiting 120 seconds before public verification..." -ForegroundColor Cyan
Start-Sleep -Seconds 120

$JobcenterHttp = "ERROR"
$StatusHttp = "ERROR"
$CombinedContent = ""

try {
  $job = Invoke-WebRequest -Uri $JobcenterUrl -UseBasicParsing -TimeoutSec 30
  $JobcenterHttp = [string][int]$job.StatusCode
  $CombinedContent += $job.Content
} catch {
  $JobcenterHttp = "ERROR - $($_.Exception.Message)"
}

try {
  $status = Invoke-WebRequest -Uri $StatusUrl -UseBasicParsing -TimeoutSec 30
  $StatusHttp = [string][int]$status.StatusCode
  $CombinedContent += $status.Content
} catch {
  $StatusHttp = "ERROR - $($_.Exception.Message)"
}

$Euro = [char]0x20AC
$RequiredTerms = @("4.700 $Euro", "Ertragserwartung", "Kundengewinnung", "Kostenbasis", "Changelog", "Letzte Aktualisierung")
$MissingTerms = @()
foreach ($term in $RequiredTerms) {
  if (-not $CombinedContent.Contains($term)) {
    $MissingTerms += $term
  }
}

if ($JobcenterHttp -eq "200" -and $StatusHttp -eq "200" -and $MissingTerms.Count -eq 0) {
  $ContentUpdated = "YES"
  $NextAction = "Public monitor is updated."
} else {
  $ContentUpdated = "NO - missing: " + ($MissingTerms -join ", ")
  $NextAction = "PUSH PASS - Vercel manual redeploy required. Open Deployments, click Redeploy, Cache OFF."
  Write-Host $NextAction -ForegroundColor Yellow
}

Write-Report -GitHubUser $GitHubUser -PushStatus $PushStatus -JobcenterHttp $JobcenterHttp -StatusHttp $StatusHttp -ContentUpdated $ContentUpdated -NextAction $NextAction

Set-Location $Root
git add "uaos-ai-factory/jobcenter-monitor-vercel-dashboard-ready/UAOS_FINAL_OWNER_PUSH_MONITOR_REPORT_2026-07-02.md"
git commit -m "Add final owner push monitor report"

Write-Host "Final report written: $Report" -ForegroundColor Green
