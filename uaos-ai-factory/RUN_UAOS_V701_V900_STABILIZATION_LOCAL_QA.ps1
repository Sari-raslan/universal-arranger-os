<#
.SYNOPSIS
    UAOS V701-V900 Stabilization + Local QA
    One-file executor. Creates artifacts, validates, packages, seals, and commits.
#>

$ErrorActionPreference = "Stop"

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$basePath    = "E:\keyboard-manager-clean"
$factoryPath = "$basePath\uaos-ai-factory"
$runPath     = "$factoryPath\uaos-v701-v900-stabilization-local-qa"
$prevRunPath = "$factoryPath\google-studio-full-executor-v461-v700"
$prevCommit  = "04f7ed69"

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
    "01_agent_plan",
    "02_previous_checkpoint_import",
    "03_validator_hardening",
    "04_owner_ui_stabilization",
    "05_dashboard_stabilization",
    "06_package_consolidation",
    "07_parser_research_v7_v8",
    "08_dummy_sandbox_hardening_v4",
    "09_generic_style_rc_expansion",
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
    OWNER_UI_EXISTS        = $false
    DASHBOARD_EXISTS       = $false
    QA_MATRIX_EXISTS       = $false
    FINAL_SEAL_EXISTS      = $false
    ZIP_INTEGRITY          = $false
    SAFETY_LOCKS_HELD      = $false
}

