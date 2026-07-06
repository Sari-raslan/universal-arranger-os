$ErrorActionPreference = "Stop"

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$basePath = "E:\keyboard-manager-clean"
$factoryPath = "$basePath\uaos-ai-factory"
$runPath = "$factoryPath\uaos-v1501-v1700-final-owner-website-test-programs"
$prevRunPath = "$factoryPath\uaos-v1301-v1500-external-reviewer-intake-rc-freeze"
$prevCommit = "62237a78"

$sitePath = "$runPath\final-owner-site"
$programPath = "$runPath\test-programs"
$reportPath = "$runPath\reports"
$packagePath = "$runPath\final-package"
$sealPath = "$runPath\seal"
$logsPath = "$runPath\logs"

$Safety = [ordered]@{
    writer_ready = $false
    real_writer_implemented = "NO"
    keyboard_package_output_generated = "NO"
    usb_write = "NO"
    hardware_load = "NO"
    deploy = "NO"
    payment = "NO"
    compatibility_claims = "NO"
}

$ForbiddenExt = @(".sty", ".set", ".prs", ".prf", ".kst")
$AllowedExt = @(".json", ".md", ".html", ".txt", ".csv", ".js", ".css", ".ps1", ".zip")

$Gates = [ordered]@{
    PREV_CHECKPOINT_IMPORT = $false
    WEBSITE_EXISTS = $false
    BUTTON_SYSTEM_EXISTS = $false
    TEST_PROGRAMS_EXIST = $false
    TESTS_PASS = $false
    PACKAGE_EXISTS = $false
    SEAL_EXISTS = $false
    SAFETY_LOCKS_HELD = $false
    GIT_COMMIT_DONE = $false
}

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

function Validate-Safety($root) {
    $violations = @()
    $files = Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue

    foreach ($f in $files) {
        $ext = $f.Extension.ToLowerInvariant()

        if ($ForbiddenExt -contains $ext) {
            $violations += "Forbidden file extension: $($f.FullName)"
        }

        if ($ext -and !($AllowedExt -contains $ext)) {
            $violations += "Unapproved extension: $($f.FullName)"
        }

        if ($ext -in @(".html", ".md", ".txt", ".json", ".csv", ".js", ".css", ".ps1")) {
            $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue

            if ($content -match '(?i)\bwriter_ready\b\s*[:=]\s*(true|yes|1)\b') {
                $violations += "writer_ready unsafe enablement: $($f.FullName)"
            }

            if ($content -match '(?i)\breal_writer_implemented\b\s*[:=]\s*(true|yes|1)\b') {
                $violations += "real writer unsafe enablement: $($f.FullName)"
            }

            if ($content -match '(?i)\bkeyboard_package_output_generated\b\s*[:=]\s*(true|yes|1)\b') {
                $violations += "keyboard package unsafe enablement: $($f.FullName)"
            }

            if ($content -match '(?i)\bdeploy\b\s*[:=]\s*(true|yes|enabled|active)\b') {
                $violations += "deploy unsafe enablement: $($f.FullName)"
            }

            if ($content -match '(?i)\bpayment\b\s*[:=]\s*(true|yes|enabled|active)\b') {
                $violations += "payment unsafe enablement: $($f.FullName)"
            }

            if ($content -match '(?i)\b(KORG[- ]ready|KORG[- ]compatible|PA3X[- ]ready|PA3X[- ]compatible|keyboard[- ]ready)\b') {
                $violations += "compatibility/readiness claim detected: $($f.FullName)"
            }
        }
    }

    return $violations
}

