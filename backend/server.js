
const express=require("express");
const cors=require("cors");

const { MidiRuntime } = require("../midi/MidiRuntime.cjs");
const { ChordDetector } = require("../arranger/ChordDetector.cjs");
const { StylePlayer } = require("../arranger/StylePlayer.cjs");
const { SamplerEngine } = require("../sampler/SamplerEngine.cjs");
const { HardwareLayer } = require("../hardware/HardwareLayer.cjs");
const { AiMusicLayer } = require("../ai/AiMusicLayer.cjs");
const { MixerEngine } = require("../mixer/MixerEngine.cjs");const { ProjectStore } = require("../project/ProjectStore.cjs");const { RuntimeDiagnostics } = require("../diagnostics/RuntimeDiagnostics.cjs");const { ReleaseGate } = require("../release/ReleaseGate.cjs");

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
const mixer=new MixerEngine();const projectStore=new ProjectStore(process.cwd());const diagnostics=new RuntimeDiagnostics({midi,chordDetector,stylePlayer,sampler,hardware,ai,mixer});const releaseGate=new ReleaseGate(diagnostics);

midi.start();

app.get("/",(req,res)=>res.json({ok:true,app:"UAOS HyperStation",runtime:"Core Runtime Alpha"}));
app.get("/health",(req,res)=>res.json({ok:true,backend:true,timestamp:new Date().toISOString()}));

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

app.get("/runtime/mixer",(req,res)=>res.json(mixer.status()));
app.post("/runtime/mixer/channel/:type/:name",(req,res)=>res.json(mixer.addChannel(req.params.name,req.params.type)));
app.post("/runtime/mixer/volume/:channelId/:value",(req,res)=>res.json(mixer.setVolume(req.params.channelId,req.params.value)));
app.post("/runtime/mixer/pan/:channelId/:value",(req,res)=>res.json(mixer.setPan(req.params.channelId,req.params.value)));
app.post("/runtime/mixer/mute/:channelId/:state",(req,res)=>res.json(mixer.mute(req.params.channelId,req.params.state==="true")));
app.post("/runtime/mixer/fx/:channelId/:effect",(req,res)=>res.json(mixer.addEffect(req.params.channelId,req.params.effect)));

app.get("/runtime/projects",(req,res)=>res.json(projectStore.list()));app.post("/runtime/projects/save/:name",(req,res)=>res.json(projectStore.save(req.params.name,{runtime:"Core Runtime Alpha",savedVia:"api"})));app.get("/runtime/projects/load/:name",(req,res)=>res.json(projectStore.load(req.params.name)));
app.get("/runtime/diagnostics",(req,res)=>res.json(diagnostics.run()));
app.get("/runtime/release-gate",(req,res)=>res.json(releaseGate.validate()));
app.get("/api/status",(req,res)=>res.json({ok:true,runtime:"Core Runtime Alpha"}));

app.listen(PORT,()=>console.log("UAOS Runtime Backend => [http://localhost:"+PORT](http://localhost:%22+PORT)));
