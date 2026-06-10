import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";

const card={background:"#111827",border:"1px solid #334155",borderRadius:22,padding:22};
const btn={padding:"11px 15px",borderRadius:12,border:"1px solid #334155",background:"#1f2937",color:"white",fontWeight:800,cursor:"pointer"};
const blue={...btn,background:"#2563eb"};
const green={...btn,background:"#16a34a"};
const red={...btn,background:"#dc2626"};
const yellow={...btn,background:"#ca8a04"};

const noteNames=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function detectChord(notes){
  const pcs=[...new Set(notes.map(n=>Number(n)%12))].sort((a,b)=>a-b);
  for(const r of pcs){
    const x=pcs.map(n=>(n-r+12)%12);
    if(x.includes(0)&&x.includes(4)&&x.includes(7))return noteNames[r]+" Major";
    if(x.includes(0)&&x.includes(3)&&x.includes(7))return noteNames[r]+" Minor";
    if(x.includes(0)&&x.includes(3)&&x.includes(6))return noteNames[r]+" Dim";
    if(x.includes(0)&&x.includes(5)&&x.includes(7))return noteNames[r]+" Sus4";
  }
  return notes.length?"Unknown":"No chord";
}

function App(){
  const[status,setStatus]=useState(null);
  const[tempo,setTempo]=useState(96);
  const[key,setKey]=useState("C");
  const[scale,setScale]=useState("Nahawand");
  const[playing,setPlaying]=useState(false);
  const[section,setSection]=useState("Stop");
  const[midiLog,setMidiLog]=useState([]);
  const[activeNotes,setActiveNotes]=useState([60,64,67]);
  const[chord,setChord]=useState("C Major");
  const[midiAccess,setMidiAccess]=useState("not-connected");
  const[mixer,setMixer]=useState([
    {name:"Drums",vol:82,pan:0,mute:false},
    {name:"Bass",vol:76,pan:-10,mute:false},
    {name:"Chords",vol:70,pan:8,mute:false},
    {name:"Pad",vol:62,pan:0,mute:false},
    {name:"Lead",vol:74,pan:15,mute:false},
    {name:"FX",vol:45,pan:0,mute:false}
  ]);
  const[sampler,setSampler]=useState([
    {slot:1,name:"Oriental Strings",art:"legato",vel:88},
    {slot:2,name:"Oud",art:"normal",vel:76},
    {slot:3,name:"Qanun",art:"tremolo",vel:68},
    {slot:4,name:"Nay",art:"breath",vel:72}
  ]);

  const piano=useMemo(()=>Array.from({length:37},(_,i)=>48+i),[]);

  useEffect(()=>{refresh();loadProject();},[]);

  function refresh(){
    fetch("http://localhost:8090/api/status").then(r=>r.json()).then(setStatus).catch(()=>setStatus({ok:false,note:"Backend not connected. UI running standalone."}));
  }

  function logMidi(type,note,velocity=100,source="UI"){
    const row={time:new Date().toLocaleTimeString(),type,note,velocity,source};
    setMidiLog(x=>[row,...x].slice(0,24));
  }

  async function connectMidi(){
    if(!navigator.requestMIDIAccess){
      setMidiAccess("WebMIDI not supported in this browser");
      return;
    }
    try{
      const access=await navigator.requestMIDIAccess();
      setMidiAccess("connected");
      for(const input of access.inputs.values()){
        input.onmidimessage=(msg)=>{
          const [cmd,note,vel]=msg.data;
          const type=(cmd&0xf0)===144&&vel>0?"note-on":"note-off";
          logMidi(type,note,vel,input.name||"MIDI");
          setActiveNotes(old=>{
            const s=new Set(old);
            if(type==="note-on")s.add(note);else s.delete(note);
            const arr=[...s].sort((a,b)=>a-b);
            setChord(detectChord(arr));
            return arr;
          });
        };
      }
    }catch(e){
      setMidiAccess("failed: "+e.message);
    }
  }

  function pressNote(n){
    const next=activeNotes.includes(n)?activeNotes.filter(x=>x!==n):[...activeNotes,n].sort((a,b)=>a-b);
    setActiveNotes(next);
    setChord(detectChord(next));
    logMidi(activeNotes.includes(n)?"note-off":"note-on",n,100,"Piano Roll");
  }

  async function triggerSection(x){
    setSection(x);
    try{
      await fetch("http://localhost:8090/api/arranger/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({section:x,tempo,key,scale})});
    }catch{}
  }

  function updateMixer(i,field,value){
    const next=[...mixer];
    next[i]={...next[i],[field]:value};
    setMixer(next);
  }

  function saveProject(){
    const project={tempo,key,scale,section,mixer,sampler,activeNotes,chord,savedAt:new Date().toISOString()};
    localStorage.setItem("uaos-project-v1",JSON.stringify(project));
    alert("UAOS project saved locally");
  }

  function loadProject(){
    const raw=localStorage.getItem("uaos-project-v1");
    if(!raw)return;
    try{
      const p=JSON.parse(raw);
      setTempo(p.tempo||96);setKey(p.key||"C");setScale(p.scale||"Nahawand");setSection(p.section||"Stop");
      setMixer(p.mixer||mixer);setSampler(p.sampler||sampler);setActiveNotes(p.activeNotes||[60,64,67]);setChord(p.chord||"C Major");
    }catch{}
  }

  function exportProject(){
    const project={tempo,key,scale,section,mixer,sampler,activeNotes,chord,midiLog};
    const blob=new Blob([JSON.stringify(project,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="uaos-project.json";a.click();
    URL.revokeObjectURL(url);
  }

  return <main style={{minHeight:"100vh",background:"#050816",color:"white",fontFamily:"Arial",padding:24}}>
    <section style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:18}}>
      <div>
        <h1 style={{fontSize:42,margin:"0 0 6px"}}>UAOS HyperStation</h1>
        <div style={{color:"#93c5fd",fontWeight:800}}>Runtime Workstation v2 · MIDI Monitor · Piano Roll · Project Save</div>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button style={playing?red:green} onClick={()=>setPlaying(!playing)}>{playing?"STOP":"PLAY"}</button>
        <button style={blue} onClick={connectMidi}>Connect MIDI</button>
        <button style={yellow} onClick={saveProject}>Save</button>
        <button style={btn} onClick={loadProject}>Load</button>
        <button style={btn} onClick={exportProject}>Export JSON</button>
      </div>
    </section>

    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:18}}>
      <div style={card}><b>Tempo</b><h2>{tempo} BPM</h2><input type="range" min="60" max="180" value={tempo} onChange={e=>setTempo(Number(e.target.value))} style={{width:"100%"}}/></div>
      <div style={card}><b>Key</b><h2>{key}</h2><select value={key} onChange={e=>setKey(e.target.value)} style={{width:"100%",padding:10,borderRadius:10}}>{noteNames.map(x=><option key={x}>{x}</option>)}</select></div>
      <div style={card}><b>Scale / Maqam</b><h2>{scale}</h2><select value={scale} onChange={e=>setScale(e.target.value)} style={{width:"100%",padding:10,borderRadius:10}}>{["Major","Minor","Nahawand","Hijaz","Bayati","Kurd","Rast","Saba"].map(x=><option key={x}>{x}</option>)}</select></div>
      <div style={card}><b>MIDI</b><h2 style={{color:"#86efac"}}>{midiAccess}</h2></div>
    </section>

    <section style={{display:"grid",gridTemplateColumns:"1.25fr .75fr",gap:18,marginBottom:18}}>
      <div style={card}>
        <h2>Arranger Engine</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10}}>
          {["Intro 1","Intro 2","Main A","Main B","Main C","Main D","Fill A","Fill B","Break","Ending 1","Ending 2"].map(x=>
            <button key={x} style={x===section?green:btn} onClick={()=>triggerSection(x)}>{x}</button>
          )}
        </div>
        <h2 style={{color:"#86efac"}}>{section}</h2>
      </div>

      <div style={card}>
        <h2>Chord Reader</h2>
        <div style={{fontSize:44,color:"#86efac",fontWeight:900}}>{chord}</div>
        <div style={{color:"#cbd5e1"}}>Notes: {activeNotes.join(", ")||"none"}</div>
      </div>
    </section>

    <section style={card}>
      <h2>Piano Roll / MIDI Input</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(37,1fr)",gap:3}}>
        {piano.map(n=>{
          const black=[1,3,6,8,10].includes(n%12);
          const on=activeNotes.includes(n);
          return <button key={n} onClick={()=>pressNote(n)} title={n}
            style={{height:black?70:100,background:on?"#22c55e":black?"#020617":"#e5e7eb",color:black||on?"white":"#111827",border:"1px solid #334155",borderRadius:8,fontSize:10}}>
            {noteNames[n%12]}<br/>{n}
          </button>
        })}
      </div>
    </section>

    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18,marginTop:18}}>
      <div style={card}>
        <h2>Mixer</h2>
        {mixer.map((ch,i)=><div key={ch.name} style={{marginBottom:14,opacity:ch.mute?.55:1}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><b>{ch.name}</b><span>{ch.vol}% Pan {ch.pan}</span></div>
          <input type="range" min="0" max="100" value={ch.vol} onChange={e=>updateMixer(i,"vol",Number(e.target.value))} style={{width:"100%"}}/>
          <input type="range" min="-50" max="50" value={ch.pan} onChange={e=>updateMixer(i,"pan",Number(e.target.value))} style={{width:"100%"}}/>
          <button style={btn} onClick={()=>updateMixer(i,"mute",!ch.mute)}>{ch.mute?"Unmute":"Mute"}</button>
        </div>)}
      </div>

      <div style={card}>
        <h2>Sampler Rack</h2>
        {sampler.map((s,i)=><div key={s.slot} style={{background:"#020617",border:"1px solid #1e293b",borderRadius:14,padding:14,marginBottom:10}}>
          <b>Slot {s.slot}: {s.name}</b>
          <div style={{color:"#93c5fd"}}>Articulation: {s.art}</div>
          <div>Velocity Layer: {s.vel}</div>
        </div>)}
      </div>

      <div style={card}>
        <h2>MIDI Monitor</h2>
        <div style={{maxHeight:360,overflow:"auto"}}>
          {midiLog.map((m,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"80px 80px 60px 70px 1fr",gap:8,borderBottom:"1px solid #1f2937",padding:"6px 0"}}>
            <span>{m.time}</span><b>{m.type}</b><span>{m.note}</span><span>{m.velocity}</span><span>{m.source}</span>
          </div>)}
        </div>
      </div>
    </section>

    <section style={{...card,marginTop:18}}>
      <h2>Backend Runtime</h2>
      <pre style={{background:"#020617",borderRadius:14,padding:16,overflow:"auto"}}>{JSON.stringify(status,null,2)}</pre>
    </section>
  </main>
}

createRoot(document.getElementById("root")).render(<App/>);
