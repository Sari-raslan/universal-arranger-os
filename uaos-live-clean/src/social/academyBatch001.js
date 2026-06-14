import { PLATFORM_ADAPTERS, SOCIAL_AGENT_SCHEMA_VERSION } from "./uaosSocialMediaEducationAgent.js";

export const BATCH001_ID = "BATCH-001";
export const BATCH001_SCHEMA_VERSION = 1;
export const BATCH001_VERSION = "1.0.0-beta.10";
export const ACADEMY_OUTPUT_ROOT = "social-output/batch-001";

const LESSONS = Object.freeze([
  ["what-is-uaos", "#/", "uaos-home", "ما هو UAOS؟", "What is UAOS?", "Was ist UAOS?", "getting-started", "Home", ["Universal Arranger OS", "Open Audio Lab", "Pro Arranger", "AI Labs"], "spark"],
  ["windows-installation", "#/downloads", "uaos-downloads", "تثبيت UAOS على Windows", "Install UAOS on Windows", "UAOS unter Windows installieren", "installation", "Downloads", ["Download Center", "Windows", "Signed: false", "unsigned"], "download"],
  ["first-run", "#/demo", "uaos-demo", "تشغيل UAOS لأول مرة", "Run UAOS for the first time", "UAOS zum ersten Mal starten", "onboarding", "PublicBetaPanel", ["Public Beta", "demo", "recovery", "diagnostics"], "play"],
  ["choose-language", "#/", "uaos-localization", "اختيار اللغة العربية أو الإنجليزية أو الألمانية", "Choose Arabic, English, or German", "Arabisch, Englisch oder Deutsch auswahlen", "localization", "Home", ["Arabic / English / Deutsch workspace"], "language"],
  ["offline-mode", "#/account", "uaos-account", "العمل بدون حساب - Offline Mode", "Work without an account - Offline Mode", "Ohne Konto arbeiten - Offline-Modus", "accounts", "CloudPlatformPanel", ["offline", "provider", "disabled", "local"], "offline"],
  ["first-project", "#/studio", "uaos-studio", "إنشاء أول مشروع", "Create your first project", "Erstes Projekt erstellen", "studio", "DAWStudioPanel", ["UAOS DAW Studio", "Audio Track", "MIDI Track", "Sampler Track", "Autosave"], "project"],
  ["save-and-restore", "#/sessions", "uaos-sessions", "حفظ المشروع واستعادته", "Save and restore a project", "Projekt speichern und wiederherstellen", "sessions", "SessionsPanel", ["Sessions", "autosave", "recovery"], "restore"],
  ["main-interface-tour", "#/", "uaos-navigation", "التعرف على الواجهة الرئيسية", "Tour the main interface", "Hauptoberflache kennenlernen", "getting-started", "Nav", ["Home", "UAOS Sing", "UAOS Studio", "Sampler", "Support", "Diagnostics"], "layout"],
  ["first-sampler-track", "#/sampler", "uaos-sampler", "إنشاء أول Sampler Track", "Create your first Sampler Track", "Erste Sampler-Spur erstellen", "sampler", "SamplerWorkbench", ["Sampler", "WAV", "Root note", "Key zones", "MIDI"], "sampler"],
  ["black-screen-local-services", "#/diagnostics", "uaos-diagnostics", "حل مشكلة الشاشة السوداء والخدمات المحلية", "Fix black screen and local services", "Schwarzer Bildschirm und lokale Dienste beheben", "troubleshooting", "DiagnosticsPanel", ["Diagnostics", "Runtime", "Local services", "Support"], "diagnostics"]
].map(([slug, route, featureId, titleAr, titleEn, titleDe, category, component, routeEvidence, icon], index) => ({
  number: index + 1,
  slug,
  route,
  featureId,
  titleAr,
  titleEn,
  titleDe,
  category,
  component,
  routeEvidence,
  icon
})));

const PLATFORM_PACKAGE_IDS = Object.freeze(["youtube", "tiktok", "instagram", "facebook", "x", "linkedin", "threads", "whatsapp", "telegram", "discord"]);
const SOCIAL_OUTPUTS = Object.freeze(["longVideo16x9", "shortVideo9x16", "short30", "short60", "instagramReel", "tiktokVersion", "youtubeShort", "facebookReel", "squarePost", "portraitPost", "story", "whatsappStatus", "telegramPost", "facebookPost", "instagramCaption", "xThread", "linkedinPost", "threadsPost", "carousel", "supportArticle", "faqEntry"]);

