const { app, BrowserWindow } = require('electron');
const path = require('path');

let loadPolicy = { mode: 'safe' };

try {
  loadPolicy = require('./desktopLoadPolicy.cjs').getDesktopLoadPolicy();
} catch (e) {
  console.warn('desktopLoadPolicy missing, using fallback policy');
}

function createWindow(){
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
  win.loadFile(distIndex).catch(() => {
    win.loadURL('http://127.0.0.1:5173');
  });

  if(loadPolicy.allowDevTools){
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if(BrowserWindow.getAllWindows().length === 0) createWindow();
});
