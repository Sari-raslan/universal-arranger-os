#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$RepoPath = "C:\UAOSN20260617-000536\wt"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

$stages = @(
    "scripts\autopilot\00-preflight.ps1",
    "scripts\autopilot\10-quality.ps1",
    "scripts\autopilot\20-runtime.ps1",
    "scripts\autopilot\30-release-gate.ps1",
    "scripts\autopilot\40-inventory.ps1",
    "scripts\autopilot\50-final-status.ps1"
)

foreach ($stage in $stages) {
    $path = Join-Path $RepoPath $stage

    if (-not (Test-Path -LiteralPath $path)) {
        throw "Autopilot stage is missing: $path"
    }

    Write-Host "`n==================================================" -ForegroundColor DarkCyan
    Write-Host "RUNNING: $stage" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor DarkCyan

    powershell.exe `
        -NoProfile `
        -ExecutionPolicy Bypass `
        -File $path `
        -RepoPath $RepoPath

    if ($LASTEXITCODE -ne 0) {
        throw "Autopilot stage failed: $stage"
    }
}

Write-Host "`nUAOS MASTER SEQUENTIAL AUTOPILOT COMPLETED" -ForegroundColor Green