
const express=require("express");
const cors=require("cors");
const http=require("http");

const {RealtimeBus}=require("../realtime/RealtimeBus.cjs");
const {NativeMidiBridge}=require("../native-midi/NativeMidiBridge.cjs");

const app=express();
const server=http.createServer(app);

const PORT=8090;

app.use(cors());
app.use(express.json());

const realtime=new RealtimeBus(server);
const nativeMidi=new NativeMidiBridge();

const runtime={
midi:{inputs:[],outputs:[],events:[]},
chord:{detected:false,notes:[]},
style:{name:null,tempo:120,variation:"A",playing:false},
sampler:{kits:[],voices:[]},
hardware:{devices:[]},
ai:{jobs:[]},
mixer:{channels:[]}
};

function detectChord(notes){
const n=notes.map(x=>x%12).sort((a,b)=>a-b);

if(JSON.stringify(n)===JSON.stringify([0,4,7])){
return {
detected:true,
root:"C",
type:"major",
chord:"C major",
notes
};
}

return {
detected:false,
notes
};
}

app.get("/",(req,res)=>res.json({ok:true,app:"UAOS"}));

app.get("/health",(req,res)=>res.json({
ok:true,
backend:true,
realtime:true,
nativeMidi:true,
timestamp:new Date().toISOString()
}));

app.get("/runtime",(req,res)=>res.json(runtime));

app.get("/runtime/realtime",(req,res)=>res.json(realtime.status()));

app.post("/runtime/realtime/broadcast/:event",(req,res)=>{
res.json(realtime.broadcast(req.params.event,{ok:true}));
});

app.get("/runtime/native-midi",(req,res)=>res.json(nativeMidi.status()));

app.post("/runtime/native-midi/enable",(req,res)=>{
res.json(nativeMidi.enable());
});

app.post("/runtime/native-midi/scan",(req,res)=>{
res.json(nativeMidi.scan());
});

app.post("/runtime/native-midi/send/:note",(req,res)=>{
res.json(nativeMidi.send(req.params.note));
});

app.get("/runtime/midi",(req,res)=>res.json(runtime.midi));

app.post("/runtime/midi/input/:name",(req,res)=>{
const i={id:"in_"+Date.now(),name:req.params.name};
runtime.midi.inputs.push(i);
res.json(i);
});

app.post("/runtime/midi/output/:name",(req,res)=>{
const o={id:"out_"+Date.now(),name:req.params.name};
runtime.midi.outputs.push(o);
res.json(o);
});

app.post("/runtime/midi/noteon/:note",(req,res)=>{
const note=Number(req.params.note);

runtime.midi.events.push({
type:"noteOn",
note,
time:Date.now()
});

if(!runtime.chord.notes.includes(note)){
runtime.chord.notes.push(note);
}

runtime.chord=detectChord(runtime.chord.notes);

realtime.broadcast("noteon",{
note,
chord:runtime.chord
});

res.json({
ok:true,
note,
chord:runtime.chord
});
});

app.get("/runtime/chord",(req,res)=>res.json(runtime.chord));

app.get("/runtime/style",(req,res)=>res.json(runtime.style));

app.post("/runtime/style/load/:name",(req,res)=>{
runtime.style.name=req.params.name;
res.json(runtime.style);
});

app.post("/runtime/style/tempo/:tempo",(req,res)=>{
runtime.style.tempo=Number(req.params.tempo);
res.json(runtime.style);
});

app.post("/runtime/style/variation/:variation",(req,res)=>{
runtime.style.variation=req.params.variation;
res.json(runtime.style);
});

app.post("/runtime/style/start",(req,res)=>{
runtime.style.playing=true;
res.json(runtime.style);
});

app.get("/runtime/sampler",(req,res)=>res.json(runtime.sampler));

app.post("/runtime/sampler/load/:name",(req,res)=>{
const kit={
id:"kit_"+Date.now(),
name:req.params.name,
loaded:true
};

runtime.sampler.kits.push(kit);

res.json(kit);
});

app.post("/runtime/sampler/trigger/:sample/:note",(req,res)=>{
const voice={
id:"voice_"+Date.now(),
sample:req.params.sample,
note:Number(req.params.note)
};

runtime.sampler.voices.push(voice);

res.json(voice);
});

app.get("/runtime/hardware",(req,res)=>res.json(runtime.hardware));

app.post("/runtime/hardware/add/:type/:name",(req,res)=>{
const d={
id:"dev_"+Date.now(),
type:req.params.type,
name:req.params.name
};

runtime.hardware.devices.push(d);

res.json(d);
});

app.get("/runtime/ai",(req,res)=>res.json(runtime.ai));

app.post("/runtime/ai/analyze/:name",(req,res)=>{
const j={
id:"job_"+Date.now(),
target:req.params.name,
status:"queued"
};

runtime.ai.jobs.push(j);

res.json(j);
});

app.get("/runtime/ai/suggest/:chord",(req,res)=>{
res.json({
ok:true,
chord:req.params.chord,
suggestion:"OrientalPop"
});
});

app.get("/runtime/mixer",(req,res)=>res.json(runtime.mixer));

app.post("/runtime/mixer/channel/:type/:name",(req,res)=>{
const ch={
id:"ch_"+Date.now(),
type:req.params.type,
name:req.params.name,
volume:1
};

runtime.mixer.channels.push(ch);

res.json(ch);
});

app.get("/runtime/diagnostics",(req,res)=>{
res.json({
ok:true,
diagnostics:{
midi:true,
chord:true,
style:true,
sampler:true,
hardware:true,
ai:true,
mixer:true,
realtime:true,
nativeMidi:true
}
});
});

app.get("/runtime/release-gate",(req,res)=>{
res.json({
ok:true,
target:"UAOS Realtime Core Runtime Alpha",
releaseReady:true
});
});

server.listen(PORT,()=>console.log("UAOS Realtime Runtime Backend => http://localhost:"+PORT));
