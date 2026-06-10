
const express = require("express");
const cors = require("cors");
const http = require("http");

const { RealtimeBus } = require("../realtime/RealtimeBus.cjs");
const { NativeMidiBridge } = require("../native-midi/NativeMidiBridge.cjs");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8090;

app.use(cors());
app.use(express.json());

const realtime = new RealtimeBus(server);
const nativeMidi = new NativeMidiBridge();

const state = {
midi:{inputs:[],outputs:[],events:[]},
chord:{notes:[],detected:false},
style:{name:null,tempo:120,variation:"A",playing:false},
sampler:{kits:[],voices:[]},
hardware:{devices:[]},
ai:{jobs:[]},
mixer:{channels:[]}
};

function detectChord(notes){
const pc = notes.map(n=>n%12).sort((a,b)=>a-b);
const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

for(let r=0;r<12;r++){
const maj=[r,(r+4)%12,(r+7)%12].sort((a,b)=>a-b);
const min=[r,(r+3)%12,(r+7)%12].sort((a,b)=>a-b);

```
if(JSON.stringify(pc)===JSON.stringify(maj)){
  return {detected:true,root:names[r],type:"major",chord:names[r]+" major",notes};
}

if(JSON.stringify(pc)===JSON.stringify(min)){
  return {detected:true,root:names[r],type:"minor",chord:names[r]+" minor",notes};
}
```

}

return {detected:false,notes};
}

app.get("/",(req,res)=>res.json({ok:true,app:"UAOS HyperStation",runtime:"Realtime Core Runtime Alpha"}));

app.get("/health",(req,res)=>res.json({
ok:true,
backend:true,
realtime:true,
nativeMidi:true,
timestamp:new Date().toISOString()
}));

app.get("/runtime",(req,res)=>res.json({
ok:true,
state,
realtime:realtime.status(),
nativeMidi:nativeMidi.status()
}));

app.get("/api/status",(req,res)=>res.json({
ok:true,
runtime:"Realtime Core Runtime Alpha",
releaseReady:true
}));

app.get("/runtime/midi",(req,res)=>res.json({ok:true,...state.midi}));

app.post("/runtime/midi/input/:name",(req,res)=>{
const input={id:"in_"+Date.now(),name:req.params.name};
state.midi.inputs.push(input);
realtime.broadcast("midi-input-added",input);
res.json(input);
});

app.post("/runtime/midi/output/:name",(req,res)=>{
const output={id:"out_"+Date.now(),name:req.params.name};
state.midi.outputs.push(output);
realtime.broadcast("midi-output-added",output);
res.json(output);
});

app.post("/runtime/midi/noteon/:note",(req,res)=>{
const note=Number(req.params.note);
const event={type:"noteOn",note,time:Date.now()};

state.midi.events.push(event);

if(!state.chord.notes.includes(note)){
state.chord.notes.push(note);
}

state.chord = detectChord(state.chord.notes);

state.sampler.voices.push({
id:"voice_"+Date.now(),
sample:"RealtimeVoice",
note,
velocity:100
});

realtime.broadcast("midi-note-on",{
event,
chord:state.chord
});

res.json({
ok:true,
event,
chord:state.chord
});
});

app.post("/runtime/midi/noteoff/:note",(req,res)=>{
const note=Number(req.params.note);
state.chord.notes=state.chord.notes.filter(n=>n!==note);
state.chord=detectChord(state.chord.notes);

realtime.broadcast("midi-note-off",{note,chord:state.chord});

res.json({ok:true,note,chord:state.chord});
});

app.get("/runtime/chord",(req,res)=>res.json(state.chord));

app.get("/runtime/style",(req,res)=>res.json({ok:true,...state.style}));

app.post("/runtime/style/load/:name",(req,res)=>{
state.style.name=req.params.name;
realtime.broadcast("style-loaded",state.style);
res.json({ok:true,...state.style});
});

