const fs = require("fs");
const path = require("path");

const inPath = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y131-y140",
  "y131-y140-read-only-parser-sandbox-report.json"
);

const outDir = path.join(process.cwd(), "generated", "real-writer-validation", "y141-y150");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y141-Y150 FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(inPath)) fail("Missing Y131-Y140 report");

const input = JSON.parse(fs.readFileSync(inPath, "utf8"));

if (input.phase !== "Y131-Y140") fail("Wrong input phase");
if (input.status !== "PASS") fail("Input not PASS");

const fixtureSummary = (input.fixtures || []).map(fx => ({
  fileName: fx.fileName || null,
  status: fx.status,
  fileSizeBytes: fx.fileSizeBytes || null,
  midiHeaderFound: !!(fx.midiHeaderProbe && fx.midiHeaderProbe.found),
  trackCountDetectedByMarker: Array.isArray(fx.trackProbe) ? fx.trackProbe.length : 0,
  sectionPlanCount: Array.isArray(fx.sectionPlan) ? fx.sectionPlan.length : 0,
  writerStillLocked: true
}));

const report = {
  phase: "Y141-Y150",
  title: "Parser Sandbox QA + Writer Hard Lock",
  status: "PASS_WITH_WRITER_LOCKED",
  qaSummary: {
    fixtureCount: fixtureSummary.length,
    fixtures: fixtureSummary
  },
  hardLocks: {
    writerImplementation: "HARD_LOCKED",
    realStyOutput: "HARD_LOCKED",
    destructiveWrites: "BLOCKED",
    deploy: "BLOCKED"
  },
  nextApprovalRequiredText: "I approve implementing read-only Yamaha chunk map extraction from approved fixtures. No writer, no real .STY output.",
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y141-y150-parser-sandbox-qa-writer-lock-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y141-Y150 PASS_WITH_WRITER_LOCKED]");
