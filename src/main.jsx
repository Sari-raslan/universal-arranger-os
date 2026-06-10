import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  apiHealth, sendState, detectChord, playStyle, stopStyle, recStart, recStop,
  getSequencer, seqToggle, getMixer, mixerSet, getDevices, exportMidi, exportStyle,
  bridgeHealth, bridgeScan, bridgeSendNote, bridgePanic
} from "./api.js";
import "./style.css";

const sections = ["Intro","Main A","Main B","Main C","Fill","Break","Ending"];
const noteSets = { Cm:[60,63,67], C:[60,64,67], G:[67,71,74], Ab:[68,72,75], Bb:[70,74,77] };

function App(){
  const [tab,setTab] = useState("studio");
  const [api,setApi] = useState({});
  const [bridge,setBridge] = useState({});
  const [section,setSection] = useState("Intro");
  const [tempo,setTempo] = useState(120);
  const [chord,setChord] = useState("Cm");
  const [seq,setSeq] = useState({steps:[]});
  const [mixer,setMixer] = useState({tracks:[]});
  const [devices,setDevices] = useState({});
  const [log,setLog] = useState([]);

  function addLog(x){ setLog(l => [typeof x === "string" ? x : JSON.stringify(x), ...l].slice(0,12)); }

  async function refresh(){
    setApi(await apiHealth());
    setBridge(await bridgeHealth());
    setSeq(await getSequencer());
    setMixer(await getMixer());
    setDevices(await getDevices());
  }

  useEffect(()=>{
    refresh();
    const t = setInterval(refresh, 2500);
    return ()=>clearInterval(t);
  },[]);

  async function changeSection(s){ setSection(s); addLog(await sendState({ section:s })); }
  async function changeTempo(v){ setTempo(Number(v)); addLog(await sendState({ tempo:Number(v) })); }
  async function testChord(name){ const r = await detectChord(noteSets[name]); setChord(r.chord); addLog(r); }
  async function toggle(track, step){ addLog(await seqToggle(track, step)); setSeq(await getSequencer()); }
  async function volume(name, value){ addLog(await mixerSet(name, { volume:Number(value) })); setMixer(await getMixer()); }

  return (
    <main className="uaos">
      <header>
        <h1>UAOS Universal Arranger OS</h1>
        <p>Real Engine • MIDI Bridge • Export Layer • Live Studio</p>
        <div className="status">
          <b className={api.ok ? "ok" : "warn"}>Backend: {api.ok ? "8080 OK" : "offline"}</b>
          <b className={bridge.ok ? "ok" : "warn"}>MIDI Bridge: {bridge.ok ? "8090 OK" : "offline"}</b>
        </div>
        <nav>
          {["studio","bridge","export","diagnostics"].map(x=>
            <button key={x} className={tab===x ? "on" : ""} onClick={()=>setTab(x)}>{x}</button>
          )}
        </nav>
      </header>

      {tab==="studio" && <section className="grid">
        <div className="card">
          <h2>Arranger</h2>
          {sections.map(s=><button key={s} onClick={()=>changeSection(s)}>{s}</button>)}
          <p>Active: <b>{section}</b></p>
        </div>

        <div className="card">
          <h2>Chord Detector</h2>
          {Object.keys(noteSets).map(n=><button key={n} onClick={()=>testChord(n)}>{n}</button>)}
          <p>Chord: <b>{chord}</b></p>
        </div>

        <div className="card">
          <h2>Tempo</h2>
          <input type="range" min="60" max="200" value={tempo} onChange={e=>changeTempo(e.target.value)} />
          <p><b>{tempo}</b> BPM</p>
        </div>

        <div className="card">
          <h2>Player</h2>
          <button onClick={async()=>addLog(await playStyle("Oriental Pop"))}>Play</button>
          <button onClick={async()=>addLog(await stopStyle())}>Stop</button>
          <button onClick={async()=>addLog(await recStart())}>Rec</button>
          <button onClick={async()=>addLog(await recStop())}>Stop Rec</button>
        </div>

        <div className="card wide">
          <h2>Sequencer</h2>
          {["kick","snare","hat"].map(track => (
            <div className="seqrow" key={track}>
              <b>{track}</b>
              {(seq.steps || []).map(s=>
                <button className={s[track] ? "on" : ""} key={track+s.step} onClick={()=>toggle(track,s.step)}>{s.step}</button>
              )}
            </div>
          ))}
        </div>

        <div className="card wide">
          <h2>Mixer</h2>
          {(mixer.tracks || []).map(t=>(
            <div className="mix" key={t.name}>
              <b>{t.name}</b>
              <input type="range" min="0" max="100" value={t.volume} onChange={e=>volume(t.name,e.target.value)} />
              <span>{t.volume}</span>
            </div>
          ))}
        </div>
      </section>}

      {tab==="bridge" && <section className="grid">
        <div className="card">
          <h2>MIDI Bridge Control</h2>
          <button onClick={async()=>{const r=await bridgeHealth(); setBridge(r); addLog(r);}}>Health</button>
          <button onClick={async()=>{const r=await bridgeScan(); setBridge(r); addLog(r);}}>Scan</button>
          <button onClick={async()=>addLog(await bridgeSendNote(60,100,1))}>Send C</button>
          <button onClick={async()=>addLog(await bridgeSendNote(64,100,1))}>Send E</button>
          <button onClick={async()=>addLog(await bridgeSendNote(67,100,1))}>Send G</button>
          <button onClick={async()=>addLog(await bridgePanic())}>Panic</button>
        </div>

        <div className="card wide">
          <h2>Bridge State</h2>
          <pre>{JSON.stringify(bridge, null, 2)}</pre>
        </div>

        <div className="card wide">
          <h2>Device Profiles</h2>
          <pre>{JSON.stringify(devices.profiles || {}, null, 2)}</pre>
        </div>
      </section>}

      {tab==="export" && <section className="grid">
        <div className="card">
          <h2>Export Drafts</h2>
          <button onClick={async()=>addLog(await exportMidi())}>MIDI Draft</button>
          <button onClick={async()=>addLog(await exportStyle("korg"))}>KORG</button>
          <button onClick={async()=>addLog(await exportStyle("yamaha"))}>Yamaha</button>
          <button onClick={async()=>addLog(await exportStyle("roland"))}>Roland</button>
          <button onClick={async()=>addLog(await exportStyle("ketron"))}>Ketron</button>
        </div>
      </section>}

      {tab==="diagnostics" && <section className="grid">
        <div className="card wide">
          <h2>Runtime Log</h2>
          <pre>{log.join("\n\n")}</pre>
        </div>
      </section>}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
