import React,{useEffect,useState}from"react";
import{createRoot}from"react-dom/client";

function Box({children}){return <section style={{background:"#111827",border:"1px solid #334155",borderRadius:22,padding:24,marginBottom:18}}>{children}</section>}

function App(){
  const[status,setStatus]=useState(null);
  const[notes,setNotes]=useState("60,64,67");
  const[chord,setChord]=useState("");
  const[arranger,setArranger]=useState("");
  const[device,setDevice]=useState("");

  function refresh(){
    fetch("http://localhost:8090/api/status")
      .then(r=>r.json())
      .then(setStatus)
      .catch(()=>setStatus({ok:false,error:"Backend not connected"}));
  }

  useEffect(()=>{refresh()},[]);

  async function readChord(){
    const arr=notes.split(",").map(x=>Number(x.trim())).filter(x=>!Number.isNaN(x));
    const r=await fetch("http://localhost:8090/api/chord/read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes:arr})});
    const j=await r.json();
    setChord(j.chord);
  }

  async function sendArranger(section){
    const r=await fetch("http://localhost:8090/api/arranger/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({section})});
    const j=await r.json();
    setArranger(j.arranger.current);
    refresh();
  }

  async function addMockDevice(){
    const r=await fetch("http://localhost:8090/api/midi/mock-device",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"UAOS Test Keyboard"})});
    const j=await r.json();
    setDevice(JSON.stringify(j.devices,null,2));
    refresh();
  }

  const s=status?.state||{};
  const modules=s.modules||{};
  const sections=s.arranger?.sections||[];

  return <main style={{minHeight:"100vh",background:"#050816",color:"white",fontFamily:"Arial",padding:34}}>
    <Box>
      <h1 style={{fontSize:50,margin:0}}>UAOS HyperStation</h1>
      <h2 style={{color:"#93c5fd"}}>{s.phase||"Runtime"}</h2>
      <p>Linear Agent Commander connected to Backend APIs.</p>
      <button onClick={refresh} style={{padding:"12px 18px",borderRadius:10,border:0}}>Refresh</button>
    </Box>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14}}>
      {Object.entries(modules).map(([k,v])=><Box key={k}><b>{k}</b><br/><span style={{color:"#bfdbfe"}}>{String(v)}</span></Box>)}
    </div>

    <Box>
      <h3>MIDI Runtime</h3>
      <button onClick={addMockDevice} style={{padding:"12px 18px",borderRadius:10,border:0}}>Add Mock MIDI Device</button>
      <pre style={{background:"#020617",padding:16,borderRadius:12}}>{device}</pre>
    </Box>

    <Box>
      <h3>Chord Engine</h3>
      <input value={notes} onChange={e=>setNotes(e.target.value)} style={{padding:12,borderRadius:10,border:0,width:260}}/>
      <button onClick={readChord} style={{padding:"12px 18px",borderRadius:10,border:0,marginLeft:10}}>Read Chord</button>
      <b style={{marginLeft:16,color:"#86efac"}}>{chord}</b>
    </Box>

    <Box>
      <h3>Arranger Engine</h3>
      <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
        {sections.map(x=><button key={x} onClick={()=>sendArranger(x)} style={{padding:"12px 16px",borderRadius:10,border:0}}>{x}</button>)}
      </div>
      <h2 style={{color:"#86efac"}}>{arranger||s.arranger?.current}</h2>
    </Box>

    <Box>
      <h3>Runtime JSON</h3>
      <pre style={{background:"#020617",padding:18,borderRadius:14,overflow:"auto"}}>{JSON.stringify(status,null,2)}</pre>
    </Box>
  </main>
}

createRoot(document.getElementById("root")).render(<App/>);