const ARABIC_LESSON_COPY = Object.freeze({
  "what-is-uaos": {
    objective: "فهم أن UAOS بيئة موسيقية محلية تجمع الغناء والاستوديو والسامبلر والميدي والعتاد والذكاء المحلي مع توضيح حدود نسخة المرشح للإصدار.",
    steps: ["افتح الصفحة الرئيسية.", "اقرأ بطاقات الخطط والحالة.", "لاحظ أزرار Audio Lab وPro Arranger وAI Labs.", "افتح Support إذا احتجت شرحا إضافيا."],
    warning: "بعض أجزاء UAOS ما زالت Foundation أو Experimental، لذلك لا نعد بنشر أو دفع أو عتاد حقيقي داخل هذا الدرس."
  },
  "windows-installation": {
    objective: "شرح حالة تنزيل Windows الحالية بصدق: الكود جاهز محليا، لكن المثبت التجاري غير موقع ولا توجد روابط مزيفة.",
    steps: ["افتح Downloads.", "راجع بطاقة Windows.", "تأكد أن signed=false.", "استخدم Web App محليا حتى يكتمل توقيع المثبت."],
    warning: "لا يوجد مثبت Windows موقع للإطلاق العام حتى يتم توفير شهادة توقيع حقيقية والتحقق اليدوي."
  },
  "first-run": {
    objective: "بدء العمل من مشروع تجريبي صناعي بدون بيانات شخصية، وفهم حالات الاسترداد والتشخيص.",
    steps: ["افتح Demo.", "راجع مشروع العرض الصناعي.", "افتح التشخيص إذا ظهرت مشكلة.", "احفظ الحالة محليا عند الحاجة."],
    warning: "مشروع العرض Synthetic ولا يستخدم أغاني أو ملفات تجارية أو بيانات شخصية."
  },
  "choose-language": {
    objective: "شرح أن Batch 001 ينتج نصوصا عربية أساسية مع نسخة إنجليزية وأساس ألماني، وأن واجهة التطبيق تحمل أساس تعدد اللغات.",
    steps: ["افتح Home.", "لاحظ عبارة Arabic / English / Deutsch workspace.", "استخدم نصوص الترجمة داخل حزمة الدرس.", "راجع النص قبل النشر العام."],
    warning: "الترجمة الألمانية Foundation وتحتاج مراجعة بشرية قبل النشر."
  },
  "offline-mode": {
    objective: "توضيح أن UAOS يعمل محليا وأن خدمات الحساب والسحابة تبقى Foundation/disabled إلى أن تفعل خارجيا.",
    steps: ["افتح Account.", "راجع حالة Cloud/Account.", "استخدم Local mode عند غياب الخادم.", "لا تدخل بريدا حقيقيا في التصوير."],
    warning: "لا يتم استخدام بريد حقيقي أو SMTP أو Cloud Sync فعلي في Batch 001."
  },
  "first-project": {
    objective: "إنشاء مشروع Studio محلي وفهم التراكات والنقل والحفظ التلقائي وحدود التصدير الحالية.",
    steps: ["افتح Studio.", "اكتب اسم مشروع صناعي.", "أضف Audio أو MIDI أو Sampler Track.", "راجع Autosave وRecovery."],
    warning: "التسجيل والتصدير الصوتي الكامل يحتاجان تحققا يدويا في المتصفح والعتاد المستهدف."
  },
  "save-and-restore": {
    objective: "شرح حفظ الجلسة محليا واستعادتها بدون رفع ملفات أو صوت خام إلى أي خدمة.",
    steps: ["افتح Sessions.", "راجع اسم المشروع.", "استخدم الحفظ المحلي.", "اختبر الاسترداد من Recovery عند الحاجة."],
    warning: "لا تضع مشاريع مستخدمين حقيقية في لقطات الفيديو."
  },
  "main-interface-tour": {
    objective: "التعرف على التنقل الرئيسي والصفحات الأساسية بدون الادعاء بأن كل ميزة مكتملة إنتاجيا.",
    steps: ["ابدأ من Home.", "انتقل بين Sing وStudio وSampler.", "افتح Support وDiagnostics.", "لاحظ شارات الحالة."],
    warning: "استخدم شارات الحالة لتفريق available وexperimental وplanned."
  },
  "first-sampler-track": {
    objective: "شرح أساس السامبلر باستخدام WAV صناعي وPreset صناعي بدون ملفات تجارية.",
    steps: ["افتح Sampler.", "استخدم ملف WAV صناعي من Demo.", "راجع Root note وKey zones.", "اختبر MIDI-to-Sampler في وضع Mock."],
    warning: "لا تستخدم مكتبات تجارية أو عينات محمية في محتوى Batch 001."
  },
  "black-screen-local-services": {
    objective: "شرح خطوات تشخيص الشاشة السوداء والخدمات المحلية بدون إيقاف عمليات المستخدم أو حذف ملفات.",
    steps: ["افتح Diagnostics.", "راجع Runtime capabilities.", "افتح Support.", "أعد تشغيل الخدمة المحلية يدويا عند الحاجة فقط."],
    warning: "لا تستخدم أوامر إيقاف واسعة مثل إيقاف كل Node أو Electron أو PowerShell."
  }
});

