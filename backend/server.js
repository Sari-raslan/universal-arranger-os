const express=require("express");const http=require("http");const cors=require("cors");const{MidiRuntime}=require("../midi/MidiRuntime.cjs");const{ChordDetector}=require("../arranger/ChordDetector.cjs");const{StylePlayer}=require("../arranger/StylePlayer.cjs");const{SamplerEngine}=require("../sampler/SamplerEngine.cjs");const app=express();const server=http.createServer(app);const PORT=process.env.PORT||8090;app.use(cors());app.use(express.json());const midi=new MidiRuntime();const chordDetector=new ChordDetector();const stylePlayer=new StylePlayer();const sampler=new SamplerEngine();midi.start();const runtime={core:{version:"0.1.0-alpha",status:"active"},midi,arranger:{loaded:true,transitions:"foundation",chordDetection:true,stylePlayer:stylePlayer.status()},sampler:sampler.status(),hardware:{loaded:true,devices:[]},ai:{loaded:true,analysis:"pending"}};app.get("/",(req,res)=>res.json({ok:true,app:"UAOS HyperStation",runtime:"Core Runtime Alpha"}));app.get("/health",(req,res)=>res.json({ok:true,backend:true,timestamp:new Date().toISOString()}));app.get("/runtime",(req,res)=>res.json({core:runtime.core,midi:runtime.midi.status(),chord:chordDetector.detect(),arranger:runtime.arranger,sampler:runtime.sampler,hardware:runtime.hardware,ai:runtime.ai}));app.get("/runtime/modules",(req,res)=>res.json(["core","midi","chord","arranger","sampler","hardware","ai"]));app.get("/runtime/midi",(req,res)=>res.json(runtime.midi.status()));app.post("/runtime/midi/input/:name",(req,res)=>res.json(runtime.midi.addInput(req.params.name)));app.post("/runtime/midi/output/:name",(req,res)=>res.json(runtime.midi.addOutput(req.params.name)));app.post("/runtime/midi/route/:inputId/:outputId",(req,res)=>res.json(runtime.midi.route(req.params.inputId,req.params.outputId,req.query.channel||"all")));app.post("/runtime/midi/noteon/:note",(req,res)=>{const note=Number(req.params.note);const midiEvent=runtime.midi.noteOn(note);const chord=chordDetector.noteOn(note);res.json({ok:true,midiEvent,chord})});app.post("/runtime/midi/noteoff/:note",(req,res)=>{const note=Number(req.params.note);const midiEvent=runtime.midi.noteOff(note);const chord=chordDetector.noteOff(note);res.json({ok:true,midiEvent,chord})});app.post("/runtime/chord/noteon/:note",(req,res)=>res.json(chordDetector.noteOn(Number(req.params.note))));app.post("/runtime/chord/noteoff/:note",(req,res)=>res.json(chordDetector.noteOff(Number(req.params.note))));app.get("/runtime/chord",(req,res)=>res.json(chordDetector.detect()));app.get("/runtime/style",(req,res)=>res.json(stylePlayer.status()));app.post("/runtime/style/load/:name",(req,res)=>res.json(stylePlayer.loadStyle(req.params.name)));app.post("/runtime/style/start",(req,res)=>res.json(stylePlayer.start()));app.post("/runtime/style/stop",(req,res)=>res.json(stylePlayer.stop()));app.post("/runtime/style/tempo/:bpm",(req,res)=>res.json(stylePlayer.setTempo(Number(req.params.bpm))));app.post("/runtime/style/variation/:v",(req,res)=>res.json(stylePlayer.setVariation(req.params.v)));app.post("/runtime/style/fill",(req,res)=>res.json(stylePlayer.triggerFill()));
app.get("/runtime/sampler",(req,res)=>res.json(sampler.status()));app.post("/runtime/sampler/load/:name",(req,res)=>res.json(sampler.loadKit(req.params.name)));app.post("/runtime/sampler/trigger/:sample/:note",(req,res)=>res.json(sampler.trigger(req.params.sample,Number(req.params.note),100)));app.post("/runtime/sampler/volume/:value",(req,res)=>res.json(sampler.setVolume(Number(req.params.value))));app.post("/runtime/sampler/stop",(req,res)=>res.json(sampler.stopAll()));

app.get("/runtime/orchestrator",(req,res)=>res.json(orchestrator.runtimeStatus()));

app.post("/runtime/orchestrator/noteon/:note",(req,res)=>{
  res.json(orchestrator.noteOn(Number(req.params.note)));
});

app.post("/runtime/orchestrator/noteoff/:note",(req,res)=>{
  res.json(orchestrator.noteOff(Number(req.params.note)));
});

app.get("/runtime/timing",(req,res)=>res.json(timing.status()));app.post("/runtime/timing/start",(req,res)=>res.json(timing.start()));app.post("/runtime/timing/stop",(req,res)=>res.json(timing.stop()));app.post("/runtime/timing/bpm/:bpm",(req,res)=>res.json(timing.setBpm(req.params.bpm)));app.post("/runtime/timing/tick/:ticks",(req,res)=>res.json(timing.advance(req.params.ticks)));

app.get("/runtime/realtime",(req,res)=>{
  res.json(realtime.stats());
});

app.post("/runtime/realtime/broadcast/:event",(req,res)=>{
  realtime.broadcast(req.params.event,{
    source:"api"
  });

  res.json({
    ok:true,
    event:req.params.event
  });
});

app.get("/api/status",(req,res)=>res.json({ok:true,runtime:{core:runtime.core,midi:runtime.midi.status(),chord:chordDetector.detect(),arranger:runtime.arranger,sampler:runtime.sampler,hardware:runtime.hardware,ai:runtime.ai}}));server.listen(PORT,()=>console.log("UAOS Runtime Backend => http://localhost:"+PORT));