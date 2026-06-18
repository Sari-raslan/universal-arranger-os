#requires -Version 5.1
param([string]$RepoPath)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

$runtime = Join-Path $RepoPath "scripts\UAOS_RUNTIME_ROUTE_SMOKE.ps1"
if (-not (Test-Path -LiteralPath $runtime)) {
    throw "Runtime smoke script is missing: $runtime"
}

powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runtime -RepoPath $RepoPath
exit $LASTEXITCODE