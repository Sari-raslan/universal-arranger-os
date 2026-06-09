import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { apiHealth } from "./api.js";
import "./style.css";

const sections = ["Intro","Main A","Main B","Main C","Fill","Break","Ending"];
const devices = ["KORG PA3X","KORG PA5X","Yamaha Genos","Roland BK9","Ketron SD9","Generic MIDI"];

function App(){
  const [section,setSection] = useState("Intro");
  const [tempo,setTempo] = useState(120);
  const [chord,setChord] = useState("Cm");
  const [api,setApi] = useState({offline:true});

  useEffect(()=>{ apiHealth().then(setApi); },[]);

  return (
    <main className="uaos">
      <header>
        <h1>UAOS Universal Arranger OS</h1>
        <p>Live Arranger • MIDI Core • AI HyperStation</p>
        <b className={api.ok ? "ok" : "warn"}>{api.ok ? "Backend Ready" : "Frontend Live / Backend Offline"}</b>
      </header>

      <section className="grid">
        <div className="card">
          <h2>Live Arranger</h2>
          <div className="buttons">
            {sections.map(s => <button onClick={()=>setSection(s)} key={s}>{s}</button>)}
          </div>
          <p>Active: <b>{section}</b></p>
        </div>

        <div className="card">
          <h2>Chord Engine</h2>
          <input value={chord} onChange={e=>setChord(e.target.value)} />
          <p>Chord: <b>{chord}</b></p>
        </div>

        <div className="card">
          <h2>Tempo Sync</h2>
          <input type="range" min="60" max="200" value={tempo} onChange={e=>setTempo(e.target.value)} />
          <p><b>{tempo}</b> BPM</p>
        </div>

        <div className="card">
          <h2>MIDI Devices</h2>
          {devices.map(d => <div className="device" key={d}>{d}</div>)}
        </div>

        <div className="card wide">
          <h2>Phase 3 AI</h2>
          <p>Voice-to-MIDI, AI style generator, song analyzer, smart arranger assistant.</p>
          <button>Prepare AI Session</button>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);