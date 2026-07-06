<#
.SYNOPSIS
    UAOS V901-V1100  Product UX Polish + Evidence Consolidation + Offline Demo Pack
    One-file executor.
    Creates artifacts, validates, packages, seals, and commits.
#>

$ErrorActionPreference = "Stop"

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$basePath    = "E:\keyboard-manager-clean"
$factoryPath = "$basePath\uaos-ai-factory"
$runPath     = "$factoryPath\uaos-v901-v1100-product-ux-offline-demo"
$prevRunPath = "$factoryPath\uaos-v701-v900-stabilization-local-qa"
$prevCommit  = "dc233695"

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
    "03_product_ux_polish",
    "04_owner_setup_v7",
    "05_dashboard_v2",
    "06_evidence_consolidation",
    "07_offline_demo_pack",
    "08_demo_assets",
    "09_validator_v2",
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
    OWNER_UI_V7_EXISTS     = $false
    DASHBOARD_EXISTS       = $false
    OFFLINE_DEMO_EXISTS    = $false
    EVIDENCE_INDEX_EXISTS  = $false
    PACKAGE_INSPECTOR      = $false
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
    Write-UAOSText -Path $Path -Content ($Data | ConvertTo-Json -Depth 60)
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

        if (!$IncludePackageFolder -and $rel -like "14_final_package*") {
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
                detail = "Only JSON, Markdown, HTML, TXT, CSV, and ZIP evidence files are allowed."
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

    $jsonPath = Join-Path $runPath "09_validator_v2\UAOS_V901_V1100_VALIDATOR_SUMMARY.json"
    $mdPath   = Join-Path $runPath "09_validator_v2\UAOS_V901_V1100_VALIDATOR_SUMMARY.md"
    $htmlPath = Join-Path $runPath "09_validator_v2\UAOS_V901_V1100_VALIDATOR_SUMMARY.html"

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
# UAOS V901-V1100 Validator Summary

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
<h1>UAOS V901-V1100 Validator Summary</h1>
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
    $zipOut = Join-Path $runPath "14_final_package\UAOS_V901_V1100_PRODUCT_UX_OFFLINE_DEMO_PACKAGE.zip"
    $pkgDir = Join-Path $runPath "14_final_package\UAOS_V901_V1100_PRODUCT_UX_OFFLINE_DEMO_PACKAGE_CONTENTS"

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
        "03_product_ux_polish",
        "04_owner_setup_v7",
        "05_dashboard_v2",
        "06_evidence_consolidation",
        "07_offline_demo_pack",
        "08_demo_assets",
        "09_validator_v2",
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

function Write-UAOSPackageInspector {
    param($PackageResult)

    $json = Join-Path $runPath "10_package_inspector\UAOS_V901_V1100_PACKAGE_INSPECTOR.json"
    $md   = Join-Path $runPath "10_package_inspector\UAOS_V901_V1100_PACKAGE_INSPECTOR.md"
    $html = Join-Path $runPath "10_package_inspector\UAOS_V901_V1100_PACKAGE_INSPECTOR.html"

    Write-UAOSJson -Path $json -Data ([ordered]@{
        inspected_at = Get-Date -Format "o"
        package = $PackageResult
        rules = [ordered]@{
            forbidden_extensions = $ForbiddenExt
            nested_zip_blocked = $true
            allowed_extensions = $AllowedExt
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

    $pkgStatus = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $pkgSize = if ($null -ne $PackageResult) { $PackageResult.size_bytes } else { 0 }
    $pkgEntries = if ($null -ne $PackageResult) { $PackageResult.entries } else { 0 }

    Write-UAOSText -Path $md -Content @"
# UAOS V901-V1100 Package Inspector

Status: **$pkgStatus**

Size bytes: $pkgSize  
Entries: $pkgEntries

## Violations

$violMd
"@

    Write-UAOSText -Path $html -Content @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V901-V1100 Package Inspector</h1>
<p><b>Status:</b> $pkgStatus</p>
<p><b>Size bytes:</b> $pkgSize</p>
<p><b>Entries:</b> $pkgEntries</p>
<h2>Violations</h2>
<ul>
$violHtml
</ul>
</body>
</html>
"@
}

function Write-UAOSDashboard {
    param([string]$Result, $PackageResult)

    $dashPath = Join-Path $runPath "05_dashboard_v2\UAOS_V901_V1100_PRODUCT_UX_DASHBOARD.html"
    $rows = Get-UAOSGateRows

    $pkgStatus = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $pkgSize   = if ($null -ne $PackageResult) { $PackageResult.size_bytes } else { 0 }
    $pkgEntry  = if ($null -ne $PackageResult) { $PackageResult.entries } else { 0 }

    Write-UAOSText -Path $dashPath -Content @"
<html>
<body style="font-family:sans-serif;background:#101014;color:#eeeeee;padding:30px;">
<h1>UAOS V901-V1100 Product UX + Offline Demo Dashboard</h1>
<p><b>Final Result:</b> $Result</p>
<p><b>Previous Checkpoint:</b> $prevCommit</p>
<p><b>Package Status:</b> $pkgStatus</p>
<p><b>Package Size:</b> $pkgSize bytes</p>
<p><b>Package Entries:</b> $pkgEntry</p>

<h2>Gate Summary</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
<tr><th>Gate</th><th>Status</th></tr>
$rows
</table>

<h2>Phase Scope</h2>
<ul>
<li>Owner UI V7 polish</li>
<li>Evidence consolidation</li>
<li>Offline demo pack</li>
<li>Package inspection</li>
<li>Validator V2</li>
<li>Local QA matrix</li>
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

function Write-UAOSQAMatrix {
    param([string]$Result, $PackageResult)

    $qaJson = Join-Path $runPath "11_local_qa_matrix\UAOS_V901_V1100_LOCAL_QA_MATRIX.json"
    $qaMd   = Join-Path $runPath "11_local_qa_matrix\UAOS_V901_V1100_LOCAL_QA_MATRIX.md"
    $qaHtml = Join-Path $runPath "11_local_qa_matrix\UAOS_V901_V1100_LOCAL_QA_MATRIX.html"

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
# UAOS V901-V1100 Local QA Matrix

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
<h1>UAOS V901-V1100 Local QA Matrix</h1>
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

    $sealPath = Join-Path $runPath "16_seal\UAOS_V901_V1100_FINAL_SEAL.md"

    Write-UAOSText -Path $sealPath -Content @"
# UAOS FINAL SEAL V901-V1100

Result: **$Result**

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Project:
Universal Arranger OS

Previous checkpoint:
$prevCommit

## Phase Scope

V901-V1100 covers:
- Product UX polish
- Owner Setup V7
- Dashboard V2
- Evidence consolidation
- Offline demo pack
- Demo asset index
- Package inspection
- Validator V2
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

## Seal Boundary

This seal covers local research, UX polish, evidence review, offline demo documentation, validator evidence, QA evidence, and package evidence only.

This seal does not approve real writer implementation, keyboard package generation, USB writing, hardware loading, deployment, payment activation, or compatibility claims.
"@
}

function Write-UAOSReport {
    param([string]$Result, $PackageResult, $Validation)

    $report = Join-Path $runPath "13_reports\UAOS_V901_V1100_FINAL_REPORT.md"
    $pkgStatus = if ($null -ne $PackageResult) { $PackageResult.status } else { "PENDING" }
    $valStatus = if ($null -ne $Validation) { $Validation.status } else { "PENDING" }

    Write-UAOSText -Path $report -Content @"
# UAOS V901-V1100 Final Report

Result: **$Result**

Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)  
Validator pass: $($Gates.VALIDATOR_PASS)  
Owner UI V7 exists: $($Gates.OWNER_UI_V7_EXISTS)  
Dashboard exists: $($Gates.DASHBOARD_EXISTS)  
Offline demo exists: $($Gates.OFFLINE_DEMO_EXISTS)  
Evidence index exists: $($Gates.EVIDENCE_INDEX_EXISTS)  
Package inspector exists: $($Gates.PACKAGE_INSPECTOR)  
QA matrix exists: $($Gates.QA_MATRIX_EXISTS)  
Final seal exists: $($Gates.FINAL_SEAL_EXISTS)  
Final package ZIP integrity: $($Gates.ZIP_INTEGRITY)  
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

        git add -- "uaos-ai-factory/RUN_UAOS_V901_V1100_PRODUCT_UX_OFFLINE_DEMO.ps1" "uaos-ai-factory/uaos-v901-v1100-product-ux-offline-demo" | Out-Null

        git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            $head = (git rev-parse --short HEAD).Trim()
            Pop-Location
            return "NO_NEW_COMMIT_CURRENT_HEAD_$head"
        }

        git commit -m "UAOS V901-V1100 Product UX Offline Demo [$Result]" | Out-Null

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

Write-Host "--- UAOS V901-V1100 PRODUCT UX OFFLINE DEMO START ---" -ForegroundColor Cyan

if (Test-Path $runPath) {
    Remove-Item $runPath -Recurse -Force
}

New-UAOSDir $runPath

foreach ($d in $Dirs) {
    New-UAOSDir (Join-Path $runPath $d)
}

Write-UAOSText -Path (Join-Path $runPath "15_logs\RUN_START.txt") -Content @"
UAOS V901-V1100 started.
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Run path: $runPath
Previous checkpoint: $prevCommit
"@

Write-Host "[V901-V920] Checking V701-V900 checkpoint..." -ForegroundColor Yellow

$prevFiles = @(
    "04_owner_ui_stabilization\UAOS_OWNER_SETUP_V6_HOME.html",
    "05_dashboard_stabilization\UAOS_V701_V900_STABILIZATION_DASHBOARD.html",
    "10_local_qa_matrix\UAOS_V701_V900_LOCAL_QA_MATRIX.html",
    "13_final_package\UAOS_V701_V900_STABILIZATION_PACKAGE.zip",
    "15_seal\UAOS_V701_V900_FINAL_SEAL.md",
    "12_reports\UAOS_V701_V900_FINAL_REPORT.md"
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

Write-UAOSJson -Path (Join-Path $runPath "02_previous_checkpoint_import\UAOS_V901_V1100_PREVIOUS_CHECKPOINT_IMPORT.json") -Data ([ordered]@{
    status = $importStatus
    previous_commit = $prevCommit
    previous_run_path = $prevRunPath
    checked_files = $prevChecks
    missing_files = $missing
    checked_at = Get-Date -Format "o"
})

$importMd = "# UAOS V901-V1100 Previous Checkpoint Import`n`nStatus: **$importStatus**`n`nPrevious commit: $prevCommit`n`n"
foreach ($c in $prevChecks) {
    $importMd += "- $($c.file): $($c.exists)`n"
}
Write-UAOSText -Path (Join-Path $runPath "02_previous_checkpoint_import\UAOS_V901_V1100_PREVIOUS_CHECKPOINT_IMPORT.md") -Content $importMd

Write-Host "[V921-V1080] Creating UX, evidence, and offline demo artifacts..." -ForegroundColor Yellow

Write-UAOSText -Path (Join-Path $runPath "00_launcher\UAOS_V901_V1100_LAUNCHER.txt") -Content @"
UAOS V901-V1100 launcher.
Local UX polish, evidence consolidation, and offline demo pack only.
No keyboard package output.
No USB write.
No hardware load.
No deploy.
No payment.
No compatibility claims.
"@

Write-UAOSJson -Path (Join-Path $runPath "01_agent_plan\UAOS_V901_V1100_AGENT_PLAN.json") -Data ([ordered]@{
    run = "V901-V1100"
    goal = "product_ux_polish_evidence_consolidation_offline_demo"
    previous_commit = $prevCommit
    safety = $Safety
    batches = @(
        "V901-V920 Previous Checkpoint Import",
        "V921-V940 Product UX Polish",
        "V941-V960 Owner Setup V7",
        "V961-V980 Dashboard V2",
        "V981-V1000 Evidence Consolidation",
        "V1001-V1020 Offline Demo Pack",
        "V1021-V1040 Demo Assets",
        "V1041-V1060 Validator V2",
        "V1061-V1080 Package Inspector",
        "V1081-V1100 Final QA Package Seal"
    )
})

Write-UAOSText -Path (Join-Path $runPath "01_agent_plan\UAOS_V901_V1100_AGENT_PLAN.md") -Content @"
# UAOS V901-V1100 Agent Plan

Goal:
Product UX polish, evidence consolidation, and offline demo pack.

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

Write-UAOSJson -Path (Join-Path $runPath "03_product_ux_polish\UAOS_PRODUCT_UX_POLISH_PLAN.json") -Data ([ordered]@{
    phase = "V901-V1100"
    owner_ui_version = "V7"
    dashboard_version = "V2"
    offline_demo = "YES"
    improvements = @(
        "clearer owner navigation",
        "local-only demo flow",
        "evidence-first layout",
        "QA status panel",
        "safety lock panel",
        "package links panel"
    )
    safety = $Safety
})

Write-UAOSText -Path (Join-Path $runPath "03_product_ux_polish\UAOS_PRODUCT_UX_POLISH_PLAN.md") -Content @"
# UAOS Product UX Polish Plan

Focus:
- Cleaner owner navigation.
- Better local QA visibility.
- Consolidated evidence access.
- Offline demo index.
- Safety lock visibility.
- Package review flow.

Boundaries:
- Local only.
- Review only.
- No hardware actions.
- No package generation for target devices.
- No deployment.
- No payment.
"@

$uiPath = Join-Path $runPath "04_owner_setup_v7\UAOS_OWNER_SETUP_V7_HOME.html"

Write-UAOSText -Path $uiPath -Content @"
<html>
<body style="font-family:sans-serif;background:#181820;color:#f2f2f2;padding:40px;">
<h1>UAOS Owner Setup V7</h1>
<h2>Product UX Polish + Offline Demo Pack</h2>

<div style="border:1px solid #555;padding:20px;margin-bottom:20px;">
<h3>Status</h3>
<p><b>Phase:</b> V901-V1100</p>
<p><b>Previous checkpoint:</b> $prevCommit</p>
<p><b>Mode:</b> Local review and offline demo</p>
</div>

<div style="border:1px solid #555;padding:20px;margin-bottom:20px;">
<h3>Open Local Artifacts</h3>
<ul>
<li><a href="../05_dashboard_v2/UAOS_V901_V1100_PRODUCT_UX_DASHBOARD.html" style="color:cyan;">Dashboard V2</a></li>
<li><a href="../07_offline_demo_pack/UAOS_OFFLINE_DEMO_INDEX.html" style="color:cyan;">Offline Demo Index</a></li>
<li><a href="../06_evidence_consolidation/UAOS_MASTER_EVIDENCE_INDEX.html" style="color:cyan;">Master Evidence Index</a></li>
<li><a href="../09_validator_v2/UAOS_V901_V1100_VALIDATOR_SUMMARY.html" style="color:cyan;">Validator V2 Summary</a></li>
<li><a href="../10_package_inspector/UAOS_V901_V1100_PACKAGE_INSPECTOR.html" style="color:cyan;">Package Inspector</a></li>
<li><a href="../11_local_qa_matrix/UAOS_V901_V1100_LOCAL_QA_MATRIX.html" style="color:cyan;">Local QA Matrix</a></li>
<li><a href="../16_seal/UAOS_V901_V1100_FINAL_SEAL.md" style="color:cyan;">Final Seal</a></li>
</ul>
</div>

<div style="border:1px solid #555;padding:20px;">
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
</div>
</body>
</html>
"@

$evidenceIndexJson = Join-Path $runPath "06_evidence_consolidation\UAOS_MASTER_EVIDENCE_INDEX.json"
$evidenceIndexMd   = Join-Path $runPath "06_evidence_consolidation\UAOS_MASTER_EVIDENCE_INDEX.md"
$evidenceIndexHtml = Join-Path $runPath "06_evidence_consolidation\UAOS_MASTER_EVIDENCE_INDEX.html"

$evidence = [ordered]@{
    phase = "V901-V1100"
    previous_checkpoint = [ordered]@{
        run = "V701-V900"
        commit = $prevCommit
        path = $prevRunPath
        imported = $importStatus
    }
    current_artifacts = [ordered]@{
        owner_ui_v7 = "04_owner_setup_v7/UAOS_OWNER_SETUP_V7_HOME.html"
        dashboard_v2 = "05_dashboard_v2/UAOS_V901_V1100_PRODUCT_UX_DASHBOARD.html"
        offline_demo_index = "07_offline_demo_pack/UAOS_OFFLINE_DEMO_INDEX.html"
        validator_v2 = "09_validator_v2/UAOS_V901_V1100_VALIDATOR_SUMMARY.html"
        package_inspector = "10_package_inspector/UAOS_V901_V1100_PACKAGE_INSPECTOR.html"
        local_qa_matrix = "11_local_qa_matrix/UAOS_V901_V1100_LOCAL_QA_MATRIX.html"
        final_seal = "16_seal/UAOS_V901_V1100_FINAL_SEAL.md"
    }
    safety = $Safety
}
Write-UAOSJson -Path $evidenceIndexJson -Data $evidence

Write-UAOSText -Path $evidenceIndexMd -Content @"
# UAOS Master Evidence Index V901-V1100

Previous checkpoint:
- V701-V900
- Commit: $prevCommit
- Import status: $importStatus

Current evidence:
- Owner UI V7
- Dashboard V2
- Offline demo index
- Validator V2
- Package inspector
- Local QA matrix
- Final report
- Final seal

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

Write-UAOSText -Path $evidenceIndexHtml -Content @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS Master Evidence Index V901-V1100</h1>
<p><b>Previous checkpoint:</b> $prevCommit</p>
<p><b>Import status:</b> $importStatus</p>
<h2>Evidence</h2>
<ul>
<li>Owner UI V7</li>
<li>Dashboard V2</li>
<li>Offline demo index</li>
<li>Validator V2</li>
<li>Package inspector</li>
<li>Local QA matrix</li>
<li>Final report</li>
<li>Final seal</li>
</ul>
</body>
</html>
"@

$demoIndex = Join-Path $runPath "07_offline_demo_pack\UAOS_OFFLINE_DEMO_INDEX.html"

Write-UAOSText -Path $demoIndex -Content @"
<html>
<body style="font-family:sans-serif;background:#0f1117;color:#eeeeee;padding:40px;">
<h1>UAOS Offline Demo Pack</h1>
<p>This demo is local-only and evidence-only.</p>

<h2>Demo Flow</h2>
<ol>
<li>Open Owner Setup V7.</li>
<li>Review the Dashboard V2.</li>
<li>Open the Master Evidence Index.</li>
<li>Review generic metadata examples.</li>
<li>Review Validator V2.</li>
<li>Review Package Inspector.</li>
<li>Review Final Seal.</li>
</ol>

<h2>Links</h2>
<ul>
<li><a href="../04_owner_setup_v7/UAOS_OWNER_SETUP_V7_HOME.html" style="color:cyan;">Owner Setup V7</a></li>
<li><a href="../05_dashboard_v2/UAOS_V901_V1100_PRODUCT_UX_DASHBOARD.html" style="color:cyan;">Dashboard V2</a></li>
<li><a href="../06_evidence_consolidation/UAOS_MASTER_EVIDENCE_INDEX.html" style="color:cyan;">Master Evidence Index</a></li>
<li><a href="../08_demo_assets/UAOS_DEMO_ASSET_INDEX.html" style="color:cyan;">Demo Asset Index</a></li>
</ul>

<h2>Safety</h2>
<ul>
<li>writer_ready: false</li>
<li>keyboard_package_output_generated: NO</li>
<li>USB write: NO</li>
<li>Hardware load: NO</li>
<li>Deploy: NO</li>
<li>Payment: NO</li>
</ul>
</body>
</html>
"@

Write-UAOSText -Path (Join-Path $runPath "07_offline_demo_pack\UAOS_OFFLINE_DEMO_SCRIPT.md") -Content @"
# UAOS Offline Demo Script

1. Start with Owner Setup V7.
2. Show the phase status.
3. Open the Dashboard V2.
4. Open the Evidence Index.
5. Show the generic metadata examples.
6. Show the Validator V2 output.
7. Show the Package Inspector output.
8. End with the Final Seal.

This is an offline local demo only.
"@

Write-UAOSText -Path (Join-Path $runPath "07_offline_demo_pack\UAOS_OFFLINE_DEMO_CHECKLIST.csv") -Content @"
step,item,status
1,Owner Setup V7,READY
2,Dashboard V2,READY
3,Evidence Index,READY
4,Generic Metadata Examples,READY
5,Validator V2,READY
6,Package Inspector,READY
7,Final Seal,READY
"@

Write-UAOSJson -Path (Join-Path $runPath "08_demo_assets\UAOS_DEMO_STATE.json") -Data ([ordered]@{
    demo = "UAOS_OFFLINE_DEMO"
    phase = "V901-V1100"
    state = "LOCAL_ONLY"
    safety = $Safety
    sample_cards = @(
        [ordered]@{ id = "card_owner_ui"; label = "Owner Setup V7"; status = "READY" },
        [ordered]@{ id = "card_dashboard"; label = "Dashboard V2"; status = "READY" },
        [ordered]@{ id = "card_evidence"; label = "Evidence Index"; status = "READY" },
        [ordered]@{ id = "card_validator"; label = "Validator V2"; status = "READY" }
    )
})

Write-UAOSText -Path (Join-Path $runPath "08_demo_assets\UAOS_DEMO_ASSET_INDEX.html") -Content @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS Demo Asset Index</h1>
<ul>
<li>UAOS_DEMO_STATE.json</li>
<li>Offline Demo Script</li>
<li>Offline Demo Checklist</li>
<li>Generic metadata examples from previous stabilization phase references</li>
</ul>
<p>All demo assets are local review assets only.</p>
</body>
</html>
"@

Write-UAOSJson -Path (Join-Path $runPath "12_safety_evidence\UAOS_V901_V1100_SAFETY_EVIDENCE.json") -Data $Safety

Write-UAOSText -Path (Join-Path $runPath "12_safety_evidence\UAOS_V901_V1100_SAFETY_EVIDENCE.md") -Content @"
# UAOS V901-V1100 Safety Evidence

- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- PA3X load: NO
- Deploy: NO
- Payment: NO
- Brand/device compatibility claims: NO

All artifacts are local UX, local evidence, offline demo, validator, package, QA, report, or seal files only.
"@

Write-UAOSText -Path (Join-Path $runPath "12_safety_evidence\UAOS_V901_V1100_SAFETY_EVIDENCE.html") -Content @"
<html>
<body style="font-family:sans-serif;padding:30px;">
<h1>UAOS V901-V1100 Safety Evidence</h1>
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

Write-Host "[V1081-V1100] Validating, packaging, sealing..." -ForegroundColor Yellow

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

$dashPath = Join-Path $runPath "05_dashboard_v2\UAOS_V901_V1100_PRODUCT_UX_DASHBOARD.html"
$qaJson = Join-Path $runPath "11_local_qa_matrix\UAOS_V901_V1100_LOCAL_QA_MATRIX.json"
$qaMd   = Join-Path $runPath "11_local_qa_matrix\UAOS_V901_V1100_LOCAL_QA_MATRIX.md"
$qaHtml = Join-Path $runPath "11_local_qa_matrix\UAOS_V901_V1100_LOCAL_QA_MATRIX.html"
$sealPath = Join-Path $runPath "16_seal\UAOS_V901_V1100_FINAL_SEAL.md"
$packageInspectorJson = Join-Path $runPath "10_package_inspector\UAOS_V901_V1100_PACKAGE_INSPECTOR.json"
$packageInspectorMd   = Join-Path $runPath "10_package_inspector\UAOS_V901_V1100_PACKAGE_INSPECTOR.md"
$packageInspectorHtml = Join-Path $runPath "10_package_inspector\UAOS_V901_V1100_PACKAGE_INSPECTOR.html"

$Gates.OWNER_UI_V7_EXISTS = Test-Path $uiPath
$Gates.OFFLINE_DEMO_EXISTS = Test-Path $demoIndex
$Gates.EVIDENCE_INDEX_EXISTS = ((Test-Path $evidenceIndexJson) -and (Test-Path $evidenceIndexMd) -and (Test-Path $evidenceIndexHtml))

Write-UAOSDashboard -Result "PENDING" -PackageResult $packageResult
$Gates.DASHBOARD_EXISTS = Test-Path $dashPath

Write-UAOSQAMatrix -Result "PENDING" -PackageResult $packageResult
$Gates.QA_MATRIX_EXISTS = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))

Write-UAOSSeal -Result "PENDING"
$Gates.FINAL_SEAL_EXISTS = Test-Path $sealPath

Write-UAOSReport -Result "PENDING" -PackageResult $packageResult -Validation $validation

$packageResult = New-UAOSPackage
Write-UAOSPackageInspector -PackageResult $packageResult
$Gates.PACKAGE_INSPECTOR = ((Test-Path $packageInspectorJson) -and (Test-Path $packageInspectorMd) -and (Test-Path $packageInspectorHtml))

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

    $Gates.OWNER_UI_V7_EXISTS = Test-Path $uiPath
    $Gates.DASHBOARD_EXISTS = Test-Path $dashPath
    $Gates.OFFLINE_DEMO_EXISTS = Test-Path $demoIndex
    $Gates.EVIDENCE_INDEX_EXISTS = ((Test-Path $evidenceIndexJson) -and (Test-Path $evidenceIndexMd) -and (Test-Path $evidenceIndexHtml))
    $Gates.PACKAGE_INSPECTOR = ((Test-Path $packageInspectorJson) -and (Test-Path $packageInspectorMd) -and (Test-Path $packageInspectorHtml))
    $Gates.QA_MATRIX_EXISTS = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))
    $Gates.FINAL_SEAL_EXISTS = Test-Path $sealPath

    $FinalResult = Get-UAOSOverall

    Write-UAOSDashboard -Result $FinalResult -PackageResult $packageResult
    Write-UAOSQAMatrix -Result $FinalResult -PackageResult $packageResult
    Write-UAOSSeal -Result $FinalResult
    Write-UAOSReport -Result $FinalResult -PackageResult $packageResult -Validation $validation

    $packageResult = New-UAOSPackage
    Write-UAOSPackageInspector -PackageResult $packageResult
    $Gates.PACKAGE_INSPECTOR = ((Test-Path $packageInspectorJson) -and (Test-Path $packageInspectorMd) -and (Test-Path $packageInspectorHtml))

    $packageResult = New-UAOSPackage
    $Gates.ZIP_INTEGRITY = ($packageResult.status -eq "PASS")
}

