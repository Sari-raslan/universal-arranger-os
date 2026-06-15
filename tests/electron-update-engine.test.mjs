import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  createUpdateEngine,
  initializeAutoUpdateEngine,
  resolveUpdatePolicy,
} from "../electron/updateEngine.js";

function createMockUpdater() {
  const handlers = new Map();
  return {
    autoDownload: true,
    autoInstallOnAppQuit: true,
    allowPrerelease: true,
    checkCount: 0,
    on(name, handler) {
      handlers.set(name, handler);
    },
    emit(name, value) {
      handlers.get(name)?.(value);
    },
    async checkForUpdates() {
      this.checkCount += 1;
      return { updateInfo: { version: "99.0.0" } };
    },
  };
}

test("update policy disables checks outside packaged builds", () => {
  assert.deepEqual(
    resolveUpdatePolicy({ app: { isPackaged: false }, autoUpdater: createMockUpdater(), env: {} }),
    { enabled: false, reason: "not-packaged" }
  );

  assert.deepEqual(
    resolveUpdatePolicy({ app: { isPackaged: true }, autoUpdater: null, env: {} }),
    { enabled: false, reason: "updater-unavailable" }
  );

  assert.deepEqual(
    resolveUpdatePolicy({
      app: { isPackaged: true },
      autoUpdater: createMockUpdater(),
      env: { UAOS_DISABLE_AUTO_UPDATES: "1" },
    }),
    { enabled: false, reason: "disabled-by-env" }
  );
});

test("update engine keeps install behavior manual and rate limits checks", async () => {
  const updater = createMockUpdater();
  const logs = [];
  const timers = [];
  let clock = 1000;
  const engine = createUpdateEngine({
    app: { isPackaged: true, getVersion: () => "11.1.0" },
    autoUpdater: updater,
    env: {
      UAOS_AUTO_UPDATE_STARTUP_DELAY_MS: "1",
      UAOS_AUTO_UPDATE_INTERVAL_MS: "1",
    },
    logger: (event, details) => logs.push({ event, details }),
    now: () => clock,
    setTimer: (handler, delay) => {
      timers.push({ handler, delay });
      return { unref() {} };
    },
  });

  engine.start();

  assert.equal(updater.autoDownload, false);
  assert.equal(updater.autoInstallOnAppQuit, false);
  assert.equal(updater.allowPrerelease, false);
  assert.equal(timers[0].delay, 1);
  assert.equal(engine.policy.checkIntervalMs, 30 * 60 * 1000);

  await engine.checkNow("manual");
  await engine.checkNow("manual");
  assert.equal(updater.checkCount, 1);
  assert.equal(logs.some((entry) => entry.event === "updater:skipped" && entry.details.reason === "rate-limited"), true);

  clock += 30 * 60 * 1000;
  updater.emit("update-available", { version: "11.2.0", releaseDate: "2026-06-14T00:00:00.000Z" });
  assert.equal(engine.getStatus().status, "available");
  assert.equal(engine.getStatus().lastResult.version, "11.2.0");
});

test("update engine no-ops when optional updater module cannot load", async () => {
  const logs = [];
  const engine = await initializeAutoUpdateEngine({
    app: { isPackaged: true },
    resolveAutoUpdater: async () => {
      throw new Error("module missing");
    },
    logger: (event, details) => logs.push({ event, details }),
  });

  assert.equal(engine.getStatus().enabled, false);
  assert.equal(engine.getStatus().reason, "updater-unavailable");
  assert.equal(logs.some((entry) => entry.event === "updater:module-load-failed"), true);
});

test("update initializer does not load updater module in development", async () => {
  let attemptedLoad = false;
  const engine = await initializeAutoUpdateEngine({
    app: { isPackaged: false },
    resolveAutoUpdater: async () => {
      attemptedLoad = true;
      return createMockUpdater();
    },
  });

  assert.equal(attemptedLoad, false);
  assert.equal(engine.getStatus().enabled, false);
  assert.equal(engine.getStatus().reason, "not-packaged");
});

test("release build scripts are pinned to no-publish mode", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  for (const scriptName of ["pack:win", "dist:win:setup", "dist:win:portable"]) {
    assert.match(pkg.scripts[scriptName], /--publish never/);
  }
});
