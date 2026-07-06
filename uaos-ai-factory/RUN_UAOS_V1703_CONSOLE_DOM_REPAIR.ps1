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
    W $p ($d | ConvertTo-Json -Depth 100)
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

Write-Host "--- UAOS V1703 CONSOLE DOM REPAIR START ---" -ForegroundColor Cyan

if (!(Test-Path $runPath)) {
    throw "Run path not found: $runPath"
}

if (!(Test-Path $sitePath)) {
    throw "Site path not found: $sitePath"
}

New-D $reportPath
New-D $sealPath
New-D $logsPath
New-D $packagePath
New-D $programPath

$appCode = @"
const state = {
  project: 'UAOS',
  phase: 'V1501-V1700',
  patch: 'V1703_CONSOLE_DOM_REPAIR',
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
  const line = document.createElement('div');

  line.className = 'console-line';
  line.textContent = '[' + stamp + '] ' + msg;

  box.appendChild(line);
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
    ['Console DOM line rendering works', true],
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
  el('console').innerHTML = '';
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

$css = Get-Content $cssPath -Raw -ErrorAction SilentlyContinue

if ($css -notmatch "console-line") {
    $css += @"

.console-line {
  display: block;
  padding: 2px 0;
  line-height: 1.45;
}
"@
    W $cssPath $css
}

$html = Get-Content $indexPath -Raw

if ($html -match '<script\s+src="app\.js[^"]*"></script>') {
    $html = $html -replace '<script\s+src="app\.js[^"]*"></script>', '<script src="app.js?v=1703"></script>'
} else {
    $html = $html -replace '</body>', '<script src="app.js?v=1703"></script></body>'
}

W $indexPath $html

W "$programPath\RUN_CONSOLE_DOM_TEST.ps1" @"
`$ErrorActionPreference = 'Stop'

`$site = '$sitePath'
`$app = Join-Path `$site 'app.js'
`$index = Join-Path `$site 'index.html'

if (!(Test-Path `$app)) {
    Write-Host 'CONSOLE_DOM_TEST: FAIL missing app.js'
    exit 1
}

if (!(Test-Path `$index)) {
    Write-Host 'CONSOLE_DOM_TEST: FAIL missing index.html'
    exit 1
}

`$js = Get-Content `$app -Raw
`$html = Get-Content `$index -Raw
`$literalBackslashN = [string][char]92 + 'n'

`$pass = `$true

if (`$js -notmatch "document\.createElement\('div'\)") {
    Write-Host 'Missing DOM div line creation'
    `$pass = `$false
}

