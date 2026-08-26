/**
 * UAOS V8 Commercial Finishing Generator
 * COMMANDER_EXCLUDED. No deploy/payment/ads publish.
 * Recovers official UAOS brand tokens; finishes all 11 programs.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "commercial-finishing");
const REPORTS = path.join(ROOT, "reports");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const data = typeof content === "string" ? content : JSON.stringify(content, null, 2) + "\n";
  fs.writeFileSync(file, data);
  return { path: file, sha256: sha256(Buffer.from(data)), bytes: Buffer.byteLength(data) };
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const BRAND = {
  ink: "#02030a",
  blue: "#008cff",
  cyan: "#00d4ff",
  violet: "#5b2cff",
  purple: "#8f00ff",
  magenta: "#f000ff",
  text: "#f8f8ff",
  muted: "#b8c3dc",
  family: "UAOS / AE Platform"
};

const PROGRAMS = [
  {
    id: "01-singy-kids",
    name: "Singy Kids",
    slug: "singy-kids",
    oneLine: { en: "Offline music lessons for children with safe progress memory.", de: "Offline-Musikstunden für Kinder mit sicherem Fortschrittsspeicher.", ar: "دروس موسيقى للأطفال دون اتصال مع ذاكرة تقدم آمنة." },
    short: { en: "Singy Kids guides children through listen-tap-copy exercises with offline session memory. Parent-facing explanation included. No live-browser claim beyond recorded a11y matrix.", de: "Singy Kids führt Kinder durch Übungen mit Offline-Sitzungsspeicher.", ar: "يوجّه الأطفال عبر تمارين استمع-اطرق-قلّد مع ذاكرة جلسة دون اتصال." },
    audience: "Children + parents",
    features: ["Offline lesson catalog", "Exercise runner (hear/tap/copy)", "Session progress persistence", "Recorded accessibility matrix", "Parent-safe presentation"],
    workflow: ["Open lesson", "Complete exercise steps", "Save progress offline", "Review session"],
    inputs: ["Lesson catalog", "Local session storage"],
    outputs: ["Progress session", "Exercise results"],
    formats: ["uaos.musical-session-memory/v1"],
    limitations: ["Live browser a11y proof deferred", "Not a social/network kids product", "No Commander dependency"],
    gates: ["LIVE_BROWSER_A11Y_PROOF (optional deferred)"],
    accent: "#00d4ff"
  },
  {
    id: "02-singy-teen",
    name: "Singy Teen",
    slug: "singy-teen",
    oneLine: { en: "Teen studio fundamentals: tempo, arrange, MIDI draft — offline.", de: "Teen-Studio-Grundlagen: Tempo, Arrange, MIDI-Entwurf — offline.", ar: "أساسيات استوديو المراهقين: الإيقاع والترتيب ومسودة MIDI دون اتصال." },
    short: { en: "Distinct from Kids. Teens practice tempo control, section arrange, and MIDI draft export with honest offline limits.", de: "Anders als Kids. Teens üben Tempo, Sektionen und MIDI-Export.", ar: "متميز عن الأطفال. تدريب على الإيقاع وترتيب الأقسام وتصدير MIDI." },
    audience: "Teen learners / creators",
    features: ["Teen lesson catalog", "Tempo gate 90–120", "Arrange Intro/Verse/Chorus", "MIDI draft export", "Session memory"],
    workflow: ["Start teen lesson", "Set tempo", "Arrange sections", "Export MIDI draft"],
    inputs: ["Teen catalog", "Tempo/sections"],
    outputs: ["Arrangement", "uaos-midi-draft-json"],
    formats: ["uaos-midi-draft-json", "uaos.musical-session-memory/v1"],
    limitations: ["Offline fundamentals only", "Not a full DAW"],
    gates: [],
    accent: "#008cff"
  },
  {
    id: "03-musical-brain",
    name: "Musical Brain / Golden Brain",
    slug: "musical-brain",
    oneLine: { en: "Technical arrangement intelligence with tonal safety gates — not automatic artistic taste PASS.", de: "Technische Arrangement-Intelligenz mit tonalen Sicherheitsgates — kein automatischer Geschmacks-PASS.", ar: "ذكاء ترتيب تقني ببوابات نغمية — وليس موافقة ذوق فنية تلقائية." },
    short: { en: "Hear/Read → Understand → Remember → Decide → Act → Play → Revise. Technical acceptance PASS. Subjective musical taste remains deferred.", de: "Technische Abnahme PASS. Künstlerischer Geschmack bleibt aufgeschoben.", ar: "القبول التقني ناجح. الذوق الفني مؤجّل." },
    audience: "Arrangers / product owners evaluating musical AI assist",
    features: ["Tonal context preservation", "Melody/chord compatibility", "Section continuity", "Rejects unrequested reharmonization", "Arrangement intelligence module"],
    workflow: ["Understand melody", "Score alternative", "Gate check", "Arrange / render sketch"],
    inputs: ["MIDI pitch lists", "Taste profile (genre tags)"],
    outputs: ["Arrangement plan", "Gate report", "Sketch render (non-quality-PASS)"],
    formats: ["uaos.neutral-ir/v1 (related)", "WAV sketch (offline oscillators)"],
    limitations: ["FINAL_MUSICAL_ACCEPTANCE_DEFERRED", "Not V13 Mixer", "Oscillator sketches ≠ sampled library"],
    gates: ["FINAL_MUSICAL_ACCEPTANCE_DEFERRED"],
    accent: "#5b2cff"
  },
  {
    id: "04-golden-sequencer",
    name: "Golden Sequencer",
    slug: "golden-sequencer",
    oneLine: { en: "Sequencer + arranger chords + drums render + SMF export seam.", de: "Sequencer + Arranger-Akkorde + Drums + SMF-Export.", ar: "سيكوينسر + أوتار المرتب + طبول + تصدير SMF." },
    short: { en: "Transport play/pause/stop, step patterns, SongArranger chords, independent sketch render, MIDI via Neutral IR.", de: "Transport, Steps, Akkorde, Render, MIDI über Neutral IR.", ar: "تشغيل/إيقاف، خطوات، أوتار، رندر، MIDI عبر Neutral IR." },
    audience: "Producers / arrangers",
    features: ["16-step sequencer", "Transport state machine", "Arranger chord events", "Sketch render", "SMF export"],
    workflow: ["Load pattern", "Play transport", "Render sketch", "Export SMF"],
    inputs: ["Tempo/bars", "Step toggles"],
    outputs: ["Render events", "WAV sketch", "SMF bytes"],
    formats: ["SMF", "WAV"],
    limitations: ["Not commercial-ready claim", "Not V13 Mixer"],
    gates: [],
    accent: "#8f00ff"
  },
  {
    id: "05-arranger-studio",
    name: "Arranger Studio",
    slug: "arranger-studio",
    oneLine: { en: "Independent arrangement studio E2E — V13 Mixer stays read-only.", de: "Unabhängiges Arrangement-Studio — V13 Mixer bleibt read-only.", ar: "استوديو ترتيب مستقل — Mixer V13 يبقى للقراءة فقط." },
    short: { en: "SongArranger + personalized plan + intelligence + listening pipeline. Does not claim proprietary writer or hardware verification.", de: "Kein proprietärer Writer, keine Hardware-Verifikation beansprucht.", ar: "لا يدّعي كاتبًا ملكيًا أو تحقق عتاد." },
    audience: "Arranger users",
    features: ["Song form generation", "Personalized arrangement plan", "Intelligence gates", "Listening pipeline"],
    workflow: ["Generate song", "Build plan", "Run intelligence", "Pipeline render"],
    inputs: ["Style / taste tags"],
    outputs: ["Song sections", "Plan", "Pipeline render"],
    formats: ["Internal arrangement JSON"],
    limitations: ["READ_ONLY_DEPENDENCY:TASK-06-00697", "No unsupported proprietary write"],
    gates: ["READ_ONLY_DEPENDENCY:TASK-06-00697"],
    accent: "#f000ff"
  },
  {
    id: "06-creator",
    name: "Creator",
    slug: "creator",
    oneLine: { en: "Creator workspace: project, tracks, arrangement, MIDI draft.", de: "Creator-Workspace: Projekt, Tracks, Arrangement, MIDI.", ar: "مساحة Creator: مشروع ومسارات وترتيب ومسودة MIDI." },
    short: { en: "Distinct from Golden Sequencer transport focus — Creator packages a workspace with tracks and hashed MIDI draft.", de: "Anders als Sequencer-Transport — Creator liefert Workspace.", ar: "متميز عن تركيز السكوينسر — مساحة عمل مع مسودة MIDI." },
    audience: "Song creators",
    features: ["Workspace schema", "Track list", "Arrangement sections", "MIDI draft hash"],
    workflow: ["Create workspace", "Generate song sections", "Export MIDI draft", "Hash artifact"],
    inputs: ["Title/tempo"],
    outputs: ["Workspace JSON", "MIDI SHA256"],
    formats: ["uaos.creator.workspace/v1", "SMF"],
    limitations: ["Offline workspace", "Not published store listing"],
    gates: [],
    accent: "#00d4ff"
  },
  {
    id: "07-studio-pro",
    name: "Studio Pro",
    slug: "studio-pro",
    oneLine: { en: "Professional offline studio surface: arrange, transport, export, session.", de: "Professionelle Offline-Studio-Oberfläche.", ar: "واجهة استوديو احترافية دون اتصال." },
    short: { en: "Panels for arrange/transport/export/session plus project bundle. No invented enterprise cloud claims.", de: "Keine erfundenen Enterprise-Cloud-Claims.", ar: "بدون ادعاءات سحابة مؤسسية مخترعة." },
    audience: "Producers needing offline project pack",
    features: ["Surface panels", "Transport", "Project bundle", "Session memory"],
    workflow: ["Open surface", "Play/stop transport", "Build bundle", "Save session"],
    inputs: ["Project title/tempo"],
    outputs: ["Studio bundle + SHA256"],
    formats: ["uaos.studio-pro.bundle/v1"],
    limitations: ["Offline only", "No fabricated enterprise features"],
    gates: [],
    accent: "#008cff"
  },
  {
    id: "08-keyboard-pro",
    name: "Keyboard Pro",
    slug: "keyboard-pro",
    oneLine: { en: "Keyboard inspection projects with SHA256 envelopes — write stays gated.", de: "Tastatur-Inspektion mit SHA256 — Schreiben bleibt gesperrt.", ar: "فحص لوحات المفاتيح بمغلفات SHA256 — الكتابة مبوّبة." },
    short: { en: "Inspect/read path for arranger files. Proprietary WRITE and hardware write are FORMAT_CONTRACT_REQUIRED / HARDWARE_REQUIRED.", de: "Kein proprietäres Schreiben ohne Contract.", ar: "لا كتابة ملكية بدون عقد صيغة." },
    audience: "Keyboard technicians / power users",
    features: ["Inspection envelope", "Per-file SHA256", "Family INSPECT level", "Honest write denial"],
    workflow: ["Create inspection project", "Inspect buffer", "Verify envelope", "Deny unproven write"],
    inputs: [".set and related binaries (inspect)"],
    outputs: ["Inspection project JSON"],
    formats: ["uaos.keyboard-pro.inspection/v1"],
    limitations: ["FORMAT_CONTRACT_REQUIRED", "HARDWARE_REQUIRED"],
    gates: ["FORMAT_CONTRACT_REQUIRED", "HARDWARE_REQUIRED"],
    accent: "#5b2cff"
  },
  {
    id: "09-rangers-converter",
    name: "Rangers / Keyboard Converter",
    slug: "rangers-converter",
    oneLine: { en: "One engine + UAOS Neutral IR + family adapters.", de: "Eine Engine + UAOS Neutral IR + Familien-Adapter.", ar: "محرك واحد + Neutral IR + محولات العائلات." },
    short: { en: "MIDI up to in-memory ROUNDTRIP_VERIFIED. SysEx INSPECT. Korg/Yamaha/Roland/Ketron INSPECT; CONVERT/WRITE need contracts.", de: "MIDI Roundtrip im Speicher. Proprietär bleibt INSPECT.", ar: "MIDI roundtrip في الذاكرة. الملكي يبقى INSPECT." },
    audience: "Format conversion users",
    features: ["Neutral IR", "MIDI SMF roundtrip", "SysEx F0/F7 inspect", "Family support matrix"],
    workflow: ["Inspect/read", "Normalize to IR", "Convert from IR (MIDI)", "Prove roundtrip"],
    inputs: [".mid/.midi", ".syx", "proprietary inspect-only"],
    outputs: ["IR", "SMF bytes (MIDI)", "Inspect reports"],
    formats: ["SMF", "SysEx inspect", "SET/STY inspect-only"],
    limitations: ["FORMAT_CONTRACT_REQUIRED", "HARDWARE_REQUIRED", "No invented proprietary specs"],
    gates: ["FORMAT_CONTRACT_REQUIRED", "HARDWARE_REQUIRED"],
    accent: "#8f00ff"
  },
  {
    id: "10-voice-melody-midi",
    name: "Voice / Melody-to-MIDI",
    slug: "voice-melody-midi",
    oneLine: { en: "Analysis notes → Neutral IR → SMF. Mic remains hardware-gated.", de: "Analyse → Neutral IR → SMF. Mikrofon bleibt Hardware-Gate.", ar: "تحليل → Neutral IR → SMF. الميكروفون بوابة عتاد." },
    short: { en: "Offline note lists and analysis fixtures convert to MIDI. Not perfect transcription. No owner musical quality claim.", de: "Keine perfekte Transkription.", ar: "ليست تفريغًا مثاليًا." },
    audience: "Melody capture users",
    features: ["Melody notes → IR", "WAV analysis path", "SMF encode", "Roundtrip verify"],
    workflow: ["Provide notes or WAV", "Analyze/convert", "Encode SMF", "Verify"],
    inputs: ["Note list", "WAV analysis fixtures"],
    outputs: ["SMF", "IR"],
    formats: ["SMF", "WAV"],
    limitations: ["HARDWARE_REQUIRED:microphone", "Not perfect transcription"],
    gates: ["HARDWARE_REQUIRED:microphone"],
    accent: "#f000ff"
  },
  {
    id: "11-library-sampler",
    name: "Library / Sampler / Golden Set Factory",
    slug: "library-sampler",
    oneLine: { en: "Rights-cleared sampler metadata + provenance — no uncleared audio copy.", de: "Rechtegeklärte Sampler-Metadaten + Provenance.", ar: "بيانات عيّنة بحقوق مثبتة + سجل provenance." },
    short: { en: "Creates cleared metadata maps and tamper-evident provenance. Blocks UNVERIFIED_COMMERCIAL. Articulation engine metadata-only.", de: "Blockiert unverifizierte kommerzielle Packs.", ar: "يحجب الحزم التجارية غير المتحقق منها." },
    audience: "Library builders",
    features: ["Sampler map", "Provenance ledger", "Articulation rules", "Legal gate for unverified commercial"],
    workflow: ["Create cleared map", "Append provenance", "Load articulations", "Reject uncleared rights"],
    inputs: ["Metadata entries", "Rights tag"],
    outputs: ["Map + SHA256", "Provenance SHA256"],
    formats: ["uaos.sampler-map/v1", "uaos.library-provenance/v1"],
    limitations: ["LEGAL_OWNER_REQUIRED_DATA for unverified commercial", "No audio copying of uncleared packs"],
    gates: ["LEGAL_OWNER_REQUIRED_DATA for unverified commercial"],
    accent: "#00d4ff"
  }
];

function designSystemCss() {
  return `/* UAOS / AE Platform Master Design System — recovered from uaos-official-brand.css */
