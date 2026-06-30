import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "uaos-ai-factory/local-demo-evidence-pack/OPEN_THIS_FIRST.md",
  "uaos-ai-factory/local-demo-evidence-pack/START_HERE_OWNER_REVIEW.md",
  "uaos-ai-factory/local-demo-evidence-pack/POLISHED_EVIDENCE_PACK_OVERVIEW.md",
  "uaos-ai-factory/local-demo-evidence-pack/JOBCENTER_SAFE_EVIDENCE_SUMMARY_DE_POLISHED.md",
  "uaos-ai-factory/local-demo-evidence-pack/SUPPORTER_SAFE_EVIDENCE_SUMMARY_DE_POLISHED.md",
  "uaos-ai-factory/local-demo-evidence-pack/OWNER_ARABIC_EXPLANATION_POLISHED.md",
  "uaos-ai-factory/local-demo-evidence-pack/FINAL_LOCAL_DEMO_EVIDENCE_CHECKLIST.md",
  "uaos-ai-factory/local-demo-evidence-pack/LOCAL_DEMO_EVIDENCE_PACK_READY_SEAL.md",
  "uaos-ai-factory/local-demo-evidence-pack/PDF_CONTENT_OUTLINE_DE.md",
  "uaos-ai-factory/local-demo-evidence-pack/POWERPOINT_SLIDE_OUTLINE_JOBCENTER_DE.md"
];
const forbiddenClaims = [
  "ready for keyboard",
  "payment enabled",
  "production ready",
  "live release",
  "keyboard transfer ready",
  "vercel ready"
];
const failures = [];
function abs(file) { return path.join(root, file); }
for (const file of requiredFiles) if (!existsSync(abs(file))) failures.push(`Missing: ${file}`);
for (const file of requiredFiles.filter((file) => existsSync(abs(file)))) {
  const lower = readFileSync(abs(file), "utf8").toLowerCase();
  for (const claim of forbiddenClaims) if (lower.includes(claim)) failures.push(`Forbidden claim "${claim}" in ${file}`);
}
const status = {
  schema: "uaos-evidence-pack-qa-status-v1",
  status: failures.length === 0 ? "PASS" : "FAIL",
  requiredFiles,
  forbiddenClaims,
  failures,
  safety: { localOnly: true, noPdfPptxCreated: true, realKeyboardOutput: "NO", keyboardTransfer: "NO" }
};
writeFileSync(abs("uaos-ai-factory/EVIDENCE_PACK_QA_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(abs("uaos-ai-factory/EVIDENCE_PACK_QA_STATUS.md"), `# Evidence Pack QA Status\n\nStatus: ${status.status}\n\nFailures:\n${failures.length ? failures.map((f) => `- ${f}`).join("\n") : "- None"}\n`);
console.log("UAOS Evidence Pack QA Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS Evidence Pack QA Check: PASS");

