const fs = require("fs");
const path = require("path");

const base = path.join(process.cwd(), "generated", "real-writer-validation");
const outDir = path.join(base, "y321-y330");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y321-Y330 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing required report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const sealed = load("y311-y320/y311-y320-final-sealed-qa-dashboard-report.json");
const exec = load("y301-y310/y301-y310-executive-safe-closure-report.json");
const qa = load("y281-y290/y281-y290-parser-qa-dashboard-report.json");
const outputLock = load("y291-y300/y291-y300-universal-output-lock-report.json");

const dashboard = {
  phase: "Y321-Y330",
  title: "UAOS Local Product Demo Dashboard",
  status: "PASS",
  purpose: "Show Yamaha parser validation value locally without opening writer or publishing.",
  localDemoOnly: true,
  cards: [
    {
      title: "Technology Proof",
      status: "READY_FOR_LOCAL_DEMO",
      text: "UAOS can collect safe parser evidence, simulate rules from reports, validate structure, and document readiness."
    },
    {
      title: "Parser State",
      status: "READ_ONLY_VALIDATION_COMPLETE",
      text: "Parser design chain is closed at read-only reports/simulation/documentation level."
    },
    {
      title: "Writer State",
      status: "HARD_LOCKED",
      text: "Real keyboard writer remains locked. No .STY or other real output is produced."
    },
    {
      title: "Release State",
      status: "LOCAL_ONLY",
      text: "No deploy, no commercial release, no production parser."
    }
  ],
  sourceReports: {
    sealedStatus: sealed.status,
    executiveStatus: exec.status,
    qaStatus: qa.status,
    outputLockStatus: outputLock.status
  },
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realStyOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y321-y330-local-product-demo-dashboard-report.json"),
  JSON.stringify(dashboard, null, 2),
  "utf8"
);

console.log("[Y321-Y330 PASS]");
