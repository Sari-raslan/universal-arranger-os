const fs = require("fs");
const path = require("path");

const base = path.join(process.cwd(), "generated", "real-writer-validation");
const outDir = path.join(base, "y261-y270");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg){ console.error("[Y261-Y270 FAIL]", msg); process.exit(1); }
function load(rel){ const p = path.join(base, rel); if(!fs.existsSync(p)) fail("Missing " + rel); return JSON.parse(fs.readFileSync(p,"utf8")); }

const sim = load("y251-y260/y251-y260-rule-simulator-report.json");
const rules = load("y231-y240/y231-y240-parser-rule-design-report.json");

if (sim.phase !== "Y251-Y260" || sim.status !== "PASS") fail("Invalid sim");
if (rules.phase !== "Y231-Y240" || rules.status !== "PASS") fail("Invalid rules");

const validations = (sim.simulations || []).map(s => ({
  fileName: s.fileName,
  matchedRuleCount: s.matchedRuleCount || 0,
  validationBand: (s.matchedRuleCount || 0) >= 2 ? "GOOD_SIMULATION_EVIDENCE" : (s.matchedRuleCount || 0) === 1 ? "WEAK_SIMULATION_EVIDENCE" : "NO_SIMULATION_EVIDENCE",
  safeForProductionParser: false,
  reason: "Production parser remains blocked. This is validation-only.",
  writerImplementation: false,
  realOutput: false
}));

const report = {
  phase: "Y261-Y270",
  title: "Read-Only Parser Rule Validation From Existing Reports",
  status: "PASS",
  validationOnly: true,
  sourceReportsOnly: true,
  validations,
  summary: {
    total: validations.length,
    good: validations.filter(v => v.validationBand === "GOOD_SIMULATION_EVIDENCE").length,
    weak: validations.filter(v => v.validationBand === "WEAK_SIMULATION_EVIDENCE").length,
    none: validations.filter(v => v.validationBand === "NO_SIMULATION_EVIDENCE").length
  },
  hardLimits: {
    fixtureRead: false,
    fixtureCopy: false,
    fixtureModify: false,
    productionParserImplementation: false,
    writerImplementation: false,
    realStyOutput: false,
    realSetPrsStlPatMspKstOutput: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(path.join(outDir, "y261-y270-rule-validation-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log("[Y261-Y270 PASS]");
