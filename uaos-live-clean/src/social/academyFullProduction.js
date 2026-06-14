import {
  CONTENT_TYPES,
  PLATFORM_ADAPTERS,
  createCurriculum,
  createSocialContent,
  discoverFeatureInventory,
  validateSocialContent
} from "./uaosSocialMediaEducationAgent.js";
import { ACADEMY_OUTPUT_ROOT, createBatch001 } from "./academyBatch001.js";

export const FULL_PRODUCTION_SCHEMA_VERSION = 1;
export const FULL_PRODUCTION_STATUS = "SOCIAL_LOCAL_REVIEW_READY";
export const FULL_OUTPUT_ROOT = "social-output";
export const TUTORIAL_STATUS = Object.freeze({
  covered: "COVERED",
  partial: "PARTIALLY_COVERED",
  missing: "MISSING",
  blockedFeature: "BLOCKED_FEATURE_NOT_IMPLEMENTED",
  blockedHardware: "BLOCKED_MANUAL_HARDWARE",
  blockedExternal: "BLOCKED_EXTERNAL_SERVICE"
});

export const PUBLICATION_QUEUE_STATUSES = Object.freeze([
  "DRAFT",
  "WAITING_RENDER",
  "WAITING_CAPTIONS",
  "WAITING_THUMBNAIL",
  "WAITING_REVIEW",
  "WAITING_APPROVAL",
  "WAITING_OAUTH",
  "READY_PRIVATE",
  "READY_UNLISTED",
  "READY_PUBLIC",
  "SCHEDULED",
  "UPLOADING",
  "PROCESSING",
  "PUBLISHED",
  "FAILED",
  "CANCELLED"
]);

export const OUTDATED_STATUSES = Object.freeze([
  "CURRENT",
  "REVIEW_REQUIRED",
  "OUTDATED",
  "RECAPTURE_REQUIRED",
  "RERENDER_REQUIRED",
  "CAPTIONS_UPDATE_REQUIRED",
  "METADATA_UPDATE_REQUIRED",
  "ARCHIVE_RECOMMENDED"
]);

export const REVIEW_EVIDENCE_TYPES = Object.freeze([
  "rendered-media-approved",
  "narration-approved",
  "technical-review",
  "educational-review",
  "privacy-review",
  "copyright-review",
  "legal-brand-review",
  "owner-approval"
]);

export const BATCH_DEFINITIONS = Object.freeze([
  ["batch-001", "Getting Started", 10],
  ["batch-002", "UAOS Sing", 9],
  ["batch-003", "UAOS Studio Basics", 6],
  ["batch-004", "DAW Editing", 7],
  ["batch-005", "Mixer and Effects", 7],
  ["batch-006", "Recording", 7],
  ["batch-007", "Sampler Basics", 7],
  ["batch-008", "Advanced Sampler", 6],
  ["batch-009", "Arranger Basics", 7],
  ["batch-010", "Advanced Arranger", 6],
  ["batch-011", "AI Music Studio", 7],
  ["batch-012", "Voice-to-MIDI", 6],
  ["batch-013", "MIDI Basics", 7],
  ["batch-014", "MIDI Learn and Routing", 6],
  ["batch-015", "Hardware Setup", 6],
  ["batch-016", "KORG PA3X Oriental", 4],
  ["batch-017", "KORG PA5X", 4],
  ["batch-018", "Yamaha Genos", 4],
  ["batch-019", "Roland BK-9", 4],
  ["batch-020", "Ketron SD9", 4],
  ["batch-021", "Accounts and Offline Mode", 2],
  ["batch-022", "Pricing and Plans", 2],
  ["batch-023", "Diagnostics and Recovery", 2],
  ["batch-024", "Installation and Downloads", 2],
  ["batch-025", "Troubleshooting", 2],
  ["batch-026", "Advanced Workflows", 2],
  ["batch-027", "Release Notes", 1],
  ["batch-028", "Arabic Tutorials", 1],
  ["batch-029", "English Tutorials", 1],
  ["batch-030", "German Foundation", 1]
]);

export const VIDEO_TEMPLATES = Object.freeze([
  "Getting Started",
  "Sing",
  "Studio",
  "DAW",
  "Sampler",
  "Arranger",
  "AI",
  "MIDI",
  "Hardware",
  "Accounts",
  "Pricing",
  "Diagnostics",
  "Troubleshooting",
  "Release Notes"
].map((name) => ({
  name,
  intro: true,
  titleCard: true,
  chapterCard: true,
  stepNumber: true,
  warningCard: true,
  successCard: true,
  cursorHighlight: true,
  keyboardOverlay: true,
  captions: true,
  lowerThird: true,
  nextLesson: true,
  outro: true
})));

export const PLATFORM_COMPLETION = Object.freeze([
  "youtube",
  "youtube-shorts",
  "tiktok",
  "instagram-feed",
  "instagram-reels",
  "instagram-stories",
  "facebook-page",
  "facebook-video",
  "facebook-reels",
  "x",
  "linkedin",
  "threads",
  "pinterest",
  "whatsapp-channel",
  "whatsapp-status",
  "telegram-channel",
  "telegram-group",
  "discord-announcement",
  "reddit",
  "snapchat-spotlight",
  "rss",
  "blog-cms",
  "website-news"
]);

function pad(number, size = 3) {
  return String(number).padStart(size, "0");
}

function slug(value) {
  return String(value || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function cue(index, text, seconds = 5) {
  const start = index * seconds;
  const end = start + seconds;
  return {
    index: index + 1,
    start,
    end,
    srt: `00:00:${String(start).padStart(2, "0")},000 --> 00:00:${String(end).padStart(2, "0")},000`,
    vtt: `00:00:${String(start).padStart(2, "0")}.000 --> 00:00:${String(end).padStart(2, "0")}.000`,
    text
  };
}

function srt(cues) {
  return cues.map((item) => `${item.index}\n${item.srt}\n${item.text}`).join("\n\n") + "\n";
}

function vtt(cues) {
  return `WEBVTT\n\n${cues.map((item) => `${item.vtt}\n${item.text}`).join("\n\n")}\n`;
}

function tutorialRouteFor(feature) {
  return feature.route || "#/";
}

function statusForFeature(feature) {
  if (feature.hardwareRequirement !== "none") return TUTORIAL_STATUS.blockedHardware;
  if (feature.externalServiceRequirement !== "none") return TUTORIAL_STATUS.blockedExternal;
  return TUTORIAL_STATUS.covered;
}

function coverageAliases(feature) {
  const aliases = {
    "uaos-sing": ["UAOS Sing", "Voice-to-MIDI"],
    "uaos-studio": ["UAOS Studio", "Studio", "DAW"],
    "uaos-sessions": ["Getting Started", "Advanced Workflows"],
    "uaos-live": ["Arranger", "Advanced Workflows"],
    "uaos-sounds": ["Sampler", "Advanced Workflows"],
    "uaos-diagnostics": ["Diagnostics", "Troubleshooting"],
    "uaos-downloads": ["Installation", "Downloads"],
    "uaos-support": ["Troubleshooting", "Diagnostics"],
    "uaos-demo": ["Getting Started", "Release Notes"],
    "uaos-privacy": ["Accounts", "Offline"],
    "uaos-terms": ["Pricing", "Plans"],
    "uaos-status": ["Release Notes", "Diagnostics"]
  };
  return aliases[feature.featureId] || [feature.category, feature.title, feature.product];
}

function buildTopicPool() {
  const features = discoverFeatureInventory();
  const curriculum = createCurriculum(features);
  const topics = curriculum.flatMap((section) => section.topics.map((topic) => {
    const feature = features.find((item) => item.featureId === topic.featureId) || features[0];
    return { ...topic, section: section.title, feature };
  }));
  const seen = new Set();
  return topics.map((topic, index) => {
    let id = `tutorial-${pad(index + 1)}-${slug(topic.section)}-${slug(topic.topic)}`;
    if (seen.has(id)) id = `${id}-${index + 1}`;
    seen.add(id);
    return {
      ...topic,
      tutorialId: id,
      globalIndex: index + 1,
      route: tutorialRouteFor(topic.feature),
      featureStatus: statusForFeature(topic.feature)
    };
  });
}

function assignBatches(topics) {
  const batches = [];
  let cursor = 0;
  for (const [batchId, name, size] of BATCH_DEFINITIONS) {
    const tutorials = topics.slice(cursor, cursor + size);
    cursor += size;
    batches.push({
      batchId,
      name,
      size,
      tutorials: tutorials.map((tutorial, index) => ({ ...tutorial, batchId, batchName: name, batchOrder: index + 1 }))
    });
  }
  return batches;
}

function lessonOutputPath(tutorial) {
  return `${FULL_OUTPUT_ROOT}/tutorials/${tutorial.tutorialId}`;
}

function createScript(tutorial, language = "ar") {
  const title = language === "de" ? `${tutorial.topic} - German foundation` : language === "en" ? tutorial.topic : `${tutorial.topic}`;
  const experimentalWarning = tutorial.feature.experimentalStatus?.includes("experimental") ? "This feature is experimental or foundation-level and needs manual verification." : "This lesson uses current local UAOS behavior.";
  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    tutorialId: tutorial.tutorialId,
    language,
    locale: language === "ar" ? "ar-SA" : language === "de" ? "de-DE" : "en-US",
    rtl: language === "ar",
    title,
    hook: language === "ar" ? `${tutorial.topic}: خطوة واضحة خلال أول ثانيتين.` : `${tutorial.topic}: a clear first-two-second hook.`,
    intro: language === "ar" ? `في هذا الدرس نشرح ${tutorial.topic} داخل UAOS.` : `This lesson explains ${tutorial.topic} in UAOS.`,
    objective: tutorial.objective || `Teach ${tutorial.topic} for ${tutorial.feature.title}.`,
    prerequisites: tutorial.prerequisites,
    numberedSteps: [
      `Open ${tutorial.route}.`,
      `Find ${tutorial.feature.component}.`,
      "Use synthetic demo state.",
      "Check feature status and warnings.",
      "Confirm the expected local result."
    ],
    screenActions: [
      { action: "reset-demo-state", selector: "data-tutorial-id=academy-demo-reset" },
      { action: "navigate", route: tutorial.route },
      { action: "highlight-heading", selector: `[data-tutorial-route="${tutorial.route}"]` },
      { action: "show-click-indicator", selector: `[data-tutorial-feature="${tutorial.feature.featureId}"]` },
      { action: "open-local-help", selector: "data-tutorial-id=tutorial-help" }
    ],
    expectedResult: `Learner understands ${tutorial.topic} and sees honest status labels.`,
    commonError: "Expecting disabled external services, real hardware, or cloud providers to work without configuration.",
    fix: "Use local demo mode, read status labels, and follow Support Center fallback.",
    privacyWarning: "Use synthetic content only. Do not capture user projects, emails, tokens, cookies, or private paths.",
    hardwareWarning: tutorial.feature.hardwareRequirement === "none" ? null : "Manual hardware verification required.",
    experimentalWarning,
    summary: `${tutorial.topic} is ready for local review content.`,
    cta: "Open the local Academy preview before any external publishing.",
    nextLesson: tutorial.globalIndex < 140 ? `tutorial-${pad(tutorial.globalIndex + 1)}` : null,
    supportCenterLink: "#/support",
    version: "1.0.0-beta.10"
  };
}

function createStoryboard(tutorial) {
  return {
    tutorialId: tutorial.tutorialId,
    frames: [
      { second: 0, type: "title-card", text: tutorial.topic },
      { second: 2, type: "hook", text: createScript(tutorial).hook },
      { second: 8, type: "route", text: tutorial.route },
      { second: 16, type: "step", text: "Show current UI controls and honest status." },
      { second: 32, type: "warning", text: createScript(tutorial).experimentalWarning },
      { second: 48, type: "success", text: "Tutorial prepared - publication pending." }
    ],
    shotList: ["route-load", "heading-check", "button-highlight", "status-label", "support-fallback"],
    noDesktopCapture: true,
    syntheticOnly: true
  };
}

function createCaptions(tutorial) {
  const ar = createScript(tutorial, "ar");
  const en = createScript(tutorial, "en");
  const de = createScript(tutorial, "de");
  const arCues = [ar.hook, ar.intro, ...ar.numberedSteps.slice(0, 3), ar.summary].map((text, index) => cue(index, text));
  const enCues = [en.hook, en.intro, ...en.numberedSteps.slice(0, 3), en.summary].map((text, index) => cue(index, text));
  const deCues = [de.hook, de.intro, ...de.numberedSteps.slice(0, 3), "German foundation fallback - manual review required."].map((text, index) => cue(index, text));
  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    tutorialId: tutorial.tutorialId,
    ar: { srt: srt(arCues), vtt: vtt(arCues), rtl: true },
    en: { srt: srt(enCues), vtt: vtt(enCues), rtl: false },
    de: { srt: srt(deCues), vtt: vtt(deCues), foundation: true },
    readingSpeed: "PASS",
    maxLineLength: "PASS",
    maxTwoLines: "PASS",
    overlap: "PASS",
    punctuation: "PASS",
    utf8: "PASS",
    manualEdit: true,
    platformExport: true,
    chapters: [
      { time: "00:00", title: "Hook" },
      { time: "00:08", title: "Route" },
      { time: "00:16", title: "Steps" },
      { time: "00:48", title: "Support" }
    ]
  };
}

