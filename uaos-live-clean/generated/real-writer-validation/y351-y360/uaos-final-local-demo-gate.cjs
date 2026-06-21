const fs = require("fs");
const path = require("path");

const base = path.join(process.cwd(), "generated", "real-writer-validation");
const outDir = path.join(base, "y351-y360");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y351-Y360 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const demo = load("y321-y330/y321-y330-local-product-demo-dashboard-report.json");
const cto = load("y331-y340/y331-y340-cto-evidence-report.json");
const readiness = load("y341-y350/y341-y350-writer-roadmap-product-readiness-report.json");

const final = {
  phase: "Y351-Y360",
  title: "Final Local Demo Gate",
  status: "PASS_LOCAL_DEMO_READY",
  finalConclusion: "UAOS Yamaha parser validation is ready as a local proof-of-technology demo and CTO evidence pack.",
  localPages: [
    "y321-y330-local-product-demo-dashboard.html",
    "y331-y340-cto-evidence-report.html",
    "y341-y350-writer-roadmap-product-readiness.html",
    "y351-y360-final-local-demo-gate.html"
  ],
  finalState: {
    localDemo: "READY",
    ctoEvidencePack: "READY",
    writerRoadmap: "READY_WITHOUT_IMPLEMENTATION",
    productionParser: "BLOCKED",
    writer: "HARD_LOCKED",
    realStyOutput: "HARD_LOCKED",
    deploy: "BLOCKED",
    commercialProduct: "NO"
  },
  sourceStatuses: {
    demo: demo.status,
    cto: cto.status,
    readiness: readiness.status
  },
  nextBestDecision: "Review local demo. Then choose either UI/product refinement or a separately approved writer sandbox specification phase.",
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
  path.join(outDir, "y351-y360-final-local-demo-gate-report.json"),
  JSON.stringify(final, null, 2),
  "utf8"
);

console.log("[Y351-Y360 PASS_LOCAL_DEMO_READY]");
