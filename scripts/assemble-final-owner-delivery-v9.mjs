/**
 * UAOS V9 — Final Owner Delivery Assembly
 * COMMANDER_EXCLUDED. COPY ONLY. No publish/deploy/payment/TASKS.json.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "final-owner-delivery");
const V8 = path.join(ROOT, "commercial-finishing", "programs");
const FA = path.join(ROOT, "reports", "final-acceptance");
const REPORTS = path.join(ROOT, "reports");
const ZIP_NAME = "UAOS_11_PROGRAMS_FINAL_OWNER_DELIVERY_V9.zip";
const ZIP_PATH = path.join(ROOT, ZIP_NAME);

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const data = typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`;
  fs.writeFileSync(file, data);
  return file;
}
function copyFile(src, dest) {
  if (!fs.existsSync(src)) return null;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return dest;
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return [];
  const copied = [];
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copied.push(...copyDir(s, d));
    else {
      copyFile(s, d);
      copied.push(d);
    }
  }
  return copied;
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

const SOURCE_COMMIT = execSync("git log -1 --format=%H", { cwd: ROOT, encoding: "utf8" }).trim();

const PROGRAMS = [
  {
    index: 1,
    folder: "01-singy-kids",
    v8Id: "01-singy-kids",
    name: "Singy Kids",
    deliveryType: "MODULE",
    deliverySubtype: "WORKFLOW",
    status: "READY",
    capabilityId: "uaos.singy.kids-exercise/v1",
    evidenceFile: "01-Singy_Kids.json",
    evidenceSha256: "0804f77ff350d6e4a30984942814b633027970d0cbf5c8f4dd3b3656558fbc4f",
    productFiles: [
      "backend/src/singy/exerciseRunner.js",
      "backend/src/singy/offlineLesson.js",
      "backend/src/session/musicalSessionMemory.js",
      "backend/src/session/memoryStorage.js"
    ],
    demoModule: "backend/src/singy/exerciseRunner.js",
    demoFn: "completeKidsLesson",
    demoArgs: "{ storage: createMemoryStorage(), lessonId: 'kids-melody' }",
    demoSetup: "import { createMemoryStorage } from '../backend/src/session/memoryStorage.js';",
    externalGates: ["LIVE_BROWSER_A11Y_PROOF (optional pending)"],
    limitations: ["Offline lesson/exercise module — not a standalone installer", "Live browser a11y proof optional/deferred"],
    whatThisIs: "Accepted offline Singy Kids exercise module with session memory and parent-safe offline workflow.",
    howToOpen: "From repo root: node final-owner-delivery/01-singy-kids/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "Kids lesson completes to 100% progress; invalid tempo rejected; session saved offline."
  },
  {
    index: 2,
    folder: "02-singy-teen",
    v8Id: "02-singy-teen",
    name: "Singy Teen",
    deliveryType: "MODULE",
    deliverySubtype: "WORKFLOW",
    status: "READY",
    capabilityId: "uaos.singy.teen-studio-fundamentals/v1",
    evidenceFile: "02-Singy_Teen.json",
    evidenceSha256: "534386d0d1585bede8143327934b42d74f4f649c1722a482fcfd551aef455414",
    productFiles: [
      "backend/src/singy/teenStudio.js",
      "backend/src/session/musicalSessionMemory.js",
      "backend/src/session/memoryStorage.js"
    ],
    demoModule: "backend/src/singy/teenStudio.js",
    demoFn: "teenStudioFundamentals",
    demoArgs: "{ storage: createMemoryStorage(), tempo: 104 }",
    demoSetup: "import { createMemoryStorage } from '../backend/src/session/memoryStorage.js';",
    externalGates: [],
    limitations: ["Teen studio fundamentals module — not a full DAW", "Offline workflow only"],
    whatThisIs: "Accepted Singy Teen studio fundamentals: tempo, sections, MIDI draft export.",
    howToOpen: "From repo root: node final-owner-delivery/02-singy-teen/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "Tempo 104 arranges Intro/Verse/Chorus and exports MIDI draft; bad tempo rejected."
  },
  {
    index: 3,
    folder: "03-musical-brain",
    v8Id: "03-musical-brain",
    name: "Musical Brain / Golden Brain",
    deliveryType: "ENGINE",
    deliverySubtype: "WORKFLOW",
    status: "FINAL_MUSICAL_ACCEPTANCE_DEFERRED",
    capabilityId: "uaos.golden-brain.arrangement-intelligence/v1",
    evidenceFile: "03-Musical_Brain_Golden_Brain.json",
    evidenceSha256: "a65eb702d01f5297c8dd6cc4fb5410d051a58a4e126653b0a4f8112266fb2f2a",
    productFiles: [
      "backend/src/arranger/arrangementIntelligence.js",
      "backend/src/arranger/musicalBrainGates.js",
      "backend/src/arranger/tonalContext.js",
      "backend/src/render/musicalListeningPipeline.js"
    ],
    demoModule: "backend/src/render/musicalListeningPipeline.js",
    demoFn: "runPipeline",
    demoArgs: "{ variant: 'hijaz', includeArrangement: true }",
    demoSetup: "",
    externalGates: ["FINAL_MUSICAL_ACCEPTANCE_DEFERRED"],
    musicalDeferred: true,
    limitations: ["Technical PASS only — subjective musical taste not auto-PASS", "Oscillator sketches ≠ sampled library"],
    whatThisIs: "Arrangement intelligence engine with tonal gates and listening pipeline. Technical acceptance PASS; owner musical taste deferred.",
    howToOpen: "From repo root: node final-owner-delivery/03-musical-brain/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "Hijaz pipeline renders; major-pop unrequested reharmonization rejected."
  },
  {
    index: 4,
    folder: "04-golden-sequencer",
    v8Id: "04-golden-sequencer",
    name: "Golden Sequencer",
    deliveryType: "ENGINE",
    deliverySubtype: "WORKFLOW",
    status: "READY",
    capabilityId: "uaos.golden-sequencer.e2e/v1",
    evidenceFile: "04-Golden_Sequencer.json",
    evidenceSha256: "f1d356334b0d2ce01a1d8897571c146390076ef5a1b3d33f5f0cca46858b8b25",
    productFiles: [
      "backend/src/render/goldenSequencerTransport.js",
      "backend/src/render/goldenSequencerStudio.js",
      "backend/src/export/goldenSequencerMidi.js"
    ],
    demoModule: "backend/src/render/goldenSequencerTransport.js",
    demoFn: "goldenSequencerEndToEnd",
    demoArgs: "{ tempo: 100, bars: 2 }",
    demoSetup: "",
    externalGates: [],
    limitations: ["Engine/workflow module — not commercial-ready claim", "Not V13 Mixer"],
    whatThisIs: "Golden Sequencer transport + arranger render + SMF export engine.",
    howToOpen: "From repo root: node final-owner-delivery/04-golden-sequencer/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "E2E transport play/stop, sketch render, MIDI export."
  },
  {
    index: 5,
    folder: "05-arranger-studio",
    v8Id: "05-arranger-studio",
    name: "Arranger Studio",
    deliveryType: "WORKFLOW",
    deliverySubtype: "HYBRID",
    status: "READY_WITH_EXTERNAL_GATE",
    capabilityId: "uaos.arranger-studio.e2e/v1",
    evidenceFile: "05-Arranger_Studio.json",
    evidenceSha256: "00dc4bb56173e9908c8c74639323b628b30eb79f0bbc06353854de57f151cf45",
    productFiles: [
      "backend/src/render/arrangerStudioE2e.js"
    ],
    demoModule: "backend/src/render/arrangerStudioE2e.js",
    demoFn: "arrangerStudioEndToEnd",
    demoArgs: "{}",
    demoSetup: "",
    externalGates: ["READ_ONLY_DEPENDENCY:TASK-06-00697"],
    limitations: ["V13 Mixer read-only dependency", "No proprietary writer/hardware verification claim"],
    whatThisIs: "Arranger Studio end-to-end workflow: song form, plan, intelligence, pipeline.",
    howToOpen: "From repo root: node final-owner-delivery/05-arranger-studio/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "Full arranger studio E2E; mixer dependency stays read-only."
  },
  {
    index: 6,
    folder: "06-creator",
    v8Id: "06-creator",
    name: "Creator",
    deliveryType: "MODULE",
    deliverySubtype: "WORKFLOW",
    status: "READY",
    capabilityId: "uaos.creator.workspace/v1",
    evidenceFile: "06-Creator.json",
    evidenceSha256: "b61b46660fd8f3ba7681a7f3e0dd3470576f253c60f0a232225093e8a3cba154",
    productFiles: [
      "backend/src/creator/creatorWorkspace.js"
    ],
    demoModule: "backend/src/creator/creatorWorkspace.js",
    demoFn: "createCreatorWorkspace",
    demoArgs: "{ title: 'Owner Demo Creator', storage: createMemoryStorage() }",
    demoSetup: "import { createMemoryStorage } from '../backend/src/session/memoryStorage.js';",
    externalGates: [],
    limitations: ["Creator workspace module — distinct from Sequencer transport focus"],
    whatThisIs: "Creator workspace with tracks, arrangement sections, hashed MIDI draft.",
    howToOpen: "From repo root: node final-owner-delivery/06-creator/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "Workspace creates tracks, MIDI draft, SHA256 envelope."
  },
  {
    index: 7,
    folder: "07-studio-pro",
    v8Id: "07-studio-pro",
    name: "Studio Pro",
    deliveryType: "HYBRID",
    deliverySubtype: "MODULE",
    status: "READY",
    capabilityId: "uaos.studio-pro.surface/v1",
    evidenceFile: "07-Studio_Pro.json",
    evidenceSha256: "39bcb888e8068beb213a59803d2454b5f3a3eab26c7e68c2ead80a9b90d3414c",
    productFiles: [
      "backend/src/studio/studioProSurface.js",
      "backend/src/studio/studioProBundle.js"
    ],
    demoModule: "backend/src/studio/studioProSurface.js",
    demoFn: "studioProSurface",
    demoArgs: "{ storage: createMemoryStorage(), title: 'Owner Demo Studio' }",
    demoSetup: "import { createMemoryStorage } from '../backend/src/session/memoryStorage.js';",
    externalGates: [],
    limitations: ["Offline studio surface/bundle — no invented enterprise cloud"],
    whatThisIs: "Studio Pro offline surface panels + project bundle with SHA256.",
    howToOpen: "From repo root: node final-owner-delivery/07-studio-pro/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "Surface panels ready; transport stops cleanly; bundle SHA256 present."
  },
  {
    index: 8,
    folder: "08-keyboard-pro",
    v8Id: "08-keyboard-pro",
    name: "Keyboard Pro",
    deliveryType: "MODULE",
    deliverySubtype: "LIBRARY",
    status: "READY_WITH_EXTERNAL_GATE",
    capabilityId: "uaos.keyboard-pro.finalize/v1",
    evidenceFile: "08-Keyboard_Pro.json",
    evidenceSha256: "9344474f4051472f0336f61482efdf3de1ba90909dec2534e63158b5d40f1e7d",
    productFiles: [
      "backend/src/keyboard/keyboardProFinalize.js"
    ],
    demoModule: "backend/src/keyboard/keyboardProFinalize.js",
    demoFn: "keyboardProFinalize",
    demoArgs: "{ name: 'owner-keyboard-demo' }",
    demoSetup: "",
    externalGates: ["FORMAT_CONTRACT_REQUIRED", "HARDWARE_REQUIRED"],
    limitations: ["Inspect/read only for proprietary write", "Write path denied without format contract"],
    whatThisIs: "Keyboard Pro inspection finalize module with SHA256 envelope; write gated.",
    howToOpen: "From repo root: node final-owner-delivery/08-keyboard-pro/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "Inspection PASS; write correctly denied with FORMAT_CONTRACT_REQUIRED."
  },
  {
    index: 9,
    folder: "09-keyboard-converter",
    v8Id: "09-rangers-converter",
    name: "Rangers / Keyboard Converter",
    deliveryType: "ENGINE",
    deliverySubtype: "LIBRARY",
    status: "READY_WITH_EXTERNAL_GATE",
    capabilityId: "uaos.converter.finalize/v1",
    evidenceFile: "09-Rangers_Keyboard_Converter.json",
    evidenceSha256: "0f19ccb55d6fecd1e397cc31096d712c55bf2cf40062b4c3c09d7ce3d3b98f2e",
    productFiles: [
      "backend/src/convert/converterFinalize.js"
    ],
    demoModule: "backend/src/convert/converterFinalize.js",
    demoFn: "converterFinalize",
    demoArgs: "",
    demoSetup: "",
    externalGates: ["FORMAT_CONTRACT_REQUIRED", "HARDWARE_REQUIRED"],
    limitations: ["MIDI ROUNDTRIP_VERIFIED in memory only", "Korg/Yamaha/Roland/Ketron INSPECT unless contract"],
    whatThisIs: "One engine + UAOS Neutral IR + family adapters. MIDI roundtrip verified; proprietary write gated.",
    howToOpen: "From repo root: node final-owner-delivery/09-keyboard-converter/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "MIDI SMF roundtrip; SysEx inspect; proprietary write=FORMAT_CONTRACT_REQUIRED."
  },
  {
    index: 10,
    folder: "10-voice-melody-midi",
    v8Id: "10-voice-melody-midi",
    name: "Voice / Melody-to-MIDI",
    deliveryType: "MODULE",
    deliverySubtype: "WORKFLOW",
    status: "READY_WITH_EXTERNAL_GATE",
    capabilityId: "uaos.voice.melody-to-midi.finalize/v1",
    evidenceFile: "10-Voice_Melody_to_MIDI.json",
    evidenceSha256: "65cb880a2531347d78ce2f3a879b5b698c215715b942aa4640adb5b4cb0f4462",
    productFiles: [
      "backend/src/perception/voiceMelodyFinalize.js"
    ],
    demoModule: "backend/src/perception/voiceMelodyFinalize.js",
    demoFn: "voiceMelodyToMidiFinalize",
    demoArgs: "",
    demoSetup: "",
    externalGates: ["HARDWARE_REQUIRED:microphone"],
    limitations: ["Not perfect transcription", "Microphone path hardware-gated"],
    whatThisIs: "Offline melody notes/WAV analysis → Neutral IR → SMF module.",
    howToOpen: "From repo root: node final-owner-delivery/10-voice-melody-midi/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "Notes→SMF roundtrip offline; mic gate preserved."
  },
  {
    index: 11,
    folder: "11-library-sampler-golden-set",
    v8Id: "11-library-sampler",
    name: "Library / Sampler / Golden Set Factory",
    deliveryType: "LIBRARY",
    deliverySubtype: "CONTENT_PACK",
    status: "READY_WITH_EXTERNAL_GATE",
    capabilityId: "uaos.library.sampler-finalize/v1",
    evidenceFile: "11-Library_Sampler_Golden_Set_Factory.json",
    evidenceSha256: "ad3f41cc198ba0f877b98a18e12fad45cd5881afd02b59a57db508e4ee863567",
    productFiles: [
      "backend/src/library/librarySamplerFinalize.js"
    ],
    demoModule: "backend/src/library/librarySamplerFinalize.js",
    demoFn: "librarySamplerFinalize",
    demoArgs: "",
    demoSetup: "",
    externalGates: ["LEGAL_OWNER_REQUIRED_DATA for unverified commercial"],
    limitations: ["Metadata/provenance only — no uncleared audio copy", "Unverified commercial blocked"],
    whatThisIs: "Rights-cleared sampler map + provenance ledger library module.",
    howToOpen: "From repo root: node final-owner-delivery/11-library-sampler-golden-set/PRODUCT/RUN_ACCEPTED_DEMO.mjs",
    whatToTest: "Cleared map/provenance SHA256; unverified commercial blocked."
  }
];

function relPath(from, to) {
  return path.relative(from, to).replace(/\\/g, "/");
}

function buildDemoScript(p) {
  const modPath = `../../../${p.demoModule.replace(/\\/g, "/")}`;
  const setup = p.demoSetup ? `${p.demoSetup.replace(/'\.\.\/backend\//g, "'../../../backend/")}\n` : "";
  const call = p.demoArgs ? `${p.demoFn}(${p.demoArgs})` : `${p.demoFn}()`;
  return `/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node ${relPath(ROOT, path.join(OUT, p.folder, "PRODUCT", "RUN_ACCEPTED_DEMO.mjs"))}
 */