function New-UAOSDir {
    param([string]$Path)
    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Write-UAOSText {
    param([string]$Path, [string]$Content)
    $parent = Split-Path -Parent $Path
    New-UAOSDir $parent
    $Content | Out-File -FilePath $Path -Encoding UTF8
}

function Write-UAOSJson {
    param([string]$Path, $Data)
    Write-UAOSText -Path $Path -Content ($Data | ConvertTo-Json -Depth 50)
}

function Get-UAOSRel {
    param([string]$Root, [string]$Full)
    if ($Full.StartsWith($Root)) {
        return ($Full.Substring($Root.Length) -replace '^[\\/]+', '')
    }
    return $Full
}

function Get-UAOSOverall {
    foreach ($g in $Gates.GetEnumerator()) {
        if ($g.Value -ne $true) {
            return "FAIL"
        }
    }
    return "PASS"
}

function Get-UAOSGateRows {
    $rows = ""
    foreach ($g in ($Gates.GetEnumerator() | Sort-Object Name)) {
        $rows += "<tr><td>$($g.Key)</td><td><b>$($g.Value)</b></td></tr>`n"
    }
    return $rows
}

function Invoke-UAOSValidator {
    param([string]$TargetPath, [switch]$IncludePackageFolder)

    $violations = @()
    $warnings = @()
    $scanned = 0
    $files = Get-ChildItem -Path $TargetPath -Recurse -File -ErrorAction SilentlyContinue

    foreach ($file in $files) {
        $rel = Get-UAOSRel -Root $TargetPath -Full $file.FullName
        $ext = $file.Extension.ToLowerInvariant()

        if (!$IncludePackageFolder -and $rel -like "13_final_package*") {
            continue
        }

        $scanned++

        if ($ForbiddenExt -contains $ext) {
            $violations += [ordered]@{
                type = "FORBIDDEN_EXTENSION"
                file = $rel
                detail = "Blocked extension detected: $ext"
            }
        }

        if ($ext -and !($AllowedExt -contains $ext)) {
            $violations += [ordered]@{
                type = "UNAPPROVED_EXTENSION"
                file = $rel
                detail = "Only JSON, Markdown, HTML, TXT, CSV, and ZIP are allowed."
            }
        }

        if ($ext -eq ".zip") {
            continue
        }

        if (@(".json", ".md", ".html", ".txt", ".csv") -contains $ext) {
            try {
                $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
                foreach ($rule in $UnsafeRules) {
                    if ($content -match $rule.Pattern) {
                        $violations += [ordered]@{
                            type = "UNSAFE_CONTENT"
                            file = $rel
                            rule = $rule.Id
                            detail = "Unsafe enablement, output, deploy, payment, or compatibility claim detected."
                        }
                    }
                }
            } catch {
                $warnings += [ordered]@{
                    type = "READ_WARNING"
                    file = $rel
                    detail = $_.Exception.Message
                }
            }
        }
    }

    $status = if (@($violations).Count -eq 0) { "PASS" } else { "FAIL" }

    return [ordered]@{
        status = $status
        scanned_files = $scanned
        violations = @($violations)
        warnings = @($warnings)
        checked_at = Get-Date -Format "o"
        safety = $Safety
    }
}

function Write-UAOSValidatorReports {
    param($Validation)

    $jsonPath = Join-Path $runPath "03_validator_hardening\UAOS_V701_V900_VALIDATOR_SUMMARY.json"
    $mdPath   = Join-Path $runPath "03_validator_hardening\UAOS_V701_V900_VALIDATOR_SUMMARY.md"
    $htmlPath = Join-Path $runPath "03_validator_hardening\UAOS_V701_V900_VALIDATOR_SUMMARY.html"

    Write-UAOSJson -Path $jsonPath -Data $Validation

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

    Write-UAOSText -Path $mdPath -Content @"
# UAOS V701-V900 Validator Summary

Status: **$($Validation.status)**

Scanned files: $($Validation.scanned_files)

## Safety

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO

## Violations

$vmd
"@

    Write-UAOSText -Path $htmlPath -Content @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V701-V900 Validator Summary</h1>
<p><b>Status:</b> $($Validation.status)</p>
<p><b>Scanned files:</b> $($Validation.scanned_files)</p>
<h2>Violations</h2>
<ul>
$vhtml
</ul>
</body>
</html>
"@
}

function Test-UAOSZip {
    param([string]$ZipPath)

    $result = [ordered]@{
        status = "FAIL"
        exists = $false
        size_bytes = 0
        entries = 0
        violations = @()
    }

    if (!(Test-Path $ZipPath)) {
        $result.violations += "ZIP missing."
        return $result
    }

    $item = Get-Item $ZipPath
    $result.exists = $true
    $result.size_bytes = $item.Length

    if ($item.Length -le 0) {
        $result.violations += "ZIP empty."
        return $result
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)

    try {
        foreach ($entry in $zip.Entries) {
            $result.entries++
            $ext = [System.IO.Path]::GetExtension($entry.FullName).ToLowerInvariant()

            if ($ForbiddenExt -contains $ext) {
                $result.violations += "Forbidden extension inside ZIP: $($entry.FullName)"
            }

            if ($ext -eq ".zip") {
                $result.violations += "Nested ZIP blocked: $($entry.FullName)"
            }

            if ($ext -and !($AllowedExt -contains $ext)) {
                $result.violations += "Unapproved extension inside ZIP: $($entry.FullName)"
            }
        }
    } finally {
        $zip.Dispose()
    }

    if ($result.entries -le 0) {
        $result.violations += "ZIP has no entries."
    }

    $result.status = if (@($result.violations).Count -eq 0) { "PASS" } else { "FAIL" }
    return $result
}

function New-UAOSPackage {
    $zipOut = Join-Path $runPath "13_final_package\UAOS_V701_V900_STABILIZATION_PACKAGE.zip"
    $pkgDir = Join-Path $runPath "13_final_package\UAOS_V701_V900_STABILIZATION_PACKAGE_CONTENTS"

    if (Test-Path $zipOut) {
        Remove-Item $zipOut -Force
    }

    if (Test-Path $pkgDir) {
        Remove-Item $pkgDir -Recurse -Force
    }

    New-UAOSDir $pkgDir

    $sourceDirs = @(
        "00_launcher",
        "01_agent_plan",
        "02_previous_checkpoint_import",
        "03_validator_hardening",
        "04_owner_ui_stabilization",
        "05_dashboard_stabilization",
        "06_package_consolidation",
        "07_parser_research_v7_v8",
        "08_dummy_sandbox_hardening_v4",
        "09_generic_style_rc_expansion",
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
        return [ordered]@{
            status = "FAIL"
            exists = $false
            size_bytes = 0
            entries = 0
            violations = @("Package contents empty.")
        }
    }

    Compress-Archive -Path $items.FullName -DestinationPath $zipOut -Force
    return Test-UAOSZip -ZipPath $zipOut
}

function Write-UAOSDashboard {
    param([string]$Result, $PackageResult)

    $dashPath = Join-Path $runPath "05_dashboard_stabilization\UAOS_V701_V900_STABILIZATION_DASHBOARD.html"
    $rows = Get-UAOSGateRows

    $pkgStatus = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $pkgSize   = if ($null -ne $PackageResult) { $PackageResult.size_bytes } else { 0 }
    $pkgEntry  = if ($null -ne $PackageResult) { $PackageResult.entries } else { 0 }

    Write-UAOSText -Path $dashPath -Content @"
<html>
<body style="font-family:sans-serif;background:#111;color:#eee;padding:30px;">
<h1>UAOS V701-V900 Stabilization Dashboard</h1>
<p><b>Final Result:</b> $Result</p>
<p><b>Previous Checkpoint:</b> $prevCommit</p>
<p><b>Package Status:</b> $pkgStatus</p>
<p><b>Package Size:</b> $pkgSize bytes</p>
<p><b>Package Entries:</b> $pkgEntry</p>
<h2>Gates</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
<tr><th>Gate</th><th>Status</th></tr>
$rows
</table>
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

function Write-UAOSQAMatrix {
    param([string]$Result, $PackageResult)

    $qaJson = Join-Path $runPath "10_local_qa_matrix\UAOS_V701_V900_LOCAL_QA_MATRIX.json"
    $qaMd   = Join-Path $runPath "10_local_qa_matrix\UAOS_V701_V900_LOCAL_QA_MATRIX.md"
    $qaHtml = Join-Path $runPath "10_local_qa_matrix\UAOS_V701_V900_LOCAL_QA_MATRIX.html"

    $pkgStatus = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }

    Write-UAOSJson -Path $qaJson -Data ([ordered]@{
        result = $Result
        package_status = $pkgStatus
        gates = $Gates
        safety = $Safety
        generated_at = Get-Date -Format "o"
    })

    $gateMd = ""
    foreach ($g in ($Gates.GetEnumerator() | Sort-Object Name)) {
        $gateMd += "- $($g.Key): $($g.Value)`n"
    }

    Write-UAOSText -Path $qaMd -Content @"
# UAOS V701-V900 Local QA Matrix

Result: **$Result**

Package status: **$pkgStatus**

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

    $rows = Get-UAOSGateRows

    Write-UAOSText -Path $qaHtml -Content @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V701-V900 Local QA Matrix</h1>
<p><b>Result:</b> $Result</p>
<p><b>Package status:</b> $pkgStatus</p>
<table border="1" cellpadding="8" cellspacing="0">
<tr><th>Gate</th><th>Status</th></tr>
$rows
</table>
</body>
</html>
"@
}

function Write-UAOSSeal {
    param([string]$Result)

    $sealPath = Join-Path $runPath "15_seal\UAOS_V701_V900_FINAL_SEAL.md"

    Write-UAOSText -Path $sealPath -Content @"
# UAOS FINAL SEAL V701-V900

Result: **$Result**

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Project:
Universal Arranger OS

Previous checkpoint:
$prevCommit

## Safety Lockdown

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO

## Scope

This seal covers local research, validator hardening, dashboard stabilization, dummy sandbox hardening, package consolidation, parser research, generic metadata examples, local QA evidence, and final packaging only.

This seal does not approve real writer implementation, keyboard package generation, USB writing, hardware loading, deployment, payment activation, or compatibility claims.
"@
}

function Write-UAOSReport {
    param([string]$Result, $PackageResult, $Validation)

    $report = Join-Path $runPath "12_reports\UAOS_V701_V900_FINAL_REPORT.md"
    $pkgStatus = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $valStatus = if ($null -ne $Validation) { $Validation.status } else { "PENDING" }

    Write-UAOSText -Path $report -Content @"
# UAOS V701-V900 Final Report

Result: **$Result**

Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)  
Owner Setup V6 ready: $($Gates.OWNER_UI_EXISTS)  
Dashboard created: $($Gates.DASHBOARD_EXISTS)  
QA matrix exists: $($Gates.QA_MATRIX_EXISTS)  
Final seal exists: $($Gates.FINAL_SEAL_EXISTS)  
Final package ZIP integrity: $($Gates.ZIP_INTEGRITY)  
Validator pass: $($Gates.VALIDATOR_PASS)  
Safety locks held: $($Gates.SAFETY_LOCKS_HELD)  

Package status: **$pkgStatus**  
Validator status: **$valStatus**

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

function Invoke-UAOSCommit {
    param([string]$Result)

    if (!(Test-Path "$basePath\.git")) {
        return "NO_GIT_REPO"
    }

    try {
        Push-Location $basePath

        git add -- "uaos-ai-factory/RUN_UAOS_V701_V900_STABILIZATION_LOCAL_QA.ps1" "uaos-ai-factory/uaos-v701-v900-stabilization-local-qa" | Out-Null

        git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            $head = (git rev-parse --short HEAD).Trim()
            Pop-Location
            return "NO_NEW_COMMIT_CURRENT_HEAD_$head"
        }

        git commit -m "UAOS V701-V900 Stabilization Local QA [$Result]" | Out-Null

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
        try {
            return "GIT_ERROR_CURRENT_HEAD_$((git -C $basePath rev-parse --short HEAD).Trim())"
        } catch {
            return "GIT_ERROR"
        }
    }
}

