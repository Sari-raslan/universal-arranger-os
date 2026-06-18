#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$RepoPath = "C:\UAOSN20260617-000536\wt",
    [string]$Channel = "rc"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string]$Path, [string]$Content) {
    $fullPath = [System.IO.Path]::GetFullPath($Path)
    $directory = [System.IO.Path]::GetDirectoryName($fullPath)
    if ($directory) {
        [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    }

    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText(
        $fullPath,
        ($Content -replace "`r`n", "`n"),
        $utf8
    )
}

if (-not (Test-Path -LiteralPath $RepoPath)) {
    throw "Repository not found: $RepoPath"
}

$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$commit = (git rev-parse --short HEAD).Trim()
$branch = (git branch --show-current).Trim()
$version = "0.0.0"

$packageCandidates = @(
    (Join-Path $RepoPath "uaos-live-clean\package.json"),
    (Join-Path $RepoPath "package.json")
)

foreach ($candidate in $packageCandidates) {
    if (Test-Path -LiteralPath $candidate) {
        try {
            $pkg = Get-Content -LiteralPath $candidate -Raw | ConvertFrom-Json
            if ($pkg.version) {
                $version = [string]$pkg.version
                break
            }
        } catch {}
    }
}

$releaseRoot = Join-Path $RepoPath "release-kit\release-candidate"
$bundleName = "UAOS-$version-$Channel-$commit-$stamp"
$bundleDir = Join-Path $releaseRoot $bundleName
[System.IO.Directory]::CreateDirectory($bundleDir) | Out-Null

$dist = Join-Path $RepoPath "uaos-live-clean\dist"
if (-not (Test-Path -LiteralPath $dist)) {
    throw "Frontend dist not found: $dist"
}

$webDir = Join-Path $bundleDir "web"
Copy-Item -LiteralPath $dist -Destination $webDir -Recurse -Force

$optionalArtifacts = @(
    (Join-Path $RepoPath "dist"),
    (Join-Path $RepoPath "release"),
    (Join-Path $RepoPath "win-unpacked"),
    (Join-Path $RepoPath "desktop\dist"),
    (Join-Path $RepoPath "uaos-live-clean\dist-electron")
)

$artifactCopies = @()

foreach ($artifact in $optionalArtifacts) {
    if (Test-Path -LiteralPath $artifact) {
        $leaf = Split-Path -Leaf $artifact
        $target = Join-Path $bundleDir ("optional-" + $leaf)

        if ((Get-Item -LiteralPath $artifact).PSIsContainer) {
            Copy-Item -LiteralPath $artifact -Destination $target -Recurse -Force
        } else {
            Copy-Item -LiteralPath $artifact -Destination $target -Force
        }

        $artifactCopies += $target
    }
}

$notes = @()
$notes += "# UAOS Release Candidate"
$notes += ""
$notes += "- Version: $version"
$notes += "- Channel: $Channel"
$notes += "- Commit: $commit"
$notes += "- Branch: $branch"
$notes += "- Generated: $(Get-Date -Format o)"
$notes += ""
$notes += "## Included"
$notes += "- Production web build"
$notes += "- SHA-256 checksums"
$notes += "- Machine-readable manifest"

if ($artifactCopies.Count -gt 0) {
    $notes += "- Optional desktop/build artifacts found locally"
}

$recent = @(git log -10 --pretty=format:"- %h %s")
if ($recent.Count -gt 0) {
    $notes += ""
    $notes += "## Recent changes"
    $notes += $recent
}

Write-Utf8NoBom (Join-Path $bundleDir "RELEASE_NOTES.md") ($notes -join "`n")

$files = @(Get-ChildItem -LiteralPath $bundleDir -Recurse -File)
$checksums = @()

foreach ($file in $files) {
    $relative = $file.FullName.Substring($bundleDir.Length).TrimStart('\') -replace '\\','/'
    $hash = Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256

    $checksums += [pscustomobject]@{
        path = $relative
        bytes = $file.Length
        sha256 = $hash.Hash.ToLowerInvariant()
    }
}

$manifest = [ordered]@{
    generatedAt = (Get-Date).ToString("o")
    version = $version
    channel = $Channel
    commit = $commit
    branch = $branch
    node = (node --version)
    npm = (npm --version)
    fileCount = $checksums.Count
    totalBytes = (($files | Measure-Object -Property Length -Sum).Sum)
    files = $checksums
}

$manifestPath = Join-Path $bundleDir "manifest.json"
Write-Utf8NoBom $manifestPath ($manifest | ConvertTo-Json -Depth 8)

$checksumsPath = Join-Path $bundleDir "SHA256SUMS.txt"
$checksumLines = $checksums | ForEach-Object {
    "$($_.sha256)  $($_.path)"
}
Write-Utf8NoBom $checksumsPath ($checksumLines -join "`n")

$zipPath = Join-Path $releaseRoot ($bundleName + ".zip")
if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive `
    -LiteralPath $bundleDir `
    -DestinationPath $zipPath `
    -CompressionLevel Optimal

$zipHash = Get-FileHash -LiteralPath $zipPath -Algorithm SHA256

Write-Host "`nUAOS RELEASE CANDIDATE PACKAGE PASS" -ForegroundColor Green
Write-Host "Bundle: $bundleDir"
Write-Host "ZIP: $zipPath"
Write-Host "ZIP SHA256: $($zipHash.Hash.ToLowerInvariant())"