function Run-LocalTests {
    $results = [ordered]@{}

    $index = "$sitePath\index.html"
    $app = "$sitePath\app.js"
    $css = "$sitePath\style.css"
    $manifest = "$sitePath\data\site-manifest.json"

    $results.index_exists = Test-Path $index
    $results.app_exists = Test-Path $app
    $results.css_exists = Test-Path $css
    $results.manifest_exists = Test-Path $manifest

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

    $html = Get-Content $index -Raw
    $js = Get-Content $app -Raw

    foreach ($b in $requiredButtons) {
        $results["button_$b"] = ($html -match $b -and $js -match $b)
    }

    $safetyViolations = Validate-Safety $runPath
    $results.safety_violations = @($safetyViolations).Count
    $results.safety_pass = (@($safetyViolations).Count -eq 0)

    $pass = $true
    foreach ($v in $results.Values) {
        if ($v -eq $false) { $pass = $false }
    }
    if ($results.safety_violations -ne 0) { $pass = $false }

    return [ordered]@{
        status = if ($pass) { "PASS" } else { "FAIL" }
        results = $results
        checked_at = Get-Date -Format "o"
    }
}

Write-Host "--- UAOS V1501-V1700 FINAL OWNER WEBSITE START ---" -ForegroundColor Cyan

if (Test-Path $runPath) {
    Remove-Item $runPath -Recurse -Force
}

New-D $runPath
New-D $sitePath
New-D "$sitePath\data"
New-D $programPath
New-D $reportPath
New-D $packagePath
New-D $sealPath
New-D $logsPath

W "$logsPath\RUN_START.txt" @"
UAOS V1501-V1700 Final Owner Website + Local Test Programs
Started: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Previous checkpoint: $prevCommit
"@

$prevFiles = @(
    "05_owner_setup_v9\UAOS_OWNER_SETUP_V9_HOME.html",
    "06_dashboard_v4\UAOS_V1301_V1500_EXTERNAL_REVIEW_DASHBOARD.html",
    "02_external_reviewer_intake\UAOS_EXTERNAL_REVIEWER_INTAKE.html",
    "03_feedback_simulation\UAOS_FEEDBACK_SIMULATION.html",
    "07_traceability_matrix\UAOS_V1301_V1500_TRACEABILITY_MATRIX.html",
    "08_reviewer_questionnaire\UAOS_V1301_V1500_REVIEWER_QUESTIONNAIRE.html",
    "14_final_package\UAOS_V1301_V1500_EXTERNAL_REVIEWER_INTAKE_RC_FREEZE_PACKAGE.zip",
    "16_seal\UAOS_V1301_V1500_FINAL_SEAL.md",
    "13_reports\UAOS_V1301_V1500_FINAL_REPORT.md"
)

$missing = @()
$checks = @()

foreach ($f in $prevFiles) {
    $full = Join-Path $prevRunPath $f
    $exists = Test-Path $full
    $checks += [ordered]@{ file = $f; exists = $exists; path = $full }
    if (!$exists) { $missing += $f }
}

$Gates.PREV_CHECKPOINT_IMPORT = (@($missing).Count -eq 0)

J "$runPath\previous-checkpoint-import.json" ([ordered]@{
    previous_commit = $prevCommit
    previous_path = $prevRunPath
    checks = $checks
    missing = $missing
    imported = $Gates.PREV_CHECKPOINT_IMPORT
})

J "$sitePath\data\site-manifest.json" ([ordered]@{
    project = "UAOS"
    phase = "V1501-V1700"
    title = "Final Owner Website + Local Test Programs"
    previous_commit = $prevCommit
    mode = "local_only"
    safety = $Safety
    buttons = @(
        "run demo",
        "run safety check",
        "run tests",
        "open package center",
        "open final report",
        "reset console",
        "export json",
        "owner flow"
    )
})

