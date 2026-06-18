#requires -Version 5.1
param([string]$RepoPath)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

if (Test-Path -LiteralPath "backend/data/projects.json") {
    git restore --source=HEAD --worktree -- "backend/data/projects.json" 2>$null
}

$branch = (git branch --show-current).Trim()
$head = (git rev-parse --short HEAD).Trim()
Write-Host "Branch: $branch"
Write-Host "HEAD: $head"
node --version
npm --version
git status -sb