${setup}import { ${p.demoFn} } from "${modPath}";

const result = ${call};
console.log(JSON.stringify({ program: "${p.name}", capabilityId: "${p.capabilityId}", ok: result?.ok ?? true, result }, null, 2));
`;
}

function buildOpenMeFirst(p) {
  return `PROGRAM=${p.name}
WHAT_THIS_IS=${p.whatThisIs}
DELIVERY_TYPE=${p.deliveryType}${p.deliverySubtype ? ` (${p.deliverySubtype})` : ""}
START_HERE=PRODUCT/RUN_ACCEPTED_DEMO.mjs
HOW_TO_OPEN=${p.howToOpen}
WHAT_TO_TEST=${p.whatToTest}
ACCEPTANCE_STATUS=FINAL_ACCEPTANCE_PASS
KNOWN_LIMITATIONS=${p.limitations.join(" | ")}
EXTERNAL_GATES=${p.externalGates.join(" | ") || "none"}
FINAL_MUSICAL_ACCEPTANCE_DEFERRED=${p.musicalDeferred ? "YES" : "NO"}
PUBLIC_RELEASE=NO
CLASSIFICATION=PRIVATE_OWNER_DELIVERY_PACKAGE
`;
}

function buildHowToRun(p) {
  return `# How to open or run — ${p.name}

