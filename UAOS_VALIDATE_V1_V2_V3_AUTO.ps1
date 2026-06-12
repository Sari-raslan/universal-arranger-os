$ErrorActionPreference = "Stop"

$Root = "$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$StagesRoot = "$HOME\Desktop\UAOS_SEQUENTIAL_TEST_$Stamp"
$ReportDirectory = Join-Path $Root "reports"
$Log = Join-Path $ReportDirectory "UAOS_V1_V2_V3_VALIDATION_$Stamp.txt"

New-Item -ItemType Directory -Force $ReportDirectory | Out-Null
New-Item -ItemType Directory -Force $StagesRoot | Out-Null

function Log {
    param([string]$Message)

    $Line = "[$(Get-Date -Format 'HH:mm:ss')] $Message"
    Write-Host $Line
    $Line | Out-File -FilePath $Log -Append -Encoding UTF8
}

function Run-Command {
    param(
        [string]$Name,
        [scriptblock]$Command,
        [bool]$Required = $true
    )

    Log "START: $Name"

    & $Command
    $Code = $LASTEXITCODE

    if ($Code -eq 0) {
        Write-Host "$Name PASS" -ForegroundColor Green
        Log "PASS: $Name"
        return $true
    }

    if ($Required) {
        Write-Host "$Name FAILED" -ForegroundColor Red
        throw "$Name failed with exit code $Code"
    }

    Write-Host "$Name WARNING/SKIPPED" -ForegroundColor Yellow
    Log "WARNING: $Name failed with exit code $Code"
    return $false
}

function Install-Package {
    param(
        [string]$WorkingDirectory,
        [string]$Prefix,
        [string]$Name
    )

    $PackagePath = Join-Path $WorkingDirectory "$Prefix\package.json"

    if (!(Test-Path $PackagePath)) {
        Log "$Name install skipped: package.json missing"
        return
    }

    $LockPath = Join-Path $WorkingDirectory "$Prefix\package-lock.json"

    if (Test-Path $LockPath) {
        Run-Command "$Name NPM CI" {
            npm ci --prefix $Prefix
        }
    }
    else {
        Run-Command "$Name NPM INSTALL" {
            npm install --prefix $Prefix
        }
    }
}