Write-Host "--- UAOS V701-V900 STABILIZATION LOCAL QA START ---" -ForegroundColor Cyan

if (Test-Path $runPath) {
    Remove-Item $runPath -Recurse -Force
}

New-UAOSDir $runPath

foreach ($d in $Dirs) {
    New-UAOSDir (Join-Path $runPath $d)
}

Write-UAOSText -Path (Join-Path $runPath "14_logs\RUN_START.txt") -Content @"
UAOS V701-V900 started.
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Run path: $runPath
Previous checkpoint: $prevCommit
"@

Write-Host "[V701-V720] Checking previous checkpoint..." -ForegroundColor Yellow

$prevFiles = @(
    "04_final_owner_setup_v5\UAOS_FINAL_OWNER_SETUP_V5_HOME.html",
    "11_final_package\UAOS_FINAL_OWNER_SETUP_V5_PACKAGE.zip",
    "08_dashboards\UAOS_GOOGLE_STUDIO_FULL_EXECUTOR_DASHBOARD.html",
    "13_seal\UAOS_GOOGLE_STUDIO_FULL_EXECUTOR_FINAL_SEAL.md"
)

$prevChecks = @()
$missing = @()

foreach ($f in $prevFiles) {
    $full = Join-Path $prevRunPath $f
    $exists = Test-Path $full

    $prevChecks += [ordered]@{
        file = $f
        path = $full
        exists = $exists
    }

    if (!$exists) {
        $missing += $f
    }
}

