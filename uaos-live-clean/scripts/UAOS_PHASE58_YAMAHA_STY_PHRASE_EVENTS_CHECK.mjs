import fs from "node:fs";
import {
  buildYamahaStyPhraseEventSchema,
  validateYamahaStyPhraseEventSchema
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyPhraseEventBuilder.js";

const schema = buildYamahaStyPhraseEventSchema();
const valid = validateYamahaStyPhraseEventSchema(schema);

if (!valid.ok) throw new Error(valid.errors.join(", "));
if (schema.phraseEventSummary.eventCount <= 0) throw new Error("Expected phrase events.");

const required = [
  "generated/real-exporter/yamaha-sty/yamaha-sty-phrase-event-schema.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-phrase-event-summary.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (json.realStyWriterReady === true || json.realKeyboardBinaryWriteAllowed === true) {
    throw new Error(`Unsafe readiness claim in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("PHASE 58 YAMAHA STY PHRASE EVENTS CHECK PASS");
