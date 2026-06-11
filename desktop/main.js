const { app, BrowserWindow } = require("electron");

function createWindow(){
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "UAOS HyperStation",
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  win.loadURL("https://universal-arranger-os.vercel.app");
}

app.whenReady().then(createWindow);
app.on("window-all-closed",()=>{ if(process.platform !== "darwin") app.quit(); });
