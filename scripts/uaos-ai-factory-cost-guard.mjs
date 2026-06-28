import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const factory = path.join(root, "uaos-ai-factory");
const autopilot = path.join(factory, "autopilot");
const backlog = path.join(factory, "backlog");

const blockedPhrases = [
  "whole repo scan",
  "push",
  "deploy",
  "payment",
  "real keyboard writer",
  "real keyboard export",
  "proprietary sample copying",
  "fake premium claims"
];

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(autopilot, name), "utf8"));
}

function walkAllowed(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkAllowed(full);
    if (entry.name.endsWith(".json") || entry.name.endsWith(".md")) return [full];
    return [];
  });
}

function isPolicyContext(line) {
  const lower = line.toLowerCase();
  return (
    lower.includes("no ") ||
    lower.includes("do not") ||
    lower.includes("does not") ||
    lower.includes("blocked") ||
    lower.includes("forbidden") ||
    lower.includes("allowed\": false") ||
    lower.includes("allowed\":false") ||
    lower.includes("not active") ||
    lower.includes("not allowed") ||
    lower.includes("must not") ||
    lower.includes("avoid") ||
    lower.includes("inactive") ||
    lower.includes("planned")
  );
}

try {
  const budget = readJson("COST_BUDGET.json");
  const queue = readJson("TASK_QUEUE.json");
  const failures = [];

  if (budget.avoidWholeRepoScans !== true) failures.push("Whole repo scan avoidance is not enabled.");
  if (budget.avoidLoops !== true) failures.push("Loop avoidance is not enabled.");
  if (budget.maxBuildsPerTask > 1) failures.push("Build budget is too high.");
  if (budget.maxRetriesPerTask > 1) failures.push("Retry budget is too high.");

  for (const task of queue.tasks) {
    const taskLines = [task.title, task.expectedOutput, task.notes, ...(task.allowedFiles || [])];
    for (const phrase of blockedPhrases) {
      for (const line of taskLines) {
        const lower = String(line).toLowerCase();
        if (lower.includes(phrase) && !isPolicyContext(String(line))) {
          failures.push(`${task.id} appears to ask for blocked action: ${phrase}`);
        }
      }
    }
  }

  for (const file of [...walkAllowed(autopilot), ...walkAllowed(backlog)]) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    let inBlockedArray = false;
    lines.forEach((line, index) => {
      const lower = line.toLowerCase();
      if (lower.includes('"blockedactions"') || lower.includes('"safetygates"') || lower.includes("## blocked actions")) inBlockedArray = true;
      const previous = index > 0 ? lines[index - 1].toLowerCase() : "";
      const previousPolicyContext =
        previous.includes("blocked") ||
        previous.includes("forbidden") ||
        previous.includes("blockedactions") ||
        previous.includes("safetygates") ||
        previous.includes("must not") ||
        previous.includes("do not");
      for (const phrase of blockedPhrases) {
        if (lower.includes(phrase) && !isPolicyContext(line) && !previousPolicyContext && !inBlockedArray) {
          failures.push(`${path.relative(root, file)}:${index + 1} unsafe phrase: ${phrase}`);
        }
      }
      if (inBlockedArray && (lower.trim().startsWith("]") || (lower.startsWith("## ") && !lower.includes("blocked actions")))) inBlockedArray = false;
    });
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory Cost Guard: FAIL");
    failures.slice(0, 8).forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Cost Guard: PASS");
  console.log(`Tasks checked: ${queue.tasks.length}`);
} catch (error) {
  console.error("UAOS AI Factory Cost Guard: FAIL");
  console.error(error.message);
  process.exit(1);
}