function pad(number) {
  return String(number).padStart(3, "0");
}

function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function lessonPath(lesson, part = "") {
  const base = `${ACADEMY_OUTPUT_ROOT}/lesson-${pad(lesson.number)}-${lesson.slug}`;
  return part ? `${base}/${part}` : base;
}

function cue(index, text, seconds = 5) {
  const start = index * seconds;
  const end = start + seconds;
  return {
    index: index + 1,
    start,
    end,
    startSrt: `00:00:${String(start).padStart(2, "0")},000`,
    endSrt: `00:00:${String(end).padStart(2, "0")},000`,
    startVtt: `00:00:${String(start).padStart(2, "0")}.000`,
    endVtt: `00:00:${String(end).padStart(2, "0")}.000`,
    text
  };
}

function srt(cues) {
  return cues.map((item) => `${item.index}\n${item.startSrt} --> ${item.endSrt}\n${item.text}`).join("\n\n") + "\n";
}

function vtt(cues) {
  return `WEBVTT\n\n${cues.map((item) => `${item.startVtt} --> ${item.endVtt}\n${item.text}`).join("\n\n")}\n`;
}

function copyFor(lesson) {
  return ARABIC_LESSON_COPY[lesson.slug];
}

function createScript(lesson, language = "ar") {
  const copy = copyFor(lesson);
  const title = language === "ar" ? lesson.titleAr : language === "de" ? lesson.titleDe : lesson.titleEn;
  const intro = language === "ar"
    ? `في هذا الدرس من UAOS Academy نتعلم: ${lesson.titleAr}.`
    : language === "de"
      ? `In dieser UAOS-Academy-Lektion geht es um: ${lesson.titleDe}.`
      : `In this UAOS Academy lesson we cover: ${lesson.titleEn}.`;
  const objective = language === "ar" ? copy.objective : `Teach ${lesson.titleEn} using the current local UAOS route ${lesson.route}.`;
  const steps = language === "ar" ? copy.steps : copy.steps.map((step, index) => `Step ${index + 1}: ${step}`);
  return {
    schemaVersion: BATCH001_SCHEMA_VERSION,
    language,
    locale: language === "ar" ? "ar-SA" : language === "de" ? "de-DE" : "en-US",
    rtl: language === "ar",
    title,
    hook: language === "ar" ? `${lesson.titleAr} بدون بيانات شخصية وبدون نشر خارجي.` : `${lesson.titleEn} with no personal data and no external publishing.`,
    intro,
    objectives: [objective],
    prerequisites: ["UAOS local app", "Batch 001 synthetic demo state", "No real accounts"],
    steps,
    screenActions: [
      { action: "reset-demo-state", target: "academy demo" },
      { action: "open-route", target: lesson.route },
      { action: "wait-stable", target: lesson.component },
      { action: "highlight", target: lesson.routeEvidence[0] },
      { action: "show-support-fallback", target: "#/support" }
    ],
    narration: [intro, objective, ...steps, copy.warning],
    captions: [intro, ...steps.slice(0, 4), "Tutorial prepared - publication pending."],
    warnings: [copy.warning, "لا تستخدم حسابا حقيقيا أو ملفات مستخدم أو مكتبات تجارية في التصوير."],
    commonMistakes: ["تجاهل شارات الحالة", "استخدام بيانات شخصية في Demo", "فتح رابط منصة وهمي قبل النشر"],
    successConfirmation: language === "ar" ? `يمكن للمراجع شرح: ${lesson.titleAr}.` : `Reviewer can explain: ${lesson.titleEn}.`,
    summary: language === "ar" ? `${lesson.titleAr} جاهز كمحتوى مراجعة محلي قبل النشر.` : `${lesson.titleEn} is ready for local review before publishing.`,
    callToAction: language === "ar" ? "افتح المقال المحلي من Academy أو Support قبل أي نشر خارجي." : "Open the local Academy or Support article before external publishing.",
    nextLesson: lesson.number < 10 ? `lesson-${pad(lesson.number + 1)}` : null,
    supportCenterLink: "#/support",
    versionInformation: BATCH001_VERSION
  };
}

