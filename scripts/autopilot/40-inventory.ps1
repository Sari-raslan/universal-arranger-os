#requires -Version 5.1
param([string]$RepoPath)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

$reportDir = Join-Path $RepoPath "reports\autopilot"
[System.IO.Directory]::CreateDirectory($reportDir) | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

$extensions = @(
    ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx",
    ".json", ".md", ".ps1", ".yml", ".yaml"
)

$files = Get-ChildItem -LiteralPath $RepoPath -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
        $full = $_.FullName
        $_.Extension -in $extensions -and
        $full -notmatch '\\node_modules\\' -and
        $full -notmatch '\\dist\\' -and
        $full -notmatch '\\.git\\' -and
        $full -notmatch '\\reports\\' -and
        $full -notmatch '\\release-kit\\'
    }

$markers = @()
foreach ($file in $files) {
    $matches = Select-String `
        -LiteralPath $file.FullName `
        -Pattern 'TODO|FIXME|PLACEHOLDER|NOT_IMPLEMENTED|COMING_SOON' `
        -CaseSensitive:$false `
        -ErrorAction SilentlyContinue

    foreach ($match in $matches) {
        $relative = $file.FullName.Substring($RepoPath.Length).TrimStart('\')
        $markers += [pscustomobject]@{
            file = $relative -replace '\\','/'
            line = $match.LineNumber
            text = $match.Line.Trim()
        }

        if ($markers.Count -ge 500) { break }
    }

    if ($markers.Count -ge 500) { break }
}

$expectedAreas = @(
    "backend",
    "uaos-live-clean",
    "tests",
    "scripts",
    "v3-future",
    "mobile"
)

$areas = foreach ($area in $expectedAreas) {
    [pscustomobject]@{
        area = $area
        exists = Test-Path -LiteralPath (Join-Path $RepoPath $area)
    }
}

$result = [ordered]@{
    generatedAt = (Get-Date).ToString("o")
    branch = (git branch --show-current).Trim()
    commit = (git rev-parse --short HEAD).Trim()
    markerCount = $markers.Count
    markers = $markers
    areas = $areas
}

$jsonPath = Join-Path $reportDir "remaining-work-$stamp.json"
$mdPath = Join-Path $reportDir "remaining-work-$stamp.md"

$result | ConvertTo-Json -Depth 8 |
    Set-Content -LiteralPath $jsonPath -Encoding UTF8

$lines = @()
$lines += "# UAOS Remaining Work Inventory"
$lines += ""
$lines += "- Generated: $($result.generatedAt)"
$lines += "- Branch: $($result.branch)"
$lines += "- Commit: $($result.commit)"
$lines += "- Marker count: $($result.markerCount)"
$lines += ""
$lines += "## Area presence"

foreach ($area in $areas) {
    $state = if ($area.exists) { "PASS" } else { "MISSING" }
    $lines += "- $state â€” $($area.area)"
}

$lines += ""
$lines += "## Code markers"

if ($markers.Count -eq 0) {
    $lines += "- No TODO/FIXME/PLACEHOLDER markers found in scanned source files."
} else {
    foreach ($marker in $markers) {
        $lines += "- $($marker.file):$($marker.line) â€” $($marker.text)"
    }
}

$lines | Set-Content -LiteralPath $mdPath -Encoding UTF8

Write-Host "Inventory JSON: $jsonPath"
Write-Host "Inventory Markdown: $mdPath"