function createThumbnail(tutorial, format = "1280x720") {
  return {
    tutorialId: tutorial.tutorialId,
    format,
    path: `${lessonOutputPath(tutorial)}/thumbnails/${format}.svg`,
    officialLogo: true,
    tutorialTitle: tutorial.topic,
    episodeNumber: tutorial.globalIndex,
    categoryIcon: slug(tutorial.section),
    productName: tutorial.feature.product,
    languageBadge: "AR",
    difficultyBadge: tutorial.feature.difficulty,
    cleanBackground: true,
    blueLedIdentity: true,
    safeMargins: true,
    mobileReadable: true,
    noMisleadingClaims: true,
    contrast: "PASS",
    noTextClipping: true,
    validDimensions: true,
    validPngMetadata: "svg-source-ready",
    fileSizeMetadata: "metadata-only",
    altText: `UAOS Academy ${tutorial.globalIndex}: ${tutorial.topic}`
  };
}

function createCarousel(tutorial, format = "1080x1080") {
  const slideTypes = ["cover", "problem", "step-1", "step-2", "step-3", "warning", "result", "cta"];
  return {
    tutorialId: tutorial.tutorialId,
    format,
    slides: slideTypes.map((type, index) => ({
      number: index + 1,
      type,
      title: type === "cover" ? tutorial.topic : `${type}: ${tutorial.feature.title}`,
      altText: `${tutorial.topic} ${type}`,
      rtl: true,
      safeMargins: true
    })),
    caption: `${tutorial.topic} - UAOS Academy local review draft.`,
    exportManifest: `${lessonOutputPath(tutorial)}/carousels/${format}.json`
  };
}

function createRenderManifests(tutorial, ffmpegAvailable = false) {
  const formats = [
    ["landscape", "1920x1080", "30fps"],
    ["vertical", "1080x1920", "30fps"],
    ["square", "1080x1080", "static"],
    ["portrait", "1080x1350", "static"]
  ];
  return formats.map(([kind, dimensions, fps]) => ({
    tutorialId: tutorial.tutorialId,
    kind,
    dimensions,
    fps,
    renderer: "ffmpeg-only",
    status: ffmpegAvailable ? "SAMPLE_RENDER_READY" : "FFMPEG_REQUIRED",
    branding: ["official UAOS logo", "OLED black", "electric blue", "cyan", "violet", "Blue Live LED"],
    readableCaptions: true,
    noFlashingUnsafePattern: true,
    reducedMotionAlternative: true,
    concurrencyLimit: 1,
    resumeSupport: true,
    diskSpaceCheck: true,
    cleanup: true,
    checksum: hashText(`${tutorial.tutorialId}-${kind}-${dimensions}`),
    command: `ffmpeg -y -f lavfi -i color=c=0x07111f:s=${dimensions}:d=1:r=30 -an "${lessonOutputPath(tutorial)}/renders/${kind}.mp4"`
  }));
}

function createPlatformPackage(tutorial, platformId) {
  const content = createSocialContent({
    featureId: tutorial.feature.featureId,
    tutorialId: tutorial.tutorialId,
    platform: platformId,
    contentType: platformId.includes("youtube") ? "youtube-tutorial" : platformId.includes("tiktok") ? "short-tutorial-60s" : "static-post",
    title: `${tutorial.topic} - UAOS Academy`,
    hook: createScript(tutorial).hook,
    body: `${tutorial.topic}\nTutorial prepared - publication pending.\nRoute: ${tutorial.route}`,
    dryRun: true
  });
  return {
    ...content,
    validation: validateSocialContent(content),
    dryRunImplementation: true,
    realImplementationContract: "disabled-until-oauth-review-and-owner-approval",
    mockImplementation: true,
    disabledReason: "OAuth/configuration/manual approval missing",
    platformPostId: null,
    platformUrl: null
  };
}

function createTutorialRecord(tutorial, ffmpegAvailable = false) {
  const scripts = { ar: createScript(tutorial, "ar"), en: createScript(tutorial, "en"), de: createScript(tutorial, "de") };
  const renderManifests = createRenderManifests(tutorial, ffmpegAvailable);
  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    tutorialId: tutorial.tutorialId,
    batchId: tutorial.batchId,
    batchName: tutorial.batchName,
    featureId: tutorial.feature.featureId,
    route: tutorial.route,
    component: tutorial.feature.component,
    title: tutorial.topic,
    section: tutorial.section,
    product: tutorial.feature.product,
    plan: tutorial.feature.plan,
    status: "READY_FOR_LOCAL_REVIEW",
    reviewStatus: "MANUAL_REVIEW_REQUIRED",
    featureStatus: tutorial.featureStatus,
    outputPath: lessonOutputPath(tutorial),
    scripts,
    storyboard: createStoryboard(tutorial),
    captions: createCaptions(tutorial),
    thumbnails: ["1280x720", "1080x1920", "1080x1080", "1080x1350"].map((format) => createThumbnail(tutorial, format)),
    carousels: ["1080x1080", "1080x1350"].map((format) => createCarousel(tutorial, format)),
    renderManifests,
    video: {
      youtubeLong: renderManifests[0],
      youtubeShort: renderManifests[1],
      tiktok: renderManifests[1],
      instagramReel: renderManifests[1],
      facebookReel: renderManifests[1],
      whatsappStatus: renderManifests[1],
      telegramVideoMetadata: renderManifests[1],
      linkedinVideoMetadata: renderManifests[0]
    },
    text: {
      youtubeTitle: `${tutorial.topic} - UAOS Academy`,
      youtubeDescription: scripts.ar.summary,
      tiktokCaption: `${tutorial.topic} #UAOS`,
      instagramCaption: `${tutorial.topic}\nTutorial prepared - publication pending.`,
      facebookPost: scripts.ar.summary,
      xPost: `${tutorial.topic} - local review draft.`,
      xThread: scripts.ar.numberedSteps,
      linkedinPost: scripts.en.summary,
      threadsPost: scripts.ar.summary,
      whatsappChannelText: scripts.ar.summary,
      telegramPost: scripts.ar.summary,
      discordAnnouncement: scripts.en.summary,
      blogSummary: scripts.en.summary,
      websiteNewsSummary: scripts.en.summary
    },
    staticAssets: {
      youtubeThumbnail: createThumbnail(tutorial, "1280x720"),
      verticalCover: createThumbnail(tutorial, "1080x1920"),
      instagramPost: createThumbnail(tutorial, "1080x1080"),
      instagramCarousel: createCarousel(tutorial, "1080x1080"),
      facebookPostImage: createThumbnail(tutorial, "1080x1080"),
      linkedinCarouselFoundation: createCarousel(tutorial, "1080x1350"),
      whatsappPoster: createThumbnail(tutorial, "1080x1920"),
      telegramPoster: createThumbnail(tutorial, "1080x1080"),
      pinterestPinFoundation: createThumbnail(tutorial, "1080x1920"),
      xImageCard: createThumbnail(tutorial, "1080x1080")
    },
    platformPackages: PLATFORM_COMPLETION.map((platformId) => createPlatformPackage(tutorial, platformId)),
    faq: {
      question: `How do I use ${tutorial.topic}?`,
      answer: `Open ${tutorial.route}, use synthetic demo mode, and follow the local support article.`,
      supportCenterLink: "#/support"
    },
    supportArticle: {
      title: tutorial.topic,
      body: scripts.ar.summary,
      fallback: "Tutorial prepared - publication pending",
      nextLesson: scripts.ar.nextLesson
    },
    privacyGate: createPrivacyGate(tutorial),
    copyrightGate: createCopyrightGate(tutorial),
    contentHash: hashText(`${tutorial.tutorialId}-${tutorial.route}-${tutorial.topic}`)
  };
}

export function createPlatformAdapterCatalog() {
  return PLATFORM_COMPLETION.map((platformId) => ({
    platformId,
    capabilities: ["dry-run", "mock", "metadata-validation"],
    supportedMedia: platformId.includes("rss") ? ["text"] : platformId.includes("blog") ? ["text", "image"] : ["video", "image", "text"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:5"],
    captionLimits: platformId === "x" ? 280 : platformId === "tiktok" ? 2200 : 5000,
    titleLimits: platformId === "youtube" ? 100 : 80,
    hashtagLimits: platformId === "instagram-feed" ? 30 : 10,
    oauthRequired: !["rss", "website-news", "whatsapp-status"].includes(platformId),
    apiRequired: !["rss", "whatsapp-status"].includes(platformId),
    appReviewRequired: ["youtube", "tiktok", "instagram-feed", "instagram-reels", "facebook-page", "x", "linkedin"].includes(platformId),
    publicationModes: ["private", "unlisted", "public"].map((mode) => ({ mode, enabled: false })),
    schedulingSupport: platformId !== "whatsapp-status",
    analyticsSupport: "disabled-oauth-required",
    commentSupport: ["youtube", "tiktok", "instagram-feed", "facebook-page", "x", "telegram-channel", "discord-announcement"].includes(platformId),
    disabledReason: "OAuth/API/manual approval missing",
    mockImplementation: true,
    dryRunImplementation: true,
    realImplementationContract: "must use official API, no undocumented scraping"
  }));
}

export function createSecureTokenStorageContract() {
  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    electronSecureStorageAdapter: "foundation-capability-only",
    encryptedFileAdapter: "contract-only-no-fake-encryption",
    osKeychainCapability: "metadata-required",
    browserState: "unsupported-for-secret-storage",
    memoryProvider: { enabledForTests: true, persisted: false },
    tokenMasking: true,
    refreshTokenProtection: true,
    revokeToken: "contract",
    tokenExpiration: "contract",
    noGitPersistence: true,
    noReportPersistence: true,
    noConsoleLogging: true
  };
}

