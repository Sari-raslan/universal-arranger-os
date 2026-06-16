import { app, BrowserWindow, ipcMain, session, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { initializeAutoUpdateEngine } from "./updateEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
function getRuntimeLogFile() {
  const reportDir = path.join(
    app.getPath("userData"),
    "reports",
    "electron-runtime"
  );

  fs.mkdirSync(reportDir, { recursive: true });
  return path.join(reportDir, "electron-runtime.log");
}
const fallbackDevUrl = "http://127.0.0.1:5173";

let mainWindow;
let showedFailurePage = false;
let updateEngine;

const activeMidiInputs = new Map();

let easymidi = null;
try {
  easymidi = require("easymidi");
} catch (error) {
  console.error("UAOS easymidi unavailable:", error.message);
}

function listNativeMidiInputs() {
  if (!easymidi) {
    return {
      ok: false,
      error: "easymidi is unavailable.",
      inputs: [],
    };
  }

  return {
    ok: true,
    inputs: easymidi.getInputs().map((name, index) => ({
      id: name,
      name,
      state: "connected",
      index,
    })),
  };
}

function listNativeMidiOutputs() {
  if (!easymidi) {
    return {
      ok: false,
      error: "easymidi is unavailable.",
      outputs: [],
    };
  }

  return {
    ok: true,
    outputs: easymidi.getOutputs().map((name, index) => ({
      id: name,
      name,
      state: "connected",
      index,
    })),
  };
}

function toRawMidi(type, message = {}) {
  const channel = Math.max(
    0,
    Math.min(15, Number(message.channel || 0)),
  );

  if (type === "noteon") {
    return [
      0x90 | channel,
      Number(message.note || 0),
      Number(message.velocity || 0),
    ];
  }

  if (type === "noteoff") {
    return [
      0x80 | channel,
      Number(message.note || 0),
      Number(message.velocity || 0),
    ];
  }

  if (type === "cc") {
    return [
      0xb0 | channel,
      Number(message.controller || 0),
      Number(message.value || 0),
    ];
  }

  if (type === "program") {
    return [
      0xc0 | channel,
      Number(message.number || 0),
    ];
  }

  if (type === "pitch") {
    const value = Math.max(
      0,
      Math.min(
        16383,
        Number(message.value || 0) + 8192,
      ),
    );

    return [
      0xe0 | channel,
      value & 0x7f,
      (value >> 7) & 0x7f,
    ];
  }

  if (type === "poly aftertouch") {
    return [
      0xa0 | channel,
      Number(message.note || 0),
      Number(message.pressure || 0),
    ];
  }

  if (type === "channel aftertouch") {
    return [
      0xd0 | channel,
      Number(message.pressure || 0),
    ];
  }

  return null;
}

function stopNativeMidiInput(senderId) {
  const active = activeMidiInputs.get(senderId);

  if (!active) {
    return {
      ok: true,
      stopped: false,
    };
  }

  try {
    active.input.close();
  } catch {
    // Ignore shutdown close errors.
  }

  activeMidiInputs.delete(senderId);

  return {
    ok: true,
    stopped: true,
  };
}

function startNativeMidiInput(sender, inputName) {
  if (!easymidi) {
    return {
      ok: false,
      error: "easymidi is unavailable.",
    };
  }

  if (
    !inputName ||
    !easymidi.getInputs().includes(inputName)
  ) {
    return {
      ok: false,
      error: "Selected MIDI input is unavailable.",
    };
  }

  stopNativeMidiInput(sender.id);

  try {
    const input = new easymidi.Input(inputName);

    const eventTypes = [
      "noteon",
      "noteoff",
      "cc",
      "program",
      "pitch",
      "poly aftertouch",
      "channel aftertouch",
    ];

    for (const type of eventTypes) {
      input.on(type, (message) => {
        const raw = toRawMidi(type, message);

        if (!raw || sender.isDestroyed()) {
          return;
        }

        sender.send("uaos-midi-message", {
          inputId: inputName,
          raw,
          receivedAt: Date.now(),
        });
      });
    }

    activeMidiInputs.set(sender.id, {
      input,
      inputName,
    });

    logRuntime("midi-input-started", {
      inputName,
    });

    return {
      ok: true,
      inputId: inputName,
    };
  } catch (error) {
    logRuntime("midi-input-failed", {
      inputName,
      message: error.message,
    });

    return {
      ok: false,
      error:
        error.message ||
        "Could not open MIDI input.",
    };
  }
}

function configureHardwarePermissions() {
  const allowedPermissions = new Set([
    "media",
    "midi",
    "midiSysex",
  ]);

  const currentSession = session.defaultSession;

  currentSession.setPermissionCheckHandler(
    (_webContents, permission) =>
      allowedPermissions.has(permission),
  );

  currentSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(allowedPermissions.has(permission));
    },
  );
}

