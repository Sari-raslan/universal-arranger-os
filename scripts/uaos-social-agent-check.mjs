import fs from "node:fs";
import path from "node:path";
import {
  PLATFORM_ADAPTERS,
  UAOSSocialMediaEducationAgent,
  createAgentReport,
  createCapturePlan,
  createCarouselPlan,
  createRenderPlan,
  createShortFormPlan,
  createStoryPlan,
  discoverFeatureInventory,
  validateSocialContent
} from "../uaos-live-clean/src/social/uaosSocialMediaEducationAgent.js";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const agent = new UAOSSocialMediaEducationAgent({ mode: "dry-run" });
const campaign = agent.createCampaign("ar");
const features = discoverFeatureInventory();
const report = createAgentReport();
const sampleTutorial = campaign.tutorials[0];
const sampleContent = campaign.contents[0];
const validationErrors = campaign.contents
  .map((content) => ({ contentId: content.contentId, validation: validateSocialContent(content) }))
  .filter((item) => !item.validation.valid);

const publishPreview = await agent.dryRunPublish(sampleContent);

const summary = {
  ...report,
  passed: validationErrors.length === 0
    && PLATFORM_ADAPTERS.length >= 23
    && features.length >= 20
    && campaign.tutorials.length >= 100
    && campaign.contents.every((content) => content.dryRun === true)
    && publishPreview.published === false
    && publishPreview.networkRequestSent === false,
  campaign: {
    campaignId: campaign.campaignId,
    tutorialCount: campaign.tutorials.length,
    contentCount: campaign.contents.length,
    scheduleCount: campaign.schedule.length,
    publicPublishingEnabled: campaign.publicPublishingEnabled
  },
  sample: {
    tutorial: sampleTutorial,
    content: sampleContent,
    shortForm15: createShortFormPlan(sampleTutorial, 15),
    shortForm30: createShortFormPlan(sampleTutorial, 30),
    shortForm60: createShortFormPlan(sampleTutorial, 60),
    shortForm90: createShortFormPlan(sampleTutorial, 90),
    carousel: createCarouselPlan(sampleTutorial),
    story: createStoryPlan(sampleTutorial),
    capture: createCapturePlan(sampleTutorial),
    render: createRenderPlan(sampleTutorial),
    publishPreview
  },
  validationErrors,
  safety: {
    defaultMode: "dry-run",
    publicPostingPerformed: false,
    oauthOrApiRequiredForLivePublish: true,
    explicitApprovalRequiredForLivePublish: true,
    networkRequestSent: false,
    realUserDataAllowedInCapture: false,
    renderer: "ffmpeg-only"
  }
};

fs.writeFileSync(path.join(reportsDir, "UAOS_SOCIAL_MEDIA_AGENT_REPORT.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
fs.writeFileSync(
  path.join(reportsDir, "UAOS_SOCIAL_MEDIA_AGENT_REPORT.md"),
  [
    "# UAOS Social Media Education & Publishing Agent Report",
    "",
    `Status: ${summary.passed ? "PASS_DRY_RUN_FOUNDATION" : "FAILED"}`,
    "",
    `Code name: ${summary.codeName}`,
    `Marketing name: ${summary.marketingName}`,
    `Default mode: ${summary.mode}`,
    `Platform adapters: ${summary.platformAdapters}`,
    `Feature inventory count: ${summary.featureCount}`,
    `Curriculum sections: ${summary.curriculumSections}`,
    `Mandatory tutorial count: ${summary.mandatoryTutorialCount}`,
    `Generated content drafts: ${summary.campaign.contentCount}`,
    "",
    "## Safety",
    "",
    "- No public posting was performed.",
    "- All adapters default to dry-run.",
    "- Live publishing requires OAuth/API evidence and explicit approval.",
    "- Capture plans use mock accounts, mock MIDI, mock hardware and synthetic audio.",
    "- Rendering metadata is FFmpeg-only.",
    "",
    "## External blockers",
    "",
    "- Platform OAuth/API credentials.",
    "- Legal/brand approval for public posts.",
    "- Manual review of generated lessons, captions, thumbnails and translated text.",
    "- Real analytics ingestion approval."
  ].join("\n") + "\n",
  "utf8"
);

console.log(`UAOS social media agent status: ${summary.passed ? "PASS_DRY_RUN_FOUNDATION" : "FAILED"}`);
if (!summary.passed) process.exit(1);