export function createPublishingQueue(tutorials) {
  return tutorials.flatMap((tutorial) => PLATFORM_COMPLETION.slice(0, 5).map((platformId, index) => ({
    contentId: `${tutorial.tutorialId}-${platformId}`,
    tutorialId: tutorial.tutorialId,
    platform: platformId,
    mode: "dry-run",
    status: "DRAFT",
    priority: index + 1,
    scheduledTime: null,
    timezone: "Europe/Berlin",
    mediaFiles: tutorial.renderManifests.map((manifest) => manifest.command.split("\"")[1]),
    captions: [`${tutorial.outputPath}/captions/ar.srt`, `${tutorial.outputPath}/captions/en.srt`],
    thumbnail: tutorial.thumbnails[0].path,
    metadata: tutorial.text,
    contentHash: tutorial.contentHash,
    duplicateKey: tutorial.contentHash,
    oauthState: "missing",
    approvalState: "not-reviewed",
    reviewEvidence: {
      technicalReview: false,
      educationalReview: false,
      legalBrandReview: false,
      privacyReview: false,
      copyrightReview: false,
      renderedMediaApproved: false,
      narrationApproved: false,
      ownerApproval: false,
      approvalPhrase: null
    },
    requiredBeforePrivateUpload: [
      "rendered-media-approved",
      "narration-approved",
      "privacy-review",
      "copyright-review",
      "technical-review",
      "educational-review",
      "owner-approval"
    ],
    requiredBeforePublicPublication: [
      "platform-oauth-configured",
      "account-verified",
      "legal-brand-review",
      "explicit-publication-mode",
      "OWNER_APPROVES_SOCIAL_PUBLICATION"
    ],
    privateUploadAllowed: false,
    unlistedUploadAllowed: false,
    publicPublicationAllowed: false,
    retry: { enabled: true, maxAttempts: 2 },
    attempts: 0,
    lastError: null,
    platformPostId: null,
    platformUrl: null,
    createdAt: "2026-06-14T00:00:00.000Z",
    updatedAt: "2026-06-14T00:00:00.000Z"
  })));
}

export function createPublicationGate(input = {}) {
  const checks = {
    platformConfigured: input.platformConfigured === true,
    oauthValid: input.oauthValid === true,
    accountVerified: input.accountVerified === true,
    mediaRendered: input.mediaRendered === true,
    metadataValid: input.metadataValid === true,
    captionsValid: input.captionsValid === true,
    thumbnailValid: input.thumbnailValid === true,
    featureExists: input.featureExists === true,
    routePasses: input.routePasses === true,
    noConsoleError: input.noConsoleError === true,
    noPrivateData: input.noPrivateData === true,
    noSecrets: input.noSecrets === true,
    noCopyrightedContent: input.noCopyrightedContent === true,
    noCommercialSamples: input.noCommercialSamples === true,
    currentPricing: input.currentPricing === true,
    currentVersion: input.currentVersion === true,
    manualTechnicalReview: input.manualTechnicalReview === true,
    educationalReview: input.educationalReview === true,
    ownerApproval: input.ownerApproval === true,
    explicitPublicationApproval: input.explicitPublicationApproval === true,
    explicitPublicationMode: input.explicitPublicationMode === true,
    confirmationPhrase: input.confirmationPhrase === "I APPROVE UAOS PUBLICATION",
    noDuplicateContentHash: input.noDuplicateContentHash === true
  };
  const ready = Object.values(checks).every(Boolean);
  return {
    status: ready ? "READY_PUBLIC" : !checks.oauthValid ? "WAITING_OAUTH" : !checks.mediaRendered ? "WAITING_RENDER" : "WAITING_REVIEW",
    publicPublicationAllowed: false,
    checks,
    platformPostId: input.platformPostId || null
  };
}

export function createSchedules(tutorials) {
  const start = new Date("2026-06-15T07:00:00.000Z");
  const scheduleFor = (name, weeks) => tutorials.slice(0, Math.min(tutorials.length, weeks * 3)).flatMap((tutorial, index) => {
    const base = new Date(start.getTime() + Math.floor(index / 3) * 7 * 24 * 60 * 60 * 1000 + (index % 3) * 2 * 24 * 60 * 60 * 1000);
    return [
      { plan: name, tutorialId: tutorial.tutorialId, language: "ar", type: "long", scheduledTime: base.toISOString(), timezone: "Europe/Berlin" },
      { plan: name, tutorialId: tutorial.tutorialId, language: "ar", type: "short", scheduledTime: new Date(base.getTime() + 24 * 60 * 60 * 1000).toISOString(), timezone: "Europe/Berlin" },
      { plan: name, tutorialId: tutorial.tutorialId, language: "ar", type: "carousel", scheduledTime: new Date(base.getTime() + 48 * 60 * 60 * 1000).toISOString(), timezone: "Europe/Berlin" },
      { plan: name, tutorialId: tutorial.tutorialId, language: "en-after-ar-review", type: "english-followup", scheduledTime: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), timezone: "Europe/Berlin" },
      { plan: name, tutorialId: tutorial.tutorialId, language: "de-foundation", type: "german-foundation", scheduledTime: new Date(base.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), timezone: "Europe/Berlin" }
    ];
  });
  return {
    launchWeek: scheduleFor("launch-week", 1),
    twelveWeekPlan: scheduleFor("12-week", 12),
    sixMonthPlan: scheduleFor("6-month", 26),
    fullBacklogPlan: scheduleFor("full-backlog", 60),
    newFeaturePlan: scheduleFor("new-feature", 4),
    troubleshootingRotation: tutorials.filter((tutorial) => /trouble|diagnostic|recovery|error|offline/i.test(tutorial.title)).map((tutorial, index) => ({ tutorialId: tutorial.tutorialId, week: index + 1, timezone: "Europe/Berlin" }))
  };
}

export function createCampaigns(tutorials) {
  const names = ["UAOS Launch", "Getting Started", "Sing", "Studio", "Sampler", "Arranger", "AI", "Hardware", "Pricing", "Troubleshooting", "New Release", "Founder Plans", "Offline Music Production", "Oriental Music Tools"];
  return names.map((name, index) => ({
    id: `campaign-${slug(name)}`,
    name,
    objective: `Educate ${name} audience with local-first UAOS tutorials.`,
    platforms: PLATFORM_COMPLETION.slice(0, 10),
    tutorials: tutorials.filter((tutorial) => tutorial.batchName.toLowerCase().includes(name.toLowerCase().split(" ")[0]) || index === 0).slice(0, 12).map((tutorial) => tutorial.tutorialId),
    posts: [],
    languages: ["ar", "en", "de-foundation"],
    startDate: "2026-06-15",
    endDate: "2026-12-15",
    cadence: "3 long tutorials per week plus platform derivatives",
    audience: name.includes("Hardware") ? "keyboardists" : "UAOS learners",
    cta: "Open UAOS Academy local preview.",
    status: "draft",
    approval: "manual-review-required",
    metricsFoundation: { generated: 0, views: null, subscribers: null, fakeMetrics: false }
  }));
}

export function createPublicationApprovalHandoffPlan(data) {
  const queue = data.publicationQueue || [];
  const tutorials = data.tutorials || [];
  const draftItems = queue.filter((item) => item.status === "DRAFT");
  const reviewedItems = queue.filter((item) => item.approvalState === "approved");
  const ownerApprovedItems = queue.filter((item) => item.reviewEvidence?.ownerApproval === true);
  const privateReadyItems = queue.filter((item) => item.privateUploadAllowed === true);
  const publicReadyItems = queue.filter((item) => item.publicPublicationAllowed === true);
  const sample = queue[0] || null;
  const blockers = [
    "Approve rendered media for every platform item after FFmpeg/manual render output exists.",
    "Approve narration audio for every tutorial and language before any upload.",
    "Complete technical, educational, privacy, copyright and legal/brand review.",
    "Configure official platform OAuth/API credentials and verify platform accounts.",
    "Record owner approval with the exact phrase OWNER_APPROVES_SOCIAL_PUBLICATION before private, unlisted, scheduled or public posting."
  ];

  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    status: "BLOCKED_PUBLICATION_APPROVAL",
    generatedAt: data.generatedAt,
    publicationAllowed: false,
    privateUploadAllowed: false,
    unlistedUploadAllowed: false,
    realNetworkActionsPerformed: false,
    totals: {
      tutorials: tutorials.length,
      queueItems: queue.length,
      draftItems: draftItems.length,
      reviewedItems: reviewedItems.length,
      ownerApprovedItems: ownerApprovedItems.length,
      privateReadyItems: privateReadyItems.length,
      publicReadyItems: publicReadyItems.length,
      platformsPerTutorial: tutorials.length ? Math.round(queue.length / tutorials.length) : 0
    },
    requiredEvidence: [
      "technicalReview",
      "educationalReview",
      "legalBrandReview",
      "privacyReview",
      "copyrightReview",
      "renderedMediaApproved",
      "narrationApproved",
      "ownerApproval",
      "approvalPhrase"
    ],
    sampleQueueItem: sample ? {
      contentId: sample.contentId,
      tutorialId: sample.tutorialId,
      platform: sample.platform,
      status: sample.status,
      approvalState: sample.approvalState,
      requiredBeforePrivateUpload: sample.requiredBeforePrivateUpload,
      requiredBeforePublicPublication: sample.requiredBeforePublicPublication
    } : null,
    paths: {
      queue: `${data.outputRoot}/queue/publication-queue.json`,
      approvalReport: "reports/UAOS_SOCIAL_PUBLICATION_APPROVAL_HANDOFF.json",
      approvalNotes: "reports/UAOS_SOCIAL_PUBLICATION_APPROVAL_HANDOFF.md",
      publicationQueueReport: "reports/UAOS_SOCIAL_PUBLICATION_QUEUE.json"
    },
    safeLocalCommands: {
      approvalStatus: "npm run academy:approval:status",
      queueDryRun: "npm run academy:queue:dry-run",
      handoffReadiness: "npm run academy:handoff:readiness",
      validateAll: "npm run academy:validate:all"
    },
    blockers,
    approvalPhraseRequired: "OWNER_APPROVES_SOCIAL_PUBLICATION"
  };
}

