$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
cd $Root

$Report="reports\UAOS_REAL_HARDWARE_AUTOMATION.txt"
New-Item -ItemType Directory -Force -Path reports | Out-Null

function Log($m){
  $x="[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $m"
  Write-Host $x
  Add-Content -LiteralPath $Report -Value $x -Encoding UTF8
}

Log "UAOS REAL HARDWARE START"

@'
import express from "express";
import cors from "cors";
import easymidi from "easymidi";

const app = express();
app.use(cors());
app.use(express.json());

let input = null;
let output = null;

const state = {
  ok:true,
  bridge:"UAOS Real MIDI Bridge",
  connected:false,
  inputs:[],
  outputs:[],
  selectedInput:null,
  selectedOutput:null,
  lastMessage:null
};

function scanPorts(){
  state.inputs = easymidi.getInputs();
  state.outputs = easymidi.getOutputs();

  const korgIn =
    state.inputs.find(x=>x.toLowerCase().includes("korg")) ||
    state.inputs.find(x=>x.toLowerCase().includes("pa3"));

  const korgOut =
    state.outputs.find(x=>x.toLowerCase().includes("korg")) ||
    state.outputs.find(x=>x.toLowerCase().includes("pa3"));

  state.selectedInput = korgIn || state.inputs[0] || null;
  state.selectedOutput = korgOut || state.outputs[0] || null;

  state.connected = !!state.selectedOutput;

  return state;
}

function ensurePorts(){
  scanPorts();

  try{ if(input) input.close(); }catch{}
  try{ if(output) output.close(); }catch{}

  if(state.selectedInput){
    input = new easymidi.Input(state.selectedInput);

    input.on("noteon", msg=>{
      state.lastMessage = {
        type:"noteon",
        ...msg,
        time:new Date().toISOString()
      };
      console.log("IN", state.lastMessage);
    });

    input.on("cc", msg=>{
      state.lastMessage = {
        type:"cc",
        ...msg,
        time:new Date().toISOString()
      };
      console.log("CC", state.lastMessage);
    });
  }

  if(state.selectedOutput){
    output = new easymidi.Output(state.selectedOutput);
  }

  return state;
}

function sendNote(note=60, velocity=100, channel=0, duration=400){
  if(!output) ensurePorts();

  if(!output) return false;

  output.send("noteon",{note,velocity,channel});

  setTimeout(()=>{
    try{
      output.send("noteoff",{note,velocity:0,channel});
    }catch{}
  }, duration);

  state.lastMessage = {
    type:"sent-note",
    note,
    velocity,
    channel,
    time:new Date().toISOString()
  };

  return true;
}

function sendChord(notes=[]){
  for(const n of notes){
    sendNote(n,100,0,900);
  }
}

app.get("/health",(req,res)=>res.json(state));

app.get("/scan",(req,res)=>{
  res.json(scanPorts());
});

app.post("/open",(req,res)=>{
  res.json(ensurePorts());
});

app.post("/send",(req,res)=>{
  const note = Number(req.body.note || 60);
  const velocity = Number(req.body.velocity || 100);
  const channel = Number(req.body.channel || 0);

  const ok = sendNote(note,velocity,channel);

  res.json({
    ok,
    output:state.selectedOutput,
    sent:state.lastMessage
  });
});

app.post("/chord",(req,res)=>{
  const chord = String(req.body.chord || "C").toUpperCase();

  const map = {
    "C":[60,64,67],
    "F":[65,69,72],
    "G":[67,71,74],
    "AM":[69,72,76],
    "CM":[60,63,67]
  };

  const notes = map[chord] || map["C"];

  sendChord(notes);

  state.lastMessage = {
    type:"chord",
    chord,
    notes,
    time:new Date().toISOString()
  };

  res.json({
    ok:true,
    chord,
    notes,
    output:state.selectedOutput
  });
});

app.post("/panic",(req,res)=>{
  if(!output) ensurePorts();

  if(output){
    for(let ch=0; ch<16; ch++){
      output.send("cc",{
        controller:123,
        value:0,
        channel:ch
      });
    }
  }

  state.lastMessage = {
    type:"panic",
    time:new Date().toISOString()
  };

  res.json({
    ok:true,
    panic:true
  });
});

setInterval(()=>{
  try{
    scanPorts();
  }catch(e){
    console.log("scan fail",e.message);
  }
},5000);

ensurePorts();

app.listen(8090,()=>{
  console.log("UAOS REAL MIDI BRIDGE RUNNING 8090");
  console.log("INPUTS",state.inputs);
  console.log("OUTPUTS",state.outputs);
});
