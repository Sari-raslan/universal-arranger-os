import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  OUTDATED_STATUSES,
  PLATFORM_COMPLETION,
  PUBLICATION_QUEUE_STATUSES,
  createAcademyFullSummary,
  createCommentsCommunityFoundation,
  createFullProduction,
  createManualHandoffReadiness,
  createNarrationHandoffPlan,
  createPlatformAdapterCatalog,
  createPublicationApprovalHandoffPlan,
  createReviewEvidenceGate,
  createReviewEvidenceImportManifest,
  createReviewEvidenceImportAudit,
  createReviewerEvidenceWorkingManifest,
  createPublicationGate,
  createRenderHandoffPlan,
  createSecureTokenStorageContract,
  validateFullProduction
} from "../uaos-live-clean/src/social/academyFullProduction.js";

const root = process.cwd();

test("full production creates all 140 tutorials across 30 batches", () => {
  const data = createFullProduction();
  assert.equal(data.tutorials.length, 140);
  assert.equal(data.batches.length, 30);
  assert.equal(validateFullProduction(data).valid, true);
  assert.equal(new Set(data.tutorials.map((item) => item.tutorialId)).size, 140);
  assert.equal(new Set(data.tutorials.map((item) => item.contentHash)).size, 140);
});

test("all tutorials have route, feature, scripts, storyboards, captions, thumbnails and carousels", () => {
  const data = createFullProduction();
  for (const tutorial of data.tutorials) {
    assert.ok(tutorial.route.startsWith("#/"));
    assert.ok(tutorial.featureId.startsWith("uaos-"));
    assert.ok(tutorial.scripts.ar.rtl);
    assert.ok(tutorial.scripts.en.title);
    assert.ok(tutorial.scripts.de.title);
    assert.ok(tutorial.storyboard.frames.length >= 6);
    assert.ok(tutorial.captions.ar.srt.includes("-->"));
    assert.ok(tutorial.captions.ar.vtt.startsWith("WEBVTT"));
    assert.equal(tutorial.thumbnails.length, 4);
    assert.equal(tutorial.carousels.length, 2);
    assert.equal(tutorial.renderManifests.length, 4);
  }
});

test("feature coverage, missing content, language coverage and support linkage are honest", () => {
  const data = createFullProduction();
  assert.ok(data.coverage.length >= 20);
  assert.equal(data.missingContent.length, 0);
  assert.ok(data.coverage.every((item) => ["COVERED", "BLOCKED_MANUAL_HARDWARE", "BLOCKED_EXTERNAL_SERVICE"].includes(item.status)));
  assert.equal(data.analytics.languageCoverage.ar, 140);
  assert.equal(data.analytics.languageCoverage.en, 140);
  assert.equal(data.analytics.languageCoverage.deFoundation, 140);
  assert.equal(data.analytics.supportLinkage, 140);
});

test("platform adapters and platform packages are dry-run complete", () => {
  const data = createFullProduction();
  const adapters = createPlatformAdapterCatalog();
  assert.equal(adapters.length, 23);
  assert.deepEqual(adapters.map((item) => item.platformId), PLATFORM_COMPLETION);
  assert.ok(adapters.every((item) => item.dryRunImplementation));
  assert.ok(adapters.every((item) => item.realImplementationContract.includes("official API")));
  assert.ok(data.tutorials.every((tutorial) => tutorial.platformPackages.length === 23));
  assert.ok(data.tutorials.every((tutorial) => tutorial.platformPackages.every((pkg) => pkg.dryRun)));
});

test("OAuth, token storage and real publishing stay disabled", () => {
  const data = createFullProduction();
  const storage = createSecureTokenStorageContract();
  assert.ok(data.oauthStatus.every((item) => item.configured === false));
  assert.ok(data.oauthStatus.every((item) => item.secretMasked === true));
  assert.equal(storage.browserState, "unsupported-for-secret-storage");
  assert.equal(storage.noReportPersistence, true);
  assert.equal(storage.noConsoleLogging, true);
  assert.equal(data.finalGate.publicationAllowed, false);
  assert.equal(data.counts.readyForPrivateUpload, 0);
  assert.equal(data.counts.published, 0);
});

test("publication queue and gate block without OAuth, review and approval", () => {
  const data = createFullProduction();
  assert.ok(PUBLICATION_QUEUE_STATUSES.includes("DRAFT"));
  assert.ok(data.publicationQueue.length > 500);
  assert.ok(data.publicationQueue.every((item) => item.status === "DRAFT"));
  assert.ok(data.publicationQueue.every((item) => item.platformPostId === null));
  assert.ok(data.publicationQueue.every((item) => item.privateUploadAllowed === false));
  assert.ok(data.publicationQueue.every((item) => item.unlistedUploadAllowed === false));
  assert.ok(data.publicationQueue.every((item) => item.publicPublicationAllowed === false));
  assert.ok(data.publicationQueue.every((item) => item.reviewEvidence.ownerApproval === false));
  const gate = createPublicationGate({ metadataValid: true, captionsValid: true, thumbnailValid: true });
  assert.equal(gate.status, "WAITING_OAUTH");
  assert.equal(gate.publicPublicationAllowed, false);
});