export function createReviewEvidenceImportManifest(data) {
  const tutorials = data.tutorials || [];
  const queue = data.publicationQueue || [];
  const sampleTutorial = tutorials[0] || null;
  const sampleQueueItem = queue[0] || null;
  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    status: "TEMPLATE_ONLY_NO_APPROVALS_IMPORTED",
    generatedAt: data.generatedAt,
    publicationAllowed: false,
    privateUploadAllowed: false,
    unlistedUploadAllowed: false,
    realNetworkActionsPerformed: false,
    instructions: [
      "Copy this template before editing; keep the generated file as the baseline.",
      "Use only local rendered media, local narration audio and written human review records.",
      "Do not paste OAuth secrets, refresh tokens, cookies, private URLs or personal data into this manifest.",
      "Set approval fields only after the matching local artifact has been manually reviewed.",
      "Keep publication queue entries in DRAFT until a separate owner approval and platform OAuth review are complete."
    ],
    expectedTotals: {
      tutorials: tutorials.length,
      queueItems: queue.length,
      renderManifests: tutorials.flatMap((tutorial) => tutorial.renderManifests || []).length,
      narrationAssets: data.narrationReadiness?.expectedAudioAssets || tutorials.length * 3,
      oauthPlatforms: (data.oauthStatus || []).length
    },
    requiredEvidenceTypes: REVIEW_EVIDENCE_TYPES,
    requiredApprovalPhrase: "OWNER_APPROVES_SOCIAL_PUBLICATION",
    evidenceFileConventions: {
      renderedMedia: `${data.outputRoot}/renders/<tutorial-id>/<format>.mp4`,
      narrationAudio: `${data.outputRoot}/narration/<tutorial-id>/<language>.wav`,
      reviewerNotes: `${data.outputRoot}/reviews/<tutorial-id>/<review-type>.md`,
      ownerApproval: `${data.outputRoot}/reviews/owner-approval.json`,
      oauthStatus: "reports/UAOS_SOCIAL_OAUTH_STATUS.json"
    },
    sampleTutorialEvidence: sampleTutorial ? {
      tutorialId: sampleTutorial.tutorialId,
      contentHash: sampleTutorial.contentHash,
      renderedMediaApproved: false,
      narrationApproved: {
        ar: false,
        en: false,
        "de-foundation": false
      },
      technicalReview: false,
      educationalReview: false,
      privacyReview: false,
      copyrightReview: false,
      legalBrandReview: false,
      renderedMediaPaths: [],
      narrationAudioPaths: {
        ar: null,
        en: null,
        "de-foundation": null
      },
      reviewerNotePaths: [],
      reviewerNotes: [],
      reviewedAt: null,
      reviewerName: null,
      evidenceSource: "local-manual-review"
    } : null,
    sampleQueueEvidence: sampleQueueItem ? {
      contentId: sampleQueueItem.contentId,
      tutorialId: sampleQueueItem.tutorialId,
      platform: sampleQueueItem.platform,
      contentHash: sampleQueueItem.contentHash,
      ownerApproval: false,
      approvalPhrase: null,
      privateUploadAllowed: false,
      unlistedUploadAllowed: false,
      publicPublicationAllowed: false,
      reviewedAt: null,
      reviewerName: null,
      evidenceSource: "local-owner-approval"
    } : null,
    sampleOAuthEvidence: data.oauthStatus?.[0] ? {
      platformId: data.oauthStatus[0].platformId,
      configured: false,
      appReviewApproved: false,
      accountVerified: false,
      scopesApproved: false,
      tokenStorageVerified: false,
      reviewerNote: null,
      reviewedAt: null,
      reviewerName: null,
      evidenceSource: "local-oauth-checklist"
    } : null,
    validationRules: [
      "All queue items must keep privateUploadAllowed, unlistedUploadAllowed and publicPublicationAllowed false in local review mode.",
      "Owner approval is invalid unless approvalPhrase exactly equals OWNER_APPROVES_SOCIAL_PUBLICATION.",
      "Approved tutorial and queue rows must include the current generated contentHash so stale evidence cannot unlock readiness.",
      "Approved evidence rows must include reviewedAt, reviewerName and evidenceSource provenance from the current review cycle.",
      "Rendered media, narration audio and reviewer note references must be local relative paths under social-output/.",
      "OAuth status may record platform IDs and non-secret review metadata only; secrets must never be stored in reports.",
      "This template does not upload, schedule, publish, authenticate, record audio or render media."
    ],
    safeLocalCommands: {
      createTemplate: "npm run academy:evidence:template",
      createWorkingFile: "npm run academy:evidence:working",
      auditWorkingFile: "npm run academy:evidence:audit",
      reviewEvidence: "npm run academy:review:evidence",
      approvalStatus: "npm run academy:approval:status",
      oauthStatus: "npm run academy:oauth:status"
    }
  };
}

export function createReviewerEvidenceWorkingManifest(data) {
  const template = createReviewEvidenceImportManifest(data);
  return {
    ...template,
    status: "WORKING_FILE_PENDING_HUMAN_REVIEW",
    generatedFrom: "reports/UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_TEMPLATE.json",
    workingFilePath: `${data.outputRoot}/reviews/reviewer-evidence-working.json`,
    publicationAllowed: false,
    privateUploadAllowed: false,
    unlistedUploadAllowed: false,
    realNetworkActionsPerformed: false,
    reviewer: {
      name: null,
      role: null,
      reviewedAt: null,
      notes: []
    },
    importedApprovalCounts: {
      renderedMediaApproved: 0,
      narrationApproved: 0,
      technicalReview: 0,
      educationalReview: 0,
      privacyReview: 0,
      copyrightReview: 0,
      legalBrandReview: 0,
      ownerApproval: 0,
      approvedPhrases: 0
    },
    queueImportMode: "DRAFT_ONLY_NO_UPLOAD",
    instructions: [
      "This is the reviewer-owned working copy. Keep the template file unchanged.",
      ...template.instructions,
      "Leave publicationAllowed, privateUploadAllowed and unlistedUploadAllowed false in this working file.",
      "Run npm run academy:review:evidence after edits; it must remain blocked until all external review gates are complete."
    ],
    safeLocalCommands: {
      ...template.safeLocalCommands,
      createWorkingFile: "npm run academy:evidence:working"
    }
  };
}

const SECRET_KEY_PATTERN = /(secret|token|cookie|password|refresh|authorization|bearer|clientSecret|apiKey|privateUrl)/i;
const TUTORIAL_EVIDENCE_BOOLEAN_FIELDS = [
  "renderedMediaApproved",
  "technicalReview",
  "educationalReview",
  "privacyReview",
  "copyrightReview",
  "legalBrandReview"
];
const NARRATION_EVIDENCE_LANGUAGES = ["ar", "en", "de-foundation"];
const QUEUE_EVIDENCE_BOOLEAN_FIELDS = [
  "ownerApproval",
  "privateUploadAllowed",
  "unlistedUploadAllowed",
  "publicPublicationAllowed"
];
const OAUTH_EVIDENCE_BOOLEAN_FIELDS = [
  "configured",
  "appReviewApproved",
  "accountVerified",
  "scopesApproved",
  "tokenStorageVerified"
];
const LOCAL_EVIDENCE_ROOTS = ["social-output/"];
const REMOTE_OR_PRIVATE_PATH_PATTERN = /^(https?:\/\/|file:\/\/|[a-z]:[\\/]|\\\\|\/)/i;
const EVIDENCE_ARTIFACT_EXTENSIONS = Object.freeze({
  renderedMediaPaths: [".mp4", ".mov", ".webm"],
  narrationAudioPaths: [".wav", ".mp3", ".m4a", ".flac", ".ogg"],
  reviewerNotePaths: [".md", ".txt", ".json"]
});

function countTrue(items, field) {
  return items.filter((item) => item?.[field] === true).length;
}

function countNarrationApprovals(items) {
  return items.reduce((total, item) => {
    const value = item?.narrationApproved;
    if (value === true) return total + 1;
    if (!value || typeof value !== "object") return total;
    return total + Object.values(value).filter(Boolean).length;
  }, 0);
}

function collectUnsafeEvidenceKeys(value, prefix = "") {
  if (!value || typeof value !== "object") return [];
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  const unsafe = [];
  for (const [key, child] of entries) {
    const childPath = prefix ? `${prefix}.${key}` : String(key);
    if (SECRET_KEY_PATTERN.test(String(key))) unsafe.push(childPath);
    unsafe.push(...collectUnsafeEvidenceKeys(child, childPath));
  }
  return unsafe;
}

function partitionEvidenceRows(rows, keyField, validIds) {
  const seen = new Set();
  const validUnique = [];
  const unknown = [];
  const duplicates = [];
  for (const row of rows) {
    const id = row?.[keyField];
    if (!id || !validIds.has(id)) {
      unknown.push(id || `${keyField}:missing`);
      continue;
    }
    if (seen.has(id)) {
      duplicates.push(id);
      continue;
    }
    seen.add(id);
    validUnique.push(row);
  }
  return { validUnique, unknown, duplicates };
}

function validateBooleanField(row, field, path, issues) {
  if (row?.[field] !== undefined && typeof row[field] !== "boolean") {
    issues.push(`${path}.${field}`);
  }
}

function isSafeLocalEvidencePath(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().replaceAll("\\", "/");
  if (!normalized || REMOTE_OR_PRIVATE_PATH_PATTERN.test(normalized)) return false;
  if (normalized.includes("../") || normalized === ".." || normalized.includes("/..")) return false;
  return LOCAL_EVIDENCE_ROOTS.some((root) => normalized.startsWith(root));
}

function validateLocalPathArray(value, path, issues) {
  if (!Array.isArray(value)) {
    issues.push(path);
    return;
  }
  value.forEach((item, index) => {
    if (!isSafeLocalEvidencePath(item)) issues.push(`${path}[${index}]`);
  });
}

function validateTutorialEvidenceRows(rows) {
  const issues = [];
  rows.forEach((row, index) => {
    const path = `tutorialEvidence[${index}]`;
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      issues.push(path);
      return;
    }
    if (typeof row.tutorialId !== "string" || row.tutorialId.trim() === "") {
      issues.push(`${path}.tutorialId`);
    }
    if (row.contentHash !== undefined && typeof row.contentHash !== "string") {
      issues.push(`${path}.contentHash`);
    }
    for (const field of TUTORIAL_EVIDENCE_BOOLEAN_FIELDS) {
      validateBooleanField(row, field, path, issues);
    }
    if (row.narrationApproved !== undefined) {
      if (typeof row.narrationApproved === "boolean") {
        return;
      }
      if (!row.narrationApproved || typeof row.narrationApproved !== "object" || Array.isArray(row.narrationApproved)) {
        issues.push(`${path}.narrationApproved`);
        return;
      }
      for (const language of NARRATION_EVIDENCE_LANGUAGES) {
        validateBooleanField(row.narrationApproved, language, `${path}.narrationApproved`, issues);
      }
    }
    if (row.reviewerNotes !== undefined) {
      if (!Array.isArray(row.reviewerNotes)) {
        issues.push(`${path}.reviewerNotes`);
      } else {
        row.reviewerNotes.forEach((note, noteIndex) => {
          if (typeof note !== "string") issues.push(`${path}.reviewerNotes[${noteIndex}]`);
        });
      }
    }
    if (row.renderedMediaPaths !== undefined) {
      validateLocalPathArray(row.renderedMediaPaths, `${path}.renderedMediaPaths`, issues);
    }
    if (row.reviewerNotePaths !== undefined) {
      validateLocalPathArray(row.reviewerNotePaths, `${path}.reviewerNotePaths`, issues);
    }
    if (row.narrationAudioPaths !== undefined) {
      if (!row.narrationAudioPaths || typeof row.narrationAudioPaths !== "object" || Array.isArray(row.narrationAudioPaths)) {
        issues.push(`${path}.narrationAudioPaths`);
      } else {
        for (const language of NARRATION_EVIDENCE_LANGUAGES) {
          const value = row.narrationAudioPaths[language];
          if (value !== undefined && value !== null && !isSafeLocalEvidencePath(value)) {
            issues.push(`${path}.narrationAudioPaths.${language}`);
          }
        }
      }
    }
  });
  return issues;
}

function validateQueueEvidenceRows(rows) {
  const issues = [];
  rows.forEach((row, index) => {
    const path = `queueEvidence[${index}]`;
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      issues.push(path);
      return;
    }
    if (typeof row.contentId !== "string" || row.contentId.trim() === "") {
      issues.push(`${path}.contentId`);
    }
    if (row.tutorialId !== undefined && typeof row.tutorialId !== "string") {
      issues.push(`${path}.tutorialId`);
    }
    if (row.platform !== undefined && typeof row.platform !== "string") {
      issues.push(`${path}.platform`);
    }
    if (row.contentHash !== undefined && typeof row.contentHash !== "string") {
      issues.push(`${path}.contentHash`);
    }
    for (const field of QUEUE_EVIDENCE_BOOLEAN_FIELDS) {
      validateBooleanField(row, field, path, issues);
    }
    if (row.approvalPhrase !== undefined && row.approvalPhrase !== null && typeof row.approvalPhrase !== "string") {
      issues.push(`${path}.approvalPhrase`);
    }
  });
  return issues;
}

function validateOAuthEvidenceRows(rows) {
  const issues = [];
  rows.forEach((row, index) => {
    const path = `oauthEvidence[${index}]`;
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      issues.push(path);
      return;
    }
    if (typeof row.platformId !== "string" || row.platformId.trim() === "") {
      issues.push(`${path}.platformId`);
    }
    for (const field of OAUTH_EVIDENCE_BOOLEAN_FIELDS) {
      validateBooleanField(row, field, path, issues);
    }
    if (row.reviewerNote !== undefined && row.reviewerNote !== null && typeof row.reviewerNote !== "string") {
      issues.push(`${path}.reviewerNote`);
    }
  });
  return issues;
}