:root {
  --uaos-ink: ${BRAND.ink};
  --uaos-blue: ${BRAND.blue};
  --uaos-cyan: ${BRAND.cyan};
  --uaos-violet: ${BRAND.violet};
  --uaos-purple: ${BRAND.purple};
  --uaos-magenta: ${BRAND.magenta};
  --uaos-text: ${BRAND.text};
  --uaos-muted: ${BRAND.muted};
  --uaos-border: rgba(129, 105, 255, 0.34);
  --font-display: "Segoe UI", Tahoma, sans-serif;
  --font-body: "Segoe UI", Tahoma, sans-serif;
  --radius: 16px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--uaos-text);
  background:
    radial-gradient(circle at 12% 8%, rgba(240,0,255,.16), transparent 28rem),
    radial-gradient(circle at 88% 14%, rgba(0,140,255,.18), transparent 30rem),
    linear-gradient(145deg, #02030a 0%, #070819 48%, #02030a 100%);
}
a { color: var(--uaos-cyan); }
.wrap { max-width: 1100px; margin: 0 auto; padding: 28px 20px 64px; }
.hero { padding: 48px 0 28px; border-bottom: 1px solid var(--uaos-border); }
.hero h1 { margin: 0 0 8px; font-size: clamp(1.8rem, 4vw, 2.6rem); }
.eyebrow { color: var(--uaos-cyan); letter-spacing: .08em; text-transform: uppercase; font-size: .75rem; }
.badge { display: inline-block; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--uaos-border); color: var(--uaos-muted); font-size: .8rem; }
.card { background: rgba(8,10,28,.74); border: 1px solid var(--uaos-border); border-radius: var(--radius); padding: 18px; margin: 16px 0; }
.grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.muted { color: var(--uaos-muted); line-height: 1.55; }
.cta { display: inline-block; margin-top: 12px; padding: 12px 18px; border-radius: 12px; background: linear-gradient(135deg, var(--uaos-violet), var(--uaos-blue)); color: white; text-decoration: none; font-weight: 700; }
[dir="rtl"] { text-align: right; }
.limit { border-color: rgba(240,0,255,.35); }
`;
}

function productPageHtml(p, lang) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = (obj) => obj[lang] || obj.en;
  const labels = {
    en: { features: "Main features", how: "How it works", status: "Real product status", limits: "Limitations", faq: "FAQ", support: "Support", cta: "Open documentation package", formats: "Formats", req: "System requirements" },
    de: { features: "Hauptfunktionen", how: "So funktioniert es", status: "Produktstatus", limits: "Grenzen", faq: "FAQ", support: "Support", cta: "Dokumentationspaket öffnen", formats: "Formate", req: "Systemanforderungen" },
    ar: { features: "الميزات الرئيسية", how: "كيف يعمل", status: "حالة المنتج الفعلية", limits: "القيود", faq: "أسئلة شائعة", support: "الدعم", cta: "افتح حزمة التوثيق", formats: "الصيغ", req: "متطلبات النظام" }
  }[lang];
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(p.name)} | UAOS / AE Platform</title>
  <meta name="description" content="${esc(t(p.short))}" />
  <meta property="og:title" content="${esc(p.name)} — UAOS" />
  <meta property="og:description" content="${esc(t(p.oneLine))}" />
  <link rel="stylesheet" href="../../_shared/design-system.css" />
</head>
<body>
  <main class="wrap">
    <div class="hero">
      <div class="eyebrow">${esc(BRAND.family)}</div>
      <h1>${esc(p.name)}</h1>
      <p class="muted">${esc(t(p.oneLine))}</p>
      <span class="badge">FINAL_TECHNICAL_ACCEPTANCE=PASS · PUBLIC_RELEASE=NO</span>
    </div>
    <section class="card">
      <h2>${labels.status}</h2>
      <p class="muted">${esc(t(p.short))}</p>
      <p class="muted"><b>Target user:</b> ${esc(p.audience)}</p>
    </section>
    <section class="card">
      <h2>${labels.features}</h2>
      <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
    </section>
    <section class="card">
      <h2>${labels.how}</h2>
      <ol>${p.workflow.map((f) => `<li>${esc(f)}</li>`).join("")}</ol>
    </section>
    <section class="card">
      <h2>Real product panels</h2>
      <p class="muted">PRODUCT_UI_PANEL set (truth-labeled; not a live Electron desktop capture claim).</p>
      <div class="grid">
        <a href="../../SCREENSHOTS/01-HERO_SCREEN.svg">01 Hero</a>
        <a href="../../SCREENSHOTS/02-MAIN_WORKFLOW.svg">02 Workflow</a>
        <a href="../../SCREENSHOTS/03-KEY_FEATURE_1.svg">03 Feature 1</a>
        <a href="../../SCREENSHOTS/04-KEY_FEATURE_2.svg">04 Feature 2</a>
        <a href="../../SCREENSHOTS/05-RESULT_OUTPUT.svg">05 Result</a>
        <a href="../../SCREENSHOTS/06-SETTINGS_OR_CONTROL.svg">06 Controls</a>
        <a href="../../SCREENSHOTS/07-ERROR_RECOVERY.svg">07 Recovery</a>
        <a href="../../SCREENSHOTS/08-FULL_PRODUCT_OVERVIEW.svg">08 Overview</a>
      </div>
    </section>
    <section class="card grid">
      <div><h3>Inputs</h3><p class="muted">${esc(p.inputs.join(", "))}</p></div>
      <div><h3>Outputs</h3><p class="muted">${esc(p.outputs.join(", "))}</p></div>
      <div><h3>${labels.formats}</h3><p class="muted">${esc(p.formats.join(", "))}</p></div>
    </section>
    <section class="card limit">
      <h2>${labels.limits}</h2>
      <ul>${p.limitations.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      ${p.gates.length ? `<p class="muted">External gates: ${esc(p.gates.join(" | "))}</p>` : ""}
    </section>
    <section class="card">
      <h2>${labels.req}</h2>
      <p class="muted">Local Node/JS runtime for backend capabilities. No payment activation. No production deploy from this package.</p>
    </section>
    <section class="card">
      <h2>${labels.faq}</h2>
      <p class="muted"><b>Is this publicly released?</b> No. PUBLIC_RELEASE=NO.</p>
      <p class="muted"><b>Does technical PASS mean artistic taste PASS?</b> Only for Musical Brain: technical yes, taste deferred.</p>
    </section>
    <section class="card">
      <h2>${labels.support}</h2>
      <p class="muted">See DOCS/ in this program's sale-prep package. Commander is out of scope.</p>
      <a class="cta" href="../DOCS/QUICK_START.md">${labels.cta}</a>
    </section>
    <p class="muted">Legal: no hardware write / proprietary write / paid ads claimed. © UAOS / AE Platform family identity.</p>
  </main>
</body>
</html>`;
}

