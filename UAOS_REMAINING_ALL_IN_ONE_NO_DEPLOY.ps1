$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

$App="$Root\uaos-live-clean"
$Src="$App\src"
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"

New-Item -ItemType Directory -Force "$Src\core","$Src\engines","$Src\ui","reports","release-kit" | Out-Null

$Log="reports\UAOS_REMAINING_ALL_IN_ONE_$Stamp.txt"

function L($m){
  "[$(Get-Date -Format HH:mm:ss)] $m" | Tee-Object -FilePath $Log -Append
}

L "UAOS REMAINING ALL-IN-ONE START"
L "NO DEPLOY MODE"

if(Test-Path "$Src\App.jsx"){
  Copy-Item "$Src\App.jsx" "$Src\App.backup-all-in-one-$Stamp.jsx" -Force
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
    (this.handlers[type] || []).forEach(fn => fn(ev));
    (this.handlers["*"] || []).forEach(fn => fn(ev));
    return ev;
  }
  all(){
    return this.events;
  }
}
export const uaosBus = new UAOSBus();
'@ | Set-Content "$Src\core\uaosBus.js" -Encoding UTF8

@'
export class UAOSTimeline {
  constructor(){
    this.key = "uaos.final.timeline";
    this.items = JSON.parse(localStorage.getItem(this.key) || "[]");
    this.recording = true;
  }
  add(ev){
    if(!this.recording) return;
    this.items.push(ev);
    if(this.items.length > 10000) this.items = this.items.slice(-10000);
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
      product:"UAOS",
      version:"final-foundation",
      exportedAt:new Date().toISOString(),
      events:this.items
    }, null, 2);
  }
}
export const uaosTimeline = new UAOSTimeline();
'@ | Set-Content "$Src\core\uaosTimeline.js" -Encoding UTF8

@'
const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export function freqToNote(freq){
  if(!freq || freq < 40 || freq > 2000) return null;
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  return {
    midi,
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    label: NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1),
    freq: Math.round(freq * 10) / 10
  };
}

export function guessChord(notes){
  if(!notes || notes.length < 2) return null;
  const pcs = [...new Set(notes.map(n => ((n % 12) + 12) % 12))];
  const types = [
    {s:"", i:[0,4,7]},
    {s:"m", i:[0,3,7]},
    {s:"7", i:[0,4,7,10]},
    {s:"m7", i:[0,3,7,10]},
    {s:"sus4", i:[0,5,7]}
  ];
  let best = null;
  for(let r=0;r<12;r++){
    for(const t of types){
      const target = t.i.map(x => (r+x)%12);
      const hits = target.filter(x => pcs.includes(x)).length;
      const score = hits / target.length;
      if(!best || score > best.score){
        best = { chord:NOTE_NAMES[r]+t.s, score, notes:pcs.map(x=>NOTE_NAMES[x]) };
      }
    }
  }
  return best && best.score >= 0.66 ? best : null;
}
'@ | Set-Content "$Src\engines\musicTheory.js" -Encoding UTF8

@'
import { freqToNote, guessChord } from "./musicTheory.js";

function autoCorrelate(buffer, sampleRate){
  let rms = 0;
  for(let i=0;i<buffer.length;i++) rms += buffer[i]*buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if(rms < 0.012) return null;

  let bestOffset = -1;
  let best = 0;
  const minOffset = Math.floor(sampleRate / 1000);
  const maxOffset = Math.floor(sampleRate / 50);

  for(let offset=minOffset; offset<maxOffset; offset++){
    let corr = 0;
    for(let i=0;i<buffer.length-offset;i++){
      corr += Math.abs(buffer[i] - buffer[i+offset]);
    }
    corr = 1 - corr / (buffer.length - offset);
    if(corr > best){
      best = corr;
      bestOffset = offset;
    }
  }

  if(best > 0.88 && bestOffset > 0) return sampleRate / bestOffset;
  return null;
}

export class UAOSAudioEngine {
  constructor(bus,timeline){
    this.bus=bus;
    this.timeline=timeline;
    this.running=false;
    this.noteWindow=[];
    this.beats=[];
    this.lastBeat=0;
  }

  async start(){
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    src.connect(this.analyser);
    this.running = true;
    this.timeline.add(this.bus.emit("audio.started",{sampleRate:this.ctx.sampleRate}));
    this.loop();
  }

