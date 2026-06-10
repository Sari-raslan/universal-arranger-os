import React,{useEffect,useState}from"react";
import{createRoot}from"react-dom/client";
import"./style.css";

function App(){
const[status,setStatus]=useState(null);
const[notes,setNotes]=useState("60,64,67");
const[chord,setChord]=useState("");
useEffect(()=>{
fetch("http://localhost:8090/api/status").then(r=>r.json()).then(setStatus).catch(()=>setStatus({ok:true,state:{phase:"Public UI ready. Start backend for live runtime."}}))
},[]);
async function readChord(){
const arr=notes.split(",").map(x=>Number(x.trim())).filter(x=>!Number.isNaN(x));
const r=await fetch("http://localhost:8090/api/chord/read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes:arr})});
const j=await r.json();
setChord(j.chord);
}
const s=status?.state||{};
const modules=s.modules||{};
return <main className="app"> <section className="hero"> <h1>UAOS HyperStation</h1> <h2>{s.phase||"Runtime Dashboard"}</h2> <p>Universal Arranger OS: MIDI, Chords, Arranger, Sampler, Hardware, DAW and AI Music command center.</p> </section> <section className="grid">
{Object.entries(modules).map(([k,v])=><div className="card" key={k}><b>{k}</b><span>{String(v)}</span></div>)} </section> <section className="panel"> <h3>Chord Reader Test</h3>
<input value={notes} onChange={e=>setNotes(e.target.value)} /> <button onClick={readChord}>Read Chord</button> <strong>{chord}</strong> </section> <section className="panel"> <h3>Remaining Master Tasks</h3> <ol>{(s.tasks||[]).map(x=><li key={x}>{x}</li>)}</ol> <pre>{JSON.stringify(status,null,2)}</pre> </section>

  </main>
}

createRoot(document.getElementById("root")).render(<App/>);
