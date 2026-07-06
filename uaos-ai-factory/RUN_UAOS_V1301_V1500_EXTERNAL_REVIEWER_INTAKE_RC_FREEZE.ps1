<#
.SYNOPSIS
    UAOS V1301-V1500  External Reviewer Intake + Feedback Simulation + RC Freeze Hardening
    One-file executor. Creates artifacts, validates, packages, seals, and commits.
#>

$ErrorActionPreference = "Stop"

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$basePath    = "E:\keyboard-manager-clean"
$factoryPath = "$basePath\uaos-ai-factory"
$runPath     = "$factoryPath\uaos-v1301-v1500-external-reviewer-intake-rc-freeze"
$prevRunPath = "$factoryPath\uaos-v1101-v1300-reviewer-demo-rc"
$prevCommit  = "7fa6accf"

$Safety = [ordered]@{
    writer_ready                      = $false
    real_writer_implemented           = "NO"
    keyboard_package_output_generated = "NO"
    usb_write                         = "NO"
    pa3x_load                         = "NO"
    deploy                            = "NO"
    payment                           = "NO"
    brand_device_compat_claims        = "NO"
}

$ForbiddenExt = @(".sty", ".set", ".prs", ".prf", ".kst")
$AllowedExt   = @(".json", ".md", ".html", ".txt", ".csv", ".zip")

$UnsafeRules = @(
    @{ Id = "writer_ready_true";        Pattern = '(?i)\bwriter_ready\b\s*[:=]\s*(true|1|yes)\b' },
    @{ Id = "real_writer_enabled";      Pattern = '(?i)\breal_writer_implemented\b\s*[:=]\s*(yes|true|1)\b' },
    @{ Id = "keyboard_package_enabled"; Pattern = '(?i)\bkeyboard_package_output_generated\b\s*[:=]\s*(yes|true|1)\b' },
    @{ Id = "usb_write_enabled";        Pattern = '(?i)\b(USB_WRITE_ENABLE(D)?|usb\s+write\s*[:=]\s*(yes|true|enabled|active))\b' },
    @{ Id = "pa3x_load_enabled";        Pattern = '(?i)\b(PA3X_LOAD_ENABLE(D)?|pa3x\s+load\s*[:=]\s*(yes|true|enabled|active))\b' },
    @{ Id = "deploy_enabled";           Pattern = '(?i)\b(DEPLOY_NOW|DEPLOY_ENABLE(D)?|deploy\s*[:=]\s*(yes|true|enabled|active))\b' },
    @{ Id = "payment_enabled";          Pattern = '(?i)\b(PAYMENT_TRIGGER|PAYMENT_ENABLE(D)?|payment\s*[:=]\s*(yes|true|enabled|active))\b' },
    @{ Id = "readiness_claim";          Pattern = '(?i)\b(KORG[- ]ready|KORG[- ]compatible|PA3X[- ]ready|PA3X[- ]compatible|keyboard[- ]ready)\b' }
)

$Dirs = @(
    "00_launcher",
    "01_checkpoint_import",
    "02_external_reviewer_intake",
    "03_feedback_simulation",
    "04_rc_freeze_hardening",
    "05_owner_setup_v9",
    "06_dashboard_v4",
    "07_traceability_matrix",
    "08_reviewer_questionnaire",
    "09_validator_v4",
    "10_package_inspector",
    "11_local_qa_matrix",
    "12_safety_evidence",
    "13_reports",
    "14_final_package",
    "15_logs",
    "16_seal"
)

$Gates = [ordered]@{
    PREV_CHECKPOINT_IMPORT = $false
    VALIDATOR_PASS         = $false
    REVIEWER_INTAKE_EXISTS = $false
    FEEDBACK_SIM_EXISTS    = $false
    RC_FREEZE_EXISTS       = $false
    OWNER_UI_V9_EXISTS     = $false
    DASHBOARD_EXISTS       = $false
    TRACE_MATRIX_EXISTS    = $false
    QUESTIONNAIRE_EXISTS   = $false
    PACKAGE_INSPECTOR      = $false
    QA_MATRIX_EXISTS       = $false
    FINAL_SEAL_EXISTS      = $false
    ZIP_INTEGRITY          = $false
    SAFETY_LOCKS_HELD      = $false
}

