import fs from "node:fs";
import path from "node:path";
import {
  buildYamahaStyPhraseEventSchema,
  validateYamahaStyPhraseEventSchema
} from "../src/hardware/real-exporter/yamaha-sty/yamahaStyPhraseEventBuilder.js";

const outDir = path.resolve("generated/real-exporter/yamaha-sty");
fs.mkdirSync(outDir, { recursive: true });

const schema = buildYamahaStyPhraseEventSchema({
  styleName: "UAOS Oriental Yamaha Phrase Research",
  tempo: 104,
  timeSignature: "4/4"
});

const valid = validateYamahaStyPhraseEventSchema(schema);
if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-phrase-event-schema.json"),
  JSON.stringify(schema, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "yamaha-sty-phrase-event-summary.json"),
  JSON.stringify({
    format: "UAOS_YAMAHA_STY_PHRASE_EVENT_SUMMARY",
    version: "58.0.0",
    target: "yamaha",
    futureFormat: ".STY",
    sectionCount: schema.phraseEventSummary.sectionCount,
    trackCount: schema.phraseEventSummary.trackCount,
    eventCount: schema.phraseEventSummary.eventCount,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    nextPhase: 59,
    nextPhaseName: "Yamaha STY Safe Container Plan"
  }, null, 2),
  "utf8"
);

console.log("PHASE 58 YAMAHA STY PHRASE EVENT GENERATION PASS");
