/**
 * Render only the fixed example 05. Does not rewrite approved 01-04,06.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { runPipeline } from "../backend/src/render/musicalListeningPipeline.js";

const MUSICAL = "C:\\keyboard-manager-clean\\docs\\owner-listening-pack\\musical-examples";
const OLD = path.join(MUSICAL, "old-05-rejected-major-pop.wav");
const PREV = path.join(MUSICAL, "05-alternative-b-major-pop.wav");
const FIXED_ID = "05-alternative-in-context";
const FIXED = path.join(MUSICAL, `${FIXED_ID}.wav`);

if (!fs.existsSync(OLD) && fs.existsSync(PREV)) {
  fs.copyFileSync(PREV, OLD);
  const prevJson = path.join(MUSICAL, "05-alternative-b-major-pop.json");
  if (fs.existsSync(prevJson)) {
    fs.copyFileSync(prevJson, path.join(MUSICAL, "old-05-rejected-major-pop.json"));
  }
}

const pipeline = runPipeline({ variant: "alternative-in-context", includeArrangement: true });
if (!pipeline.rendered.ok) {
  throw new Error(pipeline.rendered.errorCode);
}
fs.writeFileSync(FIXED, pipeline.rendered.buffer);
const sha = crypto.createHash("sha256").update(pipeline.rendered.buffer).digest("hex");
const card = {
  id: FIXED_ID,
  title: "Alternative B — in-context Hijaz fill",
  SOURCE_INPUT: "Same Hijaz melody and maqam-compatible harmony as 01-04/06. Style/fill change only.",
  EXPECTED_CAPABILITY: "A style alternative that preserves tonal context. No unrequested reharmonization to major.",
  ACTUAL_ACTIONS: [
    "Score alternative against Hijaz pitch set",
    "Reject major-pop rewrite",
    "Arrange arabic-khaleeji-fill at 92 BPM with Hijaz color voicings",
    "Render independent sketch"
  ],
  WAV_PATH: FIXED,
  DURATION: pipeline.rendered.durationSec,
  SAMPLE_RATE: pipeline.rendered.sampleRate,
  SHA256: sha,
  SOURCE_COMMIT: "5aeac11779bd678ca3c80d16144e302a5eb5d9f6",
  SETTINGS: {
    variant: pipeline.decision.variant,
    tempo: pipeline.decision.tempo,
    groove: pipeline.decision.groove,
    harmony: pipeline.decision.harmony,
    sections: pipeline.score.sections,
    uniqueMidiCount: pipeline.rendered.analysis.uniqueMidiCount,
    uniqueOnsetCount: pipeline.rendered.analysis.uniqueOnsetCount,
    voices: pipeline.rendered.analysis.voices,
    scoring: pipeline.decision.scoring
  },
  WHAT_OWNER_SHOULD_LISTEN_FOR: "Same Hijaz tune as 04, denser fill/voicing, not a C-major rewrite. Compare OLD 05 vs this file.",
  KNOWN_LIMITATIONS: [
    "Offline oscillator sketch, not a sampled library and not real-time DSP.",
    "Not Musical Brain quality PASS.",
    "Original UAOS sketch — not product catalog content and not a licensed song."
  ],
  musicalQualityPass: false,
  musicalQualityClaim: false,
  sineFixture: false,
  technicalFixtureUsedAsMusicalProof: false,
  OWNER_RELISTEN_REQUIRED: "EXAMPLE_05_ONLY"
};
fs.writeFileSync(path.join(MUSICAL, `${FIXED_ID}.json`), JSON.stringify(card, null, 2));
console.log(JSON.stringify({
  ok: true,
  FIXED_05_PATH: FIXED,
  FIXED_05_SHA256: sha,
  OLD_05_PATH: OLD,
  scoring: pipeline.decision.scoring
}, null, 2));
