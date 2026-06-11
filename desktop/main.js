const { app, BrowserWindow, shell, Menu, dialog } = require("electron");
const {
  PUBLIC_URL,
  localIndex,
  hasOfflineFallback,
  shouldOpenExternally,
  resolveStartupTarget
} = require("./desktopLoadPolicy.cjs");

let mainWindow = null;

async function loadTarget(win, target) {
  if (target.type === "file") {
    await win.loadFile(target.value);
    return;
  }

  await win.loadURL(target.value);
}

async function loadWithFallback(win, target = resolveStartupTarget()) {
  try {
    await loadTarget(win, target);
  } catch (error) {
    if (hasOfflineFallback()) {
      await win.loadFile(localIndex);
      return;
    }

    dialog.showErrorBox(
      "UAOS could not start",
      `The online app could not be loaded and no offline fallback was found.\n\n${error.message}`
    );
  }
}

function createWindow(){
  mainWindow = new BrowserWindow({
    width: 1450,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: "UAOS HyperStation Desktop",
    backgroundColor: "#05050d",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenExternally(url)) {
      shell.openExternal(url);
      return { action: "deny" };
    }

    return { action: "allow" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (shouldOpenExternally(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on("render-process-gone", () => {
    loadWithFallback(mainWindow, resolveStartupTarget({ preferOffline: true }));
  });

  mainWindow.webContents.on("did-fail-load", (_event, _errorCode, _errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame && validatedURL !== `file://${localIndex.replace(/\\/g, "/")}` && hasOfflineFallback()) {
      loadWithFallback(mainWindow, resolveStartupTarget({ preferOffline: true }));
    }
  });

  const menu = Menu.buildFromTemplate([
    {
      label: "UAOS",
      submenu: [
        { label: "Open Public Live", click: () => loadWithFallback(mainWindow) },
        { label: "Open Offline Fallback", click: () => loadWithFallback(mainWindow, resolveStartupTarget({ preferOffline: true })) },
        { type: "separator" },
        { label: "Reload", role: "reload" },
        { label: "DevTools", role: "toggleDevTools" },
        { type: "separator" },
        { label: "Quit", role: "quit" }
      ]
    },
    {
      label: "Links",
      submenu: [
        { label: "Open Website in Browser", click: () => shell.openExternal(PUBLIC_URL) },
        { label: "Open API Status", click: () => shell.openExternal(PUBLIC_URL + "/api/status") }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  loadWithFallback(mainWindow);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if(process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if(BrowserWindow.getAllWindows().length === 0) createWindow(); });