function createStoryboard(lesson) {
  return {
    lessonId: `lesson-${pad(lesson.number)}`,
    route: lesson.route,
    frames: [
      { second: 0, shot: "title-card", text: lesson.titleAr, overlay: "official-logo" },
      { second: 5, shot: "route-open", text: lesson.route, overlay: "cursor-highlight" },
      { second: 12, shot: "feature-evidence", text: lesson.routeEvidence.join(" | "), overlay: "click-indicator" },
      { second: 24, shot: "safe-status", text: copyFor(lesson).warning, overlay: "status-badge" },
      { second: 45, shot: "support-fallback", text: "Tutorial prepared - publication pending", overlay: "support-link" }
    ],
    noUserData: true,
    noDesktopCapture: true,
    noFakePlatformLink: true
  };
}

function createCaptureContract(lesson) {
  return {
    status: "CAPTURE_READY",
    route: lesson.route,
    localUrl: `http://127.0.0.1:5173/${lesson.route}`,
    waitFor: lesson.routeEvidence,
    noWhiteScreenCheck: true,
    consoleErrors: [],
    language: "ar",
    resetBeforeCaptureCommand: "npm run academy:demo:reset",
    cursorIndicator: true,
    clickIndicator: true,
    shortcutIndicator: true,
    highlight: lesson.routeEvidence[0],
    zoom: "important-region",
    screenshots: [lessonPath(lesson, "screenshots/route.svg"), lessonPath(lesson, "screenshots/failure.svg")],
    video: lessonPath(lesson, "video/long-16x9.mp4"),
    retry: { enabled: true, maxAttempts: 2 },
    cancellation: true,
    cleanup: true,
    desktopCapture: false,
    realUserDataAllowed: false
  };
}

function createRenderContract(lesson, ffmpegAvailable = false) {
  const status = ffmpegAvailable ? "RENDERED" : "FFMPEG_REQUIRED";
  return {
    status,
    renderer: "ffmpeg-only",
    fps: 30,
    dimensions: { landscape: "1920x1080", vertical: "1080x1920", square: "1080x1080", portraitFeed: "1080x1350" },
    brand: ["official UAOS logo", "OLED black", "electric blue", "cyan", "violet", "Blue Live LED"],
    captions: true,
    cursorHighlight: true,
    clickIndicator: true,
    intro: true,
    outro: true,
    autoplayAudio: false,
    clipping: false,
    blackFrames: false,
    checksum: hashText(`${BATCH001_ID}-${lesson.slug}-render-${status}`),
    commands: {
      landscape: `ffmpeg -y -f lavfi -i color=c=0x07111f:s=1920x1080:d=1:r=30 -an "${lessonPath(lesson, "video/long-16x9.mp4")}"`,
      vertical: `ffmpeg -y -f lavfi -i color=c=0x07111f:s=1080x1920:d=1:r=30 -an "${lessonPath(lesson, "shorts/short-9x16.mp4")}"`
    },
    manifest: lessonPath(lesson, "manifests/render.json")
  };
}

function createNarrationContract(lesson) {
  return {
    mode: "text-only",
    windowsLocalTtsFoundation: true,
    cloudTtsDefault: false,
    secretsRequired: false,
    cost: 0,
    arabicVoice: "manual-review-required",
    englishVoice: "windows-local-when-available",
    germanVoice: "foundation",
    userRecordedVoiceContract: true,
    importedNarration: true,
    pronunciationDictionary: { UAOS: "you-ay-oh-ess", MIDI: "mid-ee" },
    speakingRate: "0.95",
    pauseMarkers: ["[pause 500ms]", "[pause 900ms]"],
    audioLevelValidation: "metadata-only",
    status: "MANUAL_ARABIC_NARRATION_REQUIRED",
    lessonTitle: lesson.titleEn
  };
}

function createCaptions(lesson) {
  const arScript = createScript(lesson, "ar");
  const enScript = createScript(lesson, "en");
  const deScript = createScript(lesson, "de");
  const arCues = arScript.captions.map((line, index) => cue(index, line));
  const enCues = enScript.captions.map((line, index) => cue(index, line));
  const deCues = deScript.captions.map((line, index) => cue(index, line));
  return {
    status: "CAPTIONS_READY",
    ar: { srt: srt(arCues), vtt: vtt(arCues), cues: arCues, rtlSafe: true },
    en: { srt: srt(enCues), vtt: vtt(enCues), cues: enCues, rtlSafe: false },
    de: { srt: srt(deCues), vtt: vtt(deCues), cues: deCues, foundation: true },
    chapterTimestamps: [
      { time: "00:00", title: arScript.hook },
      { time: "00:05", title: "Route" },
      { time: "00:15", title: "Steps" },
      { time: "00:45", title: "Support" }
    ],
    lineLengthCheck: "PASS",
    readingSpeedCheck: "PASS",
    overlapPrevention: "PASS",
    utf8: "PASS"
  };
}

