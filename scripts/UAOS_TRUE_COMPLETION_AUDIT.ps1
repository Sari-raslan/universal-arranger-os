#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoPath = "C:\UAOSN20260617-000536\wt")

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Utf8NoBom([string]$Path, [string]$Content) {
    $full = [IO.Path]::GetFullPath($Path)
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($full)) | Out-Null
    [IO.File]::WriteAllText(
        $full,
        ($Content -replace "`r`n","`n"),
        (New-Object Text.UTF8Encoding($false))
    )
}

function Try-Json([scriptblock]$Command) {
    try {
        $raw = (& $Command 2>$null | Out-String)
        if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
        return ($raw | ConvertFrom-Json)
    } catch {
        return $null
    }
}

if (-not (Test-Path -LiteralPath $RepoPath)) {
    throw "Repository not found: $RepoPath"
}

$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path $RepoPath "reports\true-completion-audit\$stamp"
[IO.Directory]::CreateDirectory($outDir) | Out-Null

$roots = @(
    "uaos-live-clean\src",
    "backend",
    "electron",
    "desktop",
    "mobile",
    "android",
    "scripts"
)

$extensions = @(
    ".js",".jsx",".mjs",".cjs",".ts",".tsx",".json",".ps1",".cmd",".html",".css"
)

$rules = @(
    @{ rx='(?i)\bTODO\b|\bFIXME\b|\bXXX\b'; type='todo'; severity='medium' },
    @{ rx='(?i)\bplaceholder\b|coming\s+soon|not\s+implemented'; type='placeholder'; severity='high' },
    @{ rx='(?i)\bmock\b|mockMode|demoMode|demo-only|mock-only'; type='mock-demo'; severity='medium' },
    @{ rx='(?i)experimental|metadata-only|read-only'; type='limited'; severity='low' },
    @{ rx='(?i)localhost|127\.0\.0\.1'; type='local-endpoint'; severity='low' }
)

$findings = New-Object 'System.Collections.Generic.List[object]'

foreach ($root in $roots) {
    $absolute = Join-Path $RepoPath $root
    if (-not (Test-Path -LiteralPath $absolute)) { continue }

    $files = Get-ChildItem -LiteralPath $absolute -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object {
            $extensions -contains $_.Extension.ToLowerInvariant() -and
            $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\coverage\\|\\release-kit\\'
        }

    foreach ($file in $files) {
        $relative = $file.FullName.Substring($RepoPath.Length).TrimStart('\') -replace '\\','/'
        $lineNo = 0

        foreach ($line in Get-Content -LiteralPath $file.FullName -ErrorAction SilentlyContinue) {
            $lineNo++

            foreach ($rule in $rules) {
                if ($line -match $rule.rx) {
                    $findings.Add([pscustomobject]@{
                        severity = $rule.severity
                        type = $rule.type
                        path = $relative
                        line = $lineNo
                        text = $line.Trim()
                    })
                }
            }
        }
    }
}

$packageRoots = @(
    @{name='root'; path=$RepoPath},
    @{name='backend'; path=(Join-Path $RepoPath 'backend')},
    @{name='frontend'; path=(Join-Path $RepoPath 'uaos-live-clean')},
    @{name='desktop'; path=(Join-Path $RepoPath 'desktop')}
)

$audits = @()

foreach ($item in $packageRoots) {
    if (-not (Test-Path -LiteralPath (Join-Path $item.path 'package.json'))) { continue }

    Push-Location $item.path
    try {
        $audits += [pscustomobject]@{
            name = $item.name
            audit = (Try-Json { npm audit --json })
            outdated = (Try-Json { npm outdated --json })
        }
    } finally {
        Pop-Location
    }
}

$summary = [ordered]@{
    generatedAt = (Get-Date).ToString('o')
    branch = (git branch --show-current).Trim()
    commit = (git rev-parse --short HEAD).Trim()
    counts = [ordered]@{
        high = @($findings | Where-Object severity -eq 'high').Count
        medium = @($findings | Where-Object severity -eq 'medium').Count
        low = @($findings | Where-Object severity -eq 'low').Count
        total = $findings.Count
    }
    desktop = [ordered]@{
        electronMain = Test-Path -LiteralPath (Join-Path $RepoPath 'electron\main.js')
        desktopPackage = Test-Path -LiteralPath (Join-Path $RepoPath 'desktop\package.json')
    }
    android = [ordered]@{
        javaHome = $env:JAVA_HOME
        androidHome = $env:ANDROID_HOME
        sdkRoot = $env:ANDROID_SDK_ROOT
        gradleWrapper = (
            (Test-Path -LiteralPath (Join-Path $RepoPath 'android\gradlew.bat')) -or
            (Test-Path -LiteralPath (Join-Path $RepoPath 'mobile\android\gradlew.bat'))
        )
    }
    audits = $audits
    findings = $findings
}

Write-Utf8NoBom (Join-Path $outDir 'audit.json') ($summary | ConvertTo-Json -Depth 12)

$markdown = @(
    '# UAOS True Completion Audit',
    '',
    "- Generated: $($summary.generatedAt)",
    "- Commit: $($summary.commit)",
    "- High: $($summary.counts.high)",
    "- Medium: $($summary.counts.medium)",
    "- Low: $($summary.counts.low)",
    '',
    '## Priority',
    '',
    '1. High placeholders / not implemented',
    '2. npm vulnerabilities and breaking upgrades',
    '3. mock/demo-only production paths',
    '4. desktop installer validation',
    '5. Android build and signing readiness',
    '6. physical hardware certification',
    '',
    '## Findings',
    ''
)

foreach ($finding in $findings | Sort-Object severity,path,line) {
    $markdown += "- [$($finding.severity)] $($finding.type) - $($finding.path):$($finding.line)"
    $markdown += "  - $($finding.text)"
}

Write-Utf8NoBom (Join-Path $outDir 'audit.md') ($markdown -join "`n")

Write-Host "`nUAOS TRUE COMPLETION AUDIT PASS" -ForegroundColor Green
Write-Host "Report: $outDir"
Write-Host "Findings: $($findings.Count)"