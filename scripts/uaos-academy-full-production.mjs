import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  FULL_OUTPUT_ROOT,
  createAcademyFullSummary,
  createFullProduction,
  createManualHandoffReadiness,
  createNarrationHandoffPlan,
  createPublicationApprovalHandoffPlan,
  createReviewEvidenceGate,
  createReviewEvidenceImportManifest,
  createReviewEvidenceImportAudit,
  createReviewerEvidenceWorkingManifest,
  createRenderHandoffPlan,
  validateFullProduction
} from "../uaos-live-clean/src/social/academyFullProduction.js";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const outputRoot = path.join(root, FULL_OUTPUT_ROOT);
const command = process.argv[2] || "generate:all";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function writeText(file, text) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text, "utf8");
}

function ffmpegAvailable() {
  const result = spawnSync("ffmpeg", ["-version"], { encoding: "utf8", shell: false });
  return result.status === 0;
}

function writeTutorialSamples(data) {
  for (const tutorial of data.tutorials) {
    const base = path.join(root, tutorial.outputPath);
    for (const dir of ["scripts", "storyboards", "captures", "renders", "captions", "thumbnails", "carousels", "stories", "platform-packages", "reports"]) ensureDir(path.join(base, dir));
    writeJson(path.join(base, "scripts", "script-ar.json"), tutorial.scripts.ar);
    writeJson(path.join(base, "storyboards", "storyboard.json"), tutorial.storyboard);
    writeJson(path.join(base, "captions", "captions.json"), tutorial.captions);
    writeJson(path.join(base, "thumbnails", "manifest.json"), tutorial.thumbnails);
    writeJson(path.join(base, "carousels", "manifest.json"), tutorial.carousels);
    writeJson(path.join(base, "renders", "manifest.json"), tutorial.renderManifests);
    writeJson(path.join(base, "platform-packages", "packages.json"), tutorial.platformPackages);
  }
}

function writeGlobalOutput(data) {
  for (const dir of ["batches", "tutorials", "scripts", "storyboards", "captures", "renders", "captions", "thumbnails", "carousels", "stories", "platform-packages", "campaigns", "schedules", "queue", "analytics", "reports", "temp"]) ensureDir(path.join(outputRoot, dir));
  writeJson(path.join(outputRoot, "batches", "all-batches.json"), data.batches);
  writeJson(path.join(outputRoot, "tutorials", "all-tutorials.json"), data.tutorials.map(({ scripts, captions, platformPackages, ...rest }) => rest));
  writeJson(path.join(outputRoot, "campaigns", "campaigns.json"), data.campaigns);
  writeJson(path.join(outputRoot, "schedules", "publishing-schedule.json"), data.schedules);
  writeJson(path.join(outputRoot, "queue", "publication-queue.json"), data.publicationQueue);
  writeJson(path.join(outputRoot, "analytics", "local-analytics.json"), data.analytics);
}

function writeReviewerEvidenceWorkingFile(data) {
  const working = createReviewerEvidenceWorkingManifest(data);
  writeJson(path.join(root, working.workingFilePath), working);
  return working;
}

function readReviewerEvidenceWorkingFile(data) {
  const workingPath = path.join(root, data.outputRoot, "reviews", "reviewer-evidence-working.json");
  if (!fs.existsSync(workingPath)) return null;
  return JSON.parse(fs.readFileSync(workingPath, "utf8"));
}

function localArtifactExists(value) {
  const normalized = String(value || "").trim().replaceAll("\\", "/");
  if (!normalized || normalized.includes("../") || normalized === ".." || normalized.includes("/..")) return false;
  const absolute = path.resolve(root, normalized);
  return absolute.startsWith(root) && fs.existsSync(absolute);
}

