/**
 * Read-only adapter over the existing Singy WAV export foundation.
 * Does not modify the V13/singy-integration worktree.
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const FOUNDATION = "C:/UAOS_AGENT_FACTORY_WORKTREES/singy-integration/apps/desktop/src/singy/export/wavExportFoundation.cjs";

export function loadWavExportFoundation() {
  if (!existsSync(FOUNDATION)) {
    throw new Error("WAV export foundation is missing (READ_ONLY dependency).");
  }
  const require = createRequire(import.meta.url);
  return require(FOUNDATION);
}

export function createSharedExportSession(options = {}) {
  const mod = loadWavExportFoundation();
  return mod.createExportSession(options);
}
