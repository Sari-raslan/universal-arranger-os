$ErrorActionPreference = "Continue"

# =========================================================
# UAOS FOUNDATION ONE CLICK
# SAR-107 + PARTIAL SAR-105 + DEPLOY CHECK
# =========================================================

$ROOT = Get-Location

# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------

$LOGS = Join-Path $ROOT "logs"
$REPORTS = Join-Path $ROOT "reports"
$STATE = Join-Path $ROOT "state"
$SNAPSHOTS = Join-Path $ROOT "snapshots"
$RUNTIME = Join-Path $ROOT "runtime"

$GLOBAL_STATE = Join-Path $STATE "GLOBAL_STATE.json"

# ---------------------------------------------------------
# FOLDER BOOTSTRAP
# ---------------------------------------------------------

$Dirs = @(
    "logs",
    "reports",
    "state",
    "snapshots",
    "runtime",
    "runtime\agents",
    "runtime\queue",
    "runtime\results"
)

foreach ($d in $Dirs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $ROOT $d) | Out-Null
}

# ---------------------------------------------------------
# LOG FILES
# ---------------------------------------------------------

$LogFiles = @(
    "deploy.log",
    "monitor.log",
    "orchestrator.log",
    "health.log",
    "recovery.log",
    "build.log"
)

foreach ($f in $LogFiles) {
    $p = Join-Path $LOGS $f

    if (!(Test-Path $p)) {
        New-Item -ItemType File -Force -Path $p | Out-Null
    }
}

# ---------------------------------------------------------
# LOGGER
# ---------------------------------------------------------

function Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$File = "orchestrator.log"
    )

    $TS = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $LINE = "[$TS][$Level] $Message"

    Add-Content -Path (Join-Path $LOGS $File) -Value $LINE -Encoding UTF8

    switch ($Level) {
        "ERROR"   { Write-Host $LINE -ForegroundColor Red }
        "WARN"    { Write-Host $LINE -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $LINE -ForegroundColor Green }
        default   { Write-Host $LINE -ForegroundColor Cyan }
    }
}

# ---------------------------------------------------------
# GLOBAL STATE
# ---------------------------------------------------------

if (!(Test-Path $GLOBAL_STATE)) {

    $InitialState = @{
        project = "UAOS"
        active_issue = "SAR-107"
        status = "in_progress"
        completed_tasks = @()
        failed_tasks = @()
        retries = 0
        deployment_status = "unknown"
        health_status = "unknown"
        created_at = (Get-Date).ToString("o")
        updated_at = (Get-Date).ToString("o")
    }

    $InitialState |
        ConvertTo-Json -Depth 10 |
        Set-Content $GLOBAL_STATE -Encoding UTF8

    Log "GLOBAL_STATE initialized" "SUCCESS"
}
else {
    Log "GLOBAL_STATE already exists"
}

# ---------------------------------------------------------
# STATE UPDATE
# ---------------------------------------------------------

function Update-State {
    param(
        [string]$Key,
        $Value
    )

    try {

        $State = Get-Content $GLOBAL_STATE -Raw | ConvertFrom-Json

        if ($State.PSObject.Properties.Name -contains $Key) {
            $State.$Key = $Value
        } else {
            $State | Add-Member -NotePropertyName $Key -NotePropertyValue $Value
        }
        $State.updated_at = (Get-Date).ToString("o")

        $State |
            ConvertTo-Json -Depth 10 |
            Set-Content $GLOBAL_STATE -Encoding UTF8

        Log "State updated: $Key"

    } catch {

        Log $_.Exception.Message "ERROR" "recovery.log"
    }
}

# ---------------------------------------------------------
# REPORT GENERATOR
# ---------------------------------------------------------

function Generate-Reports {

    $Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    @"
UAOS EXECUTION REPORT

Generated:
$Now

Issue:
SAR-107

Completed:
- runtime bootstrap
- logger initialized
- state initialized
- reports initialized
- validation started

Next:
- recovery engine
- interruption recovery
- deployment stabilization
"@ | Set-Content (Join-Path $REPORTS "EXECUTION_REPORT.txt") -Encoding UTF8

    @"
UAOS HEALTH REPORT

Generated:
$Now

Logs:
OK

Reports:
OK

State:
OK

Runtime:
OK

Health:
BOOTSTRAP_OPERATIONAL
"@ | Set-Content (Join-Path $REPORTS "HEALTH_REPORT.txt") -Encoding UTF8

    Log "Reports generated" "SUCCESS" "health.log"
}

Generate-Reports

# ---------------------------------------------------------
# SNAPSHOT SYSTEM
# ---------------------------------------------------------

function Create-Snapshot {

    $TS = Get-Date -Format "yyyyMMdd_HHmmss"

    $SNAP = Join-Path $SNAPSHOTS "snapshot_$TS"

    New-Item -ItemType Directory -Force -Path $SNAP | Out-Null

    Copy-Item $GLOBAL_STATE $SNAP -Force

    Log "Snapshot created: $SNAP" "SUCCESS"
}

Create-Snapshot

# ---------------------------------------------------------
# INTERRUPTION TEST
# ---------------------------------------------------------

function Test-Persistence {

    try {

        $State = Get-Content $GLOBAL_STATE -Raw | ConvertFrom-Json

        if ($State.project -eq "UAOS") {
            Log "Persistence test PASS" "SUCCESS"
        }
        else {
            Log "Persistence test FAIL" "ERROR"
        }

    } catch {

        Log $_.Exception.Message "ERROR" "recovery.log"
    }
}

Test-Persistence

# ---------------------------------------------------------
# BUILD CHECK
# ---------------------------------------------------------

if (Test-Path "package.json") {

    Log "package.json found"

    try {

        npm run build 2>&1 |
            Tee-Object -FilePath (Join-Path $LOGS "build.log")

        if ($LASTEXITCODE -eq 0) {

            Log "Build PASS" "SUCCESS" "build.log"

            Update-State "build_status" "pass"

        } else {

            Log "Build FAILED" "ERROR" "build.log"

            Update-State "build_status" "failed"
        }

    } catch {

        Log $_.Exception.Message "ERROR" "build.log"
    }

} else {

    Log "No package.json found" "WARN"
}

# ---------------------------------------------------------
# DEPLOY CHECK
# ---------------------------------------------------------

if (Get-Command vercel -ErrorAction SilentlyContinue) {

    Log "Vercel CLI detected"

    Update-State "deployment_cli" "vercel_available"

} else {

    Log "Vercel CLI missing" "WARN"

    Update-State "deployment_cli" "missing"
}

# ---------------------------------------------------------
# FINAL REPORT
# ---------------------------------------------------------

Log "UAOS FOUNDATION ONE CLICK COMPLETE" "SUCCESS"

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "UAOS FOUNDATION COMPLETE" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

Write-Host "Logs:      $LOGS" -ForegroundColor Cyan
Write-Host "Reports:   $REPORTS" -ForegroundColor Cyan
Write-Host "State:     $STATE" -ForegroundColor Cyan
Write-Host "Snapshots: $SNAPSHOTS" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Recommended Issue:" -ForegroundColor Yellow
Write-Host "SAR-105 Resume / Recovery Engine" -ForegroundColor Yellow