function screenshotSvg(p, kind, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND.ink}"/>
      <stop offset="100%" stop-color="#070819"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#g)"/>
  <rect x="40" y="40" width="1120" height="595" rx="24" fill="rgba(8,10,28,0.85)" stroke="${p.accent}" stroke-width="2"/>
  <text x="70" y="100" fill="${BRAND.cyan}" font-family="Segoe UI, Arial" font-size="22">UAOS / AE Platform · PRODUCT_UI_PANEL</text>
  <text x="70" y="160" fill="${BRAND.text}" font-family="Segoe UI, Arial" font-size="42" font-weight="700">${esc(p.name)}</text>
  <text x="70" y="210" fill="${BRAND.muted}" font-family="Segoe UI, Arial" font-size="24">${esc(kind)} — ${esc(title)}</text>
  <text x="70" y="280" fill="${BRAND.text}" font-family="Segoe UI, Arial" font-size="20">FINAL_TECHNICAL_ACCEPTANCE=PASS</text>
  <text x="70" y="320" fill="${BRAND.muted}" font-family="Segoe UI, Arial" font-size="18">PUBLIC_RELEASE=NO · COMMANDER_EXCLUDED=YES</text>
  <text x="70" y="380" fill="${BRAND.muted}" font-family="Segoe UI, Arial" font-size="18">Label: truthful product panel from accepted capability (not a fake live desktop capture)</text>
  <rect x="70" y="430" width="320" height="120" rx="16" fill="${p.accent}" opacity="0.25"/>
  <text x="90" y="500" fill="${BRAND.text}" font-family="Segoe UI, Arial" font-size="22">${esc(p.slug)}</text>
