/**
 * UAOS V14 product server — Singy
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const ROOT = process.env.UAOS_PILOT_ROOT || path.join(__dirname, "..");
const DATA = process.env.UAOS_PILOT_DATA || path.join(ROOT, "DATA");
const APP = path.join(ROOT, "RUNTIME", "app");
const PORT = Number(process.env.PORT || 5201);
const HOST = "127.0.0.1";
const VERSION = "v14.0.0";
const PRODUCT = "Singy";
const errors = [];

fs.mkdirSync(DATA, { recursive: true });
const app = express();
app.use(express.json({ limit: "5mb" }));

let skuMod = null;
async function sku() {
  if (!skuMod) skuMod = await import(pathToFileURL(path.join(ROOT, "PRODUCT/backend/src/sku/singySku.js")).href);
  return skuMod;
}
async function portMgr() {
  return import(pathToFileURL(path.join(ROOT, "PRODUCT/backend/src/productRuntime/portManager.js")).href);
}
async function diag() {
  return import(pathToFileURL(path.join(ROOT, "PRODUCT/backend/src/productRuntime/diagnosticsSafe.js")).href);
}
async function store() {
  return import(pathToFileURL(path.join(ROOT, "PRODUCT/backend/src/productRuntime/projectStore.js")).href);
}

app.get("/api/pilot/health", (_q, r) => {
  r.json({ ok: true, product: PRODUCT, version: VERSION, mode: "V14_PRODUCTION_CANDIDATE", port: PORT });
});

app.get("/api/pilot/version", (_q, r) => {
  r.json({ ok: true, product: PRODUCT, version: VERSION, windowsDelivery: "PORTABLE_PRODUCTION_SHELL", wheaGate: "NOT_CLEARED", electronHeavy: "DEFERRED" });
});

app.post("/api/pilot/shutdown", async (_q, r) => {
  try {
    const pm = await portMgr();
    pm.clearOwnPid(DATA);
  } catch {}
  r.json({ ok: true, stopping: true });
  setTimeout(() => process.exit(0), 200);
});

app.get("/api/sku/singy/status", async (_q, r) => {
  try {
    const m = await sku();
    const status = m.getProductStatus ? m.getProductStatus() : m.getMidiProductStatus ? m.getMidiProductStatus() : m.getSingyProductStatus();
    r.json({ ok: true, ...status });
  } catch (e) {
    errors.push({ at: new Date().toISOString(), error: e.message });
    r.status(500).json({ ok: false, error: e.message, customerMessage: "Something went wrong loading product status. Try Export Diagnostics." });
  }
});


app.post("/api/sku/singy/mode/:mode", async (req,r)=>{try{const m=await sku();r.json(m.runSingyMode(req.params.mode.toUpperCase(),req.body||{}))}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.post("/api/sku/singy/workflows/run-all", async (_q,r)=>{try{const m=await sku();r.json(m.runAllSingyCustomerWorkflows())}catch(e){r.status(500).json({ok:false,error:e.message})}});


app.post("/api/pilot/project/save", async (req, r) => {
  try {
    const s = await store();
    r.json(s.saveProject(DATA, req.body || {}));
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message, customerMessage: "Could not save project. Check disk space and try again." });
  }
});
app.post("/api/pilot/project/autosave", async (req, r) => {
  try {
    const s = await store();
    r.json(s.autosaveProject(DATA, req.body || {}));
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message });
  }
});
app.get("/api/pilot/project/list", async (_q, r) => {
  try {
    const s = await store();
    r.json(s.listProjects(DATA));
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message });
  }
});
app.get("/api/pilot/project/:id", async (req, r) => {
  try {
    const s = await store();
    r.json(s.reopenProject(DATA, req.params.id === "autosave" ? null : req.params.id));
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message, customerMessage: "Could not reopen project." });
  }
});

app.get("/api/pilot/diagnostics", async (_q, r) => {
  try {
    const d = await diag();
    const m = await sku();
    const status = m.getProductStatus ? m.getProductStatus() : m.getMidiProductStatus ? m.getMidiProductStatus() : m.getSingyProductStatus();
    const built = d.buildSafeDiagnostics({
      product: PRODUCT,
      version: VERSION,
      classification: "V14_PRODUCTION_CANDIDATE",
      productState: { sku: status.sku || status.version, workflowsOk: status.workflows?.ok, cleanOk: status.cleanInstall?.ok },
      recentErrors: errors,
      compatibility: status.compatibilityMatrix || status.compatibility || [],
      rights: { unclearedShippedAssets: status.UNCLEARED_SHIPPED_ASSETS ?? 0 }
    });
    const s = await store();
    s.ensureProjectDirs(DATA);
    const file = path.join(DATA, "diagnostics", "diagnostics-" + Date.now() + ".json");
    fs.writeFileSync(file, JSON.stringify(built.bundle, null, 2));
    r.json({ ok: true, file: path.basename(file), ...built });
  } catch (e) {
    r.status(500).json({ ok: false, error: e.message });
  }
});

app.use(express.static(APP));
app.get("*", (_q, r) => r.sendFile(path.join(APP, "index.html")));

const server = app.listen(PORT, HOST, async () => {
  try {
    const pm = await portMgr();
    pm.writeOwnPid(DATA, { port: PORT, product: PRODUCT, version: VERSION, host: HOST });
  } catch {}
  console.log(PRODUCT, VERSION, "http://" + HOST + ":" + PORT);
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
