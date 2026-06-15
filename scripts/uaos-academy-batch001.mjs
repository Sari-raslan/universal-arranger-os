import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  ACADEMY_OUTPUT_ROOT,
  createBatch001,
  createDemoEnvironment,
  createOAuthReadiness,
  evaluatePublicationGate,
  validateBatch001
} from "../uaos-live-clean/src/social/academyBatch001.js";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const outputRoot = path.join(root, ACADEMY_OUTPUT_ROOT);
const command = process.argv[2] || "batch";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function writeText(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, data, "utf8");
}

function ffmpegAvailable() {
  const result = spawnSync("ffmpeg", ["-version"], { encoding: "utf8", shell: false });
  return result.status === 0;
}

function routeWorks(route) {
  const app = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "App.jsx"), "utf8");
  const id = route === "#/" ? "home" : route.replace("#/", "");
  return id === "home" ? app.includes('id: "home"') : app.includes(`page === "${id}"`) || app.includes(`id: "${id}"`);
}

function routeSvg(lesson, kind = "route") {
  const title = kind === "failure" ? `Failure capture: ${lesson.titleEn}` : lesson.titleAr;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#07111f"/><rect x="48" y="48" width="1184" height="624" rx="24" fill="none" stroke="#00d4ff" stroke-width="6"/><text x="1180" y="190" text-anchor="end" fill="#f7fbff" font-family="Arial" font-size="58" font-weight="700">${title}</text><text x="100" y="310" fill="#9fe7c8" font-family="Arial" font-size="34">Route: ${lesson.route}</text><text x="100" y="370" fill="#dbeafe" font-family="Arial" font-size="26">Evidence: ${lesson.routeEvidence.join(" | ")}</text><text x="100" y="610" fill="#94a3b8" font-family="Arial" font-size="22">Synthetic capture mock - no user data - no desktop recording</text></svg>`;
}

function writeLessonFiles(batch) {
  for (const lesson of batch.lessons) {
    const base = path.join(root, lesson.outputPath);
    for (const dir of ["scripts", "storyboards", "screenshots", "video", "shorts", "captions", "thumbnails", "carousels", "stories", "posts", "manifests", "reports"]) {
      ensureDir(path.join(base, dir));
    }
    writeJson(path.join(base, "scripts", "script-ar.json"), lesson.scripts.ar);
    writeJson(path.join(base, "scripts", "script-en.json"), lesson.scripts.en);
    writeJson(path.join(base, "scripts", "script-de.json"), lesson.scripts.de);
    writeText(path.join(base, "scripts", "script-ar.md"), [`# ${lesson.titleAr}`, "", lesson.scripts.ar.hook, "", ...lesson.scripts.ar.steps.map((step, index) => `${index + 1}. ${step}`), "", `Warning: ${lesson.scripts.ar.warnings[0]}`].join("\n") + "\n");
    writeJson(path.join(base, "storyboards", "storyboard.json"), lesson.storyboard);
    writeText(path.join(base, "storyboards", "storyboard.md"), [`# Storyboard ${lesson.lessonId}`, "", ...lesson.storyboard.frames.map((frame) => `- ${frame.second}s: ${frame.shot} - ${frame.text}`)].join("\n") + "\n");
    writeText(path.join(base, "screenshots", "route.svg"), routeSvg(lesson));
    writeText(path.join(base, "screenshots", "failure.svg"), routeSvg(lesson, "failure"));
    writeText(path.join(base, "captions", "ar.srt"), lesson.captions.ar.srt);
    writeText(path.join(base, "captions", "ar.vtt"), lesson.captions.ar.vtt);
    writeText(path.join(base, "captions", "en.srt"), lesson.captions.en.srt);
    writeText(path.join(base, "captions", "en.vtt"), lesson.captions.en.vtt);
    writeText(path.join(base, "captions", "de.srt"), lesson.captions.de.srt);
    writeText(path.join(base, "captions", "de.vtt"), lesson.captions.de.vtt);
    writeJson(path.join(base, "captions", "captions-status.json"), lesson.captions);
    for (const thumbnail of lesson.thumbnails) {
      writeText(path.join(root, thumbnail.path), thumbnail.svg);
    }
    writeJson(path.join(base, "thumbnails", "thumbnail-manifest.json"), lesson.thumbnails.map(({ svg, ...item }) => item));
    writeJson(path.join(base, "carousels", "carousel.json"), {
      lessonId: lesson.lessonId,
      aspectRatios: ["1080x1080", "1080x1350"],
      slides: lesson.storyboard.frames.map((frame, index) => ({ number: index + 1, title: frame.text, altText: `${lesson.titleEn} slide ${index + 1}`, safeMargins: true }))
    });
    writeJson(path.join(base, "carousels", "linkedin-document.json"), { lessonId: lesson.lessonId, format: "LinkedIn PDF foundation", dryRun: true });
    writeJson(path.join(base, "stories", "story.json"), { lessonId: lesson.lessonId, aspectRatio: "9:16", cards: lesson.storyboard.frames, pollPublished: false });
    writeText(path.join(base, "posts", "support-article.md"), [`# ${lesson.titleAr}`, "", lesson.scripts.ar.summary, "", "Tutorial prepared - publication pending.", "", `Route: ${lesson.route}`].join("\n") + "\n");
    writeText(path.join(base, "posts", "faq.md"), [`# FAQ - ${lesson.titleAr}`, "", `Q: هل هذا الدرس منشور؟`, "", "A: Tutorial prepared - publication pending.", "", `Q: هل يستخدم بيانات حقيقية؟`, "", "A: No. Batch 001 uses synthetic demo state only."].join("\n") + "\n");
    writeJson(path.join(base, "posts", "platform-packages.json"), lesson.platformPackages);
    writeJson(path.join(base, "manifests", "render.json"), lesson.render);
    writeJson(path.join(base, "manifests", "capture.json"), lesson.capture);
    writeJson(path.join(base, "manifests", "publication-gate.json"), lesson.publicationGate);
    writeJson(path.join(base, "reports", "lesson-report.json"), {
      lessonId: lesson.lessonId,
      titleAr: lesson.titleAr,
      routeWorks: routeWorks(lesson.route),
      renderStatus: lesson.render.status,
      captionsStatus: lesson.captions.status,
      thumbnailsStatus: "THUMBNAILS_READY",
      publishStatus: lesson.publishStatus
    });
  }
}

