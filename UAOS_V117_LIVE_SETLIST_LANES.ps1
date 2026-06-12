$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force src\live,src\midi,src\arranger,reports | Out-Null

if(Test-Path "src\App.jsx"){
  Copy-Item "src\App.jsx" "src\App.backup-v117.jsx" -Force
}

@'
export class UAOSSetlist {
  constructor(bus, timeline, arranger){
    this.bus = bus;
    this.timeline = timeline;
    this.arranger = arranger;
    this.key = "uaos.v117.setlist";
    this.songs = JSON.parse(localStorage.getItem(this.key) || "null") || [
      { id:"song-1", title:"Demo Pop", bpm:100, chord:"C", section:"INTRO" },
      { id:"song-2", title:"Demo Oriental", bpm:92, chord:"Am", section:"VAR_A" },
      { id:"song-3", title:"Demo Ballad", bpm:76, chord:"F", section:"VAR_B" }
    ];
    this.activeIndex = 0;
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.songs));
  }

  addSong(){
    this.songs.push({
      id:"song-" + Date.now(),
      title:"New Song",
      bpm:100,
      chord:"C",
      section:"INTRO"
    });
    this.save();
  }

  updateSong(i, patch){
    this.songs[i] = { ...this.songs[i], ...patch };
    this.save();
  }

  removeSong(i){
    this.songs.splice(i,1);
    this.save();
  }

  launch(i){
    const song = this.songs[i];
    if(!song) return false;

    this.activeIndex = i;
    this.arranger.setBpm(song.bpm);
    this.arranger.setChord(song.chord);
    this.arranger.setSection(song.section);

    const ev = this.bus.emit("setlist.song.launch", song);
    this.timeline.add(ev);

    return true;
  }

  next(){
    const i = Math.min(this.songs.length - 1, this.activeIndex + 1);
    return this.launch(i);
  }

  previous(){
    const i = Math.max(0, this.activeIndex - 1);
    return this.launch(i);
  }

  exportSetlist(){
    return JSON.stringify({
      product:"UAOS",
      version:"1.17-setlist",
      exportedAt:new Date().toISOString(),
      songs:this.songs
    }, null, 2);
  }
}
'@ | Set-Content "src\live\uaosSetlist.js" -Encoding UTF8

@'
export class UAOSSplitZones {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.key = "uaos.v117.splitZones";
    this.zones = JSON.parse(localStorage.getItem(this.key) || "null") || [
      { id:"left", name:"Left Bass", min:0, max:59, channel:2, transpose:-12 },
      { id:"right", name:"Right Lead", min:60, max:127, channel:1, transpose:0 }
    ];
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.zones));
  }

  addZone(){
    this.zones.push({
      id:"zone-" + Date.now(),
      name:"New Zone",
      min:60,
      max:72,
      channel:1,
      transpose:0
    });
    this.save();
  }

  updateZone(i, patch){
    this.zones[i] = { ...this.zones[i], ...patch };
    this.save();
  }

  removeZone(i){
    this.zones.splice(i,1);
    this.save();
  }

  route(note){
    return this.zones.find(z => note >= z.min && note <= z.max) || null;
  }

  exportZones(){
    return JSON.stringify({
      product:"UAOS",
      version:"1.17-split-zones",
      exportedAt:new Date().toISOString(),
      zones:this.zones
    }, null, 2);
  }
}
'@ | Set-Content "src\midi\uaosSplitZones.js" -Encoding UTF8

@'
export class UAOSPanic {
  constructor(bus, timeline, midi){
    this.bus = bus;
    this.timeline = timeline;
    this.midi = midi;
  }

  allNotesOff(){
    const output = this.midi?.output?.();
    if(!output) return false;

    for(let ch=0; ch<16; ch++){
      output.send([0xB0 + ch, 123, 0]);
      output.send([0xB0 + ch, 120, 0]);
      for(let n=0; n<128; n++){
        output.send([0x80 + ch, n, 0]);
      }
    }

    const ev = this.bus.emit("midi.panic", {
      action:"all-notes-off"
    });

    this.timeline.add(ev);

    return true;
  }
}
'@ | Set-Content "src\midi\uaosPanic.js" -Encoding UTF8

