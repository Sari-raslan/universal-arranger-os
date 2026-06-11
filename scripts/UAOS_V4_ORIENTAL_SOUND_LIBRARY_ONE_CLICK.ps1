$ErrorActionPreference="Continue"
$Repo=(Get-Location).Path
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"

function Log($m){
  $l="[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$m
  Write-Host $l -ForegroundColor Cyan
  Add-Content "$Repo\reports\UAOS_V4_ORIENTAL_SOUND_LIBRARY_$Stamp.log" $l
}

function W($p,$t){
  $full=Join-Path $Repo $p
  $dir=Split-Path $full -Parent
  if(!(Test-Path $dir)){New-Item -ItemType Directory -Force $dir | Out-Null}
  Set-Content $full $t -Encoding UTF8
}

Log "UAOS V4 ORIENTAL SOUND LIBRARY START"

W "sound-library\oriental\uaos-oriental-instruments.json" '{
  "library":"UAOS Oriental Pro",
  "version":"0.1.0",
  "rule":"Use original or properly licensed samples only",
  "instruments":[
    {"id":"oud-pro","name":"Oud Pro","family":"strings","articulations":["normal","legato","slide","tremolo","ornament","mute"],"velocityLayers":6,"roundRobin":4},
    {"id":"qanun-pro","name":"Qanun Pro","family":"plucked","articulations":["normal","tremolo","glissando","ornament","mute"],"velocityLayers":6,"roundRobin":4},
    {"id":"nay-breath","name":"Nay Breath","family":"winds","articulations":["normal","breath","legato","fall","grace"],"velocityLayers":5,"roundRobin":3},
    {"id":"kawala","name":"Kawala","family":"winds","articulations":["normal","breath","legato","fall"],"velocityLayers":5,"roundRobin":3},
    {"id":"oriental-strings","name":"Oriental Strings","family":"ensemble","articulations":["legato","staccato","tremolo","slide","ornament"],"velocityLayers":7,"roundRobin":4}
  ]
}'

W "sound-library\gulf\uaos-gulf-library.json" '{
  "library":"UAOS Gulf Pro",
  "version":"0.1.0",
  "focus":["khaliji","saudi","kuwaiti","iraqi-gulf","emirati","bahraini"],
  "instruments":[
    {"id":"gulf-strings","name":"Gulf Strings","articulations":["legato","glide","tremolo","scoop","ornament"],"velocityLayers":7},
    {"id":"mirwas-kit","name":"Mirwas Kit","family":"percussion","hits":["dum","tak","slap","roll","rim"],"roundRobin":6},
    {"id":"tabl-khaliji","name":"Khaliji Tabl","family":"percussion","hits":["dum","tak","open","mute","roll"],"roundRobin":6},
    {"id":"gulf-claps","name":"Gulf Claps","family":"percussion","hits":["single","group","wide","tight"],"roundRobin":8}
  ],
  "grooves":[
    {"id":"khaliji-1","name":"Khaliji 1","meter":"4/4","feel":"swing","bpm":[80,120]},
    {"id":"khaliji-2","name":"Khaliji 2","meter":"4/4","feel":"heavy","bpm":[70,110]},
    {"id":"saudi-samri","name":"Saudi Samri","meter":"6/8","feel":"traditional","bpm":[70,105]},
    {"id":"iraqi-gulf","name":"Iraqi Gulf","meter":"4/4","feel":"driving","bpm":[90,130]}
  ]
}'

W "sound-library\maqam\uaos-maqam-tuning.json" '{
  "tunings":[
    {"name":"Nahawand","intervals":[0,2,3,5,7,8,10]},
    {"name":"Hijaz","intervals":[0,1,4,5,7,8,10]},
    {"name":"Bayati","intervals":[0,1.5,3,5,7,8,10]},
    {"name":"Rast","intervals":[0,2,3.5,5,7,9,10.5]},
    {"name":"Saba","intervals":[0,1.5,3,4,7,8,10]},
    {"name":"Kurd","intervals":[0,1,3,5,7,8,10]},
    {"name":"Ajam","intervals":[0,2,4,5,7,9,11]}
  ],
  "microtonalSupport":"quarter-tone-ready"
}'

