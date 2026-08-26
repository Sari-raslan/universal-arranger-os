const express=require("express");const fs=require("fs");const path=require("path");const crypto=require("crypto");const{pathToFileURL}=require("url");
const ROOT=process.env.UAOS_PILOT_ROOT||path.join(__dirname,"..");
const DATA=process.env.UAOS_PILOT_DATA||path.join(ROOT,"DATA");
const APP=path.join(ROOT,"RUNTIME","app");
const PORT=Number(process.env.PORT||5200);
const HOST="127.0.0.1";
const VERSION="v12-pilot-rc1";
fs.mkdirSync(DATA,{recursive:true});
const app=express();app.use(express.json());
let sku=null;async function loadSku(){if(!sku)sku=await import(pathToFileURL(path.join(ROOT,"PRODUCT/backend/src/sku/midiToolkitSku.js")).href);return sku;}
app.get("/api/pilot/health",(_q,r)=>r.json({ok:true,product:"UAOS MIDI Toolkit",version:VERSION,mode:"PRIVATE_PILOT_RC"}));
app.get("/api/sku/midi-toolkit/status",async(_q,r)=>{try{const m=await loadSku();r.json({ok:true,...m.getMidiProductStatus?m.getMidiProductStatus():m.getSingyProductStatus()})}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.post("/api/sku/midi-toolkit/mode/:mode",async(req,r)=>{try{const m=await loadSku();const mode=req.params.mode.toUpperCase();const out=m.runMidiToolkitCustomerMode?m.runMidiToolkitCustomerMode(mode):m.runSingyMode(mode,req.body||{});r.json(out)}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.post("/api/sku/midi-toolkit/workflows/run-all",async(_q,r)=>{try{const m=await loadSku();r.json(m.runAllMidiCustomerWorkflows?m.runAllMidiCustomerWorkflows():m.runAllSingyCustomerWorkflows())}catch(e){r.status(500).json({ok:false,error:e.message})}});
app.get("/api/pilot/diagnostics",async(_q,r)=>{const bundle={exportedAt:new Date().toISOString(),product:"UAOS MIDI Toolkit",version:VERSION,classification:"PRIVATE_PILOT_RC"};const d=path.join(DATA,"diagnostics");fs.mkdirSync(d,{recursive:true});const f=path.join(d,"diagnostics-"+Date.now()+".json");fs.writeFileSync(f,JSON.stringify(bundle,null,2));r.json({ok:true,bundle})});
app.use(express.static(APP));app.get("*",(_q,r)=>r.sendFile(path.join(APP,"index.html")));
app.listen(PORT,HOST,()=>console.log("UAOS MIDI Toolkit pilot",PORT));