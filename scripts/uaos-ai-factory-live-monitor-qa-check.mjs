import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "uaos-live-clean/public/monitor/index.html");
const docsPagePath = path.join(root, "docs/monitor/index.html");
const qaJsonPath = path.join(root, "uaos-ai-factory/LIVE_MONITOR_QA_STATUS.json");
const qaMdPath = path.join(root, "uaos-ai-factory/LIVE_MONITOR_QA_STATUS.md");

const failures = [];
const forbiddenPhrases = [
  "production ready",
  "production-ready",
  "payment enabled",
  "keyboard ready",
  "keyboard-ready",
  "keyboard transfer ready",
  "real writer ready",
  "guaranteed income",
  "public release ready",
  "supporter",
  "friend"
];
const forbiddenExtensions = [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"];
const requiredSections = [
  "AI Factory",
  "Bounded Agents",
  "Implementation Queue",
  "SAFE Queue",
  "Development / Tooling",
  "Neutral Package Sandbox",
  "Evidence / Jobcenter Assets",
  "Public Monitor",
  "Future Work",
  "Blocked Areas"
];

if (!existsSync(pagePath)) failures.push("Monitor page missing: uaos-live-clean/public/monitor/index.html");
if (!existsSync(docsPagePath)) failures.push("GitHub Pages monitor output missing: docs/monitor/index.html");

const html = existsSync(pagePath) ? readFileSync(pagePath, "utf8") : "";
const docsHtml = existsSync(docsPagePath) ? readFileSync(docsPagePath, "utf8") : "";
const allHtml = `${html}\n${docsHtml}`;
const lower = html.toLowerCase();
const allLower = allHtml.toLowerCase();

function requireText(text, message) {
  if (!html.includes(text)) failures.push(message);
}

requireText("UAOS Live Monitor", "Missing UAOS Live Monitor title/content");
requireText("Monitor Live", "Missing Monitor Live badge");
requireText("01.07.2026", "Missing required date");
requireText("Public Project Status Dashboard", "Missing professional dashboard subtitle");
requireText("owner-neutral-003", "Missing selected package owner-neutral-003");
requireText("Done", "Missing Done numbers label");
requireText("Remaining", "Missing Remaining numbers label");
requireText("Total", "Missing Total numbers label");
requireText("Payment inactive", "Missing blocked payment item");
requireText("Keyboard-native output blocked", "Missing blocked keyboard output item");
requireText("Keyboard transfer blocked", "Missing blocked keyboard transfer item");
for (const section of requiredSections) {
  if (!html.includes(section)) failures.push(`Missing dashboard section: ${section}`);
  if (!docsHtml.includes(section)) failures.push(`Missing dashboard section in docs output: ${section}`);
}
if (!html.includes("Businessplan financial version in preparation") && !lower.includes("businessplan-finanzversion ist in vorbereitung")) {
  failures.push("Missing Businessplan financial version preparation wording");
}
if (/<title>\s*jobcenter\s*<\/title>/i.test(html)) failures.push("Jobcenter is used as page title");
if (/E:\\/i.test(html)) failures.push("Private local Windows path exposed");
for (const phrase of forbiddenPhrases) {
  if (allLower.includes(phrase)) failures.push(`Forbidden wording found: ${phrase}`);
}
for (const ext of forbiddenExtensions) {
  if (allHtml.toUpperCase().includes(ext)) failures.push(`Forbidden keyboard-native extension found: ${ext}`);
}
if (/<script\b/i.test(allHtml)) failures.push("Script tag found; monitor page must not use external scripts");
if (/<link\b[^>]+rel=["']stylesheet["']/i.test(allHtml)) failures.push("External stylesheet link found");
if (/https?:\/\/fonts\./i.test(allHtml) || /fonts.googleapis.com|fonts.gstatic.com/i.test(allHtml)) failures.push("External font reference found");
if (/https?:\/\//i.test(allHtml)) failures.push("External URL found in monitor page");

const status = {
  schema: "uaos-live-monitor-qa-status-v1",
  status: failures.length ? "FAIL" : "PASS",
  page: "uaos-live-clean/public/monitor/index.html",
  docsPage: "docs/monitor/index.html",
  titlePresent: html.includes("UAOS Live Monitor"),
  docsTitlePresent: docsHtml.includes("UAOS Live Monitor"),
  monitorLiveBadgePresent: html.includes("Monitor Live"),
  docsMonitorLiveBadgePresent: docsHtml.includes("Monitor Live"),
  datePresent: html.includes("01.07.2026"),
  professionalDashboardSubtitlePresent: html.includes("Public Project Status Dashboard"),
  selectedPackagePresent: html.includes("owner-neutral-003"),
  numbersPresent: html.includes("Done") && html.includes("Remaining") && html.includes("Total"),
  requiredSectionsPresent: requiredSections.every((section) => html.includes(section) && docsHtml.includes(section)),
  blockedItemsPresent: html.includes("Payment inactive") && html.includes("Keyboard-native output blocked") && html.includes("Keyboard transfer blocked"),
  falseClaimsPass: failures.every((failure) => !failure.startsWith("Forbidden wording")),
  noExternalScripts: !/<script\b/i.test(allHtml),
  noExternalCss: !/<link\b[^>]+rel=["']stylesheet["']/i.test(allHtml),
  noExternalFonts: !(/https?:\/\/fonts\./i.test(allHtml) || /fonts.googleapis.com|fonts.gstatic.com/i.test(allHtml)),
  failures
};

writeFileSync(qaJsonPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
writeFileSync(qaMdPath, `# UAOS Live Monitor QA Status

Status: ${status.status}

Page: ${status.page}

GitHub Pages output: ${status.docsPage}

Title verified: ${status.titlePresent ? "YES" : "NO"}

Docs title verified: ${status.docsTitlePresent ? "YES" : "NO"}

Monitor Live badge verified: ${status.monitorLiveBadgePresent ? "YES" : "NO"}

Docs Monitor Live badge verified: ${status.docsMonitorLiveBadgePresent ? "YES" : "NO"}

Professional dashboard subtitle: ${status.professionalDashboardSubtitlePresent ? "YES" : "NO"}

Selected package visible: ${status.selectedPackagePresent ? "YES" : "NO"}

Done / Remaining / Total visible: ${status.numbersPresent ? "YES" : "NO"}

Section cards visible: ${status.requiredSectionsPresent ? "YES" : "NO"}

Blocked items visible: ${status.blockedItemsPresent ? "YES" : "NO"}

False claims check: ${status.falseClaimsPass ? "PASS" : "FAIL"}

External scripts: ${status.noExternalScripts ? "NO" : "YES"}

External CSS: ${status.noExternalCss ? "NO" : "YES"}

External fonts: ${status.noExternalFonts ? "NO" : "YES"}

Failures:
${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}
`, "utf8");

console.log("UAOS Live Monitor QA Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS Live Monitor QA Check: PASS");