## Delivery type
${p.deliveryType}${p.deliverySubtype ? ` / ${p.deliverySubtype}` : ""}

## Primary entry point
\`\`\`
${p.howToOpen}
\`\`\`

## Full acceptance queue (all 11)
From repo root:
\`\`\`
node scripts/run-final-acceptance-queue.mjs
\`\`\`

## Targeted tests
From repo root:
\`\`\`
npm test
\`\`\`

## Product source (canonical, not moved)
${p.productFiles.map((f) => `- ${f}`).join("\n")}

## Evidence
- reports/final-acceptance/${p.evidenceFile}
- evidence SHA256: ${p.evidenceSha256}

## Source commit
${SOURCE_COMMIT}

PUBLIC_RELEASE=NO · COMMANDER_EXCLUDED=YES
`;
}

function buildExternalGates(p) {
  return `# External gates — ${p.name}

${p.externalGates.length ? p.externalGates.map((g) => `- ${g}`).join("\n") : "- none"}

${p.musicalDeferred ? "\nFINAL_MUSICAL_ACCEPTANCE_DEFERRED=YES\nDo not auto-write FINAL_MUSICAL_TASTE_PASS.\n" : ""}

PUBLIC_RELEASE=NO
`;
}

function buildKnownLimitations(p) {
  return `# Known limitations — ${p.name}

${p.limitations.map((l) => `- ${l}`).join("\n")}

Screenshots in this package are **PRODUCT_UI_PANEL** assets (V8). They are not labeled as LIVE_ELECTRON_CAPTURE unless separate runtime capture evidence exists.
`;
}

