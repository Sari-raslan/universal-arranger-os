$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
$Desktop="$Root\desktop"
Set-Location $Root
New-Item -ItemType Directory -Force scripts,reports,release-kit,desktop | Out-Null
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Log="reports\UAOS_V13_DESKTOP_FOUNDATION_$Stamp.txt"
function L($m){ $m | Tee-Object -FilePath $Log -Append }
L "UAOS V1.3 DESKTOP FOUNDATION"
L "Time: $(Get-Date)"

L "=== WRITE ELECTRON MAIN ==="
$Main=@(
 "const { app, BrowserWindow } = require('electron');",
 "const path = require('path');",
 "function createWindow(){",
 "  const win = new BrowserWindow({ width: 1280, height: 820, backgroundColor: '#090b12', webPreferences: { nodeIntegration: false, contextIsolation: true } });",
 "  win.loadFile(path.join(__dirname, '../uaos-live-clean/dist/index.html'));",
 "}",
 "app.whenReady().then(createWindow);",
 "app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });",
 "app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });"
)
$Main | Set-Content "$Desktop\main.cjs" -Encoding UTF8

L "=== WRITE DESKTOP PACKAGE ==="
$Pkg=@{
  name="uaos-desktop";
  version="1.3.0";
  main="main.cjs";
  scripts=@{ start="electron ."; pack="electron-builder --dir"; dist="electron-builder" };
  devDependencies=@{ electron="latest"; "electron-builder"="latest" }
} | ConvertTo-Json -Depth 5
$Pkg | Set-Content "$Desktop\package.json" -Encoding UTF8

L "=== WRITE DESKTOP RUN SCRIPT ==="
$Run=@(
 '$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"',
 'Set-Location $Root',
 'npm run build --prefix uaos-live-clean',
 'npm install --prefix desktop',
 'npm run start --prefix desktop'
)
$Run | Set-Content "scripts\UAOS_RUN_DESKTOP_V13.ps1" -Encoding UTF8

L "=== WRITE DESKTOP BUILD SCRIPT ==="
$Build=@(
 '$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"',
 'Set-Location $Root',
 'npm run build --prefix uaos-live-clean',
 'npm install --prefix desktop',
 'npm run pack --prefix desktop'
)
$Build | Set-Content "scripts\UAOS_BUILD_DESKTOP_V13.ps1" -Encoding UTF8

L "=== WRITE RELEASE DOC ==="
$Doc="# UAOS V1.3 DESKTOP FOUNDATION`n`nWeb Live:`nhttps://universal-arranger-os.vercel.app`n`nDesktop:`n- Electron wrapper added`n- Runs built web app from uaos-live-clean/dist`n- MIDI bridge comes next`n`nCommands:`n- powershell -ExecutionPolicy Bypass -File .\scripts\UAOS_RUN_DESKTOP_V13.ps1`n- powershell -ExecutionPolicy Bypass -File .\scripts\UAOS_BUILD_DESKTOP_V13.ps1"
$Doc | Set-Content "release-kit\UAOS_V13_DESKTOP_FOUNDATION.md" -Encoding UTF8

L "=== BUILD WEB ==="
npm run build --prefix uaos-live-clean | Tee-Object -FilePath $Log -Append
if($LASTEXITCODE -ne 0){ L "Web build failed."; notepad $Log; exit }

L "=== COMMIT SAFE FILES ==="
git add desktop\main.cjs
git add desktop\package.json
git add scripts\UAOS_RUN_DESKTOP_V13.ps1
git add scripts\UAOS_BUILD_DESKTOP_V13.ps1
git add release-kit\UAOS_V13_DESKTOP_FOUNDATION.md
git commit -m "Add UAOS V1.3 desktop Electron foundation" 2>&1 | Tee-Object -FilePath $Log -Append

L "=== STATUS ==="
git status | Tee-Object -FilePath $Log -Append
L "DONE. Next run desktop with:"
L "powershell -ExecutionPolicy Bypass -File .\scripts\UAOS_RUN_DESKTOP_V13.ps1"
notepad $Log
