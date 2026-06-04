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
