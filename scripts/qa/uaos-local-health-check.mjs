import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

const checks = [];

function check(id, label, pass) {
  checks.push({ id, label, pass });
}

check("app", "uaos-live-clean exists", fs.existsSync(app));
check("index", "index page exists", fs.existsSync(path.join(app, "public/uaos-local-music-engine/index.html")));
check("full-gate", "full gate exists", fs.existsSync(path.join(app, "public/uaos-local-music-engine/full-local-product-gate-v1.html")));
check("agent-center", "agent center exists", fs.existsSync(path.join(app, "public/uaos-local-music-engine/agent-command-center.html")));
check("qa", "full gate QA exists", fs.existsSync(path.join(root, "scripts/qa/verify-full-local-product-gate-v1.mjs")));

const appJs = spawnSync("git", ["status", "--porcelain", "--", "uaos-live-clean/src/App.jsx"], {
  cwd: root,
  encoding: "utf8"
});
check("app-js", "App.jsx untouched", (appJs.stdout || "").trim() === "");

const out = {
  format: "UAOS_LOCAL_HEALTH_CHECK",
  version: "1.0.0-safe-repair",
  status: checks.every(c => c.pass) ? "PASS" : "FAIL",
  checks,
  summary: {
    total: checks.length,
    passCount: checks.filter(c => c.pass).length,
    failCount: checks.filter(c => !c.pass).length
  }
};

console.log(JSON.stringify(out, null, 2));
if (out.status !== "PASS") process.exit(1);
