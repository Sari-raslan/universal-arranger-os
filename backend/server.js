const express = require("express");
const cors = require("cors");

const { MidiRuntime } = require("../midi/MidiRuntime.cjs");

const app = express();
const PORT = process.env.PORT || 8090;

app.use(cors());
app.use(express.json());

const midi = new MidiRuntime();

midi.start();

const runtime = {
  core: {
    version: "0.1.0-alpha",
    status: "active"
  },
  midi,
  arranger: {
    loaded: true,
    transitions: "foundation"
  },
  sampler: {
    loaded: true,
    playback: "foundation"
  },
  hardware: {
    loaded: true,
    devices: []
  },
  ai: {
    loaded: true,
    analysis: "pending"
  }
};

app.get("/", (req,res)=>{
  res.json({
    ok:true,
    app:"UAOS HyperStation",
    runtime:"Core Runtime Alpha"
  });
});

app.get("/health",(req,res)=>{
  res.json({
    ok:true,
    backend:true,
    timestamp:new Date().toISOString()
  });
});

app.get("/runtime",(req,res)=>{
  res.json({
    core: runtime.core,
    midi: runtime.midi.status(),
    arranger: runtime.arranger,
    sampler: runtime.sampler,
    hardware: runtime.hardware,
    ai: runtime.ai
  });
});

app.get("/runtime/midi",(req,res)=>{
  res.json(runtime.midi.status());
});

app.post("/runtime/midi/input/:name",(req,res)=>{
  res.json(runtime.midi.addInput(req.params.name));
});

app.post("/runtime/midi/output/:name",(req,res)=>{
  res.json(runtime.midi.addOutput(req.params.name));
});

app.post("/runtime/midi/noteon/:note",(req,res)=>{
  res.json(runtime.midi.noteOn(Number(req.params.note)));
});

app.post("/runtime/midi/noteoff/:note",(req,res)=>{
  res.json(runtime.midi.noteOff(Number(req.params.note)));
});

app.listen(PORT, ()=>{
  console.log("UAOS Runtime Backend => http://localhost:" + PORT);
});
