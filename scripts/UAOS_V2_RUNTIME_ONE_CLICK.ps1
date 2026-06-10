$ErrorActionPreference="Continue"
$Repo = "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$utf8 = New-Object System.Text.UTF8Encoding($false)

Set-Location $Repo
New-Item -ItemType Directory -Force reports | Out-Null

function W($path,$text){
  [System.IO.File]::WriteAllText((Join-Path $Repo $path), $text, $utf8)
}

function Log($m){
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m
  Write-Host $line
  Add-Content "$Repo\reports\UAOS_V2_RUNTIME_ONE_CLICK_$Stamp.log" $line -Encoding UTF8
}

Log "START UAOS V2 RUNTIME ONE CLICK"

Log "Stop old Node"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Log "Write ChordDetector"
W "arranger\ChordDetector.cjs" 'class ChordDetector{constructor(){this.activeNotes=[]}noteOn(note){if(!this.activeNotes.includes(note)){this.activeNotes.push(note)}return this.detect()}noteOff(note){this.activeNotes=this.activeNotes.filter(n=>n!==note);return this.detect()}normalize(notes){return notes.map(n=>n%12).sort((a,b)=>a-b)}detect(){const notes=this.normalize(this.activeNotes);const patterns={major:[0,4,7],minor:[0,3,7],diminished:[0,3,6],augmented:[0,4,8]};const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];for(let root=0;root<12;root++){for(const[type,shape]of Object.entries(patterns)){const expected=shape.map(n=>(n+root)%12).sort((a,b)=>a-b);if(JSON.stringify(expected)===JSON.stringify(notes)){return{detected:true,root:names[root],type,chord:`${names[root]} ${type}`,notes:this.activeNotes}}}}return{detected:false,notes:this.activeNotes}}}module.exports={ChordDetector};'

Log "Write MIDI Runtime"
W "midi\MidiRuntime.cjs" 'class MidiRuntime{constructor(){this.inputs=[];this.outputs=[];this.routes=[];this.events=[];this.started=false}start(){this.started=true;return this.status()}stop(){this.started=false;return this.status()}addInput(name){const input={id:"in_"+Date.now(),name,active:true};this.inputs.push(input);return input}addOutput(name){const output={id:"out_"+Date.now(),name,active:true};this.outputs.push(output);return output}route(inputId,outputId,channel="all"){const route={id:"route_"+Date.now(),inputId,outputId,channel,active:true};this.routes.push(route);return route}noteOn(note=60,velocity=100,channel=1){const event={type:"noteOn",note,velocity,channel,time:Date.now()};this.events.push(event);return event}noteOff(note=60,channel=1){const event={type:"noteOff",note,channel,time:Date.now()};this.events.push(event);return event}status(){return{ok:true,module:"midi",started:this.started,inputs:this.inputs,outputs:this.outputs,routes:this.routes,recentEvents:this.events.slice(-20)}}}module.exports={MidiRuntime};'

