import express from "express";
import cors from "cors";
import easymidi from "easymidi";
import { getChord, getProgression } from "./src/pa3x-music-map.js";

const app = express();
app.use(cors());
app.use(express.json());

let input=null;
let output=null;
let clockTimer=null;

const state={
  ok:true,
  bridge:"UAOS PA3X Live Performance Bridge",
  connected:false,
  inputs:[],
  outputs:[],
  selectedInput:null,
  selectedOutput:null,
  bpm:120,
  clockRunning:false,
  lastMessage:null,
  liveMode:true
};

function scanPorts(){
  state.inputs=easymidi.getInputs();
  state.outputs=easymidi.getOutputs();
  state.selectedInput=state.inputs.find(x=>/korg|pa3/i.test(x)) || state.inputs[0] || null;
  state.selectedOutput=state.outputs.find(x=>/korg|pa3/i.test(x)) || state.outputs[0] || null;
  state.connected=!!state.selectedOutput;
  return state;
}

function openPorts(){
  scanPorts();

  try{ if(input) input.close(); }catch{}
  try{ if(output) output.close(); }catch{}

  if(state.selectedInput){
    input=new easymidi.Input(state.selectedInput);
    input.on("noteon",m=>{
      state.lastMessage={type:"noteon",...m,time:new Date().toISOString()};
      console.log("IN noteon",state.lastMessage);
    });
    input.on("noteoff",m=>{
      state.lastMessage={type:"noteoff",...m,time:new Date().toISOString()};
    });
    input.on("cc",m=>{
      state.lastMessage={type:"cc-in",...m,time:new Date().toISOString()};
      console.log("IN cc",state.lastMessage);
    });
  }

  if(state.selectedOutput){
    output=new easymidi.Output(state.selectedOutput);
  }

  return state;
}

function ensure(){
  if(!output) openPorts();
  return !!output;
}

function send(type,msg){
  if(!ensure()) return false;
  output.send(type,msg);
  return true;
}

function note(note=60,velocity=100,channel=0,duration=420){
  if(!send("noteon",{note,velocity,channel})) return false;
  setTimeout(()=>{
    try{ output.send("noteoff",{note,velocity:0,channel}); }catch{}
  },duration);
  state.lastMessage={type:"note",note,velocity,channel,time:new Date().toISOString()};
  return true;
}

function chord(name="C", channel=0, duration=900){
  const notes=getChord(name);
  notes.forEach(n=>note(n,100,channel,duration));
  state.lastMessage={type:"chord",chord:name,notes,channel,time:new Date().toISOString()};
  return notes;
}

function cc(controller,value,channel=0){
  const ok=send("cc",{controller:Number(controller),value:Number(value),channel:Number(channel)});
  state.lastMessage={type:"cc-out",controller,value,channel,time:new Date().toISOString()};
  return ok;
}

function program(number,channel=0){
  const ok=send("program",{number:Number(number),channel:Number(channel)});
  state.lastMessage={type:"program",number,channel,time:new Date().toISOString()};
  return ok;
}

function panic(){
  if(ensure()){
    for(let ch=0; ch<16; ch++){
      output.send("cc",{controller:123,value:0,channel:ch});
      output.send("cc",{controller:120,value:0,channel:ch});
    }
  }
  state.lastMessage={type:"panic",time:new Date().toISOString()};
}

function stopClock(){
  if(clockTimer) clearInterval(clockTimer);
  clockTimer=null;
  state.clockRunning=false;
}

function startClock(bpm=120){
  stopClock();
  state.bpm=Number(bpm);
  state.clockRunning=true;
  const interval = 60000 / state.bpm / 24;
  clockTimer=setInterval(()=>{
    try{ if(output) output.send("clock",{}); }catch{}
  }, interval);
  state.lastMessage={type:"clock-start",bpm:state.bpm,time:new Date().toISOString()};
}

app.get("/health",(req,res)=>res.json(state));
app.get("/scan",(req,res)=>res.json(scanPorts()));
app.post("/open",(req,res)=>res.json(openPorts()));

app.post("/send",(req,res)=>{
  const ok=note(Number(req.body.note||60),Number(req.body.velocity||100),Number(req.body.channel||0));
  res.json({ok,output:state.selectedOutput,lastMessage:state.lastMessage});
});

app.post("/chord",(req,res)=>{
  const notes=chord(req.body.chord||"C",Number(req.body.channel||0),Number(req.body.duration||900));
  res.json({ok:true,chord:req.body.chord||"C",notes,output:state.selectedOutput});
});

app.post("/progression",(req,res)=>{
  const name=req.body.name||"oriental_pop";
  const chords=getProgression(name);
  const gap=Number(req.body.gap||1000);
  chords.forEach((c,i)=>setTimeout(()=>chord(c),i*gap));
  state.lastMessage={type:"progression",name,chords,time:new Date().toISOString()};
  res.json({ok:true,name,chords,output:state.selectedOutput});
});

app.post("/cc",(req,res)=>res.json({
  ok:cc(req.body.controller||64,req.body.value||127,req.body.channel||0),
  lastMessage:state.lastMessage
}));

app.post("/program",(req,res)=>res.json({
  ok:program(req.body.number||0,req.body.channel||0),
  lastMessage:state.lastMessage
}));

app.post("/start",(req,res)=>{
  const ok=send("start",{});
  state.lastMessage={type:"midi-start",time:new Date().toISOString()};
  res.json({ok,start:true});
});

app.post("/stop",(req,res)=>{
  const ok=send("stop",{});
  stopClock();
  state.lastMessage={type:"midi-stop",time:new Date().toISOString()};
  res.json({ok,stop:true});
});

app.post("/clock/start",(req,res)=>{
  startClock(req.body.bpm||120);
  res.json({ok:true,bpm:state.bpm,clockRunning:true});
});

app.post("/clock/stop",(req,res)=>{
  stopClock();
  res.json({ok:true,clockRunning:false});
});

app.post("/fill",(req,res)=>{
  cc(65,127,0);
  res.json({ok:true,action:"fill",warning:"CC mapping may need PA3X MIDI setup adjustment"});
});

app.post("/break",(req,res)=>{
  cc(66,127,0);
  res.json({ok:true,action:"break",warning:"CC mapping may need PA3X MIDI setup adjustment"});
});

app.post("/panic",(req,res)=>{
  panic();
  res.json({ok:true,panic:true});
});

app.post("/demo/song",(req,res)=>{
  const seq=["CM","AB","BB","G","CM"];
  seq.forEach((c,i)=>setTimeout(()=>chord(c),i*1200));
  state.lastMessage={type:"demo-song",seq,time:new Date().toISOString()};
  res.json({ok:true,seq,output:state.selectedOutput});
});

setInterval(()=>{try{scanPorts()}catch{}},5000);
openPorts();

app.listen(8090,()=>{
  console.log("UAOS PA3X LIVE BRIDGE 8090");
  console.log("INPUTS",state.inputs);
  console.log("OUTPUTS",state.outputs);
});
