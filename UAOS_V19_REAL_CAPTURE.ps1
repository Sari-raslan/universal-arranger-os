$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force src\core src\audio src\midi src\timeline reports | Out-Null

$App="src\App.jsx"
if(Test-Path $App){
  Copy-Item $App "src\App.backup-v19-real-capture.jsx" -Force
}

@'
export class UAOSBus {
  constructor(){
    this.handlers = {};
    this.events = [];
  }

  on(type, fn){
    if(!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(fn);
  }

  emit(type, payload = {}){
    const ev = {
      id: crypto.randomUUID(),
      type,
      payload,
      time: performance.now(),
      ts: Date.now()
    };

    this.events.push(ev);

    if(this.handlers[type]){
      this.handlers[type].forEach(fn => fn(ev));
    }

    if(this.handlers["*"]){
      this.handlers["*"].forEach(fn => fn(ev));
    }

    return ev;
  }

  all(){
    return this.events;
  }
}

export const uaosBus = new UAOSBus();
'@ | Set-Content "src\core\uaosBus.js" -Encoding UTF8

@'
export class UAOSTimeline {
  constructor(){
    this.key = "uaos.v19.timeline";
    this.items = JSON.parse(localStorage.getItem(this.key) || "[]");
  }

  add(event){
    this.items.push(event);
    this.save();
    return event;
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.items));
  }

  load(){
    return this.items;
  }

  clear(){
    this.items = [];
    this.save();
  }

  exportJson(){
    return JSON.stringify({
      product: "UAOS",
      version: "1.9-real-capture",
      exportedAt: new Date().toISOString(),
      events: this.items
    }, null, 2);
  }
}

export const uaosTimeline = new UAOSTimeline();
'@ | Set-Content "src\timeline\uaosTimeline.js" -Encoding UTF8

@'
export class UAOSAudioEngine {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.ctx = null;
    this.analyser = null;
    this.running = false;
  }

  async start(){
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(stream);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    src.connect(this.analyser);

    this.running = true;

    const ev = this.bus.emit("audio.started", {
      sampleRate: this.ctx.sampleRate
    });

    this.timeline.add(ev);

    this.loop();
  }

  loop(){
    if(!this.running || !this.analyser) return;

    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);

    const level = Math.round(data.reduce((a,b)=>a+b,0) / data.length);
    const peak = Math.max(...data);

    const ev = this.bus.emit("audio.level", {
      level,
      peak
    });

    this.timeline.add(ev);

    requestAnimationFrame(()=>this.loop());
  }

  stop(){
    this.running = false;
    const ev = this.bus.emit("audio.stopped", {});
    this.timeline.add(ev);
  }
}
'@ | Set-Content "src\audio\uaosAudioEngine.js" -Encoding UTF8

@'
export class UAOSMidiEngine {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.access = null;
  }

  async start(){
    if(!navigator.requestMIDIAccess){
      const ev = this.bus.emit("midi.unsupported", {});
      this.timeline.add(ev);
      return;
    }

    this.access = await navigator.requestMIDIAccess();

    const inputs = [...this.access.inputs.values()];
    const outputs = [...this.access.outputs.values()];

    const scan = this.bus.emit("midi.scan", {
      inputs: inputs.map(i => i.name),
      outputs: outputs.map(o => o.name)
    });

    this.timeline.add(scan);

    inputs.forEach(input => {
      input.onmidimessage = msg => {
        const [status, note, velocity] = msg.data;
        const command = status & 0xf0;
        const channel = (status & 0x0f) + 1;

        let type = "midi.raw";

        if(command === 144 && velocity > 0) type = "midi.noteon";
        if(command === 128 || (command === 144 && velocity === 0)) type = "midi.noteoff";

        const ev = this.bus.emit(type, {
          device: input.name,
          status,
          command,
          channel,
          note,
          velocity
        });

        this.timeline.add(ev);
      };
    });
  }
}
'@ | Set-Content "src\midi\uaosMidiEngine.js" -Encoding UTF8

@'
import React, { useEffect, useMemo, useState } from "react";
import { uaosBus } from "./core/uaosBus.js";
import { uaosTimeline } from "./timeline/uaosTimeline.js";
import { UAOSAudioEngine } from "./audio/uaosAudioEngine.js";
import { UAOSMidiEngine } from "./midi/uaosMidiEngine.js";

export default function App(){
  const audio = useMemo(()=>new UAOSAudioEngine(uaosBus, uaosTimeline), []);
  const midi = useMemo(()=>new UAOSMidiEngine(uaosBus, uaosTimeline), []);

  const [level,setLevel] = useState(0);
  const [peak,setPeak] = useState(0);
  const [events,setEvents] = useState([]);
  const [midiInfo,setMidiInfo] = useState(null);
  const [status,setStatus] = useState("READY");

  useEffect(()=>{
    uaosBus.on("*", () => {
      setEvents([...uaosTimeline.load()].slice(-40).reverse());
    });

    uaosBus.on("audio.level", ev => {
      setLevel(ev.payload.level);
      setPeak(ev.payload.peak);
    });

    uaosBus.on("midi.scan", ev => {
      setMidiInfo(ev.payload);
    });
  },[]);

  function exportTimeline(){
    const blob = new Blob([uaosTimeline.exportJson()], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uaos-v19-timeline.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function startAudio(){
    try{
      setStatus("STARTING AUDIO...");
      await audio.start();
      setStatus("AUDIO RUNNING");
    }catch(e){
      setStatus("AUDIO ERROR: " + e.message);
    }
  }

  async function startMidi(){
    try{
      setStatus("STARTING MIDI...");
      await midi.start();
      setStatus("MIDI READY");
    }catch(e){
      setStatus("MIDI ERROR: " + e.message);
    }
  }

  return (
    <div style={{
      minHeight:"100vh",
      background:"#070b14",
      color:"white",
      fontFamily:"Arial",
      padding:24
    }}>
      <h1>UAOS V1.9 Real Capture</h1>
      <p>Real microphone + real MIDI + event timeline + JSON export.</p>

      <h3>Status: {status}</h3>

      <button onClick={startAudio}>Start Real Audio</button>
      <button onClick={startMidi} style={{marginLeft:8}}>Start MIDI</button>
      <button onClick={()=>{uaosTimeline.clear();setEvents([])}} style={{marginLeft:8}}>Clear Timeline</button>
      <button onClick={exportTimeline} style={{marginLeft:8}}>Export Timeline JSON</button>

      <h2>Audio</h2>
      <p>Level: {level} | Peak: {peak}</p>
      <progress value={level} max="255" style={{width:"100%"}} />

      <h2>MIDI Devices</h2>
      <pre style={{background:"#111827",padding:12,borderRadius:8}}>
        {JSON.stringify(midiInfo,null,2)}
      </pre>

      <h2>Realtime Timeline</h2>
      <ul>
        {events.map(e=>(
          <li key={e.id}>
            <b>{e.type}</b> — {JSON.stringify(e.payload)}
          </li>
        ))}
      </ul>
    </div>
  );
}
'@ | Set-Content $App -Encoding UTF8

npm run build

if($LASTEXITCODE -ne 0){
  Write-Host "V1.9 BUILD FAIL" -ForegroundColor Red
  exit 1
}

Write-Host "V1.9 BUILD PASS" -ForegroundColor Green

if(Test-Path ".\UAOS_SAFE_TURBO.ps1"){
  powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
}else{
  Write-Host "UAOS_SAFE_TURBO.ps1 not found. Build only completed." -ForegroundColor Yellow
}