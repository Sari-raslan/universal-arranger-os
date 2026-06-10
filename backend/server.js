import express from "express";
import { realAiArrange } from "./src/real-ai.js";
import { audioRenderPlan } from "./src/real-audio.js";
import { midiHardwarePlan } from "./src/real-midi.js";
import { binaryExportPlan } from "./src/binary-export.js";
import cors from "cors";
import { WebSocketServer } from "ws";
import { attachRealtime } from "./src/realtime.js";
import { ChordEngine } from "./src/chord-engine.js";
import { StylePlayer } from "./src/style-player.js";
import { LoopRecorder } from "./src/loop-recorder.js";
import { EventBus } from "./src/event-bus.js";
import { Sequencer } from "./src/sequencer.js";
import { Mixer } from "./src/mixer.js";
import { MidiClock } from "./src/midi-clock.js";
import { SongArranger } from "./src/song-arranger.js";
import { MidiMap } from "./src/midi-map.js";
import { getPresets, getPreset } from "./src/preset-bank.js";
import { diagnostics } from "./src/diagnostics.js";
import { listProfiles, getProfile } from "./src/device-profiles.js";
import { listTemplates, getTemplate } from "./src/project-templates.js";
import { createSessionReport } from "./src/session-report.js";
import { exportMidiDraft } from "./src/midi-exporter.js";
import { exportStyleDraft } from "./src/style-exporter.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const chords = new ChordEngine();
const player = new StylePlayer();
const recorder = new LoopRecorder();
const bus = new EventBus();
const sequencer = new Sequencer();
const mixer = new Mixer();
const clock = new MidiClock();
const song = new SongArranger();
const midiMap = new MidiMap();

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

function fullStatus() {
  return {
    ok: true,
    state,
    player: player.status(),
    recorder: recorder.status(),
    sequencer: sequencer.status(),
    mixer: mixer.status(),
    clock: clock.status(),
    song: song.status(),
    midiMap: midiMap.status(),
    time: new Date().toISOString()
  };
}

app.get("/", (req, res) => res.json({ ok: true, service: "UAOS Backend" }));
app.get("/health", (req, res) => res.json(fullStatus()));
app.get("/status", (req, res) => res.json(fullStatus()));
app.get("/diagnostics", (req, res) => res.json(diagnostics({ state, player, recorder, sequencer, mixer, clock, song, midiMap })));
app.get("/events", (req, res) => res.json({ ok: true, events: bus.list() }));
app.get("/devices", (req, res) => res.json({ ok: true, profiles: listProfiles() }));
app.get("/device/:name", (req, res) => res.json({ ok: true, profile: getProfile(req.params.name) }));
app.get("/presets", (req, res) => res.json({ ok: true, presets: getPresets() }));
app.get("/templates", (req, res) => res.json({ ok: true, templates: listTemplates() }));

app.post("/template/apply", (req, res) => {
  const t = getTemplate(req.body.id);
  state.style = t.style;
  state.tempo = t.tempo;
  state.chord = t.chord;
  state.section = t.sections[0] || "Intro";
  bus.push("template", t);
  res.json({ ok: true, template: t, state });
});

app.post("/preset/apply", (req, res) => {
  const p = getPreset(req.body.id);
  state.style = p.name;
  state.tempo = p.tempo;
  state.chord = p.defaultChord;
  bus.push("preset", p);
  res.json({ ok: true, preset: p, state });
});

app.get("/midi-map", (req, res) => res.json(midiMap.status()));
app.post("/midi-map", (req, res) => res.json(midiMap.set(req.body.key, req.body.cc)));

app.post("/state", (req, res) => {
  Object.assign(state, req.body || {});
  bus.push("state", req.body || {});
  res.json({ ok: true, state });
});

app.post("/chord", (req, res) => {
  const result = chords.detect(req.body.notes || []);
  state.chord = result.chord;
  bus.push("chord", result);
  recorder.add({ type: "chord", result });
  res.json(result);
});

app.post("/style/play", (req, res) => {
  const result = player.play(req.body.style || state.style);
  sequencer.start();
  clock.start(state.tempo);
  bus.push("style-play", result);
  res.json(result);
});

app.post("/style/stop", (req, res) => {
  const result = player.stop();
  sequencer.stop();
  clock.stop();
  bus.push("style-stop", result);
  res.json(result);
});

