const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const distPath = path.join(__dirname, "..", "uaos-live-clean", "dist", "index.html");
const devUrl = process.env.UAOS_DESKTOP_URL || "http://127.0.0.1:5173";

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Universal Arranger OS",
    backgroundColor: "#0a0d12",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (fs.existsSync(distPath)) win.loadFile(distPath);
  else win.loadURL(devUrl);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