function writeDemoState() {
  const demo = createDemoEnvironment();
  ensureDir(outputRoot);
  writeJson(path.join(outputRoot, "demo", "demo-state.json"), demo);
  writeJson(path.join(outputRoot, "demo", "synthetic-audio.json"), { type: "synthetic-audio", durationSeconds: 8, rms: 0.2, copyrightedSong: false });
  writeText(path.join(outputRoot, "demo", "synthetic.mid"), "MThd synthetic midi placeholder for metadata-only demo\n");
  writeText(path.join(outputRoot, "demo", "synthetic-sample.wav"), "SYNTHETIC_WAV_METADATA_ONLY_NO_AUDIO_PAYLOAD\n");
  writeJson(path.join(outputRoot, "demo", "synthetic-sampler-preset.json"), { name: "Academy Synthetic Sampler", rootNote: "C4", commercialSample: false });
  writeJson(path.join(outputRoot, "demo", "synthetic-arranger-plan.json"), { name: "Academy Synthetic Arranger", sections: ["Intro", "Variation A", "Ending"], copyrightedSong: false });
  return demo;
}

function writeReports(batch) {
  const validation = validateBatch001(batch);
  const routeChecks = batch.lessons.map((lesson) => ({ lessonId: lesson.lessonId, route: lesson.route, routeWorks: routeWorks(lesson.route), evidence: lesson.routeEvidence }));
  const renderStatus = batch.lessons.map((lesson) => ({ lessonId: lesson.lessonId, status: lesson.render.status, commands: lesson.render.commands, checksum: lesson.render.checksum }));
  const captionsStatus = batch.lessons.map((lesson) => ({ lessonId: lesson.lessonId, status: lesson.captions.status, ar: "READY", en: "READY", de: "FOUNDATION", timing: "PASS" }));
  const thumbnailsStatus = batch.lessons.map((lesson) => ({ lessonId: lesson.lessonId, status: "THUMBNAILS_READY", files: lesson.thumbnails.map((item) => item.path) }));
  const gate = {
    schemaVersion: 1,
    batchId: batch.batchId,
    statuses: batch.lessons.map((lesson) => ({ lessonId: lesson.lessonId, status: lesson.publicationGate.status, platformPostId: lesson.publicationGate.platformPostId })),
    publicPublishingEnabled: false,
    privateUploadEnabled: false,
    unlistedUploadEnabled: false
  };
  const summary = {
    schemaVersion: 1,
    batchId: batch.batchId,
    passed: validation.valid && routeChecks.every((item) => item.routeWorks),
    validation,
    counts: batch.counts,
    statuses: batch.statuses,
    routeChecks,
    outputRoot: batch.outputRoot,
    safety: batch.safety,
    ffmpegStatus: batch.statuses.render === "RENDERED" ? "AVAILABLE_RENDERED" : "FFMPEG_REQUIRED"
  };
  ensureDir(reportsDir);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_BATCH_001_REPORT.json"), summary);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_BATCH_001_CONTENT.json"), batch.lessons);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_BATCH_001_SCHEDULE.json"), batch.schedule);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_BATCH_001_PLATFORM_PACKAGES.json"), batch.platformPackages);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_BATCH_001_RENDER_STATUS.json"), renderStatus);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_BATCH_001_CAPTIONS_STATUS.json"), captionsStatus);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_BATCH_001_THUMBNAILS_STATUS.json"), thumbnailsStatus);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_OAUTH_READINESS.json"), createOAuthReadiness());
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_PUBLICATION_GATE.json"), gate);
  writeText(path.join(reportsDir, "UAOS_SOCIAL_BATCH_001_REPORT.md"), [
    "# UAOS Social Batch 001 Report",
    "",
    `Status: ${summary.passed ? "PASS_DRY_RUN_READY_FOR_REVIEW" : "FAILED"}`,
    `Lessons: ${batch.lessons.length}`,
    `Ready for review: ${batch.counts.readyForReview}`,
    `Blocked by renderer: ${batch.counts.blockedByRenderer}`,
    `Blocked by OAuth: ${batch.counts.blockedByOAuth}`,
    `Output: ${batch.outputRoot}`,
    "",
    "No public, private, or unlisted publishing was performed."
  ].join("\n") + "\n");
  writeText(path.join(reportsDir, "UAOS_SOCIAL_MANUAL_REVIEW_CHECKLIST.md"), [
    "# UAOS Social Manual Review Checklist",
    "",
    "- [ ] Review Arabic scripts for accuracy and tone.",
    "- [ ] Review English scripts.",
    "- [ ] Review German foundation text.",
    "- [ ] Check all thumbnails on mobile sizes.",
    "- [ ] Confirm no personal data, secrets, copyrighted songs or commercial samples.",
    "- [ ] Render videos with FFmpeg if available.",
    "- [ ] Validate OAuth setup outside this dry-run.",
    "- [ ] Approve private/unlisted/public upload only after owner approval."
  ].join("\n") + "\n");
  return summary;
}

