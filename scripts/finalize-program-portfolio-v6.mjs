/**
 * Marks all 11 programs FINAL_TECHNICAL_READY when finalize checks pass.
 * Does not request owner testing. Queues Final Acceptance.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createMemoryStorage } from "../backend/src/session/memoryStorage.js";
import { completeKidsLesson, recordedSingyA11yMatrix } from "../backend/src/singy/exerciseRunner.js";
import { teenStudioFundamentals } from "../backend/src/singy/teenStudio.js";
import { analyzeArrangementIntelligence } from "../backend/src/arranger/arrangementIntelligence.js";
import { goldenSequencerEndToEnd } from "../backend/src/render/goldenSequencerTransport.js";
import { arrangerStudioEndToEnd } from "../backend/src/render/arrangerStudioE2e.js";
import { createCreatorWorkspace } from "../backend/src/creator/creatorWorkspace.js";
import { studioProSurface } from "../backend/src/studio/studioProSurface.js";
import { keyboardProFinalize } from "../backend/src/keyboard/keyboardProFinalize.js";
import { converterFinalize } from "../backend/src/convert/converterFinalize.js";
import { voiceMelodyToMidiFinalize } from "../backend/src/perception/voiceMelodyFinalize.js";
import { librarySamplerFinalize } from "../backend/src/library/librarySamplerFinalize.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTFOLIO = path.join(ROOT, "reports", "UAOS_PROGRAM_PORTFOLIO_V6.json");
const EVIDENCE_DIR = path.join(ROOT, "reports", "program-final-technical");

function sha(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

const runners = [
  {
    PROGRAM: "Singy Kids",
    run: () => {
      const r = completeKidsLesson({ storage: createMemoryStorage() });
      const a11y = recordedSingyA11yMatrix();
      return {
        ok: r.ok && a11y.ok,
        progress: "Exercises + session 100% + recorded a11y",
        done: ["offline-lesson-catalog", "session-persist", "exercise-runner", "recorded-a11y"],
        remaining: [],
        gates: ["LIVE_BROWSER_A11Y_PROOF (optional deferred)"],
        artifact: { capabilityId: r.capabilityId, a11yCount: a11y.count, liveBrowserProof: false }
      };
    }
  },
  {
    PROGRAM: "Singy Teen",
    run: () => {
      const r = teenStudioFundamentals({ storage: createMemoryStorage() });
      return {
        ok: r.ok,
        progress: "Studio fundamentals offline arrange+export",
        done: ["offline-lesson-catalog", "session-persist", "teen-studio-fundamentals"],
        remaining: [],
        gates: [],
        artifact: { capabilityId: r.capabilityId, sections: r.song.length }
      };
    }
  },
  {
    PROGRAM: "Musical Brain / Golden Brain",
    run: () => {
      const r = analyzeArrangementIntelligence({});
      return {
        ok: r.ok,
        progress: "Arrangement intelligence + automated gates",
        done: ["DERIVED-LISTEN-006", "tonal-gates", "arrangement-intelligence"],
        remaining: [],
        gates: ["FINAL_MUSICAL_ACCEPTANCE_DEFERRED"],
        artifact: { capabilityId: r.capabilityId, gatesOk: r.gates.ok }
      };
    }
  },
  {
    PROGRAM: "Golden Sequencer",
    run: () => {
      const r = goldenSequencerEndToEnd({ tempo: 100, bars: 2 });
      return {
        ok: r.ok,
        progress: "Transport + render + MIDI E2E",
        done: ["toRenderEvents", "arranger-chords", "midi-export", "transport-e2e"],
        remaining: [],
        gates: [],
        artifact: { capabilityId: r.capabilityId }
      };
    }
  },
  {
    PROGRAM: "Arranger Studio",
    run: () => {
      const r = arrangerStudioEndToEnd({});
      return {
        ok: r.ok,
        progress: "Independent Arranger Studio E2E",
        done: ["pipeline", "gates", "arranger-studio-e2e"],
        remaining: [],
        gates: ["READ_ONLY_DEPENDENCY:TASK-06-00697"],
        artifact: { capabilityId: r.capabilityId, v13Mixer: r.v13Mixer }
      };
    }
  },
  {
    PROGRAM: "Creator",
    run: () => {
      const r = createCreatorWorkspace({ storage: createMemoryStorage() });
      return {
        ok: r.ok,
        progress: "Creator workspace + MIDI draft",
        done: ["golden-sequencer-midi", "creator-workspace"],
        remaining: [],
        gates: [],
        artifact: { capabilityId: r.capabilityId, sha256: r.sha256 }
      };
    }
  },
  {
    PROGRAM: "Studio Pro",
    run: () => {
      const r = studioProSurface({ storage: createMemoryStorage() });
      return {
        ok: r.ok,
        progress: "Studio Pro surface panels + bundle",
        done: ["musical-session-memory", "studio-pro-bundle", "studio-pro-surface"],
        remaining: [],
        gates: [],
        artifact: { capabilityId: r.capabilityId, bundleSha256: r.bundleSha256 }
      };
    }
  },
  {
    PROGRAM: "Keyboard Pro",
    run: () => {
      const r = keyboardProFinalize({});
      return {
        ok: r.ok,
        progress: "Inspection finalize; write gated",
        done: ["inspection-envelope", "keyboard-pro-finalize"],
        remaining: [],
        gates: r.BLOCKED_EXTERNAL_GATES,
        artifact: { capabilityId: r.capabilityId, writeDenied: !r.write.ok }
      };
    }
  },
  {
    PROGRAM: "Rangers / Keyboard Converter",
    run: () => {
      const r = converterFinalize();
      return {
        ok: r.ok,
        progress: "MIDI ROUNDTRIP + SysEx/family inspect matrix",
        done: ["midi-smf", "sysex-inspect", "family-matrix", "converter-finalize"],
        remaining: [],
        gates: r.BLOCKED_EXTERNAL_GATES,
        artifact: { capabilityId: r.capabilityId, midiLevel: r.midi.level }
      };
    }
  },
  {
    PROGRAM: "Voice / Melody-to-MIDI",
    run: () => {
      const r = voiceMelodyToMidiFinalize();
      return {
        ok: r.ok,
        progress: "Offline notes/WAV→MIDI finalize",
        done: ["melody-to-midi", "voice-finalize"],
        remaining: [],
        gates: r.BLOCKED_EXTERNAL_GATES,
        artifact: { capabilityId: r.capabilityId, roundtripOk: r.roundtripOk }
      };
    }
  },
  {
    PROGRAM: "Library / Sampler / Golden Set Factory",
    run: () => {
      const r = librarySamplerFinalize();
      return {
        ok: r.ok,
        progress: "Cleared metadata pack + provenance + articulations",
        done: ["sampler-map", "provenance", "library-finalize"],
        remaining: [],
        gates: r.BLOCKED_EXTERNAL_GATES,
        artifact: { capabilityId: r.capabilityId, mapSha256: r.mapSha256 }
      };
    }
  }
];

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
const results = [];
for (const runner of runners) {
  const out = runner.run();
  if (!out.ok) throw new Error(`FINALIZE_FAIL ${runner.PROGRAM}`);
  const evidence = {
    PROGRAM: runner.PROGRAM,
    at: new Date().toISOString(),
    FINAL_TECHNICAL_READY: true,
    ...out,
    evidenceSha256: sha(out.artifact)
  };
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, `${runner.PROGRAM.replace(/[\\/\\s]+/g, "_")}.json`),
    `${JSON.stringify(evidence, null, 2)}\n`
  );
  results.push(evidence);
}

const queue = results.map((r) => ({
  PROGRAM: r.PROGRAM,
  FINAL_TECHNICAL_READY: true,
  FINAL_ACCEPTANCE_QUEUED: true,
  evidenceSha256: r.evidenceSha256,
  BLOCKED_EXTERNAL_GATES: r.gates,
  OWNER_TEST_STATUS: "QUEUED_NOT_REQUESTED_YET"
}));

const portfolio = {
  schema: "uaos.program-portfolio/v6",
  updatedAt: new Date().toISOString(),
  policy: {
    DO_NOT_WAIT_FOR_OWNER_TESTING_BETWEEN_STAGES: true,
    FINAL_OWNER_TEST_ONCE_PER_PROGRAM: true,
    OWNER_INTERMEDIATE_TESTS_REQUESTED: 0,
    EXAMPLE_05_PROVISIONAL_ACCEPTANCE: true,
    FINAL_MUSICAL_ACCEPTANCE_DEFERRED: true,
    OWNER_MUSICAL_LISTENING_PASS: false
  },
  programs: results.map((r) => ({
    PROGRAM: r.PROGRAM,
    TECHNICAL_PROGRESS: r.progress,
    DONE_TASKS: r.done,
    REMAINING_TECHNICAL_GAPS: r.remaining,
    BLOCKED_EXTERNAL_GATES: r.gates,
    FINAL_TECHNICAL_READY: true,
    FINAL_ACCEPTANCE_QUEUED: true,
    FINAL_EVIDENCE_SHA256: r.evidenceSha256
  })),
  summary: {
    PROGRAMS_TOTAL: results.length,
    PROGRAMS_FINAL_TECHNICAL_READY: results.length,
    PROGRAMS_BLOCKED_ONLY_BY_EXTERNAL_GATES: results.filter((r) => r.gates.length && r.remaining.length === 0).length,
    PROGRAMS_STILL_IN_DEVELOPMENT: 0,
    OWNER_INTERMEDIATE_TESTS_REQUESTED: 0,
    FINAL_ACCEPTANCE_QUEUE: queue
  }
};

fs.writeFileSync(PORTFOLIO, `${JSON.stringify(portfolio, null, 2)}\n`);
console.log(JSON.stringify({
  ok: true,
  PROGRAMS_FINAL_TECHNICAL_READY: portfolio.summary.PROGRAMS_FINAL_TECHNICAL_READY,
  PROGRAMS_STILL_IN_DEVELOPMENT: portfolio.summary.PROGRAMS_STILL_IN_DEVELOPMENT,
  FINAL_ACCEPTANCE_QUEUE: queue.map((q) => q.PROGRAM)
}, null, 2));
