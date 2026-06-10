import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {
  apiHealth,phase4Report,bridgeHealth,bridgeScan,bridgeOpen,bridgeNote,
  bridgeChord,bridgeProgression,bridgeDemoSong,bridgeStart,bridgeStop,
  bridgeFill,bridgeBreak,bridgePanic,bridgeClockStart,bridgeClockStop
} from "./api.js";
import "./style.css";

function App(){
  const [backend,setBackend]=useState({});
  const [bridge,setBridge]=useState({});
  const [log,setLog]=useState([]);
  const [bpm,setBpm]=useState(120);

  function add(x){setLog(l=>[typeof x==="string"?x:JSON.stringify(x,null,2),...l].slice(0,18))}
  async function refresh(){setBackend(await apiHealth());setBridge(await bridgeHealth())}

  useEffect(()=>{refresh();const t=setInterval(refresh,2000);return()=>clearInterval(t)},[])

  async function run(fn){const r=await fn();add(r);refresh()}

  return <main className="uaos">
    <header>
      <h1>UAOS PA3X Live Control</h1>
      <p>Real USB MIDI Control • Chords • Progressions • Panic • Clock Draft</p>
      <div className="status">
        <b className={backend.ok?"ok":"warn"}>Backend 8080: {backend.ok?"OK":"offline"}</b>
        <b className={bridge.connected?"ok":"warn"}>PA3X: {bridge.connected?bridge.selectedOutput:"not connected"}</b>
      </div>
    </header>

    <section className="grid">
      <div className="card">
        <h2>Connection</h2>
        <button onClick={()=>run(bridgeScan)}>Scan</button>
        <button onClick={()=>run(bridgeOpen)}>Open Ports</button>
        <button onClick={()=>run(bridgeHealth)}>Health</button>
        <button onClick={()=>run(phase4Report)}>Phase4 Report</button>
      </div>

      <div className="card">
        <h2>Notes</h2>
        <button onClick={()=>run(()=>bridgeNote(60))}>C</button>
        <button onClick={()=>run(()=>bridgeNote(64))}>E</button>
        <button onClick={()=>run(()=>bridgeNote(67))}>G</button>
        <button onClick={()=>run(()=>bridgeNote(72))}>C High</button>
      </div>

      <div className="card">
        <h2>Chords</h2>
        {["CM","C","F","G","AM","AB","BB","DM"].map(c=>
          <button key={c} onClick={()=>run(()=>bridgeChord(c))}>{c}</button>
        )}
      </div>

      <div className="card">
        <h2>Progressions</h2>
        <button onClick={()=>run(()=>bridgeProgression("oriental_pop"))}>Oriental Pop</button>
        <button onClick={()=>run(()=>bridgeProgression("dabke"))}>Dabke</button>
        <button onClick={()=>run(()=>bridgeProgression("pop"))}>Pop</button>
        <button onClick={()=>run(()=>bridgeProgression("ballad"))}>Ballad</button>
        <button onClick={()=>run(bridgeDemoSong)}>Demo Song</button>
      </div>

      <div className="card">
        <h2>Arranger Control</h2>
        <button onClick={()=>run(bridgeStart)}>Start</button>
        <button onClick={()=>run(bridgeStop)}>Stop</button>
        <button onClick={()=>run(bridgeFill)}>Fill</button>
        <button onClick={()=>run(bridgeBreak)}>Break</button>
        <button className="danger" onClick={()=>run(bridgePanic)}>Panic</button>
      </div>

      <div className="card">
        <h2>Clock Draft</h2>
        <input type="range" min="60" max="180" value={bpm} onChange={e=>setBpm(Number(e.target.value))}/>
        <p>{bpm} BPM</p>
        <button onClick={()=>run(()=>bridgeClockStart(bpm))}>Clock Start</button>
        <button onClick={()=>run(bridgeClockStop)}>Clock Stop</button>
      </div>

      <div className="card wide">
        <h2>Bridge State</h2>
        <pre>{JSON.stringify(bridge,null,2)}</pre>
      </div>

      <div className="card wide">
        <h2>Runtime Log</h2>
        <pre>{log.join("\n\n")}</pre>
      </div>
    </section>
  </main>
}

createRoot(document.getElementById("root")).render(<App/>)