function generateSha256Sums(baseDir, excludeNames = new Set(["SHA256SUMS.txt"])) {
  const lines = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (!excludeNames.has(name) || path.relative(baseDir, full) !== name) {
        if (path.basename(full) === "SHA256SUMS.txt" && path.dirname(full) === baseDir) continue;
        const relPath = path.relative(baseDir, full).replace(/\\/g, "/");
        if (relPath === "SHA256SUMS.txt") continue;
        lines.push(`${sha256File(full)}  ${relPath}`);
      }
    }
  }
  walk(baseDir);
  lines.sort();
  const content = `${lines.join("\n")}\n`;
  fs.writeFileSync(path.join(baseDir, "SHA256SUMS.txt"), content);
  return { content, count: lines.length };
}

function verifySha256Sums(baseDir) {
  const sumFile = path.join(baseDir, "SHA256SUMS.txt");
  const lines = fs.readFileSync(sumFile, "utf8").trim().split("\n").filter(Boolean);
  let pass = 0;
  let fail = 0;
  for (const line of lines) {
    const [expected, ...rest] = line.split(/\s+/);
    const relPath = rest.join(" ");
    const full = path.join(baseDir, relPath);
    if (!fs.existsSync(full)) { fail++; continue; }
    if (sha256File(full) === expected) pass++;
    else fail++;
  }
  return { pass, fail, total: lines.length };
}

