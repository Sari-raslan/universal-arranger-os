#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoPath)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

$gate = Join-Path $RepoPath "scripts\UAOS_RELEASE_GATE.ps1"
if (-not (Test-Path -LiteralPath $gate)) {
    throw "Release gate script is missing: $gate"
}

$autopilotPaths = @(
    "scripts/UAOS_MASTER_SEQUENTIAL_AUTOPILOT.ps1",
    "scripts/autopilot/00-preflight.ps1",
    "scripts/autopilot/10-quality.ps1",
    "scripts/autopilot/20-runtime.ps1",
    "scripts/autopilot/30-release-gate.ps1",
    "scripts/autopilot/40-inventory.ps1",
    "scripts/autopilot/50-final-status.ps1",
    "tests/master-sequential-autopilot.test.mjs"
)

$stashBefore = @(git stash list)
$stashCreated = $false

try {
    git stash push `
        --include-untracked `
        --message "uaos-autopilot-release-gate-selftest" `
        -- $autopilotPaths

    if ($LASTEXITCODE -ne 0) {
        throw "Could not create temporary autopilot self-test stash."
    }

    $stashAfter = @(git stash list)
    $stashCreated = $stashAfter.Count -gt $stashBefore.Count

    powershell.exe `
        -NoProfile `
        -ExecutionPolicy Bypass `
        -File $gate `
        -RepoPath $RepoPath

    if ($LASTEXITCODE -ne 0) {
        throw "Unified release gate failed."
    }
}
finally {
    if ($stashCreated) {
        git stash pop --index
        if ($LASTEXITCODE -ne 0) {
            throw "Could not restore autopilot files from temporary stash."
        }
    }
}

Write-Host "AUTOPILOT RELEASE-GATE STAGE PASS" -ForegroundColor Green