import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "AGENTS.md",
  "uaos-ai-factory/README.md",
  "uaos-ai-factory/agents/product-manager.md",
  "uaos-ai-factory/agents/architect.md",
  "uaos-ai-factory/agents/frontend-worker.md",
  "uaos-ai-factory/agents/music-engine-worker.md",
  "uaos-ai-factory/agents/library-worker.md",
  "uaos-ai-factory/agents/qa-worker.md",
  "uaos-ai-factory/agents/reviewer.md",
  "uaos-ai-factory/agents/cost-guard.md",
  "uaos-ai-factory/agents/release-manager.md",
  "uaos-ai-factory/policies/cost-control.policy.md",
  "uaos-ai-factory/policies/safety-gates.policy.md",
  "uaos-ai-factory/policies/no-real-writer.policy.md",
  "uaos-ai-factory/policies/no-payment.policy.md",
  "uaos-ai-factory/policies/no-deploy.policy.md",
  "uaos-ai-factory/policies/no-fake-premium-claims.policy.md",
  "uaos-ai-factory/policies/proprietary-content.policy.md",
  "uaos-ai-factory/policies/branch-and-pr.policy.md",
  "uaos-ai-factory/workflows/linear-to-github.workflow.md",
  "uaos-ai-factory/workflows/issue-to-pr.workflow.md",
  "uaos-ai-factory/workflows/pr-review.workflow.md",
  "uaos-ai-factory/workflows/failed-ci-fix.workflow.md",
  "uaos-ai-factory/workflows/daily-report.workflow.md",
  "uaos-ai-factory/workflows/release-gate.workflow.md",
  "uaos-ai-factory/prompts/copilot-cloud-agent-task-template.md",
  "uaos-ai-factory/prompts/codex-senior-engineer-template.md",
  "uaos-ai-factory/prompts/reviewer-template.md",
  "uaos-ai-factory/prompts/qa-template.md",
  "uaos-ai-factory/prompts/cost-guard-template.md",
  "uaos-ai-factory/reports/AI_FACTORY_STATE.json",
  "uaos-ai-factory/reports/DAILY_REPORT_TEMPLATE.md",
  "uaos-ai-factory/reports/AI_FACTORY_BOOTSTRAP_V1_REPORT.md",
  ".github/ISSUE_TEMPLATE/uaos-ai-task.yml",
  ".github/ISSUE_TEMPLATE/uaos-bug.yml",
  ".github/ISSUE_TEMPLATE/uaos-safe-feature.yml",
  ".github/pull_request_template.md",
  ".github/workflows/uaos-ci.yml",
  ".github/workflows/uaos-pr-safety-check.yml"
];

const forbidden = [
  "vercel --prod",
  "vercel deploy --prod",
  "stripe live",
  "production payment",
  "force push",
  "git push --force",
  "real keyboard writer enabled",
  "real .STY export enabled",
  "real .SET export enabled",
  "commercial premium library ready"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    failures.push(`Missing required file: ${file}`);
  }
}

const factoryRoot = path.join(root, "uaos-ai-factory");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

for (const file of walk(factoryRoot)) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const policyLines = new Set();
  let inPolicyBlock = false;
  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes("blocked actions") || lowerLine.includes('"safetygates"') || lowerLine.includes('"blockedactions"')) {
      inPolicyBlock = true;
    }
    if (inPolicyBlock) policyLines.add(index);
    if (inPolicyBlock && (lowerLine.trim().startsWith("]") || (lowerLine.startsWith("## ") && !lowerLine.includes("blocked actions")))) {
      inPolicyBlock = false;
    }
  });
  for (const phrase of forbidden) {
    const phraseLower = phrase.toLowerCase();
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      const previousLine = index > 0 ? lines[index - 1].toLowerCase() : "";
      const policyContext =
        lowerLine.includes("blocked") ||
        lowerLine.includes("forbidden") ||
        lowerLine.includes("not allowed") ||
        lowerLine.includes("must not") ||
        lowerLine.includes("no ") ||
        previousLine.includes("blocked actions") ||
        previousLine.includes('"safetygates"') ||
        previousLine.includes('"blockedactions"') ||
        lowerLine.includes('"blockedactions"') ||
        lowerLine.includes('"safetygates"') ||
        policyLines.has(index) ||
        lowerLine.trim().startsWith('"force push"');
      if (lowerLine.includes(phraseLower) && !policyContext) {
        failures.push(
          `Forbidden phrase "${phrase}" found in ${path.relative(root, file)}:${index + 1}`
        );
      }
    });
    if (phrase === "git push --force" && text.toLowerCase().includes(phraseLower)) {
      failures.push(`Forbidden command "${phrase}" found in ${path.relative(root, file)}`);
    }
  }
}

if (failures.length > 0) {
  console.error("UAOS AI Factory Safety Check: FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("UAOS AI Factory Safety Check: PASS");
