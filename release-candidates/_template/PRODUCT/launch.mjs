/**
 * UAOS Arranger Studio — Private Pilot launcher (Windows).
 * Starts local server and opens browser. No npm/git/repo required.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.UAOS_PILOT_PORT || 5199);
const HOST = "127.0.0.1";

process.env.UAOS_PILOT_ROOT = ROOT;
process.env.UAOS_PILOT_DATA = path.join(ROOT, "DATA");
process.env.PORT = String(PORT);
fs.mkdirSync(process.env.UAOS_PILOT_DATA, { recursive: true });

const serverPath = path.join(ROOT, "PRODUCT", "pilot-server.cjs");
const child = spawn(process.execPath, [serverPath], {
  cwd: ROOT,
  env: process.env,
  stdio: "inherit"
});

function waitForHealth(retries = 30) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      const req = http.get(`http://${HOST}:${PORT}/api/pilot/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve(true);
        else retry();
      });
      req.on("error", retry);
      req.setTimeout(500, () => { req.destroy(); retry(); });
    };
    const retry = () => {
      n += 1;
      if (n >= retries) reject(new Error("Pilot server did not start"));
      else setTimeout(tick, 250);
    };
    tick();
  });
}

waitForHealth()
  .then(() => {
    const url = `http://${HOST}:${PORT}/`;
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    } else {
      console.log(`Open ${url}`);
    }
    console.log(`UAOS Arranger Studio pilot running at ${url}`);
  })
  .catch((err) => {
    console.error(err.message);
    child.kill();
    process.exit(1);
  });

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill());
process.on("SIGTERM", () => child.kill());
