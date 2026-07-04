const fs = require("fs");
const path = require("path");
const { app, BrowserWindow } = require("electron");

const appRoot = app.isPackaged
  ? path.join(process.resourcesPath, "app_content")
  : path.resolve(__dirname, "..");
const preferredHome = path.join(appRoot, "UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html");
const fallbackHome = path.join(appRoot, "UAOS_PC_WORKSTATION_APP_V25.html");

function isInsideAppRoot(targetPath) {
  const resolved = path.resolve(targetPath);
  return resolved === appRoot || resolved.startsWith(appRoot + path.sep);
}

function chooseHome() {
  return fs.existsSync(preferredHome) ? preferredHome : fallbackHome;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: "UAOS PC Workstation Owner Beta",
    autoHideMenuBar: true,
    backgroundColor: "#101821",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, targetUrl) => {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== "file:") {
        event.preventDefault();
        return;
      }
      const filePath = decodeURIComponent(parsed.pathname).replace(/^\/([A-Za-z]:)/, "$1");
      if (!isInsideAppRoot(filePath)) event.preventDefault();
    } catch (error) {
      event.preventDefault();
    }
  });

  win.loadFile(chooseHome());
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
