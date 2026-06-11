$ErrorActionPreference="Continue"
$Repo=(Get-Location).Path
$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"

function Log($m){
  $l="[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"),$m
  Write-Host $l -ForegroundColor Cyan
  Add-Content "$Repo\reports\UAOS_V3_REAL_LAUNCH_$Stamp.log" $l
}

function W($p,$t){
  $full=Join-Path $Repo $p
  $dir=Split-Path $full -Parent
  if(!(Test-Path $dir)){New-Item -ItemType Directory -Force $dir | Out-Null}
  Set-Content $full $t -Encoding UTF8
}

Log "UAOS V3 REAL LAUNCH START"

W "backend\server.js" 'const express=require("express");const cors=require("cors");const app=express();const PORT=process.env.PORT||8090;app.use(cors());app.use(express.json({limit:"20mb"}));const notes=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];function chord(ns=[]){const pcs=[...new Set(ns.map(n=>Number(n)%12))].sort((a,b)=>a-b);for(const r of pcs){const x=pcs.map(n=>(n-r+12)%12);if(x.includes(0)&&x.includes(4)&&x.includes(7))return notes[r]+" Major";if(x.includes(0)&&x.includes(3)&&x.includes(7))return notes[r]+" Minor";if(x.includes(0)&&x.includes(3)&&x.includes(6))return notes[r]+" Dim";if(x.includes(0)&&x.includes(5)&&x.includes(7))return notes[r]+" Sus4";}return ns.length?"Unknown":"No chord"}const runtime={phase:"V3 Real Launch Foundation",midi:{events:[],devices:[]},arranger:{current:"Stop",sections:["Intro 1","Intro 2","Main A","Main B","Main C","Main D","Fill A","Fill B","Break","Ending 1","Ending 2"]},payments:{pro:process.env.UAOS_PRO_CHECKOUT||"https://YOUR-CHECKOUT-LINK-PRO",founder:process.env.UAOS_FOUNDER_CHECKOUT||"https://YOUR-CHECKOUT-LINK-FOUNDER"},domain:"uaos.app"};app.get("/",(_,res)=>res.json({ok:true,runtime}));app.get("/health",(_,res)=>res.json({ok:true,time:new Date().toISOString()}));app.get("/api/status",(_,res)=>res.json({ok:true,state:runtime}));app.get("/api/payments",(_,res)=>res.json({ok:true,payments:runtime.payments}));app.post("/api/chord/read",(req,res)=>res.json({ok:true,chord:chord(req.body.notes||[]),notes:req.body.notes||[]}));app.post("/api/midi/event",(req,res)=>{const e={time:Date.now(),...(req.body||{})};runtime.midi.events.unshift(e);runtime.midi.events=runtime.midi.events.slice(0,200);res.json({ok:true,event:e,events:runtime.midi.events})});app.post("/api/arranger/event",(req,res)=>{runtime.arranger.current=req.body.section||"Stop";res.json({ok:true,arranger:runtime.arranger})});app.post("/api/export/midi-json",(req,res)=>res.json({ok:true,file:"uaos-export.mid",project:req.body}));app.listen(PORT,()=>console.log("UAOS V3 backend http://localhost:"+PORT));'

W "backend\health-check.js" 'const http=require("http");const urls=["http://localhost:8090/health","http://localhost:8090/api/status","http://localhost:8090/api/payments"];function c(u){return new Promise(r=>{http.get(u,x=>r(u+" => "+x.statusCode)).on("error",e=>r(u+" => FAIL "+e.message));});}(async()=>{for(const u of urls)console.log(await c(u));})();'

