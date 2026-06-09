import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  apiHealth, diagnostics, getReport, sendState, detectChord, playStyle, stopStyle,
  recStart, recStop, WS_BASE, getSequencer, seqToggle, getMixer, mixerSet,
  getDevices, exportProject, getSong, generateSong, importProject,
  getTemplates, applyTemplate, getPresets, applyPreset
} from "./api.js";
import { scanWebMidi, playTestNote } from "./midi-web.js";
import { saveProject, loadProject } from "./project-store.js";
import { generateStyle } from "./ai-style.js";
import { downloadJson, readJsonFile } from "./file-tools.js";
import "./style.css";

const sections = ["Intro", "Main A", "Main B", "Main C", "Fill", "Break", "Ending"];
const noteSets = { Cm:[60,63,67], C:[60,64,67], G:[67,71,74], Ab:[68,72,75], Bb:[70,74,77] };

function App() {
  const [tab, setTab] = useState("studio");
  const [section, setSection] = useState("Intro");
  const [tempo, setTempo] = useState(120);
  const [chord, setChord] = useState("Cm");
  const [api, setApi] = useState({ offline:true });
  const [ws, setWs] = useState("offline");
  const [midi, setMidi] = useState({ inputs:[], outputs:[] });
  const [style, setStyle] = useState(generateStyle());
  const [seq, setSeq] = useState({ steps:[], position:0 });
  const [mixer, setMixer] = useState({ tracks:[] });
  const [devices, setDevices] = useState({});
  const [song, setSong] = useState({ song:[] });
  const [templates, setTemplates] = useState([]);
  const [presets, setPresets] = useState([]);
  const [diag, setDiag] = useState({});
  const [report, setReport] = useState({});
  const [log, setLog] = useState([]);

  const snapshot = { section, tempo, chord, style, seq, mixer, song };

  function addLog(x) {
    setLog(l => [typeof x === "string" ? x : JSON.stringify(x), ...l].slice(0, 10));
  }

  async function refresh() {
    setApi(await apiHealth());
    setSeq(await getSequencer());
    setMixer(await getMixer());
    setDevices(await getDevices());
    setSong(await getSong());
    const t = await getTemplates(); setTemplates(t.templates || []);
    const p = await getPresets(); setPresets(p.presets || []);
  }

  useEffect(() => {
    const saved = loadProject();
    if (saved) {
      setSection(saved.section || "Intro");
      setTempo(saved.tempo || 120);
      setChord(saved.chord || "Cm");
      if (saved.style) setStyle(saved.style);
    }

    refresh();

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

    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, []);

  async function changeSection(s) { setSection(s); addLog(await sendState({ section:s })); }
  async function changeTempo(v) { setTempo(Number(v)); addLog(await sendState({ tempo:Number(v) })); }
  async function testChord(name) { const r = await detectChord(noteSets[name]); setChord(r.chord); addLog(r); }
  async function toggle(track, step) { addLog(await seqToggle(track, step)); setSeq(await getSequencer()); }
  async function volume(name, value) { addLog(await mixerSet(name, { volume:Number(value) })); setMixer(await getMixer()); }
  async function exportNow() { const p = await exportProject(); downloadJson("uaos-project.json", p); addLog("Exported uaos-project.json"); }
  async function reportNow() { const r = await getReport(); setReport(r); downloadJson("uaos-session-report.json", r); addLog("Downloaded report"); }
  async function importNow(file) { const data = await readJsonFile(file); addLog(await importProject(data.project || data)); refresh(); }

  return (
    <main className="uaos">
      <header>
        <h1>UAOS Universal Arranger OS</h1>
        <p>Studio • Arranger • Sequencer • Mixer • MIDI Clock • Templates • Diagnostics</p>
        <div className="status">
          <b className={api.ok ? "ok" : "warn"}>{api.ok ? "Backend Ready" : "Frontend Live / Backend Offline"}</b>
          <b className={ws === "connected" ? "ok" : "warn"}>WebSocket: {ws}</b>
          <b>Clock: {api.clock?.running ? "running" : "stopped"} / {api.clock?.pulses || 0}</b>
        </div>
        <nav>
          {["studio","song","devices","diagnostics"].map(x => <button className={tab===x ? "on" : ""} onClick={()=>setTab(x)} key={x}>{x}</button>)}
        </nav>
      </header>

      {tab === "studio" && (
        <section className="grid">
          <div className="card">
            <h2>Templates</h2>
            {templates.map(t => <button key={t.id} onClick={async()=>{const r=await applyTemplate(t.id); addLog(r); refresh();}}>{t.name}</button>)}
          </div>

          <div className="card">
            <h2>Presets</h2>
            {presets.map(p => <button key={p.id} onClick={async()=>{const r=await applyPreset(p.id); addLog(r); refresh();}}>{p.name}</button>)}
          </div>

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

          <div className="card wide">
            <h2>Step Sequencer</h2>
            <p>Position: <b>{seq.position || 0}</b></p>
            {["kick","snare","hat"].map(track => (
              <div className="seqrow" key={track}>
                <b>{track}</b>
                {(seq.steps || []).map(s => <button className={s[track] ? "on" : ""} onClick={()=>toggle(track,s.step)} key={track+s.step}>{s.step}</button>)}
              </div>
            ))}
          </div>

          <div className="card wide">
            <h2>Mixer</h2>
            {(mixer.tracks || []).map(t => (
              <div className="mix" key={t.name}>
                <b>{t.name}</b>
                <input type="range" min="0" max="100" value={t.volume} onChange={e=>volume(t.name,e.target.value)} />
                <span>{t.volume}</span>
              </div>
            ))}
          </div>

          <div className="card wide">
            <h2>Runtime Log</h2>
            <pre>{log.join("\n\n")}</pre>
          </div>
        </section>
      )}

      {tab === "song" && (
        <section className="grid">
          <div className="card wide">
            <h2>Song Builder</h2>
            <button onClick={async()=>{const s=await generateSong(style.name); setSong(s); addLog(s);}}>Generate Song</button>
            <div className="songline">{(song.song || []).map((x,i)=><span key={i}>{x.section} • {x.bars} bars • {x.chord}</span>)}</div>
          </div>

          <div className="card">
            <h2>AI Style Generator</h2>
            <button onClick={()=>{const s=generateStyle("Oriental Pop Pro"); setStyle(s); addLog(s);}}>Generate Style</button>
            <p><b>{style.name}</b></p>
          </div>

          <div className="card">
            <h2>Project</h2>
            <button onClick={()=>addLog(saveProject(snapshot))}>Save Local</button>
            <button onClick={exportNow}>Download Export</button>
            <button onClick={reportNow}>Download Report</button>
            <input type="file" accept=".json" onChange={e=>e.target.files?.[0] && importNow(e.target.files[0])} />
          </div>

          <div className="card wide">
            <h2>Report Preview</h2>
            <pre>{JSON.stringify(report, null, 2)}</pre>
          </div>
        </section>
      )}

      {tab === "devices" && (
        <section className="grid">
          <div className="card">
            <h2>Web MIDI</h2>
            <button onClick={async()=>{const r=await scanWebMidi(); setMidi(r); addLog(r);}}>Scan MIDI</button>
            <button onClick={async()=>addLog(await playTestNote(60))}>Play C</button>
            <p>Inputs: {(midi.inputs || []).join(", ") || "none"}</p>
            <p>Outputs: {(midi.outputs || []).join(", ") || "none"}</p>
          </div>

          <div className="card wide">
            <h2>Device Profiles</h2>
            <pre>{JSON.stringify(devices.profiles || {}, null, 2)}</pre>
          </div>
        </section>
      )}

      {tab === "diagnostics" && (
        <section className="grid">
          <div className="card">
            <h2>Diagnostics</h2>
            <button onClick={async()=>{const d=await diagnostics(); setDiag(d); addLog(d);}}>Run Diagnostics</button>
          </div>
          <div className="card wide">
            <pre>{JSON.stringify(diag, null, 2)}</pre>
          </div>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);