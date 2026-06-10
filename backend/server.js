const express=require("express");
const cors=require("cors");
const app=express();
const PORT=process.env.PORT||8090;

app.use(cors());
app.use(express.json({limit:"20mb"}));

function detectChord(notes=[]){
  const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const pcs=[...new Set(notes.map(n=>Number(n)%12))].sort((a,b)=>a-b);
  for(const r of pcs){
    const x=pcs.map(n=>(n-r+12)%12);
    if(x.includes(0)&&x.includes(4)&&x.includes(7))return names[r]+" Major";
    if(x.includes(0)&&x.includes(3)&&x.includes(7))return names[r]+" Minor";
    if(x.includes(0)&&x.includes(3)&&x.includes(6))return names[r]+" Dim";
    if(x.includes(0)&&x.includes(5)&&x.includes(7))return names[r]+" Sus4";
  }
  return "Unknown";
}

const runtime={
  app:"UAOS HyperStation",
  phase:"Linear Agent Commander Runtime",
  modules:{
    frontend:"clean-live",
    backend:"connected",
    midi:"api-ready",
    chordEngine:"api-ready",
    arranger:"api-ready",
    sampler:"foundation",
    agents:"linear-commander"
  },
  midiDevices:[],
  arranger:{
    current:"Stop",
    sections:["Intro","Main A","Main B","Main C","Main D","Fill","Break","Ending"]
  },
  sampler:{
    status:"foundation",
    articulations:["normal","legato","staccato","slide"],
    rule:"original or licensed samples only"
  },
  agents:{
    leader:"Linear",
    helpers:["Codex","VS Code","GitHub","Vercel"],
    mode:"task-to-code"
  }
};

app.get("/",(_,res)=>res.json({ok:true,runtime}));
app.get("/health",(_,res)=>res.json({ok:true,time:new Date().toISOString()}));
app.get("/api/status",(_,res)=>res.json({ok:true,state:runtime}));

app.get("/api/midi/devices",(_,res)=>{
  res.json({ok:true,devices:runtime.midiDevices,note:"Native USB/WebMIDI bridge next"});
});

app.post("/api/midi/mock-device",(req,res)=>{
  const device=req.body||{};
  runtime.midiDevices.push({
    id:device.id||("dev-"+Date.now()),
    name:device.name||"Mock MIDI Keyboard",
    type:device.type||"input"
  });
  res.json({ok:true,devices:runtime.midiDevices});
});

app.post("/api/chord/read",(req,res)=>{
  const notes=req.body.notes||[];
  res.json({ok:true,notes,chord:detectChord(notes)});
});

app.post("/api/arranger/event",(req,res)=>{
  const section=req.body.section||"Stop";
  runtime.arranger.current=section;
  res.json({ok:true,arranger:runtime.arranger,event:req.body});
});

app.get("/api/sampler/status",(_,res)=>res.json({ok:true,sampler:runtime.sampler}));
app.get("/api/agents/status",(_,res)=>res.json({ok:true,agents:runtime.agents}));

app.listen(PORT,()=>console.log("UAOS backend running on http://localhost:"+PORT));
