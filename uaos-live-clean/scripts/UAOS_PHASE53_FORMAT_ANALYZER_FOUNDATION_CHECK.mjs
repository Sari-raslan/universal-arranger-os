import fs from "node:fs";
import { runAllFormatAnalyzers } from "../src/hardware/real-exporter/analyzers/formatAnalyzerFoundation.js";

const all = runAllFormatAnalyzers();

if (!all.ok) throw new Error("Analyzer result not ok.");
if (all.reportCount !== 4) throw new Error(`Expected 4 reports, got ${all.reportCount}`);
if (all.realBinaryWriterReady !== false) throw new Error("Must not claim real binary writer ready.");

const required = [
  "generated/real-exporter/analysis/korg-format-analysis.json",
  "generated/real-exporter/analysis/yamaha-format-analysis.json",
  "generated/real-exporter/analysis/roland-format-analysis.json",
  "generated/real-exporter/analysis/ketron-format-analysis.json",
  "generated/real-exporter/analysis/all-format-analysis.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing analysis file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (json.realBinaryWriterReady === true || json?.safety?.realBinaryWriterReady === true) {
    throw new Error(`Unsafe readiness claim in ${file}`);
  }
  console.log(`OK ${file}`);
}

console.log("PHASE 53 FORMAT ANALYZER FOUNDATION CHECK PASS");
