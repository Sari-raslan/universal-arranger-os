import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createAcademyManagerSummary,
  createBatch001,
  createDemoEnvironment,
  createOAuthReadiness,
  evaluatePublicationGate,
  validateBatch001
} from "../uaos-live-clean/src/social/academyBatch001.js";

const root = process.cwd();

test("Batch 001 schema contains exactly ten real lessons", () => {
  const batch = createBatch001();
  assert.equal(batch.batchId, "BATCH-001");
  assert.equal(batch.lessons.length, 10);
  assert.equal(validateBatch001(batch).valid, true);
  assert.deepEqual(batch.lessons.map((lesson) => lesson.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(batch.lessons.every((lesson) => lesson.outputsRequired.length === 21));
});

test("Batch 001 routes map to current app routes and tutorial fallbacks", () => {
  const batch = createBatch001();
  const app = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "App.jsx"), "utf8");
  for (const lesson of batch.lessons) {
    const id = lesson.route === "#/" ? "home" : lesson.route.replace("#/", "");
    const present = id === "home" ? app.includes('id: "home"') : app.includes(`page === "${id}"`) || app.includes(`id: "${id}"`);
    assert.equal(present, true, lesson.route);
    assert.equal(lesson.websiteFallback.opensFakePlatformUrl, false);
    assert.equal(lesson.supportCenter.tutorialStatus, "Tutorial prepared - publication pending");
  }
  assert.ok(app.includes('id: "academy"'));
  assert.ok(app.includes("TutorialHelpButton"));
});

test("demo reset contract is synthetic only and contains no personal data", () => {
  const demo = createDemoEnvironment();
  assert.equal(demo.syntheticAccount.realEmail, false);
  assert.equal(demo.noPersonalData, true);
  assert.equal(demo.noNetworkRequirement, true);
  assert.equal(demo.stripe, "disabled");
  assert.equal(demo.cloud, "disabled");
  assert.equal(demo.syntheticAudio.copyrightedSong, false);
  assert.equal(demo.syntheticWav.commercialSample, false);
});

test("scripts, storyboards and captions are UTF-8 safe and multilingual", () => {
  const batch = createBatch001();
  for (const lesson of batch.lessons) {
    assert.ok(lesson.scripts.ar.title);
    assert.equal(/[ØÃâ]/.test(lesson.scripts.ar.title), false);
    assert.ok(lesson.scripts.en.title);
    assert.ok(lesson.scripts.de.title);
    assert.ok(lesson.storyboard.frames.length >= 5);
    assert.ok(lesson.captions.ar.srt.includes("-->"));
    assert.ok(lesson.captions.ar.vtt.startsWith("WEBVTT"));
    assert.ok(lesson.captions.en.srt.includes("-->"));
    assert.ok(lesson.captions.en.vtt.startsWith("WEBVTT"));
    assert.equal(lesson.captions.lineLengthCheck, "PASS");
    assert.equal(lesson.captions.readingSpeedCheck, "PASS");
    assert.equal(lesson.captions.overlapPrevention, "PASS");
  }
});

test("capture and render contracts are safe and support FFmpeg unavailable state", () => {
  const unavailable = createBatch001({ ffmpegAvailable: false });
  assert.equal(unavailable.statuses.render, "FFMPEG_REQUIRED");
  assert.equal(unavailable.counts.blockedByRenderer, 10);
  for (const lesson of unavailable.lessons) {
    assert.equal(lesson.capture.desktopCapture, false);
    assert.equal(lesson.capture.realUserDataAllowed, false);
    assert.equal(lesson.render.renderer, "ffmpeg-only");
    assert.equal(lesson.render.status, "FFMPEG_REQUIRED");
    assert.equal(lesson.render.autoplayAudio, false);
    assert.equal(lesson.render.blackFrames, false);
  }
  const rendered = createBatch001({ ffmpegAvailable: true });
  assert.equal(rendered.statuses.render, "RENDERED");
  assert.equal(rendered.counts.blockedByRenderer, 0);
});