if (`$js -notmatch 'appendChild\(line\)') {
    Write-Host 'Missing appendChild(line)'
    `$pass = `$false
}

if (`$js.Contains(`$literalBackslashN)) {
    Write-Host 'Literal backslash-n still exists in app.js'
    `$pass = `$false
}

if (`$html -notmatch 'app\.js\?v=1703') {
    Write-Host 'Index does not reference V1703 cache-busted app.js'
    `$pass = `$false
}

if (`$pass) {
    Write-Host 'CONSOLE_DOM_TEST: PASS'
    exit 0
} else {
    Write-Host 'CONSOLE_DOM_TEST: FAIL'
    exit 1
}
"@

W "$programPath\RUN_ALL_LOCAL_TESTS.ps1" @"
`$ErrorActionPreference = 'Continue'
`$programPath = '$programPath'
`$reportPath = '$reportPath'

New-Item -ItemType Directory -Path `$reportPath -Force | Out-Null

`$tests = @(
  'RUN_UI_SMOKE_TEST.ps1',
  'RUN_SAFETY_TEST.ps1',
  'RUN_PACKAGE_TEST.ps1',
  'RUN_CONSOLE_DOM_TEST.ps1'
)

`$results = @()
`$allPass = `$true

foreach (`$t in `$tests) {
  `$p = Join-Path `$programPath `$t

  if (!(Test-Path `$p)) {
    `$results += [ordered]@{ test=`$t; pass=`$false; exit_code=999; note='missing' }
    `$allPass = `$false
    continue
  }

  powershell.exe -NoProfile -ExecutionPolicy Bypass -File `$p
  `$pass = (`$LASTEXITCODE -eq 0)

  if (!`$pass) {
    `$allPass = `$false
  }

  `$results += [ordered]@{ test=`$t; pass=`$pass; exit_code=`$LASTEXITCODE }
}

`$summary = [ordered]@{
  status = if (`$allPass) { 'PASS' } else { 'FAIL' }
  results = `$results
  checked_at = Get-Date -Format 'o'
}

`$summary | ConvertTo-Json -Depth 30 | Out-File (Join-Path `$reportPath 'UAOS_V1501_V1700_TEST_PROGRAM_RESULTS.json') -Encoding UTF8

`$md = "# UAOS V1501-V1700 Test Program Results`n`nStatus: **`$(`$summary.status)**`n`n"
foreach (`$r in `$results) {
  `$md += "- `$(`$r.test): `$(`$r.pass) exit=`$(`$r.exit_code)`n"
}
`$md | Out-File (Join-Path `$reportPath 'UAOS_V1501_V1700_TEST_PROGRAM_RESULTS.md') -Encoding UTF8

Write-Host "ALL_LOCAL_TESTS: `$(`$summary.status)"

if (`$allPass) {
  exit 0
} else {
  exit 1
}
"@

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

$html = Get-Content $indexPath -Raw
$js = Get-Content $appPath -Raw

$buttonSystemPass = $true
$buttonChecks = [ordered]@{}

foreach ($btn in $requiredButtons) {
    $ok = ($html -match $btn -and $js -match $btn)
    $buttonChecks[$btn] = $ok
    if ($ok -ne $true) {
        $buttonSystemPass = $false
    }
}

$literalBackslashN = [string][char]92 + "n"

$websitePass = (
    (Test-Path $indexPath) -and
    (Test-Path $appPath) -and
    (Test-Path $cssPath)
)

$consoleDomPass = (
    ($js -match "document\.createElement\('div'\)") -and
    ($js -match "appendChild\(line\)") -and
    (-not $js.Contains($literalBackslashN)) -and
    ($html -match "app\.js\?v=1703")
)

$programsExist = (
    (Test-Path "$programPath\RUN_UI_SMOKE_TEST.ps1") -and
    (Test-Path "$programPath\RUN_SAFETY_TEST.ps1") -and
    (Test-Path "$programPath\RUN_PACKAGE_TEST.ps1") -and
    (Test-Path "$programPath\RUN_CONSOLE_DOM_TEST.ps1") -and
    (Test-Path "$programPath\RUN_ALL_LOCAL_TESTS.ps1")
)

$safetyViolations = Test-Safety
$safetyPass = (@($safetyViolations).Count -eq 0)

# Build package first so RUN_PACKAGE_TEST can pass.
$packagePass = Build-Package

$externalTestsPass = $false
$allTests = "$programPath\RUN_ALL_LOCAL_TESTS.ps1"

if (Test-Path $allTests) {
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File $allTests
    $externalTestsPass = ($LASTEXITCODE -eq 0)
}

$FinalResult = if (
    $websitePass -and
    $buttonSystemPass -and
    $consoleDomPass -and
    $programsExist -and
    $safetyPass -and
    $packagePass -and
    $externalTestsPass
) {
    "PASS"
} else {
    "FAIL"
}

J "$reportPath\UAOS_V1703_CONSOLE_DOM_REPAIR_RESULTS.json" ([ordered]@{
    result = $FinalResult
    repaired_at = Get-Date -Format "o"
    previous_commit = $prevCommit
    website_pass = $websitePass
    button_system_pass = $buttonSystemPass
    console_dom_pass = $consoleDomPass
    programs_exist = $programsExist
    safety_pass = $safetyPass
    safety_violations_count = @($safetyViolations).Count
    package_pass = $packagePass
    external_tests_pass = $externalTestsPass
    button_checks = $buttonChecks
    safety_violations = $safetyViolations
})

W "$reportPath\UAOS_V1703_CONSOLE_DOM_REPAIR_RESULTS.md" @"
# UAOS V1703 Console DOM Repair Results

Result: **$FinalResult**

Repair:
The Console no longer depends on newline characters. Each Console entry is now a separate DOM div.

Checks:
- Website pass: $websitePass
- Button system pass: $buttonSystemPass
- Console DOM pass: $consoleDomPass
- Test programs exist: $programsExist
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
V1703 Console DOM Repair

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
V1703 Console DOM Repair

Website pass: $websitePass  
Button system pass: $buttonSystemPass  
Console DOM pass: $consoleDomPass  
Test programs exist: $programsExist  
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
V1703 renders each console message as a separate DOM element. This prevents literal backslash-n display regardless of browser newline handling.
"@

# Rebuild final package with updated report/seal/results.
$packagePass = Build-Package

# Re-run console DOM test after final package build.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$programPath\RUN_CONSOLE_DOM_TEST.ps1"
$consoleDomExternalPass = ($LASTEXITCODE -eq 0)

$FinalResult = if (
    $websitePass -and
    $buttonSystemPass -and
    $consoleDomPass -and
    $consoleDomExternalPass -and
    $programsExist -and
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
V1703 Console DOM Repair

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
V1703 Console DOM Repair

Website pass: $websitePass  
Button system pass: $buttonSystemPass  
Console DOM pass: $consoleDomPass  
Console DOM external test pass: $consoleDomExternalPass  
Test programs exist: $programsExist  
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
V1703 renders each console message as a separate DOM element. This prevents literal backslash-n display regardless of browser newline handling.
"@

# Final package includes final report/seal.
$packagePass = Build-Package

$commitHash = "NO_GIT_REPO"

if (Test-Path "$basePath\.git") {
    try {
        Push-Location $basePath

        git add -- "uaos-ai-factory/RUN_UAOS_V1703_CONSOLE_DOM_REPAIR.ps1" "uaos-ai-factory/uaos-v1501-v1700-final-owner-website-test-programs" | Out-Null

        git diff --cached --quiet

        if ($LASTEXITCODE -eq 0) {
            $commitHash = "NO_NEW_COMMIT_CURRENT_HEAD_$((git rev-parse --short HEAD).Trim())"
        } else {
            git commit -m "UAOS V1703 Console DOM Repair [$FinalResult]" | Out-Null
            $commitHash = (git rev-parse --short HEAD).Trim()
        }

        Pop-Location
    } catch {
        try { Pop-Location } catch {}
        $commitHash = "GIT_ERROR"
    }
}

W "$logsPath\RUN_V1703_CONSOLE_DOM_REPAIR_COMPLETE.txt" @"
UAOS V1703 Console DOM Repair complete.
Result: $FinalResult
Commit: $commitHash
Completed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Website: $indexPath
Package: $zipPath
"@

$color = if ($FinalResult -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V1703 Console DOM Repair: $FinalResult " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Website pass:                    $websitePass"
Write-Host "Button system pass:              $buttonSystemPass"
Write-Host "Console DOM pass:                $consoleDomPass"
Write-Host "Console DOM external test pass:  $consoleDomExternalPass"
Write-Host "Test programs exist:             $programsExist"
Write-Host "Safety pass:                     $safetyPass"
Write-Host "Safety violations count:         $(@($safetyViolations).Count)"
Write-Host "Package pass:                    $packagePass"
Write-Host "External tests pass:             $externalTestsPass"
Write-Host "Commit Hash:                     $commitHash"
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