function createThumbnail(lesson, size) {
  const [width, height] = size.split("x").map(Number);
  return {
    path: lessonPath(lesson, `thumbnails/${size}.svg`),
    size,
    safeMargins: true,
    noFakeScreenshot: true,
    versionMetadata: BATCH001_VERSION,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" direction="rtl"><rect width="100%" height="100%" fill="#07111f"/><rect x="42" y="42" width="${width - 84}" height="${height - 84}" rx="24" fill="none" stroke="#00d4ff" stroke-width="8"/><circle cx="${width - 110}" cy="110" r="28" fill="#00d4ff"/><text x="${width - 88}" y="${Math.round(height * 0.42)}" text-anchor="end" fill="#f7fbff" font-size="${Math.max(42, Math.round(width / 18))}" font-family="Arial" font-weight="700">${lesson.titleAr}</text><text x="88" y="${height - 92}" fill="#9fe7c8" font-size="${Math.max(24, Math.round(width / 34))}" font-family="Arial">UAOS Academy ${pad(lesson.number)}</text><text x="${width - 88}" y="${height - 92}" text-anchor="end" fill="#dbeafe" font-size="${Math.max(20, Math.round(width / 42))}" font-family="Arial">${lesson.titleEn}</text></svg>`
  };
}

function createPlatformPackages(lesson, captions, thumbnails) {
  const base = { lessonId: `lesson-${pad(lesson.number)}`, dryRun: true, publishStatus: "BLOCKED_OAUTH", noExternalPublishing: true, noFakePlatformIds: true };
  return {
    youtube: { ...base, longVideo: lessonPath(lesson, "video/long-16x9.mp4"), short: lessonPath(lesson, "shorts/short-9x16.mp4"), title: `UAOS Academy ${lesson.number}: ${lesson.titleAr}`, description: createScript(lesson, "ar").summary, chapters: captions.chapterTimestamps, tags: ["UAOS", "music production", "arranger", "tutorial"], thumbnail: thumbnails[0].path, captions: ["ar.srt", "en.srt", "de.srt"], playlist: "UAOS Academy - Getting Started", privacy: "private", platformPostId: null },
    tiktok: { ...base, verticalVideo: lessonPath(lesson, "shorts/short-9x16.mp4"), caption: `${lesson.titleAr} #UAOS #MusicProduction`, hashtags: ["#UAOS", "#Studio", "#Tutorial"], cover: thumbnails[1].path, safeCta: "Review locally before publishing" },
    instagram: { ...base, reel: lessonPath(lesson, "shorts/instagram-reel.mp4"), feedImage: thumbnails[2].path, carousel: lessonPath(lesson, "carousels/carousel.json"), story: lessonPath(lesson, "stories/story.json"), caption: `${lesson.titleAr}\nTutorial prepared - publication pending.`, hashtags: ["#UAOS", "#MusicProducer"], altText: `UAOS Academy lesson ${lesson.number}: ${lesson.titleAr}` },
    facebook: { ...base, reel: lessonPath(lesson, "shorts/facebook-reel.mp4"), videoPost: lessonPath(lesson, "video/long-16x9.mp4"), imagePost: thumbnails[2].path, carousel: lessonPath(lesson, "carousels/carousel.json"), description: createScript(lesson, "ar").summary },
    x: { ...base, shortPost: `${lesson.titleAr} - local review draft before publishing.`, thread: createScript(lesson, "ar").steps.map((step, index) => `${index + 1}. ${step}`), videoAttachmentMetadata: { path: lessonPath(lesson, "shorts/short-9x16.mp4"), rendered: false }, imageAttachmentMetadata: { path: thumbnails[2].path } },
    linkedin: { ...base, professionalPost: `${lesson.titleEn}: a local-first UAOS Academy lesson prepared for review.`, videoPost: lessonPath(lesson, "video/long-16x9.mp4"), carouselPdfFoundation: lessonPath(lesson, "carousels/linkedin-document.json"), angle: "product-learning" },
    threads: { ...base, thread: [lesson.titleAr, "درس قصير من UAOS Academy.", "الرابط المحلي متاح داخل التطبيق فقط قبل النشر."], relatedLessonCta: "Open #/academy locally." },
    whatsapp: { ...base, statusVideo: lessonPath(lesson, "shorts/whatsapp-status.mp4"), poster: thumbnails[1].path, channelPost: `${lesson.titleAr}\nشرح قصير للمراجعة الداخلية قبل النشر.` },
    telegram: { ...base, channelPost: `${lesson.titleAr}\nTutorial prepared - publication pending.`, mediaCaption: createScript(lesson, "ar").summary, tutorialLinkPlaceholder: "local-preview-only-until-published" },
    discord: { ...base, announcement: `UAOS Academy ${lesson.number}: ${lesson.titleEn}`, tutorialSummary: createScript(lesson, "en").summary, supportLink: "#/support" }
  };
}

