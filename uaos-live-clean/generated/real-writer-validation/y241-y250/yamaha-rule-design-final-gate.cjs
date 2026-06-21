const fs = require("fs");
const path = require("path");

const p = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y241-y250",
  "y241-y250-rule-design-qa-stop-gate-report.json"
);

function fail(m) {
  console.error("[Y241-Y250 FINAL GATE FAIL]", m);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing final QA report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const s = r.stopGate || {};

if (r.phase !== "Y241-Y250") fail("Wrong phase");
if (r.status !== "PASS_WITH_STOP_GATE") fail("Not stopped safely");

if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.chunkPayloadExtraction !== "BLOCKED") fail("Chunk payload extraction not blocked");
if (s.fixtureRead !== "BLOCKED") fail("Fixture read not blocked");
if (s.writerImplementation !== "HARD_LOCKED") fail("Writer not hard locked");
if (s.realStyOutput !== "HARD_LOCKED") fail("Real STY output not hard locked");
if (s.deploy !== "BLOCKED") fail("Deploy not blocked");

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y241-y250", "y241-y250-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y241-Y250",
    status: "PASS",
    confirmed: [
      "PASS_WITH_STOP_GATE",
      "PRODUCTION_PARSER_BLOCKED",
      "FIXTURE_READ_BLOCKED",
      "CHUNK_PAYLOAD_EXTRACTION_BLOCKED",
      "WRITER_HARD_LOCKED",
      "REAL_STY_OUTPUT_HARD_LOCKED",
      "DEPLOY_BLOCKED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y241-Y250 FINAL SAFETY PASS]");
