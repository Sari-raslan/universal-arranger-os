/**
 * Customer product automation completeness checks (no deploy / no payment).
 */
import fs from "node:fs";
import path from "node:path";

const SKUS = [
  {
    id: "arranger-studio",
    rcDir: "release-candidates/UAOS-ARRANGER-STUDIO-V14",
    start: "START-UAOS-ARRANGER-STUDIO.bat",
    stop: "STOP-UAOS-ARRANGER-STUDIO.bat"
  },
  {
    id: "midi-toolkit",
    rcDir: "release-candidates/UAOS-MIDI-TOOLKIT-V14",
    start: "START-UAOS-MIDI-TOOLKIT.bat",
    stop: "STOP-UAOS-MIDI-TOOLKIT.bat"
  },
  {
    id: "singy",
    rcDir: "release-candidates/UAOS-SINGY-V14",
    start: "START-SINGY.bat",
    stop: "STOP-SINGY.bat"
  }
];

export function auditProductAutomations(platformRoot = process.cwd()) {
  const runtimeModules = [
    "backend/src/productRuntime/portManager.js",
    "backend/src/productRuntime/projectStore.js",
    "backend/src/productRuntime/diagnosticsSafe.js",
    "backend/src/commercial/licenseGeneration.js",
    "backend/src/convert/dryRun.js",
    "scripts/assemble-v14-products.mjs"
  ];
  const moduleHits = runtimeModules.map((rel) => ({
    path: rel,
    exists: fs.existsSync(path.join(platformRoot, rel))
  }));

  const skuResults = SKUS.map((sku) => {
    const dir = path.join(platformRoot, sku.rcDir);
    const start = path.join(dir, sku.start);
    const stop = path.join(dir, sku.stop);
    return {
      id: sku.id,
      rcDirExists: fs.existsSync(dir),
      startExists: fs.existsSync(start),
      stopExists: fs.existsSync(stop),
      ok: fs.existsSync(dir) && fs.existsSync(start) && fs.existsSync(stop)
    };
  });

  const ok = moduleHits.every((m) => m.exists) && skuResults.every((s) => s.ok);
  return {
    schema: "uaos.product.automation-audit/v1",
    ok,
    skus: skuResults,
    modules: moduleHits,
    wheaHeavyPackaging: "DEFERRED",
    productionDeploy: false,
    paymentActivation: false,
    electronHeavy: "DEFERRED_WHEA"
  };
}