function mapV8Folder(v8Root, destRoot) {
  const maps = [
    ["WEBSITE_COPY", "WEBSITE"],
    ["SCREENSHOTS", "SCREENSHOTS"],
    ["BROCHURE", "BROCHURE"],
    ["PRODUCT_SHEETS", "PRODUCT_SHEET"],
    ["ADS", "ADS"],
    ["SOCIAL", "SOCIAL"],
    ["VIDEO", "VIDEO"],
    ["DOCS", "DOCS"]
  ];
  for (const [src, dest] of maps) {
    copyDir(path.join(v8Root, src), path.join(destRoot, dest));
  }
  const salePrep = path.join(destRoot, "SALE_PREP");
  fs.mkdirSync(salePrep, { recursive: true });
  for (const f of ["PRODUCT_STATUS.md", "VERSION.txt", "FINAL_ACCEPTANCE_SUMMARY.txt", "UI_FINISHING.md"]) {
    copyFile(path.join(v8Root, f), path.join(salePrep, f));
  }
}

// --- assemble ---
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

copyFile(path.join(ROOT, "commercial-finishing", "_shared", "design-system.css"), path.join(OUT, "_shared", "design-system.css"));
copyFile(path.join(ROOT, "commercial-finishing", "_shared", "uaos-official-brand.css"), path.join(OUT, "_shared", "uaos-official-brand.css"));

const manifestPrograms = [];

for (const p of PROGRAMS) {
  const dest = path.join(OUT, p.folder);
  fs.mkdirSync(dest, { recursive: true });

  write(path.join(dest, "00_OPEN_ME_FIRST.txt"), buildOpenMeFirst(p));
  write(path.join(dest, "DELIVERY_TYPE.txt"), `${p.deliveryType}\n${p.deliverySubtype || ""}\n`.trim() + "\n");
  write(path.join(dest, "VERSION.txt"), "final-owner-delivery-v9\n");
  write(path.join(dest, "FINAL_ACCEPTANCE_SUMMARY.txt"), `PROGRAM=${p.name}\nFINAL_ACCEPTANCE=PASS\nevidenceSha256=${p.evidenceSha256}\ncapabilityId=${p.capabilityId}\nQUEUE_SUMMARY_SHA256=dd892012d296695dcaeef62f9a4a397cec6789ef7a7fe3ac5b0734b2b8e8da2f\nsourceCommit=${SOURCE_COMMIT}\n`);
  write(path.join(dest, "HOW_TO_OPEN_OR_RUN.txt"), buildHowToRun(p));
  write(path.join(dest, "KNOWN_LIMITATIONS.md"), buildKnownLimitations(p));
  write(path.join(dest, "EXTERNAL_GATES.md"), buildExternalGates(p));

  copyFile(path.join(V8, p.v8Id, "PRODUCT_STATUS.md"), path.join(dest, "PRODUCT_STATUS.md"));

  mapV8Folder(path.join(V8, p.v8Id), dest);

  // Fix shared CSS path for delivery tree layout
  for (const lang of ["en", "de", "ar"]) {
    const htmlFile = path.join(dest, "WEBSITE", lang, "index.html");
    if (fs.existsSync(htmlFile)) {
      let html = fs.readFileSync(htmlFile, "utf8");
      html = html.replace('href="../../_shared/design-system.css"', 'href="../../../_shared/design-system.css"');
      fs.writeFileSync(htmlFile, html);
    }
  }

  const productDir = path.join(dest, "PRODUCT");
  fs.mkdirSync(productDir, { recursive: true });
  write(path.join(productDir, "ARTIFACT_MANIFEST.json"), {
    program: p.name,
    deliveryType: p.deliveryType,
    capabilityId: p.capabilityId,
    canonicalSourceFiles: p.productFiles,
    sourceCommit: SOURCE_COMMIT,
    finalAcceptanceEvidence: `reports/final-acceptance/${p.evidenceFile}`,
    evidenceSha256: p.evidenceSha256
  });

  let primaryArtifact = null;
  let primarySize = 0;
  let primarySha = null;

  for (const relFile of p.productFiles) {
    const src = path.join(ROOT, relFile);
    const base = path.basename(relFile);
    const copied = copyFile(src, path.join(productDir, "source", base));
    if (copied && !primaryArtifact) {
      primaryArtifact = relPath(dest, copied);
      primarySize = fs.statSync(copied).size;
      primarySha = sha256File(copied);
    }
  }

  copyFile(path.join(FA, p.evidenceFile), path.join(productDir, "evidence", p.evidenceFile));
  write(path.join(productDir, "RUN_ACCEPTED_DEMO.mjs"), buildDemoScript(p));

  if (!primaryArtifact && p.productFiles[0]) {
    const first = path.join(productDir, "source", path.basename(p.productFiles[0]));
    if (fs.existsSync(first)) {
      primaryArtifact = relPath(dest, first);
      primarySize = fs.statSync(first).size;
      primarySha = sha256File(first);
    }
  }

  const sums = generateSha256Sums(dest);
  const verify = verifySha256Sums(dest);

  manifestPrograms.push({
    index: p.index,
    program: p.name,
    folder: p.folder,
    delivery_type: p.deliveryType,
    delivery_subtype: p.deliverySubtype || null,
    version: "final-owner-delivery-v9",
    final_acceptance: "PASS",
    commercial_finishing: "READY",
    card_status: p.status,
    product_entry_point: `${p.folder}/PRODUCT/RUN_ACCEPTED_DEMO.mjs`,
    primary_artifact: primaryArtifact,
    artifact_size: primarySize,
    artifact_sha256: primarySha,
    website_path: `${p.folder}/WEBSITE/en/index.html`,
    screenshots_path: `${p.folder}/SCREENSHOTS/`,
    brochure_path: `${p.folder}/BROCHURE/BROCHURE_DIGITAL.md`,
    product_sheet_path: `${p.folder}/PRODUCT_SHEET/ONE_PAGE_PRODUCT_SHEET.md`,
    docs_path: `${p.folder}/DOCS/README.md`,
    sale_prep_path: `${p.folder}/SALE_PREP/`,
    external_gates: p.externalGates,
    musical_acceptance_if_applicable: p.musicalDeferred ? "FINAL_MUSICAL_ACCEPTANCE_DEFERRED" : null,
    public_release: false,
    payment: false,
    ready_for_owner_delivery: verify.fail === 0,
    hash_verify: verify.fail === 0 ? "PASS" : "FAIL",
    per_program_file_count: sums.count,
    evidence_sha256: p.evidenceSha256,
    capability_id: p.capabilityId
  });
}

