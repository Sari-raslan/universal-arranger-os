$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force src\live,src\safety,reports | Out-Null

if(Test-Path "src\App.jsx"){
  Copy-Item "src\App.jsx" "src\App.backup-v116.jsx" -Force
}

@'
export class UAOSCrashSafeAutosave {
  constructor(bus, timeline, arranger){
    this.bus = bus;
    this.timeline = timeline;
    this.arranger = arranger;
    this.key = "uaos.v116.autosave";
    this.timer = null;
  }

  start(){
    this.timer = setInterval(()=>{
      this.save();
    }, 3000);

    window.addEventListener("beforeunload", ()=>this.save());

    const ev = this.bus.emit("autosave.start", {});
    this.timeline.add(ev);
  }

  save(){
    const snapshot = {
      savedAt: new Date().toISOString(),
      timeline: this.timeline.load(),
      arrangerState: this.arranger.state()
    };

    localStorage.setItem(this.key, JSON.stringify(snapshot));

    this.bus.emit("autosave.saved", {
      events: snapshot.timeline.length,
      section: snapshot.arrangerState.section,
      chord: snapshot.arrangerState.chord
    });
  }

  restore(){
    const raw = localStorage.getItem(this.key);
    if(!raw) return null;
    return JSON.parse(raw);
  }
}
'@ | Set-Content "src\safety\uaosCrashSafeAutosave.js" -Encoding UTF8

@'
export class UAOSLatencyMonitor {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.samples = [];
    this.last = performance.now();
    this.running = false;
  }

  start(){
    this.running = true;
    this.loop();
  }

  stop(){
    this.running = false;
  }

  loop(){
    if(!this.running) return;

    const now = performance.now();
    const delta = now - this.last;
    this.last = now;

    const latency = Math.round(Math.max(0, delta - 16.67));

    this.samples.push(latency);
    if(this.samples.length > 60) this.samples.shift();

    const avg = Math.round(this.samples.reduce((a,b)=>a+b,0) / this.samples.length);

    const ev = this.bus.emit("latency.monitor", {
      latency,
      average: avg
    });

    this.timeline.add(ev);

    requestAnimationFrame(()=>this.loop());
  }
}
'@ | Set-Content "src\live\uaosLatencyMonitor.js" -Encoding UTF8

@'
export const LIVE_CHORD_PADS = [
  "C","Dm","Em","F","G","Am","A","E","D","C7","G7","Am7"
];

export const LIVE_QUICK_SECTIONS = [
  "INTRO",
  "VAR_A",
  "VAR_B",
  "FILL",
  "BREAK",
  "ENDING"
];
'@ | Set-Content "src\live\livePads.js" -Encoding UTF8

$App = Get-Content "src\App.jsx" -Raw

if($App -notmatch "UAOSCrashSafeAutosave"){
  $App = $App -replace 'import \{ exportMidiDraft \} from "\./style/midiExportDraft\.js";',
'import { exportMidiDraft } from "./style/midiExportDraft.js";
import { UAOSCrashSafeAutosave } from "./safety/uaosCrashSafeAutosave.js";
import { UAOSLatencyMonitor } from "./live/uaosLatencyMonitor.js";
import { LIVE_CHORD_PADS, LIVE_QUICK_SECTIONS } from "./live/livePads.js";'
}

if($App -notmatch "liveMode"){
  $App = $App -replace 'const \[profileEditor,setProfileEditor\] = useState\(\{channel:1, transpose:0\}\);',
'const [profileEditor,setProfileEditor] = useState({channel:1, transpose:0});
  const [liveMode,setLiveMode] = useState(false);
  const [latency,setLatency] = useState({latency:0,average:0});
  const autosave = useMemo(()=>new UAOSCrashSafeAutosave(uaosBus, uaosTimeline, arranger), [arranger]);
  const latencyMonitor = useMemo(()=>new UAOSLatencyMonitor(uaosBus, uaosTimeline), []);'
}

if($App -notmatch "latency.monitor"){
  $App = $App -replace 'uaosBus\.on\("midi.scan", ev => setMidiInfo\(ev\.payload\)\);',
'uaosBus.on("midi.scan", ev => setMidiInfo(ev.payload));
    uaosBus.on("latency.monitor", ev => setLatency(ev.payload));'
}

if($App -notmatch "autosave.start"){
  $App = $App -replace '\},\[arranger\]\);',
'    autosave.start();
    latencyMonitor.start();
  },[arranger]);'
}

