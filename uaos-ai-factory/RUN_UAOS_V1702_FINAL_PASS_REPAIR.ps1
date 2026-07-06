$ErrorActionPreference = "Stop"

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$basePath = "E:\keyboard-manager-clean"
$factoryPath = "$basePath\uaos-ai-factory"
$runPath = "$factoryPath\uaos-v1501-v1700-final-owner-website-test-programs"
$sitePath = "$runPath\final-owner-site"
$programPath = "$runPath\test-programs"
$reportPath = "$runPath\reports"
$packagePath = "$runPath\final-package"
$sealPath = "$runPath\seal"
$logsPath = "$runPath\logs"
$prevCommit = "62237a78"

$indexPath = "$sitePath\index.html"
$appPath = "$sitePath\app.js"
$cssPath = "$sitePath\style.css"
$zipPath = "$packagePath\UAOS_V1501_V1700_FINAL_OWNER_WEBSITE_TEST_PROGRAMS_PACKAGE.zip"
$packageContents = "$packagePath\contents"

function New-D($p) {
    if (!(Test-Path $p)) {
        New-Item -ItemType Directory -Path $p -Force | Out-Null
    }
}

function W($p, $c) {
    New-D (Split-Path -Parent $p)
    $c | Out-File -FilePath $p -Encoding UTF8
}

function J($p, $d) {
    W $p ($d | ConvertTo-Json -Depth 80)
}

function Build-Package {
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    if (Test-Path $packageContents) {
        Remove-Item $packageContents -Recurse -Force
    }

    New-D $packageContents

    Copy-Item $sitePath "$packageContents\final-owner-site" -Recurse -Force
    Copy-Item $programPath "$packageContents\test-programs" -Recurse -Force
    Copy-Item $reportPath "$packageContents\reports" -Recurse -Force
    Copy-Item $sealPath "$packageContents\seal" -Recurse -Force

    if (Test-Path "$runPath\previous-checkpoint-import.json") {
        Copy-Item "$runPath\previous-checkpoint-import.json" "$packageContents\previous-checkpoint-import.json" -Force
    }

    Compress-Archive -Path "$packageContents\*" -DestinationPath $zipPath -Force

    return ((Test-Path $zipPath) -and ((Get-Item $zipPath).Length -gt 0))
}

function Test-Safety {
    $bad = @()
    $forbiddenExt = @(".sty", ".set", ".prs", ".prf", ".kst")

    Get-ChildItem $runPath -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        $ext = $_.Extension.ToLowerInvariant()

        if ($forbiddenExt -contains $ext) {
            $bad += "Forbidden extension: $($_.FullName)"
        }

        if ($ext -in @(".html", ".md", ".txt", ".json", ".csv", ".js", ".css", ".ps1")) {
            $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue

            if ($c -match '(?i)\bwriter_ready\b\s*[:=]\s*(true|yes|1)\b') {
                $bad += "writer_ready unsafe: $($_.FullName)"
            }

            if ($c -match '(?i)\breal_writer_implemented\b\s*[:=]\s*(true|yes|1)\b') {
                $bad += "real_writer unsafe: $($_.FullName)"
            }

            if ($c -match '(?i)\bkeyboard_package_output_generated\b\s*[:=]\s*(true|yes|1)\b') {
                $bad += "keyboard package unsafe: $($_.FullName)"
            }

            if ($c -match '(?i)\bdeploy\b\s*[:=]\s*(true|yes|enabled|active)\b') {
                $bad += "deploy unsafe: $($_.FullName)"
            }

            if ($c -match '(?i)\bpayment\b\s*[:=]\s*(true|yes|enabled|active)\b') {
                $bad += "payment unsafe: $($_.FullName)"
            }

            if ($c -match '(?i)\b(KORG[- ]ready|KORG[- ]compatible|PA3X[- ]ready|PA3X[- ]compatible|keyboard[- ]ready)\b') {
                $bad += "compatibility/readiness claim: $($_.FullName)"
            }
        }
    }

    return $bad
}

Write-Host "--- UAOS V1702 FINAL PASS REPAIR START ---" -ForegroundColor Cyan

if (!(Test-Path $runPath)) {
    throw "Run path not found: $runPath"
}

New-D $reportPath
New-D $sealPath
New-D $logsPath
New-D $packagePath

$requiredButtons = @(
    "btn-run-demo",
    "btn-run-safety",
    "btn-run-tests",
    "btn-open-package",
    "btn-open-report",
    "btn-reset-console",
    "btn-export-json",
    "btn-owner-flow"
)

$indexExists = Test-Path $indexPath
$appExists = Test-Path $appPath
$cssExists = Test-Path $cssPath
$programsExist = (
    (Test-Path "$programPath\RUN_UI_SMOKE_TEST.ps1") -and
    (Test-Path "$programPath\RUN_SAFETY_TEST.ps1") -and
    (Test-Path "$programPath\RUN_PACKAGE_TEST.ps1") -and
    (Test-Path "$programPath\RUN_ALL_LOCAL_TESTS.ps1")
)