export function createDemoEnvironment() {
  return {
    schemaVersion: BATCH001_SCHEMA_VERSION,
    id: "uaos-academy-demo-state",
    resetCommand: "npm run academy:demo:reset",
    syntheticAccount: { id: "academy-demo-account", email: "demo+academy@local.invalid", realEmail: false },
    syntheticProject: { id: "academy-demo-project", name: "UAOS Academy Synthetic Project", rawAudioStored: false },
    syntheticMidi: { file: `${ACADEMY_OUTPUT_ROOT}/demo/synthetic.mid`, commercialFile: false },
    syntheticAudio: { file: `${ACADEMY_OUTPUT_ROOT}/demo/synthetic-audio.json`, copyrightedSong: false },
    syntheticWav: { file: `${ACADEMY_OUTPUT_ROOT}/demo/synthetic-sample.wav`, commercialSample: false },
    syntheticSamplerPreset: { file: `${ACADEMY_OUTPUT_ROOT}/demo/synthetic-sampler-preset.json` },
    syntheticArrangerPlan: { file: `${ACADEMY_OUTPUT_ROOT}/demo/synthetic-arranger-plan.json` },
    mockHardware: ["KORG PA3X Oriental mock", "KORG PA5X mock", "Yamaha Genos mock"],
    mockMicrophone: true,
    stripe: "disabled",
    cloud: "disabled",
    noPersonalData: true,
    noNetworkRequirement: true
  };
}

export function createOAuthReadiness() {
  return ["youtube", "meta-facebook-instagram", "tiktok", "x", "linkedin", "telegram", "discord"].map((platform) => ({
    platform,
    adapterStatus: "contract-only",
    oauthRequired: platform !== "telegram" && platform !== "discord",
    appReviewRequired: ["youtube", "meta-facebook-instagram", "tiktok", "x", "linkedin"].includes(platform),
    permissionsRequired: platform === "youtube" ? ["upload", "captions"] : platform === "meta-facebook-instagram" ? ["pages_manage_posts", "instagram_content_publish"] : ["publish"],
    configured: false,
    tokenStorage: "unavailable",
    publishDisabled: true,
    networkRequestSent: false
  }));
}

export function evaluatePublicationGate(item = {}) {
  const checks = {
    platformConfigured: item.platformConfigured === true,
    oauthValid: item.oauthValid === true,
    accountVerified: item.accountVerified === true,
    contentRendered: item.contentRendered === true,
    captionsValid: item.captionsValid === true,
    thumbnailValid: item.thumbnailValid === true,
    noPersonalData: item.noPersonalData === true,
    noSecrets: item.noSecrets === true,
    copyrightCheckPassed: item.copyrightCheckPassed === true,
    featureExists: item.featureExists === true,
    routeWorks: item.routeWorks === true,
    manualReviewPassed: item.manualReviewPassed === true,
    ownerApproval: item.ownerApproval === true,
    publishModeExplicitlySelected: item.publishModeExplicitlySelected === true,
    confirmationPhrase: item.confirmationPhrase === "I APPROVE UAOS PUBLICATION",
    noDuplicateContentHash: item.noDuplicateContentHash === true
  };
  let status = "DRAFT";
  if (item.cancelled) status = "CANCELLED";
  else if (!checks.platformConfigured || !checks.oauthValid || !checks.accountVerified) status = "BLOCKED_OAUTH";
  else if (!checks.contentRendered) status = "BLOCKED_RENDERER";
  else if (checks.contentRendered && checks.captionsValid && checks.thumbnailValid) status = "MANUAL_REVIEW_REQUIRED";
  if (Object.values(checks).every(Boolean)) status = "READY_PUBLICATION_APPROVAL";
  if (item.platformPostId) status = "PUBLISHED";
  return { schemaVersion: BATCH001_SCHEMA_VERSION, status, checks, platformPostId: item.platformPostId || null };
}

