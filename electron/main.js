import { app, BrowserWindow, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
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

app.whenReady().then(() => {
  logRuntime("app-ready", { version: app.getVersion(), packaged: app.isPackaged });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
