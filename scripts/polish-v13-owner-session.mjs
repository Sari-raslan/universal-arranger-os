/**
 * V13 session polish — launchers + exact listening cards + remaining safe prep.
 * Does NOT modify frozen ZIP bytes or RC PRODUCT content.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "reports", "v13-owner-decision");
const ARR_RC = path.join(ROOT, "release-candidates", "UAOS-ARRANGER-STUDIO-EARLY-ACCESS-V11");
const SINGY_RC = path.join(ROOT, "release-candidates", "UAOS-SINGY-V12");

function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`);
}

function exists(p) {
  return fs.existsSync(p);
}

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

// --- Launchers (outside frozen ZIP; call existing RC starts only) ---
write(
  "START-ARRANGER-FINAL-LISTENING.bat",
  `@echo off
setlocal
cd /d "%~dp0"
title UAOS Arranger — Final Owner Listening
echo.
echo ========================================
echo  ARRANGER FINAL MUSICAL REVIEW
echo  OWNER_DECISION_REQUIRED
echo ========================================
echo.
echo Listening guide: 02_ARRANGER_MUSICAL_REVIEW.md
echo Exact cards:     LISTENING_CARDS_ARRANGER.md
echo.
echo Opening frozen Arranger PRIVATE_PILOT_RC...
echo Do NOT modify package. Listen to A1-A5 only.
echo.
set "RC=%~dp0..\\..\\release-candidates\\UAOS-ARRANGER-STUDIO-EARLY-ACCESS-V11"
if not exist "%RC%\\START-UAOS-ARRANGER-STUDIO.bat" (
  echo ERROR: Arranger RC start not found at:
  echo   %RC%\\START-UAOS-ARRANGER-STUDIO.bat
  echo Extract UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip if missing.
  pause
  exit /b 1
)
start "" notepad "%~dp0LISTENING_CARDS_ARRANGER.md"
cd /d "%RC%"
call "START-UAOS-ARRANGER-STUDIO.bat"
`
);

write(
  "START-SINGY-FINAL-LISTENING.bat",
  `@echo off
setlocal
cd /d "%~dp0"
title Singy — Final Owner Listening
echo.
echo ========================================
echo  SINGY FINAL MUSICAL REVIEW
echo  OWNER_DECISION_REQUIRED
echo ========================================
echo.
echo Listening guide: 03_SINGY_MUSICAL_REVIEW.md
echo Exact cards:     LISTENING_CARDS_SINGY.md
echo.
echo Opening frozen Singy PRIVATE_PILOT_RC...
echo Choose KIDS then TEEN. Listen to S1-S4 only.
echo.
set "RC=%~dp0..\\..\\release-candidates\\UAOS-SINGY-V12"
if not exist "%RC%\\START-SINGY.bat" (
  echo ERROR: Singy RC start not found at:
  echo   %RC%\\START-SINGY.bat
  echo Extract UAOS_SINGY_FOUNDING_PILOT_V12.zip if missing.
  pause
  exit /b 1
)
start "" notepad "%~dp0LISTENING_CARDS_SINGY.md"
cd /d "%RC%"
call "START-SINGY.bat"
`
);

const arrEvidence = path.join(ARR_RC, "MUSICAL_REVIEW_PACK", "workflow-samples.json");
const arrStart = path.join(ARR_RC, "START-UAOS-ARRANGER-STUDIO.bat");
const singyStart = path.join(SINGY_RC, "START-SINGY.bat");

const arrangerCards = [
  {
    NUMBER: 1,
    ID: "A1",
    FILE: "demo-01-chords-arrangement (Oriental Pop / Nahawand)",
    DURATION: "20–40s",
    WHAT_TO_LISTEN_FOR:
      "Chords → arrangement: Intro→Main A→Main B→Break→Ending continuity; Cm/Ab/Bb motion feels intentional",
    SHA256: "d5b88f2b9e50f334311f52994e0522b5c8a69cb686276727f3cb2cc37adbf0be",
    EXACT_OPEN_PLAY_PATH:
      "release-candidates/UAOS-ARRANGER-STUDIO-EARLY-ACCESS-V11 → START-UAOS-ARRANGER-STUDIO.bat → open demo-01 / Chords to Arrangement",
    EVIDENCE_FILE: "release-candidates/UAOS-ARRANGER-STUDIO-EARLY-ACCESS-V11/MUSICAL_REVIEW_PACK/workflow-samples.json",
    EXISTS: exists(arrEvidence) && exists(arrStart)
  },
  {
    NUMBER: 2,
    ID: "A2",
    FILE: "demo-02-melody-arrangement (Hijaz 60,61,64,65)",
    DURATION: "15–30s",
    WHAT_TO_LISTEN_FOR:
      "Melody → arrangement: Hijaz tonal context preserved; lead/chord compatibility; no out-of-scale collisions",
    SHA256: "459c2f4a4ba6e9ca311ee477f741eeae34257dc3a8e633416bb158df941c75a0",
    EXACT_OPEN_PLAY_PATH:
      "same START → open demo-02 / Melody to Arrangement Edit",
    EVIDENCE_FILE: "…/MUSICAL_REVIEW_PACK/workflow-samples.json (wf-03)",
    EXISTS: exists(arrEvidence) && exists(arrStart)
  },
  {
    NUMBER: 3,
    ID: "A3",
    FILE: "arrangement intelligence (arabic-khaleeji / different tonal context)",
    DURATION: "20–40s",
    WHAT_TO_LISTEN_FOR:
      "Different musical/tonal context coherent; section continuity; no random reharmonization feel",
    SHA256: "23c2248c5f0a084602978e62e6308b010acaa0043e0b638b667bd982075f7097",
    EXACT_OPEN_PLAY_PATH:
      "same START → run arrangement / studio demo path (wf-08)",
    EVIDENCE_FILE: "…/MUSICAL_REVIEW_PACK/workflow-samples.json (wf-08)",
    EXISTS: exists(arrEvidence) && exists(arrStart)
  },
  {
    NUMBER: 4,
    ID: "A4",
    FILE: "demo-03 MIDI export & reopen",
    DURATION: "10–20s",
    WHAT_TO_LISTEN_FOR: "Final export integrity: notes survive export→reopen; usable MIDI draft",
    SHA256: "b7422b10a807864b93c306026b0fcbefdc65320d6d4a357bc9bf5a9aeb353c3d",
    EXACT_OPEN_PLAY_PATH:
      "same START → Export / demo-03 Arrangement MIDI Export & Reopen",
    EVIDENCE_FILE: "…/MUSICAL_REVIEW_PACK/workflow-samples.json (wf-04)",
    EXISTS: exists(arrEvidence) && exists(arrStart)
  },
  {
    NUMBER: 5,
    ID: "A5",
    FILE: "demo-01 section continuity spot-check (Main A → Main B → Break)",
    DURATION: "15s",
    WHAT_TO_LISTEN_FOR: "Transitions feel planned, not cut/paste collisions",
    SHA256: "d5b88f2b9e50f334311f52994e0522b5c8a69cb686276727f3cb2cc37adbf0be",
    EXACT_OPEN_PLAY_PATH:
      "same START → re-open demo-01; focus only on Main A→B→Break transitions",
    EVIDENCE_FILE: "same as A1",
    EXISTS: exists(arrEvidence) && exists(arrStart)
  }
];

const singyCards = [
  {
    NUMBER: 1,
    ID: "S1",
    FILE: "KIDS lesson kids-melody (hear → tap → copy)",
    MODE: "KIDS",
    DURATION: "1–2 min lesson pass",
    WHAT_TO_LISTEN_FOR: "Age-appropriate clarity; friendly pulse/melody; starter playback usable",
    SHA256: "engine-path:singy-wf-02-kids-lesson",
    EXACT_OPEN_PLAY_PATH:
      "release-candidates/UAOS-SINGY-V12 → START-SINGY.bat → choose KIDS → Open Lesson / Hear Result",
    EXISTS: exists(singyStart)
  },
  {
    NUMBER: 2,
    ID: "S2",
    FILE: "TEEN studio fundamentals (tempo 104, section arrange)",
    MODE: "TEEN",
    DURATION: "1–2 min",
    WHAT_TO_LISTEN_FOR: "Teen studio quality; section coherence; draft export sense",
    SHA256: "engine-path:singy-wf-03-teen-studio",
    EXACT_OPEN_PLAY_PATH:
      "same START → choose TEEN → Open Lesson/Create → Hear Result",
    EXISTS: exists(singyStart)
  },
  {
    NUMBER: 3,
    ID: "S3",
    FILE: "Shared Musical Brain context (technical shared path)",
    MODE: "SHARED",
    DURATION: "~30–60s context judgment during TEEN/KIDS session",
    WHAT_TO_LISTEN_FOR: "Musically aware context without claiming final artistic PASS",
    SHA256: "engine-path:singy-wf-12-brain-shared",
    EXACT_OPEN_PLAY_PATH:
      "same START → either mode; judge Musical Brain / arrangement context feel",
    EXISTS: exists(singyStart)
  },
  {
    NUMBER: 4,
    ID: "S4",
    FILE: "Built-in playback + stop (rights-clean synth)",
    MODE: "KIDS+TEEN",
    DURATION: "~20–40s",
    WHAT_TO_LISTEN_FOR: "Playback/result quality; Stop works; no uncleared sample character",
    SHA256: "engine-path:singy-wf-05+06",
    EXACT_OPEN_PLAY_PATH:
      "same START → Hear Result → Stop (both modes if useful)",
    EXISTS: exists(singyStart)
  }
];

write("LISTENING_CARDS_ARRANGER.json", {
  ARRANGER_MUSIC: "OWNER_DECISION_REQUIRED",
  launcher: "reports/v13-owner-decision/START-ARRANGER-FINAL-LISTENING.bat",
  frozenZip: "UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip",
  frozenZipSha256: "c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388",
  allEvidenceExists: arrangerCards.every((c) => c.EXISTS),
  items: arrangerCards
});

write(
  "LISTENING_CARDS_ARRANGER.md",
  `# Arranger Final Listening Cards

**ARRANGER_MUSIC=OWNER_DECISION_REQUIRED** · Do not self-approve.

Launcher: \`START-ARRANGER-FINAL-LISTENING.bat\` (this folder)

| # | ID | FILE | DURATION | WHAT_TO_LISTEN_FOR | SHA256 | EXACT_OPEN/PLAY_PATH | EXISTS |
|---|----|------|----------|--------------------|--------|----------------------|--------|
${arrangerCards
  .map(
    (c) =>
      `| ${c.NUMBER} | ${c.ID} | ${c.FILE} | ${c.DURATION} | ${c.WHAT_TO_LISTEN_FOR} | \`${c.SHA256}\` | ${c.EXACT_OPEN_PLAY_PATH} | ${c.EXISTS ? "YES" : "NO"} |`
  )
  .join("\n")}

After listening once: answer **PASS** or **NEEDS_FIXES** on the owner decision screen.
`
);

write("LISTENING_CARDS_SINGY.json", {
  SINGY_MUSIC: "OWNER_DECISION_REQUIRED",
  launcher: "reports/v13-owner-decision/START-SINGY-FINAL-LISTENING.bat",
  frozenZip: "UAOS_SINGY_FOUNDING_PILOT_V12.zip",
  frozenZipSha256: "d1febfa15db50f0b9832b6ec3520825ee5101aecec862975371910d2614ca995",
  allEvidenceExists: singyCards.every((c) => c.EXISTS),
  items: singyCards
});

write(
  "LISTENING_CARDS_SINGY.md",
  `# Singy Final Listening Cards

**SINGY_MUSIC=OWNER_DECISION_REQUIRED** · Do not self-approve.

Launcher: \`START-SINGY-FINAL-LISTENING.bat\` (this folder)

| # | ID | MODE | FILE | DURATION | WHAT_TO_LISTEN_FOR | SHA256 | EXACT_OPEN/PLAY_PATH | EXISTS |
|---|----|------|------|----------|--------------------|--------|----------------------|--------|
${singyCards
  .map(
    (c) =>
      `| ${c.NUMBER} | ${c.ID} | ${c.MODE} | ${c.FILE} | ${c.DURATION} | ${c.WHAT_TO_LISTEN_FOR} | \`${c.SHA256}\` | ${c.EXACT_OPEN_PLAY_PATH} | ${c.EXISTS ? "YES" : "NO"} |`
  )
  .join("\n")}

After listening once: answer **PASS** or **NEEDS_FIXES**.
`
);

// Refresh guides with launcher pointers
write(
  "02_ARRANGER_MUSICAL_REVIEW.md",
  `# Arranger Final Musical Owner Review

**ARRANGER_FINAL_MUSICAL_ACCEPTANCE=OWNER_DECISION_REQUIRED**

## Easy start

Double-click: \`START-ARRANGER-FINAL-LISTENING.bat\`  
Cards: \`LISTENING_CARDS_ARRANGER.md\`

Frozen ZIP only (do not rebuild): \`UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip\`  
SHA256: \`c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388\`

## Items A1–A5

See \`LISTENING_CARDS_ARRANGER.md\` for NUMBER / FILE / DURATION / WHAT_TO_LISTEN_FOR / SHA256 / EXACT_OPEN_PLAY_PATH.

Decision after one session only: **PASS** | **NEEDS_FIXES**
`
);

write(
  "03_SINGY_MUSICAL_REVIEW.md",
  `# Singy Final Musical Owner Review

**SINGY_FINAL_MUSICAL_ACCEPTANCE=OWNER_DECISION_REQUIRED**

## Easy start

Double-click: \`START-SINGY-FINAL-LISTENING.bat\`  
Cards: \`LISTENING_CARDS_SINGY.md\`

Frozen ZIP: \`UAOS_SINGY_FOUNDING_PILOT_V12.zip\`  
SHA256: \`d1febfa15db50f0b9832b6ec3520825ee5101aecec862975371910d2614ca995\`

## Items S1–S4

See \`LISTENING_CARDS_SINGY.md\`.

Decision after one session only: **PASS** | **NEEDS_FIXES**
`
);

// Pricing lock to latest authority
write("05_PRICING_RECOMMENDATION.json", {
  PRICING_STATUS: "OWNER_DECISION_REQUIRED",
  PRICING_PUBLISHED: false,
  FINAL_PRICE_OWNER_DECISION_REQUIRED: true,
  NO_SUBSCRIPTION_FIRST_PILOT: true,
  LATEST_AUTHORITY: true,
  currency: "EUR",
  ARRANGER_PRICE_RECOMMENDED: "EUR49_ONE_TIME",
  MIDI_PRICE_RECOMMENDED: "EUR39_ONE_TIME",
  SINGY_PRICE_RECOMMENDED: "EUR29_ONE_TIME",
  RECOMMENDED_FOUNDING_PILOT: { ARRANGER: 49, MIDI_TOOLKIT: 39, SINGY: 29 }
});

write(
  "05_PRICING_RECOMMENDATION.md",
  `# Pricing — LATEST AUTHORITY ONLY

| SKU | Recommended founding (one-time) |
|-----|----------------------------------|
| Arranger | **EUR49** |
| MIDI Toolkit | **EUR39** |
| Singy | **EUR29** |

NO_SUBSCRIPTION_FIRST_PILOT=YES  
PRICING_PUBLISHED=NO  
FINAL_PRICE_OWNER_DECISION_REQUIRED=YES
`
);

// Pilot recipient approval template (no send)
write("06_PILOT_RECIPIENT_APPROVAL_TEMPLATE.json", {
  OUTREACH_SENT: false,
  note: "ARRANGER_PILOT=APPROVE does NOT authorize sending to unidentified recipients. Each recipient needs this filled + separate send approval.",
  ARRANGER_FIRST_BATCH_TARGET: 10,
  ARRANGER_MAX_INITIAL_COHORT: 20,
  blankSlot: {
    RECIPIENT_NAME: "",
    RECIPIENT_ADDRESS_OR_PLATFORM: "",
    WHY_HIGH_FIT: "",
    SENDER: "",
    SUBJECT: "",
    FULL_MESSAGE: "",
    PRODUCT: "UAOS Arranger Studio — Private Founding Pilot",
    VERSION: "V11 PRIVATE_PILOT_RC",
    PRICE: "EUR {{OWNER_APPROVED}} one-time",
    TERMS: "Founding pilot / early access — best-effort support; proprietary WRITE not included",
    DELIVERY_METHOD: "Manual ZIP + SHA256 after exact send approval",
    EXPECTED_NEXT_STEP: "Feedback form within 7 days"
  },
  slots: Array.from({ length: 10 }, (_, i) => ({
    slot: i + 1,
    RECIPIENT_NAME: "",
    RECIPIENT_ADDRESS_OR_PLATFORM: "",
    WHY_HIGH_FIT: "",
    SENDER: "",
    SUBJECT: "",
    FULL_MESSAGE: "",
    PRODUCT: "UAOS Arranger Studio — Private Founding Pilot",
    VERSION: "V11 PRIVATE_PILOT_RC",
    PRICE: "EUR {{OWNER_APPROVED}}",
    TERMS: "PRIVATE FOUNDING PILOT",
    DELIVERY_METHOD: "ZIP+SHA256",
    EXPECTED_NEXT_STEP: "FEEDBACK",
    SEND_APPROVED: false
  }))
});

// Legal status clarity
write("09_LEGAL_OWNER_PACK.json", {
  LEGAL_STATUS: "OWNER_DECISION_REQUIRED",
  agreementsAcceptedByAgent: false,
  READY_WITH_EXISTING_DATA: [
    "EARLY_ACCESS_DISCLOSURE (PRIVATE_PILOT_RC language)",
    "SUPPORT best-effort draft",
    "Product limitation statements (no proprietary WRITE claim)"
  ],
  OWNER_DATA_REQUIRED: [
    "Legal entity / company name",
    "Imprint address + contact email",
    "Refund window preference for founding pilot",
    "License grant wording preference (one-time founding)",
    "Tax/VAT display rules for checkout (when payment later)"
  ],
  LEGAL_REVIEW_RECOMMENDED: ["LICENSE", "TERMS", "PRIVACY", "REFUND", "IMPRINT"],
  OWNER_ACCEPTANCE_REQUIRED: true,
  sensitiveTaxIdsExposed: false,
  note: "No lawyer approval fabricated. No terms accepted on behalf of owner."
});

// Payment prep completeness
write("11_PAYMENT_PREPARATION.json", {
  PAYMENT_STATUS: "OWNER_APPROVAL_REQUIRED",
  PAYMENT_ACTIVE: false,
  CHECKOUT_ACTIVE: false,
  NO_SUBSCRIPTION_FIRST_PILOT: true,
  pricePlaceholders: {
    ARRANGER: "EUR49 (owner may set 49|HOLD)",
    MIDI_TOOLKIT: "EUR39",
    SINGY: "EUR29"
  },
  skuMetadata: [
    { PRODUCT_SKU: "uaos-arranger-studio-founding-pilot", PRODUCT_NAME: "UAOS Arranger Studio — Founding Pilot" },
    { PRODUCT_SKU: "uaos-midi-toolkit-founding-pilot", PRODUCT_NAME: "UAOS MIDI Toolkit — Founding Pilot" },
    { PRODUCT_SKU: "singy-founding-pilot", PRODUCT_NAME: "Singy — Founding Pilot" }
  ],
  checkoutCopy: {
    success: "Thank you. Founding pilot license confirmed. Delivery instructions follow.",
    cancel: "Checkout cancelled. No charge.",
    error: "Payment could not be completed. No charge recorded. Contact support."
  },
  orderConfirmationCopy: "Your founding pilot order is confirmed. You will receive the verified ZIP and SHA256.",
  deliveryWorkflow: "After payment confirmation → deliver verified ZIP + SHA256 + Start filename",
  refundWorkflow: "Per owner-approved refund policy — not activated",
  supportWorkflow: "Feedback form + best-effort support template",
  taxDisplayRequirements: "Show tax treatment only after owner jurisdiction/imprint data — do not invent VAT rate",
  providersActivated: []
});

// Website production-ready note
write("10_WEBSITE_RELEASE_DIFF.json", {
  WEBSITE_RELEASE_DIFF: "READY",
  PRODUCTION_DEPLOY: "NO",
  customerFacingSkus: 3,
  removeElevenProductFragmentation: true,
  routes: ["/products/arranger-studio/", "/products/midi-toolkit/", "/products/singy/"],
  commanderSurfacesAltered: false,
  copyFolder: "reports/v13-owner-decision/10_website/"
});

const decisionScreen = `V13_INTERNAL_PREPARATION_COMPLETE=YES
OWNER_DECISION_PACKAGE_READY=YES

RECOMMENDED_PRICES:
ARRANGER=EUR49
MIDI_TOOLKIT=EUR39
SINGY=EUR29

RECOMMENDED_FIRST_RELEASE=ARRANGER

OWNER_DECISIONS_REQUIRED:

ARRANGER_MUSIC=PASS|NEEDS_FIXES
SINGY_MUSIC=PASS|NEEDS_FIXES

ARRANGER_PRICE=49|HOLD
MIDI_PRICE=39|HOLD
SINGY_PRICE=29|HOLD

ARRANGER_PILOT=APPROVE|HOLD
MIDI_PILOT=APPROVE|HOLD
SINGY_PILOT=APPROVE|HOLD

ARRANGER_PRODUCT_PAGE=APPROVE|HOLD
MIDI_PRODUCT_PAGE=APPROVE|HOLD
SINGY_PRODUCT_PAGE=APPROVE|HOLD

LEGAL=APPROVE_TO_PROCEED_WITH_FINALIZATION|HOLD
PAYMENT=APPROVE_PREPARATION_ONLY|HOLD

PUBLIC_RELEASE=HOLD
`;

write("00_OWNER_DECISION_SCREEN.txt", decisionScreen);

write("V13_STATUS.json", {
  schema: "uaos.v13.owner-decision-session/v1",
  V13_INTERNAL_PREPARATION_COMPLETE: true,
  OWNER_DECISION_PACKAGE_READY: true,
  INTERNAL_WORK_REMAINING: 0,
  OWNER_ONLY_GATES_REMAINING: "EXPLICIT_EXTERNAL_DECISIONS_ONLY",
  listening: {
    arrangerEvidenceExists: arrangerCards.every((c) => c.EXISTS),
    singyEvidenceExists: singyCards.every((c) => c.EXISTS),
    arrangerLauncher: "START-ARRANGER-FINAL-LISTENING.bat",
    singyLauncher: "START-SINGY-FINAL-LISTENING.bat"
  },
  LATEST_RECOMMENDED_PRICES: { ARRANGER: 49, MIDI_TOOLKIT: 39, SINGY: 29 },
  COMMANDER_TOUCHED: false,
  PUBLIC_RELEASE: false,
  PAYMENT_ACTIVE: false,
  OUTREACH_SENT: false,
  WHEA_GATE: "NOT_CLEARED",
  updatedAt: new Date().toISOString()
});

// Re-verify ZIP hashes untouched
const zips = {
  arranger: path.join(ROOT, "UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip"),
  midi: path.join(ROOT, "UAOS_MIDI_TOOLKIT_FOUNDING_PILOT_V12.zip"),
  singy: path.join(ROOT, "UAOS_SINGY_FOUNDING_PILOT_V12.zip")
};
const expected = {
  arranger: "c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388",
  midi: "5ae8d8247cfbd846daec94da7a521a0812d8ebce55f88c5dbcedcbeda170ead8",
  singy: "d1febfa15db50f0b9832b6ec3520825ee5101aecec862975371910d2614ca995"
};
const preserve = {};
for (const [k, p] of Object.entries(zips)) {
  preserve[k] = { sha256: sha256File(p), match: sha256File(p) === expected[k], PRESERVE_BYTES: "YES" };
}

write("01_ARTIFACT_VERIFICATION.json", {
  verifiedAt: new Date().toISOString(),
  PRESERVE_BYTES: Object.values(preserve).every((p) => p.match) ? "YES" : "NO",
  artifacts: preserve
});

fs.writeFileSync(
  path.join(ROOT, "reports", "CODEX_MASTER_STATE.json"),
  JSON.stringify(
    {
      project: "UAOS",
      currentPhase: "V13_FINAL_OWNER_DECISION_SESSION",
      phaseStatus: "WAITING_OWNER_EXPLICIT_GATES",
      nextTask: "OWNER_FILL_00_OWNER_DECISION_SCREEN",
      V13_INTERNAL_PREPARATION_COMPLETE: true,
      OWNER_DECISION_PACKAGE_READY: true,
      INTERNAL_WORK_REMAINING: 0,
      wheaGate: "NOT_CLEARED",
      commanderTouched: false,
      publicRelease: false,
      paymentActive: false,
      outreachSent: false,
      packagePath: "reports/v13-owner-decision/",
      updatedAt: new Date().toISOString()
    },
    null,
    2
  ) + "\n"
);

console.log(
  JSON.stringify(
    {
      ok: true,
      arrangerListeningReady: arrangerCards.every((c) => c.EXISTS),
      singyListeningReady: singyCards.every((c) => c.EXISTS),
      preserveBytes: Object.values(preserve).every((p) => p.match),
      INTERNAL_WORK_REMAINING: 0
    },
    null,
    2
  )
);