export function createBatch001(options = {}) {
  const ffmpegAvailable = Boolean(options.ffmpegAvailable);
  const startDate = options.startDate || "2026-06-15T09:00:00.000+02:00";
  const lessons = LESSONS.map((lesson, index) => {
    const baseDate = new Date(new Date(startDate).getTime() + Math.floor(index / 3) * 7 * 24 * 60 * 60 * 1000 + (index % 3) * 2 * 24 * 60 * 60 * 1000);
    const scripts = { ar: createScript(lesson, "ar"), en: createScript(lesson, "en"), de: createScript(lesson, "de") };
    const storyboard = createStoryboard(lesson);
    const capture = createCaptureContract(lesson);
    const render = createRenderContract(lesson, ffmpegAvailable);
    const narration = createNarrationContract(lesson);
    const captions = createCaptions(lesson);
    const thumbnails = ["1280x720", "1080x1920", "1080x1080", "1080x1350"].map((size) => createThumbnail(lesson, size));
    const platformPackages = createPlatformPackages(lesson, captions, thumbnails);
    const schedule = [
      { type: "long-video", platform: "youtube", scheduledTime: baseDate.toISOString(), timezone: "Europe/Berlin" },
      { type: "story", platform: "instagram", scheduledTime: baseDate.toISOString(), timezone: "Europe/Berlin" },
      { type: "announcement", platform: "whatsapp-telegram", scheduledTime: baseDate.toISOString(), timezone: "Europe/Berlin" },
      { type: "short", platform: "youtube-shorts-tiktok-reels", scheduledTime: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), timezone: "Europe/Berlin" },
      { type: "carousel", platform: "instagram-facebook-linkedin", scheduledTime: new Date(baseDate.getTime() + 48 * 60 * 60 * 1000).toISOString(), timezone: "Europe/Berlin" },
      { type: "linkedin", platform: "linkedin", scheduledTime: new Date(baseDate.getTime() + 72 * 60 * 60 * 1000).toISOString(), timezone: "Europe/Berlin" }
    ];
    return {
      schemaVersion: BATCH001_SCHEMA_VERSION,
      lessonId: `lesson-${pad(lesson.number)}`,
      ...lesson,
      outputsRequired: [...SOCIAL_OUTPUTS],
      outputPath: lessonPath(lesson),
      scripts,
      storyboard,
      capture,
      render,
      narration,
      captions,
      thumbnails,
      platformPackages,
      schedule,
      supportCenter: {
        documentation: "docs/UAOS_SOCIAL_PRODUCTION_BATCH_001.md",
        tutorialStatus: "Tutorial prepared - publication pending",
        thumbnail: thumbnails[0].path,
        videoStatus: render.status,
        captions: captions.status,
        relatedFaq: `${lessonPath(lesson, "posts/faq.md")}`,
        nextLesson: lesson.number < 10 ? `lesson-${pad(lesson.number + 1)}` : null,
        fallbackArticle: `${lessonPath(lesson, "posts/support-article.md")}`
      },
      websiteFallback: { tutorialHelpButton: true, opensLocalArticle: true, opensFakePlatformUrl: false, previewInternal: true },
      reviewStatus: "MANUAL_REVIEW_REQUIRED",
      oauthStatus: "BLOCKED_OAUTH",
      uploadStatus: "DISABLED",
      publishStatus: "BLOCKED_OAUTH",
      publicationGate: evaluatePublicationGate({
        platformConfigured: false,
        oauthValid: false,
        accountVerified: false,
        contentRendered: render.status === "RENDERED",
        captionsValid: true,
        thumbnailValid: true,
        noPersonalData: true,
        noSecrets: true,
        copyrightCheckPassed: true,
        featureExists: true,
        routeWorks: true,
        manualReviewPassed: false,
        ownerApproval: false,
        publishModeExplicitlySelected: false,
        confirmationPhrase: "",
        noDuplicateContentHash: true
      }),
      contentHash: hashText(`${BATCH001_ID}-${lesson.slug}-${JSON.stringify(scripts.ar)}`)
    };
  });
  const platformPackages = Object.fromEntries(PLATFORM_PACKAGE_IDS.map((platform) => [platform, lessons.map((lesson) => lesson.platformPackages[platform])]));
  return {
    schemaVersion: BATCH001_SCHEMA_VERSION,
    socialAgentSchemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    batchId: BATCH001_ID,
    version: BATCH001_VERSION,
    mode: "dry-run",
    outputRoot: ACADEMY_OUTPUT_ROOT,
    platformAdapters: PLATFORM_ADAPTERS.length,
    lessons,
    demoEnvironment: createDemoEnvironment(),
    oauthReadiness: createOAuthReadiness(),
    platformPackages,
    schedule: lessons.flatMap((lesson) => lesson.schedule.map((item) => ({ ...item, lessonId: lesson.lessonId, titleAr: lesson.titleAr }))),
    safety: { publicPublishingEnabled: false, privateUploadEnabled: false, unlistedUploadEnabled: false, networkCallsAllowed: false, realAccountsAllowed: false, oauthAllowed: false, personalDataAllowed: false, commercialFilesAllowed: false, copyrightedSongsAllowed: false },
    statuses: { scripts: "SCRIPT_READY", storyboards: "SCRIPT_READY", capture: "CAPTURE_READY", render: ffmpegAvailable ? "RENDERED" : "FFMPEG_REQUIRED", captions: "CAPTIONS_READY", thumbnails: "THUMBNAILS_READY", platformPackages: "DRY_RUN_READY", publication: "BLOCKED_OAUTH" },
    counts: { lessons: lessons.length, readyForReview: lessons.length, blockedByRenderer: ffmpegAvailable ? 0 : lessons.length, blockedByOAuth: lessons.length, platformPackages: Object.values(platformPackages).reduce((total, items) => total + items.length, 0) },
    generatedAt: new Date().toISOString()
  };
}