  loop(){
    if(!this.running || !this.analyser) return;

    const f = new Uint8Array(this.analyser.frequencyBinCount);
    const t = new Float32Array(this.analyser.fftSize);

    this.analyser.getByteFrequencyData(f);
    this.analyser.getFloatTimeDomainData(t);

    const level = Math.round(f.reduce((a,b)=>a+b,0)/f.length);
    const peak = Math.max(...f);
    const pitchHz = autoCorrelate(t, this.ctx.sampleRate);
    const note = freqToNote(pitchHz);

    if(note && level > 18){
      this.noteWindow.push({midi:note.midi, ts:Date.now()});
      this.noteWindow = this.noteWindow.filter(n => Date.now()-n.ts < 2200);
    }

    const chord = guessChord(this.noteWindow.map(n=>n.midi));

    let bpm = null;
    const now = performance.now();

    if(level > 75 && now - this.lastBeat > 260){
      if(this.lastBeat > 0){
        const instant = Math.round(60000 / (now - this.lastBeat));
        if(instant >= 60 && instant <= 200){
          this.beats.push(instant);
          if(this.beats.length > 8) this.beats.shift();
          bpm = Math.round(this.beats.reduce((a,b)=>a+b,0)/this.beats.length);
        }
      }
      this.lastBeat = now;
    }

    const ev = this.bus.emit("audio.intelligence",{
      level,
      peak,
      pitchHz:pitchHz ? Math.round(pitchHz*10)/10 : null,
      note,
      chord,
      bpm
    });

    this.timeline.add(ev);
    requestAnimationFrame(()=>this.loop());
  }

  stop(){
    this.running=false;
    this.timeline.add(this.bus.emit("audio.stopped",{}));
  }
}
'@ | Set-Content "$Src\engines\uaosAudioEngine.js" -Encoding UTF8

@'
export class UAOSMidiEngine {
  constructor(bus,timeline){
    this.bus=bus;
    this.timeline=timeline;
    this.outputs=[];
    this.selectedOutputId="";
    this.learnTarget=null;
    this.learnMap=JSON.parse(localStorage.getItem("uaos.learn.map") || "{}");
  }

  async start(){
    if(!navigator.requestMIDIAccess){
      this.timeline.add(this.bus.emit("midi.unsupported",{}));
      return;
    }

    this.access = await navigator.requestMIDIAccess({sysex:false});
    const inputs = [...this.access.inputs.values()];
    this.outputs = [...this.access.outputs.values()];

    this.timeline.add(this.bus.emit("midi.scan",{
      inputs:inputs.map(i=>({id:i.id,name:i.name})),
      outputs:this.outputs.map(o=>({id:o.id,name:o.name}))
    }));

    inputs.forEach(input=>{
      input.onmidimessage = msg => {
        const [status,note,velocity] = msg.data;
        const command = status & 0xf0;
        const channel = (status & 0x0f) + 1;

        let type="midi.raw";
        if(command===144 && velocity>0) type="midi.noteon";
        if(command===128 || (command===144 && velocity===0)) type="midi.noteoff";

        const payload = {device:input.name,status,command,channel,note,velocity};

        if(this.learnTarget){
          const key = [status,note,velocity].join(":");
          this.learnMap[this.learnTarget]=key;
          localStorage.setItem("uaos.learn.map",JSON.stringify(this.learnMap));
          this.timeline.add(this.bus.emit("midi.learn.captured",{target:this.learnTarget,key}));
          this.learnTarget=null;
        }

        this.timeline.add(this.bus.emit(type,payload));
      };
    });
  }

  learn(target){
    this.learnTarget=target;
    this.timeline.add(this.bus.emit("midi.learn.start",{target}));
  }

  setOutput(id){
    this.selectedOutputId=id;
  }

  output(){
    return this.outputs.find(o=>o.id===this.selectedOutputId) || this.outputs[0];
  }

  sendNote(note=60, velocity=100, duration=180, channel=1){
    const o=this.output();
    if(!o) return false;
    const ch=Math.max(0,Math.min(15,channel-1));
    o.send([0x90+ch,note,velocity]);
    setTimeout(()=>o.send([0x80+ch,note,0]), duration);
    return true;
  }

  panic(){
    const o=this.output();
    if(!o) return false;
    for(let ch=0;ch<16;ch++){
      o.send([0xB0+ch,123,0]);
      o.send([0xB0+ch,120,0]);
      for(let n=0;n<128;n++) o.send([0x80+ch,n,0]);
    }
    this.timeline.add(this.bus.emit("midi.panic",{}));
    return true;
  }
}
'@ | Set-Content "$Src\engines\uaosMidiEngine.js" -Encoding UTF8

@'
export const SECTIONS = ["INTRO","VAR_A","VAR_B","FILL","BREAK","ENDING"];

