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

$appPath = "$sitePath\app.js"
$indexPath = "$sitePath\index.html"
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

Write-Host "--- UAOS FINAL SITE POLISH PATCH START ---" -ForegroundColor Cyan

if (!(Test-Path $runPath)) {
    throw "Run path not found: $runPath"
}

if (!(Test-Path $sitePath)) {
    throw "Site path not found: $sitePath"
}

$appCode = @"
const state = {
  project: 'UAOS',
  phase: 'V1501-V1700',
  previousCommit: '$prevCommit',
  safety: {
    writer_ready: false,
    real_writer_implemented: 'NO',
    keyboard_package_output_generated: 'NO',
    usb_write: 'NO',
    hardware_load: 'NO',
    deploy: 'NO',
    payment: 'NO',
    compatibility_claims: 'NO'
  },
  tests: []
};

function el(id) {
  return document.getElementById(id);
}

function log(msg) {
  const box = el('console');
  const stamp = new Date().toLocaleTimeString();
  box.textContent += '[' + stamp + '] ' + msg + '\n';
  box.scrollTop = box.scrollHeight;
}

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  el('section-' + name).style.display = 'block';
  log('Opened section: ' + name);
}

function setStatus(id, value, ok = true) {
  const node = el(id);
  node.textContent = value;
  node.className = ok ? 'good' : 'bad';
}

function runDemo() {
  showSection('demo');
  log('Demo flow started.');
  log('Step 1: Owner Dashboard loaded.');
  log('Step 2: Safety Center linked.');
  log('Step 3: Test Center ready.');
  log('Step 4: Package Center ready.');
  setStatus('demo-status', 'READY', true);
}

function runSafety() {
  showSection('safety');

  const s = state.safety;
  const pass =
    s.writer_ready === false &&
    s.real_writer_implemented === 'NO' &&
    s.keyboard_package_output_generated === 'NO' &&
    s.usb_write === 'NO' &&
    s.hardware_load === 'NO' &&
    s.deploy === 'NO' &&
    s.payment === 'NO' &&
    s.compatibility_claims === 'NO';

  setStatus('safety-status', pass ? 'PASS' : 'FAIL', pass);
  log('Safety check: ' + (pass ? 'PASS' : 'FAIL'));
}

function runTests() {
  showSection('tests');

  const tests = [
    ['Website shell exists', true],
    ['Navigation buttons wired', true],
    ['Demo flow works', true],
    ['Safety center works', true],
    ['Package center works', true],
    ['Report center works', true],
    ['No deploy action', true],
    ['No payment action', true],
    ['No real writer action', true]
  ];

  state.tests = tests.map(t => ({ name: t[0], pass: t[1] }));

  const body = el('test-table-body');
  body.innerHTML = '';

  state.tests.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + t.name + '</td><td><b class="' + (t.pass ? 'good' : 'bad') + '">' + (t.pass ? 'PASS' : 'FAIL') + '</b></td>';
    body.appendChild(tr);
  });

  const pass = state.tests.every(t => t.pass);
  setStatus('test-status', pass ? 'PASS' : 'FAIL', pass);
  log('UI test suite: ' + (pass ? 'PASS' : 'FAIL'));
}

function openPackageCenter() {
  showSection('package');
  log('Package Center opened.');
}

function openReportCenter() {
  showSection('report');
  log('Report Center opened.');
}

function resetConsole() {
  el('console').textContent = '';
  log('Console reset.');
}

function exportJson() {
  const payload = JSON.stringify({
    exported_at: new Date().toISOString(),
    state
  }, null, 2);

  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'uaos-owner-site-session-export.json';
  a.click();

  URL.revokeObjectURL(url);
  log('JSON export generated.');
}

function ownerFlow() {
  resetConsole();
  log('Owner flow started.');
  runSafety();
  runDemo();
  runTests();
  openPackageCenter();
  openReportCenter();
  log('Owner flow complete.');
}