test("publication approval handoff blocks every queue item until evidence exists", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const handoff = createPublicationApprovalHandoffPlan(data);
  assert.equal(handoff.status, "BLOCKED_PUBLICATION_APPROVAL");
  assert.equal(handoff.publicationAllowed, false);
  assert.equal(handoff.privateUploadAllowed, false);
  assert.equal(handoff.unlistedUploadAllowed, false);
  assert.equal(handoff.realNetworkActionsPerformed, false);
  assert.equal(handoff.totals.queueItems, 700);
  assert.equal(handoff.totals.draftItems, 700);
  assert.equal(handoff.totals.ownerApprovedItems, 0);
  assert.equal(handoff.totals.privateReadyItems, 0);
  assert.equal(handoff.totals.publicReadyItems, 0);
  assert.equal(handoff.totals.platformsPerTutorial, 5);
  assert.ok(handoff.requiredEvidence.includes("ownerApproval"));
  assert.ok(handoff.sampleQueueItem.requiredBeforePrivateUpload.includes("narration-approved"));
  assert.ok(handoff.sampleQueueItem.requiredBeforePublicPublication.includes("OWNER_APPROVES_SOCIAL_PUBLICATION"));
  assert.ok(handoff.safeLocalCommands.approvalStatus.includes("academy:approval:status"));
  assert.equal(handoff.approvalPhraseRequired, "OWNER_APPROVES_SOCIAL_PUBLICATION");
});

test("review evidence gate blocks uploads until render narration OAuth and approval evidence exist", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const gate = createReviewEvidenceGate(data);
  assert.equal(gate.status, "BLOCKED_REVIEW_EVIDENCE");
  assert.equal(gate.publicationAllowed, false);
  assert.equal(gate.privateUploadAllowed, false);
  assert.equal(gate.unlistedUploadAllowed, false);
  assert.equal(gate.realNetworkActionsPerformed, false);
  assert.equal(gate.totals.tutorials, 140);
  assert.equal(gate.totals.renderManifests, 560);
  assert.equal(gate.totals.renderedFiles, 0);
  assert.equal(gate.totals.expectedNarrationAssets, 420);
  assert.equal(gate.totals.approvedNarrationAssets, 0);
  assert.equal(gate.totals.queueItems, 700);
  assert.equal(gate.totals.draftQueueItems, 700);
  assert.equal(gate.totals.oauthConfigured, 0);
  assert.equal(gate.totals.approvedPhrases, 0);
  assert.equal(gate.evidenceCounts.ownerApproval, 0);
  assert.ok(gate.safeLocalCommands.evidenceTemplate.includes("academy:evidence:template"));
  assert.ok(gate.localArtifacts.evidenceImportTemplate.endsWith("UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_TEMPLATE.json"));
  assert.ok(gate.requiredEvidence.includes("OWNER_APPROVES_SOCIAL_PUBLICATION"));
  assert.ok(gate.safeLocalCommands.reviewEvidence.includes("academy:review:evidence"));
  assert.ok(gate.blockers.some((item) => item.includes("Rendered media")));
  assert.ok(gate.blockers.some((item) => item.includes("Narration audio")));
  assert.ok(gate.blockers.some((item) => item.includes("OAuth")));
});

test("review evidence import manifest is local-only and does not unlock publication", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const manifest = createReviewEvidenceImportManifest(data);
  assert.equal(manifest.status, "TEMPLATE_ONLY_NO_APPROVALS_IMPORTED");
  assert.equal(manifest.publicationAllowed, false);
  assert.equal(manifest.privateUploadAllowed, false);
  assert.equal(manifest.unlistedUploadAllowed, false);
  assert.equal(manifest.realNetworkActionsPerformed, false);
  assert.equal(manifest.expectedTotals.tutorials, 140);
  assert.equal(manifest.expectedTotals.queueItems, 700);
  assert.equal(manifest.expectedTotals.renderManifests, 560);
  assert.equal(manifest.expectedTotals.narrationAssets, 420);
  assert.ok(manifest.requiredEvidenceTypes.includes("owner-approval"));
  assert.equal(manifest.requiredApprovalPhrase, "OWNER_APPROVES_SOCIAL_PUBLICATION");
  assert.equal(manifest.sampleTutorialEvidence.contentHash, data.tutorials[0].contentHash);
  assert.equal(manifest.sampleTutorialEvidence.evidenceSource, "local-manual-review");
  assert.equal(manifest.sampleQueueEvidence.contentHash, data.publicationQueue[0].contentHash);
  assert.equal(manifest.sampleQueueEvidence.privateUploadAllowed, false);
  assert.equal(manifest.sampleQueueEvidence.publicPublicationAllowed, false);
  assert.equal(manifest.sampleQueueEvidence.evidenceSource, "local-owner-approval");
  assert.equal(manifest.sampleOAuthEvidence.configured, false);
  assert.equal(manifest.sampleOAuthEvidence.tokenStorageVerified, false);
  assert.equal(manifest.sampleOAuthEvidence.evidenceSource, "local-oauth-checklist");
  assert.ok(manifest.safeLocalCommands.createTemplate.includes("academy:evidence:template"));
  assert.ok(manifest.safeLocalCommands.createWorkingFile.includes("academy:evidence:working"));
  assert.ok(manifest.validationRules.some((item) => item.includes("secrets")));
  assert.ok(manifest.validationRules.some((item) => item.includes("reviewedAt")));
});