$importStatus = if (@($missing).Count -eq 0) { "YES" } else { "NO" }
$Gates.PREV_CHECKPOINT_IMPORT = ($importStatus -eq "YES")

Write-UAOSJson -Path (Join-Path $runPath "02_previous_checkpoint_import\UAOS_PREVIOUS_CHECKPOINT_IMPORT.json") -Data ([ordered]@{
    status = $importStatus
    previous_commit = $prevCommit
    previous_run_path = $prevRunPath
    checked_files = $prevChecks
    missing_files = $missing
})

$importMd = "# UAOS Previous Checkpoint Import`n`nStatus: **$importStatus**`n`nPrevious commit: $prevCommit`n`n"
foreach ($c in $prevChecks) {
    $importMd += "- $($c.file): $($c.exists)`n"
}
Write-UAOSText -Path (Join-Path $runPath "02_previous_checkpoint_import\UAOS_PREVIOUS_CHECKPOINT_IMPORT.md") -Content $importMd

Write-Host "[V721-V860] Creating artifacts..." -ForegroundColor Yellow

Write-UAOSText -Path (Join-Path $runPath "00_launcher\UAOS_V701_V900_LAUNCHER.txt") -Content @"
UAOS V701-V900 launcher.
Local research and QA only.
No keyboard package output.
No USB write.
No hardware load.
No deploy.
No payment.
"@

Write-UAOSJson -Path (Join-Path $runPath "01_agent_plan\UAOS_V701_V900_AGENT_PLAN.json") -Data ([ordered]@{
    run = "V701-V900"
    goal = "stabilization_local_qa"
    previous_commit = $prevCommit
    safety = $Safety
    batches = @(
        "V701-V720 Previous Checkpoint Import",
        "V721-V740 Validator Hardening",
        "V741-V760 Owner UI Stabilization",
        "V761-V780 Dashboard Stabilization",
        "V781-V800 Package Consolidation",
        "V801-V820 Parser Research V7/V8",
        "V821-V840 Dummy Sandbox Hardening V4",
        "V841-V860 Generic Metadata Expansion",
        "V861-V880 Local QA Matrix",
        "V881-V900 Final Package and Seal"
    )
})

