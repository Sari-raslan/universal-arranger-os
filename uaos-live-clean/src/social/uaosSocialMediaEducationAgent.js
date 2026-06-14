export const SOCIAL_AGENT_SCHEMA_VERSION = 1;
export const SOCIAL_AGENT_CODE_NAME = "UAOSSocialMediaEducationAgent";
export const SOCIAL_AGENT_MARKETING_NAME = "UAOS Academy & Social Hub";

const DEFAULT_LANGUAGES = Object.freeze(["ar", "en", "de"]);
const DEFAULT_APPROVAL = Object.freeze({ required: true, status: "draft" });

export const PLATFORM_ADAPTERS = Object.freeze([
  { id: "youtube", name: "YouTube", family: "video", formats: ["long-video"], aspectRatios: ["16:9"], maxCaptionChars: 5000, oauthRequired: true, apiRequired: true },
  { id: "youtube-shorts", name: "YouTube Shorts", family: "short-video", formats: ["short-video"], aspectRatios: ["9:16"], maxCaptionChars: 5000, oauthRequired: true, apiRequired: true },
  { id: "tiktok", name: "TikTok", family: "short-video", formats: ["short-video"], aspectRatios: ["9:16"], maxCaptionChars: 2200, oauthRequired: true, apiRequired: true },
  { id: "instagram-reels", name: "Instagram Reels", family: "short-video", formats: ["short-video"], aspectRatios: ["9:16"], maxCaptionChars: 2200, oauthRequired: true, apiRequired: true },
  { id: "facebook-reels", name: "Facebook Reels", family: "short-video", formats: ["short-video"], aspectRatios: ["9:16"], maxCaptionChars: 2200, oauthRequired: true, apiRequired: true },
  { id: "snapchat-spotlight", name: "Snapchat Spotlight", family: "short-video", formats: ["short-video"], aspectRatios: ["9:16"], maxCaptionChars: 250, oauthRequired: true, apiRequired: true, foundation: true },
  { id: "instagram-feed", name: "Instagram Feed", family: "feed", formats: ["static-post", "carousel"], aspectRatios: ["1:1", "4:5"], maxCaptionChars: 2200, oauthRequired: true, apiRequired: true },
  { id: "facebook-pages", name: "Facebook Pages", family: "feed", formats: ["static-post", "carousel", "long-video"], aspectRatios: ["16:9", "1:1", "4:5"], maxCaptionChars: 63206, oauthRequired: true, apiRequired: true },
  { id: "x-twitter", name: "X / Twitter", family: "feed", formats: ["thread", "static-post"], aspectRatios: ["16:9", "1:1"], maxCaptionChars: 280, oauthRequired: true, apiRequired: true },
  { id: "linkedin", name: "LinkedIn", family: "feed", formats: ["static-post", "article", "document-carousel", "long-video"], aspectRatios: ["16:9", "1:1"], maxCaptionChars: 3000, oauthRequired: true, apiRequired: true },
  { id: "threads", name: "Threads", family: "feed", formats: ["thread", "static-post"], aspectRatios: ["1:1", "4:5"], maxCaptionChars: 500, oauthRequired: true, apiRequired: true },
  { id: "pinterest", name: "Pinterest", family: "feed", formats: ["pin", "carousel"], aspectRatios: ["2:3", "9:16"], maxCaptionChars: 500, oauthRequired: true, apiRequired: true, foundation: true },
  { id: "whatsapp-channel", name: "WhatsApp Channel", family: "messaging", formats: ["channel-post", "poster"], aspectRatios: ["1:1", "9:16"], maxCaptionChars: 1000, oauthRequired: true, apiRequired: true },
  { id: "whatsapp-status", name: "WhatsApp Status Export", family: "messaging", formats: ["story"], aspectRatios: ["9:16"], maxCaptionChars: 700, oauthRequired: false, apiRequired: false, exportOnly: true },
  { id: "telegram-channel", name: "Telegram Channel", family: "messaging", formats: ["channel-post"], aspectRatios: ["16:9", "1:1"], maxCaptionChars: 4096, oauthRequired: false, apiRequired: true },
  { id: "telegram-group", name: "Telegram Group", family: "messaging", formats: ["group-post"], aspectRatios: ["16:9", "1:1"], maxCaptionChars: 4096, oauthRequired: false, apiRequired: true, foundation: true },
  { id: "discord-announcement", name: "Discord Announcement", family: "community", formats: ["announcement"], aspectRatios: ["16:9", "1:1"], maxCaptionChars: 2000, oauthRequired: false, apiRequired: true, foundation: true },
  { id: "reddit-post", name: "Reddit Post", family: "community", formats: ["text-post"], aspectRatios: ["16:9", "1:1"], maxCaptionChars: 40000, oauthRequired: true, apiRequired: true, foundation: true },
  { id: "generic-social", name: "Generic Social Platform", family: "future", formats: ["static-post"], aspectRatios: ["1:1"], maxCaptionChars: 1000, oauthRequired: true, apiRequired: true, foundation: true },
  { id: "webhook", name: "Webhook Adapter", family: "future", formats: ["json-payload"], aspectRatios: ["metadata"], maxCaptionChars: 10000, oauthRequired: false, apiRequired: true, foundation: true },
  { id: "rss-feed", name: "RSS Feed", family: "future", formats: ["rss-item"], aspectRatios: ["metadata"], maxCaptionChars: 10000, oauthRequired: false, apiRequired: false, foundation: true },
  { id: "blog-cms", name: "Blog / CMS", family: "future", formats: ["blog-post"], aspectRatios: ["16:9"], maxCaptionChars: 20000, oauthRequired: true, apiRequired: true, foundation: true },
  { id: "website-news", name: "Website News", family: "future", formats: ["news-post"], aspectRatios: ["16:9"], maxCaptionChars: 10000, oauthRequired: false, apiRequired: true, foundation: true }
]);

