#requires -Version 5.1
param([string]$RepoPath)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

if (Test-Path -LiteralPath "backend/data/projects.json") {
    git restore --source=HEAD --worktree -- "backend/data/projects.json" 2>$null
}

Write-Host "`nFINAL GIT STATUS"
git status -sb

Write-Host "`nLATEST COMMIT"
git log -1 --oneline

Write-Host "`nUAOS MASTER SEQUENTIAL AUTOPILOT PASS" -ForegroundColor Green