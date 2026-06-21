import fs from "node:fs";
import {
  createYamahaStyIntermediateSchema,
  validateYamahaStyIntermediateSchema
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyIntermediateSchema.js";

const schema = createYamahaStyIntermediateSchema();
const valid = validateYamahaStyIntermediateSchema(schema);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-exporter/yamaha-sty/yamaha-sty-intermediate-schema.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-schema-summary.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (json.realStyWriterReady === true || json.realKeyboardBinaryWriteAllowed === true) {
    throw new Error(`Unsafe readiness claim in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("PHASE 57 YAMAHA STY SCHEMA CHECK PASS");