if($App -notmatch "LIVE STAGE MODE"){
  $App = $App -replace 'return \(\s*<div style=\{\{minHeight:"100vh",background:"#070b14",color:"white",fontFamily:"Arial",padding:24\}\}>',
'if(liveMode){
    return (
      <div style={{minHeight:"100vh",background:"#020617",color:"white",fontFamily:"Arial",padding:24}}>
        <h1>UAOS V1.16 LIVE STAGE MODE</h1>
        <h2>{arrangerState.section} | {arrangerState.chord} | BPM {arrangerState.bpm}</h2>
        <p>Latency: {latency.average} ms average</p>

        <button onClick={()=>setLiveMode(false)}>Exit Live Mode</button>
        <button onClick={()=>arranger.start()} style={{marginLeft:8}}>Start</button>
        <button onClick={()=>arranger.stop()} style={{marginLeft:8}}>Stop</button>
        <button onClick={()=>performanceMode.start()} style={{marginLeft:8}}>Performance Start</button>
        <button onClick={()=>performanceMode.stop()} style={{marginLeft:8}}>Performance Stop</button>

        <h2>Sections</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {LIVE_QUICK_SECTIONS.map(s=>(
            <button key={s} onClick={()=>arranger.setSection(s)} style={{fontSize:28,padding:28}}>
              {s}
            </button>
          ))}
        </div>

        <h2>Chord Pads</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {LIVE_CHORD_PADS.map(c=>(
            <button key={c} onClick={()=>arranger.setChord(c)} style={{fontSize:34,padding:34}}>
              {c}
            </button>
          ))}
        </div>

        <h2>Live Monitor</h2>
        <pre style={{background:"#111827",padding:12,borderRadius:8}}>
          {JSON.stringify({
            status,
            audio:audioState,
            voiceMidi,
            arranger:arrangerState,
            latency
          },null,2)}
        </pre>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#070b14",color:"white",fontFamily:"Arial",padding:24}}>'
}

if($App -notmatch "Enter Live Stage Mode"){
  $App = $App -replace '<h3>Status: \{status\}</h3>',
'<h3>Status: {status}</h3>

      <button onClick={()=>setLiveMode(true)} style={{fontSize:18,padding:12}}>
        Enter Live Stage Mode
      </button>
      <button onClick={()=>document.documentElement.requestFullscreen?.()} style={{marginLeft:8}}>
        Full Screen
      </button>
      <button onClick={()=>{
        const snap=autosave.restore();
        setStatus(snap ? "AUTOSAVE FOUND: "+snap.savedAt : "NO AUTOSAVE FOUND");
      }} style={{marginLeft:8}}>
        Check Autosave
      </button>

      <h3>Transport Bar</h3>
      <button onClick={()=>arranger.start()}>▶ Start</button>
      <button onClick={()=>arranger.stop()} style={{marginLeft:8}}>■ Stop</button>
      <button onClick={()=>player.play()} style={{marginLeft:8}}>▶ Timeline</button>
      <button onClick={()=>player.stop()} style={{marginLeft:8}}>■ Timeline</button>
      <span style={{marginLeft:16}}>Latency Avg: {latency.average} ms</span>'
}

if($App -notmatch "Chord Pads"){
  $App = $App -replace '<h2>Arranger Engine</h2>',
'<h2>Chord Pads</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
        {LIVE_CHORD_PADS.map(c=>(
          <button key={c} onClick={()=>arranger.setChord(c)} style={{padding:14,fontSize:18}}>
            {c}
          </button>
        ))}
      </div>

      <h2>Arranger Engine</h2>'
}

$App = $App -replace "UAOS V1.15 Performance \+ Audio Export", "UAOS V1.16 Live Stage Mode"
$App = $App -replace "Performance mode, audio recording export, pattern editor, song arrangement sections, MIDI/project export, and realtime arranger tools\.", "Standalone live mode, full-screen stage UI, chord pads, transport bar, latency monitor, autosave, performance tools, and arranger control."

Set-Content "src\App.jsx" $App -Encoding UTF8

npm run build

if($LASTEXITCODE -ne 0){
  Write-Host "UAOS V1.16 BUILD FAIL" -ForegroundColor Red
  exit 1
}

Write-Host "UAOS V1.16 BUILD PASS" -ForegroundColor Green

if(Test-Path ".\UAOS_SAFE_TURBO.ps1"){
  powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
}