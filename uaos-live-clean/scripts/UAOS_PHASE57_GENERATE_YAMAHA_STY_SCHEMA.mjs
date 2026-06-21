import fs from "node:fs";
import path from "node:path";
import {
  createYamahaStyIntermediateSchema,
  validateYamahaStyIntermediateSchema
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyIntermediateSchema.js";

const outDir = path.resolve("generated/real-exporter/yamaha-sty");
fs.mkdirSync(outDir, { recursive: true });

const schema = createYamahaStyIntermediateSchema({
  styleName: "UAOS Oriental Yamaha Research",
  tempo: 104,
  timeSignature: "4/4"
});

const valid = validateYamahaStyIntermediateSchema(schema);
if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-intermediate-schema.json"),
  JSON.stringify(schema, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-schema-summary.json"),
  JSON.stringify({
    format: "UAOS_YAMAHA_STY_SCHEMA_SUMMARY",
    version: "57.0.0",
    target: "yamaha",
    futureFormat: ".STY",
    sectionCount: schema.sections.length,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    nextPhase: 58,
    nextPhaseName: "Yamaha STY Phrase Event Builder"
  }, null, 2),
  "utf8"
);

console.log("PHASE 57 YAMAHA STY SCHEMA GENERATION PASS");
