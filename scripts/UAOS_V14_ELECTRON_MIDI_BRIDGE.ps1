$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
$Desktop="$Root\desktop"
Set-Location $Root
New-Item -ItemType Directory -Force scripts,reports,release-kit | Out-Null
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$Log="reports\UAOS_V14_ELECTRON_MIDI_BRIDGE_$Stamp.txt"
function L($m){ $m | Tee-Object -FilePath $Log -Append }
L "UAOS V1.4 ELECTRON MIDI BRIDGE"

L "=== INSTALL MIDI PACKAGE ==="
npm install --prefix desktop easymidi | Tee-Object -FilePath $Log -Append

L "=== WRITE PRELOAD ==="
$Preload=@(
"const { contextBridge, ipcRenderer } = require('electron');"
"contextBridge.exposeInMainWorld('uaosMidi', {"
"  listInputs: () => ipcRenderer.invoke('uaos-midi-list-inputs'),",
"  listOutputs: () => ipcRenderer.invoke('uaos-midi-list-outputs'),",
"  test: () => ipcRenderer.invoke('uaos-midi-test')"
"});"
)
$Preload | Set-Content "$Desktop\preload.cjs" -Encoding UTF8

L "=== WRITE ELECTRON MAIN WITH MIDI IPC ==="
$Main=@(
"const { app, BrowserWindow, ipcMain } = require('electron');"
"const path = require('path');"
"const fs = require('fs');"
"let easymidi = null;"
"try { easymidi = require('easymidi'); } catch (e) { easymidi = null; }"
""
"ipcMain.handle('uaos-midi-list-inputs', async () => {"
"  if (!easymidi) return { ok:false, error:'easymidi not available', inputs:[] };"
"  return { ok:true, inputs:easymidi.getInputs() };"
"});"
""
"ipcMain.handle('uaos-midi-list-outputs', async () => {"
"  if (!easymidi) return { ok:false, error:'easymidi not available', outputs:[] };"
"  return { ok:true, outputs:easymidi.getOutputs() };"
"});"
""
"ipcMain.handle('uaos-midi-test', async () => {"
"  return { ok:true, message:'UAOS Electron MIDI bridge alive' };"
"});"
""
"function createWindow() {"
"  const win = new BrowserWindow({"
"    width: 1280, height: 820, backgroundColor: '#090b12', title: 'UAOS Platform',",
"    webPreferences: {"
"      preload: path.join(__dirname, 'preload.cjs'),",
"      nodeIntegration: false, contextIsolation: true"
"    }"
"  });"
"  const indexPath = path.join(__dirname, '..', 'uaos-live-clean', 'dist', 'index.html');"
"  if (fs.existsSync(indexPath)) win.loadFile(indexPath);"
"  else win.loadURL('https://universal-arranger-os.vercel.app');"
"}"
""
"app.whenReady().then(createWindow);"
"app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });"
)
$Main | Set-Content "$Desktop\main.cjs" -Encoding UTF8

L "=== PATCH APP MIDI PAGE ==="
$AppFile="$App\src\App.jsx"
$Code=Get-Content $AppFile -Raw
$NewMidi=@'
function Midi() {
  const [status, setStatus] = useState("Not scanned");
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);

  async function scan() {
    if (window.uaosMidi) {
      const test = await window.uaosMidi.test();
      const ins = await window.uaosMidi.listInputs();
      const outs = await window.uaosMidi.listOutputs();
      setStatus(test.message || "Electron MIDI bridge ready");
      setInputs(ins.inputs || []);
      setOutputs(outs.outputs || []);
      return;
    }

    if (!navigator.requestMIDIAccess) {
      setStatus("WebMIDI not available. Use Chrome or UAOS Desktop.");
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess();
      setInputs([...access.inputs.values()].map((x) => x.name));
      setOutputs([...access.outputs.values()].map((x) => x.name));
      setStatus("WebMIDI scan complete");
    } catch {
      setStatus("MIDI permission failed");
    }
  }

  return <main className="page"><section className="panel"><h1>MIDI Diagnostics</h1><button onClick={scan}>Scan MIDI</button><div className="fakeBox">{status}</div><div className="cards"><article className="card"><h2>Inputs</h2>{inputs.length ? inputs.map((x)=><p key={x}>{x}</p>) : <p>No inputs found</p>}</article><article className="card"><h2>Outputs</h2>{outputs.length ? outputs.map((x)=><p key={x}>{x}</p>) : <p>No outputs found</p>}</article></div></section></main>;
}
'@
$Code=$Code -replace "function Midi\(\) \{[\s\S]*?\n\}", $NewMidi
Set-Content $AppFile $Code -Encoding UTF8

L "=== BUILD WEB ==="
npm run build --prefix uaos-live-clean | Tee-Object -FilePath $Log -Append
if($LASTEXITCODE -ne 0){ L "Build failed"; notepad $Log; exit }

L "=== COMMIT ==="
git add desktop\main.cjs desktop\preload.cjs desktop\package.json desktop\package-lock.json uaos-live-clean\src\App.jsx scripts\UAOS_V14_ELECTRON_MIDI_BRIDGE.ps1
git commit -m "Add UAOS Electron MIDI bridge foundation" 2>&1 | Tee-Object -FilePath $Log -Append

L "=== DONE ==="
L "Run desktop:"
L "powershell -ExecutionPolicy Bypass -File .\scripts\UAOS_RUN_DESKTOP_V13.ps1"
notepad $Log