function writeReports(data) {
  const validation = validateFullProduction(data);
  const summary = createAcademyFullSummary(data);
  const manualHandoff = createManualHandoffReadiness(data);
  const renderHandoff = createRenderHandoffPlan(data);
  const narrationHandoff = createNarrationHandoffPlan(data);
  const approvalHandoff = createPublicationApprovalHandoffPlan(data);
  const reviewEvidenceGate = createReviewEvidenceGate(data);
  const evidenceImportTemplate = createReviewEvidenceImportManifest(data);
  const evidenceImportAudit = createReviewEvidenceImportAudit(data, readReviewerEvidenceWorkingFile(data), { artifactExists: localArtifactExists });
  const languageCoverage = { ar: data.tutorials.length, en: data.tutorials.length, deFoundation: data.tutorials.length, status: "COMPLETE_FOR_LOCAL_REVIEW" };
  const platformCoverage = data.platformAdapters.map((adapter) => ({ platformId: adapter.platformId, packageCount: data.tutorials.length, dryRun: true, realPublishing: false }));
  const finalReport = {
    schemaVersion: 1,
    status: data.status,
    passed: validation.valid,
    validation,
    counts: data.counts,
    summary,
    blockers: {
      renderer: data.finalGate.rendererConfigurationRequired,
      narration: true,
      oauth: true,
      manualReview: true
    }
  };
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_FULL_PRODUCTION_REPORT.json"), finalReport);
  writeText(path.join(reportsDir, "UAOS_SOCIAL_FULL_PRODUCTION_REPORT.md"), [
    "# UAOS Social Full Production Report",
    "",
    `Status: ${data.status}`,
    `Tutorials: ${data.counts.tutorials}`,
    `Batches: ${data.counts.batches}`,
    `Ready for local review: ${data.counts.readyForLocalReview}`,
    `Ready for private upload: ${data.counts.readyForPrivateUpload}`,
    `Published: ${data.counts.published}`,
    "",
    "External publishing remains disabled."
  ].join("\n") + "\n");
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_ALL_TUTORIALS.json"), data.tutorials);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_ALL_BATCHES.json"), data.batches);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_FEATURE_COVERAGE.json"), data.coverage);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_MISSING_CONTENT.json"), data.missingContent);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_PLATFORM_COVERAGE.json"), platformCoverage);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_LANGUAGE_COVERAGE.json"), languageCoverage);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_RENDER_READINESS.json"), data.renderReadiness);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_RENDER_HANDOFF.json"), renderHandoff);
  writeText(path.join(reportsDir, "UAOS_SOCIAL_RENDER_HANDOFF.md"), [
    "# UAOS Social Render Handoff",
    "",
    `Status: ${renderHandoff.status}`,
    `Tutorials: ${renderHandoff.totals.tutorials}`,
    `Render manifests: ${renderHandoff.totals.renderManifests}`,
    `Blocked manifests: ${renderHandoff.totals.blockedManifests}`,
    `Rendered files: ${renderHandoff.totals.renderedFiles}`,
    "",
    "Prerequisites:",
    ...renderHandoff.prerequisites.map((item) => `- ${item}`),
    "",
    "Local validation commands:",
    ...Object.values(renderHandoff.localValidationCommands).map((item) => `- ${item}`),
    "",
    "Sample FFmpeg command:",
    renderHandoff.sampleFfmpegCommand ? `- ${renderHandoff.sampleFfmpegCommand}` : "- Not available",
    "",
    "Manual render steps:",
    ...renderHandoff.manualSteps.map((item) => `- ${item}`),
    "",
    "Publication allowed: false",
    "Real network actions performed: false"
  ].join("\n") + "\n");
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_NARRATION_READINESS.json"), data.narrationReadiness);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_NARRATION_HANDOFF.json"), narrationHandoff);
  writeText(path.join(reportsDir, "UAOS_SOCIAL_NARRATION_HANDOFF.md"), [
    "# UAOS Social Narration Handoff",
    "",
    `Status: ${narrationHandoff.status}`,
    `Tutorials: ${narrationHandoff.totals.tutorials}`,
    `Languages: ${narrationHandoff.totals.languages}`,
    `Expected audio assets: ${narrationHandoff.totals.expectedAudioAssets}`,
    `Approved audio assets: ${narrationHandoff.totals.approvedAudioAssets}`,
    "",
    "Per-language status:",
    ...narrationHandoff.perLanguage.map((item) => `- ${item.language}: ${item.status} (${item.scriptsReady} scripts ready)`),
    "",
    "Required checks:",
    ...narrationHandoff.requiredChecks.map((item) => `- ${item}`),
    "",
    "Safe local commands:",
    ...Object.values(narrationHandoff.safeLocalCommands).map((item) => `- ${item}`),
    "",
    "Publication allowed: false",
    "Real microphone capture performed: false",
    "Real network actions performed: false"
  ].join("\n") + "\n");
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_OAUTH_STATUS.json"), data.oauthStatus);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_PUBLICATION_QUEUE.json"), data.publicationQueue);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_PUBLICATION_APPROVAL_HANDOFF.json"), approvalHandoff);
  writeText(path.join(reportsDir, "UAOS_SOCIAL_PUBLICATION_APPROVAL_HANDOFF.md"), [
    "# UAOS Social Publication Approval Handoff",
    "",
    `Status: ${approvalHandoff.status}`,
    `Tutorials: ${approvalHandoff.totals.tutorials}`,
    `Queue items: ${approvalHandoff.totals.queueItems}`,
    `Draft items: ${approvalHandoff.totals.draftItems}`,
    `Owner-approved items: ${approvalHandoff.totals.ownerApprovedItems}`,
    `Private-ready items: ${approvalHandoff.totals.privateReadyItems}`,
    `Public-ready items: ${approvalHandoff.totals.publicReadyItems}`,
    "",
    "Required evidence:",
    ...approvalHandoff.requiredEvidence.map((item) => `- ${item}`),
    "",
    "Blockers:",
    ...approvalHandoff.blockers.map((item) => `- ${item}`),
    "",
    "Safe local commands:",
    ...Object.values(approvalHandoff.safeLocalCommands).map((item) => `- ${item}`),
    "",
    "Publication allowed: false",
    "Private upload allowed: false",
    "Unlisted upload allowed: false",
    "Real network actions performed: false"
  ].join("\n") + "\n");
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_REVIEW_EVIDENCE_GATE.json"), reviewEvidenceGate);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_TEMPLATE.json"), evidenceImportTemplate);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_AUDIT.json"), evidenceImportAudit);
  writeText(path.join(reportsDir, "UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_AUDIT.md"), [
    "# UAOS Social Review Evidence Import Audit",
    "",
    `Status: ${evidenceImportAudit.status}`,
    `Tutorial evidence rows: ${evidenceImportAudit.importedRows.tutorialEvidence}/${evidenceImportAudit.expectedTotals.tutorials}`,
    `Queue evidence rows: ${evidenceImportAudit.importedRows.queueEvidence}/${evidenceImportAudit.expectedTotals.queueItems}`,
    `OAuth evidence rows: ${evidenceImportAudit.importedRows.oauthEvidence}/${evidenceImportAudit.expectedTotals.oauthPlatforms}`,
    `Rendered media approvals: ${evidenceImportAudit.importedApprovalCounts.renderedMediaApproved}/${evidenceImportAudit.expectedTotals.tutorials}`,
    `Narration approvals: ${evidenceImportAudit.importedApprovalCounts.narrationApproved}/${evidenceImportAudit.expectedTotals.narrationAssets}`,
    `Owner approvals: ${evidenceImportAudit.importedApprovalCounts.ownerApproval}/${evidenceImportAudit.expectedTotals.queueItems}`,
    `Approved phrases: ${evidenceImportAudit.importedApprovalCounts.approvedPhrases}/${evidenceImportAudit.expectedTotals.queueItems}`,
    `OAuth configured evidence: ${evidenceImportAudit.oauthEvidenceCounts.configured}/${evidenceImportAudit.expectedTotals.oauthPlatforms}`,
    `OAuth app review evidence: ${evidenceImportAudit.oauthEvidenceCounts.appReviewApproved}/${evidenceImportAudit.expectedTotals.oauthPlatforms}`,
    `OAuth token storage evidence: ${evidenceImportAudit.oauthEvidenceCounts.tokenStorageVerified}/${evidenceImportAudit.expectedTotals.oauthPlatforms}`,
    `Unsafe unlock attempts: ${evidenceImportAudit.unsafeUnlocks.length}`,
    `Secret-like keys: ${evidenceImportAudit.unsafeSecretLikeKeys.length}`,
    `Malformed tutorial evidence fields: ${evidenceImportAudit.evidenceShapeIssues.tutorialEvidence.length}`,
    `Malformed queue evidence fields: ${evidenceImportAudit.evidenceShapeIssues.queueEvidence.length}`,
    `Malformed OAuth evidence fields: ${evidenceImportAudit.evidenceShapeIssues.oauthEvidence.length}`,
    `Evidence artifact reference issues: ${evidenceImportAudit.evidenceArtifactIssues.tutorialEvidence.length}`,
    `Evidence artifact missing files: ${evidenceImportAudit.evidenceArtifactFileIssues.missingFiles.length}`,
    `Evidence artifact invalid extensions: ${evidenceImportAudit.evidenceArtifactFileIssues.invalidExtensions.length}`,
    `Evidence freshness issues: ${evidenceImportAudit.evidenceFreshnessIssues.tutorialEvidence.length + evidenceImportAudit.evidenceFreshnessIssues.queueEvidence.length}`,
    `Evidence provenance issues: ${evidenceImportAudit.evidenceProvenanceIssues.tutorialEvidence.length + evidenceImportAudit.evidenceProvenanceIssues.queueEvidence.length + evidenceImportAudit.evidenceProvenanceIssues.oauthEvidence.length}`,
    `Queue evidence consistency issues: ${evidenceImportAudit.evidenceConsistencyIssues.queueEvidence.length}`,
    `Invalid tutorial references: ${evidenceImportAudit.invalidEvidenceReferences.tutorialIds.length}`,
    `Invalid queue references: ${evidenceImportAudit.invalidEvidenceReferences.contentIds.length}`,
    `Invalid OAuth platform references: ${evidenceImportAudit.invalidEvidenceReferences.platformIds.length}`,
    `Duplicate tutorial references: ${evidenceImportAudit.duplicateEvidenceReferences.tutorialIds.length}`,
    `Duplicate queue references: ${evidenceImportAudit.duplicateEvidenceReferences.contentIds.length}`,
    `Duplicate OAuth platform references: ${evidenceImportAudit.duplicateEvidenceReferences.platformIds.length}`,
    "",
    "Blockers:",
    ...evidenceImportAudit.blockers.map((item) => `- ${item}`),
    "",
    "Publication allowed: false",
    "Private upload allowed: false",
    "Unlisted upload allowed: false",
    "Real network actions performed: false"
  ].join("\n") + "\n");
  writeText(path.join(reportsDir, "UAOS_SOCIAL_REVIEW_EVIDENCE_GATE.md"), [
    "# UAOS Social Review Evidence Gate",
    "",
    `Status: ${reviewEvidenceGate.status}`,
    `Tutorials: ${reviewEvidenceGate.totals.tutorials}`,
    `Render manifests: ${reviewEvidenceGate.totals.renderManifests}`,
    `Rendered files: ${reviewEvidenceGate.totals.renderedFiles}`,
    `Approved narration assets: ${reviewEvidenceGate.totals.approvedNarrationAssets}/${reviewEvidenceGate.totals.expectedNarrationAssets}`,
    `Queue items: ${reviewEvidenceGate.totals.queueItems}`,
    `Draft queue items: ${reviewEvidenceGate.totals.draftQueueItems}`,
    `OAuth configured: ${reviewEvidenceGate.totals.oauthConfigured}/${reviewEvidenceGate.totals.oauthPlatforms}`,
    `Approved phrases: ${reviewEvidenceGate.totals.approvedPhrases}`,
    "",
    "Required evidence:",
    ...reviewEvidenceGate.requiredEvidence.map((item) => `- ${item}`),
    "",
    "Blockers:",
    ...reviewEvidenceGate.blockers.map((item) => `- ${item}`),
    "",
    "Safe local commands:",
    ...Object.values(reviewEvidenceGate.safeLocalCommands).map((item) => `- ${item}`),
    "",
    "Evidence import template:",
    "- reports/UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_TEMPLATE.json",
    "- reports/UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_AUDIT.json",
    "- Template only; it does not approve, upload, schedule, publish, authenticate, record or render.",
    "",
    "Publication allowed: false",
    "Private upload allowed: false",
    "Unlisted upload allowed: false",
    "Real network actions performed: false"
  ].join("\n") + "\n");
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_PUBLISHING_SCHEDULE.json"), data.schedules);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_CAMPAIGNS.json"), data.campaigns);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_OUTDATED_CONTENT.json"), data.outdatedContent);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_PRIVACY_GATE.json"), data.privacyGate);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_COPYRIGHT_GATE.json"), data.copyrightGate);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_DISK_USAGE.json"), data.diskSafety);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_FINAL_GATE.json"), data.finalGate);
  writeJson(path.join(reportsDir, "UAOS_SOCIAL_MANUAL_HANDOFF_READINESS.json"), manualHandoff);
  writeText(path.join(reportsDir, "UAOS_SOCIAL_MANUAL_HANDOFF_READINESS.md"), [
    "# UAOS Social Manual Handoff Readiness",
    "",
    `Status: ${manualHandoff.status}`,
    `Tutorials: ${manualHandoff.totals.tutorials}`,
    `Render manifests: ${manualHandoff.totals.renderManifests}`,
    `Draft queue items: ${manualHandoff.totals.draftQueueItems}`,
    `OAuth configured: ${manualHandoff.totals.oauthConfigured}/${manualHandoff.totals.oauthPlatforms}`,
    "",
    "Required external actions:",
    ...manualHandoff.requiredExternalActions.map((item) => `- ${item}`),
    "",
    "Safe local commands:",
    ...Object.values(manualHandoff.commands).map((item) => `- ${item}`),
    "",
    "Publication allowed: false",
    "Real network actions performed: false"
  ].join("\n") + "\n");
  return finalReport;
}