test("thumbnails and platform packages exist for each requested platform", () => {
  const batch = createBatch001();
  for (const lesson of batch.lessons) {
    assert.equal(lesson.thumbnails.length, 4);
    assert.ok(lesson.thumbnails.some((item) => item.size === "1280x720"));
    assert.ok(lesson.thumbnails.some((item) => item.size === "1080x1920"));
    assert.ok(lesson.thumbnails.every((item) => item.svg.includes("UAOS Academy")));
    for (const platform of ["youtube", "tiktok", "instagram", "facebook", "x", "linkedin", "threads", "whatsapp", "telegram", "discord"]) {
      assert.equal(lesson.platformPackages[platform].dryRun, true, platform);
      assert.equal(lesson.platformPackages[platform].noExternalPublishing, true, platform);
      assert.equal(lesson.platformPackages[platform].noFakePlatformIds, true, platform);
    }
    assert.equal(lesson.platformPackages.youtube.privacy, "private");
    assert.equal(lesson.platformPackages.youtube.platformPostId, null);
  }
});

test("publication gate blocks without OAuth and never reports fake published IDs", () => {
  const batch = createBatch001();
  assert.ok(batch.lessons.every((lesson) => lesson.publicationGate.status === "BLOCKED_OAUTH"));
  assert.ok(batch.lessons.every((lesson) => lesson.publicationGate.platformPostId === null));
  assert.equal(batch.safety.publicPublishingEnabled, false);
  assert.equal(batch.safety.networkCallsAllowed, false);
  assert.equal(batch.safety.oauthAllowed, false);
  const ready = evaluatePublicationGate({
    platformConfigured: true,
    oauthValid: true,
    accountVerified: true,
    contentRendered: true,
    captionsValid: true,
    thumbnailValid: true,
    noPersonalData: true,
    noSecrets: true,
    copyrightCheckPassed: true,
    featureExists: true,
    routeWorks: true,
    manualReviewPassed: true,
    ownerApproval: true,
    publishModeExplicitlySelected: true,
    confirmationPhrase: "I APPROVE UAOS PUBLICATION",
    noDuplicateContentHash: true
  });
  assert.equal(ready.status, "READY_PUBLICATION_APPROVAL");
});

test("schedule uses Europe/Berlin and three lessons weekly cadence", () => {
  const batch = createBatch001();
  assert.ok(batch.schedule.every((item) => item.timezone === "Europe/Berlin"));
  const longVideos = batch.schedule.filter((item) => item.type === "long-video");
  assert.equal(longVideos.length, 10);
  const firstWeek = longVideos.slice(0, 3).map((item) => item.lessonId);
  const secondWeek = longVideos.slice(3, 6).map((item) => item.lessonId);
  assert.deepEqual(firstWeek, ["lesson-001", "lesson-002", "lesson-003"]);
  assert.deepEqual(secondWeek, ["lesson-004", "lesson-005", "lesson-006"]);
});

test("OAuth readiness remains unconfigured and publish disabled", () => {
  const oauth = createOAuthReadiness();
  assert.equal(oauth.length, 7);
  assert.ok(oauth.every((item) => item.configured === false));
  assert.ok(oauth.every((item) => item.publishDisabled === true));
  assert.ok(oauth.every((item) => item.networkRequestSent === false));
});

test("Academy Manager summary exposes review controls and local paths", () => {
  const summary = createAcademyManagerSummary(createBatch001());
  assert.equal(summary.batchId, "BATCH-001");
  assert.equal(summary.lessons.length, 10);
  assert.equal(summary.publicPublishDisabled, true);
  assert.ok(summary.lessons.every((lesson) => lesson.localFilePaths.scripts.includes("social-output/batch-001")));
  assert.ok(summary.lessons.every((lesson) => lesson.missingRequirements.includes("OAuth/API credentials")));
});

test("generated reports exist after CLI run when available", () => {
  const report = path.join(root, "reports", "UAOS_SOCIAL_BATCH_001_REPORT.json");
  if (fs.existsSync(report)) {
    const parsed = JSON.parse(fs.readFileSync(report, "utf8"));
    assert.equal(parsed.batchId, "BATCH-001");
    assert.equal(parsed.counts.readyForReview, 10);
  }
});