$validation = Invoke-UAOSValidator -TargetPath $runPath -IncludePackageFolder
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

$Gates.OWNER_UI_V7_EXISTS = Test-Path $uiPath
$Gates.DASHBOARD_EXISTS = Test-Path $dashPath
$Gates.OFFLINE_DEMO_EXISTS = Test-Path $demoIndex
$Gates.EVIDENCE_INDEX_EXISTS = ((Test-Path $evidenceIndexJson) -and (Test-Path $evidenceIndexMd) -and (Test-Path $evidenceIndexHtml))
$Gates.PACKAGE_INSPECTOR = ((Test-Path $packageInspectorJson) -and (Test-Path $packageInspectorMd) -and (Test-Path $packageInspectorHtml))
$Gates.QA_MATRIX_EXISTS = ((Test-Path $qaJson) -and (Test-Path $qaMd) -and (Test-Path $qaHtml))
$Gates.FINAL_SEAL_EXISTS = Test-Path $sealPath
$Gates.ZIP_INTEGRITY = ($packageResult.status -eq "PASS")

$FinalResult = Get-UAOSOverall

Write-UAOSValidatorReports -Validation $validation
Write-UAOSDashboard -Result $FinalResult -PackageResult $packageResult
Write-UAOSQAMatrix -Result $FinalResult -PackageResult $packageResult
Write-UAOSSeal -Result $FinalResult
Write-UAOSReport -Result $FinalResult -PackageResult $packageResult -Validation $validation