Write-UAOSText -Path (Join-Path $runPath "01_agent_plan\UAOS_V701_V900_AGENT_PLAN.md") -Content @"
# UAOS V701-V900 Agent Plan

Goal:
Stabilization and local QA.

Safety:
- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO
"@

$uiPath = Join-Path $runPath "04_owner_ui_stabilization\UAOS_OWNER_SETUP_V6_HOME.html"

Write-UAOSText -Path $uiPath -Content @"
<html>
<body style="font-family:sans-serif;background:#1a1a1a;color:#eee;padding:40px;">
<h1>UAOS Owner Setup V6</h1>
<h2>Stabilization + Local QA</h2>
<p><b>Status:</b> LOCAL_QA_STABILIZATION</p>
<p><b>Safety Lock:</b> writer_ready=false</p>
<p><b>Current Phase:</b> V701-V900</p>
<p><b>Previous Checkpoint:</b> $prevCommit</p>
<ul>
<li><a href="../05_dashboard_stabilization/UAOS_V701_V900_STABILIZATION_DASHBOARD.html" style="color:cyan;">Dashboard</a></li>
<li><a href="../10_local_qa_matrix/UAOS_V701_V900_LOCAL_QA_MATRIX.html" style="color:cyan;">QA Matrix</a></li>
<li><a href="../03_validator_hardening/UAOS_V701_V900_VALIDATOR_SUMMARY.html" style="color:cyan;">Validator Summary</a></li>
<li><a href="../15_seal/UAOS_V701_V900_FINAL_SEAL.md" style="color:cyan;">Final Seal</a></li>
</ul>
<p style="color:orange;">Future product integration remains blocked until separate explicit approval.</p>
</body>
</html>
"@

Write-UAOSJson -Path (Join-Path $runPath "06_package_consolidation\UAOS_V701_V900_CONSOLIDATED_MANIFEST.json") -Data ([ordered]@{
    run = "V701-V900"
    previous_commit = $prevCommit
    artifact_class = "research_only_local_qa"
    includes = @(
        "V441-V460 external parser review reference",
        "V461-V560 fallback continuation reference",
        "V561-V700 planned continuation reference",
        "V461-V700 final executor checkpoint",
        "V701-V900 stabilization outputs"
    )
    safety = $Safety
})

Write-UAOSText -Path (Join-Path $runPath "06_package_consolidation\UAOS_V701_V900_LOCAL_EVIDENCE_INDEX.md") -Content @"
# UAOS V701-V900 Local Evidence Index

- Previous checkpoint import: 02_previous_checkpoint_import
- Validator hardening: 03_validator_hardening
- Owner UI V6: 04_owner_ui_stabilization
- Dashboard: 05_dashboard_stabilization
- Package consolidation: 06_package_consolidation
- Parser research: 07_parser_research_v7_v8
- Dummy sandbox hardening: 08_dummy_sandbox_hardening_v4
- Generic metadata examples: 09_generic_style_rc_expansion
- QA matrix: 10_local_qa_matrix
- Safety evidence: 11_safety_evidence
- Final package: 13_final_package
- Final seal: 15_seal
"@

Write-UAOSText -Path (Join-Path $runPath "07_parser_research_v7_v8\UAOS_PARSER_RESEARCH_V7_V8_NOTES.md") -Content @"
# UAOS Parser Research V7/V8

Focus:
- Neutral arranger-style metadata research.
- Abstract pattern schema mapping.
- Review-only sample structures.
- No binary implementation.
- No target-device package generation.

Risk register:
- Accidental compatibility language: blocked by validator.
- Forbidden extension creation: blocked by validator.
- Hardware or deploy activation: blocked by validator and safety gates.
"@

Write-UAOSJson -Path (Join-Path $runPath "07_parser_research_v7_v8\UAOS_GENERIC_PATTERN_SCHEMA.json") -Data ([ordered]@{
    schema_name = "UAOS_GENERIC_PATTERN_SCHEMA"
    version = "V7_V8_RESEARCH"
    output_class = "generic_json_only"
    fields = @("id", "label", "tempo_range", "meter", "sections", "tracks", "energy", "notes")
})

Write-UAOSText -Path (Join-Path $runPath "07_parser_research_v7_v8\UAOS_EXTERNAL_REVIEW_QUESTIONS.md") -Content @"
# UAOS Parser Research External Review Questions