test("reviewer evidence working manifest is reviewer-owned and imports no approvals by default", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const working = createReviewerEvidenceWorkingManifest(data);
  assert.equal(working.status, "WORKING_FILE_PENDING_HUMAN_REVIEW");
  assert.equal(working.generatedFrom, "reports/UAOS_SOCIAL_REVIEW_EVIDENCE_IMPORT_TEMPLATE.json");
  assert.ok(working.workingFilePath.endsWith("social-output/reviews/reviewer-evidence-working.json"));
  assert.equal(working.publicationAllowed, false);
  assert.equal(working.privateUploadAllowed, false);
  assert.equal(working.unlistedUploadAllowed, false);
  assert.equal(working.realNetworkActionsPerformed, false);
  assert.equal(working.reviewer.name, null);
  assert.equal(working.queueImportMode, "DRAFT_ONLY_NO_UPLOAD");
  assert.deepEqual(Object.values(working.importedApprovalCounts), Array(9).fill(0));
  assert.ok(working.safeLocalCommands.createWorkingFile.includes("academy:evidence:working"));
  assert.ok(working.instructions.some((item) => item.includes("reviewer-owned working copy")));
});

test("review evidence import audit counts local evidence but keeps publication disabled", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const audit = createReviewEvidenceImportAudit(data, createReviewerEvidenceWorkingManifest(data));
  assert.equal(audit.status, "IMPORTED_EVIDENCE_BLOCKED");
  assert.equal(audit.publicationAllowed, false);
  assert.equal(audit.privateUploadAllowed, false);
  assert.equal(audit.unlistedUploadAllowed, false);
  assert.equal(audit.realNetworkActionsPerformed, false);
  assert.equal(audit.importedRows.tutorialEvidence, 0);
  assert.equal(audit.importedRows.queueEvidence, 0);
  assert.equal(audit.importedRows.oauthEvidence, 0);
  assert.equal(audit.importedApprovalCounts.renderedMediaApproved, 0);
  assert.equal(audit.importedApprovalCounts.narrationApproved, 0);
  assert.equal(audit.importedApprovalCounts.ownerApproval, 0);
  assert.equal(audit.oauthEvidenceCounts.configured, 0);
  assert.equal(audit.queueImportMode, "DRAFT_ONLY_NO_UPLOAD");
  assert.ok(audit.blockers.some((item) => item.includes("No tutorial evidence")));
  assert.ok(audit.blockers.some((item) => item.includes("No OAuth evidence")));
  assert.ok(audit.blockers.some((item) => item.includes("Narration evidence")));
});

test("review evidence import audit rejects unsafe unlock flags secrets and invalid approval phrases", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const manifest = {
    ...createReviewerEvidenceWorkingManifest(data),
    publicationAllowed: true,
    oauthRefreshToken: "do-not-store",
    tutorialEvidence: [{
      tutorialId: data.tutorials[0].tutorialId,
      renderedMediaApproved: true,
      narrationApproved: { ar: true, en: true, "de-foundation": false },
      technicalReview: true,
      educationalReview: true,
      privacyReview: true,
      copyrightReview: true,
      legalBrandReview: true
    }],
    queueEvidence: [{
      contentId: data.publicationQueue[0].contentId,
      ownerApproval: true,
      approvalPhrase: "wrong phrase",
      privateUploadAllowed: true
    }]
  };
  const audit = createReviewEvidenceImportAudit(data, manifest);
  assert.equal(audit.status, "IMPORTED_EVIDENCE_BLOCKED");
  assert.equal(audit.publicationAllowed, false);
  assert.equal(audit.importedRows.tutorialEvidence, 1);
  assert.equal(audit.importedRows.queueEvidence, 1);
  assert.equal(audit.importedApprovalCounts.renderedMediaApproved, 1);
  assert.equal(audit.importedApprovalCounts.narrationApproved, 2);
  assert.equal(audit.importedApprovalCounts.ownerApproval, 1);
  assert.equal(audit.importedApprovalCounts.approvedPhrases, 0);
  assert.equal(audit.invalidOwnerApprovals, 1);
  assert.ok(audit.unsafeUnlocks.includes("publicationAllowed"));
  assert.ok(audit.unsafeUnlocks.some((item) => item.endsWith(".privateUploadAllowed")));
  assert.ok(audit.unsafeSecretLikeKeys.includes("oauthRefreshToken"));
  assert.ok(audit.blockers.some((item) => item.includes("upload or publication flags")));
});