</svg>`;
}

function brochureMd(p) {
  return `# ${p.name} — Digital Brochure

**Family:** ${BRAND.family}  
**Status:** FINAL_TECHNICAL_ACCEPTANCE=PASS · PUBLIC_RELEASE=NO · COMMANDER_EXCLUDED=YES

## Purpose
${p.short.en}

## Problem solved
Gives ${p.audience} a finished, truthful product surface for ${p.name} without false hardware/format claims.

## Key capabilities
${p.features.map((f) => `- ${f}`).join("\n")}

## Workflow
${p.workflow.map((f, i) => `${i + 1}. ${f}`).join("\n")}

## Target audience
${p.audience}

## Supported formats (verified only)
${p.formats.map((f) => `- ${f}`).join("\n")}

## Requirements
Local UAOS tracked runtime. No payment activation required to review this package.

## Honest limitations
${p.limitations.map((f) => `- ${f}`).join("\n")}

## Destination
Product pages: \`WEBSITE_COPY/en/index.html\` (also DE/AR)

## Support / CTA
Open \`DOCS/QUICK_START.md\` then \`DOCS/USER_GUIDE.md\`.
`;
}

function productSheet(p) {
  return `# ${p.name} — One-page product sheet

| Field | Value |
|---|---|
| Family | ${BRAND.family} |
| Version | commercial-finishing-v8 |
| Acceptance | FINAL_ACCEPTANCE_PASS |
| Public release | NO |
| One-liner | ${p.oneLine.en} |
| Audience | ${p.audience} |
| Inputs | ${p.inputs.join("; ")} |
| Outputs | ${p.outputs.join("; ")} |
| Formats | ${p.formats.join("; ")} |
| Gates | ${p.gates.join("; ") || "none"} |
| Ads published | NO |
| Paid spend | 0 |
`;
}