Log "Write backend with MIDI + Chord APIs"
W "backend\server.js" 'const express=require("express");const cors=require("cors");const{MidiRuntime}=require("../midi/MidiRuntime.cjs");const{ChordDetector}=require("../arranger/ChordDetector.cjs");const app=express();const PORT=process.env.PORT||8090;app.use(cors());app.use(express.json());const midi=new MidiRuntime();const chordDetector=new ChordDetector();midi.start();const runtime={core:{version:"0.1.0-alpha",status:"active"},midi,arranger:{loaded:true,transitions:"foundation",chordDetection:true},sampler:{loaded:true,playback:"foundation"},hardware:{loaded:true,devices:[]},ai:{loaded:true,analysis:"pending"}};app.get("/",(req,res)=>res.json({ok:true,app:"UAOS HyperStation",runtime:"Core Runtime Alpha"}));app.get("/health",(req,res)=>res.json({ok:true,backend:true,timestamp:new Date().toISOString()}));app.get("/runtime",(req,res)=>res.json({core:runtime.core,midi:runtime.midi.status(),chord:chordDetector.detect(),arranger:runtime.arranger,sampler:runtime.sampler,hardware:runtime.hardware,ai:runtime.ai}));app.get("/runtime/modules",(req,res)=>res.json(["core","midi","chord","arranger","sampler","hardware","ai"]));app.get("/runtime/midi",(req,res)=>res.json(runtime.midi.status()));app.post("/runtime/midi/input/:name",(req,res)=>res.json(runtime.midi.addInput(req.params.name)));app.post("/runtime/midi/output/:name",(req,res)=>res.json(runtime.midi.addOutput(req.params.name)));app.post("/runtime/midi/route/:inputId/:outputId",(req,res)=>res.json(runtime.midi.route(req.params.inputId,req.params.outputId,req.query.channel||"all")));app.post("/runtime/midi/noteon/:note",(req,res)=>{const note=Number(req.params.note);const midiEvent=runtime.midi.noteOn(note);const chord=chordDetector.noteOn(note);res.json({ok:true,midiEvent,chord})});app.post("/runtime/midi/noteoff/:note",(req,res)=>{const note=Number(req.params.note);const midiEvent=runtime.midi.noteOff(note);const chord=chordDetector.noteOff(note);res.json({ok:true,midiEvent,chord})});app.post("/runtime/chord/noteon/:note",(req,res)=>res.json(chordDetector.noteOn(Number(req.params.note))));app.post("/runtime/chord/noteoff/:note",(req,res)=>res.json(chordDetector.noteOff(Number(req.params.note))));app.get("/runtime/chord",(req,res)=>res.json(chordDetector.detect()));app.get("/api/status",(req,res)=>res.json({ok:true,runtime:{core:runtime.core,midi:runtime.midi.status(),chord:chordDetector.detect(),arranger:runtime.arranger,sampler:runtime.sampler,hardware:runtime.hardware,ai:runtime.ai}}));app.listen(PORT,()=>console.log("UAOS Runtime Backend => http://localhost:"+PORT));'

Log "Start backend"
$proc = Start-Process node -ArgumentList "backend/server.js" -PassThru -WindowStyle Hidden
Start-Sleep 5

Log "Runtime health tests"
Invoke-WebRequest -Method GET "http://localhost:8090/health" | Out-File "$Repo\reports\v2-health-$Stamp.txt" -Encoding UTF8
Invoke-WebRequest -Method GET "http://localhost:8090/runtime" | Out-File "$Repo\reports\v2-runtime-$Stamp.txt" -Encoding UTF8
Invoke-WebRequest -Method GET "http://localhost:8090/runtime/midi" | Out-File "$Repo\reports\v2-midi-$Stamp.txt" -Encoding UTF8

Log "MIDI + Chord test C major"
Invoke-WebRequest -Method POST "http://localhost:8090/runtime/midi/input/PA5X" | Out-File "$Repo\reports\v2-test-$Stamp.txt" -Append -Encoding UTF8
Invoke-WebRequest -Method POST "http://localhost:8090/runtime/midi/output/KONTAKT" | Out-File "$Repo\reports\v2-test-$Stamp.txt" -Append -Encoding UTF8
Invoke-WebRequest -Method POST "http://localhost:8090/runtime/midi/noteon/60" | Out-File "$Repo\reports\v2-test-$Stamp.txt" -Append -Encoding UTF8
Invoke-WebRequest -Method POST "http://localhost:8090/runtime/midi/noteon/64" | Out-File "$Repo\reports\v2-test-$Stamp.txt" -Append -Encoding UTF8
Invoke-WebRequest -Method POST "http://localhost:8090/runtime/midi/noteon/67" | Out-File "$Repo\reports\v2-test-$Stamp.txt" -Append -Encoding UTF8
Invoke-WebRequest -Method GET "http://localhost:8090/runtime/chord" | Out-File "$Repo\reports\v2-chord-$Stamp.txt" -Encoding UTF8

try{Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue}catch{}

Log "Git commit"
git add backend/server.js midi/MidiRuntime.cjs arranger/ChordDetector.cjs reports
git commit -m "Connect MIDI runtime with chord detection API"

Log "Push V2"
git push origin v2/core-runtime-alpha

Log "DONE UAOS V2 RUNTIME ONE CLICK"
notepad "$Repo\reports\UAOS_V2_RUNTIME_ONE_CLICK_$Stamp.log"
notepad "$Repo\reports\v2-chord-$Stamp.txt"