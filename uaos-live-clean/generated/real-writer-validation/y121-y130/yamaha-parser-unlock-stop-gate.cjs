const fs = require("fs");
const path = require("path");

const y101 = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y101-y110",
  "y101-y110-safety-gate-report.json"
);

const y111 = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y111-y120",
  "y111-y120-safety-gate-report.json"
);

const outDir = path.join(process.cwd(), "generated", "real-writer-validation", "y121-y130");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y121-Y130 FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(y101)) fail("Missing Y101-Y110 safety gate");
if (!fs.existsSync(y111)) fail("Missing Y111-Y120 safety gate");

const gate101 = JSON.parse(fs.readFileSync(y101, "utf8"));
const gate111 = JSON.parse(fs.readFileSync(y111, "utf8"));

if (gate101.status !== "PASS") fail("Y101-Y110 gate not PASS");
if (gate111.status !== "PASS") fail("Y111-Y120 gate not PASS");

const report = {
  phase: "Y121-Y130",
  title: "Yamaha Parser Unlock Stop Gate",
  status: "STOPPED_AS_DESIGNED",
  reason: "Parser implementation requires a separate explicit approval. Current approval only allows bounded read-only prefix scanner.",
  completedSafeChain: [
    "Y101-Y110 bounded read-only prefix scanner",
    "Y111-Y120 marker index planning from prefix report only"
  ],
  blockedUntilSeparateApproval: [
    "Full binary parse",
    "Chunk extraction beyond prefix planning",
    "Yamaha parser implementation",
    "Real keyboard binary writer",
    "Real .STY output",
    "Any destructive operation",
    "Deploy"
  ],
  nextApprovalRequiredText: "I approve implementing read-only Yamaha parser sandbox using approved fixtures. No writer, no real .STY output.",
  hardLocks: {
    fullFileRead: true,
    fullParse: true,
    parserImplementation: true,
    writerImplementation: true,
    realStyOutput: true,
    deploy: true
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y121-y130-parser-unlock-stop-gate-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y121-Y130 STOPPED AS DESIGNED]");