function Test-UAOS-Stage {
    param(
        [string]$StageName,
        [string]$Branch
    )

    $SafeName = $Branch -replace '[^a-zA-Z0-9._-]', "-"
    $StagePath = Join-Path $StagesRoot $SafeName

    Log "========================================"
    Log "BEGIN $StageName"
    Log "Branch: origin/$Branch"
    Log "Path: $StagePath"

    git show-ref --verify --quiet "refs/remotes/origin/$Branch"

    if ($LASTEXITCODE -ne 0) {
        throw "Remote branch not found: origin/$Branch"
    }

    if (Test-Path $StagePath) {
        git worktree remove --force "$StagePath" 2>$null
        Remove-Item "$StagePath" -Recurse -Force -ErrorAction SilentlyContinue
    }

    Run-Command "$StageName CREATE WORKTREE" {
        git worktree add --detach "$StagePath" "origin/$Branch"
    }

    Set-Location $StagePath

    $Markers = @(
        Get-ChildItem `
            -Path $StagePath `
            -Recurse `
            -File `
            -Include *.js,*.jsx,*.mjs,*.cjs,*.ts,*.tsx,*.json,*.css `
            -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -notmatch "\\node_modules\\" -and
            $_.FullName -notmatch "\\dist\\" -and
            $_.FullName -notmatch "\\reports\\"
        } |
        Select-String -Pattern '^(<<<<<<<|=======|>>>>>>>)'
    )

    if ($Markers.Count -gt 0) {
        $MarkerReport = Join-Path $ReportDirectory "$StageName-CONFLICTS-$Stamp.txt"

        $Markers |
            ForEach-Object {
                "$($_.Path):$($_.LineNumber): $($_.Line)"
            } |
            Set-Content $MarkerReport -Encoding UTF8

        throw "$StageName contains merge conflict markers"
    }

    Log "$StageName conflict marker check PASS"

    Install-Package `
        -WorkingDirectory $StagePath `
        -Prefix "backend" `
        -Name "$StageName BACKEND"

    Install-Package `
        -WorkingDirectory $StagePath `
        -Prefix "uaos-live-clean" `
        -Name "$StageName FRONTEND"

    if (!(Test-Path ".\package.json")) {
        throw "$StageName root package.json missing"
    }

    $Package = Get-Content ".\package.json" -Raw | ConvertFrom-Json
    $Scripts = @($Package.scripts.PSObject.Properties.Name)

    if ($Scripts -contains "check") {
        Run-Command "$StageName CHECK" {
            npm run check
        }
    }
    else {
        Log "$StageName CHECK skipped: script missing"
    }

    if ($Scripts -contains "test") {
        Run-Command "$StageName TEST" {
            npm test
        }
    }
    else {
        Log "$StageName TEST skipped: script missing"
    }

    if ($Scripts -contains "build") {
        Run-Command "$StageName BUILD" {
            npm run build
        }
    }
    else {
        throw "$StageName build script missing"
    }

    if ($Scripts -contains "desktop:smoke") {
        Run-Command "$StageName DESKTOP SMOKE" {
            npm run desktop:smoke
        }
    }
    elseif (Test-Path ".\scripts\uaos-desktop-smoke.mjs") {
        Run-Command "$StageName DESKTOP SMOKE DIRECT" {
            node ".\scripts\uaos-desktop-smoke.mjs"
        }
    }
    else {
        Log "$StageName DESKTOP SMOKE skipped: script unavailable"
    }

    if (Test-Path ".\scripts\uaos-backend-smoke.mjs") {
        Run-Command "$StageName BACKEND SMOKE" {
            node ".\scripts\uaos-backend-smoke.mjs"
        }
    }
    else {
        Log "$StageName BACKEND SMOKE skipped: script unavailable"
    }

    $Commit = (git rev-parse HEAD).Trim()

    Log "$StageName COMPLETE"
    Log "$StageName commit: $Commit"

    return [PSCustomObject]@{
        Stage  = $StageName
        Branch = $Branch
        Path   = $StagePath
        Commit = $Commit
        Status = "PASS"
    }
}

try {
    Set-Location $Root

    Log "UAOS SEQUENTIAL V1 V2 V3 VALIDATION START"
    Log "NO DEPLOY"
    Log "NO MERGE"
    Log "NO VERCEL"
    Log "Original project preserved: $Root"

    Run-Command "GIT FETCH" {
        git fetch origin --prune
    }

    git worktree prune

    $Results = @()

    $Results += Test-UAOS-Stage `
        -StageName "V1" `
        -Branch "codex/uaos-v1-production"

    $Results += Test-UAOS-Stage `
        -StageName "V2" `
        -Branch "codex/uaos-v2-pro-arranger"

    $Results += Test-UAOS-Stage `
        -StageName "V3" `
        -Branch "codex/uaos-v3-ai-labs"

    $V3Result = $Results | Where-Object {
        $_.Stage -eq "V3"
    } | Select-Object -First 1

    if (!$V3Result) {
        throw "V3 validation result missing"
    }

    $V3App = Join-Path $V3Result.Path "uaos-live-clean"

    if (!(Test-Path "$V3App\package.json")) {
        throw "V3 frontend package missing"
    }

    $Port = 5190

    while (
        Get-NetTCPConnection `
            -LocalPort $Port `
            -State Listen `
            -ErrorAction SilentlyContinue
    ) {
        $Port++
    }

    $Url = "http://127.0.0.1:$Port"

    Log "Starting validated V3 locally at $Url"

    $DevCommand = "Set-Location -LiteralPath '$V3App'; npm run dev -- --port $Port"

    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        $DevCommand
    )

    $Ready = $false

    for ($Attempt = 1; $Attempt -le 30; $Attempt++) {
        Start-Sleep -Seconds 2

        try {
            $Response = Invoke-WebRequest `
                -Uri $Url `
                -UseBasicParsing `
                -TimeoutSec 5

            if ($Response.StatusCode -eq 200) {
                $Ready = $true
                break
            }
        }
        catch {
        }
    }

    if (!$Ready) {
        throw "Validated V3 local server did not start at $Url"
    }

    Log "LOCAL SERVER PASS: $Url => 200"

    Start-Process $Url

    $Summary = @(
        "UAOS V1 V2 V3 SEQUENTIAL VALIDATION COMPLETE"
        ""
        "V1: PASS"
        "V2: PASS"
        "V3: PASS"
        ""
        "V1 branch: codex/uaos-v1-production"
        "V2 branch: codex/uaos-v2-pro-arranger"
        "V3 branch: codex/uaos-v3-ai-labs"
        ""
        "Local V3 URL: $Url"
        "Stages folder: $StagesRoot"
        ""
        "NO DEPLOY"
        "NO MERGE"
        "NO VERCEL"
        "NO PRODUCTION CHANGE"
    )

    $SummaryPath = Join-Path $ReportDirectory "UAOS_V1_V2_V3_COMPLETE_$Stamp.txt"

    $Summary | Set-Content $SummaryPath -Encoding UTF8

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "UAOS V1 PASS" -ForegroundColor Green
    Write-Host "UAOS V2 PASS" -ForegroundColor Green
    Write-Host "UAOS V3 PASS" -ForegroundColor Green
    Write-Host "LOCAL SERVER PASS" -ForegroundColor Green
    Write-Host "URL: $Url" -ForegroundColor Cyan
    Write-Host "REPORT: $SummaryPath" -ForegroundColor Yellow
    Write-Host "NO DEPLOY EXECUTED" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green

    Set-Location $Root
}
catch {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "UAOS SEQUENTIAL VALIDATION STOPPED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Original project was preserved." -ForegroundColor Yellow
    Write-Host "No deploy or merge was executed." -ForegroundColor Yellow
    Write-Host "Log: $Log" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Red

    Set-Location $Root
}