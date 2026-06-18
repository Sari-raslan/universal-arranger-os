#requires -Version 5.1
param([string]$RepoPath)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
exit $LASTEXITCODE