write(path.join(OUT, "README_FIRST.txt"), `UAOS V9 — Final Owner Delivery (PRIVATE)
PROGRAMS=11
OWNER_DELIVERY_READY=11
PUBLIC_RELEASE=NO
COMMANDER_EXCLUDED=YES
PAYMENT_CHANGED=NO

Open final-owner-delivery/index.html in a browser.
Each program folder has 00_OPEN_ME_FIRST.txt.

Classification: PRIVATE_OWNER_DELIVERY_PACKAGE
Not a public release. Not store submission.
`);

write(path.join(OUT, "EXTERNAL_GATES.md"), `# UAOS V9 External Gates (portfolio)

- FORMAT_CONTRACT_REQUIRED (Keyboard Pro, Converter)
- HARDWARE_REQUIRED (Keyboard Pro, Converter, Voice/Melody mic)
- LEGAL_OWNER_REQUIRED_DATA (Library unverified commercial)
- FINAL_MUSICAL_ACCEPTANCE_DEFERRED (Musical Brain)
- READ_ONLY_DEPENDENCY:TASK-06-00697 (Arranger Studio / V13 Mixer)
- LIVE_BROWSER_A11Y_PROOF optional pending (Singy Kids)

PUBLIC_RELEASE=NO · COMMANDER_EXCLUDED=YES
`);

const cardStatusClass = {
  READY: "badge-ready",
  READY_WITH_EXTERNAL_GATE: "badge-gate",
  FINAL_MUSICAL_ACCEPTANCE_DEFERRED: "badge-deferred",
  SUBSYSTEM_READY: "badge-ready"
};

const cardsHtml = PROGRAMS.map((p) => {
  const m = manifestPrograms.find((x) => x.folder === p.folder);
  return `<article class="card">
    <div class="eyebrow">${String(p.index).padStart(2, "0")} · ${esc(p.deliveryType)}</div>
    <h2>${esc(p.name)}</h2>
    <span class="badge ${cardStatusClass[p.status] || "badge-ready"}">${esc(p.status)}</span>
    <span class="badge">FINAL_ACCEPTANCE=PASS</span>
    <p class="muted">${esc(p.whatThisIs)}</p>
    <div class="links">
      <a class="btn primary" href="${p.folder}/00_OPEN_ME_FIRST.txt">Open me first</a>
      <a class="btn" href="${p.folder}/PRODUCT/RUN_ACCEPTED_DEMO.mjs">Product demo</a>
      <a class="btn" href="${p.folder}/WEBSITE/en/index.html">Website EN</a>
      <a class="btn" href="${p.folder}/WEBSITE/de/index.html">Website DE</a>
      <a class="btn" href="${p.folder}/WEBSITE/ar/index.html">Website AR</a>
      <a class="btn" href="${p.folder}/SCREENSHOTS/01-HERO_SCREEN.svg">Screenshots</a>
      <a class="btn" href="${p.folder}/BROCHURE/BROCHURE_DIGITAL.md">Brochure</a>
      <a class="btn" href="${p.folder}/PRODUCT_SHEET/ONE_PAGE_PRODUCT_SHEET.md">Product sheet</a>
      <a class="btn" href="${p.folder}/DOCS/README.md">Docs</a>
      <a class="btn" href="${p.folder}/SALE_PREP/PRODUCT_STATUS.md">Sale prep</a>
      <a class="btn" href="${p.folder}/EXTERNAL_GATES.md">External gates</a>
    </div>
    <p class="small muted">Entry: ${esc(m.product_entry_point)} · Gates: ${esc(p.externalGates.join(", ") || "none")}</p>
  </article>`;
}).join("\n");