const CHORDS = {
  C:[60,64,67], Dm:[62,65,69], Em:[64,67,71], F:[65,69,72],
  G:[67,71,74], Am:[69,72,76], A:[69,73,76], E:[64,68,71],
  D:[62,66,69], C7:[60,64,67,70], G7:[67,71,74,77], Am7:[69,72,76,79]
};

const DEFAULT_PATTERNS = {
  POP_8BEAT:{name:"Pop 8 Beat",steps:[0,1,2,1,0,1,2,1]},
  ORIENTAL_BALADI:{name:"Oriental Baladi",steps:[0,0,2,1,0,2,1,1]},
  SLOW_6_8:{name:"Slow 6/8",steps:[0,2,1,0,2,1]}
};

export class UAOSArranger {
  constructor(bus,timeline,midi){
    this.bus=bus;
    this.timeline=timeline;
    this.midi=midi;
    this.section="VAR_A";
    this.chord="C";
    this.bpm=100;
    this.running=false;
    this.step=0;
    this.patterns=JSON.parse(localStorage.getItem("uaos.patterns") || "null") || DEFAULT_PATTERNS;
    this.patternKey="POP_8BEAT";
    this.scenes=JSON.parse(localStorage.getItem("uaos.scenes") || "[]");
  }

  save(){
    localStorage.setItem("uaos.patterns",JSON.stringify(this.patterns));
    localStorage.setItem("uaos.scenes",JSON.stringify(this.scenes));
  }

  setSection(section){
    this.section=section;
    this.timeline.add(this.bus.emit("arranger.section",{section}));
  }

  setChord(chord){
    this.chord = CHORDS[chord] ? chord : "C";
    this.timeline.add(this.bus.emit("arranger.chord",{chord:this.chord}));
  }

  setBpm(bpm){
    if(bpm>=60 && bpm<=200){
      this.bpm=bpm;
      this.timeline.add(this.bus.emit("arranger.bpm",{bpm}));
    }
  }

  setPattern(k){
    if(this.patterns[k]) this.patternKey=k;
  }

  learnPattern(){
    const key="USER_PATTERN_"+Date.now();
    this.patterns[key]={name:"User Pattern "+new Date().toLocaleTimeString(),steps:[0,1,2,1,2,0,1,2]};
    this.patternKey=key;
    this.save();
    this.timeline.add(this.bus.emit("pattern.learned",{key}));
  }

  saveScene(){
    const scene={id:"scene-"+Date.now(),section:this.section,chord:this.chord,bpm:this.bpm,patternKey:this.patternKey};
    this.scenes.push(scene);
    this.save();
    this.timeline.add(this.bus.emit("scene.saved",scene));
  }

  recallScene(id){
    const s=this.scenes.find(x=>x.id===id);
    if(!s) return;
    this.setSection(s.section);
    this.setChord(s.chord);
    this.setBpm(s.bpm);
    this.setPattern(s.patternKey);
  }

  start(){
    this.running=true;
    this.tick();
  }

  stop(){
    this.running=false;
    clearTimeout(this.timer);
    this.timeline.add(this.bus.emit("arranger.stopped",{}));
  }

  tick(){
    if(!this.running) return;
    const p=this.patterns[this.patternKey] || DEFAULT_PATTERNS.POP_8BEAT;
    const notes=CHORDS[this.chord] || CHORDS.C;
    const idx=p.steps[this.step % p.steps.length] % notes.length;
    const note=notes[idx];
    this.midi?.sendNote(note,90,150,1);
    this.timeline.add(this.bus.emit("arranger.step",{section:this.section,chord:this.chord,bpm:this.bpm,note,step:this.step,pattern:p.name}));
    this.step++;
    this.timer=setTimeout(()=>this.tick(), Math.round(60000/this.bpm/2));
  }

  exportStyle(){
    return JSON.stringify({
      product:"UAOS",
      version:"final-style",
      exportedAt:new Date().toISOString(),
      bpm:this.bpm,
      section:this.section,
      chord:this.chord,
      patternKey:this.patternKey,
      patterns:this.patterns,
      scenes:this.scenes
    },null,2);
  }

  state(){
    return {section:this.section,chord:this.chord,bpm:this.bpm,running:this.running,patternKey:this.patternKey,patterns:this.patterns,scenes:this.scenes};
  }
}
'@ | Set-Content "$Src\engines\uaosArranger.js" -Encoding UTF8

