<#
.SYNOPSIS
    UAOS V1101-V1300  Reviewer Demo RC + Documentation Freeze + Evidence Hardening
    One-file executor. Creates artifacts, validates, packages, seals, and commits.
#>

$ErrorActionPreference = "Stop"

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$basePath    = "E:\keyboard-manager-clean"
$factoryPath = "$basePath\uaos-ai-factory"
$runPath     = "$factoryPath\uaos-v1101-v1300-reviewer-demo-rc"
$prevRunPath = "$factoryPath\uaos-v901-v1100-product-ux-offline-demo"
$prevCommit  = "88eba6ab"

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
    "02_documentation_freeze",
    "03_reviewer_demo_rc",
    "04_owner_setup_v8",
    "05_dashboard_v3",
    "06_master_evidence_index",
    "07_demo_walkthrough",
    "08_validator_v3",
    "09_package_inspector",
    "10_local_qa_matrix",
    "11_safety_evidence",
    "12_reports",
    "13_final_package",
    "14_logs",
    "15_seal"
)

$Gates = [ordered]@{
    PREV_CHECKPOINT_IMPORT = $false
    VALIDATOR_PASS         = $false
    DOC_FREEZE_EXISTS      = $false
    REVIEWER_DEMO_EXISTS   = $false
    OWNER_UI_V8_EXISTS     = $false
    DASHBOARD_EXISTS       = $false
    MASTER_INDEX_EXISTS    = $false
    WALKTHROUGH_EXISTS     = $false
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
    W $Path ($Data | ConvertTo-Json -Depth 80)
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

        if (!$IncludePackageFolder -and $rel -like "13_final_package*") { continue }

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

    $json = Join-Path $runPath "08_validator_v3\UAOS_V1101_V1300_VALIDATOR_SUMMARY.json"
    $md   = Join-Path $runPath "08_validator_v3\UAOS_V1101_V1300_VALIDATOR_SUMMARY.md"
    $html = Join-Path $runPath "08_validator_v3\UAOS_V1101_V1300_VALIDATOR_SUMMARY.html"

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
# UAOS V1101-V1300 Validator V3 Summary

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
<h1>UAOS V1101-V1300 Validator V3 Summary</h1>
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
    $zipOut = Join-Path $runPath "13_final_package\UAOS_V1101_V1300_REVIEWER_DEMO_RC_PACKAGE.zip"
    $pkgDir = Join-Path $runPath "13_final_package\UAOS_V1101_V1300_REVIEWER_DEMO_RC_PACKAGE_CONTENTS"

    if (Test-Path $zipOut) { Remove-Item $zipOut -Force }
    if (Test-Path $pkgDir) { Remove-Item $pkgDir -Recurse -Force }

    New-D $pkgDir

    $sourceDirs = @(
        "00_launcher",
        "01_checkpoint_import",
        "02_documentation_freeze",
        "03_reviewer_demo_rc",
        "04_owner_setup_v8",
        "05_dashboard_v3",
        "06_master_evidence_index",
        "07_demo_walkthrough",
        "08_validator_v3",
        "09_package_inspector",
        "10_local_qa_matrix",
        "11_safety_evidence",
        "12_reports",
        "14_logs",
        "15_seal"
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

    $json = Join-Path $runPath "09_package_inspector\UAOS_V1101_V1300_PACKAGE_INSPECTOR.json"
    $md   = Join-Path $runPath "09_package_inspector\UAOS_V1101_V1300_PACKAGE_INSPECTOR.md"
    $html = Join-Path $runPath "09_package_inspector\UAOS_V1101_V1300_PACKAGE_INSPECTOR.html"

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
# UAOS V1101-V1300 Package Inspector

Status: **$st**

Size bytes: $sz  
Entries: $en

## Violations

$violMd
"@

    W $html @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1101-V1300 Package Inspector</h1>
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

    $dash = Join-Path $runPath "05_dashboard_v3\UAOS_V1101_V1300_REVIEWER_DEMO_DASHBOARD.html"
    $rows = GateRows
    $st = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $sz = if ($null -ne $PackageResult) { $PackageResult.size_bytes } else { 0 }
    $en = if ($null -ne $PackageResult) { $PackageResult.entries } else { 0 }

    W $dash @"
<html>
<body style="font-family:sans-serif;background:#101015;color:#eeeeee;padding:30px;">
<h1>UAOS V1101-V1300 Reviewer Demo RC Dashboard</h1>
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
<li>Documentation freeze</li>
<li>Reviewer demo RC</li>
<li>Owner Setup V8</li>
<li>Evidence hardening</li>
<li>Demo walkthrough</li>
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

    $json = Join-Path $runPath "10_local_qa_matrix\UAOS_V1101_V1300_LOCAL_QA_MATRIX.json"
    $md   = Join-Path $runPath "10_local_qa_matrix\UAOS_V1101_V1300_LOCAL_QA_MATRIX.md"
    $html = Join-Path $runPath "10_local_qa_matrix\UAOS_V1101_V1300_LOCAL_QA_MATRIX.html"

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
# UAOS V1101-V1300 Local QA Matrix

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
<h1>UAOS V1101-V1300 Local QA Matrix</h1>
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

    $seal = Join-Path $runPath "15_seal\UAOS_V1101_V1300_FINAL_SEAL.md"

    W $seal @"
# UAOS FINAL SEAL V1101-V1300

Result: **$Result**

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Project:
Universal Arranger OS

Previous checkpoint:
$prevCommit

## Phase Scope

V1101-V1300 covers:
- Reviewer Demo RC
- Documentation freeze
- Owner Setup V8
- Dashboard V3
- Master evidence index
- Demo walkthrough
- Validator V3
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

This seal covers local research, UX review, evidence review, offline demo documentation, validator evidence, QA evidence, and package evidence only.

This seal does not approve real writer implementation, keyboard package generation, USB writing, hardware loading, deployment, payment activation, or compatibility claims.
"@
}

function Report {
    param([string]$Result, $PackageResult, $Validation)

    $report = Join-Path $runPath "12_reports\UAOS_V1101_V1300_FINAL_REPORT.md"
    $st = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $vs = if ($null -ne $Validation) { $Validation.status } else { "PENDING" }

    W $report @"
# UAOS V1101-V1300 Final Report

Result: **$Result**

Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)  
Documentation freeze exists: $($Gates.DOC_FREEZE_EXISTS)  
Reviewer demo exists: $($Gates.REVIEWER_DEMO_EXISTS)  
Owner UI V8 exists: $($Gates.OWNER_UI_V8_EXISTS)  
Dashboard exists: $($Gates.DASHBOARD_EXISTS)  
Master index exists: $($Gates.MASTER_INDEX_EXISTS)  
Walkthrough exists: $($Gates.WALKTHROUGH_EXISTS)  
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

        git add -- "uaos-ai-factory/RUN_UAOS_V1101_V1300_REVIEWER_DEMO_RC.ps1" "uaos-ai-factory/uaos-v1101-v1300-reviewer-demo-rc" | Out-Null

        git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            $head = (git rev-parse --short HEAD).Trim()
            Pop-Location
            return "NO_NEW_COMMIT_CURRENT_HEAD_$head"
        }

        git commit -m "UAOS V1101-V1300 Reviewer Demo RC [$Result]" | Out-Null

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