test("review evidence import audit reports malformed reviewer evidence fields", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const manifest = {
    ...createReviewerEvidenceWorkingManifest(data),
    tutorialEvidence: [{
      tutorialId: data.tutorials[0].tutorialId,
      renderedMediaApproved: "yes",
      narrationApproved: { ar: true, en: "approved", "de-foundation": false },
      technicalReview: true,
      educationalReview: true,
      privacyReview: true,
      copyrightReview: true,
      legalBrandReview: true,
      reviewerNotes: ["checked locally", 99]
    }],
    queueEvidence: [{
      contentId: data.publicationQueue[0].contentId,
      ownerApproval: "yes",
      approvalPhrase: 123,
      publicPublicationAllowed: "no"
    }],
    oauthEvidence: [{
      platformId: data.oauthStatus[0].platformId,
      configured: "yes",
      tokenStorageVerified: "no",
      reviewerNote: 42
    }]
  };
  const audit = createReviewEvidenceImportAudit(data, manifest);
  assert.equal(audit.status, "IMPORTED_EVIDENCE_BLOCKED");
  assert.ok(audit.evidenceShapeIssues.tutorialEvidence.includes("tutorialEvidence[0].renderedMediaApproved"));
  assert.ok(audit.evidenceShapeIssues.tutorialEvidence.includes("tutorialEvidence[0].narrationApproved.en"));
  assert.ok(audit.evidenceShapeIssues.tutorialEvidence.includes("tutorialEvidence[0].reviewerNotes[1]"));
  assert.ok(audit.evidenceShapeIssues.queueEvidence.includes("queueEvidence[0].ownerApproval"));
  assert.ok(audit.evidenceShapeIssues.queueEvidence.includes("queueEvidence[0].approvalPhrase"));
  assert.ok(audit.evidenceShapeIssues.queueEvidence.includes("queueEvidence[0].publicPublicationAllowed"));
  assert.ok(audit.evidenceShapeIssues.oauthEvidence.includes("oauthEvidence[0].configured"));
  assert.ok(audit.evidenceShapeIssues.oauthEvidence.includes("oauthEvidence[0].tokenStorageVerified"));
  assert.ok(audit.evidenceShapeIssues.oauthEvidence.includes("oauthEvidence[0].reviewerNote"));
  assert.ok(audit.blockers.some((item) => item.includes("malformed fields")));
});

test("review evidence import audit rejects unsafe or missing local artifact references", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const tutorial = data.tutorials[0];
  const manifest = {
    ...createReviewerEvidenceWorkingManifest(data),
    tutorialEvidence: [
      {
        tutorialId: tutorial.tutorialId,
        renderedMediaApproved: true,
        narrationApproved: { ar: true, en: true, "de-foundation": true },
        technicalReview: true,
        educationalReview: true,
        privacyReview: true,
        copyrightReview: true,
        legalBrandReview: true,
        renderedMediaPaths: [
          `${tutorial.outputPath}/renders/landscape.mp4`,
          "https://example.com/private-render.mp4",
          "C:/Users/private/audio.wav"
        ],
        narrationAudioPaths: {
          ar: `${data.outputRoot}/narration/${tutorial.tutorialId}/ar.wav`,
          en: `../${data.outputRoot}/narration/${tutorial.tutorialId}/en.wav`,
          "de-foundation": null
        },
        reviewerNotePaths: [`${data.outputRoot}/reviews/${tutorial.tutorialId}/technical.md`]
      },
      {
        tutorialId: data.tutorials[1].tutorialId,
        renderedMediaApproved: true,
        narrationApproved: { ar: true },
        technicalReview: true
      }
    ]
  };
  const audit = createReviewEvidenceImportAudit(data, manifest);
  assert.equal(audit.status, "IMPORTED_EVIDENCE_BLOCKED");
  assert.ok(audit.evidenceShapeIssues.tutorialEvidence.includes("tutorialEvidence[0].renderedMediaPaths[1]"));
  assert.ok(audit.evidenceShapeIssues.tutorialEvidence.includes("tutorialEvidence[0].renderedMediaPaths[2]"));
  assert.ok(audit.evidenceShapeIssues.tutorialEvidence.includes("tutorialEvidence[0].narrationAudioPaths.en"));
  assert.ok(audit.evidenceArtifactIssues.tutorialEvidence.includes("tutorialEvidence[0].narrationAudioPaths.de-foundation:required"));
  assert.ok(audit.evidenceArtifactIssues.tutorialEvidence.includes("tutorialEvidence[1].renderedMediaPaths:required"));
  assert.ok(audit.evidenceArtifactIssues.tutorialEvidence.includes("tutorialEvidence[1].reviewerNotePaths:technicalReview:required"));
  assert.ok(audit.blockers.some((item) => item.includes("local artifact references")));
  assert.equal(audit.publicationAllowed, false);
});