$packageResult = New-UAOSPackage
Write-UAOSPackageInspector -PackageResult $packageResult
$packageResult = New-UAOSPackage
$Gates.ZIP_INTEGRITY = ($packageResult.status -eq "PASS")
$FinalResult = Get-UAOSOverall

Write-UAOSText -Path (Join-Path $runPath "15_logs\RUN_COMPLETE.txt") -Content @"
UAOS V901-V1100 complete.
Result: $FinalResult
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Validator: $($validation.status)
Package: $($packageResult.status)
"@

$actualCommit = Invoke-UAOSCommit -Result $FinalResult

$zipOut = Join-Path $runPath "14_final_package\UAOS_V901_V1100_PRODUCT_UX_OFFLINE_DEMO_PACKAGE.zip"
$reportPath = Join-Path $runPath "13_reports\UAOS_V901_V1100_FINAL_REPORT.md"

$color = if ($FinalResult -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V901-V1100 Product UX Offline Demo: $FinalResult " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)"
Write-Host "Validator Status:             $($validation.status)"
Write-Host "Owner UI V7 ready:            $($Gates.OWNER_UI_V7_EXISTS)"
Write-Host "Dashboard created:            $($Gates.DASHBOARD_EXISTS)"
Write-Host "Offline demo exists:          $($Gates.OFFLINE_DEMO_EXISTS)"
Write-Host "Evidence index exists:        $($Gates.EVIDENCE_INDEX_EXISTS)"
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
Write-Host "Owner UI V7: $uiPath"
Write-Host "Dashboard: $dashPath"
Write-Host "Offline Demo: $demoIndex"
Write-Host "Evidence Index: $evidenceIndexHtml"
Write-Host "QA Matrix: $qaHtml"
Write-Host "ZIP: $zipOut"
Write-Host "Seal: $sealPath"
Write-Host "Report: $reportPath"
Write-Host "==============================================="
Write-Host ""

if ($FinalResult -ne "PASS") {
    exit 1
}