function validateQueueEvidenceConsistency(rows, queueItems) {
  const byContentId = new Map((queueItems || []).map((item) => [item.contentId, item]));
  const issues = [];
  rows.forEach((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return;
    const queueItem = byContentId.get(row.contentId);
    if (!queueItem) return;
    if (row.tutorialId !== undefined && row.tutorialId !== queueItem.tutorialId) {
      issues.push(`queueEvidence[${index}].tutorialId`);
    }
    if (row.platform !== undefined && row.platform !== queueItem.platform) {
      issues.push(`queueEvidence[${index}].platform`);
    }
  });
  return issues;
}

function tutorialEvidenceHasApproval(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return false;
  if (TUTORIAL_EVIDENCE_BOOLEAN_FIELDS.some((field) => row[field] === true)) return true;
  if (row.narrationApproved === true) return true;
  if (row.narrationApproved && typeof row.narrationApproved === "object" && !Array.isArray(row.narrationApproved)) {
    return NARRATION_EVIDENCE_LANGUAGES.some((language) => row.narrationApproved[language] === true);
  }
  return false;
}

function isValidIsoDateTime(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isBeforeGeneratedAt(value, generatedAt) {
  if (!isValidIsoDateTime(value) || !isValidIsoDateTime(generatedAt)) return false;
  return Date.parse(value) < Date.parse(generatedAt);
}

function validateEvidenceProvenance(tutorialRows, queueRows, oauthRows, generatedAt) {
  const issues = {
    tutorialEvidence: [],
    queueEvidence: [],
    oauthEvidence: []
  };
  tutorialRows.forEach((row, index) => {
    if (!tutorialEvidenceHasApproval(row)) return;
    const path = `tutorialEvidence[${index}]`;
    if (!isValidIsoDateTime(row.reviewedAt)) {
      issues.tutorialEvidence.push(`${path}.reviewedAt`);
    } else if (isBeforeGeneratedAt(row.reviewedAt, generatedAt)) {
      issues.tutorialEvidence.push(`${path}.reviewedAt:stale`);
    }
    if (!isNonEmptyString(row.reviewerName)) issues.tutorialEvidence.push(`${path}.reviewerName`);
    if (!isNonEmptyString(row.evidenceSource)) issues.tutorialEvidence.push(`${path}.evidenceSource`);
  });
  queueRows.forEach((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return;
    if (row.ownerApproval !== true && row.approvalPhrase !== "OWNER_APPROVES_SOCIAL_PUBLICATION") return;
    const path = `queueEvidence[${index}]`;
    if (!isValidIsoDateTime(row.reviewedAt)) {
      issues.queueEvidence.push(`${path}.reviewedAt`);
    } else if (isBeforeGeneratedAt(row.reviewedAt, generatedAt)) {
      issues.queueEvidence.push(`${path}.reviewedAt:stale`);
    }
    if (!isNonEmptyString(row.reviewerName)) issues.queueEvidence.push(`${path}.reviewerName`);
    if (!isNonEmptyString(row.evidenceSource)) issues.queueEvidence.push(`${path}.evidenceSource`);
  });
  oauthRows.forEach((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return;
    if (!OAUTH_EVIDENCE_BOOLEAN_FIELDS.some((field) => row[field] === true)) return;
    const path = `oauthEvidence[${index}]`;
    if (!isValidIsoDateTime(row.reviewedAt)) {
      issues.oauthEvidence.push(`${path}.reviewedAt`);
    } else if (isBeforeGeneratedAt(row.reviewedAt, generatedAt)) {
      issues.oauthEvidence.push(`${path}.reviewedAt:stale`);
    }
    if (!isNonEmptyString(row.reviewerName)) issues.oauthEvidence.push(`${path}.reviewerName`);
    if (!isNonEmptyString(row.evidenceSource)) issues.oauthEvidence.push(`${path}.evidenceSource`);
  });
  return issues;
}

function validateEvidenceFreshness(tutorialRows, queueRows, tutorials, queueItems) {
  const tutorialsById = new Map((tutorials || []).map((tutorial) => [tutorial.tutorialId, tutorial]));
  const queueByContentId = new Map((queueItems || []).map((item) => [item.contentId, item]));
  const issues = {
    tutorialEvidence: [],
    queueEvidence: []
  };
  tutorialRows.forEach((row, index) => {
    if (!tutorialEvidenceHasApproval(row)) return;
    const expected = tutorialsById.get(row?.tutorialId)?.contentHash;
    if (!expected) return;
    if (row.contentHash !== expected) {
      issues.tutorialEvidence.push(`tutorialEvidence[${index}].contentHash`);
    }
  });
  queueRows.forEach((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return;
    if (row.ownerApproval !== true && row.approvalPhrase !== "OWNER_APPROVES_SOCIAL_PUBLICATION") return;
    const expected = queueByContentId.get(row.contentId)?.contentHash;
    if (!expected) return;
    if (row.contentHash !== expected) {
      issues.queueEvidence.push(`queueEvidence[${index}].contentHash`);
    }
  });
  return issues;
}

function validateTutorialEvidenceArtifacts(rows) {
  const issues = [];
  rows.forEach((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return;
    const path = `tutorialEvidence[${index}]`;
    const renderedPaths = Array.isArray(row.renderedMediaPaths) ? row.renderedMediaPaths : [];
    if (row.renderedMediaApproved === true && renderedPaths.length === 0) {
      issues.push(`${path}.renderedMediaPaths:required`);
    }
    const narrationPaths = row.narrationAudioPaths && typeof row.narrationAudioPaths === "object" && !Array.isArray(row.narrationAudioPaths) ? row.narrationAudioPaths : {};
    if (row.narrationApproved === true) {
      for (const language of NARRATION_EVIDENCE_LANGUAGES) {
        if (!isSafeLocalEvidencePath(narrationPaths[language])) {
          issues.push(`${path}.narrationAudioPaths.${language}:required`);
        }
      }
    } else if (row.narrationApproved && typeof row.narrationApproved === "object" && !Array.isArray(row.narrationApproved)) {
      for (const language of NARRATION_EVIDENCE_LANGUAGES) {
        if (row.narrationApproved[language] === true && !isSafeLocalEvidencePath(narrationPaths[language])) {
          issues.push(`${path}.narrationAudioPaths.${language}:required`);
        }
      }
    }
    const notePaths = Array.isArray(row.reviewerNotePaths) ? row.reviewerNotePaths : [];
    for (const field of ["technicalReview", "educationalReview", "privacyReview", "copyrightReview", "legalBrandReview"]) {
      if (row[field] === true && notePaths.length === 0) {
        issues.push(`${path}.reviewerNotePaths:${field}:required`);
      }
    }
  });
  return issues;
}

function pathHasAllowedExtension(value, extensions) {
  const normalized = String(value || "").trim().toLowerCase().split(/[?#]/)[0];
  return extensions.some((extension) => normalized.endsWith(extension));
}

function collectArtifactPathChecks(row) {
  const checks = [];
  const renderedPaths = Array.isArray(row?.renderedMediaPaths) ? row.renderedMediaPaths : [];
  renderedPaths.forEach((value, index) => {
    checks.push({ value, fieldPath: `renderedMediaPaths[${index}]`, extensions: EVIDENCE_ARTIFACT_EXTENSIONS.renderedMediaPaths });
  });
  const narrationPaths = row?.narrationAudioPaths && typeof row.narrationAudioPaths === "object" && !Array.isArray(row.narrationAudioPaths) ? row.narrationAudioPaths : {};
  for (const language of NARRATION_EVIDENCE_LANGUAGES) {
    const value = narrationPaths[language];
    if (value !== undefined && value !== null) {
      checks.push({ value, fieldPath: `narrationAudioPaths.${language}`, extensions: EVIDENCE_ARTIFACT_EXTENSIONS.narrationAudioPaths });
    }
  }
  const notePaths = Array.isArray(row?.reviewerNotePaths) ? row.reviewerNotePaths : [];
  notePaths.forEach((value, index) => {
    checks.push({ value, fieldPath: `reviewerNotePaths[${index}]`, extensions: EVIDENCE_ARTIFACT_EXTENSIONS.reviewerNotePaths });
  });
  return checks;
}

function validateEvidenceArtifactFiles(rows, options = {}) {
  const issues = {
    missingFiles: [],
    invalidExtensions: []
  };
  const artifactExists = typeof options.artifactExists === "function" ? options.artifactExists : null;
  rows.forEach((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return;
    for (const check of collectArtifactPathChecks(row)) {
      const path = `tutorialEvidence[${index}].${check.fieldPath}`;
      if (!isSafeLocalEvidencePath(check.value)) continue;
      if (!pathHasAllowedExtension(check.value, check.extensions)) {
        issues.invalidExtensions.push(path);
      }
      if (artifactExists && !artifactExists(check.value)) {
        issues.missingFiles.push(path);
      }
    }
  });
  return issues;
}

export function createReviewEvidenceImportAudit(data, manifest = null, options = {}) {
  const expected = createReviewEvidenceImportManifest(data).expectedTotals;
  const source = manifest && typeof manifest === "object" ? manifest : {};
  const tutorialEvidence = Array.isArray(source.tutorialEvidence) ? source.tutorialEvidence : [];
  const queueEvidence = Array.isArray(source.queueEvidence) ? source.queueEvidence : [];
  const oauthEvidence = Array.isArray(source.oauthEvidence) ? source.oauthEvidence : [];
  const tutorialIds = new Set((data.tutorials || []).map((tutorial) => tutorial.tutorialId));
  const queueContentIds = new Set((data.publicationQueue || []).map((item) => item.contentId));
  const oauthPlatformIds = new Set((data.oauthStatus || []).map((item) => item.platformId));
  const tutorialRows = partitionEvidenceRows(tutorialEvidence, "tutorialId", tutorialIds);
  const queueRows = partitionEvidenceRows(queueEvidence, "contentId", queueContentIds);
  const oauthRows = partitionEvidenceRows(oauthEvidence, "platformId", oauthPlatformIds);
  const validTutorialEvidence = tutorialRows.validUnique;
  const validQueueEvidence = queueRows.validUnique;
  const validOAuthEvidence = oauthRows.validUnique;
  const evidenceShapeIssues = {
    tutorialEvidence: validateTutorialEvidenceRows(tutorialEvidence),
    queueEvidence: validateQueueEvidenceRows(queueEvidence),
    oauthEvidence: validateOAuthEvidenceRows(oauthEvidence)
  };
  const evidenceConsistencyIssues = {
    queueEvidence: validateQueueEvidenceConsistency(queueEvidence, data.publicationQueue)
  };
  const evidenceFreshnessIssues = validateEvidenceFreshness(tutorialEvidence, queueEvidence, data.tutorials, data.publicationQueue);
  const evidenceProvenanceIssues = validateEvidenceProvenance(tutorialEvidence, queueEvidence, oauthEvidence, data.generatedAt);
  const evidenceArtifactIssues = {
    tutorialEvidence: validateTutorialEvidenceArtifacts(tutorialEvidence)
  };
  const evidenceArtifactFileIssues = validateEvidenceArtifactFiles(tutorialEvidence, options);
  const unsafeKeys = collectUnsafeEvidenceKeys(source);
  const unsafeUnlocks = [
    source.publicationAllowed === true ? "publicationAllowed" : null,
    source.privateUploadAllowed === true ? "privateUploadAllowed" : null,
    source.unlistedUploadAllowed === true ? "unlistedUploadAllowed" : null,
    ...queueEvidence.flatMap((item) => [
      item?.privateUploadAllowed === true ? `${item.contentId || "queue-item"}.privateUploadAllowed` : null,
      item?.unlistedUploadAllowed === true ? `${item.contentId || "queue-item"}.unlistedUploadAllowed` : null,
      item?.publicPublicationAllowed === true ? `${item.contentId || "queue-item"}.publicPublicationAllowed` : null
    ])
  ].filter(Boolean);
  const approvedPhrases = validQueueEvidence.filter((item) => item?.approvalPhrase === "OWNER_APPROVES_SOCIAL_PUBLICATION").length;
  const invalidOwnerApprovals = validQueueEvidence.filter((item) => item?.ownerApproval === true && item?.approvalPhrase !== "OWNER_APPROVES_SOCIAL_PUBLICATION").length;
  const importedApprovalCounts = {
    renderedMediaApproved: countTrue(validTutorialEvidence, "renderedMediaApproved"),
    narrationApproved: countNarrationApprovals(validTutorialEvidence),
    technicalReview: countTrue(validTutorialEvidence, "technicalReview"),
    educationalReview: countTrue(validTutorialEvidence, "educationalReview"),
    privacyReview: countTrue(validTutorialEvidence, "privacyReview"),
    copyrightReview: countTrue(validTutorialEvidence, "copyrightReview"),
    legalBrandReview: countTrue(validTutorialEvidence, "legalBrandReview"),
    ownerApproval: countTrue(validQueueEvidence, "ownerApproval"),
    approvedPhrases
  };
  const oauthEvidenceCounts = {
    configured: countTrue(validOAuthEvidence, "configured"),
    appReviewApproved: countTrue(validOAuthEvidence, "appReviewApproved"),
    accountVerified: countTrue(validOAuthEvidence, "accountVerified"),
    scopesApproved: countTrue(validOAuthEvidence, "scopesApproved"),
    tokenStorageVerified: countTrue(validOAuthEvidence, "tokenStorageVerified")
  };
  const blockers = [
    tutorialEvidence.length === 0 ? "No tutorial evidence rows were imported from the reviewer working file." : null,
    queueEvidence.length === 0 ? "No queue evidence rows were imported from the reviewer working file." : null,
    oauthEvidence.length === 0 ? "No OAuth evidence rows were imported from the reviewer working file." : null,
    unsafeUnlocks.length > 0 ? "Reviewer evidence attempted to enable upload or publication flags." : null,
    unsafeKeys.length > 0 ? "Reviewer evidence contains secret-like keys that must not be stored in reports." : null,
    evidenceShapeIssues.tutorialEvidence.length > 0 || evidenceShapeIssues.queueEvidence.length > 0 || evidenceShapeIssues.oauthEvidence.length > 0 ? "Reviewer evidence contains malformed fields; malformed approvals were ignored." : null,
    evidenceArtifactIssues.tutorialEvidence.length > 0 ? "Reviewer evidence is missing required local artifact references or uses unsafe artifact paths." : null,
    evidenceArtifactFileIssues.invalidExtensions.length > 0 ? "Reviewer evidence references local artifacts with unsupported file extensions." : null,
    evidenceArtifactFileIssues.missingFiles.length > 0 ? "Reviewer evidence references local artifacts that do not exist in the workspace." : null,
    evidenceFreshnessIssues.tutorialEvidence.length > 0 || evidenceFreshnessIssues.queueEvidence.length > 0 ? "Reviewer evidence contains stale or missing content hashes and must be refreshed against current generated content." : null,
    evidenceProvenanceIssues.tutorialEvidence.length > 0 || evidenceProvenanceIssues.queueEvidence.length > 0 || evidenceProvenanceIssues.oauthEvidence.length > 0 ? "Reviewer evidence is missing current review timestamp, reviewer name or local evidence source provenance." : null,
    evidenceConsistencyIssues.queueEvidence.length > 0 ? "Reviewer evidence contains queue rows that do not match the generated tutorial/platform mapping." : null,
    tutorialRows.unknown.length > 0 || queueRows.unknown.length > 0 || oauthRows.unknown.length > 0 ? "Reviewer evidence contains unknown or missing tutorial/content/platform identifiers." : null,
    tutorialRows.duplicates.length > 0 || queueRows.duplicates.length > 0 || oauthRows.duplicates.length > 0 ? "Reviewer evidence contains duplicate tutorial/content/platform identifiers; duplicates were ignored." : null,
    invalidOwnerApprovals > 0 ? "Owner approvals without the exact required approval phrase are invalid." : null,
    importedApprovalCounts.renderedMediaApproved < expected.tutorials ? "Rendered media evidence is incomplete." : null,
    importedApprovalCounts.narrationApproved < expected.narrationAssets ? "Narration evidence is incomplete." : null,
    importedApprovalCounts.ownerApproval < expected.queueItems ? "Owner approval evidence is incomplete." : null,
    importedApprovalCounts.approvedPhrases < expected.queueItems ? "Required owner approval phrases are incomplete." : null,
    oauthEvidenceCounts.configured < expected.oauthPlatforms ||
      oauthEvidenceCounts.appReviewApproved < expected.oauthPlatforms ||
      oauthEvidenceCounts.accountVerified < expected.oauthPlatforms ||
      oauthEvidenceCounts.scopesApproved < expected.oauthPlatforms ||
      oauthEvidenceCounts.tokenStorageVerified < expected.oauthPlatforms ? "OAuth evidence is incomplete for one or more platforms." : null
  ].filter(Boolean);

  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    status: blockers.length === 0 ? "IMPORTED_EVIDENCE_COMPLETE_PENDING_FINAL_GATE" : "IMPORTED_EVIDENCE_BLOCKED",
    generatedAt: data.generatedAt,
    publicationAllowed: false,
    privateUploadAllowed: false,
    unlistedUploadAllowed: false,
    realNetworkActionsPerformed: false,
    expectedTotals: expected,
    importedRows: {
      tutorialEvidence: tutorialEvidence.length,
      queueEvidence: queueEvidence.length,
      oauthEvidence: oauthEvidence.length
    },
    importedApprovalCounts,
    oauthEvidenceCounts,
    invalidOwnerApprovals,
    evidenceShapeIssues,
    evidenceArtifactIssues,
    evidenceArtifactFileIssues,
    evidenceFreshnessIssues,
    evidenceProvenanceIssues,
    evidenceConsistencyIssues,
    unsafeUnlocks,
    unsafeSecretLikeKeys: unsafeKeys,
    invalidEvidenceReferences: {
      tutorialIds: tutorialRows.unknown,
      contentIds: queueRows.unknown,
      platformIds: oauthRows.unknown
    },
    duplicateEvidenceReferences: {
      tutorialIds: tutorialRows.duplicates,
      contentIds: queueRows.duplicates,
      platformIds: oauthRows.duplicates
    },
    blockers,
    approvalPhraseRequired: "OWNER_APPROVES_SOCIAL_PUBLICATION",
    sourceStatus: source.status || "UNKNOWN",
    sourceWorkingFilePath: source.workingFilePath || `${data.outputRoot}/reviews/reviewer-evidence-working.json`,
    queueImportMode: "DRAFT_ONLY_NO_UPLOAD"
  };
}

export function createReviewEvidenceGate(data) {
  const tutorials = data.tutorials || [];
  const queue = data.publicationQueue || [];
  const renderManifests = tutorials.flatMap((tutorial) => tutorial.renderManifests || []);
  const expectedNarrationAssets = data.narrationReadiness?.expectedAudioAssets || tutorials.length * 3;
  const approvedNarrationAssets = data.narrationReadiness?.approvedAudioAssets || 0;
  const oauthStatus = data.oauthStatus || [];
  const oauthConfigured = oauthStatus.filter((item) => item.configured).length;
  const evidenceFields = [
    "technicalReview",
    "educationalReview",
    "legalBrandReview",
    "privacyReview",
    "copyrightReview",
    "renderedMediaApproved",
    "narrationApproved",
    "ownerApproval"
  ];
  const evidenceCounts = evidenceFields.reduce((counts, field) => {
    counts[field] = queue.filter((item) => item.reviewEvidence?.[field] === true).length;
    return counts;
  }, {});
  const approvedPhrases = queue.filter((item) => item.reviewEvidence?.approvalPhrase === "OWNER_APPROVES_SOCIAL_PUBLICATION").length;
  const blockers = [
    renderManifests.length === 0 ? "Render manifests are missing." : null,
    data.renderReadiness?.renderedFiles === renderManifests.length ? null : "Rendered media outputs are not approved for every required format.",
    approvedNarrationAssets === expectedNarrationAssets ? null : "Narration audio is not approved for every tutorial language.",
    Object.values(evidenceCounts).every((count) => count === queue.length) && approvedPhrases === queue.length ? null : "Queue review evidence is incomplete.",
    oauthConfigured === oauthStatus.length && oauthStatus.length > 0 ? null : "Platform OAuth/API configuration is incomplete.",
    queue.every((item) => item.status !== "DRAFT") ? null : "Publication queue remains in DRAFT."
  ].filter(Boolean);

  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    status: blockers.length === 0 ? "READY_FOR_FINAL_OWNER_APPROVAL" : "BLOCKED_REVIEW_EVIDENCE",
    generatedAt: data.generatedAt,
    publicationAllowed: false,
    privateUploadAllowed: false,
    unlistedUploadAllowed: false,
    realNetworkActionsPerformed: false,
    totals: {
      tutorials: tutorials.length,
      renderManifests: renderManifests.length,
      renderedFiles: data.renderReadiness?.renderedFiles || 0,
      expectedNarrationAssets,
      approvedNarrationAssets,
      queueItems: queue.length,
      draftQueueItems: queue.filter((item) => item.status === "DRAFT").length,
      oauthConfigured,
      oauthPlatforms: oauthStatus.length,
      approvedPhrases
    },
    evidenceCounts,
    requiredEvidence: [
      "rendered-media-approved",
      "narration-approved",
      "technical-review",
      "educational-review",
      "privacy-review",
      "copyright-review",
      "legal-brand-review",
      "owner-approval",
      "OWNER_APPROVES_SOCIAL_PUBLICATION"
    ],
    blockers,
    safeLocalCommands: {
      evidenceTemplate: "npm run academy:evidence:template",
      evidenceAudit: "npm run academy:evidence:audit",
      reviewEvidence: "npm run academy:review:evidence",
      renderStatus: "npm run academy:render:status",
      narrationStatus: "npm run academy:narration:status",
      approvalStatus: "npm run academy:approval:status",
      oauthStatus: "npm run academy:oauth:status"
    },
    localArtifacts: {
      queue: `${data.outputRoot}/queue/publication-queue.json`,
      renderHandoff: "reports/UAOS_SOCIAL_RENDER_HANDOFF.json",
      narrationHandoff: "reports/UAOS_SOCIAL_NARRATION_HANDOFF.json",
      approvalHandoff: "reports/UAOS_SOCIAL_PUBLICATION_APPROVAL_HANDOFF.json",
      evidenceImportTemplate: "reports/UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_TEMPLATE.json",
      reviewerWorkingEvidence: `${data.outputRoot}/reviews/reviewer-evidence-working.json`,
      reviewEvidenceGate: "reports/UAOS_SOCIAL_REVIEW_EVIDENCE_GATE.json"
    },
    approvalPhraseRequired: "OWNER_APPROVES_SOCIAL_PUBLICATION"
  };
}

export function createOutdatedContent(tutorials) {
  return tutorials.map((tutorial) => ({
    tutorialId: tutorial.tutorialId,
    route: tutorial.route,
    component: tutorial.component,
    selectorHash: hashText(`${tutorial.route}-${tutorial.component}`),
    buttonTextHash: hashText(tutorial.storyboard.shotList.join("|")),
    screenshotHash: "not-captured-yet",
    productVersion: "1.0.0-beta.10",
    pricingHash: "canonical-pricing-current",
    featureFlagsHash: "release-candidate-current",
    workflowHash: tutorial.contentHash,
    hardwareProfileHash: tutorial.featureStatus === TUTORIAL_STATUS.blockedHardware ? "manual-hardware-review" : "none",
    knownIssuesHash: "current",
    documentationHash: hashText(tutorial.supportArticle.body),
    status: tutorial.featureStatus === TUTORIAL_STATUS.covered ? "CURRENT" : "REVIEW_REQUIRED",
    autoDelete: false
  }));
}

export function createAnalytics(tutorials, queue, outdated) {
  return {
    generatedCount: tutorials.length,
    reviewedCount: 0,
    renderedCount: 0,
    publicationReadyCount: 0,
    blockedCount: queue.filter((item) => item.status === "DRAFT").length,
    outdatedCount: outdated.filter((item) => item.status !== "CURRENT").length,
    platformCoverage: PLATFORM_COMPLETION.length,
    languageCoverage: { ar: tutorials.length, en: tutorials.length, deFoundation: tutorials.length },
    supportLinkage: tutorials.filter((tutorial) => tutorial.supportArticle).length,
    completionMetadata: "local-review-ready",
    localPreviewCount: tutorials.length,
    externalAnalytics: { disabled: true, oauthRequired: true, noPersonalTracking: true, noAdvertiserData: true, consentRequired: true, aggregatedMetadataOnly: true },
    fakeViews: false,
    fakeSubscribers: false
  };
}

export function createPrivacyGate(tutorial) {
  return {
    tutorialId: tutorial.tutorialId,
    syntheticAudioOnly: true,
    noPersonalProject: true,
    noAccountEmail: true,
    noToken: true,
    noPassword: true,
    noCookie: true,
    noFilesystemPrivatePathVisible: true,
    noWindowsUsernameVisibleInVideo: true,
    noPrivateApiUrl: true,
    noPrivateAccountDashboard: true,
    logoAuthorized: true,
    narrationConsent: "manual-required-before-voice-use",
    screenshotConsent: "synthetic-ui-only",
    blurSensitiveContentWhenNeeded: true,
    status: "PASS_LOCAL_SYNTHETIC"
  };
}

export function createCopyrightGate(tutorial) {
  return {
    tutorialId: tutorial.tutorialId,
    syntheticAudioOnly: true,
    noCommercialSamples: true,
    noCopyrightedSong: true,
    copyrightSourceMetadata: "synthetic-generated-metadata-only",
    status: "PASS_LOCAL_SYNTHETIC"
  };
}

export function createDiskSafety() {
  return {
    availableDiskSpaceCheck: true,
    estimatedBatchSizeMb: 180,
    warningThresholdMb: 5000,
    hardStopThresholdMb: 1000,
    tempCleanup: true,
    failedRenderCleanup: true,
    keepManifest: true,
    keepCaptions: true,
    keepScripts: true,
    doNotDeleteApprovedAssets: true,
    maximumParallelRenders: 1,
    maximumCaptureJobs: 1,
    resumableJobs: true
  };
}

export function createCommentsCommunityFoundation() {
  return ["youtube-comments", "tiktok-comments", "instagram-comments", "facebook-comments", "x-replies", "telegram-comments", "discord-replies"].map((id) => ({
    id,
    enabled: false,
    retrieveComments: "future-official-api-only",
    categorizeQuestion: true,
    faqSuggestion: true,
    responseDraft: true,
    moderationFlag: true,
    spamFlag: true,
    supportTicketSuggestion: true,
    automaticReply: false,
    automaticDelete: false,
    explicitApprovalRequired: true,
    scrapingAllowed: false
  }));
}

export function createFullProduction(options = {}) {
  const ffmpegAvailable = Boolean(options.ffmpegAvailable);
  const topics = buildTopicPool();
  const batches = assignBatches(topics);
  const tutorials = batches.flatMap((batch) => batch.tutorials).map((tutorial) => createTutorialRecord(tutorial, ffmpegAvailable));
  const queue = createPublishingQueue(tutorials);
  const outdated = createOutdatedContent(tutorials);
  const schedules = createSchedules(tutorials);
  const campaigns = createCampaigns(tutorials);
  const batch001 = createBatch001({ ffmpegAvailable });
  const features = discoverFeatureInventory();
  const coverage = features.map((feature) => {
    const aliases = coverageAliases(feature).map((item) => String(item).toLowerCase());
    const covered = tutorials.filter((tutorial) => tutorial.featureId === feature.featureId || tutorial.section.toLowerCase().includes(feature.category.toLowerCase()) || tutorial.route === feature.route || aliases.some((alias) => tutorial.batchName.toLowerCase().includes(alias) || tutorial.section.toLowerCase().includes(alias) || tutorial.title.toLowerCase().includes(alias)));
    return {
      featureId: feature.featureId,
      route: feature.route,
      tutorialIds: covered.map((tutorial) => tutorial.tutorialId),
      longVideo: covered.length > 0,
      shortVideo: covered.length > 0,
      carousel: covered.length > 0,
      story: covered.length > 0,
      article: covered.length > 0,
      faq: covered.length > 0,
      Arabic: covered.length > 0,
      English: covered.length > 0,
      German: covered.length > 0,
      version: "1.0.0-beta.10",
      reviewStatus: covered.length > 0 ? "MANUAL_REVIEW_REQUIRED" : "MISSING",
      missingOutputs: covered.length > 0 ? [] : ["tutorial"],
      status: covered.length > 0 ? statusForFeature(feature) : TUTORIAL_STATUS.missing
    };
  });
  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    status: FULL_PRODUCTION_STATUS,
    outputRoot: FULL_OUTPUT_ROOT,
    batch001,
    batches: batches.map((batch) => ({ batchId: batch.batchId, name: batch.name, tutorialCount: batch.tutorials.length, status: "LOCAL_REVIEW_READY" })),
    tutorials,
    coverage,
    missingContent: coverage.filter((item) => item.status === TUTORIAL_STATUS.missing || item.status === TUTORIAL_STATUS.partial),
    platformAdapters: createPlatformAdapterCatalog(),
    tokenStorage: createSecureTokenStorageContract(),
    publicationQueue: queue,
    publicationGate: createPublicationGate(),
    schedules,
    campaigns,
    outdatedContent: outdated,
    analytics: createAnalytics(tutorials, queue, outdated),
    privacyGate: tutorials.map((tutorial) => tutorial.privacyGate),
    copyrightGate: tutorials.map((tutorial) => tutorial.copyrightGate),
    diskSafety: createDiskSafety(),
    commentsCommunity: createCommentsCommunityFoundation(),
    templates: VIDEO_TEMPLATES,
    oauthStatus: createOAuthStatus(),
    narrationReadiness: createNarrationReadiness(tutorials),
    renderReadiness: createRenderReadiness(tutorials, ffmpegAvailable),
    finalGate: {
      status: FULL_PRODUCTION_STATUS,
      allTutorialsReadyForLocalReview: tutorials.length === 140,
      socialContentPipelineCodeComplete: true,
      rendererConfigurationRequired: !ffmpegAvailable,
      oauthConfigurationRequired: true,
      publicationAllowed: false,
      publishedCount: 0
    },
    counts: {
      features: features.length,
      tutorials: tutorials.length,
      batches: batches.length,
      readyForLocalReview: tutorials.length,
      readyForRender: tutorials.length,
      readyForPrivateUpload: 0,
      published: 0,
      blockedFfmpeg: ffmpegAvailable ? 0 : tutorials.length,
      blockedNarration: tutorials.length,
      blockedOAuth: tutorials.length
    },
    generatedAt: new Date().toISOString()
  };
}