function writeDocs() {
  const docs = {
    "UAOS_SOCIAL_FULL_PRODUCTION.md": "Full social production pipeline is code complete for local review. External publishing is disabled.",
    "UAOS_SOCIAL_CONTENT_WORKFLOW.md": "Workflow: generate, review, capture, render, caption, package, queue, approve, then connect official APIs later.",
    "UAOS_SOCIAL_RENDERING.md": [
      "Rendering uses generated manifests and FFmpeg-compatible commands only.",
      "",
      "Safe render flow:",
      "1. Run `npm run academy:render:status` to regenerate the render readiness reports.",
      "2. Run `npm run academy:render:sample` before any batch work.",
      "3. Review `reports/UAOS_SOCIAL_RENDER_HANDOFF.md` and the per-tutorial `renders/manifest.json` files.",
      "4. Render manually or with FFmpeg only after checking narration, captions, safe margins, contrast and motion.",
      "5. Keep every publication queue item in DRAFT until OAuth, legal review and owner approval are complete.",
      "",
      "The command never uploads, schedules, publishes, stores OAuth tokens or performs network actions."
    ].join("\n"),
    "UAOS_SOCIAL_NARRATION.md": [
      "Narration is local-review metadata until real audio is recorded, imported and approved.",
      "",
      "Safe narration flow:",
      "1. Run `npm run academy:narration:status` to regenerate narration readiness reports.",
      "2. Review `reports/UAOS_SOCIAL_NARRATION_HANDOFF.md` and the per-tutorial script files.",
      "3. Record or import audio only with explicit voice consent.",
      "4. Check duration, clipping, silence, pronunciation and pacing before rendering.",
      "5. Keep cloud TTS and voice cloning disabled unless explicitly approved later.",
      "",
      "The command never records microphone audio, uploads files, stores OAuth tokens or performs network actions."
    ].join("\n"),
    "UAOS_SOCIAL_CAPTURE.md": "Capture uses local routes, synthetic demo state, no desktop recording and no user data.",
    "UAOS_SOCIAL_PLATFORM_ADAPTERS.md": "Adapters are dry-run/mock/contract implementations for official APIs only; scraping is forbidden.",
    "UAOS_SOCIAL_OAUTH_CONFIGURATION.md": "OAuth configuration is contract-only and disabled until real platform apps are approved.",
    "UAOS_SOCIAL_SECURE_TOKEN_STORAGE.md": "Token storage contract supports future secure storage metadata; no secrets are persisted.",
    "UAOS_SOCIAL_PUBLICATION_APPROVAL.md": [
      "Publication requires technical review, educational review, privacy review, copyright review, legal/brand review, owner approval and an explicit confirmation phrase.",
      "",
      "Safe approval flow:",
      "1. Run `npm run academy:approval:status` to regenerate the publication approval handoff.",
      "2. Review `reports/UAOS_SOCIAL_PUBLICATION_APPROVAL_HANDOFF.md` and `social-output/queue/publication-queue.json`.",
      "3. Keep every queue item in DRAFT until rendered media, narration, metadata, captions and thumbnails are manually approved.",
      "4. Configure official OAuth/API credentials only after platform app review and owner approval.",
      "5. Require the exact phrase `OWNER_APPROVES_SOCIAL_PUBLICATION` before private upload, unlisted upload, scheduling or public publication.",
      "",
      "The approval status command never uploads, schedules, publishes, stores OAuth tokens or performs network actions."
    ].join("\n"),
    "UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT.md": [
      "The review evidence import template is a local checklist for human reviewers.",
      "",
      "Safe evidence flow:",
      "1. Run `npm run academy:evidence:template` to regenerate `reports/UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_TEMPLATE.json`.",
      "2. Run `npm run academy:evidence:working` to create `social-output/reviews/reviewer-evidence-working.json` as the reviewer-owned working file.",
      "3. Reference local rendered media, local narration audio and written review notes only.",
      "4. Never paste OAuth secrets, cookies, refresh tokens, private URLs or personal data into evidence files.",
      "5. Record OAuth evidence only as non-secret metadata: platformId, configured, appReviewApproved, accountVerified, scopesApproved, tokenStorageVerified and reviewerNote.",
      "6. Run `npm run academy:evidence:audit` to count imported local evidence and catch unsafe unlock flags, secret-like keys, malformed fields, unsafe, missing or unsupported local artifact paths, stale content hashes, missing review provenance, duplicate IDs, unknown IDs, queue tutorial/platform mismatches and OAuth platform metadata issues.",
      "7. Run `npm run academy:review:evidence` after manual review to confirm publication remains blocked until all gates are complete.",
      "",
      "The template, working-file and audit commands never upload, schedule, publish, authenticate, record audio, render media or perform network actions."
    ].join("\n"),
    "UAOS_SOCIAL_SCHEDULING.md": "Schedules use Europe/Berlin and 3 long tutorials per week.",
    "UAOS_SOCIAL_COPYRIGHT_AND_PRIVACY.md": "Only synthetic media is allowed. No user projects, copyrighted music, commercial samples, tokens or private paths.",
    "UAOS_SOCIAL_DISK_MANAGEMENT.md": "Disk safety uses thresholds, resumable jobs, temp cleanup and keeps scripts/captions/manifests.",
    "UAOS_ACADEMY_ADMIN_GUIDE.md": "Use #/academy for local review dashboards and preview metadata."
  };
  for (const [file, text] of Object.entries(docs)) writeText(path.join(root, "docs", file), `# ${file.replace(".md", "").replaceAll("_", " ")}\n\n${text}\n`);
}