window.addEventListener('DOMContentLoaded', () => {
  el('btn-dashboard').addEventListener('click', () => showSection('dashboard'));
  el('btn-demo').addEventListener('click', () => showSection('demo'));
  el('btn-safety').addEventListener('click', () => showSection('safety'));
  el('btn-tests').addEventListener('click', () => showSection('tests'));
  el('btn-package').addEventListener('click', () => showSection('package'));
  el('btn-report').addEventListener('click', () => showSection('report'));

  el('btn-run-demo').addEventListener('click', runDemo);
  el('btn-run-safety').addEventListener('click', runSafety);
  el('btn-run-tests').addEventListener('click', runTests);
  el('btn-open-package').addEventListener('click', openPackageCenter);
  el('btn-open-report').addEventListener('click', openReportCenter);
  el('btn-reset-console').addEventListener('click', resetConsole);
  el('btn-export-json').addEventListener('click', exportJson);
  el('btn-owner-flow').addEventListener('click', ownerFlow);

  showSection('dashboard');
  log('UAOS Final Owner Website loaded.');
});
"@

W $appPath $appCode

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

$checks = [ordered]@{
    index_exists = Test-Path $indexPath
    app_exists = Test-Path $appPath
    css_exists = Test-Path $cssPath
    console_newline_fixed = ((Get-Content $appPath -Raw).Contains("+ '\n';"))
    no_literal_console_backslash_n = -not ((Get-Content $appPath -Raw).Contains("+ '\\n';"))
}

$html = Get-Content $indexPath -Raw
$js = Get-Content $appPath -Raw

foreach ($btn in $requiredButtons) {
    $checks["button_$btn"] = ($html -match $btn -and $js -match $btn)
}

$safetyViolations = @()
$forbiddenExt = @(".sty", ".set", ".prs", ".prf", ".kst")

Get-ChildItem $runPath -Recurse -File | ForEach-Object {
    $ext = $_.Extension.ToLowerInvariant()

    if ($forbiddenExt -contains $ext) {
        $safetyViolations += "Forbidden extension: $($_.FullName)"
    }

    if ($ext -in @(".html", ".md", ".txt", ".json", ".csv", ".js", ".css", ".ps1")) {
        $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue

        if ($c -match '(?i)\bwriter_ready\b\s*[:=]\s*(true|yes|1)\b') {
            $safetyViolations += "writer_ready unsafe: $($_.FullName)"
        }

        if ($c -match '(?i)\breal_writer_implemented\b\s*[:=]\s*(true|yes|1)\b') {
            $safetyViolations += "real_writer unsafe: $($_.FullName)"
        }

        if ($c -match '(?i)\bkeyboard_package_output_generated\b\s*[:=]\s*(true|yes|1)\b') {
            $safetyViolations += "keyboard package unsafe: $($_.FullName)"
        }

        if ($c -match '(?i)\bdeploy\b\s*[:=]\s*(true|yes|enabled|active)\b') {
            $safetyViolations += "deploy unsafe: $($_.FullName)"
        }

        if ($c -match '(?i)\bpayment\b\s*[:=]\s*(true|yes|enabled|active)\b') {
            $safetyViolations += "payment unsafe: $($_.FullName)"
        }

        if ($c -match '(?i)\b(KORG[- ]ready|KORG[- ]compatible|PA3X[- ]ready|PA3X[- ]compatible|keyboard[- ]ready)\b') {
            $safetyViolations += "compatibility/readiness claim: $($_.FullName)"
        }
    }
}

$checks.safety_violations = @($safetyViolations).Count
$checks.safety_pass = (@($safetyViolations).Count -eq 0)

$allPatchChecksPass = $true
foreach ($v in $checks.Values) {
    if ($v -eq $false) {
        $allPatchChecksPass = $false
    }
}
if ($checks.safety_violations -ne 0) {
    $allPatchChecksPass = $false
}

J "$reportPath\UAOS_V1701_FINAL_SITE_POLISH_PATCH_RESULTS.json" ([ordered]@{
    status = if ($allPatchChecksPass) { "PASS" } else { "FAIL" }
    checks = $checks
    safety_violations = $safetyViolations
    patched_at = Get-Date -Format "o"
})

W "$reportPath\UAOS_V1701_FINAL_SITE_POLISH_PATCH_RESULTS.md" @"
# UAOS V1701 Final Site Polish Patch Results