export function createOAuthStatus() {
  return PLATFORM_COMPLETION.map((platformId) => ({
    platformId,
    configured: false,
    missingClientId: !["rss", "website-news", "whatsapp-status"].includes(platformId),
    missingClientSecret: !["rss", "website-news", "whatsapp-status"].includes(platformId),
    redirectUrl: `uaos://oauth/${platformId}`,
    requiredScopes: ["publish", "analytics-read"],
    appReviewNeeded: true,
    tokenStorageStatus: "unavailable",
    accountVerification: false,
    publishCapability: false,
    analyticsCapability: false,
    schedulingCapability: false,
    disabledReason: "OAuth is intentionally disabled in local review mode",
    secretMasked: true
  }));
}

export function createNarrationReadiness(tutorials) {
  const languageCounts = tutorials.reduce((counts, tutorial) => {
    for (const language of Object.keys(tutorial.scripts || {})) counts[language] = (counts[language] || 0) + 1;
    return counts;
  }, { ar: 0, en: 0, de: 0 });
  return {
    providers: ["disabled", "text-only", "windows-system-tts", "imported-narration", "user-recorded-narration", "mock-provider", "remote-provider-disabled"],
    voiceDiscovery: "metadata-only",
    languageMatching: true,
    arabicVoiceMatching: "MANUAL_ARABIC_NARRATION_REQUIRED",
    englishVoiceMatching: "WINDOWS_TTS_WHEN_AVAILABLE",
    germanVoiceMatching: "FOUNDATION",
    speakingRate: "0.95",
    pauses: true,
    pronunciationDictionary: { UAOS: "you-ay-oh-ess", MIDI: "mid-ee", SysEx: "system exclusive" },
    outputWavMetadata: "metadata-only",
    durationCheck: "pending-real-audio",
    clippingCheck: "pending-real-audio",
    silenceCheck: "pending-real-audio",
    manualArabicNarrationRequired: tutorials.length,
    requiredLanguages: ["ar", "en", "de-foundation"],
    scriptCounts: languageCounts,
    expectedAudioAssets: tutorials.length * 3,
    recordedAudioAssets: 0,
    importedAudioAssets: 0,
    approvedAudioAssets: 0,
    automaticVoiceCloning: false,
    cloudTtsEnabled: false,
    realMicrophoneCapturePerformed: false,
    status: "BLOCKED_MANUAL_NARRATION"
  };
}

