$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force src\audio,src\performance,src\song,reports | Out-Null

if(Test-Path "src\App.jsx"){
  Copy-Item "src\App.jsx" "src\App.backup-v115.jsx" -Force
}

@'
export class UAOSWavRecorder {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.mediaRecorder = null;
    this.chunks = [];
    this.stream = null;
  }

  async start(){
    this.stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = e => {
      if(e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start();

    const ev = this.bus.emit("audio.record.start", {});
    this.timeline.add(ev);
  }

  stopAndDownload(){
    if(!this.mediaRecorder) return;

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type:"audio/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "uaos-v115-audio-recording.webm";
      a.click();
      URL.revokeObjectURL(url);

      this.stream?.getTracks()?.forEach(t=>t.stop());

      const ev = this.bus.emit("audio.record.export", {
        format:"webm",
        chunks:this.chunks.length
      });

      this.timeline.add(ev);
    };

    this.mediaRecorder.stop();
  }
}
'@ | Set-Content "src\audio\uaosWavRecorder.js" -Encoding UTF8

@'
export class UAOSPerformanceMode {
  constructor(bus, timeline, arranger, midi, audio){
    this.bus = bus;
    this.timeline = timeline;
    this.arranger = arranger;
    this.midi = midi;
    this.audio = audio;
    this.enabled = false;
  }

  async start(){
    this.enabled = true;

    try{
      await this.midi?.start?.();
    }catch{}

    try{
      await this.audio?.start?.();
    }catch{}

    this.arranger?.start?.();

    const ev = this.bus.emit("performance.start", {
      mode:"one-click"
    });

    this.timeline.add(ev);
  }

  stop(){
    this.enabled = false;
    this.arranger?.stop?.();

    const ev = this.bus.emit("performance.stop", {});
    this.timeline.add(ev);
  }
}
'@ | Set-Content "src\performance\uaosPerformanceMode.js" -Encoding UTF8

@'
export const DEFAULT_SONG_SECTIONS = [
  { id:"intro", name:"Intro", section:"INTRO", chord:"C", bars:4 },
  { id:"verse", name:"Verse", section:"VAR_A", chord:"Am", bars:8 },
  { id:"chorus", name:"Chorus", section:"VAR_B", chord:"F", bars:8 },
  { id:"fill", name:"Fill", section:"FILL", chord:"G", bars:1 },
  { id:"ending", name:"Ending", section:"ENDING", chord:"C", bars:4 }
];

export class UAOSSongArrangement {
  constructor(bus, timeline, arranger){
    this.bus = bus;
    this.timeline = timeline;
    this.arranger = arranger;
    this.key = "uaos.v115.songArrangement";
    this.sections = JSON.parse(localStorage.getItem(this.key) || "null") || DEFAULT_SONG_SECTIONS;
    this.index = 0;
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.sections));
  }

  addSection(){
    this.sections.push({
      id:"section-" + Date.now(),
      name:"New Section",
      section:"VAR_A",
      chord:"C",
      bars:4
    });
    this.save();
  }

  updateSection(i, patch){
    this.sections[i] = {
      ...this.sections[i],
      ...patch
    };
    this.save();
  }

  removeSection(i){
    this.sections.splice(i,1);
    this.save();
  }

  trigger(i){
    const s = this.sections[i];
    if(!s) return;

    this.index = i;

    this.arranger?.setSection?.(s.section);
    this.arranger?.setChord?.(s.chord);

    const ev = this.bus.emit("song.section.trigger", s);
    this.timeline.add(ev);
  }

  exportSong(){
    return JSON.stringify({
      product:"UAOS",
      version:"1.15-song-arrangement",
      exportedAt:new Date().toISOString(),
      sections:this.sections
    }, null, 2);
  }
}
'@ | Set-Content "src\song\uaosSongArrangement.js" -Encoding UTF8

$App = Get-Content "src\App.jsx" -Raw

if($App -notmatch "UAOSWavRecorder"){
  $App = $App -replace 'import \{ exportMidiDraft \} from "\./style/midiExportDraft\.js";',
'import { exportMidiDraft } from "./style/midiExportDraft.js";
import { UAOSWavRecorder } from "./audio/uaosWavRecorder.js";
import { UAOSPerformanceMode } from "./performance/uaosPerformanceMode.js";
import { UAOSSongArrangement } from "./song/uaosSongArrangement.js";'
}

if($App -notmatch "const wavRecorder"){
  $App = $App -replace 'const player = useMemo\(\(\)=>new UAOSTimelinePlayer\(uaosBus, uaosTimeline, midi\), \[midi\]\);',
'const player = useMemo(()=>new UAOSTimelinePlayer(uaosBus, uaosTimeline, midi), [midi]);
  const wavRecorder = useMemo(()=>new UAOSWavRecorder(uaosBus, uaosTimeline), []);
  const performanceMode = useMemo(()=>new UAOSPerformanceMode(uaosBus, uaosTimeline, arranger, midi, audio), [arranger, midi, audio]);
  const songArrangement = useMemo(()=>new UAOSSongArrangement(uaosBus, uaosTimeline, arranger), [arranger]);'
}

