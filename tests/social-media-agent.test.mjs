import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTENT_TYPES,
  PLATFORM_ADAPTERS,
  SOCIAL_AGENT_CODE_NAME,
  SOCIAL_AGENT_MARKETING_NAME,
  UAOSSocialMediaEducationAgent,
  createCapturePlan,
  createCarouselPlan,
  createRenderPlan,
  createShortFormPlan,
  createSocialContent,
  createStoryPlan,
  createTutorialScript,
  discoverFeatureInventory,
  migrateSocialContent,
  transformTutorialToPlatformContent,
  validateSocialContent
} from "../uaos-live-clean/src/social/uaosSocialMediaEducationAgent.js";

test("social agent exposes independent adapters for every requested platform family", () => {
  assert.equal(SOCIAL_AGENT_CODE_NAME, "UAOSSocialMediaEducationAgent");
  assert.equal(SOCIAL_AGENT_MARKETING_NAME, "UAOS Academy & Social Hub");
  assert.ok(PLATFORM_ADAPTERS.length >= 23);
  for (const id of ["youtube", "youtube-shorts", "tiktok", "instagram-reels", "facebook-reels", "x-twitter", "linkedin", "threads", "whatsapp-channel", "telegram-channel", "discord-announcement", "reddit-post", "webhook", "rss-feed", "blog-cms", "website-news"]) {
    assert.ok(PLATFORM_ADAPTERS.some((platform) => platform.id === id), id);
  }
  assert.ok(CONTENT_TYPES.includes("email-newsletter-foundation"));
});

test("feature inventory covers actual UAOS routes and commercial/support areas", () => {
  const features = discoverFeatureInventory();
  assert.ok(features.length >= 20);
  for (const route of ["#/sing", "#/studio", "#/sampler", "#/pro", "#/midi", "#/hardware", "#/ai", "#/pricing", "#/downloads", "#/support", "#/demo"]) {
    assert.ok(features.some((feature) => feature.route === route), route);
  }
  assert.ok(features.every((feature) => feature.educationalContentRequired));
  assert.ok(features.every((feature) => Array.isArray(feature.platformCoverage) && feature.platformCoverage.length === PLATFORM_ADAPTERS.length));
});

test("content schema validates, migrates and refuses unsafe publication states", () => {
  const draft = createSocialContent({ featureId: "uaos-sing", platform: "youtube", contentType: "youtube-tutorial", body: "Draft tutorial body." });
  assert.equal(validateSocialContent(draft).valid, true);
  const migrated = migrateSocialContent({ featureId: "uaos-sing", platform: "youtube", body: "Old draft", title: "Old", hook: "Old" });
  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.dryRun, true);
  const unsafe = createSocialContent({
    featureId: "uaos-sing",
    platform: "youtube",
    body: "Live post",
    publicationStatus: "published",
    approvalStatus: "not-approved",
    privacyStatus: "public",
    dryRun: false
  });
  assert.equal(validateSocialContent(unsafe).valid, false);
});

test("tutorial transformer adapts one lesson into platform-specific drafts", () => {
  const agent = new UAOSSocialMediaEducationAgent();
  const campaign = agent.createCampaign("ar");
  assert.ok(campaign.tutorials.length >= 100);
  assert.equal(campaign.publicPublishingEnabled, false);
  const tutorial = campaign.tutorials[0];
  const script = createTutorialScript(tutorial, "youtube-shorts");
  assert.equal(script.rtl, true);
  assert.ok(script.steps.length >= 5);
  const contents = transformTutorialToPlatformContent(tutorial);
  assert.equal(contents.length, PLATFORM_ADAPTERS.length);
  assert.ok(contents.every((content) => content.dryRun === true));
  assert.ok(new Set(contents.map((content) => content.body)).size > 1);
});

test("short, carousel, story, capture and render foundations are safe", () => {
  const agent = new UAOSSocialMediaEducationAgent();
  const tutorial = agent.createCampaign("en").tutorials[0];
  assert.equal(createShortFormPlan(tutorial, 15).hookDeadlineSeconds, 2);
  assert.equal(createShortFormPlan(tutorial, 90).misleadingBeforeAfter, false);
  assert.throws(() => createShortFormPlan(tutorial, 45), /short-form duration/);
  assert.ok(createCarouselPlan(tutorial).slides.every((slide) => slide.altText));
  assert.equal(createStoryPlan(tutorial).publicPollPublished, false);
  assert.equal(createCapturePlan(tutorial).realUserDataAllowed, false);
  assert.equal(createRenderPlan(tutorial).renderer, "ffmpeg-only");
});

test("adapters never publish without live mode, credentials and explicit approval", async () => {
  const agent = new UAOSSocialMediaEducationAgent({ mode: "dry-run" });
  const content = agent.createCampaign("en").contents[0];
  const result = await agent.dryRunPublish(content);
  assert.equal(result.published, false);
  assert.equal(result.dryRun, true);
  assert.equal(result.networkRequestSent, false);
});