function New-D {
    param([string]$Path)
    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function W {
    param([string]$Path, [string]$Content)
    New-D (Split-Path -Parent $Path)
    $Content | Out-File -FilePath $Path -Encoding UTF8
}

function J {
    param([string]$Path, $Data)
    W $Path ($Data | ConvertTo-Json -Depth 90)
}

function Rel {
    param([string]$Root, [string]$Full)
    if ($Full.StartsWith($Root)) {
        return ($Full.Substring($Root.Length) -replace '^[\\/]+', '')
    }
    return $Full
}

function Overall {
    foreach ($g in $Gates.GetEnumerator()) {
        if ($g.Value -ne $true) { return "FAIL" }
    }
    return "PASS"
}

function GateRows {
    $rows = ""
    foreach ($g in ($Gates.GetEnumerator() | Sort-Object Name)) {
        $rows += "<tr><td>$($g.Key)</td><td><b>$($g.Value)</b></td></tr>`n"
    }
    return $rows
}

function Validate {
    param([string]$TargetPath, [switch]$IncludePackageFolder)

    $violations = @()
    $warnings = @()
    $scanned = 0
    $files = Get-ChildItem -Path $TargetPath -Recurse -File -ErrorAction SilentlyContinue

    foreach ($file in $files) {
        $rel = Rel $TargetPath $file.FullName
        $ext = $file.Extension.ToLowerInvariant()

        if (!$IncludePackageFolder -and $rel -like "14_final_package*") { continue }

        $scanned++

        if ($ForbiddenExt -contains $ext) {
            $violations += [ordered]@{ type="FORBIDDEN_EXTENSION"; file=$rel; detail="Blocked extension: $ext" }
        }

        if ($ext -and !($AllowedExt -contains $ext)) {
            $violations += [ordered]@{ type="UNAPPROVED_EXTENSION"; file=$rel; detail="Only JSON, MD, HTML, TXT, CSV, ZIP allowed." }
        }

        if ($ext -eq ".zip") { continue }

        if (@(".json",".md",".html",".txt",".csv") -contains $ext) {
            try {
                $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
                foreach ($rule in $UnsafeRules) {
                    if ($content -match $rule.Pattern) {
                        $violations += [ordered]@{
                            type="UNSAFE_CONTENT"
                            file=$rel
                            rule=$rule.Id
                            detail="Unsafe enablement, output, deploy, payment, or compatibility claim detected."
                        }
                    }
                }
            } catch {
                $warnings += [ordered]@{ type="READ_WARNING"; file=$rel; detail=$_.Exception.Message }
            }
        }
    }

    $status = if (@($violations).Count -eq 0) { "PASS" } else { "FAIL" }

    return [ordered]@{
        status        = $status
        scanned_files = $scanned
        violations    = @($violations)
        warnings      = @($warnings)
        checked_at    = Get-Date -Format "o"
        safety        = $Safety
    }
}

function WriteValidator {
    param($Validation)

    $json = Join-Path $runPath "09_validator_v4\UAOS_V1301_V1500_VALIDATOR_SUMMARY.json"
    $md   = Join-Path $runPath "09_validator_v4\UAOS_V1301_V1500_VALIDATOR_SUMMARY.md"
    $html = Join-Path $runPath "09_validator_v4\UAOS_V1301_V1500_VALIDATOR_SUMMARY.html"

    J $json $Validation

    $vmd = ""
    $vhtml = ""

    if (@($Validation.violations).Count -eq 0) {
        $vmd = "- None"
        $vhtml = "<li>None</li>"
    } else {
        foreach ($v in $Validation.violations) {
            $vmd += "- $($v.type): $($v.file) - $($v.detail)`n"
            $vhtml += "<li><b>$($v.type)</b>: $($v.file) - $($v.detail)</li>`n"
        }
    }

    W $md @"
# UAOS V1301-V1500 Validator V4 Summary

Status: **$($Validation.status)**

Scanned files: $($Validation.scanned_files)

## Violations

$vmd

## Safety

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO
"@

    W $html @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1301-V1500 Validator V4 Summary</h1>
<p><b>Status:</b> $($Validation.status)</p>
<p><b>Scanned files:</b> $($Validation.scanned_files)</p>
<h2>Violations</h2>
<ul>$vhtml</ul>
</body>
</html>
"@
}

function TestZip {
    param([string]$ZipPath)

    $r = [ordered]@{
        status     = "FAIL"
        exists     = $false
        size_bytes = 0
        entries    = 0
        violations = @()
    }

    if (!(Test-Path $ZipPath)) {
        $r.violations += "ZIP missing."
        return $r
    }

    $item = Get-Item $ZipPath
    $r.exists = $true
    $r.size_bytes = $item.Length

    if ($item.Length -le 0) {
        $r.violations += "ZIP empty."
        return $r
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)

    try {
        foreach ($entry in $zip.Entries) {
            $r.entries++
            $ext = [System.IO.Path]::GetExtension($entry.FullName).ToLowerInvariant()

            if ($ForbiddenExt -contains $ext) { $r.violations += "Forbidden extension inside ZIP: $($entry.FullName)" }
            if ($ext -eq ".zip") { $r.violations += "Nested ZIP blocked: $($entry.FullName)" }
            if ($ext -and !($AllowedExt -contains $ext)) { $r.violations += "Unapproved extension inside ZIP: $($entry.FullName)" }
        }
    } finally {
        $zip.Dispose()
    }

    if ($r.entries -le 0) { $r.violations += "ZIP has no entries." }

    $r.status = if (@($r.violations).Count -eq 0) { "PASS" } else { "FAIL" }
    return $r
}

function Package {
    $zipOut = Join-Path $runPath "14_final_package\UAOS_V1301_V1500_EXTERNAL_REVIEWER_INTAKE_RC_FREEZE_PACKAGE.zip"
    $pkgDir = Join-Path $runPath "14_final_package\UAOS_V1301_V1500_EXTERNAL_REVIEWER_INTAKE_RC_FREEZE_PACKAGE_CONTENTS"

    if (Test-Path $zipOut) { Remove-Item $zipOut -Force }
    if (Test-Path $pkgDir) { Remove-Item $pkgDir -Recurse -Force }

    New-D $pkgDir

    $sourceDirs = @(
        "00_launcher",
        "01_checkpoint_import",
        "02_external_reviewer_intake",
        "03_feedback_simulation",
        "04_rc_freeze_hardening",
        "05_owner_setup_v9",
        "06_dashboard_v4",
        "07_traceability_matrix",
        "08_reviewer_questionnaire",
        "09_validator_v4",
        "10_package_inspector",
        "11_local_qa_matrix",
        "12_safety_evidence",
        "13_reports",
        "15_logs",
        "16_seal"
    )

    foreach ($d in $sourceDirs) {
        $src = Join-Path $runPath $d
        $dst = Join-Path $pkgDir $d
        if (Test-Path $src) {
            Copy-Item -Path $src -Destination $dst -Recurse -Force
        }
    }

    $items = @(Get-ChildItem -Path $pkgDir -Force)

    if ($items.Count -eq 0) {
        return [ordered]@{ status="FAIL"; exists=$false; size_bytes=0; entries=0; violations=@("Package contents empty.") }
    }

    Compress-Archive -Path $items.FullName -DestinationPath $zipOut -Force
    return TestZip $zipOut
}

function WriteInspector {
    param($PackageResult)

    $json = Join-Path $runPath "10_package_inspector\UAOS_V1301_V1500_PACKAGE_INSPECTOR.json"
    $md   = Join-Path $runPath "10_package_inspector\UAOS_V1301_V1500_PACKAGE_INSPECTOR.md"
    $html = Join-Path $runPath "10_package_inspector\UAOS_V1301_V1500_PACKAGE_INSPECTOR.html"

    J $json ([ordered]@{
        inspected_at = Get-Date -Format "o"
        package = $PackageResult
        rules = [ordered]@{
            forbidden_extensions = $ForbiddenExt
            allowed_extensions = $AllowedExt
            nested_zip_blocked = $true
        }
    })

    $violMd = ""
    $violHtml = ""

    if ($null -eq $PackageResult -or @($PackageResult.violations).Count -eq 0) {
        $violMd = "- None"
        $violHtml = "<li>None</li>"
    } else {
        foreach ($v in $PackageResult.violations) {
            $violMd += "- $v`n"
            $violHtml += "<li>$v</li>`n"
        }
    }

    $st = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $sz = if ($null -ne $PackageResult) { $PackageResult.size_bytes } else { 0 }
    $en = if ($null -ne $PackageResult) { $PackageResult.entries } else { 0 }

    W $md @"
# UAOS V1301-V1500 Package Inspector

Status: **$st**

Size bytes: $sz  
Entries: $en

## Violations

$violMd
"@

    W $html @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1301-V1500 Package Inspector</h1>
<p><b>Status:</b> $st</p>
<p><b>Size bytes:</b> $sz</p>
<p><b>Entries:</b> $en</p>
<h2>Violations</h2>
<ul>$violHtml</ul>
</body>
</html>
"@
}

function Dashboard {
    param([string]$Result, $PackageResult)

    $dash = Join-Path $runPath "06_dashboard_v4\UAOS_V1301_V1500_EXTERNAL_REVIEW_DASHBOARD.html"
    $rows = GateRows
    $st = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $sz = if ($null -ne $PackageResult) { $PackageResult.size_bytes } else { 0 }
    $en = if ($null -ne $PackageResult) { $PackageResult.entries } else { 0 }

    W $dash @"
<html>
<body style="font-family:sans-serif;background:#101015;color:#eeeeee;padding:30px;">
<h1>UAOS V1301-V1500 External Reviewer Intake Dashboard</h1>
<p><b>Final Result:</b> $Result</p>
<p><b>Previous Checkpoint:</b> $prevCommit</p>
<p><b>Package Status:</b> $st</p>
<p><b>Package Size:</b> $sz bytes</p>
<p><b>Package Entries:</b> $en</p>

<h2>Gate Summary</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
<tr><th>Gate</th><th>Status</th></tr>
$rows
</table>

<h2>Scope</h2>
<ul>
<li>External reviewer intake</li>
<li>Feedback simulation</li>
<li>RC freeze hardening</li>
<li>Owner Setup V9</li>
<li>Traceability matrix</li>
<li>Reviewer questionnaire</li>
<li>Validator V4</li>
<li>Package inspection</li>
<li>Final local QA</li>
</ul>

<h2>Safety Locks</h2>
<ul>
<li>writer_ready: false</li>
<li>real_writer_implemented: NO</li>
<li>keyboard_package_output_generated: NO</li>
<li>USB write: NO</li>
<li>PA3X load: NO</li>
<li>Deploy: NO</li>
<li>Payment: NO</li>
<li>Brand/device compatibility claims: NO</li>
</ul>
</body>
</html>
"@
}

function QAMatrix {
    param([string]$Result, $PackageResult)

    $json = Join-Path $runPath "11_local_qa_matrix\UAOS_V1301_V1500_LOCAL_QA_MATRIX.json"
    $md   = Join-Path $runPath "11_local_qa_matrix\UAOS_V1301_V1500_LOCAL_QA_MATRIX.md"
    $html = Join-Path $runPath "11_local_qa_matrix\UAOS_V1301_V1500_LOCAL_QA_MATRIX.html"

    $st = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }

    J $json ([ordered]@{
        result = $Result
        package_status = $st
        gates = $Gates
        safety = $Safety
        generated_at = Get-Date -Format "o"
    })

    $gateMd = ""
    foreach ($g in ($Gates.GetEnumerator() | Sort-Object Name)) {
        $gateMd += "- $($g.Key): $($g.Value)`n"
    }

    W $md @"
# UAOS V1301-V1500 Local QA Matrix

Result: **$Result**

Package status: **$st**

## Gates

$gateMd

## Safety

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO
"@

    W $html @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1301-V1500 Local QA Matrix</h1>
<p><b>Result:</b> $Result</p>
<p><b>Package status:</b> $st</p>
<table border="1" cellpadding="8" cellspacing="0">
<tr><th>Gate</th><th>Status</th></tr>
$(GateRows)
</table>
</body>
</html>
"@
}