if($App -notmatch "Start Performance Mode"){
  $App = $App -replace '<button onClick=\{startAudio\}>Start Audio / Chord / Voice</button>',
'<button onClick={startAudio}>Start Audio / Chord / Voice</button>
      <button onClick={()=>performanceMode.start()} style={{marginLeft:8}}>Start Performance Mode</button>
      <button onClick={()=>performanceMode.stop()} style={{marginLeft:8}}>Stop Performance Mode</button>
      <button onClick={()=>wavRecorder.start()} style={{marginLeft:8}}>Record Audio</button>
      <button onClick={()=>wavRecorder.stopAndDownload()} style={{marginLeft:8}}>Export Audio</button>'
}

if($App -notmatch "Pattern Editor"){
  $App = $App -replace '<h3>Pattern Memory</h3>',
'<h3>Pattern Editor</h3>
      <button onClick={()=>{
        const key="CUSTOM_PATTERN_"+Date.now();
        arranger.patterns[key]={name:"Custom Pattern "+new Date().toLocaleTimeString(),steps:[0,1,2,1,2,1,0,1]};
        arranger.setPattern(key);
        arranger.save();
        setStatus("CUSTOM PATTERN CREATED");
      }}>
        Create Custom Pattern
      </button>

      <button onClick={()=>{
        const p=arrangerState.patterns[arrangerState.patternKey];
        if(p){
          p.steps=[...p.steps, Math.floor(Math.random()*3)];
          arranger.save();
          setStatus("PATTERN STEP ADDED");
        }
      }} style={{marginLeft:8}}>
        Add Pattern Step
      </button>

      <button onClick={()=>{
        const p=arrangerState.patterns[arrangerState.patternKey];
        if(p && p.steps.length>1){
          p.steps.pop();
          arranger.save();
          setStatus("PATTERN STEP REMOVED");
        }
      }} style={{marginLeft:8}}>
        Remove Pattern Step
      </button>

      <pre style={{background:"#111827",padding:12,borderRadius:8}}>
        {JSON.stringify(arrangerState.patterns[arrangerState.patternKey],null,2)}
      </pre>

      <h3>Pattern Memory</h3>'
}

if($App -notmatch "Song Arrangement"){
  $App = $App -replace '<h2>Realtime Timeline</h2>',
'<h2>Song Arrangement</h2>
      <button onClick={()=>{songArrangement.addSection();setStatus("SONG SECTION ADDED")}}>
        Add Song Section
      </button>
      <button onClick={()=>downloadText("uaos-v115-song.json", songArrangement.exportSong())} style={{marginLeft:8}}>
        Export Song Arrangement
      </button>

      <div style={{marginTop:12}}>
        {songArrangement.sections.map((s,i)=>(
          <div key={s.id} style={{background:"#111827",padding:10,marginBottom:8,borderRadius:8}}>
            <button onClick={()=>songArrangement.trigger(i)}>Trigger</button>
            <input style={{marginLeft:8}} value={s.name} onChange={e=>songArrangement.updateSection(i,{name:e.target.value})} />
            <select style={{marginLeft:8}} value={s.section} onChange={e=>songArrangement.updateSection(i,{section:e.target.value})}>
              {UAOS_SECTIONS.map(x=><option key={x} value={x}>{x}</option>)}
            </select>
            <select style={{marginLeft:8}} value={s.chord} onChange={e=>songArrangement.updateSection(i,{chord:e.target.value})}>
              {chords.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <input style={{marginLeft:8,width:60}} type="number" value={s.bars} onChange={e=>songArrangement.updateSection(i,{bars:Number(e.target.value)||1})} />
            <button style={{marginLeft:8}} onClick={()=>songArrangement.removeSection(i)}>Remove</button>
          </div>
        ))}
      </div>

      <h2>Realtime Timeline</h2>'
}

$App = $App -replace "UAOS V1.14 Real MIDI \+ Project Export", "UAOS V1.15 Performance + Audio Export"
$App = $App -replace "Real MIDI file export, project save/load, timeline player, style import/export, audio intelligence, and keyboard profile editor\.", "Performance mode, audio recording export, pattern editor, song arrangement sections, MIDI/project export, and realtime arranger tools."

Set-Content "src\App.jsx" $App -Encoding UTF8

npm run build

if($LASTEXITCODE -ne 0){
  Write-Host "UAOS V1.15 BUILD FAIL" -ForegroundColor Red
  exit 1
}

Write-Host "UAOS V1.15 BUILD PASS" -ForegroundColor Green

if(Test-Path ".\UAOS_SAFE_TURBO.ps1"){
  powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
}