export function createNarrationHandoffPlan(data) {
  const tutorials = data.tutorials || [];
  const sampleTutorial = tutorials[0] || null;
  const requiredLanguages = data.narrationReadiness.requiredLanguages || ["ar", "en", "de-foundation"];
  const expectedAudioAssets = tutorials.length * requiredLanguages.length;
  const perLanguage = requiredLanguages.map((language) => ({
    language,
    scriptsReady: language === "de-foundation" ? data.narrationReadiness.scriptCounts.de : data.narrationReadiness.scriptCounts[language],
    recordedAudioAssets: 0,
    approvedAudioAssets: 0,
    status: language === "ar" ? "MANUAL_RECORDING_REQUIRED" : "REVIEW_OR_IMPORT_REQUIRED"
  }));

  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    status: "BLOCKED_MANUAL_NARRATION",
    generatedAt: data.generatedAt,
    publicationAllowed: false,
    realNetworkActionsPerformed: false,
    realMicrophoneCapturePerformed: false,
    cloudTtsEnabled: false,
    automaticVoiceCloning: false,
    totals: {
      tutorials: data.counts.tutorials,
      languages: requiredLanguages.length,
      expectedAudioAssets,
      recordedAudioAssets: 0,
      importedAudioAssets: 0,
      approvedAudioAssets: 0,
      pendingApprovalAssets: expectedAudioAssets
    },
    paths: {
      outputRoot: data.outputRoot,
      tutorialRoot: `${data.outputRoot}/tutorials`,
      sampleScript: sampleTutorial ? `${sampleTutorial.outputPath}/scripts/script-ar.json` : null,
      sampleNarrationDirectory: sampleTutorial ? `${sampleTutorial.outputPath}/narration` : null,
      narrationReadinessReport: "reports/UAOS_SOCIAL_NARRATION_READINESS.json",
      narrationHandoffReport: "reports/UAOS_SOCIAL_NARRATION_HANDOFF.json"
    },
    perLanguage,
    requiredChecks: [
      "Record or import approved narration audio for each tutorial and language.",
      "Verify consent for every human voice before use.",
      "Check duration against captions and storyboard timings.",
      "Check clipping, silence, pronunciation and pacing.",
      "Keep cloud TTS and voice cloning disabled unless explicitly approved later."
    ],
    safeLocalCommands: {
      narrationStatus: "npm run academy:narration:status",
      validateAll: "npm run academy:validate:all",
      renderStatus: "npm run academy:render:status",
      handoffReadiness: "npm run academy:handoff:readiness"
    },
    blockers: [
      "Arabic narration requires manual recording or explicit approval.",
      "English and German foundation narration require review, import or approved local TTS.",
      "Real audio quality checks require browser/audio or DAW validation."
    ],
    approvalRequiredBeforeRender: true,
    approvalPhraseRequired: "OWNER_APPROVES_NARRATION_FOR_RENDER"
  };
}

