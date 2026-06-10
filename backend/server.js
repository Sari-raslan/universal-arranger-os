
const express=require("express");
const cors=require("cors");

const { MidiRuntime } = require("../midi/MidiRuntime.cjs");
const { ChordDetector } = require("../arranger/ChordDetector.cjs");
const { StylePlayer } = require("../arranger/StylePlayer.cjs");
const { SamplerEngine } = require("../sampler/SamplerEngine.cjs");
const { HardwareLayer } = require("../hardware/HardwareLayer.cjs");
const { AiMusicLayer } = require("../ai/AiMusicLayer.cjs");
const { MixerEngine } = require("../mixer/MixerEngine.cjs");
const { RuntimeDiagnostics } = require("../diagnostics/RuntimeDiagnostics.cjs");
const { ReleaseGate } = require("../release/ReleaseGate.cjs");

const app=express();
const PORT=process.env.PORT||8090;

app.use(cors());
app.use(express.json());

const midi=new MidiRuntime();
const chordDetector=new ChordDetector();
const stylePlayer=new StylePlayer();
const sampler=new SamplerEngine();
const hardware=new HardwareLayer();
const ai=new AiMusicLayer();
const mixer=new MixerEngine();

midi.start();

const diagnostics=new RuntimeDiagnostics({
midi,
arranger:stylePlayer,
sampler,
hardware,
ai,
mixer
});

const releaseGate=new ReleaseGate(diagnostics);

app.get("/",(req,res)=>res.json({ok:true,app:"UAOS HyperStation",runtime:"Core Runtime Alpha"}));

app.get("/health",(req,res)=>res.json({
ok:true,
backend:true,
timestamp:new Date().toISOString()
}));

app.get("/runtime",(req,res)=>res.json({
ok:true,
modules:{
midi:midi.status(),
chord:chordDetector.detect(),
arranger:stylePlayer.status(),
sampler:sampler.status(),
hardware:hardware.status(),
ai:ai.status(),
mixer:mixer.status()
}
}));

app.get("/runtime/midi",(req,res)=>res.json(midi.status()));
app.post("/runtime/midi/input/:name",(req,res)=>res.json(midi.addInput(req.params.name)));
app.post("/runtime/midi/output/:name",(req,res)=>res.json(midi.addOutput(req.params.name)));
app.post("/runtime/midi/noteon/:note",(req,res)=>{
const note=Number(req.params.note);
res.json({
ok:true,
midi:midi.noteOn(note),
chord:chordDetector.noteOn(note),
sampler:sampler.trigger("RealtimeVoice",note,100)
});
});
app.post("/runtime/midi/noteoff/:note",(req,res)=>{
const note=Number(req.params.note);
res.json({
ok:true,
midi:midi.noteOff(note),
chord:chordDetector.noteOff(note)
});
});

app.get("/runtime/chord",(req,res)=>res.json(chordDetector.detect()));

app.get("/runtime/style",(req,res)=>res.json(stylePlayer.status()));
app.post("/runtime/style/load/:name",(req,res)=>res.json(stylePlayer.loadStyle(req.params.name)));
app.post("/runtime/style/start",(req,res)=>res.json(stylePlayer.start()));
app.post("/runtime/style/stop",(req,res)=>res.json(stylePlayer.stop()));
app.post("/runtime/style/tempo/:bpm",(req,res)=>res.json(stylePlayer.setTempo(Number(req.params.bpm))));
app.post("/runtime/style/variation/:v",(req,res)=>res.json(stylePlayer.setVariation(req.params.v)));

app.get("/runtime/sampler",(req,res)=>res.json(sampler.status()));
app.post("/runtime/sampler/load/:name",(req,res)=>res.json(sampler.loadKit(req.params.name)));
app.post("/runtime/sampler/trigger/:sample/:note",(req,res)=>res.json(sampler.trigger(req.params.sample,Number(req.params.note),100)));
app.post("/runtime/sampler/volume/:value",(req,res)=>res.json(sampler.setVolume(Number(req.params.value))));
app.post("/runtime/sampler/stop",(req,res)=>res.json(sampler.stopAll()));

app.get("/runtime/hardware",(req,res)=>res.json(hardware.status()));
app.post("/runtime/hardware/add/:type/:name",(req,res)=>res.json(hardware.addDevice(req.params.name,req.params.type)));

app.get("/runtime/ai",(req,res)=>res.json(ai.status()));
app.post("/runtime/ai/analyze/:name",(req,res)=>res.json(ai.analyzeSong(req.params.name)));
app.get("/runtime/ai/suggest/:chord",(req,res)=>res.json(ai.suggestStyle(req.params.chord)));

app.get("/runtime/mixer",(req,res)=>res.json(mixer.status()));
app.post("/runtime/mixer/channel/:type/:name",(req,res)=>res.json(mixer.addChannel(req.params.name,req.params.type)));
app.post("/runtime/mixer/volume/:channelId/:value",(req,res)=>res.json(mixer.setVolume(req.params.channelId,req.params.value)));
app.post("/runtime/mixer/pan/:channelId/:value",(req,res)=>res.json(mixer.setPan(req.params.channelId,req.params.value)));
app.post("/runtime/mixer/mute/:channelId/:state",(req,res)=>res.json(mixer.mute(req.params.channelId,req.params.state==="true")));
app.post("/runtime/mixer/fx/:channelId/:effect",(req,res)=>res.json(mixer.addEffect(req.params.channelId,req.params.effect)));

app.get("/runtime/diagnostics",(req,res)=>res.json(diagnostics.run()));
app.get("/runtime/release-gate",(req,res)=>res.json(releaseGate.validate()));

app.get("/api/status",(req,res)=>res.json({
ok:true,
runtime:"Core Runtime Alpha",
releaseGate:releaseGate.validate()
}));

app.listen(PORT,()=>console.log("UAOS Runtime Backend => [http://localhost:"+PORT](http://localhost:%22+PORT)));