function Seal {
    param([string]$Result)

    $seal = Join-Path $runPath "16_seal\UAOS_V1301_V1500_FINAL_SEAL.md"

    W $seal @"
# UAOS FINAL SEAL V1301-V1500

Result: **$Result**

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Project:
Universal Arranger OS

Previous checkpoint:
$prevCommit

## Phase Scope

V1301-V1500 covers:
- External reviewer intake
- Feedback simulation
- RC freeze hardening
- Owner Setup V9
- Dashboard V4
- Traceability matrix
- Reviewer questionnaire
- Validator V4
- Package inspector
- Local QA matrix
- Final package and seal

## Safety Lockdown

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO

## Boundary

This seal covers local research, UX review, external-review preparation, feedback simulation, evidence review, validator evidence, QA evidence, and package evidence only.

This seal does not approve real writer implementation, keyboard package generation, USB writing, hardware loading, deployment, payment activation, or compatibility claims.
"@
}

function Report {
    param([string]$Result, $PackageResult, $Validation)

    $report = Join-Path $runPath "13_reports\UAOS_V1301_V1500_FINAL_REPORT.md"
    $st = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $vs = if ($null -ne $Validation) { $Validation.status } else { "PENDING" }

    W $report @"
# UAOS V1301-V1500 Final Report

Result: **$Result**

Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)  
Reviewer intake exists: $($Gates.REVIEWER_INTAKE_EXISTS)  
Feedback simulation exists: $($Gates.FEEDBACK_SIM_EXISTS)  
RC freeze exists: $($Gates.RC_FREEZE_EXISTS)  
Owner UI V9 exists: $($Gates.OWNER_UI_V9_EXISTS)  
Dashboard exists: $($Gates.DASHBOARD_EXISTS)  
Traceability matrix exists: $($Gates.TRACE_MATRIX_EXISTS)  
Questionnaire exists: $($Gates.QUESTIONNAIRE_EXISTS)  
Package inspector exists: $($Gates.PACKAGE_INSPECTOR)  
QA matrix exists: $($Gates.QA_MATRIX_EXISTS)  
Final seal exists: $($Gates.FINAL_SEAL_EXISTS)  
Final package ZIP integrity: $($Gates.ZIP_INTEGRITY)  
Validator pass: $($Gates.VALIDATOR_PASS)  
Safety locks held: $($Gates.SAFETY_LOCKS_HELD)