@'
export class UAOSArrangerLanes {
  constructor(bus, timeline, midi){
    this.bus = bus;
    this.timeline = timeline;
    this.midi = midi;
    this.key = "uaos.v117.lanes";
    this.lanes = JSON.parse(localStorage.getItem(this.key) || "null") || {
      drums:{ enabled:true, channel:10, note:36, velocity:100 },
      bass:{ enabled:true, channel:2, note:36, velocity:92 },
      pad:{ enabled:true, channel:3, note:60, velocity:70 }
    };
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.lanes));
  }

  updateLane(name, patch){
    this.lanes[name] = { ...this.lanes[name], ...patch };
    this.save();

    const ev = this.bus.emit("lane.updated", {
      name,
      lane:this.lanes[name]
    });

    this.timeline.add(ev);
  }

  triggerAll(){
    Object.entries(this.lanes).forEach(([name,lane])=>{
      if(lane.enabled){
        this.midi?.sendNote(lane.note, lane.velocity, 140, lane.channel);
      }
    });

    const ev = this.bus.emit("lane.trigger", this.lanes);
    this.timeline.add(ev);
  }
}
'@ | Set-Content "src\arranger\uaosArrangerLanes.js" -Encoding UTF8

$App = Get-Content "src\App.jsx" -Raw

if($App -notmatch "UAOSSetlist"){
  $App = $App -replace 'import \{ exportMidiDraft \} from "\./style/midiExportDraft\.js";',
'import { exportMidiDraft } from "./style/midiExportDraft.js";
import { UAOSSetlist } from "./live/uaosSetlist.js";
import { UAOSSplitZones } from "./midi/uaosSplitZones.js";
import { UAOSPanic } from "./midi/uaosPanic.js";
import { UAOSArrangerLanes } from "./arranger/uaosArrangerLanes.js";'
}

if($App -notmatch "const setlist"){
  $App = $App -replace 'const songArrangement = useMemo\(\(\)=>new UAOSSongArrangement\(uaosBus, uaosTimeline, arranger\), \[arranger\]\);',
'const songArrangement = useMemo(()=>new UAOSSongArrangement(uaosBus, uaosTimeline, arranger), [arranger]);
  const setlist = useMemo(()=>new UAOSSetlist(uaosBus, uaosTimeline, arranger), [arranger]);
  const splitZones = useMemo(()=>new UAOSSplitZones(uaosBus, uaosTimeline), []);
  const panic = useMemo(()=>new UAOSPanic(uaosBus, uaosTimeline, midi), [midi]);
  const lanes = useMemo(()=>new UAOSArrangerLanes(uaosBus, uaosTimeline, midi), [midi]);'
}

if($App -notmatch "Emergency Panic"){
  $App = $App -replace '<button onClick=\{startAudio\}>Start Audio / Chord / Voice</button>',
'<button onClick={startAudio}>Start Audio / Chord / Voice</button>
      <button onClick={()=>panic.allNotesOff()} style={{marginLeft:8,background:"#7f1d1d",color:"white"}}>
        Emergency Panic
      </button>'
}

