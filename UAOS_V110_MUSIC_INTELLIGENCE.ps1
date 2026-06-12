$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force src\core,src\audio,src\midi,src\timeline,src\arranger,reports | Out-Null

if(Test-Path "src\App.jsx"){
  Copy-Item "src\App.jsx" "src\App.backup-v110.jsx" -Force
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
}

export const uaosBus = new UAOSBus();
'@ | Set-Content "src\core\uaosBus.js" -Encoding UTF8

@'
export class UAOSTimeline {
  constructor(){
    this.key = "uaos.v110.timeline";
    this.items = JSON.parse(localStorage.getItem(this.key) || "[]");
  }

  add(ev){
    this.items.push(ev);
    if(this.items.length > 3000) this.items = this.items.slice(-3000);
    this.save();
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
      version: "1.10-music-intelligence",
      exportedAt: new Date().toISOString(),
      events: this.items
    }, null, 2);
  }
}

export const uaosTimeline = new UAOSTimeline();
'@ | Set-Content "src\timeline\uaosTimeline.js" -Encoding UTF8

@'
const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function freqToNote(freq){
  if(!freq || freq < 40 || freq > 2000) return null;
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  return {
    midi,
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    freq: Math.round(freq * 10) / 10
  };
}

function autoCorrelate(buffer, sampleRate){
  let size = buffer.length;
  let rms = 0;

  for(let i=0;i<size;i++){
    rms += buffer[i] * buffer[i];
  }

  rms = Math.sqrt(rms / size);
  if(rms < 0.01) return null;

  let bestOffset = -1;
  let bestCorrelation = 0;

  const minOffset = Math.floor(sampleRate / 1000);
  const maxOffset = Math.floor(sampleRate / 50);

  for(let offset = minOffset; offset < maxOffset; offset++){
    let correlation = 0;

    for(let i=0;i<size-offset;i++){
      correlation += Math.abs(buffer[i] - buffer[i+offset]);
    }

    correlation = 1 - correlation / (size - offset);

    if(correlation > bestCorrelation){
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if(bestCorrelation > 0.88 && bestOffset > 0){
    return sampleRate / bestOffset;
  }

  return null;
}

export class UAOSAudioIntelligence {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.ctx = null;
    this.analyser = null;
    this.running = false;
    this.lastBeat = 0;
    this.beats = [];
  }

  async start(){
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(stream);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;

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

    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Float32Array(this.analyser.fftSize);

    this.analyser.getByteFrequencyData(freqData);
    this.analyser.getFloatTimeDomainData(timeData);

    const level = Math.round(freqData.reduce((a,b)=>a+b,0) / freqData.length);
    const peak = Math.max(...freqData);

    const pitchHz = autoCorrelate(timeData, this.ctx.sampleRate);
    const note = freqToNote(pitchHz);

    let bpm = null;
    const now = performance.now();

    if(level > 75 && now - this.lastBeat > 260){
      if(this.lastBeat > 0){
        const diff = now - this.lastBeat;
        const instantBpm = Math.round(60000 / diff);

        if(instantBpm >= 60 && instantBpm <= 200){
          this.beats.push(instantBpm);
          if(this.beats.length > 8) this.beats.shift();
          bpm = Math.round(this.beats.reduce((a,b)=>a+b,0) / this.beats.length);
        }
      }
      this.lastBeat = now;
    }

    const ev = this.bus.emit("audio.intelligence", {
      level,
      peak,
      pitchHz: pitchHz ? Math.round(pitchHz * 10) / 10 : null,
      note,
      bpm
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
'@ | Set-Content "src\audio\uaosAudioIntelligence.js" -Encoding UTF8

@'
export class UAOSMidiEngine {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.access = null;
    this.outputs = [];
    this.selectedOutputId = "";
  }

  async start(){
    if(!navigator.requestMIDIAccess){
      const ev = this.bus.emit("midi.unsupported", {});
      this.timeline.add(ev);
      return;
    }

    this.access = await navigator.requestMIDIAccess();

    const inputs = [...this.access.inputs.values()];
    this.outputs = [...this.access.outputs.values()];

    const scan = this.bus.emit("midi.scan", {
      inputs: inputs.map(i => ({ id: i.id, name: i.name })),
      outputs: this.outputs.map(o => ({ id: o.id, name: o.name }))
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

  setOutput(id){
    this.selectedOutputId = id;
  }

  sendNote(note = 60, velocity = 100, duration = 250, channel = 1){
    const output = this.outputs.find(o => o.id === this.selectedOutputId) || this.outputs[0];
    if(!output) return false;

    const ch = Math.max(0, Math.min(15, channel - 1));
    output.send([0x90 + ch, note, velocity]);

    setTimeout(()=>{
      output.send([0x80 + ch, note, 0]);
    }, duration);

    return true;
  }
}
'@ | Set-Content "src\midi\uaosMidiEngine.js" -Encoding UTF8

@'
const CHORDS = {
  C: [60,64,67],
  Dm: [62,65,69],
  Em: [64,67,71],
  F: [65,69,72],
  G: [67,71,74],
  Am: [69,72,76]
};

export const UAOS_SECTIONS = ["INTRO","VAR_A","VAR_B","FILL","BREAK","ENDING"];

export class UAOSArrangerEngine {
  constructor(bus, timeline, midi){
    this.bus = bus;
    this.timeline = timeline;
    this.midi = midi;
    this.section = "VAR_A";
    this.chord = "C";
    this.running = false;
    this.step = 0;
    this.timer = null;
    this.bpm = 100;
  }

  setSection(section){
    this.section = section;
    const ev = this.bus.emit("arranger.section", { section });
    this.timeline.add(ev);
  }

  setChord(chord){
    this.chord = chord;
    const ev = this.bus.emit("arranger.chord", { chord });
    this.timeline.add(ev);
  }

  setBpm(bpm){
    if(bpm && bpm >= 60 && bpm <= 200){
      this.bpm = bpm;
      const ev = this.bus.emit("arranger.bpm", { bpm });
      this.timeline.add(ev);
    }
  }

  start(){
    this.running = true;
    this.tick();
  }

  stop(){
    this.running = false;
    if(this.timer) clearTimeout(this.timer);
    const ev = this.bus.emit("arranger.stopped", {});
    this.timeline.add(ev);
  }

  tick(){
    if(!this.running) return;

    const notes = CHORDS[this.chord] || CHORDS.C;
    const note = notes[this.step % notes.length];

    this.midi?.sendNote(note, 90, 160, 1);

    const ev = this.bus.emit("arranger.step", {
      section: this.section,
      chord: this.chord,
      step: this.step,
      note,
      bpm: this.bpm
    });

    this.timeline.add(ev);

    this.step++;

    const interval = Math.round(60000 / this.bpm / 2);
    this.timer = setTimeout(()=>this.tick(), interval);
  }

  state(){
    return {
      section: this.section,
      chord: this.chord,
      bpm: this.bpm,
      running: this.running
    };
  }
}
'@ | Set-Content "src\arranger\uaosArrangerEngine.js" -Encoding UTF8

@'
import React, { useEffect, useMemo, useState } from "react";
import { uaosBus } from "./core/uaosBus.js";
import { uaosTimeline } from "./timeline/uaosTimeline.js";
import { UAOSAudioIntelligence } from "./audio/uaosAudioIntelligence.js";
import { UAOSMidiEngine } from "./midi/uaosMidiEngine.js";
import { UAOSArrangerEngine, UAOS_SECTIONS } from "./arranger/uaosArrangerEngine.js";

const chords = ["C","Dm","Em","F","G","Am"];

export default function App(){
  const midi = useMemo(()=>new UAOSMidiEngine(uaosBus, uaosTimeline), []);
  const audio = useMemo(()=>new UAOSAudioIntelligence(uaosBus, uaosTimeline), []);
  const arranger = useMemo(()=>new UAOSArrangerEngine(uaosBus, uaosTimeline, midi), [midi]);

  const [status,setStatus] = useState("READY");
  const [audioState,setAudioState] = useState({level:0, peak:0, pitchHz:null, note:null, bpm:null});
  const [midiInfo,setMidiInfo] = useState({inputs:[], outputs:[]});
  const [events,setEvents] = useState([]);
  const [arrangerState,setArrangerState] = useState(arranger.state());

  useEffect(()=>{
    uaosBus.on("*", () => {
      setEvents([...uaosTimeline.load()].slice(-60).reverse());
      setArrangerState(arranger.state());
    });

    uaosBus.on("audio.intelligence", ev => {
      setAudioState(ev.payload);
      if(ev.payload.bpm) arranger.setBpm(ev.payload.bpm);
    });

    uaosBus.on("midi.scan", ev => {
      setMidiInfo(ev.payload);
    });
  },[arranger]);

  async function startAudio(){
    try{
      setStatus("STARTING AUDIO INTELLIGENCE...");
      await audio.start();
      setStatus("AUDIO INTELLIGENCE RUNNING");
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

  function exportTimeline(){
    const blob = new Blob([uaosTimeline.exportJson()], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uaos-v110-timeline.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{
      minHeight:"100vh",
      background:"#070b14",
      color:"white",
      fontFamily:"Arial",
      padding:24
    }}>
      <h1>UAOS V1.10 Music Intelligence</h1>
      <p>Real audio intelligence + pitch estimate + BPM estimate + MIDI routing + arranger pattern engine.</p>

      <h3>Status: {status}</h3>

      <button onClick={startAudio}>Start Audio Intelligence</button>
      <button onClick={startMidi} style={{marginLeft:8}}>Start MIDI</button>
      <button onClick={()=>arranger.start()} style={{marginLeft:8}}>Start Arranger</button>
      <button onClick={()=>arranger.stop()} style={{marginLeft:8}}>Stop Arranger</button>
      <button onClick={()=>{uaosTimeline.clear();setEvents([])}} style={{marginLeft:8}}>Clear Timeline</button>
      <button onClick={exportTimeline} style={{marginLeft:8}}>Export Timeline</button>

      <h2>Audio Intelligence</h2>
      <p>
        Level: {audioState.level} |
        Peak: {audioState.peak} |
        Pitch: {audioState.pitchHz || "-"} Hz |
        Note: {audioState.note ? `${audioState.note.name}${audioState.note.octave}` : "-"} |
        BPM: {audioState.bpm || arrangerState.bpm}
      </p>
      <progress value={audioState.level} max="255" style={{width:"100%"}} />

      <h2>MIDI Routing</h2>
      <select onChange={e=>midi.setOutput(e.target.value)}>
        <option value="">Auto output</option>
        {midiInfo.outputs.map(o=>(
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>

      <pre style={{background:"#111827",padding:12,borderRadius:8}}>
        {JSON.stringify(midiInfo,null,2)}
      </pre>

      <h2>Arranger Engine</h2>
      <p>
        Section: {arrangerState.section} |
        Chord: {arrangerState.chord} |
        BPM: {arrangerState.bpm} |
        Running: {String(arrangerState.running)}
      </p>

      <div>
        {UAOS_SECTIONS.map(s=>(
          <button key={s} onClick={()=>arranger.setSection(s)} style={{margin:4}}>
            {s}
          </button>
        ))}
      </div>

      <div>
        {chords.map(c=>(
          <button key={c} onClick={()=>arranger.setChord(c)} style={{margin:4}}>
            {c}
          </button>
        ))}
      </div>

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
'@ | Set-Content "src\App.jsx" -Encoding UTF8

npm run build

if($LASTEXITCODE -ne 0){
  Write-Host "UAOS V1.10 BUILD FAIL" -ForegroundColor Red
  exit 1
}

Write-Host "UAOS V1.10 BUILD PASS" -ForegroundColor Green

if(Test-Path ".\UAOS_SAFE_TURBO.ps1"){
  powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
}else{
  Write-Host "SAFE TURBO not found. Build completed only." -ForegroundColor Yellow
}