Package status: **$st**  
Validator status: **$vs**

## Safety

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO
"@
}

function Commit {
    param([string]$Result)

    if (!(Test-Path "$basePath\.git")) { return "NO_GIT_REPO" }

    try {
        Push-Location $basePath

        git add -- "uaos-ai-factory/RUN_UAOS_V1301_V1500_EXTERNAL_REVIEWER_INTAKE_RC_FREEZE.ps1" "uaos-ai-factory/uaos-v1301-v1500-external-reviewer-intake-rc-freeze" | Out-Null

        git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            $head = (git rev-parse --short HEAD).Trim()
            Pop-Location
            return "NO_NEW_COMMIT_CURRENT_HEAD_$head"
        }

        git commit -m "UAOS V1301-V1500 External Reviewer Intake RC Freeze [$Result]" | Out-Null

        if ($LASTEXITCODE -ne 0) {
            $head = (git rev-parse --short HEAD).Trim()
            Pop-Location
            return "NO_NEW_COMMIT_CURRENT_HEAD_$head"
        }

        $hash = (git rev-parse --short HEAD).Trim()
        Pop-Location
        return $hash
    } catch {
        try { Pop-Location } catch {}
        try { return "GIT_ERROR_CURRENT_HEAD_$((git -C $basePath rev-parse --short HEAD).Trim())" }
        catch { return "GIT_ERROR" }
    }
}

Write-Host "--- UAOS V1301-V1500 EXTERNAL REVIEWER INTAKE RC FREEZE START ---" -ForegroundColor Cyan

if (Test-Path $runPath) { Remove-Item $runPath -Recurse -Force }
New-D $runPath
foreach ($d in $Dirs) { New-D (Join-Path $runPath $d) }

W (Join-Path $runPath "15_logs\RUN_START.txt") @"
UAOS V1301-V1500 started.
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Run path: $runPath
Previous checkpoint: $prevCommit
"@

Write-Host "[V1301-V1320] Checking previous checkpoint..." -ForegroundColor Yellow

$prevFiles = @(
    "04_owner_setup_v8\UAOS_OWNER_SETUP_V8_HOME.html",
    "05_dashboard_v3\UAOS_V1101_V1300_REVIEWER_DEMO_DASHBOARD.html",
    "03_reviewer_demo_rc\UAOS_REVIEWER_DEMO_RC_INDEX.html",
    "06_master_evidence_index\UAOS_V1101_V1300_MASTER_EVIDENCE_INDEX.html",
    "07_demo_walkthrough\UAOS_V1101_V1300_DEMO_WALKTHROUGH.html",
    "10_local_qa_matrix\UAOS_V1101_V1300_LOCAL_QA_MATRIX.html",
    "13_final_package\UAOS_V1101_V1300_REVIEWER_DEMO_RC_PACKAGE.zip",
    "15_seal\UAOS_V1101_V1300_FINAL_SEAL.md",
    "12_reports\UAOS_V1101_V1300_FINAL_REPORT.md"
)

$checks = @()
$missing = @()

foreach ($f in $prevFiles) {
    $full = Join-Path $prevRunPath $f
    $exists = Test-Path $full
    $checks += [ordered]@{ file=$f; path=$full; exists=$exists }
    if (!$exists) { $missing += $f }
}

$importStatus = if (@($missing).Count -eq 0) { "YES" } else { "NO" }
$Gates.PREV_CHECKPOINT_IMPORT = ($importStatus -eq "YES")

J (Join-Path $runPath "01_checkpoint_import\UAOS_V1301_V1500_CHECKPOINT_IMPORT.json") ([ordered]@{
    status = $importStatus
    previous_commit = $prevCommit
    previous_run_path = $prevRunPath
    checked_files = $checks
    missing_files = $missing
    checked_at = Get-Date -Format "o"
})

$importMd = "# UAOS V1301-V1500 Checkpoint Import`n`nStatus: **$importStatus**`n`nPrevious commit: $prevCommit`n`n"
foreach ($c in $checks) { $importMd += "- $($c.file): $($c.exists)`n" }
W (Join-Path $runPath "01_checkpoint_import\UAOS_V1301_V1500_CHECKPOINT_IMPORT.md") $importMd

Write-Host "[V1321-V1460] Creating reviewer intake, feedback simulation, and RC freeze artifacts..." -ForegroundColor Yellow

W (Join-Path $runPath "00_launcher\UAOS_V1301_V1500_LAUNCHER.txt") @"
UAOS V1301-V1500 launcher.
External reviewer intake, feedback simulation, and RC freeze hardening only.
No keyboard package output.
No USB write.
No hardware load.
No deploy.
No payment.
No compatibility claims.
"@

$intakeJson = Join-Path $runPath "02_external_reviewer_intake\UAOS_EXTERNAL_REVIEWER_INTAKE.json"
$intakeMd   = Join-Path $runPath "02_external_reviewer_intake\UAOS_EXTERNAL_REVIEWER_INTAKE.md"
$intakeHtml = Join-Path $runPath "02_external_reviewer_intake\UAOS_EXTERNAL_REVIEWER_INTAKE.html"

J $intakeJson ([ordered]@{
    phase = "V1301-V1500"
    purpose = "external_reviewer_intake"
    review_modes = @("offline_local_review", "evidence_review", "questionnaire_response", "feedback_simulation")
    required_artifacts = @(
        "owner_setup_v9",
        "external_review_dashboard",
        "traceability_matrix",
        "reviewer_questionnaire",
        "feedback_simulation",
        "validator_v4",
        "package_inspector",
        "final_seal"
    )
    safety = $Safety
})

W $intakeMd @"
# UAOS External Reviewer Intake

Purpose:
Prepare a local evidence package for external reviewer intake.

Reviewer tasks:
1. Open Owner Setup V9.
2. Review Dashboard V4.
3. Review Traceability Matrix.
4. Complete Reviewer Questionnaire.
5. Review Feedback Simulation.
6. Review Validator V4.
7. Review Package Inspector.
8. Review Final Seal.

