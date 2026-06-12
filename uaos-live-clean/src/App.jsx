import React,{useEffect,useMemo,useState} from "react";
import { uaosBus } from "./core/uaosBus.js";
import { uaosTimeline } from "./core/uaosTimeline.js";
import { UAOSAudioEngine } from "./engines/uaosAudioEngine.js";
import { UAOSMidiEngine } from "./engines/uaosMidiEngine.js";
import { UAOSArranger, SECTIONS } from "./engines/uaosArranger.js";
import { downloadText, makeMidi, downloadMidi } from "./core/exporters.js";

const CHORDS=["C","Dm","Em","F","G","Am","A","E","D","C7","G7","Am7"];

export default function App(){
  const midi=useMemo(()=>new UAOSMidiEngine(uaosBus,uaosTimeline),[]);
  const audio=useMemo(()=>new UAOSAudioEngine(uaosBus,uaosTimeline),[]);
  const arranger=useMemo(()=>new UAOSArranger(uaosBus,uaosTimeline,midi),[midi]);

  const [status,setStatus]=useState("READY");
  const [audioState,setAudioState]=useState({});
  const [midiInfo,setMidiInfo]=useState({inputs:[],outputs:[]});
  const [events,setEvents]=useState([]);
  const [state,setState]=useState(arranger.state());
  const [live,setLive]=useState(false);

  useEffect(()=>{
    uaosBus.on("*",()=>{
      setEvents([...uaosTimeline.load()].slice(-80).reverse());
      setState(arranger.state());
    });
    uaosBus.on("audio.intelligence",ev=>{
      setAudioState(ev.payload);
      if(ev.payload.bpm) arranger.setBpm(ev.payload.bpm);
      if(ev.payload.chord) arranger.setChord(ev.payload.chord.chord);
    });
    uaosBus.on("midi.scan",ev=>setMidiInfo(ev.payload));
  },[arranger]);

  async function startAudio(){
    try{setStatus("AUDIO STARTING");await audio.start();setStatus("AUDIO RUNNING");}
    catch(e){setStatus("AUDIO ERROR: "+e.message);}
  }

  async function startMidi(){
    try{setStatus("MIDI STARTING");await midi.start();setStatus("MIDI READY");}
    catch(e){setStatus("MIDI ERROR: "+e.message);}
  }

  function controls(){
    return <>
      <button onClick={startAudio}>Start Audio</button>
      <button onClick={startMidi} style={{marginLeft:8}}>Start MIDI</button>
      <button onClick={()=>arranger.start()} style={{marginLeft:8}}>Start Arranger</button>
      <button onClick={()=>arranger.stop()} style={{marginLeft:8}}>Stop Arranger</button>
      <button onClick={()=>midi.panic()} style={{marginLeft:8,background:"#7f1d1d",color:"white"}}>Panic</button>
      <button onClick={()=>setLive(!live)} style={{marginLeft:8}}>Live Mode</button>
    </>;
  }

  if(live){
    return <div style={{minHeight:"100vh",background:"#020617",color:"white",fontFamily:"Arial",padding:24}}>
      <h1>UAOS LIVE STAGE</h1>
      <h2>{state.section} | {state.chord} | BPM {state.bpm}</h2>
      {controls()}
      <h2>Sections</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {SECTIONS.map(s=><button key={s} onClick={()=>arranger.setSection(s)} style={{fontSize:28,padding:28}}>{s}</button>)}
      </div>
      <h2>Chord Pads</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {CHORDS.map(c=><button key={c} onClick={()=>arranger.setChord(c)} style={{fontSize:34,padding:34}}>{c}</button>)}
      </div>
    </div>;
  }

  return <div style={{minHeight:"100vh",background:"#070b14",color:"white",fontFamily:"Arial",padding:24}}>
    <h1>UAOS Final Foundation Workstation</h1>
    <p>Audio intelligence, MIDI, arranger, live stage, scenes, pattern memory, exports, and safe deploy pipeline.</p>
    <h3>Status: {status}</h3>

    {controls()}

    <div style={{marginTop:12}}>
      <button onClick={()=>arranger.learnPattern()}>Learn Pattern</button>
      <button onClick={()=>arranger.saveScene()} style={{marginLeft:8}}>Save Scene</button>
      <button onClick={()=>uaosTimeline.clear()} style={{marginLeft:8}}>Clear Timeline</button>
      <button onClick={()=>downloadText("uaos-style.json",arranger.exportStyle())} style={{marginLeft:8}}>Export Style</button>
      <button onClick={()=>downloadText("uaos-timeline.json",uaosTimeline.exportJson())} style={{marginLeft:8}}>Export Timeline</button>
      <button onClick={()=>downloadMidi("uaos-export.mid",makeMidi(uaosTimeline.load(),state.bpm))} style={{marginLeft:8}}>Export MIDI</button>
    </div>

    <h2>Audio Intelligence</h2>
    <p>Level: {audioState.level||0} | Pitch: {audioState.pitchHz||"-"} | Note: {audioState.note?.label||"-"} | Chord: {audioState.chord?.chord||"-"} | BPM: {audioState.bpm||state.bpm}</p>
    <progress value={audioState.level||0} max="255" style={{width:"100%"}} />

    <h2>MIDI</h2>
    <select onChange={e=>midi.setOutput(e.target.value)}>
      <option value="">Auto Output</option>
      {midiInfo.outputs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
    <pre style={{background:"#111827",padding:12,borderRadius:8}}>{JSON.stringify(midiInfo,null,2)}</pre>

    <h2>Arranger</h2>
    <p>Section: {state.section} | Chord: {state.chord} | BPM: {state.bpm} | Pattern: {state.patternKey} | Running: {String(state.running)}</p>

    <div>{SECTIONS.map(s=><button key={s} onClick={()=>arranger.setSection(s)} style={{margin:4}}>{s}</button>)}</div>
    <div>{CHORDS.map(c=><button key={c} onClick={()=>arranger.setChord(c)} style={{margin:4}}>{c}</button>)}</div>

    <h2>Scenes</h2>
    <div>{state.scenes.map(s=><button key={s.id} onClick={()=>arranger.recallScene(s.id)} style={{margin:4}}>{s.section} {s.chord} {s.bpm}</button>)}</div>

    <h2>Timeline</h2>
    <ul>{events.map(e=><li key={e.id}><b>{e.type}</b> â€” {JSON.stringify(e.payload)}</li>)}</ul>
  </div>;
}
