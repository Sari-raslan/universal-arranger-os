#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$RepoPath = "C:\UAOSN20260617-000536\wt",
    [switch]$SkipRuntimeSmoke
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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
$reportDir = Join-Path $RepoPath "reports\release-gate"
[System.IO.Directory]::CreateDirectory($reportDir) | Out-Null
$reportPath = Join-Path $reportDir "UAOS_RELEASE_GATE_$stamp.txt"

$results = New-Object System.Collections.Generic.List[object]

function Record(
    [string]$Name,
    [bool]$Passed,
    [string]$Details
) {
    $results.Add([pscustomobject]@{
        Name = $Name
        Passed = $Passed
        Details = $Details
    })
}

try {
    Step "Git state"
    $branch = (git branch --show-current).Trim()
    $head = (git rev-parse --short HEAD).Trim()
    $status = @(git status --porcelain)

    if (Test-Path -LiteralPath "backend/data/projects.json") {
        git restore --source=HEAD --worktree -- "backend/data/projects.json" 2>$null
        $status = @(git status --porcelain)
    }

    $allowedSelfTestChanges = @(
        "scripts/UAOS_RELEASE_GATE.ps1",
        "tests/release-gate-script.test.mjs"
    )

    $nonReportChanges = @($status | Where-Object {
        $entry = $_
        $path = if ($entry.Length -ge 4) {
            $entry.Substring(3).Trim()
        } else {
            $entry.Trim()
        }

        $path -notin $allowedSelfTestChanges -and
        $path -notlike "reports/*" -and
        $path -notlike "release-kit/e2e/*"
    })

    if ($nonReportChanges.Count -gt 0) {
        Record "Git clean" $false ($nonReportChanges -join "; ")
        throw "Working tree contains non-report changes."
    }

    Record "Git clean" $true "Branch=$branch; HEAD=$head"

    Run "Unit and integration tests" { npm test }
    Record "npm test" $true "PASS"

    Run "Static checks" { npm run check }
    Record "npm run check" $true "PASS"

    Run "Production build" { npm run build }
    Record "npm run build" $true "PASS"

    $dist = Join-Path $RepoPath "uaos-live-clean\dist"
    if (-not (Test-Path -LiteralPath $dist)) {
        Record "Frontend dist" $false "Missing $dist"
        throw "Frontend dist directory is missing."
    }

    $assets = @(Get-ChildItem -LiteralPath $dist -Recurse -File)
    $totalBytes = ($assets | Measure-Object -Property Length -Sum).Sum
    $largest = $assets | Sort-Object Length -Descending | Select-Object -First 1

    Record "Frontend dist" $true (
        "Files={0}; TotalBytes={1}; Largest={2}:{3}" -f
        $assets.Count,
        $totalBytes,
        $largest.Name,
        $largest.Length
    )

    if (-not $SkipRuntimeSmoke) {
        $runtimeScript = Join-Path $RepoPath "scripts\UAOS_RUNTIME_ROUTE_SMOKE.ps1"

        if (-not (Test-Path -LiteralPath $runtimeScript)) {
            Record "Runtime route smoke" $false "Script missing"
            throw "Runtime smoke script is missing."
        }

        Run "Runtime route smoke" {
            powershell.exe `
                -NoProfile `
                -ExecutionPolicy Bypass `
                -File $runtimeScript `
                -RepoPath $RepoPath
        }

        Record "Runtime route smoke" $true "PASS"
    } else {
        Record "Runtime route smoke" $true "SKIPPED BY REQUEST"
    }

    $manifest = [ordered]@{
        generatedAt = (Get-Date).ToString("o")
        branch = $branch
        commit = $head
        node = (node --version)
        npm = (npm --version)
        distFileCount = $assets.Count
        distTotalBytes = $totalBytes
        largestAsset = if ($largest) {
            [ordered]@{
                name = $largest.Name
                bytes = $largest.Length
            }
        } else {
            $null
        }
        runtimeSmokeSkipped = [bool]$SkipRuntimeSmoke
        status = "PASS"
    }

    $manifestPath = Join-Path $reportDir "UAOS_RELEASE_MANIFEST_$stamp.json"
    Write-Utf8NoBom $manifestPath ($manifest | ConvertTo-Json -Depth 5)

    Record "Release manifest" $true $manifestPath
} catch {
    Record "Release gate" $false $_.Exception.Message
    throw
} finally {
    $summary = @()
    $summary += "UAOS RELEASE GATE"
    $summary += "Generated: $(Get-Date -Format o)"
    $summary += ""

    foreach ($result in $results) {
        $state = if ($result.Passed) { "PASS" } else { "FAIL" }
        $summary += ("{0}: {1} - {2}" -f $state, $result.Name, $result.Details)
    }

    Write-Utf8NoBom $reportPath ($summary -join "`n")
    Write-Host "`nReport: $reportPath"

    if (Test-Path -LiteralPath "backend/data/projects.json") {
        git restore --source=HEAD --worktree -- "backend/data/projects.json" 2>$null
    }
}

Write-Host "`nUAOS RELEASE GATE PASS" -ForegroundColor Green