test("review evidence import audit reports missing files and unsupported artifact extensions", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const tutorial = data.tutorials[0];
  const existingRenderPath = `${data.outputRoot}/renders/${tutorial.tutorialId}/landscape.mp4`;
  const missingAudioPath = `${data.outputRoot}/narration/${tutorial.tutorialId}/ar.wav`;
  const manifest = {
    ...createReviewerEvidenceWorkingManifest(data),
    tutorialEvidence: [{
      tutorialId: tutorial.tutorialId,
      renderedMediaApproved: true,
      narrationApproved: { ar: true },
      technicalReview: true,
      renderedMediaPaths: [
        existingRenderPath,
        `${data.outputRoot}/renders/${tutorial.tutorialId}/vertical.avi`
      ],
      narrationAudioPaths: {
        ar: missingAudioPath
      },
      reviewerNotePaths: [
        `${data.outputRoot}/reviews/${tutorial.tutorialId}/technical.docx`
      ]
    }]
  };
  const audit = createReviewEvidenceImportAudit(data, manifest, {
    artifactExists: (value) => value === existingRenderPath
  });
  assert.deepEqual(audit.evidenceArtifactFileIssues.missingFiles, [
    "tutorialEvidence[0].renderedMediaPaths[1]",
    "tutorialEvidence[0].narrationAudioPaths.ar",
    "tutorialEvidence[0].reviewerNotePaths[0]"
  ]);
  assert.deepEqual(audit.evidenceArtifactFileIssues.invalidExtensions, [
    "tutorialEvidence[0].renderedMediaPaths[1]",
    "tutorialEvidence[0].reviewerNotePaths[0]"
  ]);
  assert.ok(audit.blockers.some((item) => item.includes("unsupported file extensions")));
  assert.ok(audit.blockers.some((item) => item.includes("do not exist in the workspace")));
  assert.equal(audit.publicationAllowed, false);
});

test("review evidence import audit validates OAuth platform evidence without secrets", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const platform = data.oauthStatus[0].platformId;
  const manifest = {
    ...createReviewerEvidenceWorkingManifest(data),
    oauthEvidence: [
      {
        platformId: platform,
        configured: true,
        appReviewApproved: true,
        accountVerified: true,
        scopesApproved: true,
        tokenStorageVerified: true,
        reviewerNote: "local OAuth checklist reviewed; no token stored"
      },
      {
        platformId: platform,
        configured: true
      },
      {
        platformId: "unknown-platform",
        configured: true,
        appReviewApproved: true,
        accountVerified: true,
        scopesApproved: true,
        tokenStorageVerified: true
      }
    ]
  };
  const audit = createReviewEvidenceImportAudit(data, manifest);
  assert.equal(audit.importedRows.oauthEvidence, 3);
  assert.equal(audit.oauthEvidenceCounts.configured, 1);
  assert.equal(audit.oauthEvidenceCounts.appReviewApproved, 1);
  assert.deepEqual(audit.invalidEvidenceReferences.platformIds, ["unknown-platform"]);
  assert.deepEqual(audit.duplicateEvidenceReferences.platformIds, [platform]);
  assert.ok(audit.blockers.some((item) => item.includes("OAuth evidence is incomplete")));
  assert.equal(audit.publicationAllowed, false);
});

test("review evidence import audit rejects mismatched queue tutorial and platform references", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const queueItem = data.publicationQueue[0];
  const manifest = {
    ...createReviewerEvidenceWorkingManifest(data),
    tutorialEvidence: [{
      tutorialId: data.tutorials[0].tutorialId,
      renderedMediaApproved: true,
      narrationApproved: { ar: true, en: true, "de-foundation": true },
      technicalReview: true,
      educationalReview: true,
      privacyReview: true,
      copyrightReview: true,
      legalBrandReview: true,
      reviewerNotes: ["local render and narration checked"]
    }],
    queueEvidence: [{
      contentId: queueItem.contentId,
      tutorialId: data.tutorials[1].tutorialId,
      platform: "not-the-generated-platform",
      ownerApproval: true,
      approvalPhrase: "OWNER_APPROVES_SOCIAL_PUBLICATION"
    }]
  };
  const audit = createReviewEvidenceImportAudit(data, manifest);
  assert.equal(audit.status, "IMPORTED_EVIDENCE_BLOCKED");
  assert.deepEqual(audit.evidenceConsistencyIssues.queueEvidence, [
    "queueEvidence[0].tutorialId",
    "queueEvidence[0].platform"
  ]);
  assert.equal(audit.importedApprovalCounts.ownerApproval, 1);
  assert.ok(audit.blockers.some((item) => item.includes("tutorial/platform mapping")));
  assert.equal(audit.publicationAllowed, false);
});

