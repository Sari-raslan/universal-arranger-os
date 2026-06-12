const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let easymidi = null;
try {
  easymidi = require("easymidi");
} catch {
  easymidi = null;
}

const desktopLoadPolicy = Object.freeze({
  devUrl: process.env.UAOS_DESKTOP_URL || "http://127.0.0.1:5173",
  distPath: path.join(__dirname, "..", "uaos-live-clean", "dist", "index.html")
});

function listInputs() {
  if (!easymidi) return { ok: false, error: "easymidi not available; WebMIDI fallback may still work in the renderer.", inputs: [] };
  return { ok: true, inputs: easymidi.getInputs().map((name, index) => ({ id: name, name, state: "connected", index })) };
}

function listOutputs() {
  if (!easymidi) return { ok: false, error: "easymidi not available; WebMIDI fallback may still work in the renderer.", outputs: [] };
  return { ok: true, outputs: easymidi.getOutputs().map((name, index) => ({ id: name, name, state: "connected", index })) };
}

ipcMain.handle("uaos-midi-list-inputs", async () => listInputs());
ipcMain.handle("uaos-midi-list-outputs", async () => listOutputs());
ipcMain.handle("uaos-midi-test", async () => ({ ok: true, message: "UAOS Electron MIDI bridge alive", easymidi: Boolean(easymidi) }));

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#0a0d12",
    title: "UAOS V1",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  if (fs.existsSync(desktopLoadPolicy.distPath)) {
    win.loadFile(desktopLoadPolicy.distPath);
  } else {
    win.loadURL(desktopLoadPolicy.devUrl);
  }
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

module.exports = { desktopLoadPolicy, listInputs, listOutputs };
