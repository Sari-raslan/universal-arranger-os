$ErrorActionPreference = "Stop"

$Repo = "C:\Users\ssare\Documents\Codex\2026-05-28\work-on-keyboard-manager-repository-sari"
$ReportDir = "C:\Users\ssare\Documents\Codex\2026-05-28\work-on-keyboard-manager-repository-sari\reports"
$Report = "C:\Users\ssare\Documents\Codex\2026-05-28\work-on-keyboard-manager-repository-sari\reports\PHASE2_HARDENING_REPORT.txt"

function Log($m) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $m" | Tee-Object -FilePath $Report -Append
}

Set-Location $Repo
Log "UAOS Phase 2 started after reboot"

Log "Sync master"
git checkout master
git pull origin master

Log "Install dependencies"
npm install

Log "Run tests"
npm test

Log "Run build"
npm run build

Log "Run audit"
npm audit

Log "Prepare Playwright button/site scan"
npm install -D playwright

@'
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const report = [];
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const urls = ['http://localhost:5173', 'http://localhost:3000'];

  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      const buttons = await page.locator('button, a, input[type=button], input[type=submit]').evaluateAll els =>
        els.map((el, i) => ({
          index: i,
          tag: el.tagName,
          text: el.innerText || el.value || el.getAttribute('aria-label') || '',
          disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
          href: el.href || ''
        }))
      );
      report.push({ url, ok: true, buttons });
    } catch (e) {
      report.push({ url, ok: false, error: e.message });
    }
  }

  await browser.close();
  fs.writeFileSync('reports/PHASE2_BUTTON_SCAN.json', JSON.stringify(report, null, 2));
})();
'@ | Out-File "phase2-button-scan.cjs" -Encoding utf8

Log "Start dev server and scan buttons"
$server = Start-Process powershell -PassThru -ArgumentList "-NoExit", "-Command", "cd '$Repo'; npm run dev"
Start-Sleep -Seconds 12
node phase2-button-scan.cjs
Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue

Log "Logo integration check"
$LogoCandidates = @(
  "logo.png",
  "logo.svg",
  "frontend\public\logo.png",
  "frontend\public\logo.svg",
  "public\logo.png",
  "public\logo.svg",
  "src\assets\logo.png",
  "src\assets\logo.svg"
)

foreach ($l in $LogoCandidates) {
  if (Test-Path "$Repo\$l") {
    Log "Logo found: $l"
  }
}

Log "Git status"
git status --short | Tee-Object -FilePath $Report -Append

Log "Phase 2 complete"
Unregister-ScheduledTask -TaskName "UAOS Phase 2 Hardening" -Confirm:$false -ErrorAction SilentlyContinue
