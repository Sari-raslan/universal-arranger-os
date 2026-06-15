[CmdletBinding()]
param([string]$Root)

$ErrorActionPreference = "Stop"

if (-not $Root) {
    $Root = Split-Path -Parent $PSScriptRoot
}

$App = Join-Path $Root "uaos-live-clean"
$Failures = @()
$Warnings = @()

$Required = @(
    (Join-Path $App "package.json"),
    (Join-Path $App "src"),
    (Join-Path $App "dist\index.html")
)

foreach ($Path in $Required) {
    if (-not (Test-Path $Path)) {
        $Failures += "Missing: $Path"
    }
}

$RuntimeIndex = Join-Path $App "src\runtime\index.js"

if (-not (Test-Path $RuntimeIndex)) {
    $Warnings += "Phase 11 runtime index is not present."
}

$Result = [pscustomobject]@{
    generatedAt = (Get-Date).ToString("o")
    status = if ($Failures.Count -eq 0) { "PASS" } else { "FAIL" }
    failures = $Failures
    warnings = $Warnings
}

$Output = Join-Path $Root "reports\UAOS_RELEASE_GATE_LATEST.json"
$Result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $Output -Encoding utf8
$Result | ConvertTo-Json -Depth 10

if ($Failures.Count -gt 0) { exit 1 }
exit 0
