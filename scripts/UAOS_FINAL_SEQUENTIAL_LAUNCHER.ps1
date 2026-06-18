#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$RepoPath = "C:\UAOSN20260617-000536\wt",
    [switch]$SkipRuntime,
    [switch]$SkipPackaging
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Step([string]$Message) {
    Write-Host "`n==================================================" -ForegroundColor DarkCyan
    Write-Host "==> $Message" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor DarkCyan
}

function Run([string]$Label, [scriptblock]$Command) {
    Step $Label
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

function Invoke-UaosScript(
    [string]$Name,
    [string]$RelativePath,
    [string[]]$Arguments
) {
    $path = Join-Path $script:RepoPath $RelativePath

    if (-not (Test-Path -LiteralPath $path)) {
        Write-Host "SKIP: $Name â€” missing $RelativePath" -ForegroundColor Yellow
        return
    }

    Run $Name {
        powershell.exe `
            -NoProfile `
            -ExecutionPolicy Bypass `
            -File $path `
            @Arguments
    }
}

if (-not (Test-Path -LiteralPath $RepoPath)) {
    throw "Repository not found: $RepoPath"
}

$script:RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $script:RepoPath

if (Test-Path -LiteralPath "backend/data/projects.json") {
    git restore --source=HEAD --worktree -- "backend/data/projects.json" 2>$null
}

Invoke-UaosScript `
    -Name "Master sequential autopilot" `
    -RelativePath "scripts\UAOS_MASTER_SEQUENTIAL_AUTOPILOT.ps1" `
    -Arguments @("-RepoPath", $script:RepoPath)

if (-not $SkipRuntime) {
    Invoke-UaosScript `
        -Name "Runtime route smoke" `
        -RelativePath "scripts\UAOS_RUNTIME_ROUTE_SMOKE.ps1" `
        -Arguments @("-RepoPath", $script:RepoPath)
}

Invoke-UaosScript `
    -Name "Unified release gate" `
    -RelativePath "scripts\UAOS_RELEASE_GATE.ps1" `
    -Arguments @("-RepoPath", $script:RepoPath)

if (-not $SkipPackaging) {
    Invoke-UaosScript `
        -Name "Release candidate packaging" `
        -RelativePath "scripts\UAOS_BUILD_RELEASE_CANDIDATE.ps1" `
        -Arguments @("-RepoPath", $script:RepoPath, "-Channel", "rc")
}

Run "Final tests" { npm test }
Run "Final checks" { npm run check }
Run "Final production build" { npm run build }

$reportDir = Join-Path $script:RepoPath "reports\final-sequential-launcher"
[System.IO.Directory]::CreateDirectory($reportDir) | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$report = Join-Path $reportDir "FINAL_STATUS_$stamp.txt"

@(
    "UAOS FINAL SEQUENTIAL LAUNCHER",
    "Generated: $(Get-Date -Format o)",
    "Branch: $((git branch --show-current).Trim())",
    "Commit: $((git rev-parse --short HEAD).Trim())",
    "Node: $(node --version)",
    "npm: $(npm --version)",
    "Status: PASS"
) | Set-Content -LiteralPath $report -Encoding UTF8

if (Test-Path -LiteralPath "backend/data/projects.json") {
    git restore --source=HEAD --worktree -- "backend/data/projects.json" 2>$null
}

Write-Host "`nUAOS FINAL SEQUENTIAL LAUNCHER PASS" -ForegroundColor Green
Write-Host "Report: $report"
git status -sb