@'
export function downloadText(filename,text){
  const blob=new Blob([text],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();
  URL.revokeObjectURL(url);
}

function str(s){return [...s].map(c=>c.charCodeAt(0));}
function u16(n){return [(n>>8)&255,n&255];}
function u32(n){return [(n>>24)&255,(n>>16)&255,(n>>8)&255,n&255];}
function vlq(v){
  let b=v&0x7f;
  const out=[];
  while((v>>=7)){b<<=8;b|=((v&0x7f)|0x80);}
  while(true){out.push(b&255);if(b&0x80)b>>=8;else break;}
  return out;
}

export function makeMidi(events,bpm=100){
  const ppq=480;
  const track=[];
  track.push(...vlq(0),0xff,0x51,0x03);
  const mpqn=Math.round(60000000/bpm);
  track.push((mpqn>>16)&255,(mpqn>>8)&255,mpqn&255);

  const evs=events.filter(e=>["midi.noteon","arranger.step","voice.midi.draft"].includes(e.type)).map(e=>({
    t:e.time||0,
    note:e.payload.note||e.payload.midi||60,
    velocity:e.payload.velocity||90,
    channel:e.payload.channel||1
  })).sort((a,b)=>a.t-b.t);

  let last=evs.length?evs[0].t:0;
  for(const e of evs){
    const ticks=Math.round(((e.t-last)/60000)*bpm*ppq);
    last=e.t;
    const ch=Math.max(0,Math.min(15,e.channel-1));
    track.push(...vlq(Math.max(0,ticks)),0x90+ch,e.note,e.velocity);
    track.push(...vlq(120),0x80+ch,e.note,0);
  }

  track.push(...vlq(0),0xff,0x2f,0);
  return new Uint8Array([...str("MThd"),...u32(6),...u16(0),...u16(1),...u16(ppq),...str("MTrk"),...u32(track.length),...track]);
}

export function downloadMidi(filename,bytes){
  const blob=new Blob([bytes],{type:"audio/midi"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();
  URL.revokeObjectURL(url);
}
'@ | Set-Content "$Src\core\exporters.js" -Encoding UTF8

@'
import React,{useEffect,useMemo,useState} from "react";
import { uaosBus } from "./core/uaosBus.js";
import { uaosTimeline } from "./core/uaosTimeline.js";
import { UAOSAudioEngine } from "./engines/uaosAudioEngine.js";
import { UAOSMidiEngine } from "./engines/uaosMidiEngine.js";
import { UAOSArranger, SECTIONS } from "./engines/uaosArranger.js";
import { downloadText, makeMidi, downloadMidi } from "./core/exporters.js";

const CHORDS=["C","Dm","Em","F","G","Am","A","E","D","C7","G7","Am7"];

export default function App(){
  const midi=useMemo(()=>new UAOSMidiEngine(uaosBus,uaosTimeline),[]);
  const audio=useMemo(()=>new UAOSAudioEngine(uaosBus,uaosTimeline),[]);
  const arranger=useMemo(()=>new UAOSArranger(uaosBus,uaosTimeline,midi),[midi]);

  const [status,setStatus]=useState("READY");
  const [audioState,setAudioState]=useState({});
  const [midiInfo,setMidiInfo]=useState({inputs:[],outputs:[]});
  const [events,setEvents]=useState([]);
  const [state,setState]=useState(arranger.state());
  const [live,setLive]=useState(false);

  useEffect(()=>{
    uaosBus.on("*",()=>{
      setEvents([...uaosTimeline.load()].slice(-80).reverse());
      setState(arranger.state());
    });
    uaosBus.on("audio.intelligence",ev=>{
      setAudioState(ev.payload);
      if(ev.payload.bpm) arranger.setBpm(ev.payload.bpm);
      if(ev.payload.chord) arranger.setChord(ev.payload.chord.chord);
    });
    uaosBus.on("midi.scan",ev=>setMidiInfo(ev.payload));
  },[arranger]);

  async function startAudio(){
    try{setStatus("AUDIO STARTING");await audio.start();setStatus("AUDIO RUNNING");}
    catch(e){setStatus("AUDIO ERROR: "+e.message);}
  }

  async function startMidi(){
    try{setStatus("MIDI STARTING");await midi.start();setStatus("MIDI READY");}
    catch(e){setStatus("MIDI ERROR: "+e.message);}
  }

  function controls(){
    return <>
      <button onClick={startAudio}>Start Audio</button>
      <button onClick={startMidi} style={{marginLeft:8}}>Start MIDI</button>
      <button onClick={()=>arranger.start()} style={{marginLeft:8}}>Start Arranger</button>
      <button onClick={()=>arranger.stop()} style={{marginLeft:8}}>Stop Arranger</button>
      <button onClick={()=>midi.panic()} style={{marginLeft:8,background:"#7f1d1d",color:"white"}}>Panic</button>
      <button onClick={()=>setLive(!live)} style={{marginLeft:8}}>Live Mode</button>
    </>;
  }

  if(live){
    return <div style={{minHeight:"100vh",background:"#020617",color:"white",fontFamily:"Arial",padding:24}}>
      <h1>UAOS LIVE STAGE</h1>
      <h2>{state.section} | {state.chord} | BPM {state.bpm}</h2>
      {controls()}
      <h2>Sections</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {SECTIONS.map(s=><button key={s} onClick={()=>arranger.setSection(s)} style={{fontSize:28,padding:28}}>{s}</button>)}
      </div>
      <h2>Chord Pads</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {CHORDS.map(c=><button key={c} onClick={()=>arranger.setChord(c)} style={{fontSize:34,padding:34}}>{c}</button>)}
      </div>
    </div>;
  }

  return <div style={{minHeight:"100vh",background:"#070b14",color:"white",fontFamily:"Arial",padding:24}}>
    <h1>UAOS Final Foundation Workstation</h1>
    <p>Audio intelligence, MIDI, arranger, live stage, scenes, pattern memory, exports, and safe deploy pipeline.</p>
    <h3>Status: {status}</h3>

    {controls()}

    <div style={{marginTop:12}}>
      <button onClick={()=>arranger.learnPattern()}>Learn Pattern</button>
      <button onClick={()=>arranger.saveScene()} style={{marginLeft:8}}>Save Scene</button>
      <button onClick={()=>uaosTimeline.clear()} style={{marginLeft:8}}>Clear Timeline</button>
      <button onClick={()=>downloadText("uaos-style.json",arranger.exportStyle())} style={{marginLeft:8}}>Export Style</button>
      <button onClick={()=>downloadText("uaos-timeline.json",uaosTimeline.exportJson())} style={{marginLeft:8}}>Export Timeline</button>
      <button onClick={()=>downloadMidi("uaos-export.mid",makeMidi(uaosTimeline.load(),state.bpm))} style={{marginLeft:8}}>Export MIDI</button>
    </div>

    <h2>Audio Intelligence</h2>
    <p>Level: {audioState.level||0} | Pitch: {audioState.pitchHz||"-"} | Note: {audioState.note?.label||"-"} | Chord: {audioState.chord?.chord||"-"} | BPM: {audioState.bpm||state.bpm}</p>
    <progress value={audioState.level||0} max="255" style={{width:"100%"}} />

    <h2>MIDI</h2>
    <select onChange={e=>midi.setOutput(e.target.value)}>
      <option value="">Auto Output</option>
      {midiInfo.outputs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
    <pre style={{background:"#111827",padding:12,borderRadius:8}}>{JSON.stringify(midiInfo,null,2)}</pre>

    <h2>Arranger</h2>
    <p>Section: {state.section} | Chord: {state.chord} | BPM: {state.bpm} | Pattern: {state.patternKey} | Running: {String(state.running)}</p>

    <div>{SECTIONS.map(s=><button key={s} onClick={()=>arranger.setSection(s)} style={{margin:4}}>{s}</button>)}</div>
    <div>{CHORDS.map(c=><button key={c} onClick={()=>arranger.setChord(c)} style={{margin:4}}>{c}</button>)}</div>

    <h2>Scenes</h2>
    <div>{state.scenes.map(s=><button key={s.id} onClick={()=>arranger.recallScene(s.id)} style={{margin:4}}>{s.section} {s.chord} {s.bpm}</button>)}</div>

    <h2>Timeline</h2>
    <ul>{events.map(e=><li key={e.id}><b>{e.type}</b> — {JSON.stringify(e.payload)}</li>)}</ul>
  </div>;
}
'@ | Set-Content "$Src\App.jsx" -Encoding UTF8

L "ALL CODE WRITTEN"

npm run build 2>&1 | Tee-Object -FilePath $Log -Append

if($LASTEXITCODE -ne 0){
  L "BUILD FAIL - NO DEPLOY"
  exit 1
}

L "BUILD PASS - NO DEPLOY"

$Audit="release-kit\UAOS_ALL_IN_ONE_READY_$Stamp.txt"
@"
UAOS ALL-IN-ONE CODE LAUNCHER COMPLETE

NO DEPLOY EXECUTED.

Added:
- Audio intelligence
- MIDI engine
- MIDI learn foundation
- Arranger engine
- Chord pads
- Live stage mode
- Pattern memory
- Scene save/recall
- Timeline export
- Style export
- MIDI export
- Panic button

Manual deploy:
powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
"@ | Set-Content $Audit -Encoding UTF8

L "AUDIT: $Audit"
notepad $Log