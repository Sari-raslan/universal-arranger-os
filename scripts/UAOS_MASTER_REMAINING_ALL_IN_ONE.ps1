param(
    [switch]$SkipInstall,
    [switch]$SkipDesktopSmoke,
    [switch]$SkipRuntimeCheck
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot = Split-Path -Parent $ScriptDir
$ReportDir = Join-Path $AppRoot "reports\master-launcher"
$LogFile = Join-Path $ReportDir "run.log"
$JsonReport = Join-Path $ReportDir "report.json"
$MdReport = Join-Path $ReportDir "report.md"

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$Results = [ordered]@{
    startedAt = (Get-Date).ToString("o")
    repositoryRoot = $AppRoot
    branch = $null
    head = $null
    checks = @()
    status = "RUNNING"
}

function Write-Log {
    param(
        [Parameter(Mandatory)][string]$Message,
        [ValidateSet("INFO","PASS","WARN","FAIL")][string]$Level = "INFO"
    )
    $line = "{0} | [{1}] | {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
    Write-Host $line
    Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
}

function Add-Check {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Status,
        [string]$Details = ""
    )
    $Results.checks += [ordered]@{ name = $Name; status = $Status; details = $Details }
}

function Invoke-NativeChecked {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter(Mandatory)][string[]]$Arguments,
        [string]$WorkingDirectory = $AppRoot
    )

    Write-Log "Starting: $Name"
    Push-Location $WorkingDirectory
    try {
        & $FilePath @Arguments 2>&1 | Tee-Object -FilePath $LogFile -Append
        $exitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    if ($exitCode -ne 0) {
        Add-Check -Name $Name -Status "FAIL" -Details "Exit code $exitCode"
        Write-Log "$Name failed with exit code $exitCode" "FAIL"
        throw "$Name failed with exit code $exitCode"
    }

    Add-Check -Name $Name -Status "PASS"
    Write-Log "$Name completed successfully" "PASS"
}

function Test-RequiredPath {
    param([Parameter(Mandatory)][string]$RelativePath)
    $full = Join-Path $AppRoot $RelativePath
    if (-not (Test-Path -LiteralPath $full)) {
        Add-Check -Name "Required path: $RelativePath" -Status "FAIL" -Details "Missing"
        throw "Missing required path: $RelativePath"
    }
    Add-Check -Name "Required path: $RelativePath" -Status "PASS"
}

