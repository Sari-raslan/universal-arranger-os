import express from "express";
import cors from "cors";
import easymidi from "easymidi";

const app = express();
app.use(cors());
app.use(express.json());

let input=null, output=null;

const state={
  ok:true, bridge:"UAOS PA3X Real Control Bridge",
  connected:false, inputs:[], outputs:[],
  selectedInput:null, selectedOutput:null,
  clockRunning:false, bpm:120, lastMessage:null
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
  try{if(input)input.close()}catch{}
  try{if(output)output.close()}catch{}

  if(state.selectedInput){
    input=new easymidi.Input(state.selectedInput);
    input.on("noteon",m=>state.lastMessage={type:"noteon",...m,time:new Date().toISOString()});
    input.on("noteoff",m=>state.lastMessage={type:"noteoff",...m,time:new Date().toISOString()});
    input.on("cc",m=>state.lastMessage={type:"cc",...m,time:new Date().toISOString()});
  }
  if(state.selectedOutput) output=new easymidi.Output(state.selectedOutput);
  return state;
}

function ensure(){ if(!output) openPorts(); return !!output; }
function send(type,msg){ if(!ensure()) return false; output.send(type,msg); return true; }

function note(note, velocity=100, channel=0, duration=450){
  if(!send("noteon",{note,velocity,channel})) return false;
  setTimeout(()=>{try{output.send("noteoff",{note,velocity:0,channel})}catch{}},duration);
  state.lastMessage={type:"note",note,velocity,channel,time:new Date().toISOString()};
  return true;
}

const chords={
  C:[60,64,67], CM:[60,63,67], D:[62,66,69], DM:[62,65,69],
  E:[64,68,71], EM:[64,67,71], F:[65,69,72], FM:[65,68,72],
  G:[67,71,74], GM:[67,70,74], A:[69,73,76], AM:[69,72,76],
  BB:[70,74,77], AB:[68,72,75]
};

function chord(name="C"){
  const notes=chords[String(name).toUpperCase()] || chords.C;
  notes.forEach(n=>note(n,100,0,850));
  state.lastMessage={type:"chord",chord:name,notes,time:new Date().toISOString()};
  return notes;
}

function panic(){
  if(ensure()){
    for(let ch=0;ch<16;ch++) output.send("cc",{controller:123,value:0,channel:ch});
  }
  state.lastMessage={type:"panic",time:new Date().toISOString()};
}

app.get("/health",(req,res)=>res.json(state));
app.get("/scan",(req,res)=>res.json(scanPorts()));
app.post("/open",(req,res)=>res.json(openPorts()));

app.post("/send",(req,res)=>{
  const ok=note(Number(req.body.note||60),Number(req.body.velocity||100),Number(req.body.channel||0));
  res.json({ok,output:state.selectedOutput,lastMessage:state.lastMessage});
});

app.post("/chord",(req,res)=>{
  const notes=chord(req.body.chord||"C");
  res.json({ok:true,chord:req.body.chord||"C",notes,output:state.selectedOutput});
});

app.post("/cc",(req,res)=>{
  const msg={controller:Number(req.body.controller||64),value:Number(req.body.value||127),channel:Number(req.body.channel||0)};
  const ok=send("cc",msg);
  state.lastMessage={type:"cc-out",...msg,time:new Date().toISOString()};
  res.json({ok,msg,output:state.selectedOutput});
});

app.post("/program",(req,res)=>{
  const msg={number:Number(req.body.number||0),channel:Number(req.body.channel||0)};
  const ok=send("program",msg);
  state.lastMessage={type:"program",...msg,time:new Date().toISOString()};
  res.json({ok,msg,output:state.selectedOutput});
});

app.post("/start",(req,res)=>{
  const ok=send("start",{});
  state.lastMessage={type:"midi-start",time:new Date().toISOString()};
  res.json({ok,start:true});
});

app.post("/stop",(req,res)=>{
  const ok=send("stop",{});
  state.clockRunning=false;
  state.lastMessage={type:"midi-stop",time:new Date().toISOString()};
  res.json({ok,stop:true});
});

app.post("/clock/start",(req,res)=>{
  state.bpm=Number(req.body.bpm||120);
  state.clockRunning=true;
  state.lastMessage={type:"clock-start",bpm:state.bpm,time:new Date().toISOString()};
  res.json({ok:true,clockRunning:true,bpm:state.bpm,warning:"Clock draft enabled; stable timing needs native worker."});
});

app.post("/panic",(req,res)=>{panic();res.json({ok:true,panic:true})});

setInterval(()=>{try{scanPorts()}catch{}},5000);
openPorts();

app.listen(8090,()=>{
  console.log("UAOS PA3X CONTROL BRIDGE 8090");
  console.log("INPUTS",state.inputs);
  console.log("OUTPUTS",state.outputs);
});