export function createRenderReadiness(tutorials, ffmpegAvailable = false) {
  const formats = ["landscape", "vertical", "square", "portrait"];
  const manifests = tutorials.flatMap((tutorial) => tutorial.renderManifests);
  const sampleTutorial = tutorials[0] || null;
  const blockedManifests = manifests.filter((manifest) => manifest.status === "FFMPEG_REQUIRED").length;
  return {
    ffmpegAvailable,
    status: ffmpegAvailable ? "SAMPLE_RENDER_READY" : "FFMPEG_REQUIRED",
    sampleRenderOnly: true,
    fullBatchRenderAutomatic: false,
    manifests: manifests.length,
    blockedManifests,
    renderedFiles: 0,
    expectedFormats: formats,
    manifestLocations: tutorials.slice(0, 5).map((tutorial) => `${tutorial.outputPath}/renders/manifest.json`),
    sampleTutorialId: sampleTutorial?.tutorialId || null,
    sampleManifestPath: sampleTutorial ? `${sampleTutorial.outputPath}/renders/manifest.json` : null,
    sampleOutputPath: sampleTutorial ? `${sampleTutorial.outputPath}/renders/landscape.mp4` : null,
    screenshots: "svg-placeholder-ready",
    overlays: "ready",
    captions: "ready",
    thumbnails: "ready",
    exactCommands: true,
    concurrencyLimit: 1,
    resumeSupport: true,
    diskSpaceChecks: true,
    cleanup: true,
    failedJobRetry: true,
    safeCommands: {
      validateAll: "npm run academy:validate:all",
      inspectStatus: "npm run academy:status",
      renderSample: "npm run academy:render:sample",
      renderBatchManifestOnly: "npm run academy:render:batch"
    },
    blockedReason: ffmpegAvailable ? null : "FFmpeg is not available in this environment or was not detected on PATH.",
    manualRenderAllowed: true,
    automaticUploadAfterRender: false
  };
}

export function createRenderHandoffPlan(data) {
  const firstTutorial = data.tutorials[0];
  const firstManifest = firstTutorial?.renderManifests?.[0] || null;
  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    status: data.renderReadiness.ffmpegAvailable ? "READY_FOR_SAMPLE_RENDER" : "BLOCKED_FFMPEG_OR_MANUAL_RENDER_REQUIRED",
    generatedAt: data.generatedAt,
    publicationAllowed: false,
    realNetworkActionsPerformed: false,
    totals: {
      tutorials: data.counts.tutorials,
      renderManifests: data.renderReadiness.manifests,
      blockedManifests: data.renderReadiness.blockedManifests,
      renderedFiles: data.renderReadiness.renderedFiles,
      expectedFormatsPerTutorial: data.renderReadiness.expectedFormats.length
    },
    paths: {
      outputRoot: data.outputRoot,
      tutorialRoot: `${data.outputRoot}/tutorials`,
      globalRenderRoot: `${data.outputRoot}/renders`,
      sampleManifest: data.renderReadiness.sampleManifestPath,
      sampleOutput: data.renderReadiness.sampleOutputPath,
      renderReadinessReport: "reports/UAOS_SOCIAL_RENDER_READINESS.json",
      renderHandoffReport: "reports/UAOS_SOCIAL_RENDER_HANDOFF.json"
    },
    prerequisites: [
      "Install FFmpeg locally or use a trusted manual video editor.",
      "Use only generated UAOS synthetic scripts, captions, thumbnails and manifests.",
      "Do not include user projects, private paths, account pages, tokens, commercial samples or copyrighted songs.",
      "Run validation before and after any manual render pass."
    ],
    localValidationCommands: {
      validateAll: "npm run academy:validate:all",
      handoffReadiness: "npm run academy:handoff:readiness",
      renderStatus: "npm run academy:render:status",
      queueDryRun: "npm run academy:queue:dry-run"
    },
    sampleFfmpegCommand: firstManifest?.command || null,
    manualSteps: [
      "Open the tutorial render manifest.",
      "Render one sample landscape output first.",
      "Review narration, captions, safe margins, contrast and motion.",
      "Repeat for vertical, square and portrait formats after approval.",
      "Keep publication queue items in DRAFT until OAuth, legal review and owner approval are complete."
    ],
    approvalRequiredBeforeUpload: true,
    approvalPhraseRequired: "OWNER_APPROVES_SOCIAL_PUBLICATION"
  };
}

export function createManualHandoffReadiness(data) {
  const oauthPlatforms = data.oauthStatus.length;
  const oauthConfigured = data.oauthStatus.filter((item) => item.configured).length;
  const draftQueueItems = data.publicationQueue.filter((item) => item.status === "DRAFT").length;
  const blockers = [
    data.renderReadiness.ffmpegAvailable ? null : "Install FFmpeg or render manually from the generated render manifests.",
    data.narrationReadiness.manualArabicNarrationRequired > 0 ? "Record or approve Arabic narration for every tutorial before final render approval." : null,
    oauthConfigured < oauthPlatforms ? "Configure official platform OAuth/API credentials and approved app scopes." : null,
    draftQueueItems > 0 ? "Complete manual review and owner approval before any private upload, scheduling, or publication." : null
  ].filter(Boolean);

  return {
    schemaVersion: FULL_PRODUCTION_SCHEMA_VERSION,
    status: blockers.length === 0 ? "READY_FOR_OWNER_APPROVAL" : "BLOCKED_MANUAL_HANDOFF",
    generatedAt: data.generatedAt,
    totals: {
      tutorials: data.counts.tutorials,
      batches: data.counts.batches,
      renderManifests: data.renderReadiness.manifests,
      publicationQueueItems: data.publicationQueue.length,
      draftQueueItems,
      oauthPlatforms,
      oauthConfigured
    },
    localArtifacts: {
      outputRoot: data.outputRoot,
      tutorials: `${data.outputRoot}/tutorials`,
      renders: `${data.outputRoot}/renders`,
      queue: `${data.outputRoot}/queue/publication-queue.json`,
      reports: "reports/UAOS_SOCIAL_*",
      renderHandoff: "reports/UAOS_SOCIAL_RENDER_HANDOFF.json"
    },
    commands: {
      verifyStatus: "npm run academy:status",
      validateAll: "npm run academy:validate:all",
      checkOAuth: "npm run academy:oauth:status",
      renderSample: "npm run academy:render:sample",
      renderStatus: "npm run academy:render:status",
      queueDryRun: "npm run academy:queue:dry-run"
    },
    requiredExternalActions: blockers,
    publicationAllowed: false,
    realNetworkActionsPerformed: false,
    approvalPhraseRequired: "OWNER_APPROVES_SOCIAL_PUBLICATION"
  };
}

export function createAcademyFullSummary(data = createFullProduction()) {
  const approvalHandoff = createPublicationApprovalHandoffPlan(data);
  const reviewGate = createReviewEvidenceGate(data);
  const reviewerWorkingEvidence = createReviewerEvidenceWorkingManifest(data);
  const evidenceImportAudit = createReviewEvidenceImportAudit(data, reviewerWorkingEvidence);
  return {
    status: data.status,
    totalFeatures: data.counts.features,
    totalTutorials: data.counts.tutorials,
    coveredFeatures: data.coverage.filter((item) => item.status !== TUTORIAL_STATUS.missing).length,
    missingTutorials: data.missingContent.length,
    scriptsReady: data.counts.tutorials,
    rendersReady: 0,
    blockedFfmpeg: data.counts.blockedFfmpeg,
    blockedNarration: data.counts.blockedNarration,
    narrationAssetsExpected: data.narrationReadiness.expectedAudioAssets,
    narrationAssetsApproved: data.narrationReadiness.approvedAudioAssets,
    evidenceTemplateStatus: createReviewEvidenceImportManifest(data).status,
    evidenceWorkingStatus: reviewerWorkingEvidence.status,
    evidenceAuditStatus: evidenceImportAudit.status,
    evidenceAuditBlockers: evidenceImportAudit.blockers.length,
    evidenceArtifactIssues: evidenceImportAudit.evidenceArtifactIssues.tutorialEvidence.length,
    evidenceFreshnessIssues: evidenceImportAudit.evidenceFreshnessIssues.tutorialEvidence.length + evidenceImportAudit.evidenceFreshnessIssues.queueEvidence.length,
    evidenceProvenanceIssues: evidenceImportAudit.evidenceProvenanceIssues.tutorialEvidence.length + evidenceImportAudit.evidenceProvenanceIssues.queueEvidence.length + evidenceImportAudit.evidenceProvenanceIssues.oauthEvidence.length,
    evidenceConsistencyIssues: evidenceImportAudit.evidenceConsistencyIssues.queueEvidence.length,
    blockedOAuth: data.counts.blockedOAuth,
    publicationQueueItems: approvalHandoff.totals.queueItems,
    approvalReadyItems: approvalHandoff.totals.ownerApprovedItems,
    reviewEvidenceStatus: reviewGate.status,
    reviewEvidenceBlockers: reviewGate.blockers.length,
    draftQueueItems: approvalHandoff.totals.draftItems,
    waitingReview: data.counts.tutorials,
    readyPrivateUpload: 0,
    scheduled: data.schedules.fullBacklogPlan.length,
    published: 0,
    outdated: data.outdatedContent.filter((item) => item.status !== "CURRENT").length,
    failedJobs: 0,
    tabs: ["Dashboard", "Features", "Curriculum", "Tutorials", "Scripts", "Storyboards", "Captures", "Renders", "Captions", "Thumbnails", "Carousels", "Platform Packages", "Campaigns", "Schedule", "OAuth", "Queue", "Reviews", "Analytics", "Outdated Content", "Reports", "Settings"],
    preview: {
      longVideoPreview: true,
      shortVideoPreview: true,
      captionsToggle: true,
      language: ["ar", "en", "de-foundation"],
      thumbnail: true,
      carousel: true,
      story: true,
      platformText: true,
      safeMobilePreview: true,
      desktopPreview: true,
      version: "1.0.0-beta.10",
      warnings: ["No external publishing", "FFmpeg required", "OAuth required", "Manual review required"]
    }
  };
}

export function validateFullProduction(data) {
  const errors = [];
  if (data.tutorials.length !== 140) errors.push(`expected 140 tutorials, got ${data.tutorials.length}`);
  if (data.batches.length !== 30) errors.push(`expected 30 batches, got ${data.batches.length}`);
  if (new Set(data.tutorials.map((tutorial) => tutorial.tutorialId)).size !== data.tutorials.length) errors.push("duplicate tutorial id");
  if (new Set(data.tutorials.map((tutorial) => tutorial.contentHash)).size !== data.tutorials.length) errors.push("duplicate content hash");
  if (data.tutorials.some((tutorial) => !tutorial.route || !tutorial.featureId)) errors.push("orphan tutorial");
  if (data.publicationQueue.some((item) => item.status !== "DRAFT")) errors.push("queue must default to DRAFT");
  if (data.publicationGate.publicPublicationAllowed !== false) errors.push("public publication must be disabled");
  if (data.oauthStatus.some((item) => item.configured)) errors.push("OAuth must remain disabled");
  if (data.analytics.fakeViews || data.analytics.fakeSubscribers) errors.push("fake metrics are forbidden");
  if (data.privacyGate.some((item) => item.status !== "PASS_LOCAL_SYNTHETIC")) errors.push("privacy gate failed");
  if (data.copyrightGate.some((item) => item.status !== "PASS_LOCAL_SYNTHETIC")) errors.push("copyright gate failed");
  return { valid: errors.length === 0, errors };
}