function logRuntime(event, details = {}) {
  const entry = {
    time: new Date().toISOString(),
    event,
    ...details,
  };

  try {
    fs.appendFileSync(
      getRuntimeLogFile(),
      `${JSON.stringify(entry)}\n`,
      "utf8"
    );
  } catch (error) {
    console.error("UAOS runtime log failed:", error);
  }
}
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function findBuiltIndex() {
  const candidates = [
    path.join(repoRoot, "uaos-live-clean", "dist", "index.html"),
    path.join(repoRoot, "frontend", "dist", "index.html"),
    path.join(repoRoot, "dist", "index.html"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function failureHtml(title, reason) {
  const safeTitle = escapeHtml(title);
  const safeReason = escapeHtml(reason);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    html, body { min-height: 100%; margin: 0; background: #080d18; color: #f7f7fb; font-family: Arial, sans-serif; }
    body { display: grid; place-items: center; }
    main { width: min(760px, calc(100% - 32px)); }
    h1 { margin: 0 0 12px; font-size: 34px; }
    p { color: #cfd7e8; line-height: 1.6; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; border: 1px solid rgba(255,118,118,.45); border-radius: 8px; padding: 14px; color: #ffd1c8; background: rgba(255,118,118,.1); }
  </style>
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <p>UAOS displayed this diagnostic page instead of leaving the Electron window blank.</p>
    <pre>${safeReason}</pre>
  </main>
</body>
</html>`;
}

async function showFailurePage(title, reason) {
  if (!mainWindow || showedFailurePage) {
    return;
  }

  showedFailurePage = true;
  logRuntime("failure-page", { title, reason });
  await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(failureHtml(title, reason))}`);
  mainWindow.show();
}

async function loadFrontend() {
  const builtIndex = findBuiltIndex();
  const devUrl = process.env.UAOS_DEV_URL || fallbackDevUrl;

  if (app.isPackaged && builtIndex) {
    logRuntime("load-file", { file: builtIndex });
    await mainWindow.loadFile(builtIndex);
    return;
  }

  if (!app.isPackaged) {
    logRuntime("load-url", { url: devUrl });
    await mainWindow.loadURL(devUrl);
    return;
  }

  if (builtIndex) {
    logRuntime("load-file", { file: builtIndex });
    await mainWindow.loadFile(builtIndex);
    return;
  }

  await showFailurePage("UAOS build was not found", "No dist/index.html was found in the known project frontend paths.");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#080d18",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (/^https?:\/\//i.test(url) && currentUrl && url !== currentUrl) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    logRuntime("did-fail-load", { errorCode, errorDescription, validatedURL });
    showFailurePage("UAOS failed to load", `${errorDescription} (${errorCode}) while loading ${validatedURL}`);
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    logRuntime("render-process-gone", details);
    showFailurePage("UAOS renderer stopped", details.reason || "The renderer process exited unexpectedly.");
  });

  mainWindow.on("unresponsive", () => {
    logRuntime("unresponsive");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  loadFrontend().catch((error) => {
    logRuntime("load-error", { message: error.message, stack: error.stack });
    showFailurePage("UAOS failed to start", error.message);
  });
}

ipcMain.handle("uaos-midi-test", () => ({
  ok: true,
  easymidi: Boolean(easymidi),
  message: easymidi
    ? "UAOS native MIDI bridge ready"
    : "UAOS MIDI bridge loaded; easymidi unavailable",
}));

ipcMain.handle(
  "uaos-midi-list-inputs",
  () => listNativeMidiInputs(),
);

ipcMain.handle(
  "uaos-midi-list-outputs",
  () => listNativeMidiOutputs(),
);

ipcMain.handle(
  "uaos-midi-start-input",
  (event, inputName) =>
    startNativeMidiInput(
      event.sender,
      inputName,
    ),
);

ipcMain.handle(
  "uaos-midi-stop-input",
  (event) =>
    stopNativeMidiInput(event.sender.id),
);

ipcMain.handle(
  "uaos:midi:list-devices",
  () => {
    const inputs = listNativeMidiInputs();
    const outputs = listNativeMidiOutputs();

    return {
      supported: Boolean(easymidi),
      bridgeState: easymidi
        ? "ready"
        : "module-unavailable",
      permissionState: "allowed",
      inputs: inputs.inputs || [],
      outputs: outputs.outputs || [],
      events: [],
    };
  },
);

ipcMain.handle(
  "uaos:midi:reconnect",
  () => ({
    ok: Boolean(easymidi),
    reason: easymidi
      ? null
      : "easymidi-unavailable",
  }),
);

ipcMain.handle(
  "uaos:midi:send",
  () => ({
    ok: false,
    reason: "native-output-send-not-enabled",
  }),
);

ipcMain.handle(
  "uaos:midi:capabilities",
  () => ({
    webMidi: true,
    nativeMidi: Boolean(easymidi),
    sysex: false,
  }),
);

async function resolveAutoUpdater() {
  const updaterModule = require("electron-updater");
  return updaterModule.autoUpdater;
}

app.whenReady().then(() => {
  logRuntime("app-ready", {
    version: app.getVersion(),
    packaged: app.isPackaged,
  });
  configureHardwarePermissions();
  createWindow();
  initializeAutoUpdateEngine({
    app,
    resolveAutoUpdater,
    logger: logRuntime,
  }).then((engine) => {
    updateEngine = engine;
  }).catch((error) => {
    logRuntime("updater:init-failed", { message: error.message, stack: error.stack });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  for (const senderId of activeMidiInputs.keys()) {
    stopNativeMidiInput(senderId);
  }

  if (process.platform !== "darwin") {
    updateEngine?.stop();
    app.quit();
  }
});