$prevImportExists = Test-Path "$runPath\previous-checkpoint-import.json"

$html = ""
$js = ""

if ($indexExists) {
    $html = Get-Content $indexPath -Raw
}

if ($appExists) {
    $js = Get-Content $appPath -Raw
}

$buttonChecks = [ordered]@{}
$buttonSystemPass = $true

foreach ($btn in $requiredButtons) {
    $ok = ($html -match $btn -and $js -match $btn)
    $buttonChecks[$btn] = $ok

    if ($ok -ne $true) {
        $buttonSystemPass = $false
    }
}

$consoleNewlineFixed = ($js.Contains("+ '\n';"))
$literalBackslashNRemoved = (-not $js.Contains("+ '\\n';"))

$safetyViolations = Test-Safety
$safetyPass = (@($safetyViolations).Count -eq 0)

$websitePass = ($indexExists -and $appExists -and $cssExists)
$sitePolishPass = ($consoleNewlineFixed -and $literalBackslashNRemoved)

# Build preliminary package so package test can run.
$packagePass = Build-Package

$externalTestsPass = $false
$allTests = "$programPath\RUN_ALL_LOCAL_TESTS.ps1"

if (Test-Path $allTests) {
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File $allTests
    $externalTestsPass = ($LASTEXITCODE -eq 0)
}

# Important repair:
# Do not compare every value to $false, because PowerShell treats integer 0 as false.
# Only explicit boolean gates are used here.
$FinalResult = if (
    $prevImportExists -and
    $websitePass -and
    $buttonSystemPass -and
    $programsExist -and
    $sitePolishPass -and
    $safetyPass -and
    $packagePass -and
    $externalTestsPass
) {
    "PASS"
} else {
    "FAIL"
}

$repair = [ordered]@{
    result = $FinalResult
    repaired_at = Get-Date -Format "o"
    previous_commit = $prevCommit
    checks = [ordered]@{
        previous_checkpoint_import_exists = $prevImportExists
        website_pass = $websitePass
        index_exists = $indexExists
        app_exists = $appExists
        css_exists = $cssExists
        button_system_pass = $buttonSystemPass
        test_programs_exist = $programsExist
        console_newline_fixed = $consoleNewlineFixed
        literal_backslash_n_removed = $literalBackslashNRemoved
        safety_pass = $safetyPass
        safety_violations_count = @($safetyViolations).Count
        package_pass = $packagePass
        external_tests_pass = $externalTestsPass
    }
    button_checks = $buttonChecks
    safety_violations = $safetyViolations
}

J "$reportPath\UAOS_V1702_FINAL_PASS_REPAIR_RESULTS.json" $repair

W "$reportPath\UAOS_V1702_FINAL_PASS_REPAIR_RESULTS.md" @"
# UAOS V1702 Final PASS Repair Results

Result: **$FinalResult**

Reason:
V1701 printed FAIL because PowerShell treated the integer value safety_violations = 0 as equivalent to false during broad value comparison.

Repair:
V1702 computes PASS/FAIL from explicit boolean gates only.

## Checks

- Previous checkpoint import exists: $prevImportExists
- Website pass: $websitePass
- Button system pass: $buttonSystemPass
- Test programs exist: $programsExist
- Console newline fixed: $consoleNewlineFixed
- Literal backslash-n removed: $literalBackslashNRemoved
- Safety pass: $safetyPass
- Safety violations count: $(@($safetyViolations).Count)
- Package pass: $packagePass
- External tests pass: $externalTestsPass

Website:
$indexPath
"@

W "$sealPath\UAOS_V1501_V1700_FINAL_SEAL.md" @"
# UAOS FINAL SEAL V1501-V1700

Result: **$FinalResult**

Patch:
V1702 Final PASS Repair

Previous checkpoint:
$prevCommit

Website:
$indexPath

Package:
$zipPath

Safety:
- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- hardware_load: NO
- deploy: NO
- payment: NO
- compatibility_claims: NO

Boundary:
This package is local-only. It does not approve deployment, payment, real writer implementation, target-device package output, USB writing, or hardware loading.
"@

W "$reportPath\UAOS_V1501_V1700_FINAL_REPORT.md" @"
# UAOS V1501-V1700 Final Report

Result: **$FinalResult**

Patch:
V1702 Final PASS Repair

Previous checkpoint import exists: $prevImportExists  
Website pass: $websitePass  
Button system pass: $buttonSystemPass  
Test programs exist: $programsExist  
Console newline fixed: $consoleNewlineFixed  
Literal backslash-n removed: $literalBackslashNRemoved  
Safety pass: $safetyPass  
Safety violations count: $(@($safetyViolations).Count)  
Package pass: $packagePass  
External tests pass: $externalTestsPass  

