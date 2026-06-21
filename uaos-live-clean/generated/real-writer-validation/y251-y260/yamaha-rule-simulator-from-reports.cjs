const fs = require("fs");
const path = require("path");

const base = path.join(process.cwd(), "generated", "real-writer-validation");
const outDir = path.join(base, "y251-y260");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y251-Y260 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const rules = load("y231-y240/y231-y240-parser-rule-design-report.json");
const confidence = load("y181-y190/y181-y190-section-confidence-report.json");
const structure = load("y191-y200/y191-y200-style-structure-summary-report.json");

if (rules.phase !== "Y231-Y240" || rules.status !== "PASS") fail("Invalid Y231-Y240 rules");
if (confidence.phase !== "Y181-Y190" || confidence.status !== "PASS") fail("Invalid Y181-Y190 confidence");
if (structure.phase !== "Y191-Y200" || structure.status !== "PASS") fail("Invalid Y191-Y200 structure");

const sectionRules = ((rules.ruleDesign || {}).sectionRules || []);

function simulateFixture(fx) {
  const detected = new Set(fx.detectedSectionTypes || []);
  const results = sectionRules.map(rule => {
    const signals = rule.positiveSignals || [];
    const matchedSignals = signals.filter(s => detected.has(s) || detected.has(String(s).split(" ")[0]));
    return {
      ruleId: rule.id,
      output: rule.output,
      matchedSignals,
      matched: matchedSignals.length > 0,
      action: "SIMULATION_ONLY_NO_PARSER_NO_EXPORT"
    };
  });

  return {
    fileName: fx.fileName || null,
    sourceStatus: fx.status,
    simulatedRules: results,
    matchedRuleCount: results.filter(r => r.matched).length,
    parserImplementation: false,
    writerImplementation: false,
    realOutput: false,
    deploy: false
  };
}

const simulations = (structure.fixtures || []).map(simulateFixture);

const report = {
  phase: "Y251-Y260",
  title: "Read-Only Yamaha Parser Rule Simulator From Existing Reports",
  status: "PASS",
  sourceReportsOnly: true,
  fixtureRead: false,
  simulationOnly: true,
  simulations,
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
    realSetPrsStlPatMspKstOutput: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(path.join(outDir, "y251-y260-rule-simulator-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log("[Y251-Y260 PASS]");
