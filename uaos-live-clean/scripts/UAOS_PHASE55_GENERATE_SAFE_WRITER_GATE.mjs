import fs from "node:fs";
import path from "node:path";
import {
  createAllSafeWriterGates,
  validateSafeWriterGate
} from "../src/hardware/real-exporter/writer-gate/safeWriterGate.js";

const outDir = path.resolve("generated/real-exporter/writer-gate");
fs.mkdirSync(outDir, { recursive: true });

const evidence = {
  korg: { completedGates: ["format analyzer complete", "section binary mapping complete"] },
  yamaha: { completedGates: ["format analyzer complete", "section binary mapping complete"] },
  roland: { completedGates: ["format analyzer complete", "section binary mapping complete"] },
  ketron: { completedGates: ["format analyzer complete", "section binary mapping complete"] }
};

const gates = createAllSafeWriterGates(evidence);

for (const gate of gates) {
  const valid = validateSafeWriterGate(gate);
  if (!valid.ok) throw new Error(`${gate.target}: ${valid.errors.join(", ")}`);

  const file = path.join(outDir, `${gate.target}-safe-writer-gate.json`);
  fs.writeFileSync(file, JSON.stringify(gate, null, 2), "utf8");
  console.log(`WROTE ${file}`);
}

fs.writeFileSync(
  path.join(outDir, "all-safe-writer-gates.json"),
  JSON.stringify({
    format: "UAOS_ALL_SAFE_WRITER_GATES",
    version: "55.0.0",
    realKeyboardBinaryWriteAllowed: false,
    safeIntermediateWriteAllowed: true,
    count: gates.length,
    gates
  }, null, 2),
  "utf8"
);

console.log("PHASE 55 SAFE WRITER GATE GENERATION PASS");
