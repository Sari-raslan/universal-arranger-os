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
      setStatus("MIDI READY â€” RECORDING ENABLED");
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
            <b>{e.type}</b> â€” {JSON.stringify(e.payload)}
          </li>
        ))}
      </ul>
    </div>
  );
}
