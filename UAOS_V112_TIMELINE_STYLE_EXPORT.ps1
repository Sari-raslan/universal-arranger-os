$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force src\core,src\midi,src\timeline,src\arranger,src\profiles,src\style,reports | Out-Null

if(Test-Path "src\App.jsx"){
  Copy-Item "src\App.jsx" "src\App.backup-v112.jsx" -Force
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
    this.key = "uaos.v112.timeline";
    this.items = JSON.parse(localStorage.getItem(this.key) || "[]");
    this.recording = true;
  }

  add(ev){
    if(!this.recording) return;
    this.items.push(ev);
    if(this.items.length > 8000) this.items = this.items.slice(-8000);
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

  setRecording(v){
    this.recording = !!v;
  }

  exportJson(){
    return JSON.stringify({
      product: "UAOS",
      version: "1.12-timeline-style-export",
      exportedAt: new Date().toISOString(),
      events: this.items
    }, null, 2);
  }
}

export const uaosTimeline = new UAOSTimeline();
'@ | Set-Content "src\timeline\uaosTimeline.js" -Encoding UTF8

@'
export class UAOSTimelinePlayer {
  constructor(bus, timeline, midi){
    this.bus = bus;
    this.timeline = timeline;
    this.midi = midi;
    this.running = false;
    this.timer = null;
    this.index = 0;
  }

  play(){
    const items = this.timeline.load();
    if(!items.length) return false;

    this.running = true;
    this.index = 0;

    const start = items[0].time || 0;
    this.schedule(items, start);

    const ev = this.bus.emit("timeline.play.start", { count: items.length });
    this.timeline.add(ev);

    return true;
  }

  stop(){
    this.running = false;
    if(this.timer) clearTimeout(this.timer);

    const ev = this.bus.emit("timeline.play.stop", {});
    this.timeline.add(ev);
  }

  schedule(items, start){
    if(!this.running || this.index >= items.length){
      this.running = false;
      this.bus.emit("timeline.play.done", {});
      return;
    }

    const ev = items[this.index];
    const prev = this.index === 0 ? start : items[this.index - 1].time;
    const delay = Math.max(0, Math.min(1000, (ev.time || 0) - (prev || 0)));

    this.timer = setTimeout(()=>{
      this.replayEvent(ev);
      this.index++;
      this.schedule(items, start);
    }, delay);
  }

  replayEvent(ev){
    this.bus.emit("timeline.replay.event", {
      type: ev.type,
      payload: ev.payload
    });

    if(ev.type === "midi.noteon"){
      this.midi?.sendNote(ev.payload.note, ev.payload.velocity || 90, 180, ev.payload.channel || 1);
    }

    if(ev.type === "arranger.step"){
      this.midi?.sendNote(ev.payload.note, 88, 160, 1);
    }

    if(ev.type === "voice.midi.draft"){
      this.midi?.sendNote(ev.payload.midi, ev.payload.velocity || 80, 180, 1);
    }
  }
}
'@ | Set-Content "src\timeline\uaosTimelinePlayer.js" -Encoding UTF8