test("review evidence import audit blocks stale content hash approvals", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const tutorial = data.tutorials[0];
  const queueItem = data.publicationQueue[0];
  const manifest = {
    ...createReviewerEvidenceWorkingManifest(data),
    tutorialEvidence: [{
      tutorialId: tutorial.tutorialId,
      contentHash: "stale-tutorial-hash",
      renderedMediaApproved: true,
      narrationApproved: { ar: true, en: true, "de-foundation": true },
      technicalReview: true,
      educationalReview: true,
      privacyReview: true,
      copyrightReview: true,
      legalBrandReview: true,
      renderedMediaPaths: [`${tutorial.outputPath}/renders/landscape.mp4`],
      narrationAudioPaths: {
        ar: `${data.outputRoot}/narration/${tutorial.tutorialId}/ar.wav`,
        en: `${data.outputRoot}/narration/${tutorial.tutorialId}/en.wav`,
        "de-foundation": `${data.outputRoot}/narration/${tutorial.tutorialId}/de-foundation.wav`
      },
      reviewerNotePaths: [`${data.outputRoot}/reviews/${tutorial.tutorialId}/technical.md`]
    }],
    queueEvidence: [{
      contentId: queueItem.contentId,
      tutorialId: queueItem.tutorialId,
      platform: queueItem.platform,
      contentHash: "stale-queue-hash",
      ownerApproval: true,
      approvalPhrase: "OWNER_APPROVES_SOCIAL_PUBLICATION"
    }]
  };
  const audit = createReviewEvidenceImportAudit(data, manifest);
  assert.equal(audit.status, "IMPORTED_EVIDENCE_BLOCKED");
  assert.deepEqual(audit.evidenceFreshnessIssues.tutorialEvidence, ["tutorialEvidence[0].contentHash"]);
  assert.deepEqual(audit.evidenceFreshnessIssues.queueEvidence, ["queueEvidence[0].contentHash"]);
  assert.ok(audit.blockers.some((item) => item.includes("stale or missing content hashes")));
  assert.equal(audit.publicationAllowed, false);
});

test("review evidence import audit blocks missing or stale review provenance", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const tutorial = data.tutorials[0];
  const queueItem = data.publicationQueue[0];
  const staleReviewedAt = new Date(Date.parse(data.generatedAt) - 1000).toISOString();
  const currentReviewedAt = new Date(Date.parse(data.generatedAt) + 1000).toISOString();
  const manifest = {
    ...createReviewerEvidenceWorkingManifest(data),
    tutorialEvidence: [{
      tutorialId: tutorial.tutorialId,
      contentHash: tutorial.contentHash,
      renderedMediaApproved: true,
      reviewedAt: staleReviewedAt,
      reviewerName: "",
      evidenceSource: "",
      renderedMediaPaths: [`${data.outputRoot}/renders/${tutorial.tutorialId}/long.mp4`]
    }],
    queueEvidence: [{
      contentId: queueItem.contentId,
      tutorialId: queueItem.tutorialId,
      platform: queueItem.platform,
      contentHash: queueItem.contentHash,
      ownerApproval: true,
      approvalPhrase: "OWNER_APPROVES_SOCIAL_PUBLICATION",
      reviewedAt: "June 14",
      reviewerName: "Owner",
      evidenceSource: "local-owner-approval"
    }],
    oauthEvidence: [{
      platformId: data.oauthStatus[0].platformId,
      configured: true,
      appReviewApproved: true,
      accountVerified: true,
      scopesApproved: true,
      tokenStorageVerified: true,
      reviewedAt: currentReviewedAt,
      reviewerName: "Platform reviewer",
      evidenceSource: "local-oauth-checklist",
      reviewerNote: "Non-secret local OAuth checklist reviewed."
    }]
  };
  const audit = createReviewEvidenceImportAudit(data, manifest);
  assert.deepEqual(audit.evidenceProvenanceIssues.tutorialEvidence, [
    "tutorialEvidence[0].reviewedAt:stale",
    "tutorialEvidence[0].reviewerName",
    "tutorialEvidence[0].evidenceSource"
  ]);
  assert.deepEqual(audit.evidenceProvenanceIssues.queueEvidence, ["queueEvidence[0].reviewedAt"]);
  assert.deepEqual(audit.evidenceProvenanceIssues.oauthEvidence, []);
  assert.ok(audit.blockers.some((item) => item.includes("review timestamp")));
  assert.equal(audit.publicationAllowed, false);
});

