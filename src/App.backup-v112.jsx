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
            <b>{e.type}</b> â€” {JSON.stringify(e.payload)}
          </li>
        ))}
      </ul>
    </div>
  );
}