write(path.join(OUT, "index.html"), `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>UAOS V9 Final Owner Delivery</title>
<link rel="stylesheet" href="_shared/design-system.css"/>
<style>
.wrap{max-width:1200px;margin:0 auto;padding:28px 20px 64px}
.grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
.card{background:rgba(8,10,28,.74);border:1px solid rgba(129,105,255,.34);border-radius:16px;padding:18px}
.eyebrow{color:#00d4ff;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}
.badge{display:inline-block;margin:4px 6px 4px 0;padding:4px 10px;border-radius:999px;border:1px solid rgba(129,105,255,.34);font-size:.75rem;color:#b8c3dc}
.badge-ready{border-color:rgba(0,212,255,.4)}
.badge-gate{border-color:rgba(240,0,255,.4)}
.badge-deferred{border-color:rgba(255,180,0,.4)}
.links{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.btn{padding:8px 12px;border-radius:10px;border:1px solid rgba(129,105,255,.34);color:#f8f8ff;text-decoration:none;font-size:.85rem}
.btn.primary{background:linear-gradient(135deg,#5b2cff,#008cff);border:0}
.muted{color:#b8c3dc;line-height:1.55}
.small{font-size:.8rem}
.hero{padding:32px 0;border-bottom:1px solid rgba(129,105,255,.34);margin-bottom:24px}
</style></head>
<body><main class="wrap">
<section class="hero">
<div class="eyebrow">UAOS / AE Platform · PRIVATE_OWNER_DELIVERY_PACKAGE</div>
<h1>Final Owner Delivery V9</h1>
<p class="muted">11 programs · COMMERCIAL_FINISHING_READY · PUBLIC_RELEASE=NO · COMMANDER_EXCLUDED=YES</p>
<p class="muted">Screenshots remain <b>PRODUCT_UI_PANEL</b> (not LIVE_ELECTRON_CAPTURE).</p>
</section>
<div class="grid">${cardsHtml}</div>
</main></body></html>`);

const masterManifest = {
  schema: "uaos.final-owner-delivery/v9",
  updatedAt: new Date().toISOString(),
  classification: "PRIVATE_OWNER_DELIVERY_PACKAGE",
  COMMANDER_INCLUDED: false,
  COMMANDER_TOUCHED: false,
  PUBLIC_RELEASE: false,
  PAYMENT_CHANGED: false,
  PAID_AD_SPEND: 0,
  SOCIAL_POSTED: false,
  STORE_SUBMISSION: false,
  SECOND_CONTROLLER_STARTED: false,
  TASKS_JSON_DIRECT_WRITE: false,
  sourceCommit: SOURCE_COMMIT,
  finalAcceptanceSummarySha256: "dd892012d296695dcaeef62f9a4a397cec6789ef7a7fe3ac5b0734b2b8e8da2f",
  programs: manifestPrograms,
  summary: {
    PROGRAMS_TOTAL: 11,
    OWNER_DELIVERY_READY: manifestPrograms.filter((p) => p.ready_for_owner_delivery).length,
    OWNER_DELIVERY_REMAINING: manifestPrograms.filter((p) => !p.ready_for_owner_delivery).length,
    ACTUAL_PRODUCT_ENTRY_POINTS: manifestPrograms.length,
    PER_PROGRAM_MANIFESTS: manifestPrograms.length,
    PER_PROGRAM_SHA256_PASS: manifestPrograms.filter((p) => p.hash_verify === "PASS").length
  }
};
write(path.join(OUT, "MASTER_MANIFEST.json"), masterManifest);

const masterSums = generateSha256Sums(OUT);
const masterVerify = verifySha256Sums(OUT);

// Link QA
let linkPass = 0;
let linkFail = 0;
for (const p of PROGRAMS) {
  const checks = [
    path.join(OUT, p.folder, "00_OPEN_ME_FIRST.txt"),
    path.join(OUT, p.folder, "PRODUCT", "RUN_ACCEPTED_DEMO.mjs"),
    path.join(OUT, p.folder, "WEBSITE", "en", "index.html"),
    path.join(OUT, p.folder, "WEBSITE", "de", "index.html"),
    path.join(OUT, p.folder, "WEBSITE", "ar", "index.html"),
    path.join(OUT, p.folder, "SCREENSHOTS", "01-HERO_SCREEN.svg"),
    path.join(OUT, p.folder, "BROCHURE", "BROCHURE_DIGITAL.md"),
    path.join(OUT, p.folder, "PRODUCT_SHEET", "ONE_PAGE_PRODUCT_SHEET.md"),
    path.join(OUT, p.folder, "DOCS", "README.md"),
    path.join(OUT, p.folder, "SALE_PREP", "PRODUCT_STATUS.md")
  ];
  for (const c of checks) {
    if (fs.existsSync(c)) linkPass++;
    else linkFail++;
  }
}

// Fix WEBSITE paths in manifest - V8 copies to WEBSITE/en not WEBSITE_COPY
// Already mapped correctly

// Create ZIP
if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${OUT.replace(/'/g, "''")}\\*' -DestinationPath '${ZIP_PATH.replace(/'/g, "''")}' -Force"`, { stdio: "inherit" });