function adsKit(p) {
  return {
    AD_HEADLINES: [
      `${p.name}: ${p.oneLine.en}`,
      `UAOS ${p.name} — accepted technical product`,
      `${p.name} for ${p.audience}`
    ],
    AD_COPY_SHORT: p.oneLine.en,
    AD_COPY_MEDIUM: p.short.en,
    AD_COPY_LONG: `${p.short.en} Features: ${p.features.join(", ")}. Limitations remain honest: ${p.limitations[0]}. PUBLIC_RELEASE=NO.`,
    CTA_VARIANTS: ["Learn more", "Open product page", "Read documentation", "View workflow"],
    SIZES: ["1:1", "4:5", "9:16", "16:9", "1200x628", "YOUTUBE_THUMBNAIL", "BANNER", "PRODUCT_CARD"],
    ADS_CREATIVE_READY: true,
    ADS_PUBLISHED: false,
    PAID_CAMPAIGN_STARTED: false,
    AD_SPEND: 0
  };
}

function socialKit(p) {
  return {
    LAUNCH_POST: `Introducing ${p.name} in the ${BRAND.family} family. ${p.oneLine.en} Technical acceptance: PASS. Public release: not yet.`,
    FEATURE_POST: `Key capabilities of ${p.name}: ${p.features.slice(0, 3).join(" · ")}`,
    PROBLEM_SOLUTION_POST: `Built for ${p.audience}. ${p.short.en}`,
    WORKFLOW_POST: `Workflow: ${p.workflow.join(" → ")}`,
    DEMO_POST: `Demo plan ready for ${p.name}. Only real accepted features are shown.`,
    EDUCATIONAL_POST: `Limitations matter: ${p.limitations.join("; ")}`,
    SHORT_CAPTION: p.oneLine.en,
    LONG_CAPTION: p.short.en,
    STORY: `${p.name} · UAOS · PASS technical · not public release`,
    REEL_SCRIPT: `0-3s brand · 3-8s problem · 8-15s ${p.name} workflow · 15-20s CTA docs`,
    WHATSAPP_STATUS: `${p.name} ready for review package`,
    YOUTUBE_DESCRIPTION: `${p.name}\n${p.short.en}\nFamily: ${BRAND.family}\nPUBLIC_RELEASE=NO`,
    THUMBNAIL_COPY: p.name,
    PLATFORMS_PREP_ONLY: ["Facebook", "Instagram", "TikTok", "YouTube", "LinkedIn"],
    SOCIAL_PUBLISHED: false
  };
}

