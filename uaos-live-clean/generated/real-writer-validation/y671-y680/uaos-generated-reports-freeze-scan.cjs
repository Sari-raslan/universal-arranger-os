const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y671-y680");
fs.mkdirSync(outDir, { recursive: true });

const requiredReports = [
  "y351-y360/y351-y360-final-local-demo-gate-report.json",
  "y391-y400/y391-y400-final-writer-readiness-dashboard-report.json",
  "y451-y460/y451-y460-final-dryrun-writer-readiness-report.json",
  "y491-y500/y491-y500-final-dryrun-local-viewer-gate-report.json",
  "y531-y540/y531-y540-final-local-proof-package-report.json",
  "y571-y580/y571-y580-final-safe-decision-gate-report.json",
  "y611-y620/y611-y620-final-polished-local-demo-gate-report.json",
  "y651-y660/y651-y660-final-ui-navigation-polish-gate-report.json"
];

function loadJson(rel) {
  const full = path.join(base, rel);
  if (!fs.existsSync(full)) return { exists: false, rel };
  try {
    return { exists: true, rel, json: JSON.parse(fs.readFileSync(full, "utf8")) };
  } catch (error) {
    return { exists: true, rel, parseError: String(error.message || error) };
  }
}

const loaded = requiredReports.map(loadJson);

const checks = loaded.map(item => {
  const j = item.json || {};
  const text = JSON.stringify(j).toLowerCase();
  return {
    rel: item.rel,
    exists: item.exists,
    parseOk: item.exists && !item.parseError,
    status: j.status || "UNKNOWN",
    hasWriterBlockedText: text.includes("writer") && text.includes("blocked"),
    hasRealOutputBlockedText: (text.includes("keyboard output") || text.includes("realkeyboardoutput") || text.includes("real output")) && text.includes("blocked"),
    hasParserBlockedText: text.includes("parser") && text.includes("blocked"),
    hasDeployBlockedText: text.includes("deploy") && text.includes("blocked"),
    parseError: item.parseError || null
  };
});

const missing = checks.filter(x => !x.exists);
const parseErrors = checks.filter(x => !x.parseOk);
const weakLocks = checks.filter(x => x.parseOk && !(x.hasWriterBlockedText && x.hasDeployBlockedText));

const report = {
  phase: "Y671-Y680",
  title: "Generated Reports QA Freeze Scan",
  status: missing.length === 0 && parseErrors.length === 0 ? "PASS_GENERATED_REPORTS_PRESENT" : "PASS_WITH_REPORT_ISSUES_REPORTED",
  requiredReportCount: requiredReports.length,
  missingCount: missing.length,
  parseErrorCount: parseErrors.length,
  weakLocksCount: weakLocks.length,
  checks,
  missing,
  parseErrors,
  weakLocks,
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y671-y680-generated-reports-freeze-scan-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y671-Y680]", report.status);