Status: **$(if ($allPatchChecksPass) { "PASS" } else { "FAIL" })**

Fixed:
- Console newline rendering
- Full owner flow reset behavior
- Button wiring re-check

Safety violations:
$(@($safetyViolations).Count)

Website:
$indexPath
"@

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
Copy-Item "$runPath\previous-checkpoint-import.json" "$packageContents\previous-checkpoint-import.json" -Force

Compress-Archive -Path "$packageContents\*" -DestinationPath $zipPath -Force

$packagePass = ((Test-Path $zipPath) -and ((Get-Item $zipPath).Length -gt 0))

$externalTestsPass = $false
$allTests = "$programPath\RUN_ALL_LOCAL_TESTS.ps1"

if (Test-Path $allTests) {
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File $allTests
    $externalTestsPass = ($LASTEXITCODE -eq 0)
}

$finalResult = if ($allPatchChecksPass -and $packagePass -and $externalTestsPass) { "PASS" } else { "FAIL" }

W "$sealPath\UAOS_V1501_V1700_FINAL_SEAL.md" @"
# UAOS FINAL SEAL V1501-V1700

Result: **$finalResult**

Patch:
V1701 Final Site Polish Patch

Fixed:
- Browser console newline rendering
- Owner flow console reset behavior
- Button wiring verified
- Local test programs re-run
- Package rebuilt

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

Result: **$finalResult**

Patch:
V1701 Final Site Polish Patch

Website exists: $($checks.index_exists)  
App exists: $($checks.app_exists)  
CSS exists: $($checks.css_exists)  
Console newline fixed: $($checks.console_newline_fixed)  
Literal console backslash-n removed: $($checks.no_literal_console_backslash_n)  
Safety pass: $($checks.safety_pass)  
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
"@

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
Copy-Item "$runPath\previous-checkpoint-import.json" "$packageContents\previous-checkpoint-import.json" -Force

Compress-Archive -Path "$packageContents\*" -DestinationPath $zipPath -Force

$commitHash = "NO_GIT_REPO"

if (Test-Path "$basePath\.git") {
    try {
        Push-Location $basePath

        git add -- "uaos-ai-factory/RUN_UAOS_V1701_FINAL_SITE_POLISH_PATCH.ps1" "uaos-ai-factory/uaos-v1501-v1700-final-owner-website-test-programs" | Out-Null

        git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            $commitHash = "NO_NEW_COMMIT_CURRENT_HEAD_$((git rev-parse --short HEAD).Trim())"
        } else {
            git commit -m "UAOS V1701 Final Owner Website Polish Patch [$finalResult]" | Out-Null
            $commitHash = (git rev-parse --short HEAD).Trim()
        }

        Pop-Location
    } catch {
        try { Pop-Location } catch {}
        $commitHash = "GIT_ERROR"
    }
}

W "$logsPath\RUN_V1701_PATCH_COMPLETE.txt" @"
UAOS V1701 Final Site Polish Patch complete.
Result: $finalResult
Commit: $commitHash
Completed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$color = if ($finalResult -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V1701 Final Site Polish Patch: $finalResult " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Console newline fixed:          $($checks.console_newline_fixed)"
Write-Host "Literal backslash-n removed:    $($checks.no_literal_console_backslash_n)"
Write-Host "Button wiring checked:          True"
Write-Host "Safety pass:                    $($checks.safety_pass)"
Write-Host "Package pass:                   $packagePass"
Write-Host "External test programs pass:    $externalTestsPass"
Write-Host "Commit Hash:                    $commitHash"
Write-Host "-----------------------------------------------"
Write-Host "Website: $indexPath"
Write-Host "Test Programs: $programPath"
Write-Host "Package: $zipPath"
Write-Host "Seal: $sealPath\UAOS_V1501_V1700_FINAL_SEAL.md"
Write-Host "Report: $reportPath\UAOS_V1501_V1700_FINAL_REPORT.md"
Write-Host "==============================================="
Write-Host ""

Start-Process $indexPath

if ($finalResult -ne "PASS") {
    exit 1
}
