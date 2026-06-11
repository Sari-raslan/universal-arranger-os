const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
let easymidi = null;
try { easymidi = require('easymidi'); } catch (e) { easymidi = null; }

ipcMain.handle('uaos-midi-list-inputs', async () => {
  if (!easymidi) return { ok:false, error:'easymidi not available', inputs:[] };
  return { ok:true, inputs:easymidi.getInputs() };
});

ipcMain.handle('uaos-midi-list-outputs', async () => {
  if (!easymidi) return { ok:false, error:'easymidi not available', outputs:[] };
  return { ok:true, outputs:easymidi.getOutputs() };
});

ipcMain.handle('uaos-midi-test', async () => {
  return { ok:true, message:'UAOS Electron MIDI bridge alive' };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 820, backgroundColor: '#090b12', title: 'UAOS Platform',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true
    }
  });
  const indexPath = path.join(__dirname, '..', 'uaos-live-clean', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) win.loadFile(indexPath);
  else win.loadURL('https://universal-arranger-os.vercel.app');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