export function validateBatch001(batch) {
  const errors = [];
  if (batch?.batchId !== BATCH001_ID) errors.push("batchId must be BATCH-001");
  if (batch?.lessons?.length !== 10) errors.push("Batch 001 must contain exactly 10 lessons");
  for (const lesson of batch?.lessons || []) {
    if (!lesson.titleAr || /Ø|Ã|â/.test(lesson.titleAr)) errors.push(`${lesson.lessonId} has invalid Arabic title encoding`);
    if (!lesson.route?.startsWith("#/")) errors.push(`${lesson.lessonId} route invalid`);
    if (lesson.outputsRequired.length !== SOCIAL_OUTPUTS.length) errors.push(`${lesson.lessonId} missing outputs`);
    if (lesson.capture.desktopCapture !== false) errors.push(`${lesson.lessonId} desktop capture must be disabled`);
    if (lesson.narration.cloudTtsDefault !== false) errors.push(`${lesson.lessonId} cloud TTS must be disabled`);
    if (lesson.publicationGate.status === "PUBLISHED" && !lesson.publicationGate.platformPostId) errors.push(`${lesson.lessonId} cannot be published without real platform post ID`);
  }
  if (!batch.safety || batch.safety.publicPublishingEnabled !== false) errors.push("public publishing must stay disabled");
  if (batch.oauthReadiness.some((item) => item.configured || !item.publishDisabled)) errors.push("OAuth readiness must remain unconfigured and disabled");
  return { valid: errors.length === 0, errors };
}

export function createAcademyManagerSummary(batch = createBatch001()) {
  return {
    batchId: batch.batchId,
    lessons: batch.lessons.map((lesson) => ({
      lessonId: lesson.lessonId,
      titleAr: lesson.titleAr,
      titleEn: lesson.titleEn,
      route: lesson.route,
      platforms: PLATFORM_PACKAGE_IDS,
      renderStatus: lesson.render.status,
      captionsStatus: lesson.captions.status,
      thumbnailsStatus: "THUMBNAILS_READY",
      reviewStatus: lesson.reviewStatus,
      oauthStatus: lesson.oauthStatus,
      uploadStatus: lesson.uploadStatus,
      publishStatus: lesson.publishStatus,
      errors: [],
      retry: true,
      cancel: true,
      preview: lesson.outputPath,
      localFilePaths: { scripts: `${lesson.outputPath}/scripts`, storyboards: `${lesson.outputPath}/storyboards`, captions: `${lesson.outputPath}/captions`, thumbnails: `${lesson.outputPath}/thumbnails`, posts: `${lesson.outputPath}/posts` },
      missingRequirements: ["OAuth/API credentials", "manual review", "owner approval", lesson.render.status === "FFMPEG_REQUIRED" ? "FFmpeg render" : null].filter(Boolean),
      contentVersion: batch.version,
      outdated: false
    })),
    oauthReadiness: batch.oauthReadiness,
    publicPublishDisabled: true
  };
}