app.post("/rec/start", (req, res) => res.json(recorder.start()));
app.post("/rec/stop", (req, res) => res.json(recorder.stop()));

app.get("/sequencer", (req, res) => res.json(sequencer.status()));
app.post("/sequencer/start", (req, res) => res.json(sequencer.start()));
app.post("/sequencer/stop", (req, res) => res.json(sequencer.stop()));
app.post("/sequencer/toggle", (req, res) => res.json(sequencer.toggle(req.body.track, req.body.step)));

app.get("/mixer", (req, res) => res.json(mixer.status()));
app.post("/mixer", (req, res) => res.json(mixer.set(req.body.name, req.body.patch || {})));

app.get("/song", (req, res) => res.json(song.status()));
app.post("/song/generate", (req, res) => res.json(song.generate(req.body.style || state.style)));

app.get("/export", (req, res) => res.json({
  ok: true,
  project: {
    state,
    mixer: mixer.status(),
    sequencer: sequencer.status(),
    recorder: recorder.status(),
    clock: clock.status(),
    song: song.status(),
    midiMap: midiMap.status()
  }
}));

app.get("/report", (req, res) => res.json(createSessionReport({ state, player, recorder, sequencer, mixer, clock, song, midiMap })));

app.post("/import", (req, res) => {
  const project = req.body.project || {};
  if (project.state) Object.assign(state, project.state);
  bus.push("import", project);
  res.json({ ok: true, state });
});


function projectSnapshot(){
  return {
    state,
    mixer:mixer.status(),
    sequencer:sequencer.status(),
    recorder:recorder.status(),
    clock:clock.status(),
    song:song.status(),
    midiMap:midiMap.status()
  };
}

app.get("/export/midi", (req,res)=>res.json(exportMidiDraft(projectSnapshot())));
app.get("/export/style/:target", (req,res)=>res.json(exportStyleDraft(projectSnapshot(), req.params.target)));


app.get("/ai/analyze", (req,res)=>res.json({
  ok:true,
  engine:"UAOS AI Mock",
  style:state.style,
  tempo:state.tempo,
  chord:state.chord,
  sections:["Intro","Main A","Main B","Fill","Ending"],
  suggestions:["Generate arranger variation","Improve bass movement","Prepare MIDI export"]
}));

app.get("/audio/status", (req,res)=>res.json({
  ok:true,
  engine:"UAOS Audio Mock",
  running:false,
  sampleRate:48000
}));

app.get("/audio/render", (req,res)=>res.json({
  ok:true,
  type:"audio-render-draft",
  warning:"Mock render. Native renderer comes later.",
  project:projectSnapshot()
}));

app.get("/phase3/report", (req,res)=>res.json({
  ok:true,
  phase:"3 foundation",
  ai:"mock ready",
  audio:"mock ready",
  bridge:"localhost:8090",
  exports:["midi","korg","yamaha","roland","ketron"],
  generatedAt:new Date().toISOString()
}));


app.post("/phase4/ai/arrange", async (req,res)=>res.json(await realAiArrange(req.body || state)));
app.get("/phase4/audio/plan", (req,res)=>res.json(audioRenderPlan(projectSnapshot())));
app.get("/phase4/midi/hardware", (req,res)=>res.json(midiHardwarePlan()));
app.get("/phase4/export/binary/:target", (req,res)=>res.json(binaryExportPlan(req.params.target, projectSnapshot())));
app.get("/phase4/report", (req,res)=>res.json({
  ok:true,
  phase:"4 real integration foundation",
  ai:process.env.OPENAI_API_KEY ? "real API configured" : "fallback until OPENAI_API_KEY is set",
  audio:"native audio plan ready",
  midi:"hardware bridge plan ready",
  binaryExport:"writer foundation ready",
  generatedAt:new Date().toISOString()
}));

const server = app.listen(process.env.PORT || 8080, () => {
  console.log("UAOS backend running on http://localhost:" + (process.env.PORT || 8080));
});

const wss = new WebSocketServer({ server });
attachRealtime(wss, state);

setInterval(() => {
  const p = player.tick();
  const s = sequencer.tick();
  const c = clock.tick();
  if (p.playing) bus.push("tick", { player: p, sequencer: s, clock: c });
}, 600);