Safety:
No hardware, deploy, payment, or compatibility claims are approved.
"@

W $intakeHtml @"
<html>
<body style="font-family:sans-serif;background:#111827;color:#eeeeee;padding:40px;">
<h1>UAOS External Reviewer Intake</h1>
<p>Local evidence review package for V1301-V1500.</p>
<ol>
<li>Open Owner Setup V9.</li>
<li>Review Dashboard V4.</li>
<li>Review Traceability Matrix.</li>
<li>Complete Reviewer Questionnaire.</li>
<li>Review Feedback Simulation.</li>
<li>Review Validator V4.</li>
<li>Review Package Inspector.</li>
<li>Review Final Seal.</li>
</ol>
</body>
</html>
"@

$feedbackJson = Join-Path $runPath "03_feedback_simulation\UAOS_FEEDBACK_SIMULATION.json"
$feedbackMd   = Join-Path $runPath "03_feedback_simulation\UAOS_FEEDBACK_SIMULATION.md"
$feedbackHtml = Join-Path $runPath "03_feedback_simulation\UAOS_FEEDBACK_SIMULATION.html"

J $feedbackJson ([ordered]@{
    phase = "V1301-V1500"
    simulated_feedback = @(
        [ordered]@{ id="FB-001"; area="navigation"; severity="low"; response="Owner Setup V9 links all review artifacts." },
        [ordered]@{ id="FB-002"; area="safety"; severity="high"; response="Safety locks remain visible and validator-enforced." },
        [ordered]@{ id="FB-003"; area="evidence"; severity="medium"; response="Traceability matrix maps artifacts to reviewer tasks." },
        [ordered]@{ id="FB-004"; area="packaging"; severity="medium"; response="Package inspector checks archive integrity and denylist." }
    )
    safety = $Safety
})

W $feedbackMd @"
# UAOS Feedback Simulation

- FB-001 Navigation: Owner Setup V9 links all review artifacts.
- FB-002 Safety: Safety locks remain visible and validator-enforced.
- FB-003 Evidence: Traceability matrix maps artifacts to reviewer tasks.
- FB-004 Packaging: Package inspector checks archive integrity and denylist.
"@

W $feedbackHtml @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS Feedback Simulation</h1>
<ul>
<li>FB-001 Navigation: Owner Setup V9 links all review artifacts.</li>
<li>FB-002 Safety: Safety locks remain visible and validator-enforced.</li>
<li>FB-003 Evidence: Traceability matrix maps artifacts to reviewer tasks.</li>
<li>FB-004 Packaging: Package inspector checks archive integrity and denylist.</li>
</ul>
</body>
</html>
"@

$freezeJson = Join-Path $runPath "04_rc_freeze_hardening\UAOS_RC_FREEZE_HARDENING.json"
$freezeMd   = Join-Path $runPath "04_rc_freeze_hardening\UAOS_RC_FREEZE_HARDENING.md"
$freezeHtml = Join-Path $runPath "04_rc_freeze_hardening\UAOS_RC_FREEZE_HARDENING.html"

J $freezeJson ([ordered]@{
    phase = "V1301-V1500"
    freeze_state = "RC_FREEZE_HARDENED"
    frozen_surfaces = @(
        "owner_setup_v9",
        "dashboard_v4",
        "external_reviewer_intake",
        "feedback_simulation",
        "traceability_matrix",
        "reviewer_questionnaire",
        "safety_evidence",
        "final_seal"
    )
    safety = $Safety
})

W $freezeMd @"
# UAOS RC Freeze Hardening

Freeze state:
RC_FREEZE_HARDENED

Frozen surfaces:
- Owner Setup V9
- Dashboard V4
- External Reviewer Intake
- Feedback Simulation
- Traceability Matrix
- Reviewer Questionnaire
- Safety Evidence
- Final Seal

Boundary:
This freeze does not approve real writer implementation, target-device packages, USB writing, hardware loading, deployment, payment activation, or compatibility claims.
"@

W $freezeHtml @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS RC Freeze Hardening</h1>
<p><b>Freeze state:</b> RC_FREEZE_HARDENED</p>
<ul>
<li>Owner Setup V9</li>
<li>Dashboard V4</li>
<li>External Reviewer Intake</li>
<li>Feedback Simulation</li>
<li>Traceability Matrix</li>
<li>Reviewer Questionnaire</li>
<li>Safety Evidence</li>
<li>Final Seal</li>
</ul>
</body>
</html>
"@

$uiPath = Join-Path $runPath "05_owner_setup_v9\UAOS_OWNER_SETUP_V9_HOME.html"

W $uiPath @"
<html>
<body style="font-family:sans-serif;background:#181824;color:#f2f2f2;padding:40px;">
<h1>UAOS Owner Setup V9</h1>
<h2>External Reviewer Intake + RC Freeze Hardening</h2>

<section style="border:1px solid #555;padding:20px;margin-bottom:20px;">
<h3>Status</h3>
<p><b>Phase:</b> V1301-V1500</p>
<p><b>Previous checkpoint:</b> $prevCommit</p>
<p><b>Mode:</b> Local external-review intake</p>
</section>

<section style="border:1px solid #555;padding:20px;margin-bottom:20px;">
<h3>Reviewer Navigation</h3>
<ul>
<li><a href="../02_external_reviewer_intake/UAOS_EXTERNAL_REVIEWER_INTAKE.html" style="color:cyan;">External Reviewer Intake</a></li>
<li><a href="../06_dashboard_v4/UAOS_V1301_V1500_EXTERNAL_REVIEW_DASHBOARD.html" style="color:cyan;">Dashboard V4</a></li>
<li><a href="../07_traceability_matrix/UAOS_V1301_V1500_TRACEABILITY_MATRIX.html" style="color:cyan;">Traceability Matrix</a></li>
<li><a href="../08_reviewer_questionnaire/UAOS_V1301_V1500_REVIEWER_QUESTIONNAIRE.html" style="color:cyan;">Reviewer Questionnaire</a></li>
<li><a href="../03_feedback_simulation/UAOS_FEEDBACK_SIMULATION.html" style="color:cyan;">Feedback Simulation</a></li>
<li><a href="../09_validator_v4/UAOS_V1301_V1500_VALIDATOR_SUMMARY.html" style="color:cyan;">Validator V4</a></li>
<li><a href="../10_package_inspector/UAOS_V1301_V1500_PACKAGE_INSPECTOR.html" style="color:cyan;">Package Inspector</a></li>
<li><a href="../13_reports/UAOS_V1301_V1500_FINAL_REPORT.md" style="color:cyan;">Final Report</a></li>
<li><a href="../16_seal/UAOS_V1301_V1500_FINAL_SEAL.md" style="color:cyan;">Final Seal</a></li>
</ul>
</section>

