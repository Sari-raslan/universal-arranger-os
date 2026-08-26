/**
 * Arranger Studio private pilot server — self-contained, local-only.
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const ROOT = process.env.UAOS_PILOT_ROOT || path.join(__dirname, "..");
const DATA = process.env.UAOS_PILOT_DATA || path.join(ROOT, "DATA");
const RUNTIME_APP = path.join(ROOT, "RUNTIME", "app");
const PORT = Number(process.env.PORT || 5199);
const HOST = "127.0.0.1";
const VERSION = "v11-pilot-rc1";

fs.mkdirSync(DATA, { recursive: true });

const app = express();
app.use(express.json({ limit: "5mb" }));

let arrangerSku = null;
async function sku() {
  if (!arrangerSku) {
    const modPath = pathToFileURL(path.join(ROOT, "PRODUCT", "backend", "src", "sku", "arrangerStudioSku.js")).href;
    arrangerSku = await import(modPath);
  }
  return arrangerSku;
}

app.get("/api/pilot/health", (_req, res) => {
  res.json({ ok: true, product: "UAOS Arranger Studio", version: VERSION, mode: "PRIVATE_PILOT_RC" });
});

app.get("/api/sku/arranger-studio/status", async (_req, res) => {
  try {
    const a = await sku();
    res.json({ ok: true, ...a.getProductStatus() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/sku/arranger-studio/demos", async (_req, res) => {
  try {
    const a = await sku();
    res.json({ ok: true, demos: a.getDemoCatalog() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/sku/arranger-studio/project/new", async (req, res) => {
  try {
    const a = await sku();
    res.json(a.createNewProject(req.body || {}));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/sku/arranger-studio/demo/:id/open", async (req, res) => {
  try {
    const a = await sku();
    res.json(a.openDemoProject(req.params.id));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/sku/arranger-studio/compatibility", async (_req, res) => {
  try {
    const a = await sku();
    res.json({ ok: true, matrix: a.getCompatibilityMatrix() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/sku/arranger-studio/workflows/run-all", async (_req, res) => {
  try {
    const a = await sku();
    res.json(a.runAllCustomerWorkflows());
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/sku/arranger-studio/export/midi", async (_req, res) => {
  try {
    const modPath = pathToFileURL(path.join(ROOT, "PRODUCT", "backend", "src", "export", "goldenSequencerMidi.js")).href;
    const { exportGoldenSequencerMidi } = await import(modPath);
    const midi = exportGoldenSequencerMidi({ tempo: 100, bars: 2 });
    const outDir = path.join(DATA, "exports");
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `export-${Date.now()}.mid`);
    fs.writeFileSync(file, midi.bytes);
    res.json({
      ok: midi.ok,
      path: path.basename(file),
      noteCount: midi.noteEvents.length,
      sha256: crypto.createHash("sha256").update(midi.bytes).digest("hex")
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/pilot/diagnostics", async (_req, res) => {
  try {
    const a = await sku();
    const status = a.getProductStatus();
    const bundle = {
      exportedAt: new Date().toISOString(),
      product: "UAOS Arranger Studio Early Access",
      version: VERSION,
      classification: "PRIVATE_PILOT_RC",
      pilotRoot: "[REDACTED]",
      dataDir: "[REDACTED]",
      workflows: status.workflows,
      cleanInstall: status.cleanInstall,
      publicRelease: false
    };
    const diagPath = path.join(DATA, "diagnostics");
    fs.mkdirSync(diagPath, { recursive: true });
    const file = path.join(diagPath, `diagnostics-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(bundle, null, 2));
    res.json({ ok: true, exported: path.basename(file), bundle });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use(express.static(RUNTIME_APP));
app.get("*", (_req, res) => {
  res.sendFile(path.join(RUNTIME_APP, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Pilot server ${VERSION} http://${HOST}:${PORT}`);
});
