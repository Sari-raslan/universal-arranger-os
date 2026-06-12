$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force uaos-live-clean\electron, reports | Out-Null

@"
function getDesktopLoadPolicy(){
  return {
    mode: "safe",
    allowRemote: false,
    allowDevTools: true,
    loadTarget: "local-vite-or-dist",
    fallback: "dist/index.html"
  };
}

module.exports = {
  getDesktopLoadPolicy
};
"@ | Set-Content "uaos-live-clean\electron\desktopLoadPolicy.cjs" -Encoding UTF8

$MainCandidates=@(
  "uaos-live-clean\electron\main.js",
  "uaos-live-clean\main.js",
  "electron\main.js",
  "main.js"
)

$Main=$MainCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if(!$Main){
  Write-Host "main.js not found, creating Electron main..." -ForegroundColor Yellow
  $Main="uaos-live-clean\electron\main.js"
}

$MainCode=@"
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
"@

Set-Content $Main $MainCode -Encoding UTF8

Write-Host "Electron desktopLoadPolicy fixed." -ForegroundColor Green

npm run build

if($LASTEXITCODE -ne 0){
  Write-Host "Build failed after Electron fix." -ForegroundColor Red
  exit 1
}

Write-Host "BUILD PASS. Now rebuild desktop app if needed." -ForegroundColor Green