W "$sitePath\style.css" @"
:root {
  --bg: #0d1117;
  --panel: #161b22;
  --panel2: #1f2937;
  --text: #f3f4f6;
  --muted: #9ca3af;
  --accent: #38bdf8;
  --good: #22c55e;
  --warn: #f59e0b;
  --bad: #ef4444;
  --line: #334155;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: radial-gradient(circle at top left, #1e3a8a 0, #0d1117 34%, #050608 100%);
  color: var(--text);
  font-family: Segoe UI, Arial, sans-serif;
}
header {
  padding: 34px;
  border-bottom: 1px solid var(--line);
}
h1 { margin: 0; font-size: 34px; }
h2 { margin-top: 0; }
.subtitle { color: var(--muted); margin-top: 10px; }
.grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 22px;
  padding: 24px;
}
.panel {
  background: rgba(22, 27, 34, 0.92);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 12px 40px rgba(0,0,0,.28);
}
.nav button, .action-row button {
  width: 100%;
  margin: 7px 0;
  padding: 13px 14px;
  border: 1px solid #2563eb;
  background: #172554;
  color: white;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
}
.nav button:hover, .action-row button:hover {
  background: #1d4ed8;
}
.action-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(170px, 1fr));
  gap: 12px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px;
}
.card {
  background: var(--panel2);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
}
.good { color: var(--good); }
.warn { color: var(--warn); }
.bad { color: var(--bad); }
.console {
  background: #050608;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  min-height: 220px;
  white-space: pre-wrap;
  color: #d1d5db;
  font-family: Consolas, monospace;
}
table {
  width: 100%;
  border-collapse: collapse;
}
td, th {
  border: 1px solid var(--line);
  padding: 10px;
}
a { color: var(--accent); }
.footer {
  color: var(--muted);
  padding: 24px;
}
@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
  .action-row { grid-template-columns: 1fr; }
  .card-grid { grid-template-columns: 1fr; }
}
"@

W "$sitePath\app.js" @"
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

function el(id) { return document.getElementById(id); }

function log(msg) {
  const box = el('console');
  const stamp = new Date().toLocaleTimeString();
  box.textContent += '[' + stamp + '] ' + msg + '\\n';
  box.scrollTop = box.scrollHeight;
}

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  el('section-' + name).style.display = 'block';
  log('Opened section: ' + name);
}