export const CONTENT_TYPES = Object.freeze([
  "youtube-tutorial",
  "facebook-long-video",
  "course-lesson",
  "webinar-foundation",
  "product-walkthrough",
  "hardware-setup-lesson",
  "troubleshooting-lesson",
  "short-tip-15s",
  "short-tip-30s",
  "short-tutorial-60s",
  "short-walkthrough-90s",
  "instagram-post",
  "facebook-post",
  "x-post",
  "linkedin-post",
  "threads-post",
  "pinterest-pin",
  "whatsapp-poster",
  "telegram-post",
  "discord-announcement",
  "website-news-post",
  "carousel",
  "story",
  "tutorial-summary",
  "faq",
  "blog-post",
  "email-newsletter-foundation"
]);

export const MANDATORY_TUTORIALS = Object.freeze({
  startHere: ["What is UAOS", "Windows installation", "Web App", "First run", "Choose language", "Offline mode", "Create first project", "Save project", "Restore project", "Interface tour", "Diagnostics", "Black screen", "Local services"],
  sing: ["Record voice", "Upload audio", "Analyze audio", "Extract melody", "Voice-to-MIDI", "Save result", "Export MIDI", "Microphone error", "Privacy"],
  studioDaw: ["Create project", "Audio Track", "MIDI Track", "Sampler Track", "Recording", "Timeline", "Clips", "Loop", "Punch", "Piano Roll", "Velocity", "Quantize", "Mixer", "Effects", "Automation", "Undo/Redo", "Autosave", "Recovery", "Export"],
  sampler: ["WAV loading", "Presets", "Root note", "Key zones", "Velocity zones", "ADSR", "Polyphony", "Sustain", "Drum kits", "Choke groups", "Library", "Missing samples", "MIDI-to-Sampler"],
  arranger: ["Arranger Engine", "Intro", "Variations", "Fills", "Break", "Ending", "Chords", "Tempo", "Parts", "Drum", "Bass", "Chord tracks", "Pads", "Phrases", "Assign presets", "Convert to DAW", "Panic"],
  ai: ["BPM detection", "Key detection", "Chord detection", "Song structure", "Voice-to-MIDI", "Song-to-Arrangement", "Arrangement Planner", "Maqam", "Quarter tones", "Manual correction", "Confidence", "Local AI", "Privacy"],
  midi: ["Web MIDI", "Input", "Output", "MIDI Monitor", "MIDI Learn", "Notes", "CC", "Program Change", "Sustain", "Pitch Bend", "Panic", "Device disconnect", "Diagnostics"],
  hardware: ["Setup Wizard", "PA3X", "PA5X", "Genos", "BK-9", "SD9", "Channels", "Transport mapping", "Arranger mappings", "Mixer mappings", "SysEx safety", "Reconnect", "Diagnostics"],
  accounts: ["Registration", "Login", "Logout", "Local mode", "API offline", "Sessions", "Reset password foundation", "Privacy", "Data export", "Delete request"],
  pricing: ["Free", "Studio Founders", "Pro Founders", "first 3 paid months", "standard price afterward", "Ultimate planned", "Checkout disabled", "plan comparison", "no hidden charges"],
  support: ["Known Issues", "Missing audio", "MIDI not detected", "Microphone denied", "AudioContext suspended", "Accounts offline", "Stripe disabled", "Unsigned installer", "Hardware validation", "Feedback", "Recovery"]
});