test("review evidence import audit ignores duplicate and unknown evidence identifiers", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const tutorial = data.tutorials[0];
  const queueItem = data.publicationQueue[0];
  const manifest = {
    ...createReviewerEvidenceWorkingManifest(data),
    tutorialEvidence: [
      {
        tutorialId: tutorial.tutorialId,
        renderedMediaApproved: true,
        narrationApproved: { ar: true, en: true, "de-foundation": true },
        technicalReview: true,
        educationalReview: true,
        privacyReview: true,
        copyrightReview: true,
        legalBrandReview: true
      },
      {
        tutorialId: tutorial.tutorialId,
        renderedMediaApproved: true,
        narrationApproved: true,
        technicalReview: true
      },
      {
        tutorialId: "tutorial-does-not-exist",
        renderedMediaApproved: true,
        narrationApproved: true,
        technicalReview: true
      }
    ],
    queueEvidence: [
      {
        contentId: queueItem.contentId,
        ownerApproval: true,
        approvalPhrase: "OWNER_APPROVES_SOCIAL_PUBLICATION"
      },
      {
        contentId: queueItem.contentId,
        ownerApproval: true,
        approvalPhrase: "OWNER_APPROVES_SOCIAL_PUBLICATION"
      },
      {
        contentId: "content-does-not-exist",
        ownerApproval: true,
        approvalPhrase: "OWNER_APPROVES_SOCIAL_PUBLICATION"
      }
    ],
    oauthEvidence: [
      {
        platformId: data.oauthStatus[0].platformId,
        configured: true,
        appReviewApproved: true,
        accountVerified: true,
        scopesApproved: true,
        tokenStorageVerified: true
      },
      {
        platformId: data.oauthStatus[0].platformId,
        configured: true
      },
      {
        platformId: "platform-does-not-exist",
        configured: true
      }
    ]
  };
  const audit = createReviewEvidenceImportAudit(data, manifest);
  assert.equal(audit.importedRows.tutorialEvidence, 3);
  assert.equal(audit.importedRows.queueEvidence, 3);
  assert.equal(audit.importedRows.oauthEvidence, 3);
  assert.equal(audit.importedApprovalCounts.renderedMediaApproved, 1);
  assert.equal(audit.importedApprovalCounts.narrationApproved, 3);
  assert.equal(audit.importedApprovalCounts.ownerApproval, 1);
  assert.equal(audit.oauthEvidenceCounts.configured, 1);
  assert.deepEqual(audit.invalidEvidenceReferences.tutorialIds, ["tutorial-does-not-exist"]);
  assert.deepEqual(audit.invalidEvidenceReferences.contentIds, ["content-does-not-exist"]);
  assert.deepEqual(audit.invalidEvidenceReferences.platformIds, ["platform-does-not-exist"]);
  assert.deepEqual(audit.duplicateEvidenceReferences.tutorialIds, [tutorial.tutorialId]);
  assert.deepEqual(audit.duplicateEvidenceReferences.contentIds, [queueItem.contentId]);
  assert.deepEqual(audit.duplicateEvidenceReferences.platformIds, [data.oauthStatus[0].platformId]);
  assert.ok(audit.blockers.some((item) => item.includes("unknown or missing")));
  assert.ok(audit.blockers.some((item) => item.includes("duplicate")));
});

test("schedules, campaigns, outdated detector and analytics have no fake metrics", () => {
  const data = createFullProduction();
  assert.ok(data.schedules.twelveWeekPlan.length > 0);
  assert.ok(data.schedules.sixMonthPlan.length > data.schedules.twelveWeekPlan.length);
  assert.ok(data.schedules.fullBacklogPlan.every((item) => item.timezone === "Europe/Berlin"));
  assert.equal(data.campaigns.length, 14);
  assert.ok(data.outdatedContent.every((item) => OUTDATED_STATUSES.includes(item.status)));
  assert.equal(data.analytics.fakeViews, false);
  assert.equal(data.analytics.fakeSubscribers, false);
});

test("privacy and copyright gates are synthetic-only", () => {
  const data = createFullProduction();
  assert.ok(data.privacyGate.every((item) => item.syntheticAudioOnly));
  assert.ok(data.privacyGate.every((item) => item.noWindowsUsernameVisibleInVideo));
  assert.ok(data.copyrightGate.every((item) => item.noCommercialSamples));
  assert.ok(data.copyrightGate.every((item) => item.noCopyrightedSong));
});

test("disk safety, render readiness and narration readiness expose blockers", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  assert.equal(data.renderReadiness.status, "FFMPEG_REQUIRED");
  assert.equal(data.renderReadiness.fullBatchRenderAutomatic, false);
  assert.equal(data.renderReadiness.manifests, 560);
  assert.equal(data.renderReadiness.blockedManifests, 560);
  assert.ok(data.renderReadiness.sampleManifestPath.endsWith("/renders/manifest.json"));
  assert.ok(data.renderReadiness.safeCommands.renderSample.includes("academy:render:sample"));
  assert.equal(data.renderReadiness.automaticUploadAfterRender, false);
  assert.equal(data.diskSafety.maximumParallelRenders, 1);
  assert.equal(data.diskSafety.doNotDeleteApprovedAssets, true);
  assert.equal(data.narrationReadiness.arabicVoiceMatching, "MANUAL_ARABIC_NARRATION_REQUIRED");
  assert.equal(data.narrationReadiness.status, "BLOCKED_MANUAL_NARRATION");
  assert.equal(data.narrationReadiness.expectedAudioAssets, 420);
  assert.equal(data.narrationReadiness.approvedAudioAssets, 0);
});

test("render handoff plan is local-only and gives manual renderer exact inputs", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const handoff = createRenderHandoffPlan(data);
  assert.equal(handoff.status, "BLOCKED_FFMPEG_OR_MANUAL_RENDER_REQUIRED");
  assert.equal(handoff.publicationAllowed, false);
  assert.equal(handoff.realNetworkActionsPerformed, false);
  assert.equal(handoff.totals.renderManifests, 560);
  assert.equal(handoff.totals.blockedManifests, 560);
  assert.ok(handoff.paths.sampleManifest.endsWith("/renders/manifest.json"));
  assert.ok(handoff.sampleFfmpegCommand.includes("ffmpeg -y"));
  assert.ok(handoff.localValidationCommands.renderStatus.includes("academy:render:status"));
  assert.ok(handoff.manualSteps.some((item) => item.includes("DRAFT")));
});