<section style="border:1px solid #555;padding:20px;">
<h3>Safety Locks</h3>
<ul>
<li>writer_ready: false</li>
<li>real_writer_implemented: NO</li>
<li>keyboard_package_output_generated: NO</li>
<li>USB write: NO</li>
<li>PA3X load: NO</li>
<li>Deploy: NO</li>
<li>Payment: NO</li>
<li>Brand/device compatibility claims: NO</li>
</ul>
</section>
</body>
</html>
"@

$traceJson = Join-Path $runPath "07_traceability_matrix\UAOS_V1301_V1500_TRACEABILITY_MATRIX.json"
$traceMd   = Join-Path $runPath "07_traceability_matrix\UAOS_V1301_V1500_TRACEABILITY_MATRIX.md"
$traceHtml = Join-Path $runPath "07_traceability_matrix\UAOS_V1301_V1500_TRACEABILITY_MATRIX.html"
$traceCsv  = Join-Path $runPath "07_traceability_matrix\UAOS_V1301_V1500_TRACEABILITY_MATRIX.csv"

$traceRows = @(
    [ordered]@{ id="TR-001"; requirement="Previous checkpoint import"; artifact="01_checkpoint_import"; gate="PREV_CHECKPOINT_IMPORT" },
    [ordered]@{ id="TR-002"; requirement="Reviewer intake"; artifact="02_external_reviewer_intake"; gate="REVIEWER_INTAKE_EXISTS" },
    [ordered]@{ id="TR-003"; requirement="Feedback simulation"; artifact="03_feedback_simulation"; gate="FEEDBACK_SIM_EXISTS" },
    [ordered]@{ id="TR-004"; requirement="RC freeze hardening"; artifact="04_rc_freeze_hardening"; gate="RC_FREEZE_EXISTS" },
    [ordered]@{ id="TR-005"; requirement="Owner UI V9"; artifact="05_owner_setup_v9"; gate="OWNER_UI_V9_EXISTS" },
    [ordered]@{ id="TR-006"; requirement="Dashboard V4"; artifact="06_dashboard_v4"; gate="DASHBOARD_EXISTS" },
    [ordered]@{ id="TR-007"; requirement="Reviewer questionnaire"; artifact="08_reviewer_questionnaire"; gate="QUESTIONNAIRE_EXISTS" },
    [ordered]@{ id="TR-008"; requirement="Final seal"; artifact="16_seal"; gate="FINAL_SEAL_EXISTS" }
)

J $traceJson ([ordered]@{ phase="V1301-V1500"; rows=$traceRows; safety=$Safety })

$traceMdText = "# UAOS V1301-V1500 Traceability Matrix`n`n"
$traceMdText += "| ID | Requirement | Artifact | Gate |`n|---|---|---|---|`n"
foreach ($r in $traceRows) { $traceMdText += "| $($r.id) | $($r.requirement) | $($r.artifact) | $($r.gate) |`n" }
W $traceMd $traceMdText

$traceHtmlRows = ""
foreach ($r in $traceRows) { $traceHtmlRows += "<tr><td>$($r.id)</td><td>$($r.requirement)</td><td>$($r.artifact)</td><td>$($r.gate)</td></tr>`n" }
W $traceHtml @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1301-V1500 Traceability Matrix</h1>
<table border="1" cellpadding="8" cellspacing="0">
<tr><th>ID</th><th>Requirement</th><th>Artifact</th><th>Gate</th></tr>
$traceHtmlRows
</table>
</body>
</html>
"@

$traceCsvText = "id,requirement,artifact,gate`n"
foreach ($r in $traceRows) { $traceCsvText += "$($r.id),$($r.requirement),$($r.artifact),$($r.gate)`n" }
W $traceCsv $traceCsvText

$questionJson = Join-Path $runPath "08_reviewer_questionnaire\UAOS_V1301_V1500_REVIEWER_QUESTIONNAIRE.json"
$questionMd   = Join-Path $runPath "08_reviewer_questionnaire\UAOS_V1301_V1500_REVIEWER_QUESTIONNAIRE.md"
$questionHtml = Join-Path $runPath "08_reviewer_questionnaire\UAOS_V1301_V1500_REVIEWER_QUESTIONNAIRE.html"

$questions = @(
    [ordered]@{ id="Q1"; question="Is the local review flow clear?"; response_type="text" },
    [ordered]@{ id="Q2"; question="Are the safety boundaries visible and consistent?"; response_type="yes_no_text" },
    [ordered]@{ id="Q3"; question="Does the evidence index cover the required artifacts?"; response_type="yes_no_text" },
    [ordered]@{ id="Q4"; question="Does the package inspector provide enough integrity evidence?"; response_type="yes_no_text" },
    [ordered]@{ id="Q5"; question="Are any terms too close to compatibility or readiness claims?"; response_type="text" }
)

J $questionJson ([ordered]@{ phase="V1301-V1500"; questions=$questions; safety=$Safety })

$qMd = "# UAOS V1301-V1500 Reviewer Questionnaire`n`n"
foreach ($q in $questions) { $qMd += "## $($q.id)`n$($q.question)`n`nResponse type: $($q.response_type)`n`n" }
W $questionMd $qMd

$qHtml = ""
foreach ($q in $questions) { $qHtml += "<h2>$($q.id)</h2><p>$($q.question)</p><p><b>Response type:</b> $($q.response_type)</p>`n" }
W $questionHtml @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1301-V1500 Reviewer Questionnaire</h1>
$qHtml
</body>
</html>
"@

J (Join-Path $runPath "12_safety_evidence\UAOS_V1301_V1500_SAFETY_EVIDENCE.json") $Safety