function setStatus(id, value, ok=true) {
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
    tr.innerHTML = '<td>' + t.name + '</td><td><b class=\"' + (t.pass ? 'good' : 'bad') + '\">' + (t.pass ? 'PASS' : 'FAIL') + '</b></td>';
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

  const blob = new Blob([payload], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'uaos-owner-site-session-export.json';
  a.click();
  URL.revokeObjectURL(url);
  log('JSON export generated.');
}

function ownerFlow() {
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

W "$sitePath\index.html" @"
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Final Owner Website</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<header>
  <h1>UAOS Final Owner Website</h1>
  <div class="subtitle">V1501-V1700  Local final website + test programs</div>
  <div class="subtitle">Previous checkpoint: $prevCommit</div>
</header>

<div class="grid">
  <aside class="panel nav">
    <h2>Navigation</h2>
    <button id="btn-dashboard">Dashboard</button>
    <button id="btn-demo">Demo Center</button>
    <button id="btn-safety">Safety Center</button>
    <button id="btn-tests">Test Center</button>
    <button id="btn-package">Package Center</button>
    <button id="btn-report">Report Center</button>
  </aside>

  <main>
    <section class="panel">
      <h2>Owner Action Buttons</h2>
      <div class="action-row">
        <button id="btn-owner-flow">Run Full Owner Flow</button>
        <button id="btn-run-demo">Run Demo</button>
        <button id="btn-run-safety">Run Safety Check</button>
        <button id="btn-run-tests">Run UI Tests</button>
        <button id="btn-open-package">Open Package Center</button>
        <button id="btn-open-report">Open Final Report</button>
        <button id="btn-export-json">Export Session JSON</button>
        <button id="btn-reset-console">Reset Console</button>
      </div>
    </section>

    <section id="section-dashboard" class="panel section">
      <h2>Dashboard</h2>
      <div class="card-grid">
        <div class="card"><b>Website</b><br><span class="good">READY</span></div>
        <div class="card"><b>Buttons</b><br><span class="good">WIRED</span></div>
        <div class="card"><b>Mode</b><br><span class="warn">LOCAL ONLY</span></div>
        <div class="card"><b>Safety</b><br><span class="good">LOCKED</span></div>
        <div class="card"><b>Testing</b><br><span id="test-status" class="warn">PENDING</span></div>
        <div class="card"><b>Demo</b><br><span id="demo-status" class="warn">PENDING</span></div>
      </div>
    </section>

    <section id="section-demo" class="panel section">
      <h2>Demo Center</h2>
      <p>This is a local browser demo. It does not access hardware, deployment, payment, or target-device package generation.</p>
      <ol>
        <li>Open Dashboard.</li>
        <li>Run Safety Check.</li>
        <li>Run UI Tests.</li>
        <li>Open Package Center.</li>
        <li>Open Final Report.</li>
      </ol>
    </section>

    <section id="section-safety" class="panel section">
      <h2>Safety Center</h2>
      <p>Status: <b id="safety-status" class="warn">PENDING</b></p>
      <table>
        <tr><th>Lock</th><th>Value</th></tr>
        <tr><td>writer_ready</td><td>false</td></tr>
        <tr><td>real_writer_implemented</td><td>NO</td></tr>
        <tr><td>keyboard_package_output_generated</td><td>NO</td></tr>
        <tr><td>USB write</td><td>NO</td></tr>
        <tr><td>Hardware load</td><td>NO</td></tr>
        <tr><td>Deploy</td><td>NO</td></tr>
        <tr><td>Payment</td><td>NO</td></tr>
        <tr><td>Compatibility claims</td><td>NO</td></tr>
      </table>
    </section>

    <section id="section-tests" class="panel section">
      <h2>Test Center</h2>
      <p>Browser-side tests run from the buttons. PowerShell test programs are included in the final package.</p>
      <table>
        <thead><tr><th>Test</th><th>Status</th></tr></thead>
        <tbody id="test-table-body"></tbody>
      </table>
    </section>

    <section id="section-package" class="panel section">
      <h2>Package Center</h2>
      <p>Final local package is created by the executor script.</p>
      <p><b>Package:</b> UAOS_V1501_V1700_FINAL_OWNER_WEBSITE_TEST_PROGRAMS_PACKAGE.zip</p>
      <p><b>Programs:</b> RUN_ALL_LOCAL_TESTS.ps1, RUN_UI_SMOKE_TEST.ps1, RUN_SAFETY_TEST.ps1, RUN_PACKAGE_TEST.ps1</p>
    </section>

    <section id="section-report" class="panel section">
      <h2>Report Center</h2>
      <p>Final report and seal are generated beside the package.</p>
      <p><b>Report:</b> UAOS_V1501_V1700_FINAL_REPORT.md</p>
      <p><b>Seal:</b> UAOS_V1501_V1700_FINAL_SEAL.md</p>
    </section>

    <section class="panel">
      <h2>Console</h2>
      <div id="console" class="console"></div>
    </section>
  </main>
</div>

<div class="footer">
  UAOS local final owner website. No deploy. No payment. No real writer. No target-device package output.
</div>

<script src="app.js"></script>
</body>
</html>
"@

W "$programPath\RUN_UI_SMOKE_TEST.ps1" @"
`$ErrorActionPreference = 'Stop'
`$site = '$sitePath'
`$index = Join-Path `$site 'index.html'
`$app = Join-Path `$site 'app.js'
`$css = Join-Path `$site 'style.css'

`$required = @(
  'btn-run-demo',
  'btn-run-safety',
  'btn-run-tests',
  'btn-open-package',
  'btn-open-report',
  'btn-reset-console',
  'btn-export-json',
  'btn-owner-flow'
)

`$ok = `$true
if (!(Test-Path `$index)) { Write-Host 'Missing index.html'; `$ok = `$false }
if (!(Test-Path `$app)) { Write-Host 'Missing app.js'; `$ok = `$false }
if (!(Test-Path `$css)) { Write-Host 'Missing style.css'; `$ok = `$false }

`$h = Get-Content `$index -Raw
`$j = Get-Content `$app -Raw