if($App -notmatch "Live Setlist"){
  $App = $App -replace '<h2>Song Arrangement</h2>',
'<h2>Live Setlist</h2>
      <button onClick={()=>setlist.addSong()}>Add Song</button>
      <button onClick={()=>setlist.previous()} style={{marginLeft:8}}>Previous Song</button>
      <button onClick={()=>setlist.next()} style={{marginLeft:8}}>Next Song</button>
      <button onClick={()=>downloadText("uaos-v117-setlist.json", setlist.exportSetlist())} style={{marginLeft:8}}>Export Setlist</button>

      <div style={{marginTop:12}}>
        {setlist.songs.map((s,i)=>(
          <div key={s.id} style={{background:"#111827",padding:10,marginBottom:8,borderRadius:8}}>
            <button onClick={()=>setlist.launch(i)}>Launch</button>
            <input style={{marginLeft:8}} value={s.title} onChange={e=>setlist.updateSong(i,{title:e.target.value})} />
            <input style={{marginLeft:8,width:70}} type="number" value={s.bpm} onChange={e=>setlist.updateSong(i,{bpm:Number(e.target.value)||100})} />
            <select style={{marginLeft:8}} value={s.chord} onChange={e=>setlist.updateSong(i,{chord:e.target.value})}>
              {chords.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select style={{marginLeft:8}} value={s.section} onChange={e=>setlist.updateSong(i,{section:e.target.value})}>
              {UAOS_SECTIONS.map(x=><option key={x} value={x}>{x}</option>)}
            </select>
            <button style={{marginLeft:8}} onClick={()=>setlist.removeSong(i)}>Remove</button>
          </div>
        ))}
      </div>

      <h2>Keyboard Split Zones</h2>
      <button onClick={()=>splitZones.addZone()}>Add Zone</button>
      <button onClick={()=>downloadText("uaos-v117-split-zones.json", splitZones.exportZones())} style={{marginLeft:8}}>Export Zones</button>
      <div style={{marginTop:12}}>
        {splitZones.zones.map((z,i)=>(
          <div key={z.id} style={{background:"#111827",padding:10,marginBottom:8,borderRadius:8}}>
            <input value={z.name} onChange={e=>splitZones.updateZone(i,{name:e.target.value})} />
            <input style={{marginLeft:8,width:60}} type="number" value={z.min} onChange={e=>splitZones.updateZone(i,{min:Number(e.target.value)||0})} />
            <input style={{marginLeft:8,width:60}} type="number" value={z.max} onChange={e=>splitZones.updateZone(i,{max:Number(e.target.value)||127})} />
            <input style={{marginLeft:8,width:60}} type="number" value={z.channel} onChange={e=>splitZones.updateZone(i,{channel:Number(e.target.value)||1})} />
            <input style={{marginLeft:8,width:60}} type="number" value={z.transpose} onChange={e=>splitZones.updateZone(i,{transpose:Number(e.target.value)||0})} />
            <button style={{marginLeft:8}} onClick={()=>splitZones.removeZone(i)}>Remove</button>
          </div>
        ))}
      </div>

      <h2>Arranger Lanes</h2>
      <button onClick={()=>lanes.triggerAll()}>Trigger Drum/Bass/Pad</button>
      {Object.entries(lanes.lanes).map(([name,lane])=>(
        <div key={name} style={{background:"#111827",padding:10,marginTop:8,borderRadius:8}}>
          <b>{name}</b>
          <label style={{marginLeft:8}}>
            Enabled
            <input type="checkbox" checked={lane.enabled} onChange={e=>lanes.updateLane(name,{enabled:e.target.checked})} />
          </label>
          <input style={{marginLeft:8,width:60}} type="number" value={lane.channel} onChange={e=>lanes.updateLane(name,{channel:Number(e.target.value)||1})} />
          <input style={{marginLeft:8,width:60}} type="number" value={lane.note} onChange={e=>lanes.updateLane(name,{note:Number(e.target.value)||60})} />
          <input style={{marginLeft:8,width:60}} type="number" value={lane.velocity} onChange={e=>lanes.updateLane(name,{velocity:Number(e.target.value)||90})} />
        </div>
      ))}

      <h2>Song Arrangement</h2>'
}

$App = $App -replace "UAOS V1.16 Live Stage Mode", "UAOS V1.17 Live Setlist + Lanes"
$App = $App -replace "Standalone live mode, full-screen stage UI, chord pads, transport bar, latency monitor, autosave, performance tools, and arranger control\.", "Live setlist launcher, keyboard split zones, MIDI channel lanes, drum/bass/pad arranger lanes, emergency panic, and stage performance control."

Set-Content "src\App.jsx" $App -Encoding UTF8

npm run build

if($LASTEXITCODE -ne 0){
  Write-Host "UAOS V1.17 BUILD FAIL" -ForegroundColor Red
  exit 1
}

Write-Host "UAOS V1.17 BUILD PASS" -ForegroundColor Green

if(Test-Path ".\UAOS_SAFE_TURBO.ps1"){
  powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
}