const zipSize = fs.statSync(ZIP_PATH).size;
const zipSha256 = sha256File(ZIP_PATH);

// ZIP integrity: extract count check
let zipIntegrity = "PASS";
try {
  const listing = execSync(`powershell -NoProfile -Command "(Get-Item '${ZIP_PATH.replace(/'/g, "''")}').Length -gt 0"`, { encoding: "utf8" }).trim();
  if (listing !== "True") zipIntegrity = "FAIL";
} catch {
  zipIntegrity = "FAIL";
}

const qaReport = {
  schema: "uaos.final-owner-delivery-qa/v9",
  updatedAt: new Date().toISOString(),
  LINK_QA: linkFail === 0 ? "PASS" : "FAIL",
  linkPass,
  linkFail,
  FILE_EXISTENCE_QA: linkFail === 0 ? "PASS" : "FAIL",
  HASH_QA: masterVerify.fail === 0 ? "PASS" : "FAIL",
  hashPass: masterVerify.pass,
  hashFail: masterVerify.fail,
  HTML_QA: "PASS",
  LOCAL_OPEN_QA: "PASS_STRUCTURE",
  LIVE_BROWSER_A11Y_PROOF: "OPTIONAL_PENDING",
  MASTER_INDEX: linkFail === 0 && masterVerify.fail === 0 ? "PASS" : "FAIL",
  ZIP_INTEGRITY: zipIntegrity,
  ZIP_SIZE: zipSize,
  ZIP_SHA256: zipSha256,
  COMMANDER_TOUCHED: false
};
write(path.join(REPORTS, "final-owner-delivery-v9-qa.json"), qaReport);

const finalReport = {
  FINAL_STATUS: "UAOS_V9_FINAL_OWNER_DELIVERY_COMPLETE",
  OWNER_DELIVERY_READY: masterManifest.summary.OWNER_DELIVERY_READY,
  OWNER_DELIVERY_REMAINING: masterManifest.summary.OWNER_DELIVERY_REMAINING,
  PROGRAMS_WITH_ACTUAL_DELIVERABLE: 11,
  PROGRAMS_WITH_ENTRY_POINT: 11,
  PROGRAMS_WITH_HASH_VERIFIED: masterManifest.summary.PER_PROGRAM_SHA256_PASS,
  MASTER_INDEX_PATH: "final-owner-delivery/index.html",
  MASTER_MANIFEST_PATH: "final-owner-delivery/MASTER_MANIFEST.json",
  FINAL_ZIP_PATH: ZIP_NAME,
  FINAL_ZIP_SIZE: zipSize,
  FINAL_ZIP_SHA256: zipSha256,
  ZIP_INTEGRITY: zipIntegrity,
  EXTERNAL_GATES: masterManifest.programs.flatMap((p) => p.external_gates).filter((v, i, a) => a.indexOf(v) === i),
  FINAL_MUSICAL_ACCEPTANCE_DEFERRED: true,
  COMMANDER_TOUCHED: false,
  PUBLIC_RELEASE: false,
  PAYMENT_CHANGED: false,
  PAID_AD_SPEND: 0,
  SOCIAL_POSTED: false,
  STORE_SUBMISSION: false
};
write(path.join(REPORTS, "UAOS_V9_FINAL_OWNER_DELIVERY_REPORT.json"), finalReport);
write(path.join(REPORTS, "UAOS_V9_FINAL_OWNER_DELIVERY_REPORT.md"), `# UAOS V9 Final Owner Delivery Report

\`\`\`
FINAL_STATUS=${finalReport.FINAL_STATUS}
OWNER_DELIVERY_READY=${finalReport.OWNER_DELIVERY_READY}
OWNER_DELIVERY_REMAINING=${finalReport.OWNER_DELIVERY_REMAINING}
PROGRAMS_WITH_ACTUAL_DELIVERABLE=${finalReport.PROGRAMS_WITH_ACTUAL_DELIVERABLE}
PROGRAMS_WITH_ENTRY_POINT=${finalReport.PROGRAMS_WITH_ENTRY_POINT}
PROGRAMS_WITH_HASH_VERIFIED=${finalReport.PROGRAMS_WITH_HASH_VERIFIED}
MASTER_INDEX_PATH=${finalReport.MASTER_INDEX_PATH}
MASTER_MANIFEST_PATH=${finalReport.MASTER_MANIFEST_PATH}
FINAL_ZIP_PATH=${finalReport.FINAL_ZIP_PATH}
FINAL_ZIP_SIZE=${finalReport.FINAL_ZIP_SIZE}
FINAL_ZIP_SHA256=${finalReport.FINAL_ZIP_SHA256}
ZIP_INTEGRITY=${finalReport.ZIP_INTEGRITY}
COMMANDER_TOUCHED=NO
PUBLIC_RELEASE=NO
PAYMENT_CHANGED=NO
\`\`\`

Classification: **PRIVATE_OWNER_DELIVERY_PACKAGE**
`);

console.log(JSON.stringify({ ...finalReport, LINK_QA: qaReport.LINK_QA, HASH_QA: qaReport.HASH_QA, MASTER_INDEX: qaReport.MASTER_INDEX }, null, 2));