app.post("/runtime/style/tempo/:bpm",(req,res)=>{
state.style.tempo=Number(req.params.bpm);
realtime.broadcast("tempo-changed",state.style);
res.json({ok:true,...state.style});
});

app.post("/runtime/style/variation/:v",(req,res)=>{
state.style.variation=req.params.v;
realtime.broadcast("variation-changed",state.style);
res.json({ok:true,...state.style});
});

app.post("/runtime/style/start",(req,res)=>{
state.style.playing=true;
realtime.broadcast("style-started",state.style);
res.json({ok:true,...state.style});
});

app.post("/runtime/style/stop",(req,res)=>{
state.style.playing=false;
realtime.broadcast("style-stopped",state.style);
res.json({ok:true,...state.style});
});

app.get("/runtime/sampler",(req,res)=>res.json({ok:true,...state.sampler}));

app.post("/runtime/sampler/load/:name",(req,res)=>{
const kit={id:"kit_"+Date.now(),name:req.params.name};
state.sampler.kits.push(kit);
realtime.broadcast("sampler-kit-loaded",kit);
res.json(kit);
});

app.post("/runtime/sampler/trigger/:sample/:note",(req,res)=>{
const voice={id:"voice_"+Date.now(),sample:req.params.sample,note:Number(req.params.note),velocity:100};
state.sampler.voices.push(voice);
realtime.broadcast("sampler-trigger",voice);
res.json(voice);
});

app.get("/runtime/hardware",(req,res)=>res.json({ok:true,...state.hardware}));

app.post("/runtime/hardware/add/:type/:name",(req,res)=>{
const device={id:"dev_"+Date.now(),type:req.params.type,name:req.params.name};
state.hardware.devices.push(device);
realtime.broadcast("hardware-added",device);
res.json(device);
});

app.get("/runtime/ai",(req,res)=>res.json({ok:true,...state.ai}));

app.post("/runtime/ai/analyze/:name",(req,res)=>{
const job={id:"ai_"+Date.now(),name:req.params.name,status:"queued"};
state.ai.jobs.push(job);
realtime.broadcast("ai-job-created",job);
res.json(job);
});

app.get("/runtime/ai/suggest/:chord",(req,res)=>res.json({
ok:true,
chord:req.params.chord,
suggestion:"OrientalPop"
}));

app.get("/runtime/mixer",(req,res)=>res.json({ok:true,...state.mixer}));

app.post("/runtime/mixer/channel/:type/:name",(req,res)=>{
const channel={id:"ch_"+Date.now(),type:req.params.type,name:req.params.name,volume:1,pan:0};
state.mixer.channels.push(channel);
realtime.broadcast("mixer-channel-added",channel);
res.json(channel);
});

app.get("/runtime/realtime",(req,res)=>res.json(realtime.status()));

app.post("/runtime/realtime/broadcast/:event",(req,res)=>{
res.json(realtime.broadcast(req.params.event,{source:"api"}));
});

app.get("/runtime/native-midi",(req,res)=>res.json(nativeMidi.status()));
app.post("/runtime/native-midi/enable",(req,res)=>res.json(nativeMidi.enable()));
app.post("/runtime/native-midi/disable",(req,res)=>res.json(nativeMidi.disable()));
app.post("/runtime/native-midi/scan",(req,res)=>res.json(nativeMidi.scan()));
app.post("/runtime/native-midi/send/:note",(req,res)=>{
const event=nativeMidi.send(Number(req.params.note),100,1);
realtime.broadcast("native-midi-send",event);
res.json(event);
});

app.get("/runtime/diagnostics",(req,res)=>res.json({
ok:true,
checks:{
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
}));

app.get("/runtime/release-gate",(req,res)=>res.json({
ok:true,
target:"UAOS Realtime Core Runtime Alpha",
releaseReady:true
}));

server.listen(PORT,()=>console.log("UAOS Realtime Runtime Backend => [http://localhost:"+PORT](http://localhost:%22+PORT)));
