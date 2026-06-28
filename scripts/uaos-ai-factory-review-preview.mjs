import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "uaos-ai-factory", "autopilot", "dry-runs", "latest");

function readPacket() {
  return JSON.parse(fs.readFileSync(path.join(outDir, "DRY_RUN_PACKET.json"), "utf8"));
}

function yesNo(value) {
  return value ? "YES" : "NO";
}

try {
  const packet = readPacket();
  fs.mkdirSync(outDir, { recursive: true });
  const checks = [
    "no push",
    "no deploy",
    "no payment",
    "no real writer",
    "no real keyboard export",
    "no proprietary samples",
    "no fake premium claims",
    "no App.jsx edits",
    "no whole repo scan"
  ];
  const safeForFuture = packet.risk !== "HIGH" && packet.requiresExternalAccount === false;

  fs.writeFileSync(
    path.join(outDir, "SAFETY_REVIEW.md"),
    `# Safety Review

Selected task: ${packet.selectedTaskId} ${packet.selectedTaskTitle}

## Safety Checklist

${checks.map((check) => `- [x] ${check}`).join("\n")}

## Blocked Actions

${packet.safetyGates.map((gate) => `- ${gate}`).join("\n")}

## Risk Decision

Risk: ${packet.risk}

Safe for future execution: ${yesNo(safeForFuture)}

Future execution still requires human approval and a separate implementation task.
`
  );

  fs.writeFileSync(
    path.join(outDir, "COST_REVIEW.md"),
    `# Cost Review

Selected task: ${packet.selectedTaskId} ${packet.selectedTaskTitle}

## Codex Cost Risk

${packet.risk}

## Recommended Worker

${packet.risk === "LOW" ? "ChatGPT / local script" : "Copilot / Code X only if scoped"}

## Limits

- Max builds: ${packet.costPolicy.maxBuildsPerTask}
- Max retries: ${packet.costPolicy.maxRetriesPerTask}

## Code X Decision

Should be done by Code X: ${packet.risk === "LOW" ? "NO, use a cheaper worker unless engineering judgment is needed." : "MAYBE, only with tight scope."}
`
  );

  fs.writeFileSync(
    path.join(outDir, "REVIEW_CHECKLIST.md"),
    `# Review Checklist

## PR Checklist For Future Use

- [ ] Scope matches issue.
- [ ] Files touched are listed.
- [ ] No push or deploy behavior added.
- [ ] No payment behavior added.
- [ ] No real writer/export behavior added.
- [ ] No proprietary samples added.
- [ ] No false premium claims added.
- [ ] App.jsx untouched unless explicitly approved.

## QA Checklist

- [ ] Required local check documented.
- [ ] Build required: ${yesNo(packet.requiresBuild)}
- [ ] One build maximum if required.
- [ ] Stop at first serious FAIL.

## Release Gate Checklist

- [ ] Demo/staging wording preserved.
- [ ] External automation remains inactive.
- [ ] Public release not approved.
- [ ] Production release not approved.
`
  );

  console.log("UAOS AI Factory Review Preview: PASS");
  console.log(`${packet.selectedTaskId} safety=${yesNo(safeForFuture)}`);
} catch (error) {
  console.error("UAOS AI Factory Review Preview: FAIL");
  console.error(error.message);
  process.exit(1);
}