W (Join-Path $runPath "12_safety_evidence\UAOS_V1301_V1500_SAFETY_EVIDENCE.md") @"
# UAOS V1301-V1500 Safety Evidence

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO

All artifacts are local reviewer-intake, local feedback simulation, local evidence, validator, package, QA, report, or seal files only.
"@

W (Join-Path $runPath "12_safety_evidence\UAOS_V1301_V1500_SAFETY_EVIDENCE.html") @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1301-V1500 Safety Evidence</h1>
<ul>
<li>writer_ready: false</li>
<li>real_writer_implemented: NO</li>
<li>keyboard_package_output_generated: NO</li>
<li>USB write: NO</li>
<li>PA3X load: NO</li>
<li>Deploy: NO</li>
<li>Payment: NO</li>
<li>Brand/device compatibility claims: NO</li>
</ul>
</body>
</html>
"@

Write-Host "[V1461-V1500] Validating, packaging, sealing..." -ForegroundColor Yellow

$packageResult = $null
$validation = Validate $runPath
WriteValidator $validation

$Gates.VALIDATOR_PASS = ($validation.status -eq "PASS")
$Gates.SAFETY_LOCKS_HELD = (
    $Gates.VALIDATOR_PASS -and
    $Safety.writer_ready -eq $false -and
    $Safety.real_writer_implemented -eq "NO" -and
    $Safety.keyboard_package_output_generated -eq "NO" -and
    $Safety.usb_write -eq "NO" -and
    $Safety.pa3x_load -eq "NO" -and
    $Safety.deploy -eq "NO" -and
    $Safety.payment -eq "NO"
)

$dashPath = Join-Path $runPath "06_dashboard_v4\UAOS_V1301_V1500_EXTERNAL_REVIEW_DASHBOARD.html"
$qaJson = Join-Path $runPath "11_local_qa_matrix\UAOS_V1301_V1500_LOCAL_QA_MATRIX.json"
$qaMd   = Join-Path $runPath "11_local_qa_matrix\UAOS_V1301_V1500_LOCAL_QA_MATRIX.md"
$qaHtml = Join-Path $runPath "11_local_qa_matrix\UAOS_V1301_V1500_LOCAL_QA_MATRIX.html"
$sealPath = Join-Path $runPath "16_seal\UAOS_V1301_V1500_FINAL_SEAL.md"
$inspJson = Join-Path $runPath "10_package_inspector\UAOS_V1301_V1500_PACKAGE_INSPECTOR.json"
$inspMd   = Join-Path $runPath "10_package_inspector\UAOS_V1301_V1500_PACKAGE_INSPECTOR.md"
$inspHtml = Join-Path $runPath "10_package_inspector\UAOS_V1301_V1500_PACKAGE_INSPECTOR.html"

$Gates.REVIEWER_INTAKE_EXISTS = ((Test-Path $intakeJson) -and (Test-Path $intakeMd) -and (Test-Path $intakeHtml))
$Gates.FEEDBACK_SIM_EXISTS    = ((Test-Path $feedbackJson) -and (Test-Path $feedbackMd) -and (Test-Path $feedbackHtml))
$Gates.RC_FREEZE_EXISTS       = ((Test-Path $freezeJson) -and (Test-Path $freezeMd) -and (Test-Path $freezeHtml))
$Gates.OWNER_UI_V9_EXISTS     = Test-Path $uiPath
$Gates.TRACE_MATRIX_EXISTS    = ((Test-Path $traceJson) -and (Test-Path $traceMd) -and (Test-Path $traceHtml) -and (Test-Path $traceCsv))
$Gates.QUESTIONNAIRE_EXISTS   = ((Test-Path $questionJson) -and (Test-Path $questionMd) -and (Test-Path $questionHtml))

Dashboard "PENDING" $packageResult
$Gates.DASHBOARD_EXISTS = Test-Path $dashPath

QAMatrix "PENDING" $packageResult
$Gates.QA_MATRIX_EXISTS = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))

Seal "PENDING"
$Gates.FINAL_SEAL_EXISTS = Test-Path $sealPath

Report "PENDING" $packageResult $validation

$packageResult = Package
WriteInspector $packageResult
$Gates.PACKAGE_INSPECTOR = ((Test-Path $inspJson) -and (Test-Path $inspMd) -and (Test-Path $inspHtml))

$packageResult = Package
$Gates.ZIP_INTEGRITY = ($packageResult.status -eq "PASS")

for ($i = 1; $i -le 3; $i++) {
    $validation = Validate -TargetPath $runPath -IncludePackageFolder
    WriteValidator $validation

    $Gates.VALIDATOR_PASS = ($validation.status -eq "PASS")
    $Gates.SAFETY_LOCKS_HELD = (
        $Gates.VALIDATOR_PASS -and
        $Safety.writer_ready -eq $false -and
        $Safety.real_writer_implemented -eq "NO" -and
        $Safety.keyboard_package_output_generated -eq "NO" -and
        $Safety.usb_write -eq "NO" -and
        $Safety.pa3x_load -eq "NO" -and
        $Safety.deploy -eq "NO" -and
        $Safety.payment -eq "NO"
    )

    $Gates.REVIEWER_INTAKE_EXISTS = ((Test-Path $intakeJson) -and (Test-Path $intakeMd) -and (Test-Path $intakeHtml))
    $Gates.FEEDBACK_SIM_EXISTS    = ((Test-Path $feedbackJson) -and (Test-Path $feedbackMd) -and (Test-Path $feedbackHtml))
    $Gates.RC_FREEZE_EXISTS       = ((Test-Path $freezeJson) -and (Test-Path $freezeMd) -and (Test-Path $freezeHtml))
    $Gates.OWNER_UI_V9_EXISTS     = Test-Path $uiPath
    $Gates.DASHBOARD_EXISTS       = Test-Path $dashPath
    $Gates.TRACE_MATRIX_EXISTS    = ((Test-Path $traceJson) -and (Test-Path $traceMd) -and (Test-Path $traceHtml) -and (Test-Path $traceCsv))
    $Gates.QUESTIONNAIRE_EXISTS   = ((Test-Path $questionJson) -and (Test-Path $questionMd) -and (Test-Path $questionHtml))
    $Gates.PACKAGE_INSPECTOR      = ((Test-Path $inspJson) -and (Test-Path $inspMd) -and (Test-Path $inspHtml))
    $Gates.QA_MATRIX_EXISTS       = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))
    $Gates.FINAL_SEAL_EXISTS      = Test-Path $sealPath

    $FinalResult = Overall

    Dashboard $FinalResult $packageResult
    QAMatrix $FinalResult $packageResult
    Seal $FinalResult
    Report $FinalResult $packageResult $validation

    $packageResult = Package
    WriteInspector $packageResult
    $packageResult = Package
    $Gates.ZIP_INTEGRITY = ($packageResult.status -eq "PASS")
}

