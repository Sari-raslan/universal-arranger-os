import React,{useEffect,useState}from"react";
import{createRoot}from"react-dom/client";

const btn={padding:"12px 16px",borderRadius:12,border:"1px solid #334155",background:"#1f2937",color:"white",cursor:"pointer",fontWeight:700};
const green={...btn,background:"#16a34a"};
const blue={...btn,background:"#2563eb"};
const yellow={...btn,background:"#ca8a04"};
const red={...btn,background:"#dc2626"};
const card={background:"#111827",border:"1px solid #334155",borderRadius:22,padding:22};

function App(){
  const[status,setStatus]=useState(null);
  const[tempo,setTempo]=useState(96);
  const[key,setKey]=useState("C");
  const[scale,setScale]=useState("Nahawand");
  const[playing,setPlaying]=useState(false);
  const[currentSection,setCurrentSection]=useState("Stop");
  const[notes,setNotes]=useState("60,64,67");
  const[chord,setChord]=useState("C Major");
  const[mixer,setMixer]=useState([
    ["Drums",82],["Bass",76],["Chords",70],["Pad",62],["Lead",74],["FX",45]
  ]);
  const[sampler,setSampler]=useState([
    ["Oriental Strings","legato",88],
    ["Oud","normal",76],
    ["Qanun","tremolo",68],
    ["Nay","breath",72]
  ]);

  function refresh(){
    fetch("http://localhost:8090/api/status").then(r=>r.json()).then(setStatus).catch(()=>setStatus({ok:false,note:"Backend not connected, UI running standalone"}));
  }

  useEffect(()=>{refresh()},[]);

  async function readChord(){
    const arr=notes.split(",").map(x=>Number(x.trim())).filter(x=>!Number.isNaN(x));
    try{
      const r=await fetch("http://localhost:8090/api/chord/read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes:arr})});
      const j=await r.json();
      setChord(j.chord||"Unknown");
    }catch{
      setChord("Offline chord test");
    }
  }

  async function arranger(section){
    setCurrentSection(section);
    try{
      await fetch("http://localhost:8090/api/arranger/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({section,tempo,key,scale})});
    }catch{}
  }

  function updateMixer(i,v){
    const next=[...mixer];
    next[i]=[next[i][0],Number(v)];
    setMixer(next);
  }

  return <main style={{minHeight:"100vh",background:"#050816",color:"white",fontFamily:"Arial",padding:24}}>
    <section style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:18}}>
      <div>
        <h1 style={{fontSize:42,margin:"0 0 6px"}}>UAOS HyperStation</h1>
        <div style={{color:"#93c5fd",fontWeight:700}}>App UI v1 · Arranger / MIDI / Sampler / DAW</div>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button style={playing?red:green} onClick={()=>setPlaying(!playing)}>{playing?"STOP":"PLAY"}</button>
        <button style={blue}>REC</button>
        <button style={yellow} onClick={refresh}>SYNC</button>
      </div>
    </section>

    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:18}}>
      <div style={card}><b>Tempo</b><h2>{tempo} BPM</h2><input type="range" min="60" max="180" value={tempo} onChange={e=>setTempo(e.target.value)} style={{width:"100%"}}/></div>
      <div style={card}><b>Key</b><h2>{key}</h2><select value={key} onChange={e=>setKey(e.target.value)} style={{width:"100%",padding:10,borderRadius:10}}>{["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].map(x=><option key={x}>{x}</option>)}</select></div>
      <div style={card}><b>Scale / Maqam</b><h2>{scale}</h2><select value={scale} onChange={e=>setScale(e.target.value)} style={{width:"100%",padding:10,borderRadius:10}}>{["Major","Minor","Nahawand","Hijaz","Bayati","Kurd","Rast","Saba"].map(x=><option key={x}>{x}</option>)}</select></div>
      <div style={card}><b>Current Section</b><h2 style={{color:"#86efac"}}>{currentSection}</h2></div>
    </section>

    <section style={{display:"grid",gridTemplateColumns:"1.2fr .8fr",gap:18,marginBottom:18}}>
      <div style={card}>
        <h2>Arranger Controls</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10}}>
          {["Intro 1","Intro 2","Main A","Main B","Main C","Main D","Fill A","Fill B","Break","Ending 1","Ending 2"].map(x=>
            <button key={x} style={x===currentSection?green:btn} onClick={()=>arranger(x)}>{x}</button>
          )}
        </div>
      </div>

      <div style={card}>
        <h2>Chord Reader</h2>
        <input value={notes} onChange={e=>setNotes(e.target.value)} style={{width:"100%",padding:12,borderRadius:12,border:0,marginBottom:10}}/>
        <button style={blue} onClick={readChord}>Read Chord</button>
        <h1 style={{color:"#86efac"}}>{chord}</h1>
      </div>
    </section>

    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18,marginBottom:18}}>
      <div style={card}>
        <h2>Mixer</h2>
        {mixer.map((ch,i)=><div key={ch[0]} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><b>{ch[0]}</b><span>{ch[1]}%</span></div>
          <input type="range" min="0" max="100" value={ch[1]} onChange={e=>updateMixer(i,e.target.value)} style={{width:"100%"}}/>
        </div>)}
      </div>

      <div style={card}>
        <h2>Sampler Slots</h2>
        {sampler.map((s,i)=><div key={i} style={{background:"#020617",border:"1px solid #1e293b",borderRadius:14,padding:14,marginBottom:10}}>
          <b>{s[0]}</b>
          <div style={{color:"#93c5fd"}}>Articulation: {s[1]}</div>
          <div>Velocity layer: {s[2]}</div>
        </div>)}
      </div>

      <div style={card}>
        <h2>Export Center</h2>
        <button style={btn}>Export MIDI</button>{" "}
        <button style={btn}>Cubase Project</button>{" "}
        <button style={btn}>Style Package</button>
        <p style={{color:"#d1d5db"}}>Next: real MIDI writer, Cubase template, stems export.</p>
      </div>
    </section>

    <section style={card}>
      <h2>Runtime / Backend</h2>
      <pre style={{background:"#020617",borderRadius:14,padding:16,overflow:"auto"}}>{JSON.stringify(status,null,2)}</pre>
    </section>
  </main>
}

createRoot(document.getElementById("root")).render(<App/>);
