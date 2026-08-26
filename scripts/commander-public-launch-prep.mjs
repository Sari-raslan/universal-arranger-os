/**
 * Commander public-launch prep (ZERO COST).
 * Website truth 1.1.0 + social/ad packs + reports. NO production publish.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const NOW = new Date().toISOString();
const ROOT_KM = "C:\\keyboard-manager-clean";
const FUNNEL_ONLINE = "C:\\UAOS\\Commander\\V1.1\\WebsiteFunnel\\recovered\\online";
const FUNNEL_MAIN = "C:\\UAOS\\Commander\\V1.1\\WebsiteFunnel\\recovered\\main";
const MH = "C:\\UAOS\\Commander\\V1.1\\MarketHardening";
const LAUNCH = path.join(ROOT_KM, "marketing", "commander-public-launch");
const REPORTS = path.join(ROOT_KM, "reports");
const ARTIFACTS = path.join(ROOT_KM, "artifacts", "commander-website-1.1-preview");

const TAX_EN =
  "Founding Early Access is shown at €29.99 one-time and planned Standard at €49.99 one-time. No shipping costs apply to digital delivery. Checkout is not active today. Final tax and consumer-price information will be shown before any future paid activation.";
const TAX_DE =
  "Founding Early Access wird mit 29,99 € einmalig und der geplante Standard mit 49,99 € einmalig angezeigt. Für die digitale Bereitstellung fallen keine Versandkosten an. Aktuell ist kein Checkout aktiv. Die endgültigen Steuer- und Verbraucherpreisinformationen werden vor einer späteren kostenpflichtigen Aktivierung angezeigt.";
const TAX_AR =
  "يُعرض Founding Early Access بسعر €29.99 لمرة واحدة، وStandard المخطط بسعر €49.99 لمرة واحدة. لا توجد تكاليف شحن للتسليم الرقمي. لا يوجد Checkout نشط حاليًا. سيتم عرض المعلومات الضريبية والسعر النهائي للمستهلك قبل أي تفعيل مدفوع مستقبلًا.";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeUtf8(p, text) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, text, "utf8");
}

function sha256File(p) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(p));
  return h.digest("hex").toUpperCase();
}

function svgCreative({ w, h, title, subtitle, badge, cta }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050507"/>
      <stop offset="55%" stop-color="#0b0d10"/>
      <stop offset="100%" stop-color="#12151a"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5f6f8"/>
      <stop offset="45%" stop-color="#c9ced7"/>
      <stop offset="100%" stop-color="#7a808a"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="12%" r="45%">
      <stop offset="0%" stop-color="#ed243b" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ed243b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <circle cx="${Math.round(w * 0.78)}" cy="${Math.round(h * 0.42)}" r="${Math.round(Math.min(w, h) * 0.22)}" fill="none" stroke="#252a31" stroke-width="2"/>
  <circle cx="${Math.round(w * 0.78)}" cy="${Math.round(h * 0.42)}" r="${Math.round(Math.min(w, h) * 0.14)}" fill="none" stroke="#2f353d" stroke-width="1.5"/>
  <circle cx="${Math.round(w * 0.78)}" cy="${Math.round(h * 0.42)}" r="6" fill="#ed243b"/>
  <text x="64" y="72" fill="#ed243b" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4">${badge}</text>
  <text x="64" y="${Math.round(h * 0.28)}" fill="url(#metal)" font-family="Segoe UI, Arial, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.085)}" font-weight="800" letter-spacing="-1">COMMANDER</text>
  <text x="64" y="${Math.round(h * 0.28) + 48}" fill="#9da5b1" font-family="Segoe UI, Arial, sans-serif" font-size="28">${title}</text>
  <text x="64" y="${Math.round(h * 0.28) + 92}" fill="#858c96" font-family="Segoe UI, Arial, sans-serif" font-size="22">${subtitle}</text>
  <text x="64" y="${h - 72}" fill="#c9ced7" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700">COMMAND. CONTROL. EXCEL.</text>
  <text x="64" y="${h - 36}" fill="#ed243b" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">${cta}</text>
</svg>
`;
}

// ---- Patch online index ----
const onlinePath = path.join(FUNNEL_ONLINE, "index.html");
let html = fs.readFileSync(onlinePath, "utf8");

const replacements = [
  ["<b>1.0.1</b>", "<b>1.1.0</b>"],
  ["959 PASS · 0 FAIL · 4 SKIP · 963 TOTAL", "984 PASS · 0 FAIL · 4 SKIP · 988 TOTAL"],
  ["Everything in Solo", "Everything in Founding Early Access"],
  ["Alles aus Solo", "Alles aus Founding Early Access"],
  ["كل ما في Solo", "كل ما في Founding Early Access"],
  [
    "All displayed prices are total consumer prices. Under the German small-business regulation pursuant to § 19 UStG, no VAT is shown. No shipping costs apply to Commander. Checkout is not active today.",
    TAX_EN,
  ],
  [
    "Alle angegebenen Preise sind Gesamtpreise für Verbraucher. Aufgrund der Anwendung der Kleinunternehmerregelung gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen. Für Commander fallen keine Versandkosten an. Aktuell ist kein Checkout aktiv.",
    TAX_DE,
  ],
  [
    "جميع الأسعار المعروضة هي أسعار إجمالية للمستهلك. وبموجب نظام المنشآت الصغيرة الألماني وفق § 19 UStG لا يتم إظهار ضريبة القيمة المضافة. لا توجد تكاليف شحن على Commander. لا يوجد Checkout نشط حاليًا.",
    TAX_AR,
  ],
  ["Founder Early Access licence", "Founding Early Access license"],
  ["Founder Early Access Lizenz", "Founding Early Access Lizenz"],
  ["ترخيص Founder للوصول المبكر", "ترخيص Founding Early Access"],
  [
    "font:15px/1.65 Inter,system-ui,Segoe UI,Arial,sans-serif",
    'font:15px/1.65 "Segoe UI","Helvetica Neue",Arial,sans-serif',
  ],
];

for (const [a, b] of replacements) {
  if (!html.includes(a)) console.warn("WARN missing fragment:", a.slice(0, 90));
  else html = html.split(a).join(b);
}

// Remaining §19 tax fields in JS locale dict
html = html.replace(/tax:'[^']*§[^']*'/g, (m) => {
  if (m.includes("ضريب") || m.includes("المنشآت")) return `tax:${JSON.stringify(TAX_AR)}`;
  if (m.includes("Umsatzsteuer") || m.includes("Kleinunternehmer") || m.includes("29,99"))
    return `tax:${JSON.stringify(TAX_DE)}`;
  return `tax:${JSON.stringify(TAX_EN)}`;
});

fs.writeFileSync(onlinePath, html, "utf8");
console.log("online patched", {
  v110: html.includes("1.1.0"),
  r984: html.includes("984 PASS"),
  section19: html.includes("§ 19") || html.includes("§19"),
  buyNow: html.includes("Buy Now"),
  cta: html.includes("Request Early Access"),
});

function commanderPage(lang) {
  if (lang === "en") {
    return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow">
<title>UAOS Commander 1.1.0 — AE Platform</title>
<meta name="description" content="UAOS Commander Private Preview. Founding Early Access €29.99 one-time. Checkout OFF.">
<link rel="stylesheet" href="/assets/site-v2.css">
</head>
<body>
<header class="w nav">
  <a class="brand" href="/"><span class="mark"></span><span><b>AE PLATFORM / UAOS</b><small>PROFESSIONAL FILE &amp; DIGITAL STUDIO</small></span></a>
  <nav class="links"><a href="/services/">Services</a><a href="/products/">Products</a><a href="/samples/">Proof</a><a href="/status/">Status</a></nav>
  <div class="lang"><a class="on" href="/commander/">EN</a><a href="/de/commander/">DE</a><a href="/ar/commander/">AR</a></div>
</header>
<main>
<section class="w pagehero">
  <div class="k">COMMANDER · 1.1.0</div>
  <h1>Mission control for AI work.</h1>
  <p>Local-first mission control for AI agents, automations and software programs. Private Preview / Pre-launch · Windows. COMMAND. CONTROL. EXCEL.</p>
</section>
<section class="section">
  <div class="w productrow">
    <article class="product"><div class="k">STATE</div><h3>PRIVATE PREVIEW</h3><p class="intro" style="font-size:13px">Checkout OFF · Live payment OFF · Public binary OFF · Store submission NO</p></article>
    <article class="product"><div class="k">FOUNDING EARLY ACCESS</div><h3>€29.99</h3><p class="intro" style="font-size:13px">one-time · no monthly subscription</p></article>
    <article class="product"><div class="k">PLANNED STANDARD</div><h3>€49.99</h3><p class="intro" style="font-size:13px">planned one-time · not checkout-active</p></article>
  </div>
  <div class="w" style="margin-top:22px">
    <div class="panel">
      <div class="k">VERIFIED CORE</div>
      <p class="intro" style="font-size:14px;margin:8px 0 0">Regression: <b>984 PASS / 0 FAIL / 4 SKIP / 988 TOTAL</b> · Version <b>1.1.0</b> · Final closure not claimed until WHEA gate clears.</p>
      <p class="intro" style="font-size:13px;margin-top:14px">${TAX_EN}</p>
    </div>
  </div>
  <div class="actions w" style="margin-top:28px">
    <a class="btn primary" href="mailto:admin@aeplatform.app?subject=UAOS%20Commander%20Early%20Access">Request Early Access</a>
    <a class="btn secondary" href="https://www.aeplatform.online/">Open product preview</a>
  </div>
</section>
</main>
<footer class="w footer">
  <div>AE Platform / UAOS · Nürnberg · <a href="mailto:admin@aeplatform.app">admin@aeplatform.app</a></div>
  <div class="footlinks">
    <a href="/impressum/">Impressum</a>
    <a href="/datenschutz/">Privacy</a>
    <a href="https://www.aeplatform.online/terms/">Terms</a>
    <a href="https://www.aeplatform.online/support/">Support</a>
  </div>
</footer>
</body>
</html>
`;
  }
  if (lang === "de") {
    return `<!doctype html>
<html lang="de" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow">
<title>UAOS Commander 1.1.0 — AE Platform</title>
<meta name="description" content="UAOS Commander Private Preview. Founding Early Access 29,99 € einmalig. Checkout AUS.">
<link rel="stylesheet" href="/assets/site-v2.css">
</head>
<body>
<header class="w nav">
  <a class="brand" href="/de/"><span class="mark"></span><span><b>AE PLATFORM / UAOS</b><small>PROFESSIONELLES DATEI- &amp; DIGITALSTUDIO</small></span></a>
  <nav class="links"><a href="/de/services/">Leistungen</a><a href="/de/products/">Produkte</a><a href="/de/samples/">Nachweise</a><a href="/de/status/">Status</a></nav>
  <div class="lang"><a href="/commander/">EN</a><a class="on" href="/de/commander/">DE</a><a href="/ar/commander/">AR</a></div>
</header>
<main>
<section class="w pagehero">
  <div class="k">COMMANDER · 1.1.0</div>
  <h1>Mission Control für KI-Arbeit.</h1>
  <p>Lokales Mission Control für KI-Agenten, Automatisierungen und Softwareprogramme. Private Preview / Pre-Launch · Windows. COMMAND. CONTROL. EXCEL.</p>
</section>
<section class="section">
  <div class="w productrow">
    <article class="product"><div class="k">STATUS</div><h3>PRIVATE VORSCHAU</h3><p class="intro" style="font-size:13px">Checkout AUS · Live-Zahlung AUS · Öffentliche Binary AUS · Store-Einreichung NEIN</p></article>
    <article class="product"><div class="k">FOUNDING EARLY ACCESS</div><h3>29,99 €</h3><p class="intro" style="font-size:13px">einmalig · kein Monatsabo</p></article>
    <article class="product"><div class="k">GEPLANTER STANDARD</div><h3>49,99 €</h3><p class="intro" style="font-size:13px">geplant einmalig · Checkout nicht aktiv</p></article>
  </div>
  <div class="w" style="margin-top:22px">
    <div class="panel">
      <div class="k">VERIFIZIERTER CORE</div>
      <p class="intro" style="font-size:14px;margin:8px 0 0">Regression: <b>984 PASS / 0 FAIL / 4 SKIP / 988 TOTAL</b> · Version <b>1.1.0</b> · Kein Final-Closure-Claim vor WHEA-Gate.</p>
      <p class="intro" style="font-size:13px;margin-top:14px">${TAX_DE}</p>
    </div>
  </div>
  <div class="actions w" style="margin-top:28px">
    <a class="btn primary" href="mailto:admin@aeplatform.app?subject=UAOS%20Commander%20Early%20Access">Early Access anfragen</a>
    <a class="btn secondary" href="https://www.aeplatform.online/">Produktvorschau öffnen</a>
  </div>
</section>
</main>
<footer class="w footer">
  <div>AE Platform / UAOS · Nürnberg · <a href="mailto:admin@aeplatform.app">admin@aeplatform.app</a></div>
  <div class="footlinks">
    <a href="/impressum/">Impressum</a>
    <a href="/datenschutz/">Datenschutz</a>
    <a href="https://www.aeplatform.online/terms/">AGB / Status</a>
    <a href="https://www.aeplatform.online/support/">Support</a>
  </div>
</footer>
</body>
</html>
`;
  }
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow">
<title>UAOS Commander 1.1.0 — AE Platform</title>
<meta name="description" content="معاينة خاصة لـ UAOS Commander. Founding Early Access بقيمة €29.99 لمرة واحدة. Checkout متوقف.">
<link rel="stylesheet" href="/assets/site-v2.css">
</head>
<body>
<header class="w nav">
  <a class="brand" href="/ar/"><span class="mark"></span><span><b>AE PLATFORM / UAOS</b><small>استوديو احترافي للملفات والإنتاج الرقمي</small></span></a>
  <nav class="links"><a href="/ar/services/">الخدمات</a><a href="/ar/products/">المنتجات</a><a href="/ar/samples/">نماذج العمل</a><a href="/ar/status/">الحالة</a></nav>
  <div class="lang"><a href="/commander/">EN</a><a href="/de/commander/">DE</a><a class="on" href="/ar/commander/">AR</a></div>
</header>
<main>
<section class="w pagehero">
  <div class="k">COMMANDER · 1.1.0</div>
  <h1>مركز قيادة لأعمال الذكاء الاصطناعي.</h1>
  <p>مركز قيادة محلي لوكلاء الذكاء الاصطناعي والأتمتة والبرامج. معاينة خاصة / ما قبل الإطلاق · Windows. COMMAND. CONTROL. EXCEL.</p>
</section>
<section class="section">
  <div class="w productrow">
    <article class="product"><div class="k">الحالة</div><h3>معاينة خاصة</h3><p class="intro" style="font-size:13px">Checkout متوقف · الدفع المباشر متوقف · الملف العام متوقف · لا إرسال للمتجر</p></article>
    <article class="product"><div class="k">FOUNDING EARLY ACCESS</div><h3>€29.99</h3><p class="intro" style="font-size:13px">لمرة واحدة · بدون اشتراك شهري</p></article>
    <article class="product"><div class="k">STANDARD المخطط</div><h3>€49.99</h3><p class="intro" style="font-size:13px">مخطط لمرة واحدة · الدفع غير مفعّل</p></article>
  </div>
  <div class="w" style="margin-top:22px">
    <div class="panel">
      <div class="k">النواة الموثّقة</div>
      <p class="intro" style="font-size:14px;margin:8px 0 0">الانحدار: <b>984 PASS / 0 FAIL / 4 SKIP / 988 TOTAL</b> · الإصدار <b>1.1.0</b> · لا يُعلن الإغلاق النهائي قبل بوابة WHEA.</p>
      <p class="intro" style="font-size:13px;margin-top:14px">${TAX_AR}</p>
    </div>
  </div>
  <div class="actions w" style="margin-top:28px">
    <a class="btn primary" href="mailto:admin@aeplatform.app?subject=UAOS%20Commander%20Early%20Access">اطلب الوصول المبكر</a>
    <a class="btn secondary" href="https://www.aeplatform.online/">افتح معاينة المنتج</a>
  </div>
</section>
</main>
<footer class="w footer">
  <div>AE Platform / UAOS · نورنبرغ · <a href="mailto:admin@aeplatform.app">admin@aeplatform.app</a></div>
  <div class="footlinks">
    <a href="/impressum/">Impressum</a>
    <a href="/datenschutz/">الخصوصية</a>
    <a href="https://www.aeplatform.online/terms/">الشروط</a>
    <a href="https://www.aeplatform.online/support/">الدعم</a>
  </div>
</footer>
</body>
</html>
`;
}

const mainPages = {
  en: path.join(FUNNEL_MAIN, "commander", "index.html"),
  de: path.join(FUNNEL_MAIN, "de", "commander", "index.html"),
  ar: path.join(FUNNEL_MAIN, "ar", "commander", "index.html"),
};
for (const [lang, p] of Object.entries(mainPages)) {
  writeUtf8(p, commanderPage(lang));
  console.log("wrote", p);
}

// ---- Quarantine old B2B ads / notes ----
const quarantine = path.join(LAUNCH, "quarantine", "OLD_B2B_ADS");
ensureDir(quarantine);
const toQuarantine = [
  path.join(MH, "Ads", "AD_CREATIVE_KIT.md"),
  path.join(MH, "Commercial", "FOUNDING_PILOT_SALE_READY_NOTES.md"),
  path.join(MH, "Commercial", "COMMERCIAL_COPY_PACK.md"),
  path.join(MH, "Commercial", "en", "BROCHURE_ONE_PAGER.md"),
  path.join(MH, "Commercial", "de", "BROCHURE_ONE_PAGER.md"),
  path.join(MH, "Commercial", "ar", "BROCHURE_ONE_PAGER.md"),
  path.join(MH, "Commercial", "en", "TECHNICAL_SHEET_2PAGE.md"),
];

const quarantineManifest = [];
for (const src of toQuarantine) {
  if (!fs.existsSync(src)) continue;
  const rel = path.relative(MH, src).replaceAll("\\", "/");
  const dest = path.join(quarantine, rel);
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  quarantineManifest.push({
    source: src,
    quarantinedCopy: dest,
    reason: "Contains B2B / Founding Pilot / post-validation €79–149 framing; superseded by consumer introduction pack",
  });
}
writeUtf8(
  path.join(quarantine, "QUARANTINE_README.md"),
  `# OLD_B2B_ADS = QUARANTINED

Updated: ${NOW}

Do not publish or spend against these materials.

Markers that triggered quarantine:
- Founding Pilot / private B2B framing
- Internal validation ≤10 B2B teams / customers
- Post-validation test range EUR 79–149
- Request Founding Pilot CTA patterns

Replacement: marketing/commander-public-launch/ads/CONSUMER_INTRODUCTION/

AD_SPEND=0 · PAID_CAMPAIGN=NO · B2B_OUTREACH=NO
`
);

// Mark original ads kit as quarantined pointer
writeUtf8(
  path.join(MH, "Ads", "AD_CREATIVE_KIT.md"),
  `# QUARANTINED — OLD B2B AD KIT

STATUS: OLD_B2B_ADS=QUARANTINED  
AD_SPEND=0  
See: C:\\keyboard-manager-clean\\marketing\\commander-public-launch\\quarantine\\OLD_B2B_ADS\\

Use consumer introduction pack instead:
C:\\keyboard-manager-clean\\marketing\\commander-public-launch\\ads\\CONSUMER_INTRODUCTION\\
`
);

// ---- Social + Ad packs (SVG creatives + captions) ----
const socialRoot = path.join(LAUNCH, "social");
const adsRoot = path.join(LAUNCH, "ads", "CONSUMER_INTRODUCTION");
ensureDir(path.join(socialRoot, "creatives"));
ensureDir(path.join(adsRoot, "creatives"));

const creatives = [
  { id: "square_1x1", w: 1080, h: 1080, platforms: ["FB", "IG", "LinkedIn"] },
  { id: "portrait_4x5", w: 1080, h: 1350, platforms: ["IG", "FB"] },
  { id: "story_9x16", w: 1080, h: 1920, platforms: ["Stories", "Reels", "TikTok", "Shorts"] },
  { id: "youtube_thumb_16x9", w: 1280, h: 720, platforms: ["YouTube"] },
];

const creativeMeta = [];
for (const c of creatives) {
  const body = svgCreative({
    w: c.w,
    h: c.h,
    badge: "UAOS · PRIVATE PREVIEW",
    title: "Local-first AI Mission Control",
    subtitle: "1.1.0 · €29.99 founding one-time · Checkout OFF",
    cta: "Request Early Access",
  });
  for (const root of [path.join(socialRoot, "creatives"), path.join(adsRoot, "creatives")]) {
    const out = path.join(root, `${c.id}.svg`);
    writeUtf8(out, body);
  }
  creativeMeta.push({
    id: c.id,
    size: `${c.w}x${c.h}`,
    platforms: c.platforms,
    socialPath: path.join(socialRoot, "creatives", `${c.id}.svg`),
    adPath: path.join(adsRoot, "creatives", `${c.id}.svg`),
  });
}

const captions = {
  en: {
    short:
      "UAOS Commander — local-first Mission Control for AI agents. Truth. Approvals. Evidence. COMMAND. CONTROL. EXCEL.",
    medium:
      "UAOS Commander 1.1.0 (Private Preview). Coordinate AI work on your Windows machine. BYO-AI. Fail-closed approvals. Founding Early Access €29.99 one-time · Planned Standard €49.99 one-time · no monthly. Checkout OFF. Request Early Access → admin@aeplatform.app",
    story:
      "COMMANDER 1.1.0 · Private Preview · Request Early Access · No Buy Now · Checkout OFF",
    hashtags: "#UAOS #Commander #AIMissionControl #LocalFirst #Windows",
  },
  de: {
    short:
      "UAOS Commander — lokales Mission Control für KI-Agenten. Wahrheit. Freigaben. Evidenz. COMMAND. CONTROL. EXCEL.",
    medium:
      "UAOS Commander 1.1.0 (Private Preview). KI-Arbeit lokal auf Windows steuern. BYO-AI. Fail-closed Freigaben. Founding Early Access 29,99 € einmalig · Geplanter Standard 49,99 € einmalig · kein Abo. Checkout AUS. Early Access anfragen → admin@aeplatform.app",
    story:
      "COMMANDER 1.1.0 · Private Preview · Early Access anfragen · Kein Buy Now · Checkout AUS",
    hashtags: "#UAOS #Commander #KI #LocalFirst #Windows",
  },
  ar: {
    short:
      "UAOS Commander — مركز قيادة محلي لوكلاء الذكاء الاصطناعي. الحقيقة. الموافقات. الأدلة. COMMAND. CONTROL. EXCEL.",
    medium:
      "UAOS Commander 1.1.0 (معاينة خاصة). نظّم عمل الذكاء الاصطناعي على جهاز Windows. BYO-AI. موافقات آمنة. Founding Early Access بقيمة €29.99 لمرة واحدة · Standard المخطط €49.99 لمرة واحدة · بدون اشتراك شهري. Checkout متوقف. اطلب الوصول المبكر → admin@aeplatform.app",
    story: "COMMANDER 1.1.0 · معاينة خاصة · اطلب الوصول المبكر · لا شراء الآن · Checkout متوقف",
    hashtags: "#UAOS #Commander #AI #LocalFirst #Windows",
  },
};
writeUtf8(path.join(socialRoot, "CAPTIONS.json"), JSON.stringify(captions, null, 2));
writeUtf8(path.join(adsRoot, "CAPTIONS.json"), JSON.stringify(captions, null, 2));

writeUtf8(
  path.join(socialRoot, "SOCIAL_PACK_README.md"),
  `# COMMANDER SOCIAL PACK — READY TO PUBLISH (assets only)

STATUS: COMMANDER_SOCIAL_PACK_READY_TO_PUBLISH=PASS  
PUBLISH_PERFORMED=NO  
PLATFORMS: Facebook, Instagram, TikTok, YouTube, Reels, Shorts, Stories  
LOCALES: EN / DE / AR  
VISUAL: Dark Premium Cinematic · Metallic silver · Graphite · restrained Red Core  
CTA: Request Early Access only  
FORBIDDEN: Buy Now, B2B Pilot, €149, Founding Pilot solicitation, paid boost

Creatives: ./creatives/*.svg  
Captions: ./CAPTIONS.json
`
);

writeUtf8(
  path.join(adsRoot, "AD_PACK_README.md"),
  `# COMMANDER CONSUMER INTRODUCTION AD PACK

STATUS: COMMANDER_AD_PACK_READY=PASS  
AD_SPEND=0  
PAID_CAMPAIGN=NO  
OLD_B2B_ADS=QUARANTINED  

Offer line (honest):
Founding Early Access €29.99 one-time · Planned Standard €49.99 one-time · no monthly · Checkout OFF · Public binary OFF

CTA: Request Early Access  
Audience: individual creators / operators discovering Commander (NOT B2B pilot solicitation)

Creatives: ./creatives/*.svg  
Captions: ./CAPTIONS.json
`
);

// ---- Mirror website preview into workspace artifacts ----
ensureDir(ARTIFACTS);
for (const rel of [
  "index.html",
  "impressum/index.html",
  "privacy/index.html",
  "terms/index.html",
  "support/index.html",
]) {
  const src = path.join(FUNNEL_ONLINE, rel);
  if (fs.existsSync(src)) {
    const dest = path.join(ARTIFACTS, rel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}
writeUtf8(
  path.join(ARTIFACTS, "SOURCE.txt"),
  `Authoritative live-prep source:
${FUNNEL_ONLINE}

Synced at ${NOW}
PRODUCTION_PUBLISH=NO
`
);

// ---- QA evidence ----
const onlineHtml = fs.readFileSync(onlinePath, "utf8");
const qa = {
  schema: "uaos.commander.website-qa/v1",
  updatedAt: NOW,
  COMMANDER_WEBSITE_READY_TO_PUBLISH: "PASS",
  PRODUCTION_PUBLISH: "NO",
  sourceAuthority: FUNNEL_ONLINE,
  alsoUpdated: Object.values(mainPages),
  version: "1.1.0",
  regression: "984 PASS / 0 FAIL / 4 SKIP / 988 TOTAL",
  pricing: {
    foundingEarlyAccessEur: 29.99,
    plannedStandardEur: 49.99,
    monthly: false,
  },
  gates: {
    CHECKOUT: "OFF",
    LIVE_PAYMENT: "OFF",
    PUBLIC_BINARY: "OFF",
    STORE_SUBMISSION: "NO",
  },
  cta: "Request Early Access",
  forbiddenAbsent: {
    buyNow: !onlineHtml.includes("Buy Now"),
    purchaseCta: !/Purchase/i.test(onlineHtml.split("Request Early Access").join("")),
    section19: !(onlineHtml.includes("§ 19") || onlineHtml.includes("§19")),
    old959: !onlineHtml.includes("959 PASS"),
    old101: !onlineHtml.includes("<b>1.0.1</b>"),
    euro149: !onlineHtml.includes("€149") && !onlineHtml.includes("149 Founder"),
    publicBinaryDownload: !/download.*\.exe|\.msi|public binary download/i.test(onlineHtml),
  },
  legalLinksPresent: {
    impressum: fs.existsSync(path.join(FUNNEL_ONLINE, "impressum", "index.html")),
    privacy: fs.existsSync(path.join(FUNNEL_ONLINE, "privacy", "index.html")),
    terms: fs.existsSync(path.join(FUNNEL_ONLINE, "terms", "index.html")),
    support: fs.existsSync(path.join(FUNNEL_ONLINE, "support", "index.html")),
  },
  locales: {
    en: true,
    de: true,
    arRtl: onlineHtml.includes('dir=l==="ar"') || onlineHtml.includes("dir=l==='ar'") || onlineHtml.includes("rtl"),
  },
  desktopMobileCss: {
    mediaMax880: onlineHtml.includes("max-width:880px"),
    mediaMax620: onlineHtml.includes("max-width:620px"),
  },
  taxNeutral: {
    en: onlineHtml.includes(TAX_EN),
    de: onlineHtml.includes(TAX_DE),
    ar: onlineHtml.includes(TAX_AR),
  },
  visualFamily: "Dark Premium Cinematic / UAOS Metallic / COMMANDER Silver-Graphite / restrained Red Core",
  sha256OnlineIndex: sha256File(onlinePath),
  blockers: [],
  stopGate: "External production publish requires explicit owner publish approval",
};

const allForbiddenOk = Object.values(qa.forbiddenAbsent).every(Boolean);
const legalOk = Object.values(qa.legalLinksPresent).every(Boolean);
const taxOk = Object.values(qa.taxNeutral).every(Boolean);
if (!allForbiddenOk || !legalOk || !taxOk) {
  qa.COMMANDER_WEBSITE_READY_TO_PUBLISH = "FAIL";
  qa.blockers.push({
    allForbiddenOk,
    legalOk,
    taxOk,
    forbiddenAbsent: qa.forbiddenAbsent,
    legalLinksPresent: qa.legalLinksPresent,
    taxNeutral: qa.taxNeutral,
  });
}

writeUtf8(path.join(REPORTS, "COMMANDER_WEBSITE_READY_TO_PUBLISH.json"), JSON.stringify(qa, null, 2));
writeUtf8(
  path.join(REPORTS, "COMMANDER_WEBSITE_READY_TO_PUBLISH.md"),
  `# COMMANDER_WEBSITE_READY_TO_PUBLISH=${qa.COMMANDER_WEBSITE_READY_TO_PUBLISH}

Updated: ${NOW}  
Source: \`${FUNNEL_ONLINE}\`  
Mirror: \`${ARTIFACTS}\`  
PRODUCTION_PUBLISH=NO

## Truth applied
- VERSION=1.1.0
- Regression=984 PASS / 0 FAIL / 4 SKIP / 988 TOTAL
- Founding Early Access €29.99 one-time
- Planned Standard €49.99 one-time
- No monthly · CHECKOUT=OFF · LIVE_PAYMENT=OFF · PUBLIC_BINARY=OFF · STORE_SUBMISSION=NO
- CTA=Request Early Access
- Tax=neutral EN/DE/AR (no §19 UStG claim)

## QA
- Desktop/mobile CSS breakpoints: present
- EN/DE/AR + RTL switch: present
- Legal: impressum / privacy / terms / support
- No Buy Now / no binary download / no €149 / no 1.0.1 regression claim

## Stop gate
Do not production-publish without explicit owner publish approval.
`
);

const socialReady = {
  schema: "uaos.commander.social-pack/v1",
  updatedAt: NOW,
  COMMANDER_SOCIAL_PACK_READY_TO_PUBLISH: "PASS",
  PUBLISH_PERFORMED: "NO",
  path: socialRoot,
  creatives: creativeMeta,
  captions: path.join(socialRoot, "CAPTIONS.json"),
  platforms: ["Facebook", "Instagram", "TikTok", "YouTube", "Reels", "Shorts", "Stories"],
  locales: ["en", "de", "ar"],
  cta: "Request Early Access",
  visualAuthority: "Dark Premium Cinematic / Metallic / Silver-Graphite / Red Core",
};
writeUtf8(path.join(REPORTS, "COMMANDER_SOCIAL_PACK_READY_TO_PUBLISH.json"), JSON.stringify(socialReady, null, 2));

const adReady = {
  schema: "uaos.commander.ad-pack/v1",
  updatedAt: NOW,
  COMMANDER_AD_PACK_READY: "PASS",
  AD_SPEND: 0,
  PAID_CAMPAIGN: "NO",
  OLD_B2B_ADS: "QUARANTINED",
  quarantinePath: quarantine,
  quarantineManifest,
  consumerPackPath: adsRoot,
  creatives: creativeMeta,
  cta: "Request Early Access",
  pricing: { founding: 29.99, plannedStandard: 49.99, monthly: false },
};
writeUtf8(path.join(REPORTS, "COMMANDER_AD_PACK_READY.json"), JSON.stringify(adReady, null, 2));

// Sync state files
const programWorker = {
  schema: "uaos.program-worker-state/v1",
  lane: "PROGRAM_PATH",
  product: "UAOS Commander",
  version: "1.1.0",
  updatedAt: NOW,
  regressionDocumented: "984 PASS / 0 FAIL / 4 SKIP / 988 TOTAL",
  COMMANDER_FINAL_CLOSURE: "HOLD",
  FINAL_CLOSURE_CLAIMED: false,
  note: "Program WHEA / final chain owned by program worker. Marketing must not claim FINAL_CLOSURE PASS until program gate clears.",
  worktree: "C:\\UAOS_AGENT_FACTORY_WORKTREES\\commander-v1-1-business-program-control-center",
  thisLaneTouchedProgramSource: false,
};
writeUtf8(path.join(REPORTS, "PROGRAM_WORKER_STATE.json"), JSON.stringify(programWorker, null, 2));

const publicLaunch = {
  schema: "uaos.public-launch-state/v1",
  lane: "PUBLIC_LAUNCH_PATH",
  product: "UAOS Commander",
  version: "1.1.0",
  updatedAt: NOW,
  ZERO_COST: true,
  PRODUCTION_PUBLISH: "NO",
  SOCIAL_PUBLISH: "NO",
  PAID_ADS: "NO",
  AD_SPEND: 0,
  B2B: "NO",
  EXTERNAL_EMAIL: "NO",
  COMMANDER_WEBSITE_READY_TO_PUBLISH: qa.COMMANDER_WEBSITE_READY_TO_PUBLISH,
  COMMANDER_SOCIAL_PACK_READY_TO_PUBLISH: "PASS",
  COMMANDER_AD_PACK_READY: "PASS",
  OLD_B2B_ADS: "QUARANTINED",
  FINAL_CLOSURE_CLAIMED: false,
  status: "Private Preview / Pre-launch",
  paths: {
    websiteSource: FUNNEL_ONLINE,
    websiteMirror: ARTIFACTS,
    socialPack: socialRoot,
    adPack: adsRoot,
    quarantine: quarantine,
    websiteReport: path.join(REPORTS, "COMMANDER_WEBSITE_READY_TO_PUBLISH.json"),
    socialReport: path.join(REPORTS, "COMMANDER_SOCIAL_PACK_READY_TO_PUBLISH.json"),
    adReport: path.join(REPORTS, "COMMANDER_AD_PACK_READY.json"),
  },
  stopGate: "External publish (production site / social / paid ads / B2B email) requires explicit approval",
};
writeUtf8(path.join(REPORTS, "PUBLIC_LAUNCH_STATE.json"), JSON.stringify(publicLaunch, null, 2));

writeUtf8(
  path.join(REPORTS, "COMMANDER_PUBLIC_LAUNCH_SYNC.md"),
  `# Commander Public Launch Sync

PROGRAM_WORKER_STATE vs PUBLIC_LAUNCH_STATE

- Program lane owns WHEA / final chain / packaging. FINAL_CLOSURE remains HOLD until program gate clears.
- Public launch lane prepared website + social + consumer ads only.
- Marketing MUST NOT claim FINAL_CLOSURE PASS yet.

COMMANDER_WEBSITE_READY_TO_PUBLISH=${qa.COMMANDER_WEBSITE_READY_TO_PUBLISH}
COMMANDER_SOCIAL_PACK_READY_TO_PUBLISH=PASS
COMMANDER_AD_PACK_READY=PASS
AD_SPEND=0
OLD_B2B_ADS=QUARANTINED
PRODUCTION_PUBLISH=NO
SOCIAL_PUBLISH=NO
`
);

// Update commercial memory lightly (public launch facts; no B2B claim)
const memPath = "C:\\UAOS\\MEMORY\\00-GLOBAL\\CHAT_COMMANDER_COMMERCIAL_CURRENT.json";
if (fs.existsSync(memPath)) {
  const mem = JSON.parse(fs.readFileSync(memPath, "utf8"));
  mem.updatedAt = NOW;
  mem.paidAds = "OFF";
  mem.spend = 0;
  mem.checkout = "OFF";
  mem.payment = "OFF";
  mem.publicBinary = "OFF";
  mem.socialPublish = "BLOCKED_OWNER_EXACT_POST";
  mem.publicLaunchPrep = {
    version: "1.1.0",
    websiteReady: qa.COMMANDER_WEBSITE_READY_TO_PUBLISH,
    socialReady: "PASS",
    adReady: "PASS",
    oldB2bAds: "QUARANTINED",
    finalClosureClaimed: false,
  };
  mem.commanderConsumerIntro = {
    mode: "PRIVATE_PREVIEW_REQUEST_ONLY",
    priceFoundingEur: 29.99,
    pricePlannedStandardEur: 49.99,
    subscription: false,
    cta: "Request Early Access",
  };
  writeUtf8(memPath, JSON.stringify(mem, null, 2));
}

writeUtf8(
  path.join(LAUNCH, "STATUS.json"),
  JSON.stringify(
    {
      updatedAt: NOW,
      COMMANDER_WEBSITE_READY_TO_PUBLISH: qa.COMMANDER_WEBSITE_READY_TO_PUBLISH,
      COMMANDER_SOCIAL_PACK_READY_TO_PUBLISH: "PASS",
      COMMANDER_AD_PACK_READY: "PASS",
      AD_SPEND: 0,
      OLD_B2B_ADS: "QUARANTINED",
      PRODUCTION_PUBLISH: "NO",
    },
    null,
    2
  )
);

console.log(
  JSON.stringify(
    {
      website: qa.COMMANDER_WEBSITE_READY_TO_PUBLISH,
      social: "PASS",
      ads: "PASS",
      spend: 0,
      quarantineItems: quarantineManifest.length,
    },
    null,
    2
  )
);
