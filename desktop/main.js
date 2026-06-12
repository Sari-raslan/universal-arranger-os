const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1350,
    height: 850,
    backgroundColor: '#04060a',
    title: "UAOS Pro Live Desktop v11.0",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // الإجبار الحتمي على قراءة الخادم المباشر لنسف الشاشة السوداء
  mainWindow.loadURL('http://localhost:5173');

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