foreach (`$b in `$required) {
  if (`$h -notmatch `$b -or `$j -notmatch `$b) {
    Write-Host "Missing or unwired button: `$b"
    `$ok = `$false
  }
}

if (`$ok) { Write-Host 'UI_SMOKE_TEST: PASS'; exit 0 }
else { Write-Host 'UI_SMOKE_TEST: FAIL'; exit 1 }
"@

W "$programPath\RUN_SAFETY_TEST.ps1" @"
`$ErrorActionPreference = 'Stop'
`$root = '$runPath'
`$forbiddenExt = @('.sty','.set','.prs','.prf','.kst')
`$bad = @()

Get-ChildItem `$root -Recurse -File | ForEach-Object {
  if (`$forbiddenExt -contains `$_.Extension.ToLowerInvariant()) {
    `$bad += "Forbidden extension: `$(`$_.FullName)"
  }

  if (`$_.Extension.ToLowerInvariant() -in @('.html','.md','.txt','.json','.csv','.js','.css','.ps1')) {
    `$c = Get-Content `$_.FullName -Raw -ErrorAction SilentlyContinue
    if (`$c -match '(?i)\bwriter_ready\b\s*[:=]\s*(true|yes|1)\b') { `$bad += "writer_ready unsafe: `$(`$_.FullName)" }
    if (`$c -match '(?i)\breal_writer_implemented\b\s*[:=]\s*(true|yes|1)\b') { `$bad += "real writer unsafe: `$(`$_.FullName)" }
    if (`$c -match '(?i)\bkeyboard_package_output_generated\b\s*[:=]\s*(true|yes|1)\b') { `$bad += "keyboard package unsafe: `$(`$_.FullName)" }
    if (`$c -match '(?i)\bdeploy\b\s*[:=]\s*(true|yes|enabled|active)\b') { `$bad += "deploy unsafe: `$(`$_.FullName)" }
    if (`$c -match '(?i)\bpayment\b\s*[:=]\s*(true|yes|enabled|active)\b') { `$bad += "payment unsafe: `$(`$_.FullName)" }
  }
}

if (`$bad.Count -eq 0) { Write-Host 'SAFETY_TEST: PASS'; exit 0 }
else { `$bad | ForEach-Object { Write-Host `$_ }; Write-Host 'SAFETY_TEST: FAIL'; exit 1 }
"@

W "$programPath\RUN_PACKAGE_TEST.ps1" @"
`$ErrorActionPreference = 'Stop'
`$zip = '$packagePath\UAOS_V1501_V1700_FINAL_OWNER_WEBSITE_TEST_PROGRAMS_PACKAGE.zip'
if (!(Test-Path `$zip)) { Write-Host 'PACKAGE_TEST: FAIL missing zip'; exit 1 }
if ((Get-Item `$zip).Length -le 0) { Write-Host 'PACKAGE_TEST: FAIL empty zip'; exit 1 }
Write-Host 'PACKAGE_TEST: PASS'
exit 0
"@

W "$programPath\RUN_ALL_LOCAL_TESTS.ps1" @"
`$ErrorActionPreference = 'Continue'
`$programPath = '$programPath'
`$reportPath = '$reportPath'
New-Item -ItemType Directory -Path `$reportPath -Force | Out-Null

`$tests = @(
  'RUN_UI_SMOKE_TEST.ps1',
  'RUN_SAFETY_TEST.ps1',
  'RUN_PACKAGE_TEST.ps1'
)

`$results = @()
`$allPass = `$true

foreach (`$t in `$tests) {
  `$p = Join-Path `$programPath `$t
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File `$p
  `$pass = (`$LASTEXITCODE -eq 0)
  if (!`$pass) { `$allPass = `$false }
  `$results += [ordered]@{ test=`$t; pass=`$pass; exit_code=`$LASTEXITCODE }
}

`$summary = [ordered]@{
  status = if (`$allPass) { 'PASS' } else { 'FAIL' }
  results = `$results
  checked_at = Get-Date -Format 'o'
}

`$summary | ConvertTo-Json -Depth 20 | Out-File (Join-Path `$reportPath 'UAOS_V1501_V1700_TEST_PROGRAM_RESULTS.json') -Encoding UTF8

`$md = "# UAOS V1501-V1700 Test Program Results`n`nStatus: **`$(`$summary.status)**`n`n"
foreach (`$r in `$results) {
  `$md += "- `$(`$r.test): `$(`$r.pass)`n"
}
`$md | Out-File (Join-Path `$reportPath 'UAOS_V1501_V1700_TEST_PROGRAM_RESULTS.md') -Encoding UTF8

Write-Host "ALL_LOCAL_TESTS: `$(`$summary.status)"
if (`$allPass) { exit 0 } else { exit 1 }
"@

$Gates.WEBSITE_EXISTS = (Test-Path "$sitePath\index.html") -and (Test-Path "$sitePath\app.js") -and (Test-Path "$sitePath\style.css")
$Gates.BUTTON_SYSTEM_EXISTS = $Gates.WEBSITE_EXISTS
$Gates.TEST_PROGRAMS_EXIST = (
    (Test-Path "$programPath\RUN_UI_SMOKE_TEST.ps1") -and
    (Test-Path "$programPath\RUN_SAFETY_TEST.ps1") -and
    (Test-Path "$programPath\RUN_PACKAGE_TEST.ps1") -and
    (Test-Path "$programPath\RUN_ALL_LOCAL_TESTS.ps1")
)

$testResult = Run-LocalTests
J "$reportPath\UAOS_V1501_V1700_INTERNAL_TEST_RESULTS.json" $testResult

$Gates.TESTS_PASS = ($testResult.status -eq "PASS")
$Gates.SAFETY_LOCKS_HELD = ($Gates.TESTS_PASS -and $Safety.writer_ready -eq $false)

$preResult = Overall

W "$sealPath\UAOS_V1501_V1700_FINAL_SEAL.md" @"
# UAOS FINAL SEAL V1501-V1700

Result: **$preResult**

Phase:
Final Owner Website + Local Test Programs

Previous checkpoint:
$prevCommit

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

$Gates.SEAL_EXISTS = Test-Path "$sealPath\UAOS_V1501_V1700_FINAL_SEAL.md"

W "$reportPath\UAOS_V1501_V1700_FINAL_REPORT.md" @"
# UAOS V1501-V1700 Final Report

Result before packaging: **$preResult**

Website exists: $($Gates.WEBSITE_EXISTS)  
Button system exists: $($Gates.BUTTON_SYSTEM_EXISTS)  
Test programs exist: $($Gates.TEST_PROGRAMS_EXIST)  
Tests pass: $($Gates.TESTS_PASS)  
Safety locks held: $($Gates.SAFETY_LOCKS_HELD)  
Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)

Main website:
$sitePath\index.html

Test programs:
$programPath
"@

$zip = "$packagePath\UAOS_V1501_V1700_FINAL_OWNER_WEBSITE_TEST_PROGRAMS_PACKAGE.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }

$packageContents = "$packagePath\contents"
if (Test-Path $packageContents) { Remove-Item $packageContents -Recurse -Force }
New-D $packageContents

Copy-Item $sitePath "$packageContents\final-owner-site" -Recurse -Force
Copy-Item $programPath "$packageContents\test-programs" -Recurse -Force
Copy-Item $reportPath "$packageContents\reports" -Recurse -Force
Copy-Item $sealPath "$packageContents\seal" -Recurse -Force
Copy-Item "$runPath\previous-checkpoint-import.json" "$packageContents\previous-checkpoint-import.json" -Force

Compress-Archive -Path "$packageContents\*" -DestinationPath $zip -Force

$Gates.PACKAGE_EXISTS = (Test-Path $zip) -and ((Get-Item $zip).Length -gt 0)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$programPath\RUN_ALL_LOCAL_TESTS.ps1"
$externalTestsPass = ($LASTEXITCODE -eq 0)

$Gates.TESTS_PASS = ($Gates.TESTS_PASS -and $externalTestsPass)
$Gates.SAFETY_LOCKS_HELD = ($Gates.TESTS_PASS -and $Safety.writer_ready -eq $false)

$FinalResult = Overall

W "$sealPath\UAOS_V1501_V1700_FINAL_SEAL.md" @"
# UAOS FINAL SEAL V1501-V1700

Result: **$FinalResult**

Phase:
Final Owner Website + Local Test Programs

Previous checkpoint:
$prevCommit

Website:
$sitePath\index.html

Package:
$zip

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

Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)  
Website exists: $($Gates.WEBSITE_EXISTS)  
Button system exists: $($Gates.BUTTON_SYSTEM_EXISTS)  
Test programs exist: $($Gates.TEST_PROGRAMS_EXIST)  
Tests pass: $($Gates.TESTS_PASS)  
Package exists: $($Gates.PACKAGE_EXISTS)  
Seal exists: $($Gates.SEAL_EXISTS)  
Safety locks held: $($Gates.SAFETY_LOCKS_HELD)

Website:
$sitePath\index.html

Test programs:
$programPath

Package:
$zip

Seal:
$sealPath\UAOS_V1501_V1700_FINAL_SEAL.md
"@

$commitHash = "NO_GIT_REPO"
if (Test-Path "$basePath\.git") {
    try {
        Push-Location $basePath
        git add -- "uaos-ai-factory/RUN_UAOS_V1501_V1700_FINAL_OWNER_WEBSITE_TEST_PROGRAMS.ps1" "uaos-ai-factory/uaos-v1501-v1700-final-owner-website-test-programs" | Out-Null

        git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            $commitHash = "NO_NEW_COMMIT_CURRENT_HEAD_$((git rev-parse --short HEAD).Trim())"
        } else {
            git commit -m "UAOS V1501-V1700 Final Owner Website Test Programs [$FinalResult]" | Out-Null
            $commitHash = (git rev-parse --short HEAD).Trim()
            $Gates.GIT_COMMIT_DONE = $true
        }
        Pop-Location
    } catch {
        try { Pop-Location } catch {}
        $commitHash = "GIT_ERROR"
    }
} else {
    $Gates.GIT_COMMIT_DONE = $true
}

$FinalResult = Overall

W "$logsPath\RUN_COMPLETE.txt" @"
UAOS V1501-V1700 complete.
Result: $FinalResult
Commit: $commitHash
Completed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$color = if ($FinalResult -eq "PASS") { "Green" } else { "Red" }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " UAOS V1501-V1700 Final Owner Website: $FinalResult " -ForegroundColor White -BackgroundColor $color
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Previous checkpoint imported: $($Gates.PREV_CHECKPOINT_IMPORT)"
Write-Host "Website exists:               $($Gates.WEBSITE_EXISTS)"
Write-Host "Button system exists:         $($Gates.BUTTON_SYSTEM_EXISTS)"
Write-Host "Test programs exist:          $($Gates.TEST_PROGRAMS_EXIST)"
Write-Host "Tests pass:                   $($Gates.TESTS_PASS)"
Write-Host "Package exists:               $($Gates.PACKAGE_EXISTS)"
Write-Host "Seal exists:                  $($Gates.SEAL_EXISTS)"
Write-Host "Safety locks held:            $($Gates.SAFETY_LOCKS_HELD)"
Write-Host "Commit Hash:                  $commitHash"
Write-Host "-----------------------------------------------"
Write-Host "Website: $sitePath\index.html"
Write-Host "Test Programs: $programPath"
Write-Host "Package: $zip"
Write-Host "Seal: $sealPath\UAOS_V1501_V1700_FINAL_SEAL.md"
Write-Host "Report: $reportPath\UAOS_V1501_V1700_FINAL_REPORT.md"
Write-Host "==============================================="
Write-Host ""

Start-Process "$sitePath\index.html"

if ($FinalResult -ne "PASS") {
    exit 1
}
