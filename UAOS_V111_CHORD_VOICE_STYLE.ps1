$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force src\core,src\audio,src\midi,src\timeline,src\arranger,src\profiles,reports | Out-Null

if(Test-Path "src\App.jsx"){
  Copy-Item "src\App.jsx" "src\App.backup-v111.jsx" -Force
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
    this.key = "uaos.v111.timeline";
    this.items = JSON.parse(localStorage.getItem(this.key) || "[]");
  }

  add(ev){
    this.items.push(ev);
    if(this.items.length > 5000) this.items = this.items.slice(-5000);
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
      version: "1.11-chord-voice-style",
      exportedAt: new Date().toISOString(),
      events: this.items
    }, null, 2);
  }
}

export const uaosTimeline = new UAOSTimeline();
'@ | Set-Content "src\timeline\uaosTimeline.js" -Encoding UTF8

@'
const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export function midiToName(midi){
  return NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

export function freqToNote(freq){
  if(!freq || freq < 40 || freq > 2000) return null;

  const midi = Math.round(69 + 12 * Math.log2(freq / 440));

  return {
    midi,
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    label: midiToName(midi),
    freq: Math.round(freq * 10) / 10
  };
}

export function autoCorrelate(buffer, sampleRate){
  let size = buffer.length;
  let rms = 0;

  for(let i=0;i<size;i++){
    rms += buffer[i] * buffer[i];
  }

  rms = Math.sqrt(rms / size);
  if(rms < 0.012) return null;

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

export function guessChordFromNotes(notes){
  if(!notes || notes.length < 2) return null;

  const pcs = [...new Set(notes.map(n => ((n % 12) + 12) % 12))];

  const chordTypes = [
    { suffix:"", intervals:[0,4,7] },
    { suffix:"m", intervals:[0,3,7] },
    { suffix:"7", intervals:[0,4,7,10] },
    { suffix:"maj7", intervals:[0,4,7,11] },
    { suffix:"m7", intervals:[0,3,7,10] },
    { suffix:"sus4", intervals:[0,5,7] }
  ];

  let best = null;

  for(let root=0; root<12; root++){
    for(const type of chordTypes){
      const target = type.intervals.map(i => (root + i) % 12);
      const hits = target.filter(t => pcs.includes(t)).length;
      const score = hits / target.length;

      if(!best || score > best.score){
        best = {
          chord: NOTE_NAMES[root] + type.suffix,
          root: NOTE_NAMES[root],
          score,
          notes: pcs.map(pc => NOTE_NAMES[pc])
        };
      }
    }
  }

  if(best && best.score >= 0.66) return best;
  return null;
}
'@ | Set-Content "src\audio\musicTheory.js" -Encoding UTF8

@'
import { autoCorrelate, freqToNote, guessChordFromNotes } from "./musicTheory.js";

export class UAOSAudioIntelligence {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.ctx = null;
    this.analyser = null;
    this.running = false;
    this.lastBeat = 0;
    this.beats = [];
    this.noteWindow = [];
    this.lastVoiceMidi = null;
    this.voiceGate = false;
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

    if(note && level > 18){
      this.noteWindow.push({
        midi: note.midi,
        ts: Date.now()
      });

      this.noteWindow = this.noteWindow.filter(n => Date.now() - n.ts < 2200);
    }

    const chord = guessChordFromNotes(this.noteWindow.map(n => n.midi));

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

    if(note && level > 22 && this.lastVoiceMidi !== note.midi){
      const voiceEv = this.bus.emit("voice.midi.draft", {
        note: note.label,
        midi: note.midi,
        velocity: Math.max(30, Math.min(120, level)),
        pitchHz: note.freq
      });

      this.timeline.add(voiceEv);
      this.lastVoiceMidi = note.midi;
      this.voiceGate = true;
    }

    if(level < 10 && this.voiceGate){
      const offEv = this.bus.emit("voice.midi.off", {
        midi: this.lastVoiceMidi
      });

      this.timeline.add(offEv);
      this.voiceGate = false;
      this.lastVoiceMidi = null;
    }

    const ev = this.bus.emit("audio.intelligence", {
      level,
      peak,
      pitchHz: pitchHz ? Math.round(pitchHz * 10) / 10 : null,
      note,
      chord,
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
export const KEYBOARD_PROFILES = {
  GENERAL_MIDI: {
    name: "General MIDI",
    channel: 1,
    transpose: 0,
    styleStart: null,
    styleStop: null
  },
  KORG_PA: {
    name: "KORG PA Series Draft",
    channel: 1,
    transpose: 0,
    styleStart: [0xFA],
    styleStop: [0xFC]
  },
  YAMAHA_GENOS: {
    name: "Yamaha Genos Draft",
    channel: 1,
    transpose: 0,
    styleStart: [0xFA],
    styleStop: [0xFC]
  },
  KETRON_SD: {
    name: "Ketron SD Draft",
    channel: 1,
    transpose: 0,
    styleStart: [0xFA],
    styleStop: [0xFC]
  }
};
'@ | Set-Content "src\profiles\keyboardProfiles.js" -Encoding UTF8

@'
import { KEYBOARD_PROFILES } from "../profiles/keyboardProfiles.js";

export class UAOSMidiEngine {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.access = null;
    this.outputs = [];
    this.selectedOutputId = "";
    this.profileKey = "GENERAL_MIDI";
  }

  profile(){
    return KEYBOARD_PROFILES[this.profileKey] || KEYBOARD_PROFILES.GENERAL_MIDI;
  }

  setProfile(key){
    this.profileKey = key;
    const ev = this.bus.emit("midi.profile", {
      key,
      profile: this.profile()
    });
    this.timeline.add(ev);
  }

  async start(){
    if(!navigator.requestMIDIAccess){
      const ev = this.bus.emit("midi.unsupported", {});
      this.timeline.add(ev);
      return;
    }

    this.access = await navigator.requestMIDIAccess({ sysex:false });

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

  output(){
    return this.outputs.find(o => o.id === this.selectedOutputId) || this.outputs[0];
  }

  sendRaw(bytes){
    const output = this.output();
    if(!output) return false;
    output.send(bytes);
    return true;
  }

  sendNote(note = 60, velocity = 100, duration = 250, channel = null){
    const output = this.output();
    if(!output) return false;

    const profile = this.profile();
    const ch = Math.max(0, Math.min(15, (channel || profile.channel) - 1));
    const finalNote = Math.max(0, Math.min(127, note + (profile.transpose || 0)));

    output.send([0x90 + ch, finalNote, velocity]);

    setTimeout(()=>{
      output.send([0x80 + ch, finalNote, 0]);
    }, duration);

    return true;
  }

  styleStart(){
    const p = this.profile();
    if(p.styleStart) return this.sendRaw(p.styleStart);
    return false;
  }

  styleStop(){
    const p = this.profile();
    if(p.styleStop) return this.sendRaw(p.styleStop);
    return false;
  }
}
'@ | Set-Content "src\midi\uaosMidiEngine.js" -Encoding UTF8

@'
const DEFAULT_PATTERNS = {
  POP_8BEAT: {
    name: "Pop 8 Beat Draft",
    steps: [0,1,2,1,0,1,2,1]
  },
  ORIENTAL_BALADI: {
    name: "Oriental Baladi Draft",
    steps: [0,0,2,1,0,2,1,1]
  },
  SLOW_6_8: {
    name: "Slow 6/8 Draft",
    steps: [0,2,1,0,2,1]
  }
};

const CHORDS = {
  C: [60,64,67],
  Dm: [62,65,69],
  Em: [64,67,71],
  F: [65,69,72],
  G: [67,71,74],
  Am: [69,72,76],
  A: [69,73,76],
  E: [64,68,71],
  D: [62,66,69]
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
    this.patternKey = "POP_8BEAT";
    this.patterns = JSON.parse(localStorage.getItem("uaos.v111.patterns") || "null") || DEFAULT_PATTERNS;
  }

  savePatterns(){
    localStorage.setItem("uaos.v111.patterns", JSON.stringify(this.patterns));
  }

  learnCurrentPattern(){
    const key = "USER_PATTERN_" + Date.now();
    this.patterns[key] = {
      name: "User Pattern " + new Date().toLocaleTimeString(),
      steps: [0,1,2,1,0,2,1,2]
    };
    this.patternKey = key;
    this.savePatterns();

    const ev = this.bus.emit("pattern.learned", {
      key,
      pattern: this.patterns[key]
    });

    this.timeline.add(ev);
  }

  setPattern(key){
    this.patternKey = key;
    const ev = this.bus.emit("pattern.selected", {
      key,
      pattern: this.patterns[key]
    });
    this.timeline.add(ev);
  }

  setSection(section){
    this.section = section;
    const ev = this.bus.emit("arranger.section", { section });
    this.timeline.add(ev);
  }

  setChord(chord){
    if(chord && chord.chord) chord = chord.chord;
    this.chord = CHORDS[chord] ? chord : "C";
    const ev = this.bus.emit("arranger.chord", { chord: this.chord });
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
    this.midi?.styleStart();
    this.tick();
  }

  stop(){
    this.running = false;
    if(this.timer) clearTimeout(this.timer);
    this.midi?.styleStop();
    const ev = this.bus.emit("arranger.stopped", {});
    this.timeline.add(ev);
  }

  tick(){
    if(!this.running) return;

    const pattern = this.patterns[this.patternKey] || DEFAULT_PATTERNS.POP_8BEAT;
    const notes = CHORDS[this.chord] || CHORDS.C;
    const index = pattern.steps[this.step % pattern.steps.length] % notes.length;
    const note = notes[index];

    this.midi?.sendNote(note, 88, 140, 1);

    const ev = this.bus.emit("arranger.step", {
      section: this.section,
      chord: this.chord,
      pattern: pattern.name,
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
      running: this.running,
      patternKey: this.patternKey,
      patterns: this.patterns
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
import { KEYBOARD_PROFILES } from "./profiles/keyboardProfiles.js";

const manualChords = ["C","Dm","Em","F","G","Am","A","E","D"];

export default function App(){
  const midi = useMemo(()=>new UAOSMidiEngine(uaosBus, uaosTimeline), []);
  const audio = useMemo(()=>new UAOSAudioIntelligence(uaosBus, uaosTimeline), []);
  const arranger = useMemo(()=>new UAOSArrangerEngine(uaosBus, uaosTimeline, midi), [midi]);

  const [status,setStatus] = useState("READY");
  const [audioState,setAudioState] = useState({level:0, peak:0, pitchHz:null, note:null, chord:null, bpm:null});
  const [midiInfo,setMidiInfo] = useState({inputs:[], outputs:[]});
  const [events,setEvents] = useState([]);
  const [arrangerState,setArrangerState] = useState(arranger.state());
  const [voiceMidi,setVoiceMidi] = useState(null);

  useEffect(()=>{
    uaosBus.on("*", () => {
      setEvents([...uaosTimeline.load()].slice(-80).reverse());
      setArrangerState(arranger.state());
    });

    uaosBus.on("audio.intelligence", ev => {
      setAudioState(ev.payload);
      if(ev.payload.bpm) arranger.setBpm(ev.payload.bpm);
      if(ev.payload.chord) arranger.setChord(ev.payload.chord.chord);
    });

    uaosBus.on("voice.midi.draft", ev => {
      setVoiceMidi(ev.payload);
    });

    uaosBus.on("midi.scan", ev => {
      setMidiInfo(ev.payload);
    });
  },[arranger]);

  async function startAudio(){
    try{
      setStatus("STARTING AUDIO INTELLIGENCE...");
      await audio.start();
      setStatus("AUDIO + CHORD + VOICE MIDI RUNNING");
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
    a.download = "uaos-v111-timeline.json";
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
      <h1>UAOS V1.11 Chord + Voice + Style</h1>
      <p>Chord detection draft, voice-to-MIDI draft, pattern memory, and keyboard sync profiles.</p>

      <h3>Status: {status}</h3>

      <button onClick={startAudio}>Start Chord / Voice Engine</button>
      <button onClick={startMidi} style={{marginLeft:8}}>Start MIDI</button>
      <button onClick={()=>arranger.start()} style={{marginLeft:8}}>Start Arranger</button>
      <button onClick={()=>arranger.stop()} style={{marginLeft:8}}>Stop Arranger</button>
      <button onClick={()=>arranger.learnCurrentPattern()} style={{marginLeft:8}}>Learn Pattern</button>
      <button onClick={()=>{uaosTimeline.clear();setEvents([])}} style={{marginLeft:8}}>Clear Timeline</button>
      <button onClick={exportTimeline} style={{marginLeft:8}}>Export Timeline</button>

      <h2>Audio Intelligence</h2>
      <p>
        Level: {audioState.level} |
        Peak: {audioState.peak} |
        Pitch: {audioState.pitchHz || "-"} Hz |
        Note: {audioState.note ? audioState.note.label : "-"} |
        Chord: {audioState.chord ? `${audioState.chord.chord} (${Math.round(audioState.chord.score*100)}%)` : "-"} |
        BPM: {audioState.bpm || arrangerState.bpm}
      </p>
      <progress value={audioState.level} max="255" style={{width:"100%"}} />

      <h2>Voice-to-MIDI Draft</h2>
      <pre style={{background:"#111827",padding:12,borderRadius:8}}>
        {JSON.stringify(voiceMidi,null,2)}
      </pre>

      <h2>Keyboard Profile</h2>
      <select onChange={e=>midi.setProfile(e.target.value)}>
        {Object.keys(KEYBOARD_PROFILES).map(k=>(
          <option key={k} value={k}>{KEYBOARD_PROFILES[k].name}</option>
        ))}
      </select>

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
        Pattern: {arrangerState.patterns[arrangerState.patternKey]?.name} |
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
        {manualChords.map(c=>(
          <button key={c} onClick={()=>arranger.setChord(c)} style={{margin:4}}>
            {c}
          </button>
        ))}
      </div>

      <h3>Pattern Memory</h3>
      <select onChange={e=>arranger.setPattern(e.target.value)} value={arrangerState.patternKey}>
        {Object.entries(arrangerState.patterns).map(([key,p])=>(
          <option key={key} value={key}>{p.name}</option>
        ))}
      </select>

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
  Write-Host "UAOS V1.11 BUILD FAIL" -ForegroundColor Red
  exit 1
}

Write-Host "UAOS V1.11 BUILD PASS" -ForegroundColor Green

if(Test-Path ".\UAOS_SAFE_TURBO.ps1"){
  powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
}else{
  Write-Host "SAFE TURBO not found. Build completed only." -ForegroundColor Yellow
}