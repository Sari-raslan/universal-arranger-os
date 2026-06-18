#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$RepoPath = "C:\UAOSN20260617-000536\wt",
    [int]$FrontendPort = 5180,
    [int]$BackendPort = 5199
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Utf8NoBom([string]$AbsolutePath, [string]$Content) {
    $fullPath = [System.IO.Path]::GetFullPath($AbsolutePath)
    $directory = [System.IO.Path]::GetDirectoryName($fullPath)

    if (-not [string]::IsNullOrWhiteSpace($directory)) {
        [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    }

    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText(
        $fullPath,
        ($Content -replace "`r`n", "`n"),
        $utf8
    )
}

function Find-Browser {
    $candidates = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )

    return $candidates |
        Where-Object { $_ -and (Test-Path -LiteralPath $_) } |
        Select-Object -First 1
}

function Stop-Port([int]$Port) {
    $listeners = Get-NetTCPConnection `
        -LocalPort $Port `
        -State Listen `
        -ErrorAction SilentlyContinue

    if ($listeners) {
        $listeners |
            Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object {
                Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
            }

        Start-Sleep -Seconds 2
    }
}

function Wait-Http([string]$Url, [int]$Seconds = 40) {
    $deadline = (Get-Date).AddSeconds($Seconds)

    do {
        try {
            $response = Invoke-WebRequest `
                -Uri $Url `
                -UseBasicParsing `
                -TimeoutSec 5

            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return $true
            }
        } catch {
            Start-Sleep -Milliseconds 750
        }
    } while ((Get-Date) -lt $deadline)

    return $false
}

function Get-Dom(
    [string]$Browser,
    [string]$Url,
    [string]$ErrorLog
) {
    $arguments = @(
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-sync",
        "--disable-features=OptimizationHints,MediaRouter",
        "--virtual-time-budget=7000",
        "--dump-dom",
        $Url
    )

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Browser
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true

    $escapedArguments = foreach ($argument in $arguments) {
        if ($argument -match '[\s"]') {
            '"' + ($argument -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1') + '"'
        } else {
            $argument
        }
    }

    $psi.Arguments = ($escapedArguments -join ' ')

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    [void]$process.Start()

    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()

    $process.WaitForExit()

    $dom = $stdoutTask.GetAwaiter().GetResult()
    $stderr = $stderrTask.GetAwaiter().GetResult()

    if (-not [string]::IsNullOrWhiteSpace($stderr)) {
        Write-Utf8NoBom $ErrorLog $stderr
    }

    if ([string]::IsNullOrWhiteSpace($dom)) {
        throw "Browser returned no DOM for $Url"
    }

    return $dom
}

if (-not (Test-Path -LiteralPath $RepoPath)) {
    throw "Repository not found: $RepoPath"
}

$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
Set-Location -LiteralPath $RepoPath

$browser = Find-Browser
if (-not $browser) {
    throw "Chrome or Edge was not found."
}

$reportDir = Join-Path $RepoPath "reports\runtime-route-smoke"
[System.IO.Directory]::CreateDirectory($reportDir) | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportPath = Join-Path $reportDir "runtime-route-smoke-$stamp.txt"

Stop-Port $FrontendPort
Stop-Port $BackendPort

$backendOut = Join-Path $reportDir "backend-$stamp.out.log"
$backendErr = Join-Path $reportDir "backend-$stamp.err.log"
$frontendOut = Join-Path $reportDir "frontend-$stamp.out.log"
$frontendErr = Join-Path $reportDir "frontend-$stamp.err.log"

$backend = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "Set-Location -LiteralPath '$RepoPath'; node backend/server.js"
    ) `
    -WorkingDirectory $RepoPath `
    -RedirectStandardOutput $backendOut `
    -RedirectStandardError $backendErr `
    -PassThru `
    -WindowStyle Hidden

$frontend = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "Set-Location -LiteralPath '$RepoPath'; npm --prefix uaos-live-clean run dev -- --host 127.0.0.1 --port $FrontendPort"
    ) `
    -WorkingDirectory $RepoPath `
    -RedirectStandardOutput $frontendOut `
    -RedirectStandardError $frontendErr `
    -PassThru `
    -WindowStyle Hidden

try {
    if (-not (Wait-Http "http://127.0.0.1:$BackendPort/health")) {
        throw "Backend health endpoint did not become ready."
    }

    if (-not (Wait-Http "http://127.0.0.1:$FrontendPort")) {
        throw "Frontend did not become ready."
    }

    $routes = @(
        "home",
        "studio",
        "audio",
        "sampler",
        "ai",
        "midi",
        "hardware",
        "arranger",
        "pro",
        "sounds",
        "sessions",
        "timeline",
        "downloads",
        "diagnostics",
        "pricing",
        "status"
    )

    $results = @()

    foreach ($route in $routes) {
        $url = "http://127.0.0.1:$FrontendPort/#/$route"
        $domPath = Join-Path $reportDir "$route-$stamp.html"
        $browserErr = Join-Path $reportDir "$route-$stamp.browser.err.log"

        $dom = Get-Dom `
            -Browser $browser `
            -Url $url `
            -ErrorLog $browserErr

        Write-Utf8NoBom $domPath $dom

        $hasRoot = $dom -match '<div id="root"'
        $hasRuntimeError = $dom -match 'UAOS could not render this screen'
        $stuckLoading = $dom -match 'Loading UAOS module\.\.\.'
        $hasAppContent = $dom -match '<main|<section|uaosPage|uaosSurface'

        $passed =
            $hasRoot -and
            $hasAppContent -and
            -not $hasRuntimeError -and
            -not $stuckLoading

        $results += [pscustomobject]@{
            Route = $route
            Pass = $passed
            RuntimeError = $hasRuntimeError
            StuckLoading = $stuckLoading
            DomFile = $domPath
        }

        $label = if ($passed) { "PASS" } else { "FAIL" }
        $color = if ($passed) { "Green" } else { "Red" }

        Write-Host ("{0,-16} {1}" -f $route, $label) `
            -ForegroundColor $color
    }

    $results |
        Format-Table -AutoSize |
        Out-String |
        Set-Content -LiteralPath $reportPath -Encoding UTF8

    $failed = @($results | Where-Object { -not $_.Pass })

    if ($failed.Count -gt 0) {
        $failed | Format-Table -AutoSize
        throw "$($failed.Count) runtime route(s) failed."
    }

    Write-Host "`nRUNTIME ROUTE SMOKE PASS" -ForegroundColor Green
    Write-Host "Report: $reportPath"
} finally {
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue

    if (Test-Path -LiteralPath (Join-Path $RepoPath "backend\data\projects.json")) {
        git -C $RepoPath restore --source=HEAD --worktree -- "backend/data/projects.json" 2>$null
    }
}