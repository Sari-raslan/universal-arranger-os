const fs = require("fs");
const path = require("path");

const inPath = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y231-y240",
  "y231-y240-parser-rule-design-report.json"
);

const outDir = path.join(process.cwd(), "generated", "real-writer-validation", "y241-y250");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y241-Y250 FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(inPath)) fail("Missing Y231-Y240 rule design report");

const input = JSON.parse(fs.readFileSync(inPath, "utf8"));

if (input.phase !== "Y231-Y240") fail("Wrong input phase");
if (input.status !== "PASS") fail("Input not PASS");

const sectionRules = ((input.ruleDesign || {}).sectionRules || []);
const promotionRules = ((input.ruleDesign || {}).productionPromotionRules || []);

const qa = {
  ruleCount: sectionRules.length,
  promotionBlockerCount: promotionRules.filter(r => r.status === "BLOCKED").length,
  allRulesDesignOnly: sectionRules.every(r => r.allowedAction === "DESIGN_ONLY"),
  allPromotionBlocked: promotionRules.every(r => r.status === "BLOCKED"),
  noWriter: input.writerImplementation === false,
  noRealStyOutput: input.realStyOutput === false,
  noDeploy: input.deploy === false,
  sourceReportsOnly: input.sourceReportsOnly === true
};

const pass = qa.ruleCount > 0 &&
  qa.allRulesDesignOnly &&
  qa.allPromotionBlocked &&
  qa.noWriter &&
  qa.noRealStyOutput &&
  qa.noDeploy &&
  qa.sourceReportsOnly;

if (!pass) fail("QA failed");

const report = {
  phase: "Y241-Y250",
  title: "Parser Rule Design QA + Stop Gate",
  status: "PASS_WITH_STOP_GATE",
  qa,
  completed: [
    "Read-only parser rule design from existing reports",
    "Rule QA",
    "Production parser stop gate",
    "Writer hard lock confirmation",
    "Real .STY output block confirmation"
  ],
  stopGate: {
    productionParser: "BLOCKED",
    chunkPayloadExtraction: "BLOCKED",
    fixtureRead: "BLOCKED",
    writerImplementation: "HARD_LOCKED",
    realStyOutput: "HARD_LOCKED",
    deploy: "BLOCKED"
  },
  nextApprovalRequiredText: "I approve creating a read-only Yamaha parser rule simulator from existing reports only. No fixture read, no writer, no real .STY output.",
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y241-y250-rule-design-qa-stop-gate-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y241-Y250 PASS_WITH_STOP_GATE]");
