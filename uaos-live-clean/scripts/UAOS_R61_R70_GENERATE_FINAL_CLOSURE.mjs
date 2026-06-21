import fs from "node:fs";
import path from "node:path";
import {
  runR61R70FinalClosure,
  validateR61R70FinalClosure
} from "../src/real-writer-validation/r61-r70/realWriterValidationFinalClosure.js";

const outDir = path.resolve("generated/real-writer-validation/r61-r70");
fs.mkdirSync(outDir, { recursive: true });

const report = runR61R70FinalClosure();
const valid = validateR61R70FinalClosure(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_R61_FINAL_CLOSURE_AUDIT.json", report.reports.r61],
  ["UAOS_R62_MASTER_HANDOVER_PACK.json", report.reports.r62],
  ["UAOS_R63_FINAL_SAFETY_CERTIFICATE.json", report.reports.r63],
  ["UAOS_R64_NEXT_WORK_ROADMAP.json", report.reports.r64],
  ["UAOS_R65_FINAL_DASHBOARD_DATA.json", report.reports.r65],
  ["UAOS_R61_R70_REAL_WRITER_VALIDATION_FINAL_CLOSURE.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_R61_R70_REAL_WRITER_VALIDATION_FINAL_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_R61_R70_REAL_WRITER_VALIDATION_FINAL_SUMMARY",
    version: "R61-R70.0.0",
    status: report.status,
    finalClosureReady: true,
    safeBaselineClosed: true,
    targetPriority: "Yamaha .STY",
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
    nextProgram: "Manual Approved Yamaha Parser Design"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_REAL_WRITER_VALIDATION_FINAL_HANDOVER.md"),
  [
    "# UAOS Real Writer Validation Final Handover",
    "",
    "Status: SAFE_BASELINE_CLOSED",
    "",
    "Target priority: Yamaha .STY",
    "",
    "What is ready:",
    "- metadata fixture collector",
    "- read-only validation baseline",
    "- Yamaha parser sandbox planning",
    "- parser planning gates",
    "- writer unlock requirements",
    "- final safety certificate",
    "- final local dashboard",
    "",
    "What is NOT ready:",
    "- real .STY writer",
    "- full binary parser",
    "- Yamaha editor validation",
    "- Yamaha hardware validation",
    "- checksum/package writer",
    "- production deployment",
    "",
    "Next safe program:",
    "Manual Approved Yamaha Parser Design.",
    "",
    "No deploy was executed.",
    "No real keyboard binary file was written."
  ].join("\n"),
  "utf8"
);

console.log("UAOS R61-R70 REAL WRITER VALIDATION FINAL CLOSURE GENERATION PASS");
