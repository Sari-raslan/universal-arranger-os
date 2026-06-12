import React, { useEffect, useMemo, useState } from "react";
import { uaosBus } from "./core/uaosBus.js";
import { uaosTimeline } from "./timeline/uaosTimeline.js";
import { UAOSAudioEngine } from "./audio/uaosAudioEngine.js";
import { UAOSMidiEngine } from "./midi/uaosMidiEngine.js";

export default function App(){
  const audio = useMemo(()=>new UAOSAudioEngine(uaosBus, uaosTimeline), []);
  const midi = useMemo(()=>new UAOSMidiEngine(uaosBus, uaosTimeline), []);

  const [level,setLevel] = useState(0);
  const [peak,setPeak] = useState(0);
  const [events,setEvents] = useState([]);
  const [midiInfo,setMidiInfo] = useState(null);
  const [status,setStatus] = useState("READY");

  useEffect(()=>{
    uaosBus.on("*", () => {
      setEvents([...uaosTimeline.load()].slice(-40).reverse());
    });

    uaosBus.on("audio.level", ev => {
      setLevel(ev.payload.level);
      setPeak(ev.payload.peak);
    });

    uaosBus.on("midi.scan", ev => {
      setMidiInfo(ev.payload);
    });
  },[]);

  function exportTimeline(){
    const blob = new Blob([uaosTimeline.exportJson()], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uaos-v19-timeline.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function startAudio(){
    try{
      setStatus("STARTING AUDIO...");
      await audio.start();
      setStatus("AUDIO RUNNING");
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

  return (
    <div style={{
      minHeight:"100vh",
      background:"#070b14",
      color:"white",
      fontFamily:"Arial",
      padding:24
    }}>
      <h1>UAOS V1.9 Real Capture</h1>
      <p>Real microphone + real MIDI + event timeline + JSON export.</p>

      <h3>Status: {status}</h3>

      <button onClick={startAudio}>Start Real Audio</button>
      <button onClick={startMidi} style={{marginLeft:8}}>Start MIDI</button>
      <button onClick={()=>{uaosTimeline.clear();setEvents([])}} style={{marginLeft:8}}>Clear Timeline</button>
      <button onClick={exportTimeline} style={{marginLeft:8}}>Export Timeline JSON</button>

      <h2>Audio</h2>
      <p>Level: {level} | Peak: {peak}</p>
      <progress value={level} max="255" style={{width:"100%"}} />

      <h2>MIDI Devices</h2>
      <pre style={{background:"#111827",padding:12,borderRadius:8}}>
        {JSON.stringify(midiInfo,null,2)}
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