$validation = Validate -TargetPath $runPath -IncludePackageFolder
WriteValidator $validation

$Gates.VALIDATOR_PASS = ($validation.status -eq "PASS")
$Gates.SAFETY_LOCKS_HELD = (
    $Gates.VALIDATOR_PASS -and
    $Safety.writer_ready -eq $false -and
    $Safety.real_writer_implemented -eq "NO" -and
    $Safety.keyboard_package_output_generated -eq "NO" -and
    $Safety.usb_write -eq "NO" -and
    $Safety.pa3x_load -eq "NO" -and
    $Safety.deploy -eq "NO" -and
    $Safety.payment -eq "NO"
)

$Gates.REVIEWER_INTAKE_EXISTS = ((Test-Path $intakeJson) -and (Test-Path $intakeMd) -and (Test-Path $intakeHtml))
$Gates.FEEDBACK_SIM_EXISTS    = ((Test-Path $feedbackJson) -and (Test-Path $feedbackMd) -and (Test-Path $feedbackHtml))
$Gates.RC_FREEZE_EXISTS       = ((Test-Path $freezeJson) -and (Test-Path $freezeMd) -and (Test-Path $freezeHtml))
$Gates.OWNER_UI_V9_EXISTS     = Test-Path $uiPath
$Gates.DASHBOARD_EXISTS       = Test-Path $dashPath
$Gates.TRACE_MATRIX_EXISTS    = ((Test-Path $traceJson) -and (Test-Path $traceMd) -and (Test-Path $traceHtml) -and (Test-Path $traceCsv))
$Gates.QUESTIONNAIRE_EXISTS   = ((Test-Path $questionJson) -and (Test-Path $questionMd) -and (Test-Path $questionHtml))
$Gates.PACKAGE_INSPECTOR      = ((Test-Path $inspJson) -and (Test-Path $inspMd) -and (Test-Path $inspHtml))
$Gates.QA_MATRIX_EXISTS       = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))
$Gates.FINAL_SEAL_EXISTS      = Test-Path $sealPath
$Gates.ZIP_INTEGRITY          = ($packageResult.status -eq "PASS")

$FinalResult = Overall

Dashboard $FinalResult $packageResult
QAMatrix $FinalResult $packageResult
Seal $FinalResult
Report $FinalResult $packageResult $validation

$packageResult = Package
WriteInspector $packageResult
$packageResult = Package
$Gates.ZIP_INTEGRITY = ($packageResult.status -eq "PASS")
$FinalResult = Overall

W (Join-Path $runPath "15_logs\RUN_COMPLETE.txt") @"
UAOS V1301-V1500 complete.
Result: $FinalResult
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Validator: $($validation.status)
Package: $($packageResult.status)
"@

$actualCommit = Commit $FinalResult

$zipOut = Join-Path $runPath "14_final_package\UAOS_V1301_V1500_EXTERNAL_REVIEWER_INTAKE_RC_FREEZE_PACKAGE.zip"
$reportPath = Join-Path $runPath "13_reports\UAOS_V1301_V1500_FINAL_REPORT.md"

$color = if ($FinalResult -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V1301-V1500 External Reviewer Intake RC Freeze: $FinalResult " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)"
Write-Host "Validator Status:             $($validation.status)"
Write-Host "Reviewer intake exists:       $($Gates.REVIEWER_INTAKE_EXISTS)"
Write-Host "Feedback simulation exists:   $($Gates.FEEDBACK_SIM_EXISTS)"
Write-Host "RC freeze exists:             $($Gates.RC_FREEZE_EXISTS)"
Write-Host "Owner UI V9 ready:            $($Gates.OWNER_UI_V9_EXISTS)"
Write-Host "Dashboard created:            $($Gates.DASHBOARD_EXISTS)"
Write-Host "Trace matrix exists:          $($Gates.TRACE_MATRIX_EXISTS)"
Write-Host "Questionnaire exists:         $($Gates.QUESTIONNAIRE_EXISTS)"
Write-Host "Package inspector exists:     $($Gates.PACKAGE_INSPECTOR)"
Write-Host "QA matrix exists:             $($Gates.QA_MATRIX_EXISTS)"
Write-Host "Final seal exists:            $($Gates.FINAL_SEAL_EXISTS)"
Write-Host "Final package ZIP integrity:  $($Gates.ZIP_INTEGRITY)"
Write-Host "Safety locks held:            $($Gates.SAFETY_LOCKS_HELD)"
Write-Host "-----------------------------------------------"
Write-Host "writer_ready: false"
Write-Host "real_writer_implemented: NO"
Write-Host "keyboard package output generated: NO"
Write-Host "USB write: NO"
Write-Host "PA3X load: NO"
Write-Host "Deploy: NO"
Write-Host "Payment: NO"
Write-Host "Brand/device compatibility claims: NO"
Write-Host "-----------------------------------------------"
Write-Host "Commit Hash: $actualCommit"
Write-Host "Artifacts stored in: $runPath"
Write-Host "Owner UI V9: $uiPath"
Write-Host "Dashboard: $dashPath"
Write-Host "Reviewer Intake: $intakeHtml"
Write-Host "Feedback Simulation: $feedbackHtml"
Write-Host "Trace Matrix: $traceHtml"
Write-Host "Questionnaire: $questionHtml"
Write-Host "QA Matrix: $qaHtml"
Write-Host "ZIP: $zipOut"
Write-Host "Seal: $sealPath"
Write-Host "Report: $reportPath"
Write-Host "==============================================="
Write-Host ""

if ($FinalResult -ne "PASS") {
    exit 1
}
