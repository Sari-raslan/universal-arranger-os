import { app, BrowserWindow, ipcMain, session, shell } from "electron";
import fs from "node:fs";
import http from "node:http";
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

app.commandLine.appendSwitch(
  "enable-experimental-web-platform-features",
);

app.commandLine.appendSwitch(
  "enable-features",
  "WebMidi",
);


let mainWindow;
let showedFailurePage = false;
let updateEngine;
let staticServer;
let staticServerUrl;

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

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
  }[extension] || "application/octet-stream";
}

async function startLocalFrontendServer() {
  if (staticServerUrl) {
    return staticServerUrl;
  }

  const builtIndex = findBuiltIndex();

  if (!builtIndex) {
    throw new Error("UAOS frontend build was not found.");
  }

  const frontendRoot = path.dirname(builtIndex);
  const resolvedRoot = path.resolve(frontendRoot);

  staticServer = http.createServer((request, response) => {
    try {
      const requestUrl = new URL(
        request.url || "/",
        "http://127.0.0.1",
      );

      let pathname = decodeURIComponent(requestUrl.pathname);

      if (pathname === "/") {
        pathname = "/index.html";
      }

      const relativePath = pathname.replace(/^\/+/, "");
      let targetPath = path.resolve(frontendRoot, relativePath);

      if (!targetPath.startsWith(resolvedRoot)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      if (
        !fs.existsSync(targetPath) ||
        fs.statSync(targetPath).isDirectory()
      ) {
        targetPath = builtIndex;
      }

      response.writeHead(200, {
        "Content-Type": contentTypeFor(targetPath),
        "Cache-Control": "no-store",
        "Permissions-Policy": "microphone=(self), midi=(self)",
      });

      response.end(fs.readFileSync(targetPath));
    } catch (error) {
      logRuntime("local-server-request-failed", {
        message: error.message,
      });

      response.writeHead(500, {
        "Content-Type": "text/plain; charset=utf-8",
      });

      response.end("UAOS local server error");
    }
  });

  await new Promise((resolve, reject) => {
    staticServer.once("error", reject);
    staticServer.listen(0, "127.0.0.1", resolve);
  });

  const address = staticServer.address();

  staticServerUrl =
    `http://127.0.0.1:${address.port}`;

  logRuntime("local-server-ready", {
    url: staticServerUrl,
    frontendRoot,
  });

  return staticServerUrl;
}

function stopLocalFrontendServer() {
  try {
    staticServer?.close();
  } catch {
    // Ignore shutdown errors.
  }

  staticServer = null;
  staticServerUrl = null;
}
async function loadFrontend() {
  const builtIndex = findBuiltIndex();
  const devUrl = process.env.UAOS_DEV_URL || fallbackDevUrl;

  if (app.isPackaged && builtIndex) {
    const localUrl = await startLocalFrontendServer();

    logRuntime("load-local-server", {
      url: localUrl,
      file: builtIndex,
    });

    await mainWindow.loadURL(localUrl);
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

ipcMain.handle("uaos:midi:list-devices", () => ({
  supported: false,
  bridgeState: "available",
  permissionState: "unsupported",
  inputs: [],
  outputs: [],
  events: [
    {
      type: "electron-midi-foundation",
      message: "Electron MIDI bridge is present; native MIDI enumeration is not implemented in this build.",
    },
  ],
}));

ipcMain.handle("uaos:midi:reconnect", () => ({ ok: false, reason: "native-midi-not-implemented" }));
ipcMain.handle("uaos:midi:send", () => ({ ok: false, reason: "native-midi-not-implemented" }));
ipcMain.handle("uaos:midi:capabilities", () => ({
  webMidi: false,
  nativeMidi: false,
  sysex: false,
}));

async function resolveAutoUpdater() {
  const updaterModule = require("electron-updater");
  return updaterModule.autoUpdater;
}

app.whenReady().then(() => {
  logRuntime("app-ready", { version: app.getVersion(), packaged: app.isPackaged });
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
  if (process.platform !== "darwin") {
    updateEngine?.stop();
    app.quit();
  }
});
