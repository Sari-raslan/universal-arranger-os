import fs from "node:fs";
import path from "node:path";
import { runAllFormatAnalyzers } from "../src/hardware/real-exporter/analyzers/formatAnalyzerFoundation.js";

const outDir = path.resolve("generated/real-exporter/analysis");
fs.mkdirSync(outDir, { recursive: true });

const all = runAllFormatAnalyzers();

if (!all.ok) {
  throw new Error("Format analyzer run failed.");
}

for (const report of all.reports) {
  const file = path.join(outDir, `${report.target}-format-analysis.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
  console.log(`WROTE ${file}`);
}

fs.writeFileSync(
  path.join(outDir, "all-format-analysis.json"),
  JSON.stringify(all, null, 2),
  "utf8"
);

console.log("PHASE 53 FORMAT ANALYSIS GENERATION PASS");
