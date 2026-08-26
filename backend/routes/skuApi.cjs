/**
 * SKU API router — dynamic import of ESM SKU modules from CJS server.
 */
const express = require("express");

let arrangerSku = null;
let midiSku = null;
let singySku = null;

async function loadSkus() {
  if (!arrangerSku) {
    arrangerSku = await import("../src/sku/arrangerStudioSku.js");
    midiSku = await import("../src/sku/midiToolkitSku.js");
    singySku = await import("../src/sku/singySku.js");
  }
  return { arrangerSku, midiSku, singySku };
}

function createSkuApiRouter() {
  const router = express.Router();

  router.get("/arranger-studio/status", async (_req, res) => {
    try {
      const { arrangerSku: a } = await loadSkus();
      res.json({ ok: true, ...a.getProductStatus() });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.get("/arranger-studio/demos", async (_req, res) => {
    try {
      const { arrangerSku: a } = await loadSkus();
      res.json({ ok: true, demos: a.getDemoCatalog() });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.post("/arranger-studio/project/new", async (req, res) => {
    try {
      const { arrangerSku: a } = await loadSkus();
      res.json(a.createNewProject(req.body || {}));
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.post("/arranger-studio/demo/:id/open", async (req, res) => {
    try {
      const { arrangerSku: a } = await loadSkus();
      res.json(a.openDemoProject(req.params.id));
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.get("/arranger-studio/compatibility", async (_req, res) => {
    try {
      const { arrangerSku: a } = await loadSkus();
      res.json({ ok: true, matrix: a.getCompatibilityMatrix() });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.post("/arranger-studio/workflows/run-all", async (_req, res) => {
    try {
      const { arrangerSku: a } = await loadSkus();
      res.json(a.runAllCustomerWorkflows());
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.get("/midi-toolkit/status", async (_req, res) => {
    try {
      const { midiSku: m } = await loadSkus();
      res.json({ ok: true, ...m.getMidiToolkitStatus() });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.get("/midi-toolkit/compatibility", async (_req, res) => {
    try {
      const { midiSku: m } = await loadSkus();
      res.json({ ok: true, matrix: m.getCompatibilityMatrix() });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.get("/singy/launcher", async (_req, res) => {
    try {
      const { singySku: s } = await loadSkus();
      res.json({ ok: true, ...s.getSingyLauncher(), brain: s.getSingyBrainStatus() });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  router.post("/singy/run/:mode", async (req, res) => {
    try {
      const { singySku: s } = await loadSkus();
      res.json(s.runSingyMode(req.params.mode.toUpperCase(), req.body || {}));
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  return router;
}

module.exports = { createSkuApiRouter };
