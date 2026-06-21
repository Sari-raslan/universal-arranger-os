const fs = require("fs");
const path = require("path");

const base = path.join(process.cwd(), "generated", "real-writer-validation");
const outDir = path.join(base, "y231-y240");
fs.mkdirSync(outDir, { recursive: true });

function load(rel, required = true) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) {
    if (required) {
      console.error("[Y231-Y240 FAIL] Missing report:", rel);
      process.exit(1);
    }
    return null;
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const classification = load("y171-y180/y171-y180-section-classification-report.json");
const confidence     = load("y181-y190/y181-y190-section-confidence-report.json");
const structure      = load("y191-y200/y191-y200-style-structure-summary-report.json");
const readiness      = load("y201-y210/y201-y210-parser-readiness-report.json");
const blockers       = load("y211-y220/y211-y220-writer-unlock-blocker-report.json");
const dashboard      = load("y221-y230/y221-y230-final-dashboard-report.json");

function assertReport(r, phase) {
  if (!r || r.phase !== phase) {
    console.error("[Y231-Y240 FAIL] Bad phase:", phase);
    process.exit(1);
  }
}

assertReport(classification, "Y171-Y180");
assertReport(confidence, "Y181-Y190");
assertReport(structure, "Y191-Y200");
assertReport(readiness, "Y201-Y210");
assertReport(blockers, "Y211-Y220");
assertReport(dashboard, "Y221-Y230");

const sectionRules = [
  {
    id: "RULE_SECTION_MAIN",
    purpose: "Detect MAIN style sections from approved marker/classification evidence.",
    evidenceSources: ["Y171-Y180", "Y181-Y190", "Y191-Y200"],
    inputFields: ["sectionType", "markerCount", "confidenceBand", "detectedSectionTypes"],
    positiveSignals: ["MAIN", "MAIN A", "MAIN B", "MAIN C", "MAIN D"],
    output: "SECTION_CANDIDATE_MAIN",
    allowedAction: "DESIGN_ONLY",
    forbiddenActions: ["fixtureRead", "chunkExtraction", "payloadExport", "writerImplementation", "realStyOutput"]
  },
  {
    id: "RULE_SECTION_INTRO",
    purpose: "Detect INTRO style sections from approved marker/classification evidence.",
    evidenceSources: ["Y171-Y180", "Y181-Y190"],
    inputFields: ["sectionType", "markerCount", "confidenceBand"],
    positiveSignals: ["INTRO", "INTRO A", "INTRO B", "INTRO C"],
    output: "SECTION_CANDIDATE_INTRO",
    allowedAction: "DESIGN_ONLY",
    forbiddenActions: ["fixtureRead", "chunkExtraction", "payloadExport", "writerImplementation", "realStyOutput"]
  },
  {
    id: "RULE_SECTION_FILL_BREAK",
    purpose: "Detect FILL and BREAK transition sections.",
    evidenceSources: ["Y171-Y180", "Y181-Y190"],
    inputFields: ["sectionType", "markerCount", "confidenceBand"],
    positiveSignals: ["FILL", "BREAK"],
    output: "SECTION_CANDIDATE_TRANSITION",
    allowedAction: "DESIGN_ONLY",
    forbiddenActions: ["fixtureRead", "chunkExtraction", "payloadExport", "writerImplementation", "realStyOutput"]
  },
  {
    id: "RULE_SECTION_ENDING",
    purpose: "Detect ENDING style sections.",
    evidenceSources: ["Y171-Y180", "Y181-Y190"],
    inputFields: ["sectionType", "markerCount", "confidenceBand"],
    positiveSignals: ["ENDING", "ENDING A", "ENDING B", "ENDING C"],
    output: "SECTION_CANDIDATE_ENDING",
    allowedAction: "DESIGN_ONLY",
    forbiddenActions: ["fixtureRead", "chunkExtraction", "payloadExport", "writerImplementation", "realStyOutput"]
  },
  {
    id: "RULE_TECHNICAL_CASM_OTS_SFF",
    purpose: "Track Yamaha support markers for future read-only parser design.",
    evidenceSources: ["Y171-Y180", "Y151-Y160"],
    inputFields: ["markerMap", "sectionCandidateMap"],
    positiveSignals: ["CASM", "OTS", "SFF", "SFF1", "SFF2"],
    output: "TECHNICAL_MARKER_CANDIDATE",
    allowedAction: "DESIGN_ONLY",
    forbiddenActions: ["fixtureRead", "chunkExtraction", "payloadExport", "writerImplementation", "realStyOutput"]
  }
];

const productionPromotionRules = [
  {
    id: "PROMOTION_BLOCK_WRITER",
    status: "BLOCKED",
    reason: "Writer remains hard locked by Y211-Y220.",
    unlockRequires: [
      "Separate explicit writer approval",
      "Binary output specification",
      "Conformance tests",
      "Round-trip hardware validation",
      "Legal/release approval"
    ]
  },
  {
    id: "PROMOTION_BLOCK_REAL_STY_OUTPUT",
    status: "BLOCKED",
    reason: "Real .STY output is not approved.",
    unlockRequires: [
      "Separate explicit real output approval",
      "Safe output sandbox",
      "Non-destructive output directory policy",
      "Validation fixture strategy"
    ]
  },
  {
    id: "PROMOTION_BLOCK_DEPLOY",
    status: "BLOCKED",
    reason: "No deploy approval in current scope.",
    unlockRequires: ["Separate deploy approval"]
  }
];

const fixtureEvidenceSummary = (structure.fixtures || []).map(fx => ({
  fileName: fx.fileName || null,
  detectedSectionTypes: fx.detectedSectionTypes || [],
  likelyStyleCompleteness: fx.likelyStyleCompleteness || "UNKNOWN",
  ruleDesignOnly: true
}));

const report = {
  phase: "Y231-Y240",
  title: "Read-Only Yamaha Parser Rule Design From Existing Reports",
  status: "PASS",
  approvalCaptured: true,
  approvalText: "I approve read-only Yamaha parser rule design from existing reports only. No writer, no real .STY output.",
  sourceReportsOnly: true,
  fixtureRead: false,
  parserProductionImplementation: false,
  writerImplementation: false,
  realStyOutput: false,
  deploy: false,
  readiness: readiness.readiness || "UNKNOWN",
  ruleDesign: {
    sectionRules,
    productionPromotionRules
  },
  fixtureEvidenceSummary,
  hardLimits: {
    useExistingReportsOnly: true,
    fixtureRead: false,
    fixtureCopy: false,
    fixtureModify: false,
    chunkExtraction: false,
    payloadExport: false,
    productionParserImplementation: false,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y231-y240-parser-rule-design-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y231-Y240 PASS]");
