import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readText(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

try {
  const identity = readJson("uaos-ai-factory/platform/PLATFORM_IDENTITY.json");
  const target = readJson("uaos-ai-factory/platform/premium-library/PREMIUM_LIBRARY_TARGET.json");
  const metadata = readText("uaos-ai-factory/platform/premium-library/PREMIUM_LIBRARY_METADATA_POLICY.md");
  const schema = readJson("uaos-ai-factory/platform/premium-library/PREMIUM_LIBRARY_SCHEMA_DRAFT.json");
  const provenance = readJson("uaos-ai-factory/platform/premium-library/PREMIUM_LIBRARY_PROVENANCE_TEMPLATE.json");
  const qa = readText("uaos-ai-factory/platform/premium-library/PREMIUM_LIBRARY_QA_CHECKLIST.md");
  const noAudio = readText("uaos-ai-factory/platform/premium-library/PREMIUM_LIBRARY_NO_AUDIO_IMPORT_POLICY.md");
  const noCommercial = readText("uaos-ai-factory/platform/premium-library/PREMIUM_LIBRARY_NO_COMMERCIAL_READY_CLAIM_POLICY.md");
  const license = readText("uaos-ai-factory/platform/premium-library/PREMIUM_LIBRARY_LICENSE_REVIEW_CHECKLIST.md");
  const pipeline = readText("uaos-ai-factory/platform/premium-library/PREMIUM_LIBRARY_FUTURE_PIPELINE_PLAN.md");
  const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
  const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
  const ai007 = queue.tasks.find((task) => task.id === "AI-007");

  if (identity.platformName !== "AE Platform" || target.platform !== "AE Platform") failures.push("Platform is not AE Platform.");
  if (target.planStatus !== "local plan only" || target.integrationStatus !== "local plan only") failures.push("Premium library plan is not local-planning-only.");
  if (target.audioImported !== false || !noAudio.toLowerCase().includes("strictly prohibited")) failures.push("Audio import is not blocked.");
  if (target.samplesCopied !== false || !metadata.toLowerCase().includes("sample copying")) failures.push("Sample copying is not blocked.");
  if (target.proprietaryContentUsed !== false || !noAudio.toLowerCase().includes("proprietary")) failures.push("Proprietary content import is not blocked.");
  if (target.commercialReadyClaimed !== false || !noCommercial.toLowerCase().includes("not commercially ready")) failures.push("Commercial readiness claim is not blocked.");
  if (target.productionReleaseAllowed !== false || state.productionReleaseAllowed !== false) failures.push("productionReleaseAllowed must remain false.");
  if (state.externalAutomationReady !== false || target.externalAutomationReady !== false) failures.push("externalAutomationReady must remain false.");
  if (state.pushAllowed !== false) failures.push("pushAllowed must remain false.");
  if (state.deployAllowed !== false) failures.push("deployAllowed must remain false.");
  if (target.paymentAllowed !== false || state.paymentAllowed !== false) failures.push("paymentAllowed must remain false.");
  if (target.realWriterAllowed !== false || state.realWriterAllowed !== false) failures.push("realWriterAllowed must remain false.");
  if (!provenance || !Object.hasOwn(provenance, "sourceOwner")) failures.push("Provenance template is missing.");
  if (!qa.toLowerCase().includes("metadata complete") || !qa.toLowerCase().includes("legal safety")) failures.push("QA checklist is incomplete.");
  if (!license.toLowerCase().includes("license proof")) failures.push("License review checklist is incomplete.");
  if (!pipeline.toLowerCase().includes("future-only") && !pipeline.toLowerCase().includes("future-only phases")) failures.push("Future proof pipeline is not marked future/planned only.");
  if (schema.commercialClaimAllowed !== false) failures.push("Schema allows commercial claims.");
  const serializedSchema = JSON.stringify(schema).toLowerCase();
  if (serializedSchema.includes(".wav") || serializedSchema.includes(".aiff") || serializedSchema.includes("sample/")) failures.push("Schema includes audio/sample references.");
  if (!ai007 || ai007.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-007 is not marked DONE_LOCAL_PLAN_ONLY.");
  if (queue.tasks.some((task) => String(task.notes || "").toLowerCase().includes("ready for sale"))) failures.push("A task claims premium library is ready for sale.");

  if (failures.length > 0) {
    console.error("UAOS AI Factory Premium Library Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Premium Library Plan Check: PASS");
  console.log(`${target.planStatus}; audioImported=${target.audioImported}; AI-007=${ai007.status}`);
} catch (error) {
  console.error("UAOS AI Factory Premium Library Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}