1. Are the generic metadata fields clear?
2. Are section and track abstractions separated cleanly?
3. Are safety boundaries visible?
4. Are any terms too close to compatibility claims?
5. Should future research split rhythm metadata and arrangement metadata further?
"@

Write-UAOSText -Path (Join-Path $runPath "08_dummy_sandbox_hardening_v4\UAOS_DUMMY_SANDBOX_POLICY.md") -Content @"
# UAOS Dummy Sandbox Hardening V4

Allowed evidence file types:
- JSON
- Markdown
- HTML
- TXT
- CSV
- ZIP package

Blocked actions:
- Real writer activation
- Keyboard package output
- USB write
- PA3X load
- Deploy
- Payment

Forbidden output extensions:
- .sty
- .set
- .prs
- .prf
- .kst
"@

Write-UAOSJson -Path (Join-Path $runPath "08_dummy_sandbox_hardening_v4\UAOS_DUMMY_SANDBOX_DENYLIST.json") -Data ([ordered]@{
    forbidden_extensions = $ForbiddenExt
    allowed_extensions = $AllowedExt
    blocked_actions = @("real_writer_activation", "keyboard_package_output", "usb_write", "pa3x_load", "deploy", "payment")
})

$genericStyles = @(
    [ordered]@{ id = "generic_ballad_rc"; label = "Generic Ballad RC"; output_class = "metadata_only"; file_type = "json" },
    [ordered]@{ id = "generic_pop_rc";    label = "Generic Pop RC";    output_class = "metadata_only"; file_type = "json" },
    [ordered]@{ id = "generic_dance_rc";  label = "Generic Dance RC";  output_class = "metadata_only"; file_type = "json" },
    [ordered]@{ id = "generic_latin_rc";  label = "Generic Latin RC";  output_class = "metadata_only"; file_type = "json" },
    [ordered]@{ id = "generic_rock_rc";   label = "Generic Rock RC";   output_class = "metadata_only"; file_type = "json" },
    [ordered]@{ id = "generic_world_rc";  label = "Generic World RC";  output_class = "metadata_only"; file_type = "json" }
)

Write-UAOSJson -Path (Join-Path $runPath "09_generic_style_rc_expansion\UAOS_GENERIC_STYLE_RCS.json") -Data $genericStyles

Write-UAOSText -Path (Join-Path $runPath "09_generic_style_rc_expansion\UAOS_GENERIC_STYLE_RCS.md") -Content @"
# Generic UAOS Style RC Metadata Examples

These are neutral metadata examples only.

- generic_ballad_rc
- generic_pop_rc
- generic_dance_rc
- generic_latin_rc
- generic_rock_rc
- generic_world_rc

No keyboard package files are generated.
No target-device load is performed.
"@

Write-UAOSText -Path (Join-Path $runPath "09_generic_style_rc_expansion\UAOS_GENERIC_STYLE_RCS.csv") -Content @"
id,label,output_class,file_type
generic_ballad_rc,Generic Ballad RC,metadata_only,json
generic_pop_rc,Generic Pop RC,metadata_only,json
generic_dance_rc,Generic Dance RC,metadata_only,json
generic_latin_rc,Generic Latin RC,metadata_only,json
generic_rock_rc,Generic Rock RC,metadata_only,json
generic_world_rc,Generic World RC,metadata_only,json
"@

Write-UAOSJson -Path (Join-Path $runPath "11_safety_evidence\UAOS_V701_V900_SAFETY_EVIDENCE.json") -Data $Safety

Write-UAOSText -Path (Join-Path $runPath "11_safety_evidence\UAOS_V701_V900_SAFETY_EVIDENCE.md") -Content @"
# UAOS V701-V900 Safety Evidence

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO

All artifacts are local research, review, validator, dashboard, QA, package, seal, or generic metadata evidence.
"@

Write-UAOSText -Path (Join-Path $runPath "11_safety_evidence\UAOS_V701_V900_SAFETY_EVIDENCE.html") -Content @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V701-V900 Safety Evidence</h1>
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

Write-Host "[V861-V900] Validating and finalizing..." -ForegroundColor Yellow

$packageResult = $null
$validation = Invoke-UAOSValidator -TargetPath $runPath
Write-UAOSValidatorReports -Validation $validation

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

$Gates.OWNER_UI_EXISTS = Test-Path $uiPath