function Test-CommandAvailable {
    param([Parameter(Mandatory)][string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Add-Check -Name "Tool: $Name" -Status "FAIL" -Details "Not found in PATH"
        throw "Required tool not found in PATH: $Name"
    }
    Add-Check -Name "Tool: $Name" -Status "PASS"
}

function Install-Dependencies {
    param([string]$Directory,[string]$Name)
    if (-not (Test-Path -LiteralPath (Join-Path $Directory "package.json"))) {
        Add-Check -Name "$Name dependencies" -Status "SKIP" -Details "No package.json"
        return
    }

    if (Test-Path -LiteralPath (Join-Path $Directory "package-lock.json")) {
        Invoke-NativeChecked -Name "$Name npm ci" -FilePath "npm" -Arguments @("ci") -WorkingDirectory $Directory
    } else {
        Invoke-NativeChecked -Name "$Name npm install" -FilePath "npm" -Arguments @("install") -WorkingDirectory $Directory
    }
}

function Test-NpmScriptExists {
    param([string]$PackageJsonPath,[string]$ScriptName)
    if (-not (Test-Path -LiteralPath $PackageJsonPath)) { return $false }
    $pkg = Get-Content -LiteralPath $PackageJsonPath -Raw | ConvertFrom-Json
    return $null -ne $pkg.scripts.$ScriptName
}

function Write-Reports {
    $Results.finishedAt = (Get-Date).ToString("o")
    $Results | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $JsonReport -Encoding UTF8

    $lines = @(
        "# UAOS Master Verification Report",
        "",
        "- Started: $($Results.startedAt)",
        "- Finished: $($Results.finishedAt)",
        "- Repository: $($Results.repositoryRoot)",
        "- Branch: $($Results.branch)",
        "- HEAD: $($Results.head)",
        "- Status: **$($Results.status)**",
        "",
        "## Checks",
        ""
    )
    foreach ($check in $Results.checks) {
        $detail = if ([string]::IsNullOrWhiteSpace($check.details)) { "" } else { " — $($check.details)" }
        $lines += "- **$($check.status)** — $($check.name)$detail"
    }
    $lines | Set-Content -LiteralPath $MdReport -Encoding UTF8
}

try {
    Set-Location $AppRoot
    "" | Set-Content -LiteralPath $LogFile -Encoding UTF8
    Write-Log "Starting hardened UAOS master verification"

    foreach ($path in @("package.json","backend\server.js","uaos-live-clean\package.json","scripts")) {
        Test-RequiredPath -RelativePath $path
    }

    foreach ($tool in @("node","npm","git")) {
        Test-CommandAvailable -Name $tool
    }

    $Results.branch = (& git branch --show-current).Trim()
    $Results.head = (& git rev-parse HEAD).Trim()

    Add-Check -Name "Destructive cleanup" -Status "SKIP" -Details "Disabled by design"

    if (-not $SkipInstall) {
        Install-Dependencies -Directory $AppRoot -Name "Root"
        Install-Dependencies -Directory (Join-Path $AppRoot "backend") -Name "Backend"
        Install-Dependencies -Directory (Join-Path $AppRoot "uaos-live-clean") -Name "Frontend"
    }

    $rootPackage = Join-Path $AppRoot "package.json"

    if (-not (Test-NpmScriptExists -PackageJsonPath $rootPackage -ScriptName "check")) {
        throw "Required npm script 'check' is missing"
    }
    Invoke-NativeChecked -Name "Root static checks and tests" -FilePath "npm" -Arguments @("run","check") -WorkingDirectory $AppRoot

    if (-not (Test-NpmScriptExists -PackageJsonPath $rootPackage -ScriptName "build")) {
        throw "Required npm script 'build' is missing"
    }
    Invoke-NativeChecked -Name "Production build" -FilePath "npm" -Arguments @("run","build") -WorkingDirectory $AppRoot

    $artifact = Join-Path $AppRoot "uaos-live-clean\dist\index.html"
    if (-not (Test-Path -LiteralPath $artifact)) {
        throw "Build artifact missing: uaos-live-clean/dist/index.html"
    }
    Add-Check -Name "Build artifact" -Status "PASS" -Details "uaos-live-clean/dist/index.html"

    if (-not $SkipDesktopSmoke -and (Test-NpmScriptExists -PackageJsonPath $rootPackage -ScriptName "desktop:smoke")) {
        Invoke-NativeChecked -Name "Desktop smoke test" -FilePath "npm" -Arguments @("run","desktop:smoke") -WorkingDirectory $AppRoot
    } else {
        Add-Check -Name "Desktop smoke test" -Status "SKIP"
    }

    if (-not $SkipRuntimeCheck -and (Test-NpmScriptExists -PackageJsonPath $rootPackage -ScriptName "runtime:check")) {
        Invoke-NativeChecked -Name "Runtime verification" -FilePath "npm" -Arguments @("run","runtime:check") -WorkingDirectory $AppRoot
    } else {
        Add-Check -Name "Runtime verification" -Status "SKIP"
    }

    $envExamples = Get-ChildItem -Path $AppRoot -Recurse -Filter ".env.example" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch "[\\/]node_modules[\\/]" }

    $secretPattern = "(sk_live_|pk_live_|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z\-_]{20,})"
    foreach ($file in $envExamples) {
        $text = Get-Content -LiteralPath $file.FullName -Raw
        if ($text -match $secretPattern) {
            throw "Potential live credential pattern found in $($file.FullName)"
        }
        Add-Check -Name "Environment template: $($file.FullName)" -Status "PASS"
    }

    $Results.status = "PASS"
    Write-Log "UAOS master verification completed successfully" "PASS"
}
catch {
    $Results.status = "FAIL"
    Write-Log $_.Exception.Message "FAIL"
    throw
}
finally {
    Write-Reports
    Write-Log "Reports written to $ReportDir"
}