W "sound-library\articulations\uaos-articulation-engine.json" '{
  "engine":"UAOS Articulation Engine",
  "version":"0.1.0",
  "rules":[
    {"name":"legato","trigger":"overlap-notes","effect":"smooth transition"},
    {"name":"slide","trigger":"velocity>105","effect":"pitch slide"},
    {"name":"ornament","trigger":"short grace note","effect":"arabic ornament"},
    {"name":"tremolo","trigger":"keyswitch C0","effect":"repeated articulation"},
    {"name":"fall","trigger":"keyswitch D0","effect":"downward fall"},
    {"name":"scoop","trigger":"keyswitch E0","effect":"upward scoop"}
  ]
}'

W "sound-library\README.md" '# UAOS V4 Oriental & Gulf Sound Library

This is the design foundation for UAOS original sound libraries.

Important:
- Do not copy proprietary samples.
- Use original recordings or properly licensed samples.
- Focus on Arabic, Oriental and Gulf articulation realism.

Core libraries:
- UAOS Oriental Pro
- UAOS Gulf Pro
- UAOS Arabic Percussion
- UAOS Maqam Tuning
- UAOS Articulation Engine
'

$Server='const express=require("express");const cors=require("cors");const fs=require("fs");const path=require("path");const app=express();const PORT=process.env.PORT||8090;app.use(cors());app.use(express.json({limit:"20mb"}));function readJson(p,fallback){try{return JSON.parse(fs.readFileSync(path.join(__dirname,"..",p),"utf8"))}catch{return fallback}}const sound={oriental:readJson("sound-library/oriental/uaos-oriental-instruments.json",{}),gulf:readJson("sound-library/gulf/uaos-gulf-library.json",{}),maqam:readJson("sound-library/maqam/uaos-maqam-tuning.json",{}),articulations:readJson("sound-library/articulations/uaos-articulation-engine.json",{})};const runtime={phase:"V4 Oriental & Gulf Sound Library Foundation",modules:{soundLibrary:"v4-ready",oriental:"ready",gulf:"ready",maqam:"ready",articulations:"ready",sampler:"foundation"},sound};app.get("/",(_,res)=>res.json({ok:true,runtime}));app.get("/health",(_,res)=>res.json({ok:true,time:new Date().toISOString()}));app.get("/api/status",(_,res)=>res.json({ok:true,state:runtime}));app.get("/api/sounds",(_,res)=>res.json({ok:true,sound}));app.get("/api/sounds/oriental",(_,res)=>res.json({ok:true,library:sound.oriental}));app.get("/api/sounds/gulf",(_,res)=>res.json({ok:true,library:sound.gulf}));app.get("/api/maqam",(_,res)=>res.json({ok:true,maqam:sound.maqam}));app.get("/api/articulations",(_,res)=>res.json({ok:true,articulations:sound.articulations}));app.listen(PORT,()=>console.log("UAOS V4 sound backend http://localhost:"+PORT));'
W "backend\server.js" $Server

W "backend\health-check.js" 'const http=require("http");const urls=["http://localhost:8090/health","http://localhost:8090/api/status","http://localhost:8090/api/sounds","http://localhost:8090/api/sounds/gulf","http://localhost:8090/api/maqam"];function c(u){return new Promise(r=>{http.get(u,x=>r(u+" => "+x.statusCode)).on("error",e=>r(u+" => FAIL "+e.message));});}(async()=>{for(const u of urls)console.log(await c(u));})();'