function generateAll() {
  const data = createFullProduction({ ffmpegAvailable: ffmpegAvailable() });
  writeTutorialSamples(data);
  writeGlobalOutput(data);
  writeDocs();
  const report = writeReports(data);
  if (!report.passed) {
    console.error(report.validation.errors.join("\n"));
    process.exit(1);
  }
  return { data, report };
}

function disabledRealCommand(name) {
  const data = createFullProduction({ ffmpegAvailable: ffmpegAvailable() });
  writeReports(data);
  console.log(`${name}: DISABLED_CONFIGURATION_REQUIRED`);
  console.log("No OAuth, upload, schedule, or publish action was performed.");
}

switch (command) {
  case "disabled-real":
    disabledRealCommand(process.argv[3] || "real-command");
    break;
  case "capture:sample": {
    const { data } = generateAll();
    writeJson(path.join(outputRoot, "captures", "sample-capture.json"), { tutorialId: data.tutorials[0].tutorialId, status: "SAMPLE_CAPTURE_READY", route: data.tutorials[0].route, desktopCapture: false, userData: false });
    console.log("UAOS Academy sample capture: SAMPLE_CAPTURE_READY");
    break;
  }
  case "render:sample": {
    const { data } = generateAll();
    const status = data.renderReadiness.ffmpegAvailable ? "SAMPLE_RENDER_READY" : "FFMPEG_REQUIRED";
    writeJson(path.join(outputRoot, "renders", "sample-render.json"), { tutorialId: data.tutorials[0].tutorialId, status, fullBatchRenderAutomatic: false });
    console.log(`UAOS Academy sample render: ${status}`);
    break;
  }
  case "render:status": {
    const { data } = generateAll();
    const handoff = createRenderHandoffPlan(data);
    console.log(`UAOS Academy render status: ${handoff.status}`);
    console.log(`Render manifests: ${handoff.totals.renderManifests}`);
    console.log(`Blocked manifests: ${handoff.totals.blockedManifests}`);
    console.log("No OAuth, upload, schedule, or publish action was performed.");
    break;
  }
  case "narration:status": {
    const { data } = generateAll();
    const handoff = createNarrationHandoffPlan(data);
    console.log(`UAOS Academy narration status: ${handoff.status}`);
    console.log(`Expected audio assets: ${handoff.totals.expectedAudioAssets}`);
    console.log(`Approved audio assets: ${handoff.totals.approvedAudioAssets}`);
    console.log("No microphone capture, OAuth, upload, schedule, or publish action was performed.");
    break;
  }
  case "approval:status": {
    const { data } = generateAll();
    const handoff = createPublicationApprovalHandoffPlan(data);
    console.log(`UAOS Academy approval status: ${handoff.status}`);
    console.log(`Queue items: ${handoff.totals.queueItems}`);
    console.log(`Owner-approved items: ${handoff.totals.ownerApprovedItems}`);
    console.log("No OAuth, upload, schedule, or publish action was performed.");
    break;
  }
  case "review:evidence": {
    const { data } = generateAll();
    const gate = createReviewEvidenceGate(data);
    console.log(`UAOS Academy review evidence: ${gate.status}`);
    console.log(`Rendered files: ${gate.totals.renderedFiles}/${gate.totals.renderManifests}`);
    console.log(`Approved narration assets: ${gate.totals.approvedNarrationAssets}/${gate.totals.expectedNarrationAssets}`);
    console.log(`Blockers: ${gate.blockers.length}`);
    console.log("No OAuth, upload, schedule, or publish action was performed.");
    break;
  }
  case "evidence:template": {
    const { data } = generateAll();
    const template = createReviewEvidenceImportManifest(data);
    console.log(`UAOS Academy evidence template: ${template.status}`);
    console.log(`Expected queue items: ${template.expectedTotals.queueItems}`);
    console.log("No OAuth, upload, schedule, publish, microphone, or render action was performed.");
    break;
  }
  case "evidence:working": {
    const { data } = generateAll();
    const working = writeReviewerEvidenceWorkingFile(data);
    console.log(`UAOS Academy evidence working file: ${working.status}`);
    console.log(`Working file: ${working.workingFilePath}`);
    console.log("No approvals were imported and no OAuth, upload, schedule, publish, microphone, or render action was performed.");
    break;
  }
  case "evidence:audit": {
    const { data } = generateAll();
    const audit = createReviewEvidenceImportAudit(data, readReviewerEvidenceWorkingFile(data), { artifactExists: localArtifactExists });
    console.log(`UAOS Academy evidence audit: ${audit.status}`);
    console.log(`Tutorial evidence rows: ${audit.importedRows.tutorialEvidence}/${audit.expectedTotals.tutorials}`);
    console.log(`Queue evidence rows: ${audit.importedRows.queueEvidence}/${audit.expectedTotals.queueItems}`);
    console.log(`OAuth evidence rows: ${audit.importedRows.oauthEvidence}/${audit.expectedTotals.oauthPlatforms}`);
    console.log(`Blockers: ${audit.blockers.length}`);
    console.log("No approvals were applied to the publication queue and no OAuth, upload, schedule, publish, microphone, or render action was performed.");
    break;
  }
  case "disk:check": {
    const { data } = generateAll();
    console.log(`UAOS Academy disk check: estimated ${data.diskSafety.estimatedBatchSizeMb} MB`);
    break;
  }
  case "status": {
    const { data } = generateAll();
    console.log(`UAOS Academy status: ${data.status}`);
    console.log(`Tutorials: ${data.counts.tutorials}`);
    console.log(`Published: ${data.counts.published}`);
    break;
  }
  case "publish:dry-run":
  case "queue:dry-run": {
    const { data } = generateAll();
    console.log(`UAOS Academy ${command}: ${data.publicationQueue.length} DRAFT items, no network`);
    break;
  }
  case "oauth:status": {
    const { data } = generateAll();
    console.log(`UAOS Academy OAuth: ${data.oauthStatus.length} platforms configured=false`);
    break;
  }
  case "handoff:readiness": {
    const { data } = generateAll();
    const handoff = createManualHandoffReadiness(data);
    console.log(`UAOS Academy manual handoff: ${handoff.status}`);
    console.log(`Blockers: ${handoff.requiredExternalActions.length}`);
    console.log("No OAuth, upload, schedule, or publish action was performed.");
    break;
  }
  case "validate:all": {
    const { report } = generateAll();
    console.log(`UAOS Academy validate all: ${report.passed ? "PASS" : "FAILED"}`);
    break;
  }
  case "scan":
  case "curriculum":
  case "scripts:all":
  case "storyboards:all":
  case "captions:all":
  case "thumbnails:all":
  case "carousels:all":
  case "platforms:all":
  case "schedule:all":
  case "coverage":
  case "outdated":
  case "report":
  case "preview":
  case "capture:batch":
  case "render:batch":
  case "generate:all":
  default: {
    const { data } = generateAll();
    if (command === "render:batch") console.log("UAOS Academy render batch: manifests ready, full render not auto-started");
    else if (command === "capture:batch") console.log("UAOS Academy capture batch: contracts ready, sample capture only by command");
    else console.log(`UAOS Academy ${command}: ${data.status}`);
  }
}
