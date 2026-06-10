import express from "express";
import cors from "cors";
import easymidi from "easymidi";
import { chordNotes, progression } from "./src/pa3x-music-map.js";

const app = express();
app.use(cors());
app.use(express.json());

let input = null;
let output = null;
let clockTimer = null;

const state = {
  ok:true,
  bridge:"UAOS PA3X Final Real MIDI Bridge",
  connected:false,
  inputs:[],
  outputs:[],
  selectedInput:null,
  selectedOutput:null,
  bpm:120,
  clockRunning:false,
  lastMessage:null
};

function scanPorts(){
  state.inputs = easymidi.getInputs();
  state.outputs = easymidi.getOutputs();

  state.selectedInput =
    state.inputs.find(x=>/korg|pa3/i.test(x)) ||
    state.inputs[0] ||
    null;

  state.selectedOutput =
    state.outputs.find(x=>/korg|pa3/i.test(x)) ||
    state.outputs[0] ||
    null;

  state.connected = !!state.selectedOutput;
  return state;
}

function openPorts(){
  scanPorts();

  try{ if(input) input.close(); }catch{}
  try{ if(output) output.close(); }catch{}

  if(state.selectedInput){
    input = new easymidi.Input(state.selectedInput);

    input.on("noteon", msg=>{
      state.lastMessage = { type:"noteon", ...msg, time:new Date().toISOString() };
      console.log("PA3X IN noteon", state.lastMessage);
    });

    input.on("noteoff", msg=>{
      state.lastMessage = { type:"noteoff", ...msg, time:new Date().toISOString() };
    });

    input.on("cc", msg=>{
      state.lastMessage = { type:"cc-in", ...msg, time:new Date().toISOString() };
      console.log("PA3X IN cc", state.lastMessage);
    });
  }

  if(state.selectedOutput){
    output = new easymidi.Output(state.selectedOutput);
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

function sendNote(note=60, velocity=100, channel=0, duration=500){
  if(!send("noteon",{note,velocity,channel})) return false;

  setTimeout(()=>{
    try{ output.send("noteoff",{note,velocity:0,channel}); }catch{}
  }, duration);

  state.lastMessage = { type:"note", note, velocity, channel, time:new Date().toISOString() };
  return true;
}

function sendChord(name="C", channel=0, duration=900){
  const notes = chordNotes(name);
  notes.forEach(n=>sendNote(n,100,channel,duration));
  state.lastMessage = { type:"chord", chord:name, notes, channel, time:new Date().toISOString() };
  return notes;
}

function allNotesOff(){
  if(ensure()){
    for(let ch=0; ch<16; ch++){
      output.send("cc",{controller:123,value:0,channel:ch});
      output.send("cc",{controller:120,value:0,channel:ch});
    }
  }
  state.lastMessage = { type:"panic", time:new Date().toISOString() };
}

function startClock(bpm=120){
  stopClock();
  state.bpm = Number(bpm);
  state.clockRunning = true;
  const interval = 60000 / state.bpm / 24;

  clockTimer = setInterval(()=>{
    try{ if(output) output.send("clock",{}); }catch{}
  }, interval);

  state.lastMessage = { type:"clock-start", bpm:state.bpm, time:new Date().toISOString() };
}

function stopClock(){
  if(clockTimer) clearInterval(clockTimer);
  clockTimer = null;
  state.clockRunning = false;
}

app.get("/health",(req,res)=>res.json(state));
app.get("/scan",(req,res)=>res.json(scanPorts()));
app.post("/open",(req,res)=>res.json(openPorts()));

app.post("/send",(req,res)=>{
  const ok = sendNote(
    Number(req.body.note || 60),
    Number(req.body.velocity || 100),
    Number(req.body.channel || 0),
    Number(req.body.duration || 500)
  );
  res.json({ ok, output:state.selectedOutput, lastMessage:state.lastMessage });
});

app.post("/chord",(req,res)=>{
  const notes = sendChord(req.body.chord || "C", Number(req.body.channel || 0), Number(req.body.duration || 900));
  res.json({ ok:true, chord:req.body.chord || "C", notes, output:state.selectedOutput });
});

app.post("/progression",(req,res)=>{
  const name = req.body.name || "oriental_pop";
  const seq = progression(name);
  const gap = Number(req.body.gap || 1000);

  seq.forEach((c,i)=>setTimeout(()=>sendChord(c), i * gap));

  state.lastMessage = { type:"progression", name, seq, time:new Date().toISOString() };
  res.json({ ok:true, name, seq, output:state.selectedOutput });
});

app.post("/cc",(req,res)=>{
  const msg = {
    controller:Number(req.body.controller || 64),
    value:Number(req.body.value || 127),
    channel:Number(req.body.channel || 0)
  };
  const ok = send("cc",msg);
  state.lastMessage = { type:"cc-out", ...msg, time:new Date().toISOString() };
  res.json({ ok, msg, output:state.selectedOutput });
});

app.post("/program",(req,res)=>{
  const msg = {
    number:Number(req.body.number || 0),
    channel:Number(req.body.channel || 0)
  };
  const ok = send("program",msg);
  state.lastMessage = { type:"program", ...msg, time:new Date().toISOString() };
  res.json({ ok, msg, output:state.selectedOutput });
});

app.post("/start",(req,res)=>{
  const ok = send("start",{});
  state.lastMessage = { type:"midi-start", time:new Date().toISOString() };
  res.json({ ok, start:true });
});

app.post("/stop",(req,res)=>{
  const ok = send("stop",{});
  stopClock();
  state.lastMessage = { type:"midi-stop", time:new Date().toISOString() };
  res.json({ ok, stop:true });
});

app.post("/clock/start",(req,res)=>{
  startClock(req.body.bpm || 120);
  res.json({ ok:true, bpm:state.bpm, clockRunning:true });
});

app.post("/clock/stop",(req,res)=>{
  stopClock();
  res.json({ ok:true, clockRunning:false });
});

app.post("/fill",(req,res)=>{
  const ok = send("cc",{controller:65,value:127,channel:0});
  res.json({ ok, action:"fill", warning:"PA3X CC mapping may need Global MIDI setup" });
});

app.post("/break",(req,res)=>{
  const ok = send("cc",{controller:66,value:127,channel:0});
  res.json({ ok, action:"break", warning:"PA3X CC mapping may need Global MIDI setup" });
});

app.post("/panic",(req,res)=>{
  allNotesOff();
  res.json({ ok:true, panic:true });
});

app.post("/demo/song",(req,res)=>{
  const seq = ["CM","AB","BB","G","CM"];
  seq.forEach((c,i)=>setTimeout(()=>sendChord(c), i * 1200));
  state.lastMessage = { type:"demo-song", seq, time:new Date().toISOString() };
  res.json({ ok:true, seq, output:state.selectedOutput });
});

setInterval(()=>{
  try{ scanPorts(); }catch{}
},5000);

openPorts();

app.listen(8090,()=>{
  console.log("UAOS PA3X FINAL BRIDGE 8090");
  console.log("INPUTS", state.inputs);
  console.log("OUTPUTS", state.outputs);
});
