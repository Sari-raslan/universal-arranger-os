import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: "utf8",
    shell: false
  });
}

function tail(text) {
  return String(text || "").split(/\r?\n/).slice(-12).join("\n");
}

const checks = [];

function addCheck(id, label, pass, detail = {}) {
  checks.push({ id, label, pass, detail });
}

const policyPath = path.join(app, "src/uaos-local-music-engine/final-local-gate/final-local-gate-policy.json");
addCheck("policy-exists", "Final local gate policy exists", fs.existsSync(policyPath));

if (fs.existsSync(policyPath)) {
  const policy = JSON.parse(fs.readFileSync(policyPath, "utf8"));
  addCheck("policy-format", "Final local gate policy format is valid", policy.format === "UAOS_FINAL_LOCAL_GATE_POLICY");
  addCheck("hard-locks", "Hard locks are safe", policy.hardLocks?.deploy === false &&
    policy.hardLocks?.audioRendering === false &&
    policy.hardLocks?.midiExport === false &&
    policy.hardLocks?.keyboardWriter === false &&
    policy.hardLocks?.keyboardOutput === false &&
    policy.hardLocks?.productionParser === false);
}

const qa = run(process.execPath, ["scripts/qa/verify-local-music-engine-all.mjs"]);
addCheck("all-local-qa", "All local QA scripts pass", qa.status === 0, {
  stdoutTail: tail(qa.stdout),
  stderrTail: tail(qa.stderr)
});

const build = run("npm", ["run", "build"], { cwd: app });
addCheck("build", "npm run build passes", build.status === 0, {
  stdoutTail: tail(build.stdout),
  stderrTail: tail(build.stderr)
});

const appJsStatus = run("git", ["status", "--porcelain", "--", "uaos-live-clean/src/App.jsx"]);
addCheck("app-js-untouched", "App.jsx has no unstaged/staged changes", String(appJsStatus.stdout || "").trim() === "");

const result = {
  format: "UAOS_FINAL_LOCAL_GATE_RESULT",
  version: "1.0.0",
  createdAt: new Date().toISOString(),
  status: checks.every((check) => check.pass) ? "PASS" : "FAIL",
  checks,
  summary: {
    total: checks.length,
    passCount: checks.filter((check) => check.pass).length,
    failCount: checks.filter((check) => !check.pass).length
  },
  safety: {
    localOnly: true,
    noDeployAction: true,
    noMidiExport: true,
    noAudioRender: true,
    noKeyboardWriter: true,
    noKeyboardOutput: true,
    noProductionParser: true
  }
};

console.log(JSON.stringify(result, null, 2));

if (result.status !== "PASS") {
  process.exit(1);
}
