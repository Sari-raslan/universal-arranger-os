import fs from "node:fs";
import {
  createAllSafeWriterGates,
  validateSafeWriterGate
} from "../src/hardware/real-exporter/writer-gate/safeWriterGate.js";

const gates = createAllSafeWriterGates();

if (gates.length !== 4) throw new Error(`Expected 4 gates, got ${gates.length}`);

for (const gate of gates) {
  const valid = validateSafeWriterGate(gate);
  if (!valid.ok) throw new Error(`${gate.target}: ${valid.errors.join(", ")}`);

  if (gate.realKeyboardBinaryWriteAllowed !== false) {
    throw new Error(`${gate.target}: unsafe writer allowed`);
  }

  const file = `generated/real-exporter/writer-gate/${gate.target}-safe-writer-gate.json`;
  if (!fs.existsSync(file)) throw new Error(`Missing generated gate file: ${file}`);

  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (json.realKeyboardBinaryWriteAllowed !== false) {
    throw new Error(`${gate.target}: generated file unsafe`);
  }

  console.log(`OK ${gate.target}`);
}

if (!fs.existsSync("generated/real-exporter/writer-gate/all-safe-writer-gates.json")) {
  throw new Error("Missing all safe writer gates file.");
}

console.log("PHASE 55 SAFE WRITER GATE CHECK PASS");
