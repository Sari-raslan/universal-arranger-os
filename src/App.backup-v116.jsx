import React, { useEffect, useMemo, useState } from "react";
import { uaosBus } from "./core/uaosBus.js";
import { uaosTimeline } from "./timeline/uaosTimeline.js";
import { UAOSTimelinePlayer } from "./timeline/uaosTimelinePlayer.js";
import { UAOSAudioIntelligence } from "./audio/uaosAudioIntelligence.js";
import { UAOSMidiEngine } from "./midi/uaosMidiEngine.js";
import { UAOSArrangerEngine, UAOS_SECTIONS } from "./arranger/uaosArrangerEngine.js";
import { exportMidiDraft } from "./style/midiExportDraft.js";
import { UAOSWavRecorder } from "./audio/uaosWavRecorder.js";
import { UAOSPerformanceMode } from "./performance/uaosPerformanceMode.js";
import { UAOSSongArrangement } from "./song/uaosSongArrangement.js";
import { makeMidiFile, downloadBytes } from "./midi/midiFileExport.js";
import { makeProjectSnapshot, loadProjectSnapshot } from "./project/uaosProject.js";

const chords = ["C","Dm","Em","F","G","Am","A","E","D","C7","G7","Am7"];

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
  const audio = useMemo(()=>new UAOSAudioIntelligence(uaosBus, uaosTimeline), []);
  const arranger = useMemo(()=>new UAOSArrangerEngine(uaosBus, uaosTimeline, midi), [midi]);
  const player = useMemo(()=>new UAOSTimelinePlayer(uaosBus, uaosTimeline, midi), [midi]);
  const wavRecorder = useMemo(()=>new UAOSWavRecorder(uaosBus, uaosTimeline), []);
  const performanceMode = useMemo(()=>new UAOSPerformanceMode(uaosBus, uaosTimeline, arranger, midi, audio), [arranger, midi, audio]);
  const songArrangement = useMemo(()=>new UAOSSongArrangement(uaosBus, uaosTimeline, arranger), [arranger]);

  const [status,setStatus] = useState("READY");
  const [audioState,setAudioState] = useState({level:0, peak:0, pitchHz:null, note:null, chord:null, bpm:null});
  const [voiceMidi,setVoiceMidi] = useState(null);
  const [midiInfo,setMidiInfo] = useState({inputs:[], outputs:[]});
  const [events,setEvents] = useState([]);
  const [arrangerState,setArrangerState] = useState(arranger.state());
  const [recording,setRecording] = useState(true);
  const [profileEditor,setProfileEditor] = useState({channel:1, transpose:0});

  useEffect(()=>{
    uaosBus.on("*", () => {
      setEvents([...uaosTimeline.load()].slice(-100).reverse());
      setArrangerState(arranger.state());
    });

    uaosBus.on("audio.intelligence", ev => {
      setAudioState(ev.payload);
      if(ev.payload.bpm) arranger.setBpm(ev.payload.bpm);
      if(ev.payload.chord) arranger.setChord(ev.payload.chord.chord);
    });

    uaosBus.on("voice.midi.draft", ev => setVoiceMidi(ev.payload));
    uaosBus.on("midi.scan", ev => setMidiInfo(ev.payload));
  },[arranger]);

  async function startAudio(){
    try{
      setStatus("STARTING AUDIO / CHORD / VOICE...");
      await audio.start();
      setStatus("AUDIO + CHORD + VOICE RUNNING");
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

  function toggleRecording(){
    const next = !recording;
    setRecording(next);
    uaosTimeline.setRecording(next);
    setStatus(next ? "TIMELINE RECORDING ON" : "TIMELINE RECORDING OFF");
  }

  function importStyleFile(file){
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        arranger.importStyleJson(String(reader.result));
        setStatus("STYLE IMPORTED");
      }catch(e){
        setStatus("STYLE IMPORT FAILED: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  function applyProfileEdit(){
    midi.updateCurrentProfile({
      channel:Number(profileEditor.channel) || 1,
      transpose:Number(profileEditor.transpose) || 0
    });
    setStatus("KEYBOARD PROFILE UPDATED");
  }

  return (
    <div style={{minHeight:"100vh",background:"#070b14",color:"white",fontFamily:"Arial",padding:24}}>
      <h1>UAOS V1.15 Performance + Audio Export</h1>
      <p>Performance mode, audio recording export, pattern editor, song arrangement sections, MIDI/project export, and realtime arranger tools.</p>

      <h3>Status: {status}</h3>

      <button onClick={startAudio}>Start Audio / Chord / Voice</button>
      <button onClick={()=>performanceMode.start()} style={{marginLeft:8}}>Start Performance Mode</button>
      <button onClick={()=>performanceMode.stop()} style={{marginLeft:8}}>Stop Performance Mode</button>
      <button onClick={()=>wavRecorder.start()} style={{marginLeft:8}}>Record Audio</button>
      <button onClick={()=>wavRecorder.stopAndDownload()} style={{marginLeft:8}}>Export Audio</button>
      <button onClick={startMidi} style={{marginLeft:8}}>Start MIDI</button>
      <button onClick={()=>arranger.start()} style={{marginLeft:8}}>Start Arranger</button>
      <button onClick={()=>arranger.stop()} style={{marginLeft:8}}>Stop Arranger</button>
      <button onClick={()=>player.play()} style={{marginLeft:8}}>Play Timeline</button>
      <button onClick={()=>player.stop()} style={{marginLeft:8}}>Stop Timeline</button>
      <button onClick={toggleRecording} style={{marginLeft:8}}>{recording ? "Pause Recording" : "Resume Recording"}</button>
      <button onClick={()=>{uaosTimeline.clear();setEvents([])}} style={{marginLeft:8}}>Clear Timeline</button>

      <div style={{marginTop:12}}>
        <button onClick={()=>arranger.learnFromMidi(midi.getRecordedNotes())}>Learn Pattern From MIDI</button>
        <button onClick={()=>arranger.memorizeSection()} style={{marginLeft:8}}>Save Section Memory</button>
        <button onClick={()=>downloadText("uaos-v113-timeline.json", uaosTimeline.exportJson())} style={{marginLeft:8}}>Export Timeline</button>
        <button onClick={()=>downloadText("uaos-v113-style.json", arranger.exportStyle())} style={{marginLeft:8}}>Export Style</button>
        <button onClick={()=>downloadText("uaos-v114-midi-draft.json", exportMidiDraft(uaosTimeline.load()))} style={{marginLeft:8}}>Export MIDI Draft</button>
        <button onClick={()=>downloadBytes("uaos-v114-export.mid", makeMidiFile(uaosTimeline.load(), arrangerState.bpm))} style={{marginLeft:8}}>Export Real MIDI</button>
        <button onClick={()=>downloadText("uaos-v114-project.uaos.json", makeProjectSnapshot({timeline:uaosTimeline.load(), arrangerState, midiProfiles:midi.getProfiles()}))} style={{marginLeft:8}}>Save Project</button>
      </div>

      <h2>Load UAOS Project</h2>
      <input type="file" accept="application/json" onChange={e=>{
        const file=e.target.files?.[0];
        if(!file)return;
        const r=new FileReader();
        r.onload=()=>{
          try{
            const p=loadProjectSnapshot(String(r.result));
            localStorage.setItem("uaos.v113.timeline", JSON.stringify(p.timeline || []));
            setStatus("PROJECT LOADED â€” refresh page to restore full timeline");
          }catch(err){
            setStatus("PROJECT LOAD FAILED: " + err.message);
          }
        };
        r.readAsText(file);
      }} />

      <h2>Import UAOS Style JSON</h2>
      <input type="file" accept="application/json" onChange={e=>importStyleFile(e.target.files?.[0])} />

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
      <pre style={{background:"#111827",padding:12,borderRadius:8}}>{JSON.stringify(voiceMidi,null,2)}</pre>

      <h2>Keyboard Profile Editor</h2>
      <select onChange={e=>midi.setProfile(e.target.value)}>
        {Object.keys(midi.getProfiles()).map(k=>(
          <option key={k} value={k}>{midi.getProfiles()[k].name}</option>
        ))}
      </select>
      <input style={{marginLeft:8}} type="number" value={profileEditor.channel} onChange={e=>setProfileEditor({...profileEditor,channel:e.target.value})} placeholder="Channel" />
      <input style={{marginLeft:8}} type="number" value={profileEditor.transpose} onChange={e=>setProfileEditor({...profileEditor,transpose:e.target.value})} placeholder="Transpose" />
      <button onClick={applyProfileEdit} style={{marginLeft:8}}>Apply Profile</button>

      <h2>MIDI Routing</h2>
      <select onChange={e=>midi.setOutput(e.target.value)}>
        <option value="">Auto output</option>
        {midiInfo.outputs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <pre style={{background:"#111827",padding:12,borderRadius:8}}>{JSON.stringify(midiInfo,null,2)}</pre>

      <h2>Arranger Engine</h2>
      <p>
        Section: {arrangerState.section} |
        Chord: {arrangerState.chord} |
        BPM: {arrangerState.bpm} |
        Pattern: {arrangerState.patterns[arrangerState.patternKey]?.name} |
        Running: {String(arrangerState.running)}
      </p>

      <div>
        {UAOS_SECTIONS.map(s=><button key={s} onClick={()=>arranger.setSection(s)} style={{margin:4}}>{s}</button>)}
      </div>

      <div>
        {UAOS_SECTIONS.map(s=><button key={"recall-"+s} onClick={()=>arranger.recallSection(s)} style={{margin:4}}>Recall {s}</button>)}
      </div>

      <div>
        {chords.map(c=><button key={c} onClick={()=>arranger.setChord(c)} style={{margin:4}}>{c}</button>)}
      </div>

      <h3>Pattern Editor</h3>
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

      <h3>Pattern Memory</h3>
      <select onChange={e=>arranger.setPattern(e.target.value)} value={arrangerState.patternKey}>
        {Object.entries(arrangerState.patterns).map(([key,p])=><option key={key} value={key}>{p.name}</option>)}
      </select>

      <h3>Section Memory</h3>
      <pre style={{background:"#111827",padding:12,borderRadius:8}}>{JSON.stringify(arrangerState.sectionMemory,null,2)}</pre>

      <h2>Song Arrangement</h2>
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

      <h2>Realtime Timeline</h2>
      <ul>
        {events.map(e=><li key={e.id}><b>{e.type}</b> â€” {JSON.stringify(e.payload)}</li>)}
      </ul>
    </div>
  );
}