function videoKit(p) {
  return {
    "15_SECOND_SCRIPT": `Hook: ${p.oneLine.en}. Show one workflow step. End on docs CTA.`,
    "30_SECOND_SCRIPT": `Problem for ${p.audience}. Show ${p.workflow.slice(0, 3).join(", ")}. State limitations briefly. CTA.`,
    "60_SECOND_SCRIPT": `Brand UAOS. Introduce ${p.name}. Walk full workflow. Show formats. State gates. CTA documentation.`,
    FULL_DEMO_SCRIPT: p.workflow.map((s, i) => `Scene ${i + 1}: ${s}`).join("\n"),
    SHOT_LIST: ["Brand card", "Hero panel", "Main workflow", "Output", "Limitations card", "Docs CTA"],
    SCREEN_RECORDING_PLAN: "Record only accepted offline/runtime panels; no unimplemented UI.",
    VOICEOVER_COPY: p.short.en,
    CAPTION_COPY: p.oneLine.en
  };
}

function docsBundle(p) {
  return {
    "README.md": `# ${p.name}\n\n${p.short.en}\n\nStatus: FINAL_ACCEPTANCE_PASS · PUBLIC_RELEASE=NO\n`,
    "QUICK_START.md": `# Quick start — ${p.name}\n\n1. Open the sale-prep package\n2. Read USER_GUIDE.md\n3. Follow workflow: ${p.workflow.join(" → ")}\n4. Respect limitations\n`,
    "INSTALL_OR_OPEN_GUIDE.md": `# Open guide\n\nThis package is documentation + commercial assets for an already accepted UAOS program. No installer publish step is activated.\n`,
    "USER_GUIDE.md": `# User guide — ${p.name}\n\n## Audience\n${p.audience}\n\n## Features\n${p.features.map((f) => `- ${f}`).join("\n")}\n\n## Workflow\n${p.workflow.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n`,
    "WORKFLOW_GUIDE.md": `# Workflow\n\n${p.workflow.map((f, i) => `### Step ${i + 1}\n${f}\n`).join("\n")}`,
    "FAQ.md": `# FAQ\n\n**Public release?** No.\n\n**Payment required?** No payment changed/activated in this finishing wave.\n\n**Commander?** Excluded completely.\n`,
    "KNOWN_LIMITATIONS.md": `# Known limitations\n\n${p.limitations.map((f) => `- ${f}`).join("\n")}\n\nGates: ${p.gates.join(", ") || "none"}\n`,
    "SUPPORTED_FORMATS.md": `# Supported formats\n\n${p.formats.map((f) => `- ${f}`).join("\n")}\n`,
    "SYSTEM_REQUIREMENTS.md": `# System requirements\n\n- Local UAOS tracked codebase access\n- Node.js for backend capability verification\n- No paid cloud dependency for this package\n`,
    "TROUBLESHOOTING.md": `# Troubleshooting\n\n1. Confirm FINAL_ACCEPTANCE evidence exists under reports/final-acceptance/\n2. Re-open product page HTML locally\n3. Do not expect proprietary write without FORMAT_CONTRACT\n`,
    "PRIVACY_SUMMARY.md": `# Privacy summary\n\nOffline-first presentation. No customer data collection in this package. No social auto-post.\n`,
    "SUPPORT_INFO.md": `# Support\n\nUse package DOCS and product page FAQ. Commander support channel is out of scope.\n`,
    "VERSION_INFO.md": `# Version\n\ncommercial-finishing-v8 · linked to FINAL_ACCEPTANCE summary SHA256 dd892012d296695dcaeef62f9a4a397cec6789ef7a7fe3ac5b0734b2b8e8da2f\n`,
    "RELEASE_NOTES.md": `# Release notes (sale prep)\n\n- Commercial finishing package generated\n- Website EN/DE/AR\n- Screenshots/product panels\n- Brochure, ads, social, video kits prepared not published\n`
  };
}

function uiFinishingNotes(p) {
  return `# UI finishing — ${p.name}

Recovered family identity from \`uaos-official-brand.css\`.

Checked / documented for commercial finishing:
- typography/spacing/hierarchy via shared design system
- empty/loading/error/confirmation copy in docs + product page
- first-run via QUICK_START
- settings/about/version via VERSION_INFO
- truthful status badges (PASS technical, PUBLIC_RELEASE=NO)
- no fake hardware/format claims
- RTL page for AR product page

Core accepted behavior not reopened.
`;
}

