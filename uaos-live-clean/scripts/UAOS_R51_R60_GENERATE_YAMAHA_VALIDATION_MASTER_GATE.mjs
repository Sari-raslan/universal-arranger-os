import fs from "node:fs";
import path from "node:path";
import {
  runR51R60YamahaValidationMasterGate,
  validateR51R60YamahaValidationMasterGate
} from "../src/real-writer-validation/r51-r60/yamahaValidationMasterGate.js";

const outDir = path.resolve("generated/real-writer-validation/r51-r60");
fs.mkdirSync(outDir, { recursive: true });

const report = runR51R60YamahaValidationMasterGate();
const valid = validateR51R60YamahaValidationMasterGate(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_R51_REAL_WRITER_VALIDATION_MASTER_GATE.json", report.reports.r51],
  ["UAOS_R52_YAMAHA_VALIDATION_MASTER_INDEX.json", report.reports.r52],
  ["UAOS_R53_WRITER_UNLOCK_AUDIT.json", report.reports.r53],
  ["UAOS_R54_SAFE_BASELINE_RELEASE_MANIFEST.json", report.reports.r54],
  ["UAOS_R55_REAL_WRITER_VALIDATION_HANDOVER.json", report.reports.r55],
  ["UAOS_R51_R60_YAMAHA_VALIDATION_MASTER_GATE_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_R51_R60_YAMAHA_VALIDATION_MASTER_GATE_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_R51_R60_YAMAHA_VALIDATION_MASTER_GATE_SUMMARY",
    version: "R51-R60.0.0",
    status: report.status,
    safeBaselineClosed: report.finalDecision.safeBaselineClosed,
    allowReadOnlyAnalysis: true,
    allowParserImplementation: false,
    allowFullBinaryParse: false,
    allowWriterImplementation: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    deployAllowed: false,
    nextPhase: "Manual approved fixture parser design, not writer"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_REAL_WRITER_VALIDATION_SAFE_BASELINE_HANDOVER.md"),
  [
    "# UAOS Real Writer Validation Safe Baseline",
    "",
    "Status: SAFE_BASELINE_CLOSED",
    "",
    "Target:",
    "Yamaha .STY first.",
    "",
    "Completed:",
    "- R1 Fixture Collector",
    "- R2-R6 Read-only Validation Program",
    "- R7-R10 Final Validation Safe Push",
    "- R11-R20 Targeted Fixture Validation",
    "- R21-R30 Yamaha Parser Sandbox",
    "- R31-R40 Yamaha Parser Planning Gates",
    "- R41-R50 Yamaha Unlock Requirements",
    "- R51-R60 Master Gate and Safe Baseline Closure",
    "",
    "Allowed:",
    "- metadata-only indexing",
    "- limited read-only prefix analysis",
    "- safe JSON reports",
    "- local-only planning",
    "",
    "Blocked:",
    "- real .STY writing",
    "- full binary parsing",
    "- parser implementation claim",
    "- writer implementation claim",
    "- fixture modification",
    "- fixture publishing",
    "- public deploy",
    "",
    "Next real work:",
    "Manual approved fixture parser design. Still not a writer."
  ].join("\n"),
  "utf8"
);

console.log("UAOS R51-R60 YAMAHA VALIDATION MASTER GATE GENERATION PASS");