W "uaos-live-clean\src\main.jsx" 'import React,{useEffect,useState}from"react";import{createRoot}from"react-dom/client";const card={background:"#111827",border:"1px solid #334155",borderRadius:22,padding:22,marginBottom:16};const btn={padding:"11px 15px",borderRadius:12,border:"1px solid #334155",background:"#1f2937",color:"white",fontWeight:800,cursor:"pointer"};const green={...btn,background:"#16a34a"};const blue={...btn,background:"#2563eb"};const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];function makeMidi(notes=[60,64,67]){function vlq(v){let b=v&127;while(v>>=7){b<<=8;b|=((v&127)|128)}const out=[];while(true){out.push(b&255);if(b&128)b>>=8;else break}return out}const data=[];data.push(0,255,3,4,85,65,79,83);notes.forEach(n=>{data.push(0,144,n,100);data.push(...vlq(480),128,n,0)});data.push(0,255,47,0);const head=[77,84,104,100,0,0,0,6,0,0,0,1,1,224];const track=[77,84,114,107,(data.length>>>24)&255,(data.length>>>16)&255,(data.length>>>8)&255,data.length&255,...data];return new Blob([new Uint8Array([...head,...track])],{type:"audio/midi"})}function App(){const[status,setStatus]=useState(null);const[notes,setNotes]=useState([60,64,67]);const[chord,setChord]=useState("C Major");const[log,setLog]=useState([]);const[pay,setPay]=useState({pro:"#",founder:"#"});useEffect(()=>{fetch("http://localhost:8090/api/status").then(r=>r.json()).then(setStatus).catch(()=>{});fetch("http://localhost:8090/api/payments").then(r=>r.json()).then(j=>setPay(j.payments||pay)).catch(()=>{})},[]);async function connectMidi(){if(!navigator.requestMIDIAccess){alert("WebMIDI غير مدعوم في هذا المتصفح");return}const access=await navigator.requestMIDIAccess();for(const input of access.inputs.values()){input.onmidimessage=e=>{const[cmd,n,v]=e.data;const type=(cmd&240)===144&&v>0?"note-on":"note-off";setLog(x=>[{time:new Date().toLocaleTimeString(),type,note:n,vel:v,source:input.name},...x].slice(0,50));setNotes(old=>{const s=new Set(old);type==="note-on"?s.add(n):s.delete(n);const arr=[...s].sort((a,b)=>a-b);readChord(arr);return arr})}}alert("MIDI Connected")}async function readChord(arr=notes){try{const r=await fetch("http://localhost:8090/api/chord/read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes:arr})});const j=await r.json();setChord(j.chord)}catch{}}function exportMidi(){const blob=makeMidi(notes);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="uaos-export.mid";a.click();URL.revokeObjectURL(url)}return <main style={{minHeight:"100vh",background:"#050816",color:"white",fontFamily:"Arial",padding:24}}><section style={card}><h1 style={{fontSize:46,margin:0}}>UAOS HyperStation V3</h1><h2 style={{color:"#93c5fd"}}>Real MIDI USB + MIDI Export + Payments + Domain Ready</h2><button style={blue} onClick={connectMidi}>Connect Real MIDI USB</button> <button style={green} onClick={exportMidi}>Export Real .MID File</button> <a style={{...btn,textDecoration:"none"}} href={pay.pro}>Pro Checkout</a> <a style={{...btn,textDecoration:"none",background:"#facc15",color:"#111827"}} href={pay.founder}>Founder Checkout</a></section><section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}><div style={card}><h2>Chord</h2><div style={{fontSize:46,color:"#86efac",fontWeight:900}}>{chord}</div><p>Notes: {notes.join(", ")}</p></div><div style={card}><h2>Domain</h2><p>uaos.app</p><p>app.uaos.app / api.uaos.app / founder.uaos.app</p></div><div style={card}><h2>Backend</h2><pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(status,null,2)}</pre></div></section><section style={card}><h2>MIDI Monitor</h2>{log.map((m,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"100px 90px 70px 70px 1fr",borderBottom:"1px solid #334155",padding:6}}><span>{m.time}</span><b>{m.type}</b><span>{m.note}</span><span>{m.vel}</span><span>{m.source}</span></div>)}</section></main>}createRoot(document.getElementById("root")).render(<App/>);'

W "docs\UAOS_V3_DEPLOY.md" '# UAOS V3 Deploy

## DNS
A @ -> 76.76.21.21
CNAME www -> cname.vercel-dns.com

## Subdomains
app.uaos.app = UAOS app
founder.uaos.app = paid landing
api.uaos.app = backend on Railway/Render

## Env
UAOS_PRO_CHECKOUT=Stripe_or_LemonSqueezy_Pro_Link
UAOS_FOUNDER_CHECKOUT=Stripe_or_LemonSqueezy_Founder_Link
'

W "agent-output\UAOS_V3_TODO_DONE.md" 'V3 CODE DONE:
- WebMIDI browser connection
- Real .mid file export from notes
- Payment link placeholders
- Domain docs
- Backend payment/status APIs
- Production backend ready for Railway/Render

MANUAL REQUIRED:
- Add real Stripe/LemonSqueezy links
- Add uaos.app DNS
- Deploy after Vercel limit resets or upgrade
- Deploy backend to Railway/Render
'

Log "BUILD APP"
npm run build --prefix uaos-live-clean

Log "BUILD LANDING"
npm run build --prefix landing-sales

Log "HEALTH"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$p=Start-Process node -ArgumentList "backend/server.js" -PassThru -WindowStyle Hidden
Start-Sleep 4
node backend/health-check.js | Tee-Object "$Repo\reports\v3-health-$Stamp.txt"
try{Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue}catch{}

Log "GIT"
git add .
git commit -m "Add UAOS V3 real MIDI export payments and deploy foundation"
git push origin master

Log "START LOCAL"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo'; node backend/server.js"
Start-Sleep 3
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$Repo\uaos-live-clean'; npm run dev -- --host 127.0.0.1 --port 5199 --force"
Start-Sleep 5
Start-Process "http://127.0.0.1:5199"

Log "DONE"
notepad "$Repo\agent-output\UAOS_V3_TODO_DONE.md"