Write-UAOSDashboard -Result "PENDING" -PackageResult $packageResult
$dashPath = Join-Path $runPath "05_dashboard_stabilization\UAOS_V701_V900_STABILIZATION_DASHBOARD.html"
$Gates.DASHBOARD_EXISTS = Test-Path $dashPath

Write-UAOSQAMatrix -Result "PENDING" -PackageResult $packageResult
$qaJson = Join-Path $runPath "10_local_qa_matrix\UAOS_V701_V900_LOCAL_QA_MATRIX.json"
$qaMd   = Join-Path $runPath "10_local_qa_matrix\UAOS_V701_V900_LOCAL_QA_MATRIX.md"
$qaHtml = Join-Path $runPath "10_local_qa_matrix\UAOS_V701_V900_LOCAL_QA_MATRIX.html"
$Gates.QA_MATRIX_EXISTS = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))

Write-UAOSSeal -Result "PENDING"
$sealPath = Join-Path $runPath "15_seal\UAOS_V701_V900_FINAL_SEAL.md"
$Gates.FINAL_SEAL_EXISTS = Test-Path $sealPath

Write-UAOSReport -Result "PENDING" -PackageResult $packageResult -Validation $validation

$packageResult = New-UAOSPackage
$Gates.ZIP_INTEGRITY = ($packageResult.status -eq "PASS")

for ($i = 1; $i -le 3; $i++) {
    $validation = Invoke-UAOSValidator -TargetPath $runPath -IncludePackageFolder
    Write-UAOSValidatorReports -Validation $validation

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

    $Gates.OWNER_UI_EXISTS = Test-Path $uiPath
    $Gates.DASHBOARD_EXISTS = Test-Path $dashPath
    $Gates.QA_MATRIX_EXISTS = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))
    $Gates.FINAL_SEAL_EXISTS = Test-Path $sealPath

    $FinalResult = Get-UAOSOverall

    Write-UAOSDashboard -Result $FinalResult -PackageResult $packageResult
    Write-UAOSQAMatrix -Result $FinalResult -PackageResult $packageResult
    Write-UAOSSeal -Result $FinalResult
    Write-UAOSReport -Result $FinalResult -PackageResult $packageResult -Validation $validation

    $packageResult = New-UAOSPackage
    $Gates.ZIP_INTEGRITY = ($packageResult.status -eq "PASS")
}

$FinalResult = Get-UAOSOverall

Write-UAOSText -Path (Join-Path $runPath "14_logs\RUN_COMPLETE.txt") -Content @"
UAOS V701-V900 complete.
Result: $FinalResult
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Validator: $($validation.status)
Package: $($packageResult.status)
"@

Write-UAOSDashboard -Result $FinalResult -PackageResult $packageResult
Write-UAOSQAMatrix -Result $FinalResult -PackageResult $packageResult
Write-UAOSSeal -Result $FinalResult
Write-UAOSReport -Result $FinalResult -PackageResult $packageResult -Validation $validation

$packageResult = New-UAOSPackage
$Gates.ZIP_INTEGRITY = ($packageResult.status -eq "PASS")
$FinalResult = Get-UAOSOverall

$actualCommit = Invoke-UAOSCommit -Result $FinalResult

$zipOut = Join-Path $runPath "13_final_package\UAOS_V701_V900_STABILIZATION_PACKAGE.zip"
$reportPath = Join-Path $runPath "12_reports\UAOS_V701_V900_FINAL_REPORT.md"

$color = if ($FinalResult -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V701-V900 Stabilization Local QA: $FinalResult " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)"
Write-Host "Owner Setup V6 ready:         $($Gates.OWNER_UI_EXISTS)"
Write-Host "Dashboard created:            $($Gates.DASHBOARD_EXISTS)"
Write-Host "QA matrix exists:             $($Gates.QA_MATRIX_EXISTS)"
Write-Host "Final seal exists:            $($Gates.FINAL_SEAL_EXISTS)"
Write-Host "Final package ZIP integrity:  $($Gates.ZIP_INTEGRITY)"
Write-Host "Validator Status:             $($validation.status)"
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
Write-Host "UI: $uiPath"
Write-Host "Dashboard: $dashPath"
Write-Host "QA Matrix: $qaHtml"
Write-Host "ZIP: $zipOut"
Write-Host "Seal: $sealPath"
Write-Host "Report: $reportPath"
Write-Host "==============================================="
Write-Host ""

if ($FinalResult -ne "PASS") {
    exit 1
}
