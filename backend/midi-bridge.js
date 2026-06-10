import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const state = {
  ok: true,
  bridge: "UAOS MIDI Bridge",
  connected: false,
  inputs: [],
  outputs: [],
  lastMessage: null
};

app.get("/health", (req,res)=>res.json(state));

app.get("/scan", (req,res)=>{
  state.inputs = ["UAOS Virtual Input", "Generic MIDI Input"];
  state.outputs = ["UAOS Virtual Output", "Generic MIDI Output"];
  res.json(state);
});

app.post("/send", (req,res)=>{
  state.lastMessage = {
    type: req.body.type || "note",
    note: req.body.note || 60,
    velocity: req.body.velocity || 100,
    channel: req.body.channel || 1,
    time: new Date().toISOString()
  };
  res.json({ ok:true, sent:state.lastMessage });
});

app.post("/panic", (req,res)=>{
  state.lastMessage = { type:"panic", time:new Date().toISOString() };
  res.json({ ok:true, panic:true });
});

app.listen(process.env.PORT || 8090, ()=>{
  console.log("UAOS MIDI Bridge running on http://localhost:" + (process.env.PORT || 8090));
});
