const DEFAULT_STARTUP_DELAY_MS = 30_000;
const DEFAULT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const MIN_CHECK_INTERVAL_MS = 30 * 60 * 1000;

function asPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clampInterval(value) {
  return Math.max(value, MIN_CHECK_INTERVAL_MS);
}

function safeError(error) {
  if (!error) return { message: "Unknown updater error" };
  return {
    message: String(error.message || error),
    code: error.code ? String(error.code) : undefined,
  };
}

function log(logger, event, details = {}) {
  try {
    logger?.(`updater:${event}`, details);
  } catch {
    // Updater telemetry must never affect app startup or update checks.
  }
}

export function resolveUpdatePolicy({
  app,
  autoUpdater,
  env = process.env,
} = {}) {
  if (env.UAOS_DISABLE_AUTO_UPDATES === "1") {
    return { enabled: false, reason: "disabled-by-env" };
  }

  if (!app?.isPackaged) {
    return { enabled: false, reason: "not-packaged" };
  }

  if (!autoUpdater) {
    return { enabled: false, reason: "updater-unavailable" };
  }

  return {
    enabled: true,
    startupDelayMs: asPositiveInteger(
      env.UAOS_AUTO_UPDATE_STARTUP_DELAY_MS,
      DEFAULT_STARTUP_DELAY_MS
    ),
    checkIntervalMs: clampInterval(
      asPositiveInteger(
        env.UAOS_AUTO_UPDATE_INTERVAL_MS,
        DEFAULT_CHECK_INTERVAL_MS
      )
    ),
    allowPrerelease: env.UAOS_ALLOW_PRERELEASE_UPDATES === "1",
  };
}

export function createUpdateEngine({
  app,
  autoUpdater,
  env = process.env,
  logger,
  setTimer = setTimeout,
  now = () => Date.now(),
} = {}) {
  const policy = resolveUpdatePolicy({ app, autoUpdater, env });
  const state = {
    enabled: policy.enabled,
    reason: policy.reason || null,
    status: policy.enabled ? "idle" : "disabled",
    lastCheckAt: null,
    lastResult: null,
    lastError: null,
  };

  let started = false;
  let timer = null;
  let checking = false;

  function getStatus() {
    return { ...state };
  }

  function schedule(delayMs, reason) {
    timer = setTimer(async () => {
      await checkNow(reason);
      schedule(policy.checkIntervalMs, "interval");
    }, delayMs);

    if (typeof timer?.unref === "function") {
      timer.unref();
    }
  }

  function attachEvents() {
    autoUpdater.on("checking-for-update", () => {
      state.status = "checking";
      log(logger, "checking-for-update");
    });

    autoUpdater.on("update-available", (info) => {
      state.status = "available";
      state.lastResult = {
        available: true,
        version: info?.version || null,
        releaseDate: info?.releaseDate || null,
      };
      log(logger, "update-available", state.lastResult);
    });

    autoUpdater.on("update-not-available", (info) => {
      state.status = "idle";
      state.lastResult = {
        available: false,
        version: info?.version || app?.getVersion?.() || null,
      };
      log(logger, "update-not-available", state.lastResult);
    });

    autoUpdater.on("download-progress", (progress) => {
      log(logger, "download-progress", {
        percent: Math.round(Number(progress?.percent || 0)),
      });
    });

    autoUpdater.on("update-downloaded", (info) => {
      state.status = "downloaded";
      state.lastResult = {
        available: true,
        downloaded: true,
        version: info?.version || null,
      };
      log(logger, "update-downloaded", state.lastResult);
    });

    autoUpdater.on("error", (error) => {
      state.status = "error";
      state.lastError = safeError(error);
      log(logger, "error", state.lastError);
    });
  }

  async function checkNow(reason = "manual") {
    if (!policy.enabled) {
      log(logger, "skipped", { reason: policy.reason });
      return getStatus();
    }

    if (checking) {
      log(logger, "skipped", { reason: "already-checking" });
      return getStatus();
    }

    const timestamp = now();
    if (
      state.lastCheckAt &&
      timestamp - state.lastCheckAt < MIN_CHECK_INTERVAL_MS
    ) {
      log(logger, "skipped", { reason: "rate-limited" });
      return getStatus();
    }

    checking = true;
    state.status = "checking";
    state.lastCheckAt = timestamp;

    try {
      log(logger, "check-start", { reason });
      const result = await autoUpdater.checkForUpdates();
      state.status = state.status === "checking" ? "idle" : state.status;
      log(logger, "check-complete", {
        reason,
        hasUpdateInfo: Boolean(result?.updateInfo),
      });
    } catch (error) {
      state.status = "error";
      state.lastError = safeError(error);
      log(logger, "check-failed", state.lastError);
    } finally {
      checking = false;
    }

    return getStatus();
  }

  function start() {
    if (started) return getStatus();
    started = true;

    if (!policy.enabled) {
      log(logger, "disabled", { reason: policy.reason });
      return getStatus();
    }

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowPrerelease = policy.allowPrerelease;

    attachEvents();
    schedule(policy.startupDelayMs, "startup");
    log(logger, "enabled", {
      checkIntervalMs: policy.checkIntervalMs,
      startupDelayMs: policy.startupDelayMs,
      allowPrerelease: policy.allowPrerelease,
      autoDownload: autoUpdater.autoDownload,
      autoInstallOnAppQuit: autoUpdater.autoInstallOnAppQuit,
    });

    return getStatus();
  }

  function stop() {
    if (timer && typeof clearTimeout === "function") {
      clearTimeout(timer);
    }
    timer = null;
  }

  return {
    start,
    stop,
    checkNow,
    getStatus,
    policy,
  };
}

export async function initializeAutoUpdateEngine({
  app,
  resolveAutoUpdater,
  logger,
  env = process.env,
  setTimer = setTimeout,
} = {}) {
  if (env.UAOS_DISABLE_AUTO_UPDATES === "1" || !app?.isPackaged) {
    const engine = createUpdateEngine({
      app,
      autoUpdater: null,
      env,
      logger,
      setTimer,
    });
    engine.start();
    return engine;
  }

  let autoUpdater = null;

  try {
    autoUpdater = await resolveAutoUpdater?.();
  } catch (error) {
    log(logger, "module-load-failed", safeError(error));
  }

  const engine = createUpdateEngine({
    app,
    autoUpdater,
    env,
    logger,
    setTimer,
  });

  engine.start();
  return engine;
}