W "uaos-live-clean\src\main.jsx" 'import React,{useEffect,useState}from"react";import{createRoot}from"react-dom/client";const card={background:"#111827",border:"1px solid #334155",borderRadius:22,padding:22,marginBottom:16};const btn={padding:"11px 15px",borderRadius:12,border:"1px solid #334155",background:"#1f2937",color:"white",fontWeight:800,cursor:"pointer"};function App(){const[status,setStatus]=useState(null);const[sound,setSound]=useState(null);const[tab,setTab]=useState("oriental");useEffect(()=>{fetch("http://localhost:8090/api/status").then(r=>r.json()).then(setStatus).catch(()=>{});fetch("http://localhost:8090/api/sounds").then(r=>r.json()).then(setSound).catch(()=>{})},[]);const oriental=sound?.sound?.oriental?.instruments||[];const gulf=sound?.sound?.gulf?.instruments||[];const grooves=sound?.sound?.gulf?.grooves||[];const maqam=sound?.sound?.maqam?.tunings||[];const arts=sound?.sound?.articulations?.rules||[];return <main style={{minHeight:"100vh",background:"#050816",color:"white",fontFamily:"Arial",padding:24}}><section style={card}><h1 style={{fontSize:46,margin:0}}>UAOS V4 Sound Library</h1><h2 style={{color:"#93c5fd"}}>Oriental & Gulf Pro Sound Engine</h2><p>Original Arabic, Oriental and Khaliji sound library foundation with maqam tuning, articulations, grooves and sampler-ready manifests.</p><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{["oriental","gulf","maqam","articulation"].map(x=><button key={x} onClick={()=>setTab(x)} style={{...btn,background:tab===x?"#2563eb":"#1f2937"}}>{x}</button>)}</div></section>{tab==="oriental"&&<section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>{oriental.map(i=><div key={i.id} style={card}><h2>{i.name}</h2><p>Family: {i.family}</p><p>Velocity Layers: {i.velocityLayers}</p><p>Round Robin: {i.roundRobin}</p><p style={{color:"#86efac"}}>{i.articulations.join(", ")}</p></div>)}</section>}{tab==="gulf"&&<><section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>{gulf.map(i=><div key={i.id} style={card}><h2>{i.name}</h2><p>{i.family}</p><p style={{color:"#86efac"}}>{(i.articulations||i.hits||[]).join(", ")}</p></div>)}</section><section style={card}><h2>Khaliji Groove Engine</h2>{grooves.map(g=><div key={g.id} style={{borderBottom:"1px solid #334155",padding:10}}><b>{g.name}</b> · {g.meter} · {g.feel} · BPM {g.bpm.join("-")}</div>)}</section></>}{tab==="maqam"&&<section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>{maqam.map(m=><div key={m.name} style={card}><h2>{m.name}</h2><p style={{color:"#93c5fd"}}>{m.intervals.join(" · ")}</p></div>)}</section>}{tab==="articulation"&&<section style={card}><h2>Articulation Engine</h2>{arts.map(a=><div key={a.name} style={{borderBottom:"1px solid #334155",padding:10}}><b>{a.name}</b> — {a.trigger} → <span style={{color:"#86efac"}}>{a.effect}</span></div>)}</section>}<section style={card}><h2>Backend JSON</h2><pre style={{background:"#020617",borderRadius:14,padding:16,overflow:"auto"}}>{JSON.stringify(status,null,2)}</pre></section></main>}createRoot(document.getElementById("root")).render(<App/>);'

W "agent-output\UAOS_V4_SOUND_LIBRARY_REPORT.md" 'UAOS V4 SOUND LIBRARY REPORT

DONE:
- Oriental instrument manifest
- Gulf instrument manifest
- Khaliji groove engine foundation
- Maqam tuning presets
- Articulation engine rules
- Backend sound APIs
- Frontend sound library tab
- Build and push automation

NEXT:
- Record or license real samples
- Add audio playback engine
- Add SFZ/Sampler mapping export
- Add key-switch UI
- Add Gulf rhythm MIDI pattern generator
'

Log "BUILD APP"
npm run build --prefix uaos-live-clean

Log "HEALTH"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$p=Start-Process node -ArgumentList "backend/server.js" -PassThru -WindowStyle Hidden
Start-Sleep 4
node backend/health-check.js | Tee-Object "$Repo\reports\v4-sound-health-$Stamp.txt"
try{Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue}catch{}

Log "GIT"
git add .
git commit -m "Add UAOS V4 oriental and gulf sound library foundation"
git push origin master

Log "START LOCAL"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; node backend/server.js"
Start-Sleep 3
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo\uaos-live-clean'; npm run dev -- --host 127.0.0.1 --port 5199 --force"
Start-Sleep 5
Start-Process "http://127.0.0.1:5199"

Log "DONE"
notepad "$Repo\agent-output\UAOS_V4_SOUND_LIBRARY_REPORT.md"
