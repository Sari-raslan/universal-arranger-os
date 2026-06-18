#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$RepoPath = "C:\UAOSN20260617-000536\wt",
    [ValidateSet(
        "menu",
        "launch",
        "autopilot",
        "release-gate",
        "runtime-smoke",
        "status",
        "reports",
        "stop"
    )]
    [string]$Action = "menu"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-Repo {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Repository not found: $Path"
    }

    return (Resolve-Path -LiteralPath $Path).Path
}

function Stop-Port([int]$Port) {
    $connections = Get-NetTCPConnection `
        -LocalPort $Port `
        -State Listen `
        -ErrorAction SilentlyContinue

    if ($connections) {
        $connections |
            Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object {
                Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
            }
    }
}

function Invoke-Script {
    param(
        [string]$ScriptPath,
        [string[]]$Arguments = @()
    )

    if (-not (Test-Path -LiteralPath $ScriptPath)) {
        throw "Script not found: $ScriptPath"
    }

    & powershell.exe `
        -NoProfile `
        -ExecutionPolicy Bypass `
        -File $ScriptPath `
        @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "Script failed: $ScriptPath"
    }
}

function Show-Status {
    Set-Location -LiteralPath $script:RepoPath

    if (Test-Path -LiteralPath "backend/data/projects.json") {
        git restore --source=HEAD --worktree -- "backend/data/projects.json" 2>$null
    }

    Write-Host "`nGit status" -ForegroundColor Cyan
    git status -sb

    Write-Host "`nLatest commit" -ForegroundColor Cyan
    git log -1 --oneline

    Write-Host "`nNode / npm" -ForegroundColor Cyan
    node --version
    npm --version
}

function Open-Reports {
    $reportRoot = Join-Path $script:RepoPath "reports"
    [System.IO.Directory]::CreateDirectory($reportRoot) | Out-Null
    Start-Process explorer.exe -ArgumentList "`"$reportRoot`""
}

function Start-UAOS {
    Set-Location -LiteralPath $script:RepoPath

    Stop-Port 5180
    Stop-Port 5199

    $reportDir = Join-Path $script:RepoPath "reports\control-center"
    [System.IO.Directory]::CreateDirectory($reportDir) | Out-Null
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"

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
            "Set-Location -LiteralPath '$script:RepoPath'; node backend/server.js"
        ) `
        -WorkingDirectory $script:RepoPath `
        -RedirectStandardOutput $backendOut `
        -RedirectStandardError $backendErr `
        -PassThru

    $frontend = Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList @(
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-Command",
            "Set-Location -LiteralPath '$script:RepoPath'; npm --prefix uaos-live-clean run dev -- --host 127.0.0.1 --port 5180"
        ) `
        -WorkingDirectory $script:RepoPath `
        -RedirectStandardOutput $frontendOut `
        -RedirectStandardError $frontendErr `
        -PassThru

    Start-Sleep -Seconds 4
    Start-Process "http://127.0.0.1:5180"

    Write-Host "`nUAOS launched" -ForegroundColor Green
    Write-Host "Frontend PID: $($frontend.Id)"
    Write-Host "Backend PID: $($backend.Id)"
    Write-Host "URL: http://127.0.0.1:5180"
}

function Stop-UAOS {
    Stop-Port 5180
    Stop-Port 5199
    Write-Host "UAOS local services stopped." -ForegroundColor Green
}

function Run-Autopilot {
    $path = Join-Path $script:RepoPath "scripts\UAOS_MASTER_SEQUENTIAL_AUTOPILOT.ps1"
    Invoke-Script `
        -ScriptPath $path `
        -Arguments @("-RepoPath", $script:RepoPath)
}

function Run-ReleaseGate {
    $path = Join-Path $script:RepoPath "scripts\UAOS_RELEASE_GATE.ps1"
    Invoke-Script `
        -ScriptPath $path `
        -Arguments @("-RepoPath", $script:RepoPath)
}

function Run-RuntimeSmoke {
    $path = Join-Path $script:RepoPath "scripts\UAOS_RUNTIME_ROUTE_SMOKE.ps1"
    Invoke-Script `
        -ScriptPath $path `
        -Arguments @("-RepoPath", $script:RepoPath)
}

function Show-Menu {
    while ($true) {
        Clear-Host
        Write-Host "UAOS CONTROL CENTER" -ForegroundColor Cyan
        Write-Host "==================="
        Write-Host "1. Launch UAOS"
        Write-Host "2. Run master autopilot"
        Write-Host "3. Run release gate"
        Write-Host "4. Run runtime smoke"
        Write-Host "5. Show Git status"
        Write-Host "6. Open reports"
        Write-Host "7. Stop local services"
        Write-Host "0. Exit"

        $choice = Read-Host "`nSelect"

        try {
            switch ($choice) {
                "1" { Start-UAOS; Read-Host "Press Enter" | Out-Null }
                "2" { Run-Autopilot; Read-Host "Press Enter" | Out-Null }
                "3" { Run-ReleaseGate; Read-Host "Press Enter" | Out-Null }
                "4" { Run-RuntimeSmoke; Read-Host "Press Enter" | Out-Null }
                "5" { Show-Status; Read-Host "Press Enter" | Out-Null }
                "6" { Open-Reports }
                "7" { Stop-UAOS; Read-Host "Press Enter" | Out-Null }
                "0" { return }
                default { Write-Host "Invalid selection." -ForegroundColor Yellow; Start-Sleep 1 }
            }
        } catch {
            Write-Host $_.Exception.Message -ForegroundColor Red
            Read-Host "Press Enter" | Out-Null
        }
    }
}

$script:RepoPath = Resolve-Repo $RepoPath

switch ($Action) {
    "menu" { Show-Menu }
    "launch" { Start-UAOS }
    "autopilot" { Run-Autopilot }
    "release-gate" { Run-ReleaseGate }
    "runtime-smoke" { Run-RuntimeSmoke }
    "status" { Show-Status }
    "reports" { Open-Reports }
    "stop" { Stop-UAOS }
}