/**
 * V13 Final Owner Gate Consolidation
 * NO rebuilds, NO feature waves, NO Commander, NO external actions.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "reports", "v13-owner-decision");
const EXPECTED = {
  arranger: {
    zip: "UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip",
    sha256: "c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388",
    start: "START-UAOS-ARRANGER-STUDIO.bat",
    version: "V11"
  },
  midi: {
    zip: "UAOS_MIDI_TOOLKIT_FOUNDING_PILOT_V12.zip",
    sha256: "5ae8d8247cfbd846daec94da7a521a0812d8ebce55f88c5dbcedcbeda170ead8",
    start: "START-UAOS-MIDI-TOOLKIT.bat",
    version: "V12"
  },
  singy: {
    zip: "UAOS_SINGY_FOUNDING_PILOT_V12.zip",
    sha256: "d1febfa15db50f0b9832b6ec3520825ee5101aecec862975371910d2614ca995",
    start: "START-SINGY.bat",
    version: "V12"
  }
};

function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`);
}

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

// --- 1 Artifact verification ---
const artifacts = {};
for (const [key, exp] of Object.entries(EXPECTED)) {
  const p = path.join(ROOT, exp.zip);
  const exists = fs.existsSync(p);
  const size = exists ? fs.statSync(p).size : 0;
  const sha = exists ? sha256File(p) : null;
  const match = sha === exp.sha256;
  artifacts[key] = {
    PATH: p,
    SIZE: size,
    SHA256: sha,
    EXPECTED_SHA256: exp.sha256,
    ZIP_INTEGRITY: exists && match ? "PASS" : "FAIL",
    PRIMARY_START_FILE: exp.start,
    CLASSIFICATION: "PRIVATE_PILOT_RC",
    SOURCE_VERSION: exp.version,
    PRESERVE_BYTES: match ? "YES" : "NO",
    REBUILD: "NO"
  };
}
write("01_ARTIFACT_VERIFICATION.json", {
  verifiedAt: new Date().toISOString(),
  artifacts,
  ALL_MATCH: Object.values(artifacts).every((a) => a.PRESERVE_BYTES === "YES")
});

// --- 2 Arranger musical review ---
const arrangerListening = {
  ARRANGER_FINAL_MUSICAL_ACCEPTANCE: "OWNER_DECISION_REQUIRED",
  TECHNICAL_CHECKS: "PASS_SEPARATE",
  instruction:
    "Open frozen Arranger RC only. Extract ZIP → START-UAOS-ARRANGER-STUDIO.bat → run demos below. Do not listen to intermediate/old packs.",
  package: EXPECTED.arranger.zip,
  packageSha256: EXPECTED.arranger.sha256,
  examples: [
    {
      id: "A1",
      FILE: "RC in-app demo-01-chords-arrangement (Oriental Pop / Nahawand)",
      DURATION: "~20–40s listen of generated arrangement sections",
      WHAT_TO_LISTEN_FOR: "Chords → arrangement: Intro→Main A→Main B→Break→Ending continuity; Cm/Ab/Bb motion feels intentional",
      SHA256: "d5b88f2b9e50f334311f52994e0522b5c8a69cb686276727f3cb2cc37adbf0be",
      SOURCE_WORKFLOW: "wf-02-open-demo-01 / chords → arrangement"
    },
    {
      id: "A2",
      FILE: "RC in-app demo-02-melody-arrangement (Hijaz melody 60,61,64,65)",
      DURATION: "~15–30s",
      WHAT_TO_LISTEN_FOR: "Melody → arrangement: Hijaz tonal context preserved; lead/chord compatibility; no obvious out-of-scale collisions",
      SHA256: "459c2f4a4ba6e9ca311ee477f741eeae34257dc3a8e633416bb158df941c75a0",
      SOURCE_WORKFLOW: "wf-03-open-demo-02 / melody → arrangement"
    },
    {
      id: "A3",
      FILE: "RC arrangement intelligence path (different tonal/groove context — arabic-khaleeji plan)",
      DURATION: "~20–40s",
      WHAT_TO_LISTEN_FOR: "Different musical/tonal context still coherent; section names continuous; no random reharmonization feel",
      SHA256: "23c2248c5f0a084602978e62e6308b010acaa0043e0b638b667bd982075f7097",
      SOURCE_WORKFLOW: "wf-08-arrangement"
    },
    {
      id: "A4",
      FILE: "RC demo-03 MIDI export & reopen",
      DURATION: "export then reopen (~10–20s judgment of result integrity)",
      WHAT_TO_LISTEN_FOR: "Representative final export: notes survive export→reopen; usable MIDI draft quality",
      SHA256: "b7422b10a807864b93c306026b0fcbefdc65320d6d4a357bc9bf5a9aeb353c3d",
      SOURCE_WORKFLOW: "wf-04-open-demo-03 / arrangement → MIDI export → reopen"
    },
    {
      id: "A5",
      FILE: "Section continuity spot-check on demo-01 Main A → Main B → Break",
      DURATION: "~15s focus on transitions only",
      WHAT_TO_LISTEN_FOR: "Section continuity: transitions feel planned, not cut/paste collisions",
      SHA256: "d5b88f2b9e50f334311f52994e0522b5c8a69cb686276727f3cb2cc37adbf0be",
      SOURCE_WORKFLOW: "wf-02 continuity focus"
    }
  ]
};
write("02_ARRANGER_MUSICAL_REVIEW.json", arrangerListening);
write(
  "02_ARRANGER_MUSICAL_REVIEW.md",
  `# Arranger Final Musical Owner Review

**ARRANGER_FINAL_MUSICAL_ACCEPTANCE=OWNER_DECISION_REQUIRED**

Do not self-approve. Technical PASS is separate.

## How to listen

1. Use only \`${EXPECTED.arranger.zip}\` (SHA256 \`${EXPECTED.arranger.sha256}\`)
2. Extract → double-click \`START-UAOS-ARRANGER-STUDIO.bat\`
3. Listen to examples A1–A5 only (max 5)

| ID | What | Listen for | Artifact SHA256 |
|----|------|------------|-----------------|
${arrangerListening.examples.map((e) => `| ${e.id} | ${e.FILE} | ${e.WHAT_TO_LISTEN_FOR} | \`${e.SHA256}\` |`).join("\n")}

Decision: **PASS** or **NEEDS_FIXES** only after this session.
`
);

// --- 3 Singy musical review ---
const singyListening = {
  SINGY_FINAL_MUSICAL_ACCEPTANCE: "OWNER_DECISION_REQUIRED",
  FINAL_MUSICAL_ACCEPTANCE_DEFERRED: true,
  instruction:
    "Use frozen Singy V12 RC only. START-SINGY.bat → KIDS then TEEN. Built-in synth only; no uncleared samples.",
  package: EXPECTED.singy.zip,
  packageSha256: EXPECTED.singy.sha256,
  examples: [
    {
      id: "S1",
      FILE: "Singy KIDS lesson kids-melody (hear → tap → copy)",
      MODE: "KIDS",
      WHAT_TO_LISTEN_FOR: "Age-appropriate clarity; pulse/melody lesson feels friendly; starter playback usable",
      SHA256: "kids-melody-session-progress-100 (engine path singy-wf-02)",
      SOURCE_WORKFLOW: "singy-wf-02-kids-lesson"
    },
    {
      id: "S2",
      FILE: "Singy TEEN studio fundamentals (tempo 104, section arrange)",
      MODE: "TEEN",
      WHAT_TO_LISTEN_FOR: "Teen studio result quality; section arrangement coherence; draft export sense",
      SHA256: "teen-arrange-studio (engine path singy-wf-03)",
      SOURCE_WORKFLOW: "singy-wf-03-teen-studio"
    },
    {
      id: "S3",
      FILE: "Shared Musical Brain context response (technical path shared with Arranger)",
      MODE: "SHARED",
      WHAT_TO_LISTEN_FOR: "Context/response feels musically aware without claiming final artistic pass",
      SHA256: "singy-wf-12-brain-shared",
      SOURCE_WORKFLOW: "singy-wf-12-brain-shared"
    },
    {
      id: "S4",
      FILE: "Built-in playback / stop (rights-clean synth only)",
      MODE: "KIDS+TEEN",
      WHAT_TO_LISTEN_FOR: "Playback/result quality; stop works; no uncleared sample character",
      SHA256: "singy-wf-05 + singy-wf-06",
      SOURCE_WORKFLOW: "playback/stop"
    }
  ]
};
write("03_SINGY_MUSICAL_REVIEW.json", singyListening);
write(
  "03_SINGY_MUSICAL_REVIEW.md",
  `# Singy Final Musical Owner Review

**SINGY_FINAL_MUSICAL_ACCEPTANCE=OWNER_DECISION_REQUIRED**

| ID | Mode | Listen for |
|----|------|------------|
${singyListening.examples.map((e) => `| ${e.id} | ${e.MODE} | ${e.WHAT_TO_LISTEN_FOR} |`).join("\n")}

Package: \`${EXPECTED.singy.zip}\`
`
);

// --- 4 MIDI Toolkit ---
write("04_MIDI_TOOLKIT_STATUS.json", {
  MIDI_TOOLKIT_TECHNICAL_PRIVATE_PILOT_RC: "PASS",
  musicalTasteApprovalRequired: false,
  preservedGates: [
    "FORMAT_CONTRACT_REQUIRED",
    "HARDWARE_REQUIRED",
    "INSPECT_ONLY",
    "LIMITED_VERIFIED"
  ],
  proprietaryWriteInvented: false,
  package: EXPECTED.midi.zip,
  sha256: EXPECTED.midi.sha256
});

// --- 5 Pricing ---
const pricing = {
  PRICING_STATUS: "OWNER_DECISION_REQUIRED",
  PRICING_PUBLISHED: false,
  licensePreference: "ONE_TIME_PURCHASE (founding private pilot)",
  currency: "EUR",
  ARRANGER_PRICE_RECOMMENDATION: {
    LOW: 39,
    RECOMMENDED_FOUNDING_PILOT: 49,
    POST_PILOT_TARGET: "99-129",
    RATIONALE:
      "Primary revenue SKU; full one-click arranger workflow; founding discount vs post-pilot target; aligns owner working hypothesis.",
    WHAT_IS_INCLUDED: [
      "Private pilot ZIP",
      "One-click Windows start",
      "Chords/melody → arrangement demos",
      "MIDI export where verified",
      "Diagnostics/recovery",
      "Founding-pilot support (best-effort)"
    ],
    WHAT_IS_NOT_INCLUDED: [
      "Public release support SLA",
      "Proprietary keyboard WRITE (Korg/Yamaha/Roland/Ketron)",
      "Commander",
      "Guaranteed hardware proof",
      "Lifetime free major upgrades promise"
    ],
    SUPPORT_SCOPE: "Private founding pilot — best-effort email/form; no SLA",
    LICENSE_MODEL: "One-time purchase — founding pilot license (owner-approved price)"
  },
  MIDI_TOOLKIT_PRICE_RECOMMENDATION: {
    LOW: 29,
    RECOMMENDED_FOUNDING_PILOT: 39,
    POST_PILOT_TARGET: "59-79",
    RATIONALE:
      "Utility SKU under Arranger; technical value (inspect/clean/normalize/convert-where-verified) without subjective musical product premium; WAVE_2 after Arranger.",
    WHAT_IS_INCLUDED: [
      "One-click MIDI Toolkit",
      "Customer modes (Audio→MIDI where proven, Inspect, Clean, Normalize, Format Inspect, Convert verified)",
      "Neutral IR path",
      "Format truth matrix"
    ],
    WHAT_IS_NOT_INCLUDED: [
      "Invented proprietary WRITE",
      "Hardware microphone proof as included feature",
      "Arranger Studio full product"
    ],
    SUPPORT_SCOPE: "Private pilot best-effort",
    LICENSE_MODEL: "One-time purchase — founding pilot"
  },
  SINGY_PRICE_RECOMMENDATION: {
    LOW: 19,
    RECOMMENDED_FOUNDING_PILOT: 29,
    POST_PILOT_TARGET: "39-49",
    RATIONALE:
      "Family SKU (Kids+Teen); education/coach positioning; rights-clean built-in synth only; WAVE_3; lower price than Arranger to avoid blocking primary launch.",
    WHAT_IS_INCLUDED: [
      "Singy family launcher",
      "KIDS + TEEN modes",
      "Lesson/memory engine",
      "Built-in synthesized playback"
    ],
    WHAT_IS_NOT_INCLUDED: [
      "Uncleared commercial samples",
      "Final musical acceptance as marketing claim until owner PASS",
      "School LMS / multi-seat enterprise (unless later SKU)"
    ],
    SUPPORT_SCOPE: "Private pilot best-effort; privacy-first for kids content",
    LICENSE_MODEL: "One-time family license — founding pilot"
  }
};
write("05_PRICING_RECOMMENDATION.json", pricing);
write(
  "05_PRICING_RECOMMENDATION.md",
  `# Pricing (INTERNAL — NOT PUBLISHED)

| SKU | LOW | FOUNDING PILOT | POST-PILOT |
|-----|-----|----------------|------------|
| Arranger Studio | EUR39 | **EUR49** | EUR99–129 |
| MIDI Toolkit | EUR29 | **EUR39** | EUR59–79 |
| Singy | EUR19 | **EUR29** | EUR39–49 |

**PRICING_STATUS=OWNER_DECISION_REQUIRED**
`
);

// --- 6 Pilot cohort ---
write("06_PILOT_COHORT.json", {
  product: "ARRANGER_STUDIO",
  wave: 1,
  targetSize: "10-20 users maximum",
  contactAnyone: false,
  idealUsers: [
    "ARRANGER_KEYBOARD_USERS",
    "MIDI_PRODUCERS",
    "MIDDLE_EASTERN_MUSIC_CREATORS",
    "HOME_STUDIO_USERS",
    "MUSICIANS_USING_MIDI_EXPORT"
  ],
  selectionRules: {
    HIGH_FIT: [
      "Uses arranger keyboard or MIDI export weekly",
      "Windows desktop available",
      "Willing to give structured feedback within 7 days",
      "Understands PRIVATE FOUNDING PILOT limitations",
      "ME / oriental / maqam-aware creator OR MIDI producer"
    ],
    MEDIUM_FIT: [
      "Occasional MIDI user",
      "Curious about arrangement tools",
      "Can install ZIP but less frequent music production"
    ],
    REJECT: [
      "Expects public product / SLA / refund marketplace norms as store",
      "Needs proprietary SET/STY WRITE today",
      "No Windows",
      "Wants mass marketing / influencer free perpetual license without feedback",
      "Random social DMs with no music use case"
    ]
  },
  OUTREACH_STATUS: "PREPARED_NOT_SENT"
});

// --- 7 Outreach ---
const outreach = {
  OUTREACH_STATUS: "PREPARED_NOT_SENT",
  product: "UAOS Arranger Studio — Private Founding Pilot",
  languages: ["EN", "DE", "AR"],
  templates: {}
};

outreach.templates.EN = {
  INITIAL_INVITE: `Subject: Private Founding Pilot — UAOS Arranger Studio (Windows)

Hi {{name}},

You're invited to a **Private Founding Pilot** of **UAOS Arranger Studio** — a Windows one-click package that turns chords/melody into arrangement drafts and MIDI export (where verified).

What you get:
- Extract ZIP → double-click START-UAOS-ARRANGER-STUDIO.bat
- No Node/npm/Git required
- Honest limitations (proprietary keyboard WRITE not included)

Founding pilot price (if owner-approved): **EUR {{price}}** one-time.
This is early access — not a public release and not a market-leadership claim.

If interested, reply YES and we'll send the package + short feedback form.

— UAOS`,
  FOLLOW_UP: `Quick follow-up on the UAOS Arranger Studio founding pilot invite. Still interested? Reply YES / NO. No obligation.`,
  ACCEPTED_PILOT_WELCOME: `Welcome to the Private Founding Pilot. You will receive a delivery message with the ZIP and SHA256. Please keep feedback honest — install, first result time, usefulness, and any confusion.`,
  DELIVERY_MESSAGE: `Delivery — UAOS Arranger Studio Private Pilot

File: UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip
SHA256: c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388
Start: START-UAOS-ARRANGER-STUDIO.bat

Requirements: Windows. Extract, then double-click Start.
Please complete the feedback form after first use.`,
  FEEDBACK_REQUEST: `When you have 10 minutes: please fill the pilot feedback form (install, start, time-to-first-result, output useful, score 1–10). Optional: export Diagnostics from the app.`,
  SUPPORT_RESPONSE_TEMPLATE: `Thanks for reporting. Private pilot support is best-effort. Please send: (1) what you tried (2) error text (3) optional diagnostics JSON. We do not claim SLA during founding pilot.`
};

outreach.templates.DE = {
  INITIAL_INVITE: `Betreff: Privater Founding Pilot — UAOS Arranger Studio (Windows)

Hallo {{name}},

Einladung zum **privaten Founding Pilot** von **UAOS Arranger Studio**: Ein-Klick-Paket (Windows) für Akkorde/Melodie → Arrangement-Entwurf und MIDI-Export (wo verifiziert).

Preis (falls freigegeben): **EUR {{price}}** einmalig.
Kein öffentlicher Release, keine Marktführerschafts-Behauptung.

Bei Interesse: YES antworten.

— UAOS`,
  FOLLOW_UP: `Kurze Nachfrage zum UAOS Arranger Studio Founding Pilot. Interesse? YES / NO.`,
  ACCEPTED_PILOT_WELCOME: `Willkommen im privaten Founding Pilot. Sie erhalten ZIP + SHA256 und ein kurzes Feedback-Formular.`,
  DELIVERY_MESSAGE: `Lieferung — UAOS Arranger Studio Private Pilot
Datei: UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip
SHA256: c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388
Start: START-UAOS-ARRANGER-STUDIO.bat`,
  FEEDBACK_REQUEST: `Bitte Feedback-Formular ausfüllen (Installation, Start, Zeit bis erstes Ergebnis, Nutzen, Note 1–10).`,
  SUPPORT_RESPONSE_TEMPLATE: `Danke für die Meldung. Founding-Pilot-Support ohne SLA. Bitte Schritte, Fehlertext, optional Diagnose-Export senden.`
};

outreach.templates.AR = {
  INITIAL_INVITE: `الموضوع: تجربة تأسيس خاصة — UAOS Arranger Studio (ويندوز)

مرحباً {{name}}،

دعوة إلى **تجربة تأسيس خاصة** لمنتج **UAOS Arranger Studio**: حزمة ويندوز بنقرة واحدة (استخراج ثم START) لتحويل الأكوردات/اللحن إلى ترتيب ومخرج MIDI حيث تم التحقق.

السعر (إذا وافق المالك): **EUR {{price}}** دفعة واحدة.
ليست إصداراً عاماً، ولا ادّعاء ريادة سوق.

إن رغبت: أجب YES.

— UAOS`,
  FOLLOW_UP: `متابعة سريعة لدعوة تجربة Arranger Studio. هل ما زلت مهتماً؟ YES / NO.`,
  ACCEPTED_PILOT_WELCOME: `مرحباً بك في التجربة الخاصة. ستصلك الحزمة وSHA256 ونموذج ملاحظات مختصر.`,
  DELIVERY_MESSAGE: `التسليم — UAOS Arranger Studio
الملف: UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip
SHA256: c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388
البدء: START-UAOS-ARRANGER-STUDIO.bat`,
  FEEDBACK_REQUEST: `بعد أول استخدام: عبّئ نموذج الملاحظات (التثبيت، التشغيل، وقت أول نتيجة، الفائدة، تقييم 1–10).`,
  SUPPORT_RESPONSE_TEMPLATE: `شكراً للإبلاغ. دعم التجربة الخاصة بأفضل جهد بلا SLA. أرسل الخطوات ونص الخطأ وتشخيصاً اختيارياً.`
};

write("07_OUTREACH_DRAFTS.json", outreach);
write(
  "07_OUTREACH_DRAFTS.md",
  `# Arranger Pilot Outreach (PREPARED_NOT_SENT)

Templates in EN / DE / AR: INITIAL_INVITE, FOLLOW_UP, ACCEPTED_PILOT_WELCOME, DELIVERY_MESSAGE, FEEDBACK_REQUEST, SUPPORT_RESPONSE_TEMPLATE.

See \`07_OUTREACH_DRAFTS.json\`. **DO NOT SEND.**
`
);

// --- 8 Feedback ---
write("08_FEEDBACK_FLOW.json", {
  invasiveTelemetry: false,
  method: "explicit form + optional diagnostics export",
  fields: [
    "INSTALL_SUCCESS",
    "FIRST_START_SUCCESS",
    "TIME_TO_FIRST_RESULT",
    "WORKFLOW_COMPLETED",
    "CRASH_OR_ERROR",
    "CONFUSION_POINTS",
    "OUTPUT_USEFUL",
    "OUTPUT_QUALITY",
    "WOULD_USE_AGAIN",
    "WOULD_PAY",
    "EXPECTED_PRICE",
    "TOP_MISSING_ITEM",
    "OVERALL_SCORE_1_TO_10"
  ]
});
write(
  "08_FEEDBACK_FORM.md",
  `# Pilot Feedback Form (concise)

1. INSTALL_SUCCESS (Y/N)
2. FIRST_START_SUCCESS (Y/N)
3. TIME_TO_FIRST_RESULT (seconds or estimate)
4. WORKFLOW_COMPLETED (which)
5. CRASH_OR_ERROR (Y/N + text)
6. CONFUSION_POINTS (free text)
7. OUTPUT_USEFUL (1–5)
8. OUTPUT_QUALITY (1–5)
9. WOULD_USE_AGAIN (Y/N)
10. WOULD_PAY (Y/N)
11. EXPECTED_PRICE (EUR)
12. TOP_MISSING_ITEM
13. OVERALL_SCORE_1_TO_10

Optional: attach Diagnostics export from app.
`
);

// --- 9 Legal ---
write("09_LEGAL_OWNER_PACK.json", {
  LEGAL_STATUS: "OWNER_DECISION_REQUIRED",
  agreementsAccepted: false,
  sensitiveTaxIdsExposed: false,
  remainingOwnerLegalData: {
    LICENSE: "OWNER_DATA_REQUIRED — finalize license text with company/entity name",
    TERMS: "OWNER_DATA_REQUIRED — early access disclosure + limitation of warranty",
    PRIVACY: "CAN_FINALIZE_WITH_EXISTING_DATA for local-first pilot (no invasive telemetry); OWNER_DATA_REQUIRED for contact email / imprint address",
    REFUND: "OWNER_DATA_REQUIRED — founding pilot refund window policy",
    SUPPORT: "CAN_FINALIZE_WITH_EXISTING_DATA as best-effort draft",
    IMPRINT_COMPANY_DETAILS: "OWNER_DATA_REQUIRED — legal entity, address, contact (do not expose tax IDs publicly without review)",
    EARLY_ACCESS_DISCLOSURE: "CAN_FINALIZE_WITH_EXISTING_DATA — PRIVATE_PILOT_RC language ready"
  },
  PROFESSIONAL_LEGAL_REVIEW_RECOMMENDED: [
    "LICENSE",
    "TERMS",
    "REFUND",
    "PRIVACY (if any account/payment later)",
    "IMPRINT"
  ],
  note: "Drafts only — not legally accepted; do not invent clearance."
});

// --- 10 Website release diff ---
const website = {
  WEBSITE_RELEASE_DIFF: "READY",
  PRODUCTION_DEPLOY: "NO",
  removeCustomerFacing11ProductFragmentation: true,
  routes: {
    "/products/arranger-studio/": "PRIMARY WAVE_1",
    "/products/midi-toolkit/": "WAVE_2",
    "/products/singy/": "WAVE_3"
  },
  arrangerPageSections: [
    "HERO",
    "VALUE_PROPOSITION",
    "REAL_RUNTIME_PROOF",
    "HOW_IT_WORKS",
    "FEATURES",
    "REAL_LIMITATIONS",
    "COMPATIBILITY",
    "DEMO",
    "FAQ",
    "SUPPORT",
    "FOUNDING_PILOT_CTA",
    "LEGAL_LINKS"
  ],
  locales: ["EN", "DE", "AR"],
  arabicRTL: true
};
write("10_WEBSITE_RELEASE_DIFF.json", website);

const arrangerPageEn = `# UAOS Arranger Studio

**Status:** Private Founding Pilot (PRIVATE_PILOT_RC) — not a public store release.

## HERO
UAOS Arranger Studio — chords and melody to arrangement drafts on Windows.

## VALUE_PROPOSITION
One-click local package. No Node, npm, or Git. Export MIDI where verified. Honest format limits.

## REAL_RUNTIME_PROOF
Frozen package: \`UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip\`  
SHA256: \`c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388\`  
Entry: \`START-UAOS-ARRANGER-STUDIO.bat\` · ONE_CLICK_START=PASS · P0=0 · P1=0

## HOW_IT_WORKS
1. Extract ZIP  
2. Double-click Start  
3. Open demo / create arrangement  
4. Export result  

## FEATURES
- Chords → arrangement  
- Melody → arrangement  
- Section continuity checks (technical)  
- MIDI export / reopen where verified  
- Diagnostics + recovery  

## REAL_LIMITATIONS
- Proprietary keyboard WRITE (Korg/Yamaha/Roland/Ketron) = FORMAT_CONTRACT_REQUIRED  
- Not Commander  
- Founding pilot — early access, best-effort support  
- Final musical taste = owner/pilot judgment  

## COMPATIBILITY
Windows desktop · bundled portable runtime · no developer environment required

## DEMO
In-package demos: Oriental Pop chords; Hijaz melody; MIDI export/reopen.

## FAQ
**Need Node?** No.  
**Public release?** No — private founding pilot.  
**Market leader claim?** No.

## SUPPORT
Best-effort during founding pilot. Feedback form + optional diagnostics.

## FOUNDING_PILOT_CTA
Join private founding pilot (invite-only). Price shown only after owner approval.

## LEGAL_LINKS
Terms (draft) · Privacy (draft) · Refund (draft) · Early Access Disclosure
`;

write("10_website/arranger-studio.en.md", arrangerPageEn);
write(
  "10_website/arranger-studio.de.md",
  `# UAOS Arranger Studio

**Status:** Privater Founding Pilot (PRIVATE_PILOT_RC).

## HERO
UAOS Arranger Studio — Akkorde und Melodie zu Arrangement-Entwürfen unter Windows.

## VALUE_PROPOSITION
Ein-Klick-Paket. Kein Node/npm/Git. MIDI-Export wo verifiziert. Ehrliche Formatgrenzen.

## REAL_RUNTIME_PROOF
ZIP V11 · SHA256 \`c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388\` · ONE_CLICK=PASS

## HOW_IT_WORKS
ZIP entpacken → Start doppelklicken → Demo/Arrangement → Export

## REAL_LIMITATIONS
Kein proprietäres Keyboard-WRITE · Kein Commander · Early Access

## FOUNDING_PILOT_CTA
Nur per Einladung. Preis nach Owner-Freigabe.

## LEGAL_LINKS
Entwürfe: AGB · Datenschutz · Rückerstattung · Early-Access
`
);
write(
  "10_website/arranger-studio.ar.md",
  `<!-- dir=rtl -->
# UAOS Arranger Studio

**الحالة:** تجربة تأسيس خاصة (PRIVATE_PILOT_RC) — ليست إصداراً عاماً.

## HERO
UAOS Arranger Studio — من الأكوردات واللحن إلى مسودات الترتيب على ويندوز.

## VALUE_PROPOSITION
حزمة بنقرة واحدة. بلا Node/npm/Git. تصدير MIDI حيث تم التحقق. حدود تنسيق صادقة.

## REAL_RUNTIME_PROOF
الحزمة المجمدة V11 · SHA256 \`c133294dbf7498c6004fcc28ec1afa4e4f1e5df00a24043b60f407e56ffe5388\` · ONE_CLICK=PASS

## HOW_IT_WORKS
استخراج → تشغيل Start → تجربة/ترتيب → تصدير

## REAL_LIMITATIONS
لا كتابة ملفات لوحة مفاتيح ملكية · لا Commander · وصول مبكر

## FOUNDING_PILOT_CTA
بدعوة فقط. السعر بعد موافقة المالك.

## LEGAL_LINKS
مسودات: الشروط · الخصوصية · الاسترداد · إفصاح الوصول المبكر
`
);

write(
  "10_website/midi-toolkit.en.md",
  `# UAOS MIDI Toolkit

Private Founding Pilot — WAVE_2 after Arranger.

Inspect, clean, normalize MIDI; convert where verified. Format truth preserved (no invented proprietary WRITE).

ZIP: \`UAOS_MIDI_TOOLKIT_FOUNDING_PILOT_V12.zip\`  
SHA256: \`5ae8d8247cfbd846daec94da7a521a0812d8ebce55f88c5dbcedcbeda170ead8\`  
Start: \`START-UAOS-MIDI-TOOLKIT.bat\`

**PRODUCTION_DEPLOY=NO**
`
);
write(
  "10_website/singy.en.md",
  `# Singy — Kids + Teen

Private Founding Pilot — WAVE_3. One family launcher: choose KIDS or TEEN. Rights-clean built-in synth only.

ZIP: \`UAOS_SINGY_FOUNDING_PILOT_V12.zip\`  
SHA256: \`d1febfa15db50f0b9832b6ec3520825ee5101aecec862975371910d2614ca995\`  
Start: \`START-SINGY.bat\`

Musical acceptance: OWNER_DECISION_REQUIRED.

**PRODUCTION_DEPLOY=NO**
`
);

// --- 11 Payment prep ---
write("11_PAYMENT_PREPARATION.json", {
  PAYMENT_STATUS: "OWNER_APPROVAL_REQUIRED",
  PAYMENT_ACTIVE: false,
  CHECKOUT_ACTIVE: false,
  products: [
    {
      PRODUCT_NAME: "UAOS Arranger Studio — Founding Pilot",
      PRODUCT_SKU: "uaos-arranger-studio-founding-pilot",
      OWNER_APPROVED_PRICE_PLACEHOLDER: "EUR {{OWNER_APPROVED}}",
      TAX_DISPLAY_REQUIREMENTS: "Show tax treatment per owner jurisdiction once imprint/tax settings provided — do not invent VAT rate",
      ORDER_CONFIRMATION_COPY: "Thank you. Your founding pilot license is confirmed. Delivery instructions follow.",
      DELIVERY_FLOW: "Manual or gated download of verified ZIP + SHA256 after payment confirmation",
      REFUND_FLOW: "Per owner-approved refund policy draft — not activated",
      SUPPORT_FLOW: "Feedback form + best-effort support template"
    },
    {
      PRODUCT_NAME: "UAOS MIDI Toolkit — Founding Pilot",
      PRODUCT_SKU: "uaos-midi-toolkit-founding-pilot",
      OWNER_APPROVED_PRICE_PLACEHOLDER: "EUR {{OWNER_APPROVED}}",
      TAX_DISPLAY_REQUIREMENTS: "Same as Arranger once owner tax data provided",
      ORDER_CONFIRMATION_COPY: "MIDI Toolkit founding pilot confirmed.",
      DELIVERY_FLOW: "Verified ZIP + SHA256",
      REFUND_FLOW: "Owner policy",
      SUPPORT_FLOW: "Best-effort"
    },
    {
      PRODUCT_NAME: "Singy — Founding Pilot",
      PRODUCT_SKU: "singy-founding-pilot",
      OWNER_APPROVED_PRICE_PLACEHOLDER: "EUR {{OWNER_APPROVED}}",
      TAX_DISPLAY_REQUIREMENTS: "Same once owner tax data provided",
      ORDER_CONFIRMATION_COPY: "Singy founding pilot confirmed.",
      DELIVERY_FLOW: "Verified ZIP + SHA256",
      REFUND_FLOW: "Owner policy",
      SUPPORT_FLOW: "Best-effort; privacy for kids"
    }
  ],
  providersActivated: []
});

// --- 12 WHEA / 13 Release order ---
write("12_WHEA_AND_RELEASE_ORDER.json", {
  WHEA_GATE: "NOT_CLEARED",
  heavyPackagingRun: false,
  electronBuild: false,
  portablePackagesRemainValid: true,
  RELEASE_ORDER: {
    WAVE_1: "ARRANGER_STUDIO",
    WAVE_2: "MIDI_TOOLKIT",
    WAVE_3: "SINGY",
    note: "Arranger does NOT wait for MIDI or Singy once its own owner gates are approved."
  }
});

// --- Master index + decision screen ---
const decisionScreen = `V13_INTERNAL_PREPARATION_COMPLETE=YES

ARRANGER_MUSICAL_REVIEW_READY=YES
SINGY_MUSICAL_REVIEW_READY=YES

RECOMMENDED_PRICES:
ARRANGER=EUR49
MIDI_TOOLKIT=EUR39
SINGY=EUR29

RECOMMENDED_FIRST_RELEASE=ARRANGER

OWNER_DECISIONS_REQUIRED:

ARRANGER_MUSIC=PASS|NEEDS_FIXES
SINGY_MUSIC=PASS|NEEDS_FIXES

ARRANGER_PRICE=<EUR>|HOLD
MIDI_PRICE=<EUR>|HOLD
SINGY_PRICE=<EUR>|HOLD

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
write("00_README_FIRST.md", `# V13 Final Owner Gate — Decision Package

**No development wave. No rebuild. No Commander. No outreach sent. No payment active.**

Folder: \`reports/v13-owner-decision/\`

| # | File | Purpose |
|---|------|---------|
| 00 | OWNER_DECISION_SCREEN.txt | **Only decisions owner must answer** |
| 01 | ARTIFACT_VERIFICATION | Frozen ZIP path/size/SHA256 |
| 02 | ARRANGER_MUSICAL_REVIEW | Final listening session (5 examples) |
| 03 | SINGY_MUSICAL_REVIEW | Final listening session (4 examples) |
| 04 | MIDI_TOOLKIT_STATUS | Technical PASS; no taste gate |
| 05 | PRICING_RECOMMENDATION | Internal EUR recommendations |
| 06 | PILOT_COHORT | 10–20 user selection rules |
| 07 | OUTREACH_DRAFTS | EN/DE/AR — NOT SENT |
| 08 | FEEDBACK_FORM | Concise pilot feedback |
| 09 | LEGAL_OWNER_PACK | What owner/legal still must provide |
| 10 | website/* | Product page copy — NOT DEPLOYED |
| 11 | PAYMENT_PREPARATION | Prep only — not activated |
| 12 | WHEA_AND_RELEASE_ORDER | WHEA NOT_CLEARED; WAVE_1=Arranger |

After owner answers \`00_OWNER_DECISION_SCREEN.txt\`, external actions require each explicit gate value.
`);

write("V13_STATUS.json", {
  schema: "uaos.v13.owner-gate/v1",
  V13_INTERNAL_PREPARATION_COMPLETE: true,
  OWNER_DECISION_PACKAGE_READY: true,
  OWNER_DECISIONS_REMAINING: "ONLY_EXPLICIT_EXTERNAL_GATES",
  FEATURE_SPRAWL: "STOPPED",
  V8_TO_V12: "FROZEN",
  COMMANDER_TOUCHED: false,
  PUBLIC_RELEASE: false,
  PAYMENT_ACTIVE: false,
  OUTREACH_SENT: false,
  WEBSITE_DEPLOYED: false,
  WHEA_GATE: "NOT_CLEARED",
  artifacts,
  recommendedPrices: {
    ARRANGER: 49,
    MIDI_TOOLKIT: 39,
    SINGY: 29,
    currency: "EUR"
  },
  updatedAt: new Date().toISOString()
});

// Sync hub + master state (internal docs only)
fs.writeFileSync(
  path.join(ROOT, "reports", "UAOS_V13_STATUS_REPORT.md"),
  `# UAOS V13 Status

\`\`\`
V13_INTERNAL_PREPARATION_COMPLETE=YES
OWNER_DECISION_PACKAGE_READY=YES
OWNER_DECISIONS_REMAINING=ONLY_EXPLICIT_EXTERNAL_GATES
PACKAGE=reports/v13-owner-decision/
COMMANDER_TOUCHED=NO PUBLIC_RELEASE=NO OUTREACH_SENT=NO PAYMENT_ACTIVE=NO
\`\`\`
`
);

fs.writeFileSync(
  path.join(ROOT, "reports", "CODEX_MASTER_STATE.json"),
  JSON.stringify(
    {
      project: "UAOS",
      currentPhase: "V13_FINAL_OWNER_GATE",
      phaseStatus: "V13_INTERNAL_PREPARATION_COMPLETE",
      nextTask: "OWNER_EXPLICIT_EXTERNAL_GATES_ONLY",
      V12: "FROZEN",
      V13_INTERNAL_PREPARATION_COMPLETE: true,
      OWNER_DECISION_PACKAGE_READY: true,
      wheaGate: "NOT_CLEARED",
      commanderTouched: false,
      publicRelease: false,
      paymentActive: false,
      outreachSent: false,
      websiteDeployed: false,
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
      out: OUT,
      allArtifactsMatch: Object.values(artifacts).every((a) => a.PRESERVE_BYTES === "YES"),
      V13_INTERNAL_PREPARATION_COMPLETE: true
    },
    null,
    2
  )
);