test("manual handoff readiness blocks publication and lists external work", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const handoff = createManualHandoffReadiness(data);
  assert.equal(handoff.status, "BLOCKED_MANUAL_HANDOFF");
  assert.equal(handoff.publicationAllowed, false);
  assert.equal(handoff.realNetworkActionsPerformed, false);
  assert.equal(handoff.totals.tutorials, 140);
  assert.equal(handoff.totals.draftQueueItems, data.publicationQueue.length);
  assert.ok(handoff.requiredExternalActions.some((item) => item.includes("FFmpeg")));
  assert.ok(handoff.requiredExternalActions.some((item) => item.includes("OAuth")));
  assert.ok(handoff.commands.validateAll.includes("academy:validate:all"));
  assert.ok(handoff.commands.renderStatus.includes("academy:render:status"));
  assert.equal(handoff.approvalPhraseRequired, "OWNER_APPROVES_SOCIAL_PUBLICATION");
});

test("narration handoff plan blocks render approval until audio is reviewed", () => {
  const data = createFullProduction({ ffmpegAvailable: false });
  const handoff = createNarrationHandoffPlan(data);
  assert.equal(handoff.status, "BLOCKED_MANUAL_NARRATION");
  assert.equal(handoff.publicationAllowed, false);
  assert.equal(handoff.realNetworkActionsPerformed, false);
  assert.equal(handoff.realMicrophoneCapturePerformed, false);
  assert.equal(handoff.cloudTtsEnabled, false);
  assert.equal(handoff.automaticVoiceCloning, false);
  assert.equal(handoff.totals.expectedAudioAssets, 420);
  assert.equal(handoff.totals.approvedAudioAssets, 0);
  assert.equal(handoff.perLanguage.length, 3);
  assert.ok(handoff.paths.sampleScript.endsWith("/scripts/script-ar.json"));
  assert.ok(handoff.requiredChecks.some((item) => item.includes("consent")));
  assert.ok(handoff.safeLocalCommands.narrationStatus.includes("academy:narration:status"));
  assert.equal(handoff.approvalPhraseRequired, "OWNER_APPROVES_NARRATION_FOR_RENDER");
});

test("comments and community adapters never automate replies", () => {
  const comments = createCommentsCommunityFoundation();
  assert.equal(comments.length, 7);
  assert.ok(comments.every((item) => item.enabled === false));
  assert.ok(comments.every((item) => item.automaticReply === false));
  assert.ok(comments.every((item) => item.automaticDelete === false));
  assert.ok(comments.every((item) => item.scrapingAllowed === false));
});

test("Academy UI exposes requested tabs and counts", () => {
  const app = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "App.jsx"), "utf8");
  const summary = createAcademyFullSummary(createFullProduction());
  for (const tab of ["Dashboard", "Features", "Curriculum", "Tutorials", "Scripts", "Storyboards", "Captures", "Renders", "Captions", "Thumbnails", "Carousels", "Platform Packages", "Campaigns", "Schedule", "OAuth", "Queue", "Reviews", "Analytics", "Outdated Content", "Reports", "Settings"]) {
    assert.ok(summary.tabs.includes(tab), tab);
  }
  assert.ok(app.includes("createAcademyFullSummary"));
  assert.ok(app.includes("blockedFfmpeg"));
  assert.ok(app.includes("approvalReadyItems"));
  assert.ok(app.includes("reviewEvidenceStatus"));
  assert.ok(app.includes("evidenceTemplateStatus"));
  assert.ok(app.includes("evidenceWorkingStatus"));
  assert.ok(app.includes("evidenceAuditStatus"));
  assert.ok(app.includes("evidenceArtifactIssues"));
  assert.ok(app.includes("evidenceFreshnessIssues"));
  assert.ok(app.includes("evidenceProvenanceIssues"));
  assert.ok(app.includes("evidenceConsistencyIssues"));
  assert.equal(summary.totalTutorials, 140);
  assert.equal(summary.publicationQueueItems, 700);
  assert.equal(summary.approvalReadyItems, 0);
  assert.equal(summary.reviewEvidenceStatus, "BLOCKED_REVIEW_EVIDENCE");
  assert.equal(summary.evidenceTemplateStatus, "TEMPLATE_ONLY_NO_APPROVALS_IMPORTED");
  assert.equal(summary.evidenceWorkingStatus, "WORKING_FILE_PENDING_HUMAN_REVIEW");
  assert.equal(summary.evidenceAuditStatus, "IMPORTED_EVIDENCE_BLOCKED");
  assert.ok(summary.evidenceAuditBlockers > 0);
  assert.equal(summary.evidenceArtifactIssues, 0);
  assert.equal(summary.evidenceFreshnessIssues, 0);
  assert.equal(summary.evidenceProvenanceIssues, 0);
  assert.equal(summary.evidenceConsistencyIssues, 0);
  assert.ok(summary.reviewEvidenceBlockers > 0);
  assert.equal(summary.draftQueueItems, 700);
});

test("generated full production reports are valid when present", () => {
  const reportPath = path.join(root, "reports", "UAOS_SOCIAL_FULL_PRODUCTION_REPORT.json");
  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    assert.equal(report.status, "SOCIAL_LOCAL_REVIEW_READY");
    assert.equal(report.counts.tutorials, 140);
    assert.equal(report.counts.published, 0);
  }
});
