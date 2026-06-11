import React,{useEffect,useMemo,useState} from "react";
import {json,exportMidi} from "./api";
import {UAOSSampler} from "./lib/sampler";
import "./style.css";

export default function App(){
  const sampler=useMemo(()=>new UAOSSampler(),[]);
  const [status,setStatus]=useState(null);
  const [sounds,setSounds]=useState(null);
  const [samples,setSamples]=useState([]);
  const [section,setSection]=useState("Main A");
  const [chord,setChord]=useState("Cm");
  const [maqam,setMaqam]=useState("Nahawand");
  const [tempo,setTempo]=useState(96);
  const [pattern,setPattern]=useState(null);
  const [log,setLog]=useState([]);

  function addLog(m){ setLog(x=>[new Date().toLocaleTimeString()+" "+m,...x].slice(0,20)); }

  async function load(){
    try{
      setStatus(await json("/api/status"));
      setSounds(await json("/api/sounds"));
      const map=await json("/api/sampler/map");
      setSamples(map.samples);
      await sampler.loadMap(map.samples);
      addLog("Backend + sampler map loaded");
    }catch(e){ addLog("LOAD FAIL "+e.message); }
  }

  async function generate(){
    const p=await json("/api/patterns/generate",{section,chord,maqam,tempo});
    setPattern(p);
    addLog("Pattern generated: "+p.name);
  }

  async function play(){
    const p=pattern || await json("/api/patterns/generate",{section,chord,maqam,tempo});
    setPattern(p);
    sampler.playPattern(p);
    addLog("Playback started");
  }

  async function importWav(file){
    const arr=await file.arrayBuffer();
    const b64=btoa(String.fromCharCode(...new Uint8Array(arr)));
    await json("/api/samples/import",{filename:file.name,base64:b64});
    addLog("Imported sample: "+file.name);
    await load();
  }

  useEffect(()=>{load();},[]);

  return <main className="app">
    <section className="hero">
      <div className="hero-copy">
        <span className="kicker">Universal Arranger OS</span>
        <h1>UAOS HyperStation</h1>
        <p>Real audio, MIDI export, and style arranging in one synced workstation.</p>
      </div>
      <div className="badges">
        <span>{status?.ok ? "Backend PASS" : "Backend..."}</span>
        <span>Sampler {samples.length} WAV</span>
        <span>Quarter-tone ready</span>
      </div>
    </section>

    <section className="grid">
      <div className="card">
        <h2>Style Arranger</h2>
        <label>Section</label>
        <select value={section} onChange={e=>setSection(e.target.value)}>
          {["Intro","Main A","Main B","Main C","Main D","Fill","Break","Ending"].map(x=><option key={x}>{x}</option>)}
        </select>

        <label>Chord</label>
        <select value={chord} onChange={e=>setChord(e.target.value)}>
          {["Cm","Dm","G7","F","Bb","A","Am","E7"].map(x=><option key={x}>{x}</option>)}
        </select>

        <label>Maqam</label>
        <select value={maqam} onChange={e=>setMaqam(e.target.value)}>
          {["Nahawand","Bayati","Hijaz","Rast","Saba","Kurd","Ajam"].map(x=><option key={x}>{x}</option>)}
        </select>

        <label>Tempo: {tempo}</label>
        <input type="range" min="60" max="160" value={tempo} onChange={e=>setTempo(Number(e.target.value))}/>

        <div className="buttons">
          <button onClick={generate}>Generate</button>
          <button onClick={play}>Play</button>
          <button onClick={()=>exportMidi(pattern || {section,chord,maqam,tempo})}>Export MIDI</button>
        </div>
      </div>

      <div className="card">
        <h2>Real Sampler Import</h2>
        <p>Drag/drop WAV samples. Current playback uses your WAV map when available, otherwise synth fallback.</p>
        <input type="file" accept=".wav" onChange={e=>e.target.files[0] && importWav(e.target.files[0])}/>
        <ul>{samples.map(s=><li key={s.id}>{s.file} — {s.lowNote}-{s.highNote}</li>)}</ul>
      </div>

      <div className="card">
        <h2>Oriental / Gulf Libraries</h2>
        <h3>Oriental</h3>
        <ul>{sounds?.oriental?.map(s=><li key={s.id}>{s.name} — {s.articulations.join(", ")}</li>)}</ul>
        <h3>Gulf</h3>
        <ul>{sounds?.gulf?.map(s=><li key={s.id}>{s.name} — {s.articulations.join(", ")}</li>)}</ul>
      </div>

      <div className="card">
        <h2>MIDI Monitor / Pattern JSON</h2>
        <pre>{JSON.stringify(pattern,null,2)}</pre>
      </div>
    </section>

    <section className="card">
      <h2>System Log</h2>
      {log.map((l,i)=><div key={i} className="log">{l}</div>)}
    </section>
  </main>
}