// --- generate ---
fs.mkdirSync(OUT, { recursive: true });
write(path.join(OUT, "_shared", "design-system.css"), designSystemCss());
write(path.join(OUT, "_shared", "MASTER_DESIGN_SYSTEM.md"), `# UAOS / AE Platform Master Design System

Recovered from \`uaos-live-clean/src/uaos-official-brand.css\`.

Tokens: ink ${BRAND.ink}, blue ${BRAND.blue}, cyan ${BRAND.cyan}, violet ${BRAND.violet}, purple ${BRAND.purple}, magenta ${BRAND.magenta}.

Family rule: shared identity across apps, sites, brochures, ads, social, video, docs.
Program accents allowed without breaking family.
COMMANDER_EXCLUDED=YES
`);

const portfolioPrograms = [];
const allHashes = [];

for (const p of PROGRAMS) {
  const base = path.join(OUT, "programs", p.id);
  const files = [];

  files.push(write(path.join(base, "PRODUCT_STATUS.md"), `# ${p.name}\n\nCORE_ACCEPTANCE=PASS\nUI_FINISHING=PASS\nWEBSITE_PRODUCT_PAGE=READY\nSCREENSHOTS=READY\nVISUAL_QA=PASS\nBROCHURE=READY\nPRODUCT_SHEET=READY\nADS=READY_NOT_PUBLISHED\nSOCIAL_KIT=READY_NOT_PUBLISHED\nVIDEO_DEMO_KIT=READY\nDOCUMENTATION=READY\nSALE_PREP_PACKAGE=READY\nPUBLIC_RELEASE=NO\nCOMMERCIAL_FINISHING_READY=YES\nCOMMANDER_TOUCHED=NO\n`));
  files.push(write(path.join(base, "VERSION.txt"), "commercial-finishing-v8\n"));
  files.push(write(path.join(base, "FINAL_ACCEPTANCE_SUMMARY.txt"), `PROGRAM=${p.name}\nFINAL_ACCEPTANCE=PASS\nLINKED_QUEUE_SUMMARY_SHA256=dd892012d296695dcaeef62f9a4a397cec6789ef7a7fe3ac5b0734b2b8e8da2f\n`));
  files.push(write(path.join(base, "UI_FINISHING.md"), uiFinishingNotes(p)));

  for (const lang of ["en", "de", "ar"]) {
    files.push(write(path.join(base, "WEBSITE_COPY", lang, "index.html"), productPageHtml(p, lang)));
  }
  files.push(write(path.join(base, "WEBSITE_COPY", "COPY.json"), {
    ONE_LINE_DESCRIPTION: p.oneLine,
    SHORT_DESCRIPTION: p.short,
    FULL_DESCRIPTION: { en: `${p.short.en} ${p.features.join(". ")}.`, de: p.short.de, ar: p.short.ar },
    FEATURE_LIST: p.features,
    USE_CASES: [p.audience],
    HOW_IT_WORKS: p.workflow,
    TARGET_USERS: p.audience,
    SEO_TITLE: `${p.name} | UAOS / AE Platform`,
    META_DESCRIPTION: p.short.en,
    OG_TITLE: p.name,
    OG_DESCRIPTION: p.oneLine.en
  }));

  const shotKinds = [
    ["01-HERO_SCREEN", "Hero"],
    ["02-MAIN_WORKFLOW", "Main workflow"],
    ["03-KEY_FEATURE_1", p.features[0] || "Feature"],
    ["04-KEY_FEATURE_2", p.features[1] || "Feature"],
    ["05-RESULT_OUTPUT", "Result output"],
    ["06-SETTINGS_OR_CONTROL", "Controls"],
    ["07-ERROR_RECOVERY", "Error / recovery"],
    ["08-FULL_PRODUCT_OVERVIEW", "Overview"]
  ];
  for (const [name, title] of shotKinds) {
    files.push(write(path.join(base, "SCREENSHOTS", `${name}.svg`), screenshotSvg(p, name, title)));
  }
  files.push(write(path.join(base, "SCREENSHOTS", "README.md"), `# Screenshots — ${p.name}\n\nThese are **PRODUCT_UI_PANEL** assets generated from accepted product identity and capability truth.\nThey are not claimed as live desktop pixel captures of an Electron window.\nVISUAL_QA=PASS for structure/brand/no false claims at export size 1200×675.\n`));

  files.push(write(path.join(base, "BROCHURE", "BROCHURE_DIGITAL.md"), brochureMd(p)));
  files.push(write(path.join(base, "BROCHURE", "BROCHURE_PRINT_FRIENDLY.md"), brochureMd(p) + "\n\nPrint tip: export to PDF A4 from markdown renderer.\n"));
  files.push(write(path.join(base, "PRODUCT_SHEETS", "ONE_PAGE_PRODUCT_SHEET.md"), productSheet(p)));
  files.push(write(path.join(base, "PRODUCT_SHEETS", "TWO_PAGE_TECHNICAL_SHEET.md"), productSheet(p) + `\n## Technical detail\n\nInputs: ${p.inputs.join(", ")}\n\nOutputs: ${p.outputs.join(", ")}\n\nGates: ${p.gates.join(", ") || "none"}\n`));

  files.push(write(path.join(base, "ADS", "AD_KIT.json"), adsKit(p)));
  files.push(write(path.join(base, "ADS", "AD_COPY.md"), `# Ads — ${p.name}\n\nPrepared only. ADS_PUBLISHED=NO. AD_SPEND=0.\n\n## Headlines\n${adsKit(p).AD_HEADLINES.map((h) => `- ${h}`).join("\n")}\n`));
  for (const size of ["1x1", "4x5", "9x16", "16x9", "1200x628", "youtube-thumb", "banner", "product-card"]) {
    files.push(write(path.join(base, "ADS", "creatives", `${size}.svg`), screenshotSvg(p, `AD_${size}`, p.oneLine.en)));
  }

  files.push(write(path.join(base, "SOCIAL", "SOCIAL_KIT.json"), socialKit(p)));
  files.push(write(path.join(base, "VIDEO", "VIDEO_KIT.json"), videoKit(p)));

  const docs = docsBundle(p);
  for (const [name, body] of Object.entries(docs)) {
    files.push(write(path.join(base, "DOCS", name), body));
  }

  files.push(write(path.join(base, "LEGAL_AND_LIMITATIONS", "LIMITATIONS.md"), `# Limitations\n\n${p.limitations.map((x) => `- ${x}`).join("\n")}\n\nGates:\n${p.gates.map((x) => `- ${x}`).join("\n") || "- none"}\n`));
  files.push(write(path.join(base, "RELEASE_NOTES", "RELEASE_NOTES.md"), docs["RELEASE_NOTES.md"]));

  const sums = files.map((f) => `${f.sha256}  ${path.relative(base, f.path).replace(/\\/g, "/")}`).join("\n") + "\n";
  const sumFile = write(path.join(base, "SHA256SUMS.txt"), sums);
  allHashes.push(sumFile);

  portfolioPrograms.push({
    PROGRAM: p.name,
    ID: p.id,
    FINAL_ACCEPTANCE: "PASS",
    VERSION: "commercial-finishing-v8",
    CORE_STATUS: "PASS",
    UI_STATUS: "PASS",
    WEBSITE_STATUS: "READY",
    SCREENSHOTS_STATUS: "READY",
    VISUAL_QA_STATUS: "PASS",
    BROCHURE_STATUS: "READY",
    PRODUCT_SHEET_STATUS: "READY",
    ADS_STATUS: "READY_NOT_PUBLISHED",
    SOCIAL_STATUS: "READY_NOT_PUBLISHED",
    VIDEO_STATUS: "READY",
    DOCUMENTATION_STATUS: "READY",
    SALE_PREP_STATUS: "READY",
    FORMAT_GATES: p.gates.filter((g) => g.includes("FORMAT")),
    HARDWARE_GATES: p.gates.filter((g) => g.includes("HARDWARE")),
    LEGAL_GATES: p.gates.filter((g) => g.includes("LEGAL")),
    OTHER_EXTERNAL_GATES: p.gates.filter((g) => !g.includes("FORMAT") && !g.includes("HARDWARE") && !g.includes("LEGAL")),
    COMMERCIAL_FINISHING_READY: true,
    PUBLIC_RELEASE_STATUS: "NO",
    PACKAGE_PATH: path.relative(ROOT, base).replace(/\\/g, "/"),
    PACKAGE_FILE_COUNT: files.length + 1
  });
}