Write-Host "--- UAOS V1101-V1300 REVIEWER DEMO RC START ---" -ForegroundColor Cyan

if (Test-Path $runPath) { Remove-Item $runPath -Recurse -Force }
New-D $runPath
foreach ($d in $Dirs) { New-D (Join-Path $runPath $d) }

W (Join-Path $runPath "14_logs\RUN_START.txt") @"
UAOS V1101-V1300 started.
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Run path: $runPath
Previous checkpoint: $prevCommit
"@

Write-Host "[V1101-V1120] Checking previous checkpoint..." -ForegroundColor Yellow

$prevFiles = @(
    "04_owner_setup_v7\UAOS_OWNER_SETUP_V7_HOME.html",
    "05_dashboard_v2\UAOS_V901_V1100_PRODUCT_UX_DASHBOARD.html",
    "07_offline_demo_pack\UAOS_OFFLINE_DEMO_INDEX.html",
    "06_evidence_consolidation\UAOS_MASTER_EVIDENCE_INDEX.html",
    "11_local_qa_matrix\UAOS_V901_V1100_LOCAL_QA_MATRIX.html",
    "14_final_package\UAOS_V901_V1100_PRODUCT_UX_OFFLINE_DEMO_PACKAGE.zip",
    "16_seal\UAOS_V901_V1100_FINAL_SEAL.md",
    "13_reports\UAOS_V901_V1100_FINAL_REPORT.md"
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

J (Join-Path $runPath "01_checkpoint_import\UAOS_V1101_V1300_CHECKPOINT_IMPORT.json") ([ordered]@{
    status = $importStatus
    previous_commit = $prevCommit
    previous_run_path = $prevRunPath
    checked_files = $checks
    missing_files = $missing
    checked_at = Get-Date -Format "o"
})

$importMd = "# UAOS V1101-V1300 Checkpoint Import`n`nStatus: **$importStatus**`n`nPrevious commit: $prevCommit`n`n"
foreach ($c in $checks) { $importMd += "- $($c.file): $($c.exists)`n" }
W (Join-Path $runPath "01_checkpoint_import\UAOS_V1101_V1300_CHECKPOINT_IMPORT.md") $importMd

Write-Host "[V1121-V1260] Creating documentation freeze, reviewer demo, and evidence artifacts..." -ForegroundColor Yellow

W (Join-Path $runPath "00_launcher\UAOS_V1101_V1300_LAUNCHER.txt") @"
UAOS V1101-V1300 launcher.
Reviewer Demo RC and documentation freeze only.
No keyboard package output.
No USB write.
No hardware load.
No deploy.
No payment.
No compatibility claims.
"@

J (Join-Path $runPath "02_documentation_freeze\UAOS_DOC_FREEZE_MANIFEST.json") ([ordered]@{
    phase = "V1101-V1300"
    status = "DOC_FREEZE_RC"
    previous_commit = $prevCommit
    frozen_sections = @(
        "owner setup navigation",
        "offline demo flow",
        "evidence index",
        "validator summaries",
        "package inspection",
        "safety evidence",
        "final seal language"
    )
    safety = $Safety
})

W (Join-Path $runPath "02_documentation_freeze\UAOS_DOC_FREEZE_NOTES.md") @"
# UAOS Documentation Freeze RC

This phase freezes the reviewer-facing local documentation set for offline review.

Frozen areas:
- Owner Setup V8
- Reviewer Demo RC
- Dashboard V3
- Master Evidence Index
- Demo Walkthrough
- Validator V3
- Package Inspector
- Safety Evidence
- Final Seal

No hardware actions are introduced.
"@

$reviewerDemo = Join-Path $runPath "03_reviewer_demo_rc\UAOS_REVIEWER_DEMO_RC_INDEX.html"

W $reviewerDemo @"
<html>
<body style="font-family:sans-serif;background:#101820;color:#eeeeee;padding:40px;">
<h1>UAOS Reviewer Demo RC</h1>
<p>This is a local-only reviewer demo release candidate.</p>

<h2>Review Order</h2>
<ol>
<li>Open Owner Setup V8.</li>
<li>Review Dashboard V3.</li>
<li>Open Master Evidence Index.</li>
<li>Run through Demo Walkthrough.</li>
<li>Review Validator V3.</li>
<li>Review Package Inspector.</li>
<li>Read Final Report.</li>
<li>Read Final Seal.</li>
</ol>

<h2>Links</h2>
<ul>
<li><a href="../04_owner_setup_v8/UAOS_OWNER_SETUP_V8_HOME.html" style="color:cyan;">Owner Setup V8</a></li>
<li><a href="../05_dashboard_v3/UAOS_V1101_V1300_REVIEWER_DEMO_DASHBOARD.html" style="color:cyan;">Dashboard V3</a></li>
<li><a href="../06_master_evidence_index/UAOS_V1101_V1300_MASTER_EVIDENCE_INDEX.html" style="color:cyan;">Master Evidence Index</a></li>
<li><a href="../07_demo_walkthrough/UAOS_V1101_V1300_DEMO_WALKTHROUGH.html" style="color:cyan;">Demo Walkthrough</a></li>
<li><a href="../08_validator_v3/UAOS_V1101_V1300_VALIDATOR_SUMMARY.html" style="color:cyan;">Validator V3</a></li>
<li><a href="../09_package_inspector/UAOS_V1101_V1300_PACKAGE_INSPECTOR.html" style="color:cyan;">Package Inspector</a></li>
<li><a href="../10_local_qa_matrix/UAOS_V1101_V1300_LOCAL_QA_MATRIX.html" style="color:cyan;">QA Matrix</a></li>
<li><a href="../15_seal/UAOS_V1101_V1300_FINAL_SEAL.md" style="color:cyan;">Final Seal</a></li>
</ul>
</body>
</html>
"@

$uiPath = Join-Path $runPath "04_owner_setup_v8\UAOS_OWNER_SETUP_V8_HOME.html"

W $uiPath @"
<html>
<body style="font-family:sans-serif;background:#181824;color:#f2f2f2;padding:40px;">
<h1>UAOS Owner Setup V8</h1>
<h2>Reviewer Demo RC + Documentation Freeze</h2>

<section style="border:1px solid #555;padding:20px;margin-bottom:20px;">
<h3>Status</h3>
<p><b>Phase:</b> V1101-V1300</p>
<p><b>Previous checkpoint:</b> $prevCommit</p>
<p><b>Mode:</b> Local reviewer demo RC</p>
</section>

<section style="border:1px solid #555;padding:20px;margin-bottom:20px;">
<h3>Reviewer Navigation</h3>
<ul>
<li><a href="../03_reviewer_demo_rc/UAOS_REVIEWER_DEMO_RC_INDEX.html" style="color:cyan;">Reviewer Demo RC</a></li>
<li><a href="../05_dashboard_v3/UAOS_V1101_V1300_REVIEWER_DEMO_DASHBOARD.html" style="color:cyan;">Dashboard V3</a></li>
<li><a href="../06_master_evidence_index/UAOS_V1101_V1300_MASTER_EVIDENCE_INDEX.html" style="color:cyan;">Master Evidence Index</a></li>
<li><a href="../07_demo_walkthrough/UAOS_V1101_V1300_DEMO_WALKTHROUGH.html" style="color:cyan;">Demo Walkthrough</a></li>
<li><a href="../08_validator_v3/UAOS_V1101_V1300_VALIDATOR_SUMMARY.html" style="color:cyan;">Validator V3</a></li>
<li><a href="../09_package_inspector/UAOS_V1101_V1300_PACKAGE_INSPECTOR.html" style="color:cyan;">Package Inspector</a></li>
<li><a href="../12_reports/UAOS_V1101_V1300_FINAL_REPORT.md" style="color:cyan;">Final Report</a></li>
<li><a href="../15_seal/UAOS_V1101_V1300_FINAL_SEAL.md" style="color:cyan;">Final Seal</a></li>
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

$masterJson = Join-Path $runPath "06_master_evidence_index\UAOS_V1101_V1300_MASTER_EVIDENCE_INDEX.json"
$masterMd   = Join-Path $runPath "06_master_evidence_index\UAOS_V1101_V1300_MASTER_EVIDENCE_INDEX.md"
$masterHtml = Join-Path $runPath "06_master_evidence_index\UAOS_V1101_V1300_MASTER_EVIDENCE_INDEX.html"

J $masterJson ([ordered]@{
    phase = "V1101-V1300"
    previous_checkpoint = [ordered]@{ run="V901-V1100"; commit=$prevCommit; path=$prevRunPath; imported=$importStatus }
    current_artifacts = [ordered]@{
        documentation_freeze = "02_documentation_freeze"
        reviewer_demo_rc = "03_reviewer_demo_rc"
        owner_setup_v8 = "04_owner_setup_v8"
        dashboard_v3 = "05_dashboard_v3"
        master_evidence_index = "06_master_evidence_index"
        demo_walkthrough = "07_demo_walkthrough"
        validator_v3 = "08_validator_v3"
        package_inspector = "09_package_inspector"
        local_qa_matrix = "10_local_qa_matrix"
        safety_evidence = "11_safety_evidence"
        reports = "12_reports"
        final_package = "13_final_package"
        final_seal = "15_seal"
    }
    safety = $Safety
})

W $masterMd @"
# UAOS V1101-V1300 Master Evidence Index

Previous checkpoint:
- Run: V901-V1100
- Commit: $prevCommit
- Import status: $importStatus

Current evidence:
- Documentation freeze
- Reviewer Demo RC
- Owner Setup V8
- Dashboard V3
- Demo Walkthrough
- Validator V3
- Package Inspector
- QA Matrix
- Safety Evidence
- Final Report
- Final Seal
"@

W $masterHtml @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1101-V1300 Master Evidence Index</h1>
<p><b>Previous checkpoint:</b> $prevCommit</p>
<p><b>Import status:</b> $importStatus</p>
<ul>
<li>Documentation freeze</li>
<li>Reviewer Demo RC</li>
<li>Owner Setup V8</li>
<li>Dashboard V3</li>
<li>Demo Walkthrough</li>
<li>Validator V3</li>
<li>Package Inspector</li>
<li>QA Matrix</li>
<li>Safety Evidence</li>
<li>Final Report</li>
<li>Final Seal</li>
</ul>
</body>
</html>
"@

$walkHtml = Join-Path $runPath "07_demo_walkthrough\UAOS_V1101_V1300_DEMO_WALKTHROUGH.html"
$walkMd   = Join-Path $runPath "07_demo_walkthrough\UAOS_V1101_V1300_DEMO_WALKTHROUGH.md"
$walkCsv  = Join-Path $runPath "07_demo_walkthrough\UAOS_V1101_V1300_DEMO_WALKTHROUGH.csv"

W $walkMd @"
# UAOS V1101-V1300 Demo Walkthrough

1. Start at Owner Setup V8.
2. Open Reviewer Demo RC.
3. Inspect Dashboard V3.
4. Review Master Evidence Index.
5. Review Documentation Freeze notes.
6. Open Validator V3 Summary.
7. Open Package Inspector.
8. Review QA Matrix.
9. End with Final Seal.

This walkthrough is local-only.
"@

W $walkCsv @"
step,item,status
1,Owner Setup V8,READY
2,Reviewer Demo RC,READY
3,Dashboard V3,READY
4,Master Evidence Index,READY
5,Documentation Freeze,READY
6,Validator V3,READY
7,Package Inspector,READY
8,QA Matrix,READY
9,Final Seal,READY
"@

W $walkHtml @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1101-V1300 Demo Walkthrough</h1>
<ol>
<li>Start at Owner Setup V8.</li>
<li>Open Reviewer Demo RC.</li>
<li>Inspect Dashboard V3.</li>
<li>Review Master Evidence Index.</li>
<li>Review Documentation Freeze notes.</li>
<li>Open Validator V3 Summary.</li>
<li>Open Package Inspector.</li>
<li>Review QA Matrix.</li>
<li>End with Final Seal.</li>
</ol>
<p>This walkthrough is local-only.</p>
</body>
</html>
"@

J (Join-Path $runPath "11_safety_evidence\UAOS_V1101_V1300_SAFETY_EVIDENCE.json") $Safety

W (Join-Path $runPath "11_safety_evidence\UAOS_V1101_V1300_SAFETY_EVIDENCE.md") @"
# UAOS V1101-V1300 Safety Evidence

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO

All artifacts are local documentation, local evidence, reviewer demo, validator, package, QA, report, or seal files only.
"@

W (Join-Path $runPath "11_safety_evidence\UAOS_V1101_V1300_SAFETY_EVIDENCE.html") @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V1101-V1300 Safety Evidence</h1>
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

Write-Host "[V1261-V1300] Validating, packaging, sealing..." -ForegroundColor Yellow

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

$dashPath = Join-Path $runPath "05_dashboard_v3\UAOS_V1101_V1300_REVIEWER_DEMO_DASHBOARD.html"
$qaJson = Join-Path $runPath "10_local_qa_matrix\UAOS_V1101_V1300_LOCAL_QA_MATRIX.json"
$qaMd   = Join-Path $runPath "10_local_qa_matrix\UAOS_V1101_V1300_LOCAL_QA_MATRIX.md"
$qaHtml = Join-Path $runPath "10_local_qa_matrix\UAOS_V1101_V1300_LOCAL_QA_MATRIX.html"
$sealPath = Join-Path $runPath "15_seal\UAOS_V1101_V1300_FINAL_SEAL.md"
$inspJson = Join-Path $runPath "09_package_inspector\UAOS_V1101_V1300_PACKAGE_INSPECTOR.json"
$inspMd   = Join-Path $runPath "09_package_inspector\UAOS_V1101_V1300_PACKAGE_INSPECTOR.md"
$inspHtml = Join-Path $runPath "09_package_inspector\UAOS_V1101_V1300_PACKAGE_INSPECTOR.html"

$Gates.DOC_FREEZE_EXISTS    = Test-Path (Join-Path $runPath "02_documentation_freeze\UAOS_DOC_FREEZE_NOTES.md")
$Gates.REVIEWER_DEMO_EXISTS = Test-Path $reviewerDemo
$Gates.OWNER_UI_V8_EXISTS   = Test-Path $uiPath
$Gates.MASTER_INDEX_EXISTS  = ((Test-Path $masterJson) -and (Test-Path $masterMd) -and (Test-Path $masterHtml))
$Gates.WALKTHROUGH_EXISTS   = ((Test-Path $walkHtml) -and (Test-Path $walkMd) -and (Test-Path $walkCsv))

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

    $Gates.DOC_FREEZE_EXISTS    = Test-Path (Join-Path $runPath "02_documentation_freeze\UAOS_DOC_FREEZE_NOTES.md")
    $Gates.REVIEWER_DEMO_EXISTS = Test-Path $reviewerDemo
    $Gates.OWNER_UI_V8_EXISTS   = Test-Path $uiPath
    $Gates.DASHBOARD_EXISTS     = Test-Path $dashPath
    $Gates.MASTER_INDEX_EXISTS  = ((Test-Path $masterJson) -and (Test-Path $masterMd) -and (Test-Path $masterHtml))
    $Gates.WALKTHROUGH_EXISTS   = ((Test-Path $walkHtml) -and (Test-Path $walkMd) -and (Test-Path $walkCsv))
    $Gates.PACKAGE_INSPECTOR    = ((Test-Path $inspJson) -and (Test-Path $inspMd) -and (Test-Path $inspHtml))
    $Gates.QA_MATRIX_EXISTS     = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))
    $Gates.FINAL_SEAL_EXISTS    = Test-Path $sealPath

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

