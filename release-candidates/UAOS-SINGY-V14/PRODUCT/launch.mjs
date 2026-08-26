/**
 * UAOS V14 smart launcher — port conflict handling, reuse healthy instance.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "DATA");
const PREFERRED = Number(process.env.UAOS_PILOT_PORT || 5201);
const HOST = "127.0.0.1";
const ALT = [5301,5401,5501];
const PRODUCT_ID = "Singy";

fs.mkdirSync(DATA, { recursive: true });
process.env.UAOS_PILOT_ROOT = ROOT;
process.env.UAOS_PILOT_DATA = DATA;

const portMod = await import(pathToFileURL(path.join(ROOT, "PRODUCT", "backend", "src", "productRuntime", "portManager.js")).href);
const plan = await portMod.resolveStartPort({
  preferredPort: PREFERRED,
  host: HOST,
  dataDir: DATA,
  productId: PRODUCT_ID,
  altPorts: ALT
});
const errInfo = portMod.customerErrorText(plan.code, plan.message);
console.log(plan.message);
if (errInfo.hint) console.log(errInfo.hint);

if (plan.action === "fail") {
  console.error("\nUAOS could not start.\n" + plan.message + "\n");
  process.exit(1);
}

function openBrowser(port) {
  const url = `http://${HOST}:${port}/`;
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else {
    console.log("Open " + url);
  }
  console.log("UAOS ready at " + url);
}

if (plan.action === "reuse") {
  openBrowser(plan.port);
  process.exit(0);
}

process.env.PORT = String(plan.port);
process.env.UAOS_PILOT_PORT = String(plan.port);
portMod.writeOwnPid(DATA, { port: plan.port, product: PRODUCT_ID, version: "v14", host: HOST });

const child = spawn(process.execPath, [path.join(ROOT, "PRODUCT", "pilot-server.cjs")], {
  cwd: ROOT,
  env: process.env,
  stdio: "inherit"
});

function waitHealth(port, retries = 40) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      const req = http.get(`http://${HOST}:${port}/api/pilot/health`, (res) => {
        res.resume();
        res.statusCode === 200 ? resolve(true) : retry();
      });
      req.on("error", retry);
      req.setTimeout(500, () => { req.destroy(); retry(); });
    };
    const retry = () => {
      n += 1;
      if (n >= retries) reject(new Error("Server did not start. Close other windows and try again."));
      else setTimeout(tick, 250);
    };
    tick();
  });
}

function cleanup() {
  try { portMod.clearOwnPid(DATA); } catch {}
}

waitHealth(plan.port)
  .then(() => openBrowser(plan.port))
  .catch((e) => {
    console.error(e.message);
    cleanup();
    child.kill();
    process.exit(1);
  });

child.on("exit", (code) => { cleanup(); process.exit(code ?? 0); });
process.on("SIGINT", () => { child.kill(); cleanup(); });
process.on("SIGTERM", () => { child.kill(); cleanup(); });
