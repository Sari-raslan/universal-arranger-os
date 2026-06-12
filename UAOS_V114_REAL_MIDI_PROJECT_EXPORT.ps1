$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

New-Item -ItemType Directory -Force src\core,src\midi,src\project,src\style,reports | Out-Null

if(Test-Path "src\App.jsx"){
  Copy-Item "src\App.jsx" "src\App.backup-v114.jsx" -Force
}

@'
export function downloadBytes(filename, bytes){
  const blob = new Blob([bytes], {type:"audio/midi"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function strBytes(s){
  return [...s].map(c=>c.charCodeAt(0));
}

function u16(n){
  return [(n>>8)&255,n&255];
}

function u32(n){
  return [(n>>24)&255,(n>>16)&255,(n>>8)&255,n&255];
}

function vlq(value){
  let buffer = value & 0x7f;
  const bytes = [];

  while((value >>= 7)){
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }

  while(true){
    bytes.push(buffer & 0xff);
    if(buffer & 0x80) buffer >>= 8;
    else break;
  }

  return bytes;
}

export function makeMidiFile(events, bpm=100){
  const ppq = 480;
  const track = [];

  track.push(...vlq(0), 0xff, 0x51, 0x03);
  const mpqn = Math.round(60000000 / bpm);
  track.push((mpqn>>16)&255, (mpqn>>8)&255, mpqn&255);

  const midiEvents = events
    .filter(e => ["midi.noteon","voice.midi.draft","arranger.step"].includes(e.type))
    .map(e => ({
      t: e.time || 0,
      note: e.payload.note || e.payload.midi || 60,
      velocity: e.payload.velocity || 90,
      channel: e.payload.channel || 1
    }))
    .sort((a,b)=>a.t-b.t);

  let lastMs = midiEvents.length ? midiEvents[0].t : 0;

  for(const ev of midiEvents){
    const deltaMs = Math.max(0, ev.t - lastMs);
    const ticks = Math.round((deltaMs / 60000) * bpm * ppq);
    lastMs = ev.t;

    const ch = Math.max(0, Math.min(15, ev.channel - 1));
    const note = Math.max(0, Math.min(127, ev.note));
    const vel = Math.max(1, Math.min(127, ev.velocity));

    track.push(...vlq(ticks), 0x90 + ch, note, vel);
    track.push(...vlq(120), 0x80 + ch, note, 0);
  }

  track.push(...vlq(0), 0xff, 0x2f, 0x00);

  const header = [
    ...strBytes("MThd"),
    ...u32(6),
    ...u16(0),
    ...u16(1),
    ...u16(ppq)
  ];

  const trackChunk = [
    ...strBytes("MTrk"),
    ...u32(track.length),
    ...track
  ];

  return new Uint8Array([...header, ...trackChunk]);
}
'@ | Set-Content "src\midi\midiFileExport.js" -Encoding UTF8

@'
export function makeProjectSnapshot({timeline, arrangerState, midiProfiles}){
  return JSON.stringify({
    product:"UAOS",
    version:"1.14-project",
    exportedAt:new Date().toISOString(),
    timeline,
    arrangerState,
    midiProfiles
  }, null, 2);
}

export function loadProjectSnapshot(text){
  const data = JSON.parse(text);

  if(!data || data.product !== "UAOS"){
    throw new Error("Not a UAOS project file");
  }

  return data;
}
'@ | Set-Content "src\project\uaosProject.js" -Encoding UTF8

$App = Get-Content "src\App.jsx" -Raw

if($App -notmatch "makeMidiFile"){
  $App = $App -replace 'import \{ exportMidiDraft \} from "\./style/midiExportDraft\.js";',
'import { exportMidiDraft } from "./style/midiExportDraft.js";
import { makeMidiFile, downloadBytes } from "./midi/midiFileExport.js";
import { makeProjectSnapshot, loadProjectSnapshot } from "./project/uaosProject.js";'
}

if($App -notmatch "Export Real MIDI"){
  $App = $App -replace '<button onClick=\{\(\)=>downloadText\("uaos-v113-midi-draft\.json", exportMidiDraft\(uaosTimeline\.load\(\)\)\)\} style=\{\{marginLeft:8\}\}>Export MIDI Draft</button>',
'<button onClick={()=>downloadText("uaos-v114-midi-draft.json", exportMidiDraft(uaosTimeline.load()))} style={{marginLeft:8}}>Export MIDI Draft</button>
        <button onClick={()=>downloadBytes("uaos-v114-export.mid", makeMidiFile(uaosTimeline.load(), arrangerState.bpm))} style={{marginLeft:8}}>Export Real MIDI</button>
        <button onClick={()=>downloadText("uaos-v114-project.uaos.json", makeProjectSnapshot({timeline:uaosTimeline.load(), arrangerState, midiProfiles:midi.getProfiles()}))} style={{marginLeft:8}}>Save Project</button>'
}

if($App -notmatch "Load UAOS Project"){
  $App = $App -replace '<h2>Import UAOS Style JSON</h2>',
'<h2>Load UAOS Project</h2>
      <input type="file" accept="application/json" onChange={e=>{
        const file=e.target.files?.[0];
        if(!file)return;
        const r=new FileReader();
        r.onload=()=>{
          try{
            const p=loadProjectSnapshot(String(r.result));
            localStorage.setItem("uaos.v113.timeline", JSON.stringify(p.timeline || []));
            setStatus("PROJECT LOADED — refresh page to restore full timeline");
          }catch(err){
            setStatus("PROJECT LOAD FAILED: " + err.message);
          }
        };
        r.readAsText(file);
      }} />

      <h2>Import UAOS Style JSON</h2>'
}

$App = $App -replace "UAOS V1.13 Full Music Workstation", "UAOS V1.14 Real MIDI + Project Export"
$App = $App -replace "Audio \+ chord \+ voice MIDI \+ timeline player \+ style import/export \+ MIDI draft export \+ keyboard profile editor\.", "Real MIDI file export, project save/load, timeline player, style import/export, audio intelligence, and keyboard profile editor."

Set-Content "src\App.jsx" $App -Encoding UTF8

npm run build

if($LASTEXITCODE -ne 0){
  Write-Host "UAOS V1.14 BUILD FAIL" -ForegroundColor Red
  exit 1
}

Write-Host "UAOS V1.14 BUILD PASS" -ForegroundColor Green

if(Test-Path ".\UAOS_SAFE_TURBO.ps1"){
  powershell -ExecutionPolicy Bypass -File ".\UAOS_SAFE_TURBO.ps1"
}