@'
export const KEYBOARD_PROFILES = {
  GENERAL_MIDI: {
    name: "General MIDI",
    channel: 1,
    transpose: 0,
    controls: {
      start: [0xFA],
      stop: [0xFC],
      continue: [0xFB]
    },
    sections: {
      INTRO: null,
      VAR_A: null,
      VAR_B: null,
      FILL: null,
      BREAK: null,
      ENDING: null
    }
  },
  KORG_PA: {
    name: "KORG PA Series Draft",
    channel: 1,
    transpose: 0,
    controls: {
      start: [0xFA],
      stop: [0xFC],
      continue: [0xFB]
    },
    sections: {
      INTRO: [0xC0, 80],
      VAR_A: [0xC0, 81],
      VAR_B: [0xC0, 82],
      FILL: [0xC0, 83],
      BREAK: [0xC0, 84],
      ENDING: [0xC0, 85]
    }
  },
  YAMAHA_GENOS: {
    name: "Yamaha Genos Draft",
    channel: 1,
    transpose: 0,
    controls: {
      start: [0xFA],
      stop: [0xFC],
      continue: [0xFB]
    },
    sections: {
      INTRO: [0xC0, 70],
      VAR_A: [0xC0, 71],
      VAR_B: [0xC0, 72],
      FILL: [0xC0, 73],
      BREAK: [0xC0, 74],
      ENDING: [0xC0, 75]
    }
  },
  KETRON_SD: {
    name: "Ketron SD Draft",
    channel: 1,
    transpose: 0,
    controls: {
      start: [0xFA],
      stop: [0xFC],
      continue: [0xFB]
    },
    sections: {
      INTRO: [0xC0, 60],
      VAR_A: [0xC0, 61],
      VAR_B: [0xC0, 62],
      FILL: [0xC0, 63],
      BREAK: [0xC0, 64],
      ENDING: [0xC0, 65]
    }
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
    this.recordedNotes = [];
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

        const payload = {
          device: input.name,
          status,
          command,
          channel,
          note,
          velocity
        };

        if(type === "midi.noteon"){
          this.recordedNotes.push({
            note,
            velocity,
            channel,
            time: performance.now()
          });

          if(this.recordedNotes.length > 256){
            this.recordedNotes = this.recordedNotes.slice(-256);
          }
        }

        const ev = this.bus.emit(type, payload);
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
    if(!output || !bytes) return false;
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

  transportStart(){
    return this.sendRaw(this.profile().controls.start);
  }

  transportStop(){
    return this.sendRaw(this.profile().controls.stop);
  }

  sendSection(section){
    const bytes = this.profile().sections[section];
    return this.sendRaw(bytes);
  }

  getRecordedNotes(){
    return this.recordedNotes;
  }

  clearRecordedNotes(){
    this.recordedNotes = [];
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
    this.patterns = JSON.parse(localStorage.getItem("uaos.v112.patterns") || "null") || DEFAULT_PATTERNS;
    this.sectionMemory = JSON.parse(localStorage.getItem("uaos.v112.sectionMemory") || "null") || {};
  }

  save(){
    localStorage.setItem("uaos.v112.patterns", JSON.stringify(this.patterns));
    localStorage.setItem("uaos.v112.sectionMemory", JSON.stringify(this.sectionMemory));
  }

  learnFromMidi(notes){
    if(!notes || !notes.length) return false;

    const base = notes.slice(-16);
    const mapped = base.map(n => Math.abs(n.note % 3));

    const key = "MIDI_PATTERN_" + Date.now();

    this.patterns[key] = {
      name: "Recorded MIDI Pattern " + new Date().toLocaleTimeString(),
      steps: mapped.length ? mapped : [0,1,2,1]
    };

    this.patternKey = key;
    this.save();

    const ev = this.bus.emit("pattern.learned.from-midi", {
      key,
      pattern: this.patterns[key]
    });

    this.timeline.add(ev);

    return true;
  }

  memorizeSection(){
    this.sectionMemory[this.section] = {
      chord: this.chord,
      patternKey: this.patternKey,
      bpm: this.bpm
    };

    this.save();

    const ev = this.bus.emit("section.memory.saved", {
      section: this.section,
      memory: this.sectionMemory[this.section]
    });

    this.timeline.add(ev);
  }

  recallSection(section){
    const mem = this.sectionMemory[section];
    if(!mem) return false;

    this.section = section;
    this.chord = mem.chord || this.chord;
    this.patternKey = mem.patternKey || this.patternKey;
    this.bpm = mem.bpm || this.bpm;

    const ev = this.bus.emit("section.memory.recalled", {
      section,
      memory: mem
    });

    this.timeline.add(ev);

    return true;
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
    this.midi?.sendSection(section);

    const ev = this.bus.emit("arranger.section", { section });
    this.timeline.add(ev);
  }

  setChord(chord){
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
    this.midi?.transportStart();
    this.tick();
  }

  stop(){
    this.running = false;
    if(this.timer) clearTimeout(this.timer);
    this.midi?.transportStop();

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

  exportStyle(){
    return JSON.stringify({
      product: "UAOS",
      version: "1.12-style-json",
      exportedAt: new Date().toISOString(),
      bpm: this.bpm,
      activeSection: this.section,
      activeChord: this.chord,
      activePattern: this.patternKey,
      patterns: this.patterns,
      sectionMemory: this.sectionMemory
    }, null, 2);
  }

  state(){
    return {
      section: this.section,
      chord: this.chord,
      bpm: this.bpm,
      running: this.running,
      patternKey: this.patternKey,
      patterns: this.patterns,
      sectionMemory: this.sectionMemory
    };
  }
}
'@ | Set-Content "src\arranger\uaosArrangerEngine.js" -Encoding UTF8

@'
import React, { useEffect, useMemo, useState } from "react";
import { uaosBus } from "./core/uaosBus.js";
import { uaosTimeline } from "./timeline/uaosTimeline.js";
import { UAOSTimelinePlayer } from "./timeline/uaosTimelinePlayer.js";
import { UAOSMidiEngine } from "./midi/uaosMidiEngine.js";
import { UAOSArrangerEngine, UAOS_SECTIONS } from "./arranger/uaosArrangerEngine.js";
import { KEYBOARD_PROFILES } from "./profiles/keyboardProfiles.js";

const chords = ["C","Dm","Em","F","G","Am","A","E","D"];

function downloadText(filename, text){
  const blob = new Blob([text], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App(){
  const midi = useMemo(()=>new UAOSMidiEngine(uaosBus, uaosTimeline), []);
  const arranger = useMemo(()=>new UAOSArrangerEngine(uaosBus, uaosTimeline, midi), [midi]);
  const player = useMemo(()=>new UAOSTimelinePlayer(uaosBus, uaosTimeline, midi), [midi]);

  const [status,setStatus] = useState("READY");
  const [midiInfo,setMidiInfo] = useState({inputs:[], outputs:[]});
  const [events,setEvents] = useState([]);
  const [arrangerState,setArrangerState] = useState(arranger.state());
  const [recording,setRecording] = useState(true);

  useEffect(()=>{
    uaosBus.on("*", () => {
      setEvents([...uaosTimeline.load()].slice(-90).reverse());
      setArrangerState(arranger.state());
    });

    uaosBus.on("midi.scan", ev => {
      setMidiInfo(ev.payload);
    });
  },[arranger]);

  async function startMidi(){
    try{
      setStatus("STARTING MIDI...");
      await midi.start();
      setStatus("MIDI READY — RECORDING ENABLED");
    }catch(e){
      setStatus("MIDI ERROR: " + e.message);
    }
  }

  function toggleRecording(){
    const next = !recording;
    setRecording(next);
    uaosTimeline.setRecording(next);
    setStatus(next ? "TIMELINE RECORDING ON" : "TIMELINE RECORDING OFF");
  }

  function learnMidiPattern(){
    const ok = arranger.learnFromMidi(midi.getRecordedNotes());
    setStatus(ok ? "MIDI PATTERN LEARNED" : "NO MIDI NOTES TO LEARN");
  }

  return (
    <div style={{
      minHeight:"100vh",
      background:"#070b14",
      color:"white",
      fontFamily:"Arial",
      padding:24
    }}>
      <h1>UAOS V1.12 Timeline + Style Export</h1>
      <p>Timeline player, MIDI recorder, section memory, keyboard mapping, and UAOS style JSON export.</p>

      <h3>Status: {status}</h3>

      <button onClick={startMidi}>Start MIDI Recorder</button>
      <button onClick={()=>arranger.start()} style={{marginLeft:8}}>Start Arranger</button>
      <button onClick={()=>arranger.stop()} style={{marginLeft:8}}>Stop Arranger</button>
      <button onClick={()=>player.play()} style={{marginLeft:8}}>Play Timeline</button>
      <button onClick={()=>player.stop()} style={{marginLeft:8}}>Stop Timeline</button>
      <button onClick={toggleRecording} style={{marginLeft:8}}>
        {recording ? "Pause Recording" : "Resume Recording"}
      </button>
      <button onClick={()=>{uaosTimeline.clear();setEvents([])}} style={{marginLeft:8}}>Clear Timeline</button>

      <div style={{marginTop:12}}>
        <button onClick={learnMidiPattern}>Learn Pattern From MIDI</button>
        <button onClick={()=>arranger.memorizeSection()} style={{marginLeft:8}}>Save Section Memory</button>
        <button onClick={()=>downloadText("uaos-v112-timeline.json", uaosTimeline.exportJson())} style={{marginLeft:8}}>Export Timeline JSON</button>
        <button onClick={()=>downloadText("uaos-v112-style.json", arranger.exportStyle())} style={{marginLeft:8}}>Export UAOS Style JSON</button>
      </div>

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
        {UAOS_SECTIONS.map(s=>(
          <button key={"recall-"+s} onClick={()=>arranger.recallSection(s)} style={{margin:4}}>
            Recall {s}
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

      <h3>Pattern Memory</h3>
      <select onChange={e=>arranger.setPattern(e.target.value)} value={arrangerState.patternKey}>
        {Object.entries(arrangerState.patterns).map(([key,p])=>(
          <option key={key} value={key}>{p.name}</option>
        ))}
      </select>

      <h3>Section Memory</h3>
      <pre style={{background:"#111827",padding:12,borderRadius:8}}>
        {JSON.stringify(arrangerState.sectionMemory,null,2)}
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
'@ | Set-Content "src\App.jsx" -Encoding UTF8

npm run build

if($LASTEXITCODE -ne 0){
  Write-Host "UAOS V1.12 BUILD FAIL" -ForegroundColor Red
  exit 1
}

Write-Host "UAOS V1.12 BUILD PASS" -ForegroundColor Green

if(Test-Path ".\UAOS_SAFE_TURBO.ps1"){
  powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
}else{
  Write-Host "SAFE TURBO not found. Build completed only." -ForegroundColor Yellow
}