const ROUTE_FEATURES = Object.freeze([
  ["home", "#/", "Home", "UAOS overview and product entry", "all", "free", "onboarding"],
  ["sing", "#/sing", "Sing", "Voice recording, audio analysis and voice-to-MIDI foundations", "singers", "free", "audio"],
  ["studio", "#/studio", "DAWStudioPanel", "DAW timeline, recording, mixer, effects and export foundation", "creators", "studio", "daw"],
  ["account", "#/account", "CloudPlatformPanel", "Accounts, offline mode, sync foundation and privacy controls", "users", "studio", "accounts"],
  ["pro", "#/pro", "ProfessionalArrangerPanel", "Professional arranger engine and hardware mapping foundation", "keyboardists", "pro", "arranger"],
  ["midi", "#/midi", "MidiMonitor", "Web MIDI monitoring, MIDI Learn and diagnostics", "keyboardists", "pro", "midi"],
  ["hardware", "#/hardware", "HardwareIntegrationPanel", "Hardware setup wizard and device profile foundation", "keyboardists", "pro", "hardware"],
  ["audio", "#/audio", "AudioLab", "Audio capture, analysis and browser capability handling", "singers", "free", "audio"],
  ["timeline", "#/timeline", "TimelinePanel", "Session timeline capture and arrangement workflow", "creators", "studio", "daw"],
  ["sessions", "#/sessions", "SessionsPanel", "Local sessions, autosave and recovery", "all", "free", "sessions"],
  ["live", "#/live", "ArrangerPanel", "Live arranger controls with MIDI monitor", "performers", "pro", "performance"],
  ["sounds", "#/sounds", "LibraryBrowser", "Library browsing and sound organization", "creators", "studio", "library"],
  ["sampler", "#/sampler", "SamplerWorkbench", "Sampler presets, zones, envelopes and library integration", "producers", "studio", "sampler"],
  ["ai", "#/ai", "AILabsPanel", "Local AI music analysis, song structure and arrangement planning", "creators", "studio", "ai"],
  ["diagnostics", "#/diagnostics", "DiagnosticsPanel", "Runtime diagnostics and recovery guidance", "support", "free", "support"],
  ["pricing", "#/pricing", "PricingPage", "Canonical pricing, founder months and checkout-disabled state", "buyers", "free", "commerce"],
  ["downloads", "#/downloads", "Downloads", "Download center and unsigned installer status", "users", "free", "distribution"],
  ["support", "#/support", "Support", "Offline support center and known issue guidance", "users", "free", "support"],
  ["demo", "#/demo", "PublicBetaPanel", "Public beta demo and release candidate control center", "testers", "free", "beta"],
  ["privacy", "#/privacy", "LegalSummary", "Privacy summary pending legal review", "buyers", "free", "legal"],
  ["terms", "#/terms", "LegalSummary", "Terms summary pending legal review", "buyers", "free", "legal"],
  ["contact", "#/contact", "Contact", "Contact foundation with no production form enabled", "buyers", "free", "support"],
  ["status", "#/status", "ReleaseStatus", "Release status and runtime capability labels", "testers", "free", "release"]
]);

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function stableHash(input) {
  const text = JSON.stringify(input);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function clipText(text, limit) {
  const value = String(text || "");
  return value.length > limit ? `${value.slice(0, Math.max(0, limit - 1))}...` : value;
}

export function discoverFeatureInventory() {
  return ROUTE_FEATURES.map(([id, route, component, title, audience, plan, category]) => ({
    featureId: `uaos-${id}`,
    route,
    component,
    product: id === "pro" || id === "hardware" || id === "midi" || id === "live" ? "UAOS Pro Arranger" : id === "sing" || id === "audio" ? "UAOS Sing" : "UAOS Studio",
    plan,
    category,
    title,
    description: title,
    targetAudience: audience,
    difficulty: ["pricing", "downloads", "support", "privacy", "terms", "contact", "home"].includes(id) ? "beginner" : "intermediate",
    prerequisites: id === "hardware" || id === "midi" ? ["Browser with Web MIDI or mock MIDI mode", "Optional supported keyboard"] : ["Local UAOS app"],
    documentation: `docs/UAOS_${category.toUpperCase()}${category === "daw" ? "_LAYER" : ""}.md`,
    educationalContentRequired: true,
    marketingContentRequired: !["privacy", "terms", "diagnostics"].includes(id),
    supportedLanguages: [...DEFAULT_LANGUAGES],
    version: "1.0.0-beta.10",
    experimentalStatus: ["ai", "hardware", "midi", "pro", "live"].includes(id) ? "experimental-labelled" : "release-candidate",
    hardwareRequirement: ["hardware", "midi", "pro", "live"].includes(id) ? "optional-real-hardware-manual-validation" : "none",
    externalServiceRequirement: ["account", "pricing"].includes(id) ? "disabled-provider-foundation" : "none",
    contentStatus: "planned",
    platformCoverage: PLATFORM_ADAPTERS.map((platform) => platform.id)
  }));
}

export function createCurriculum(features = discoverFeatureInventory()) {
  const featureByCategory = new Map(features.map((feature) => [feature.category, feature]));
  const sections = [
    ["startHere", "Start Here", "onboarding"],
    ["sing", "UAOS Sing", "audio"],
    ["studioDaw", "UAOS Studio", "daw"],
    ["sampler", "UAOS Sampler", "sampler"],
    ["arranger", "UAOS Arranger", "arranger"],
    ["ai", "UAOS AI Music Studio", "ai"],
    ["midi", "UAOS MIDI", "midi"],
    ["hardware", "Hardware Setup", "hardware"],
    ["accounts", "Accounts", "accounts"],
    ["pricing", "Pricing", "commerce"],
    ["support", "Troubleshooting", "support"]
  ];
  return sections.map(([key, title, category]) => {
    const feature = featureByCategory.get(category) || features[0];
    return {
      sectionId: `curriculum-${slug(title)}`,
      title,
      featureId: feature.featureId,
      supportedLanguages: [...DEFAULT_LANGUAGES],
      topics: MANDATORY_TUTORIALS[key].map((topic, index) => createTutorial({ feature, topic, order: index + 1 }))
    };
  });
}

export function createTutorial({ feature, topic, order = 1, language = "ar" }) {
  const topicSlug = slug(topic);
  return {
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    tutorialId: `tutorial-${feature.featureId}-${topicSlug}-${language}`,
    featureId: feature.featureId,
    topic,
    language,
    locale: language === "ar" ? "ar-SA" : language === "de" ? "de-DE" : "en-US",
    order,
    title: `${topic} - ${feature.title}`,
    objective: `Teach ${topic} in ${feature.title} with honest release-candidate limits.`,
    prerequisites: feature.prerequisites,
    difficulty: feature.difficulty,
    audience: feature.targetAudience,
    route: feature.route,
    supportLink: "#/support",
    nextLesson: null,
    outputsRequired: ["long-video", "short-video", "static-post", "carousel", "story", "faq", "support-center-link"],
    status: "draft"
  };
}

export function createTutorialScript(tutorial, platformId = "youtube") {
  const platform = PLATFORM_ADAPTERS.find((item) => item.id === platformId) || PLATFORM_ADAPTERS[0];
  const opening = platform.family === "short-video"
    ? `In the first two seconds: show the result of ${tutorial.topic}.`
    : `Welcome to UAOS Academy. Today we cover ${tutorial.topic}.`;
  const ending = platform.family === "messaging"
    ? "Save this post and open the support center if anything looks different in your local build."
    : "Try it locally, keep projects backed up, and continue with the next UAOS Academy lesson.";
  return {
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    tutorialId: tutorial.tutorialId,
    platform: platform.id,
    language: tutorial.language,
    rtl: tutorial.language === "ar",
    hook: `${tutorial.topic}: the safe way inside UAOS.`,
    lessonObjective: tutorial.objective,
    prerequisites: tutorial.prerequisites,
    steps: [
      `Open ${tutorial.route}.`,
      `Locate the ${tutorial.topic} control or panel.`,
      "Use mock/demo data when possible.",
      "Check the status badge before assuming production behavior.",
      "Confirm the expected result and save locally."
    ],
    screenActions: ["open-route", "highlight-control", "show-status-label", "show-result", "open-support-link"],
    narration: [
      opening,
      "UAOS is local-first; unavailable cloud, billing or hardware services are labelled honestly.",
      `This lesson focuses on ${tutorial.topic}, not on unsupported production claims.`,
      ending
    ],
    warnings: ["Do not use private user projects in captures.", "Do not claim signed installers or live checkout until external approval exists."],
    commonMistakes: ["Skipping status badges", "Using real credentials in a recording", "Expecting disabled providers to publish automatically"],
    successConfirmation: `The learner can complete ${tutorial.topic} and explain its current release status.`,
    summary: `${tutorial.topic} is ready for education content as a ${tutorial.difficulty} UAOS lesson.`,
    callToAction: "Open UAOS locally and follow the matching lesson in the support center.",
    nextLesson: tutorial.nextLesson,
    supportLinks: [tutorial.supportLink],
    experimentalWarnings: tutorial.difficulty === "intermediate" ? ["Feature may require manual validation or mock mode."] : [],
    platformOpening: opening,
    platformEnding: ending
  };
}

export function createSocialContent(input = {}) {
  const content = {
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    contentId: input.contentId || `social-${slug(input.featureId || "feature")}-${slug(input.platform || "platform")}-${slug(input.contentType || "content")}-${slug(input.language || "ar")}`,
    featureId: input.featureId,
    campaignId: input.campaignId || "uaos-academy-foundation",
    tutorialId: input.tutorialId || null,
    platform: input.platform,
    contentType: input.contentType || "static-post",
    format: input.format || "text",
    aspectRatio: input.aspectRatio || "1:1",
    language: input.language || "ar",
    locale: input.locale || "ar-SA",
    title: input.title || "UAOS Academy lesson",
    hook: input.hook || "Learn one useful UAOS workflow.",
    body: input.body || "",
    callToAction: input.callToAction || "Try it locally in UAOS.",
    description: input.description || "",
    hashtags: input.hashtags || ["#UAOS", "#MusicProduction", "#ArrangerKeyboard"],
    keywords: input.keywords || ["UAOS", "music workstation", "arranger"],
    chapters: input.chapters || [],
    captions: input.captions || [],
    thumbnail: input.thumbnail || null,
    cover: input.cover || null,
    mediaAssets: input.mediaAssets || [],
    sourceVersion: input.sourceVersion || "1.0.0-beta.10",
    targetProduct: input.targetProduct || "UAOS",
    targetPlan: input.targetPlan || "free",
    audience: input.audience || "all",
    difficulty: input.difficulty || "beginner",
    publicationStatus: input.publicationStatus || "draft",
    approvalStatus: input.approvalStatus || "not-approved",
    privacyStatus: input.privacyStatus || "private-draft",
    platformPostId: input.platformPostId || null,
    platformUrl: input.platformUrl || null,
    scheduledTime: input.scheduledTime || null,
    timezone: input.timezone || "UTC",
    duplicateStatus: input.duplicateStatus || "unique",
    error: input.error || null,
    retry: input.retry || { count: 0, nextAttempt: null },
    dryRun: input.dryRun ?? true
  };
  return { ...content, contentHash: input.contentHash || stableHash(content) };
}

export function validateSocialContent(content) {
  const errors = [];
  for (const field of ["contentId", "featureId", "platform", "contentType", "language", "title", "hook", "body", "publicationStatus", "approvalStatus", "privacyStatus", "schemaVersion"]) {
    if (content?.[field] === undefined || content?.[field] === null || content?.[field] === "") errors.push(`${field} required`);
  }
  if (!PLATFORM_ADAPTERS.some((platform) => platform.id === content?.platform)) errors.push("unknown platform adapter");
  if (content?.publicationStatus === "published" && content?.approvalStatus !== "approved") errors.push("published content requires approval");
  if (content?.privacyStatus !== "public" && content?.platformPostId) errors.push("private drafts must not have platform post IDs");
  if (content?.dryRun === false && content?.approvalStatus !== "approved") errors.push("live publishing requires approval");
  return { valid: errors.length === 0, errors };
}

export function migrateSocialContent(content) {
  if (!content || typeof content !== "object") return createSocialContent({ featureId: "unknown", platform: "generic-social", body: "Migrated empty draft." });
  if (content.schemaVersion === SOCIAL_AGENT_SCHEMA_VERSION) return content;
  return createSocialContent({
    ...content,
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    publicationStatus: content.publicationStatus || "draft",
    approvalStatus: content.approvalStatus || "not-approved",
    privacyStatus: content.privacyStatus || "private-draft",
    dryRun: true
  });
}

export function transformTutorialToPlatformContent(tutorial, platforms = PLATFORM_ADAPTERS) {
  return platforms.map((platform) => {
    const script = createTutorialScript(tutorial, platform.id);
    const contentType = platform.family === "video" ? "youtube-tutorial"
      : platform.family === "short-video" ? "short-tutorial-60s"
        : platform.formats.includes("carousel") ? "carousel"
          : platform.family === "messaging" ? "channel-post"
            : platform.formats.includes("thread") ? "social-thread" : "static-post";
    const format = platform.formats[0];
    const aspectRatio = platform.aspectRatios[0];
    const body = clipText([
      script.platformOpening,
      `Objective: ${script.lessonObjective}`,
      `Steps: ${script.steps.slice(0, platform.family === "short-video" ? 2 : 5).join(" > ")}`,
      `Warning: ${script.warnings[0]}`,
      script.platformEnding
    ].join("\n"), platform.maxCaptionChars);
    return createSocialContent({
      featureId: tutorial.featureId,
      tutorialId: tutorial.tutorialId,
      platform: platform.id,
      contentType,
      format,
      aspectRatio,
      language: tutorial.language,
      locale: tutorial.locale,
      title: clipText(`${tutorial.topic} on ${platform.name}`, 80),
      hook: script.hook,
      body,
      callToAction: script.callToAction,
      description: script.summary,
      chapters: platform.family === "video" ? script.steps.map((step, index) => ({ time: `${index * 2}:00`, title: step })) : [],
      captions: platform.family === "short-video" ? script.narration.map((line) => ({ text: line, safeZone: "center-80" })) : [],
      targetProduct: "UAOS",
      targetPlan: "free",
      audience: tutorial.audience,
      difficulty: tutorial.difficulty,
      mediaAssets: [],
      dryRun: true
    });
  });
}

export function createShortFormPlan(tutorial, seconds = 60) {
  if (![15, 30, 60, 90].includes(seconds)) throw new RangeError("short-form duration must be 15, 30, 60, or 90 seconds");
  return {
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    tutorialId: tutorial.tutorialId,
    durationSeconds: seconds,
    layout: "9:16",
    safeTextZones: ["top-15", "center-70", "bottom-15"],
    hookDeadlineSeconds: 2,
    captions: "large",
    edits: ["fast-cuts", "cursor-zoom", "success-result", "loop-friendly-ending"],
    misleadingBeforeAfter: false,
    callToAction: "Open UAOS locally and try this workflow."
  };
}

export function createCarouselPlan(tutorial, platformId = "instagram-feed") {
  return {
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    tutorialId: tutorial.tutorialId,
    platform: platformId,
    format: platformId === "linkedin" ? "linkedin-pdf-foundation" : platformId === "pinterest" ? "pinterest-vertical-foundation" : "carousel",
    aspectRatio: platformId === "instagram-feed" ? "4:5" : "1:1",
    safeMargins: "96px",
    slides: [
      { number: 1, type: "cover", title: tutorial.topic, altText: `Cover slide for ${tutorial.topic}` },
      { number: 2, type: "problem", title: "Before you start", altText: "Problem statement and prerequisites" },
      { number: 3, type: "steps", title: "Open the right UAOS route", altText: "Step showing local route" },
      { number: 4, type: "warnings", title: "Check status labels", altText: "Warning slide about release status" },
      { number: 5, type: "success", title: "Save locally", altText: "Success confirmation slide" },
      { number: 6, type: "cta", title: "Continue in Support", altText: "Call to action slide" }
    ],
    language: tutorial.language
  };
}

export function createStoryPlan(tutorial, platformId = "instagram-reels") {
  return {
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    tutorialId: tutorial.tutorialId,
    platform: platformId,
    aspectRatio: "9:16",
    cards: ["vertical-tutorial-card", "new-video-announcement", "feature-launch", "tip-of-the-day", "troubleshooting"],
    pollFoundation: { enabled: true, realPublish: false, requiresApiSupport: true },
    questionBoxFoundation: { enabled: true, realPublish: false, requiresApiSupport: true },
    publicPollPublished: false
  };
}

export function createCapturePlan(tutorial) {
  return {
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    tutorialId: tutorial.tutorialId,
    engines: ["playwright-foundation", "electron-capture-foundation"],
    route: tutorial.route,
    deterministicDemoState: true,
    dataSources: ["mock-account", "mock-midi", "mock-hardware", "synthetic-audio"],
    realUserDataAllowed: false,
    overlays: ["cursor-indicator", "click-indicator", "key-indicator", "highlight", "zoom"],
    waits: "stable-wait",
    outputs: ["screenshots", "video", "failure-capture", "console-errors"],
    retry: { enabled: true, maxAttempts: 2 },
    cancel: true
  };
}

export function createRenderPlan(tutorial) {
  return {
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    tutorialId: tutorial.tutorialId,
    renderer: "ffmpeg-only",
    dimensions: {
      landscape: { width: 1920, height: 1080, aspectRatio: "16:9", platforms: ["youtube", "facebook-pages", "linkedin"] },
      vertical: { width: 1080, height: 1920, aspectRatio: "9:16", platforms: ["tiktok", "instagram-reels", "youtube-shorts", "stories", "whatsapp-status"] },
      square: { width: 1080, height: 1080, aspectRatio: "1:1", platforms: ["posts", "covers", "carousels"] },
      portraitFeed: { width: 1080, height: 1350, aspectRatio: "4:5", platforms: ["instagram-feed"] }
    },
    brand: ["official-logo", "OLED black", "electric blue", "cyan", "violet", "Blue LED"],
    overlays: ["title-cards", "captions", "chapters", "intro", "outro"],
    audio: { normalizationMetadata: true, clippingCheck: true },
    temporaryFiles: { cleanup: true },
    renderManifest: true,
    checksum: stableHash({ tutorialId: tutorial.tutorialId, renderer: "ffmpeg-only" })
  };
}

export function createPlatformAdapter(platformId, options = {}) {
  const platform = PLATFORM_ADAPTERS.find((item) => item.id === platformId);
  if (!platform) throw new RangeError(`Unknown platform adapter: ${platformId}`);
  const mode = options.mode || "dry-run";
  return {
    id: platform.id,
    platform,
    mode,
    async prepare(content) {
      const migrated = migrateSocialContent(content);
      return { platform: platform.id, mode, content: migrated, validation: validateSocialContent(migrated) };
    },
    async publish(content, approval = DEFAULT_APPROVAL) {
      const prepared = await this.prepare(content);
      const hasCredentials = Boolean(options.oauthToken || options.apiKey || options.webhookUrl);
      const approved = approval.status === "approved" && approval.explicit === true;
      const canPublish = mode === "live" && hasCredentials && approved && prepared.validation.valid;
      return {
        platform: platform.id,
        attempted: true,
        published: false,
        dryRun: !canPublish,
        reason: canPublish ? "live-publish-disabled-in-foundation" : "dry-run-or-missing-oauth-api-or-approval",
        requiresOAuth: platform.oauthRequired,
        requiresApi: platform.apiRequired,
        explicitApprovalRequired: true,
        networkRequestSent: false,
        contentId: prepared.content.contentId
      };
    },
    async analytics(content) {
      return { platform: platform.id, contentId: content.contentId, analyticsStatus: "mock-unavailable", networkRequestSent: false };
    }
  };
}

export function createSchedule(contents, options = {}) {
  const startDate = options.startDate || "2026-06-14T09:00:00.000Z";
  const intervalHours = options.intervalHours || 6;
  const base = new Date(startDate).getTime();
  return contents.map((content, index) => ({
    contentId: content.contentId,
    platform: content.platform,
    scheduledTime: new Date(base + index * intervalHours * 60 * 60 * 1000).toISOString(),
    timezone: options.timezone || "Europe/Berlin",
    publicationStatus: "scheduled-draft",
    approvalStatus: "not-approved",
    dryRun: true
  }));
}

export function createAgentReport() {
  const features = discoverFeatureInventory();
  const curriculum = createCurriculum(features);
  const sampleTutorial = curriculum[0].topics[0];
  const transformed = transformTutorialToPlatformContent(sampleTutorial);
  const adapters = PLATFORM_ADAPTERS.map((platform) => createPlatformAdapter(platform.id));
  return {
    schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
    codeName: SOCIAL_AGENT_CODE_NAME,
    marketingName: SOCIAL_AGENT_MARKETING_NAME,
    mode: "dry-run",
    publicPublishingEnabled: false,
    platformAdapters: PLATFORM_ADAPTERS.length,
    adaptersIndependent: true,
    featureCount: features.length,
    curriculumSections: curriculum.length,
    mandatoryTutorialCount: curriculum.reduce((total, section) => total + section.topics.length, 0),
    supportedLanguages: [...DEFAULT_LANGUAGES],
    contentTypes: [...CONTENT_TYPES],
    sampleContentCount: transformed.length,
    validation: transformed.every((content) => validateSocialContent(content).valid),
    capturePlan: createCapturePlan(sampleTutorial),
    renderPlan: createRenderPlan(sampleTutorial),
    schedulePreview: createSchedule(transformed.slice(0, 5)),
    adapterStatuses: adapters.map((adapter) => ({ id: adapter.id, mode: adapter.mode, networkRequestSent: false })),
    blockers: ["OAuth/API credentials missing", "Explicit approval missing", "Manual review required before public posting"],
    generatedAt: new Date().toISOString()
  };
}

export class UAOSSocialMediaEducationAgent {
  constructor(options = {}) {
    this.mode = options.mode || "dry-run";
    this.features = options.features || discoverFeatureInventory();
    this.curriculum = options.curriculum || createCurriculum(this.features);
    this.adapters = new Map(PLATFORM_ADAPTERS.map((platform) => [platform.id, createPlatformAdapter(platform.id, { mode: this.mode })]));
  }

  createCampaign(language = "ar") {
    const tutorials = this.curriculum.flatMap((section) => section.topics.map((topic) => ({ ...topic, language })));
    const contents = tutorials.flatMap((tutorial) => transformTutorialToPlatformContent(tutorial));
    return {
      schemaVersion: SOCIAL_AGENT_SCHEMA_VERSION,
      campaignId: `uaos-academy-${language}`,
      mode: this.mode,
      language,
      tutorials,
      contents,
      schedule: createSchedule(contents),
      publicPublishingEnabled: false
    };
  }

  async dryRunPublish(content) {
    const adapter = this.adapters.get(content.platform);
    if (!adapter) throw new RangeError(`No adapter for ${content.platform}`);
    return adapter.publish(content, { status: "not-approved", explicit: false });
  }
}