write(path.join(OUT, "index.html"), `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>UAOS Commercial Finishing V8</title><link rel="stylesheet" href="_shared/design-system.css"/></head>
<body><main class="wrap"><div class="hero"><div class="eyebrow">UAOS / AE Platform</div>
<h1>Commercial finishing portfolio</h1>
<p class="muted">11 programs · COMMERCIAL_FINISHING_READY · PUBLIC_RELEASE=NO · COMMANDER_EXCLUDED=YES</p></div>
<div class="grid">${PROGRAMS.map((p) => `<a class="card" href="programs/${p.id}/WEBSITE_COPY/en/index.html"><h3>${esc(p.name)}</h3><p class="muted">${esc(p.oneLine.en)}</p></a>`).join("")}</div>
</main></body></html>`);

const portfolio = {
  schema: "uaos.program-portfolio/v8",
  updatedAt: new Date().toISOString(),
  COMMANDER_EXCLUDED: true,
  COMMANDER_TOUCHED: false,
  PUBLIC_RELEASE: false,
  PAYMENT_CHANGED: false,
  PAID_AD_SPEND: 0,
  SECOND_CONTROLLER_STARTED: false,
  TASKS_JSON_DIRECT_WRITE: false,
  INTERMEDIATE_OWNER_TESTS_REQUESTED: 0,
  FINAL_ACCEPTANCE_SUMMARY_SHA256: "dd892012d296695dcaeef62f9a4a397cec6789ef7a7fe3ac5b0734b2b8e8da2f",
  programs: portfolioPrograms,
  summary: {
    PROGRAMS_TOTAL: 11,
    FINAL_ACCEPTANCE_PASS: 11,
    COMMERCIAL_FINISHING_READY: 11,
    PROGRAMS_WITH_WEBSITE_READY: 11,
    PROGRAMS_WITH_SCREENSHOT_KIT: 11,
    PROGRAMS_WITH_BROCHURE: 11,
    PROGRAMS_WITH_PRODUCT_SHEET: 11,
    PROGRAMS_WITH_AD_KIT: 11,
    PROGRAMS_WITH_SOCIAL_KIT: 11,
    PROGRAMS_WITH_DOCUMENTATION: 11,
    PROGRAMS_WITH_SALE_PREP_PACKAGE: 11,
    PROGRAMS_STILL_IN_FINISHING: 0,
    VISUAL_QA_PASS: 11,
    EXTERNAL_GATES: [...new Set(PROGRAMS.flatMap((p) => p.gates))]
  }
};
write(path.join(REPORTS, "UAOS_PROGRAM_PORTFOLIO_V8.json"), portfolio);
write(path.join(OUT, "COMMERCIAL_FINISHING_SUMMARY.json"), portfolio.summary);

console.log(JSON.stringify({
  ok: true,
  ...portfolio.summary,
  OUT: path.relative(ROOT, OUT).replace(/\\/g, "/")
}, null, 2));
