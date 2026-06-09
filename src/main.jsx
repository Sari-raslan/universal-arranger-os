import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { apiHealth, sendState, detectChord, playStyle, stopStyle, recStart, recStop, WS_BASE } from "./api.js";
import { scanWebMidi, playTestNote } from "./midi-web.js";
import { saveProject, loadProject } from "./project-store.js";
import { generateStyle } from "./ai-style.js";
import "./style.css";

const sections = ["Intro","Main A","Main B","Main C","Fill","Break","Ending"];
const noteSets = { Cm:[60,63,67], C:[60,64,67], G:[67,71,74], Ab:[68,72,75], Bb:[70,74,77] };

function App(){
  const [section,setSection] = useState("Intro");
  const [tempo,setTempo] = useState(120);
  const [chord,setChord] = useState("Cm");
  const [api,setApi] = useState({offline:true});
  const [ws,setWs] = useState("offline");
  const [midi,setMidi] = useState({inputs:[],outputs:[]});
  const [style,setStyle] = useState(generateStyle());
  const [log,setLog] = useState([]);

  const snapshot = { section, tempo, chord, style };

  function addLog(x){ setLog(l => [typeof x === "string" ? x : JSON.stringify(x), ...l].slice(0,10)); }

  useEffect(()=>{
    const saved = loadProject();
    if(saved){
      setSection(saved.section || "Intro");
      setTempo(saved.tempo || 120);
      setChord(saved.chord || "Cm");
      if(saved.style) setStyle(saved.style);
    }

    apiHealth().then(r => { setApi(r); addLog(r); });

    try {
      const socket = new WebSocket(WS_BASE);
      socket.onopen = () => setWs("connected");
      socket.onclose = () => setWs("offline");
      socket.onerror = () => setWs("error");
      socket.onmessage = e => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.state) {
            setSection(msg.state.section || section);
            setTempo(msg.state.tempo || tempo);
            setChord(msg.state.chord || chord);
          }
        } catch {}
      };
      return () => socket.close();
    } catch { setWs("offline"); }
  },[]);

  async function changeSection(s){ setSection(s); addLog(await sendState({ section:s })); }
  async function changeTempo(v){ setTempo(Number(v)); addLog(await sendState({ tempo:Number(v) })); }
  async function testChord(name){ const r = await detectChord(noteSets[name]); setChord(r.chord); addLog(r); }

  return (
    <main className="uaos">
      <header>
        <h1>UAOS Universal Arranger OS</h1>
        <p>Studio • Live Arranger • Web MIDI • AI Style Engine</p>
        <div className="status">
          <b className={api.ok ? "ok" : "warn"}>{api.ok ? "Backend Ready" : "Frontend Live / Backend Offline"}</b>
          <b className={ws === "connected" ? "ok" : "warn"}>WebSocket: {ws}</b>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <h2>Live Arranger</h2>
          <div className="buttons">{sections.map(s => <button onClick={()=>changeSection(s)} key={s}>{s}</button>)}</div>
          <p>Active: <b>{section}</b></p>
        </div>

        <div className="card">
          <h2>Chord Detector</h2>
          <div className="buttons">{Object.keys(noteSets).map(n => <button onClick={()=>testChord(n)} key={n}>{n}</button>)}</div>
          <p>Detected: <b>{chord}</b></p>
        </div>

        <div className="card">
          <h2>Tempo Sync</h2>
          <input type="range" min="60" max="200" value={tempo} onChange={e=>changeTempo(e.target.value)} />
          <p><b>{tempo}</b> BPM</p>
        </div>

        <div className="card">
          <h2>Style Player</h2>
          <button onClick={async()=>addLog(await playStyle(style.name))}>Play Style</button>
          <button onClick={async()=>addLog(await stopStyle())}>Stop</button>
          <button onClick={async()=>addLog(await recStart())}>Rec</button>
          <button onClick={async()=>addLog(await recStop())}>Stop Rec</button>
        </div>

        <div className="card">
          <h2>Web MIDI</h2>
          <button onClick={async()=>{const r=await scanWebMidi(); setMidi(r); addLog(r);}}>Scan MIDI</button>
          <button onClick={async()=>addLog(await playTestNote(60))}>Play C</button>
          <p>Inputs: {(midi.inputs || []).join(", ") || "none"}</p>
          <p>Outputs: {(midi.outputs || []).join(", ") || "none"}</p>
        </div>

        <div className="card">
          <h2>AI Style Generator</h2>
          <button onClick={()=>{const s=generateStyle("Oriental Pop Pro"); setStyle(s); addLog(s);}}>Generate Style</button>
          <p><b>{style.name}</b></p>
          <pre>{JSON.stringify(style.sections, null, 2)}</pre>
        </div>

        <div className="card">
          <h2>Project</h2>
          <button onClick={()=>addLog(saveProject(snapshot))}>Save Project</button>
          <button onClick={()=>{const p=loadProject(); addLog(p || "No saved project");}}>Load Info</button>
        </div>

        <div className="card wide">
          <h2>Runtime Log</h2>
          <pre>{log.join("\n\n")}</pre>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);