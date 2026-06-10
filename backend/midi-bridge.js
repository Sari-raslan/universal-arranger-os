import express from "express";
import cors from "cors";
import easymidi from "easymidi";

const app = express();
app.use(cors());
app.use(express.json());

let input = null;
let output = null;

const state = {
  ok: true,
  bridge: "UAOS Real MIDI Bridge",
  connected: false,
  inputs: [],
  outputs: [],
  selectedInput: null,
  selectedOutput: null,
  lastMessage: null
};

function scanPorts(){
  state.inputs = easymidi.getInputs();
  state.outputs = easymidi.getOutputs();

  const korgIn = state.inputs.find(x => x.toLowerCase().includes("korg") || x.toLowerCase().includes("pa3"));
  const korgOut = state.outputs.find(x => x.toLowerCase().includes("korg") || x.toLowerCase().includes("pa3"));

  state.selectedInput = korgIn || state.inputs[0] || null;
  state.selectedOutput = korgOut || state.outputs[0] || null;
  state.connected = !!(state.selectedInput || state.selectedOutput);

  return state;
}

function openPorts(){
  scanPorts();

  try { if (input) input.close(); } catch {}
  try { if (output) output.close(); } catch {}

  if (state.selectedInput) {
    input = new easymidi.Input(state.selectedInput);
    input.on("noteon", msg => {
      state.lastMessage = { type:"noteon", ...msg, time:new Date().toISOString() };
      console.log("MIDI IN noteon", state.lastMessage);
    });
    input.on("noteoff", msg => {
      state.lastMessage = { type:"noteoff", ...msg, time:new Date().toISOString() };
      console.log("MIDI IN noteoff", state.lastMessage);
    });
    input.on("cc", msg => {
      state.lastMessage = { type:"cc", ...msg, time:new Date().toISOString() };
      console.log("MIDI IN cc", state.lastMessage);
    });
  }

  if (state.selectedOutput) {
    output = new easymidi.Output(state.selectedOutput);
  }

  return state;
}

app.get("/health", (req,res)=>res.json(state));
app.get("/scan", (req,res)=>res.json(scanPorts()));
app.post("/open", (req,res)=>res.json(openPorts()));

app.post("/send", (req,res)=>{
  if (!output) openPorts();

  const note = Number(req.body.note || 60);
  const velocity = Number(req.body.velocity || 100);
  const channel = Number(req.body.channel || 0);

  if (output) {
    output.send("noteon", { note, velocity, channel });
    setTimeout(()=>output.send("noteoff", { note, velocity:0, channel }), 400);
    state.lastMessage = { type:"sent-note", note, velocity, channel, time:new Date().toISOString() };
    return res.json({ ok:true, sent:state.lastMessage, output:state.selectedOutput });
  }

  res.json({ ok:false, error:"No MIDI output available", state });
});

app.post("/panic", (req,res)=>{
  if (!output) openPorts();

  if (output) {
    for (let ch=0; ch<16; ch++) {
      output.send("cc", { controller:123, value:0, channel:ch });
    }
  }

  state.lastMessage = { type:"panic", time:new Date().toISOString() };
  res.json({ ok:true, panic:true });
});

openPorts();

app.listen(process.env.PORT || 8090, ()=>{
  console.log("UAOS Real MIDI Bridge running on http://localhost:" + (process.env.PORT || 8090));
  console.log("Inputs:", state.inputs);
  console.log("Outputs:", state.outputs);
});
