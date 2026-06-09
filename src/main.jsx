import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { apiHealth, sendState, detectChord, playStyle, stopStyle, recStart, recStop, WS_BASE } from "./api.js";
import "./style.css";

const sections = ["Intro","Main A","Main B","Main C","Fill","Break","Ending"];
const devices = ["KORG PA3X","KORG PA5X","Yamaha Genos","Roland BK9","Ketron SD9","Generic MIDI"];
const noteSets = {
  "Cm":[60,63,67],
  "C":[60,64,67],
  "G":[67,71,74],
  "Ab":[68,72,75],
  "Bb":[70,74,77]
};

function App(){
  const [section,setSection] = useState("Intro");
  const [tempo,setTempo] = useState(120);
  const [chord,setChord] = useState("Cm");
  const [api,setApi] = useState({offline:true});
  const [ws,setWs] = useState("offline");
  const [log,setLog] = useState([]);

  function addLog(x){ setLog(l => [JSON.stringify(x), ...l].slice(0,8)); }

  useEffect(()=>{
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
            setSection(msg.state.section || "Intro");
            setTempo(msg.state.tempo || 120);
            setChord(msg.state.chord || "Cm");
          }
        } catch {}
      };
      return () => socket.close();
    } catch {
      setWs("offline");
    }
  },[]);

  async function changeSection(s){ setSection(s); addLog(await sendState({ section:s })); }
  async function changeTempo(v){ setTempo(v); addLog(await sendState({ tempo:Number(v) })); }
  async function testChord(name){ const r = await detectChord(noteSets[name]); setChord(r.chord); addLog(r); }

  return (
    <main className="uaos">
      <header>
        <h1>UAOS Universal Arranger OS</h1>
        <p>Live Arranger • MIDI Core • Realtime Backend • AI HyperStation</p>
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
          <button onClick={async()=>addLog(await playStyle("Oriental Pop"))}>Play Style</button>
          <button onClick={async()=>addLog(await stopStyle())}>Stop</button>
          <button onClick={async()=>addLog(await recStart())}>Rec</button>
          <button onClick={async()=>addLog(await recStop())}>Stop Rec</button>
        </div>

        <div className="card">
          <h2>MIDI Devices</h2>
          {devices.map(d => <div className="device" key={d}>{d}</div>)}
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