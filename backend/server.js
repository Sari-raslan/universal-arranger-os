import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { attachRealtime } from "./src/realtime.js";
import { ChordEngine } from "./src/chord-engine.js";
import { StylePlayer } from "./src/style-player.js";
import { LoopRecorder } from "./src/loop-recorder.js";
import { EventBus } from "./src/event-bus.js";
import { Sequencer } from "./src/sequencer.js";
import { Mixer } from "./src/mixer.js";
import { listProfiles, getProfile } from "./src/device-profiles.js";

const app = express();
app.use(cors());
app.use(express.json());

const chords = new ChordEngine();
const player = new StylePlayer();
const recorder = new LoopRecorder();
const bus = new EventBus();
const sequencer = new Sequencer();
const mixer = new Mixer();

const state = {
  ok: true,
  section: "Intro",
  tempo: 120,
  chord: "Cm",
  style: "Oriental Pop",
  device: "Generic MIDI",
  devices: Object.keys(listProfiles()),
  phase: "2/3"
};

app.get("/", (req,res)=>res.json({ ok:true, service:"UAOS Backend" }));
app.get("/health", (req,res)=>res.json({
  ok:true, state, player:player.status(), recorder:recorder.status(),
  sequencer:sequencer.status(), mixer:mixer.status(), time:new Date().toISOString()
}));
app.get("/events", (req,res)=>res.json({ ok:true, events:bus.list() }));
app.get("/devices", (req,res)=>res.json({ ok:true, profiles:listProfiles() }));
app.get("/device/:name", (req,res)=>res.json({ ok:true, profile:getProfile(req.params.name) }));

app.post("/state", (req,res)=>{ Object.assign(state, req.body || {}); bus.push("state", req.body || {}); res.json({ ok:true, state }); });
app.post("/chord", (req,res)=>{ const result = chords.detect(req.body.notes || []); state.chord = result.chord; bus.push("chord", result); recorder.add({ type:"chord", result }); res.json(result); });
app.post("/style/play", (req,res)=>{ const result = player.play(req.body.style || state.style); sequencer.start(); bus.push("style-play", result); res.json(result); });
app.post("/style/stop", (req,res)=>{ const result = player.stop(); sequencer.stop(); bus.push("style-stop", result); res.json(result); });
app.post("/rec/start", (req,res)=>res.json(recorder.start()));
app.post("/rec/stop", (req,res)=>res.json(recorder.stop()));

app.get("/sequencer", (req,res)=>res.json(sequencer.status()));
app.post("/sequencer/start", (req,res)=>res.json(sequencer.start()));
app.post("/sequencer/stop", (req,res)=>res.json(sequencer.stop()));
app.post("/sequencer/toggle", (req,res)=>res.json(sequencer.toggle(req.body.track, req.body.step)));

app.get("/mixer", (req,res)=>res.json(mixer.status()));
app.post("/mixer", (req,res)=>res.json(mixer.set(req.body.name, req.body.patch || {})));

app.get("/export", (req,res)=>res.json({ ok:true, project:{ state, mixer:mixer.status(), sequencer:sequencer.status(), recorder:recorder.status() } }));

const server = app.listen(process.env.PORT || 8080, () => {
  console.log("UAOS backend running on http://localhost:" + (process.env.PORT || 8080));
});

const wss = new WebSocketServer({ server });
attachRealtime(wss, state);

setInterval(()=> {
  const p = player.tick();
  const s = sequencer.tick();
  if(p.playing) bus.push("tick", { player:p, sequencer:s });
}, 600);