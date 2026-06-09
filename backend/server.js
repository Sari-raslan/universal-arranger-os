import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { attachRealtime } from "./src/realtime.js";
import { ChordEngine } from "./src/chord-engine.js";
import { StylePlayer } from "./src/style-player.js";
import { LoopRecorder } from "./src/loop-recorder.js";
import { EventBus } from "./src/event-bus.js";

const app = express();
app.use(cors());
app.use(express.json());

const chords = new ChordEngine();
const player = new StylePlayer();
const recorder = new LoopRecorder();
const bus = new EventBus();

const state = {
  ok: true,
  section: "Intro",
  tempo: 120,
  chord: "Cm",
  style: "Oriental Pop",
  devices: ["Generic MIDI", "UAOS Virtual MIDI"],
  phase: "2/3"
};

app.get("/", (req,res)=>res.json({ ok:true, service:"UAOS Backend" }));
app.get("/health", (req,res)=>res.json({ ok:true, state, player:player.status(), recorder:recorder.status(), time:new Date().toISOString() }));
app.get("/events", (req,res)=>res.json({ ok:true, events:bus.list() }));
app.get("/devices", (req,res)=>res.json({ ok:true, devices:state.devices }));

app.post("/state", (req,res)=>{
  Object.assign(state, req.body || {});
  bus.push("state", req.body || {});
  res.json({ ok:true, state });
});

app.post("/chord", (req,res)=>{
  const result = chords.detect(req.body.notes || []);
  state.chord = result.chord;
  bus.push("chord", result);
  recorder.add({ type:"chord", result });
  res.json(result);
});

app.post("/style/play", (req,res)=>{
  const result = player.play(req.body.style || state.style);
  bus.push("style-play", result);
  res.json(result);
});

app.post("/style/stop", (req,res)=>{
  const result = player.stop();
  bus.push("style-stop", result);
  res.json(result);
});

app.post("/rec/start", (req,res)=>res.json(recorder.start()));
app.post("/rec/stop", (req,res)=>res.json(recorder.stop()));

const server = app.listen(process.env.PORT || 8080, () => {
  console.log("UAOS backend running on http://localhost:" + (process.env.PORT || 8080));
});

const wss = new WebSocketServer({ server });
attachRealtime(wss, state);

setInterval(()=> {
  const s = player.tick();
  if(s.playing) bus.push("tick", s);
}, 1000);