$Gates.DOC_FREEZE_EXISTS    = Test-Path (Join-Path $runPath "02_documentation_freeze\UAOS_DOC_FREEZE_NOTES.md")
$Gates.REVIEWER_DEMO_EXISTS = Test-Path $reviewerDemo
$Gates.OWNER_UI_V8_EXISTS   = Test-Path $uiPath
$Gates.DASHBOARD_EXISTS     = Test-Path $dashPath
$Gates.MASTER_INDEX_EXISTS  = ((Test-Path $masterJson) -and (Test-Path $masterMd) -and (Test-Path $masterHtml))
$Gates.WALKTHROUGH_EXISTS   = ((Test-Path $walkHtml) -and (Test-Path $walkMd) -and (Test-Path $walkCsv))
$Gates.PACKAGE_INSPECTOR    = ((Test-Path $inspJson) -and (Test-Path $inspMd) -and (Test-Path $inspHtml))
$Gates.QA_MATRIX_EXISTS     = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))
$Gates.FINAL_SEAL_EXISTS    = Test-Path $sealPath
$Gates.ZIP_INTEGRITY        = ($packageResult.status -eq "PASS")

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

W (Join-Path $runPath "14_logs\RUN_COMPLETE.txt") @"
UAOS V1101-V1300 complete.
Result: $FinalResult
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Validator: $($validation.status)
Package: $($packageResult.status)
"@

