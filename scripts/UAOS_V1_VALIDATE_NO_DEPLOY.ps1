param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ReportDir = Join-Path $Root "reports"
$Report = Join-Path $ReportDir "UAOS_V1_VALIDATE_NO_DEPLOY_REPORT.md"

function Add-Report($Line) {
  Add-Content -LiteralPath $Report -Value $Line
}

Set-Location $Root
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
Set-Content -LiteralPath $Report -Value "# UAOS V1 No-Deploy Validation`n"
Add-Report "- Date: $(Get-Date -Format o)"
Add-Report "- Path: $Root"
Add-Report "- Policy: no deploy, no Vercel, no git push"

if ((Get-Location).Path -notlike "*universal-arranger-os*") {
  throw "Refusing to run outside universal-arranger-os."
}

Add-Report "`n## Git Status"
git status --short | Tee-Object -Variable GitStatus | Out-Null
if ($GitStatus) { $GitStatus | ForEach-Object { Add-Report "- $_" } } else { Add-Report "- Clean" }

if (-not $SkipInstall) {
  Add-Report "`n## Install"
  npm run setup
  Add-Report "- npm run setup completed"
}

Add-Report "`n## Checks"
npm run check
Add-Report "- npm run check completed"

Add-Report "`n## Build"
npm run build
Add-Report "- npm run build completed"

Add-Report "`n## Desktop Smoke"
npm run desktop:smoke
Add-Report "- npm run desktop:smoke completed"

Add-Report "`n## Forbidden Commands"
Add-Report "- This script does not run deploy commands."
Add-Report "- This script does not run Vercel commands."
Add-Report "- This script does not run git push."

Write-Host "UAOS V1 validation complete: $Report" -ForegroundColor Green