Website:
$indexPath

Test programs:
$programPath

Package:
$zipPath

Seal:
$sealPath\UAOS_V1501_V1700_FINAL_SEAL.md

Repair note:
V1701 was functionally successful but printed FAIL because integer 0 was compared as false in PowerShell. V1702 fixes that PASS logic.
"@

# Rebuild package after updated report and seal.
$packagePass = Build-Package

# Final recompute after rebuilt package.
$FinalResult = if (
    $prevImportExists -and
    $websitePass -and
    $buttonSystemPass -and
    $programsExist -and
    $sitePolishPass -and
    $safetyPass -and
    $packagePass -and
    $externalTestsPass
) {
    "PASS"
} else {
    "FAIL"
}

W "$sealPath\UAOS_V1501_V1700_FINAL_SEAL.md" @"
# UAOS FINAL SEAL V1501-V1700

Result: **$FinalResult**

Patch:
V1702 Final PASS Repair

Previous checkpoint:
$prevCommit

Website:
$indexPath

Package:
$zipPath

Safety:
- writer_ready: false
- real_writer_implemented: NO
- keyboard_package_output_generated: NO
- USB write: NO
- hardware_load: NO
- deploy: NO
- payment: NO
- compatibility_claims: NO

Boundary:
This package is local-only. It does not approve deployment, payment, real writer implementation, target-device package output, USB writing, or hardware loading.
"@

W "$reportPath\UAOS_V1501_V1700_FINAL_REPORT.md" @"
# UAOS V1501-V1700 Final Report

Result: **$FinalResult**

Patch:
V1702 Final PASS Repair

Previous checkpoint import exists: $prevImportExists  
Website pass: $websitePass  
Button system pass: $buttonSystemPass  
Test programs exist: $programsExist  
Console newline fixed: $consoleNewlineFixed  
Literal backslash-n removed: $literalBackslashNRemoved  
Safety pass: $safetyPass  
Safety violations count: $(@($safetyViolations).Count)  
Package pass: $packagePass  
External tests pass: $externalTestsPass  

Website:
$indexPath

Test programs:
$programPath

Package:
$zipPath

Seal:
$sealPath\UAOS_V1501_V1700_FINAL_SEAL.md

Repair note:
V1701 was functionally successful but printed FAIL because integer 0 was compared as false in PowerShell. V1702 fixes that PASS logic.
"@

# Final package includes final report/seal.
$packagePass = Build-Package

$commitHash = "NO_GIT_REPO"

if (Test-Path "$basePath\.git") {
    try {
        Push-Location $basePath

        git add -- "uaos-ai-factory/RUN_UAOS_V1702_FINAL_PASS_REPAIR.ps1" "uaos-ai-factory/uaos-v1501-v1700-final-owner-website-test-programs" | Out-Null

        git diff --cached --quiet

        if ($LASTEXITCODE -eq 0) {
            $commitHash = "NO_NEW_COMMIT_CURRENT_HEAD_$((git rev-parse --short HEAD).Trim())"
        } else {
            git commit -m "UAOS V1702 Final Owner Website PASS Repair [$FinalResult]" | Out-Null
            $commitHash = (git rev-parse --short HEAD).Trim()
        }

        Pop-Location
    } catch {
        try { Pop-Location } catch {}
        $commitHash = "GIT_ERROR"
    }
}

W "$logsPath\RUN_V1702_PASS_REPAIR_COMPLETE.txt" @"
UAOS V1702 Final PASS Repair complete.
Result: $FinalResult
Commit: $commitHash
Completed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Website: $indexPath
Package: $zipPath
"@

$color = if ($FinalResult -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V1702 Final Owner Website PASS Repair: $FinalResult " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Previous checkpoint import exists: $prevImportExists"
Write-Host "Website pass:                      $websitePass"
Write-Host "Button system pass:                $buttonSystemPass"
Write-Host "Test programs exist:               $programsExist"
Write-Host "Console newline fixed:             $consoleNewlineFixed"
Write-Host "Literal backslash-n removed:       $literalBackslashNRemoved"
Write-Host "Safety pass:                       $safetyPass"
Write-Host "Safety violations count:           $(@($safetyViolations).Count)"
Write-Host "Package pass:                      $packagePass"
Write-Host "External tests pass:               $externalTestsPass"
Write-Host "Commit Hash:                       $commitHash"
Write-Host "-----------------------------------------------"
Write-Host "Website: $indexPath"
Write-Host "Test Programs: $programPath"
Write-Host "Package: $zipPath"
Write-Host "Seal: $sealPath\UAOS_V1501_V1700_FINAL_SEAL.md"
Write-Host "Report: $reportPath\UAOS_V1501_V1700_FINAL_REPORT.md"
Write-Host "==============================================="
Write-Host ""

Start-Process $indexPath

if ($FinalResult -ne "PASS") {
    exit 1
}