$actualCommit = Commit $FinalResult

$zipOut = Join-Path $runPath "13_final_package\UAOS_V1101_V1300_REVIEWER_DEMO_RC_PACKAGE.zip"
$reportPath = Join-Path $runPath "12_reports\UAOS_V1101_V1300_FINAL_REPORT.md"

$color = if ($FinalResult -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V1101-V1300 Reviewer Demo RC: $FinalResult " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)"
Write-Host "Validator Status:             $($validation.status)"
Write-Host "Documentation freeze exists:  $($Gates.DOC_FREEZE_EXISTS)"
Write-Host "Reviewer demo exists:         $($Gates.REVIEWER_DEMO_EXISTS)"
Write-Host "Owner UI V8 ready:            $($Gates.OWNER_UI_V8_EXISTS)"
Write-Host "Dashboard created:            $($Gates.DASHBOARD_EXISTS)"
Write-Host "Master index exists:          $($Gates.MASTER_INDEX_EXISTS)"
Write-Host "Walkthrough exists:           $($Gates.WALKTHROUGH_EXISTS)"
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
Write-Host "Owner UI V8: $uiPath"
Write-Host "Dashboard: $dashPath"
Write-Host "Reviewer Demo: $reviewerDemo"
Write-Host "Master Evidence Index: $masterHtml"
Write-Host "Walkthrough: $walkHtml"
Write-Host "QA Matrix: $qaHtml"
Write-Host "ZIP: $zipOut"
Write-Host "Seal: $sealPath"
Write-Host "Report: $reportPath"
Write-Host "==============================================="
Write-Host ""

if ($FinalResult -ne "PASS") {
    exit 1
}
