const express=require("express");
const cors=require("cors");
const app=express();
const PORT=process.env.PORT||8090;

app.use(cors());
app.use(express.json({limit:"20mb"}));

const state={
app:"UAOS HyperStation",
phase:"V1 stable foundation / V2 engine build",
modules:{
frontend:"ready",
backend:"ready",
midi:"foundation",
chordEngine:"foundation",
arranger:"foundation",
sampler:"foundation",
hardware:"foundation",
dawExport:"planned",
voiceToMidi:"planned",
agents:"planned"
},
arrangerSections:["Intro 1","Intro 2","Main A","Main B","Main C","Main D","Fill A","Fill B","Break","Ending 1","Ending 2"],
tasks:[
"Build real USB MIDI bridge",
"Detect chords from MIDI notes",
"Create arranger state machine",
"Add Cubase MIDI export",
"Add sampler articulation engine",
"Add voice-to-MIDI worker",
"Add Linear/Codex/GitHub agent monitor"
]
};

function detectChord(notes){
if(!Array.isArray(notes)||notes.length===0)return "No chord";
const pcs=[...new Set(notes.map(n=>Number(n)%12))].sort((a,b)=>a-b);
const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
for(const root of pcs){
const rel=pcs.map(x=>(x-root+12)%12);
if(rel.includes(0)&&rel.includes(4)&&rel.includes(7))return names[root]+" Major";
if(rel.includes(0)&&rel.includes(3)&&rel.includes(7))return names[root]+" Minor";
if(rel.includes(0)&&rel.includes(3)&&rel.includes(6))return names[root]+" Dim";
if(rel.includes(0)&&rel.includes(4)&&rel.includes(8))return names[root]+" Aug";
if(rel.includes(0)&&rel.includes(5)&&rel.includes(7))return names[root]+" Sus4";
}
return "Unknown chord";
}

app.get("/",(*,res)=>res.json({ok:true,...state}));
app.get("/health",(*,res)=>res.json({ok:true,time:new Date().toISOString()}));
app.get("/api/status",(*,res)=>res.json({ok:true,state}));
app.get("/api/midi/devices",(*,res)=>res.json({ok:true,note:"Real MIDI needs native/WebMIDI bridge",devices:[]}));
app.post("/api/chord/read",(req,res)=>res.json({ok:true,notes:req.body.notes||[],chord:detectChord(req.body.notes||[])}));
app.post("/api/arranger/event",(req,res)=>res.json({ok:true,event:req.body,state:"accepted",sections:state.arrangerSections}));
app.get("/api/sampler/status",(*,res)=>res.json({ok:true,engine:"foundation",rule:"Use original or licensed samples only"}));
app.get("/api/agents/status",(*,res)=>res.json({ok:true,leader:"Linear",helpers:["GitHub","Codex","VS Code","Vercel"],mode:"planned"}));

app.listen(PORT,()=>console.log("UAOS backend running on [http://localhost:"+PORT](http://localhost:%22+PORT)));