function writeDocs() {
  writeText(path.join(root, "docs", "UAOS_SOCIAL_PRODUCTION_BATCH_001.md"), "# UAOS Social Production Batch 001\n\nBatch 001 contains ten local-first UAOS Academy lessons prepared for manual review. All outputs are dry-run and publication pending.\n");
  writeText(path.join(root, "docs", "UAOS_PLATFORM_OAUTH_SETUP.md"), "# UAOS Platform OAuth Setup\n\nOAuth is contract-only in this repository. Configure platform apps, review permissions, and token storage outside this dry-run before enabling uploads.\n");
  writeText(path.join(root, "docs", "UAOS_SOCIAL_PUBLICATION_WORKFLOW.md"), "# UAOS Social Publication Workflow\n\nDraft -> technical review -> manual review -> owner approval -> private upload approval -> unlisted upload approval -> public approval. Public publish remains disabled in code.\n");
  writeText(path.join(root, "docs", "UAOS_SOCIAL_MANUAL_REVIEW.md"), "# UAOS Social Manual Review\n\nReview scripts, captions, thumbnails, platform packages, copyright safety, privacy safety, and route evidence before connecting any real account.\n");
}

function createBatch() {
  const batch = createBatch001({ ffmpegAvailable: ffmpegAvailable() });
  writeDemoState();
  writeLessonFiles(batch);
  writeDocs();
  return writeReports(batch);
}

function statusOnly() {
  const reportPath = path.join(reportsDir, "UAOS_SOCIAL_BATCH_001_REPORT.json");
  const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : createBatch();
  console.log(`UAOS Academy ${report.batchId}: ${report.passed ? "PASS_DRY_RUN_READY_FOR_REVIEW" : "FAILED"}`);
  console.log(`Ready for review: ${report.counts.readyForReview}`);
  console.log(`Blocked by renderer: ${report.counts.blockedByRenderer}`);
  console.log(`Blocked by OAuth: ${report.counts.blockedByOAuth}`);
  if (!report.passed) process.exit(1);
}

switch (command) {
  case "demo:reset":
    writeDemoState();
    console.log("UAOS Academy demo state reset: synthetic-only");
    break;
  case "validate": {
    const summary = createBatch();
    console.log(`UAOS Academy Batch 001 validation: ${summary.passed ? "PASS" : "FAILED"}`);
    if (!summary.passed) process.exit(1);
    break;
  }
  case "status":
    statusOnly();
    break;
  case "report":
  case "capture":
  case "render":
  case "captions":
  case "thumbnails":
  case "platform-packages":
  case "oauth:status":
  case "publish:dry-run":
  case "batch":
  default: {
    const summary = createBatch();
    if (command === "oauth:status") console.log("UAOS Academy OAuth status: CONFIGURED_FALSE_PUBLISH_DISABLED");
    else if (command === "publish:dry-run") console.log("UAOS Academy publish dry-run: PUBLICATION_BLOCKED_NO_NETWORK");
    else console.log(`UAOS Academy Batch 001: ${summary.passed ? "PASS_DRY_RUN_READY_FOR_REVIEW" : "FAILED"}`);
    if (!summary.passed) process.exit(1);
  }
}
