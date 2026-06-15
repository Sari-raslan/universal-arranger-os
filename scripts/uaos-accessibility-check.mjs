import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const app = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "App.jsx"), "utf8");
const panel = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "components", "PublicBetaPanel.jsx"), "utf8");
const css = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "style.css"), "utf8");

const checks = {
  semanticHeadings: /<h1|<h2|<h3/.test(panel),
  labels: panel.includes("<label"),
  buttonNames: panel.includes("<button"),
  keyboardFocus: css.includes("focus-visible"),
  reducedMotion: css.includes("prefers-reduced-motion"),
  rtlSupport: panel.includes("dir={beta.localization.direction}"),
  liveStatus: panel.includes("aria-label") && panel.includes("Blue Live LED"),
  routeTitleFoundation: app.includes("Release Status")
};

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  passed: Object.values(checks).every(Boolean),
  checks,
  certificationClaimed: false
};

fs.writeFileSync(path.join(reportsDir, "UAOS_ACCESSIBILITY_BASELINE.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(`UAOS accessibility baseline passed: ${result.passed}`);
if (!result.passed) process.exit(1);
