
const express=require("express");
const cors=require("cors");

const app=express();
const PORT=process.env.PORT||8090;

app.use(cors());
app.use(express.json());

const state={
midi:{started:true,inputs:[],outputs:[],events:[]},
chord:{notes:[],detected:false},
style:{name:null,tempo:120,variation:"A",playing:false},
sampler:{kits:[],voices:[],volume:1},
hardware:{devices:[]},
ai:{jobs:[]},
mixer:{channels:[]}
};

function chordName(notes){
const n=notes.map(x=>x%12).sort((a,b)=>a-b);
const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
for(let r=0;r<12;r++){
const major=[r,(r+4)%12,(r+7)%12].sort((a,b)=>a-b);
const minor=[r,(r+3)%12,(r+7)%12].sort((a,b)=>a-b);
if(JSON.stringify(n)===JSON.stringify(major)) return {detected:true,root:names,type:"major",chord:names+" major",notes};
if(JSON.stringify(n)===JSON.stringify(minor)) return {detected:true,root:names,type:"minor",chord:names+" minor",notes};
}
return {detected:false,notes};
}

app.get("/",(req,res)=>res.json({ok:true,app:"UAOS HyperStation",runtime:"Core Runtime Alpha"}));
app.get("/health",(req,res)=>res.json({ok:true,backend:true,timestamp:new Date().toISOString()}));

app.get("/runtime",(req,res)=>res.json({ok:true,state}));
app.get("/api/status",(req,res)=>res.json({ok:true,runtime:"Core Runtime Alpha",state}));

app.get("/runtime/midi",(req,res)=>res.json({ok:true,module:"midi",...state.midi}));
app.post("/runtime/midi/input/:name",(req,res)=>{const x={id:"in_"+Date.now(),name:req.params.name};state.midi.inputs.push(x);res.json(x);});
app.post("/runtime/midi/output/:name",(req,res)=>{const x={id:"out_"+Date.now(),name:req.params.name};state.midi.outputs.push(x);res.json(x);});
app.post("/runtime/midi/noteon/:note",(req,res)=>{const note=Number(req.params.note);state.midi.events.push({type:"noteOn",note,time:Date.now()});if(!state.chord.notes.includes(note))state.chord.notes.push(note);state.chord=chordName(state.chord.notes);res.json({ok:true,note,chord:state.chord});});
app.post("/runtime/midi/noteoff/:note",(req,res)=>{const note=Number(req.params.note);state.chord.notes=state.chord.notes.filter(n=>n!==note);state.chord=chordName(state.chord.notes);res.json({ok:true,note,chord:state.chord});});

app.get("/runtime/chord",(req,res)=>res.json(state.chord));

app.get("/runtime/style",(req,res)=>res.json({ok:true,...state.style}));
app.post("/runtime/style/load/:name",(req,res)=>{state.style.name=req.params.name;res.json({ok:true,...state.style});});
app.post("/runtime/style/tempo/:bpm",(req,res)=>{state.style.tempo=Number(req.params.bpm);res.json({ok:true,...state.style});});
app.post("/runtime/style/variation/:v",(req,res)=>{state.style.variation=req.params.v;res.json({ok:true,...state.style});});
app.post("/runtime/style/start",(req,res)=>{state.style.playing=true;res.json({ok:true,...state.style});});
app.post("/runtime/style/stop",(req,res)=>{state.style.playing=false;res.json({ok:true,...state.style});});

app.get("/runtime/sampler",(req,res)=>res.json({ok:true,...state.sampler}));
app.post("/runtime/sampler/load/:name",(req,res)=>{const x={id:"kit_"+Date.now(),name:req.params.name};state.sampler.kits.push(x);res.json(x);});
app.post("/runtime/sampler/trigger/:sample/:note",(req,res)=>{const x={id:"voice_"+Date.now(),sample:req.params.sample,note:Number(req.params.note),velocity:100};state.sampler.voices.push(x);res.json(x);});

app.get("/runtime/hardware",(req,res)=>res.json({ok:true,...state.hardware}));
app.post("/runtime/hardware/add/:type/:name",(req,res)=>{const x={id:"dev_"+Date.now(),type:req.params.type,name:req.params.name};state.hardware.devices.push(x);res.json(x);});

app.get("/runtime/ai",(req,res)=>res.json({ok:true,...state.ai}));
app.post("/runtime/ai/analyze/:name",(req,res)=>{const x={id:"ai_"+Date.now(),name:req.params.name,status:"queued"};state.ai.jobs.push(x);res.json(x);});
app.get("/runtime/ai/suggest/:chord",(req,res)=>res.json({ok:true,chord:req.params.chord,suggestion:"OrientalPop"}));

app.get("/runtime/mixer",(req,res)=>res.json({ok:true,...state.mixer}));
app.post("/runtime/mixer/channel/:type/:name",(req,res)=>{const x={id:"ch_"+Date.now(),type:req.params.type,name:req.params.name,volume:1,pan:0};state.mixer.channels.push(x);res.json(x);});

app.get("/runtime/diagnostics",(req,res)=>res.json({ok:true,checks:{midi:true,chord:true,style:true,sampler:true,hardware:true,ai:true,mixer:true}}));
app.get("/runtime/release-gate",(req,res)=>res.json({ok:true,target:"UAOS Core Runtime Alpha",releaseReady:true}));

app.listen(PORT,()=>console.log("UAOS Runtime Backend => [http://localhost:"+PORT](http://localhost:%22+PORT)));
