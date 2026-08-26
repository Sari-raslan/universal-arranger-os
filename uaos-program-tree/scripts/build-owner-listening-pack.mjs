import fs from "node:fs";
import path from "node:path";
import { exportListeningMix } from "file:///C:/keyboard-manager-clean/backend/src/export/listeningFixture.js";
import { analyzeMonophonicWav, writePcm16MonoSine } from "file:///C:/keyboard-manager-clean/backend/src/perception/melodyAnalysis.js";

const packDir = "C:\\keyboard-manager-clean\\docs\\owner-listening-pack";
const fixtureDir = path.join(packDir, "fixtures");
fs.mkdirSync(fixtureDir, { recursive: true });

const mixDest = path.join(fixtureDir, "technical-mix-not-musical-proof.wav");
const mix = exportListeningMix({ destinationPath: mixDest });
if (!mix.ok) throw new Error(mix.errorCode || "listening mix export failed");

const sineDest = path.join(fixtureDir, "a440-sine-analysis-fixture.wav");
const sine = writePcm16MonoSine(440, 0.4);
fs.writeFileSync(sineDest, sine);
const analysis = analyzeMonophonicWav(sine);

const manifest = {
  schema: "uaos.owner-listening-pack/v1",
  createdAt: new Date().toISOString(),
  musicalQualityClaim: false,
  musicalQualityPass: false,
  autoApprovesMusicalBrain: false,
  taskNotApproved: "TASK-05-00605-MUSICAL_BRAIN_CONTRACT",
  fixtures: [
    {
      id: "technical-mix",
      path: mixDest,
      sha256: mix.sha256,
      bytes: mix.bytes,
      durationSec: mix.analysis?.durationSec,
      note: "Offline mix of two synthetic sines. Technical WAV only."
    },
    {
      id: "a440-sine",
      path: sineDest,
      midiDetected: analysis.notes?.[0]?.midi,
      note: "Pitch-analysis fixture. Not a song."
    }
  ],
  truth: [
    "Technical WAV success does not prove musical quality",
    "Fixtures are not product content",
    "Studio Offline Render is not Real-time DSP",
    "KORG WRITE_UNSUPPORTED",
    "Commander not activated",
    "TASK-05-00605 remains OWNER_GATE until the owner listens"
  ]
};
fs.writeFileSync(path.join(packDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ ok: true, mixDest, sha256: mix.sha256, midi: analysis.notes?.[0]?.midi }, null, 2));
