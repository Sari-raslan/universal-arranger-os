const API="http://127.0.0.1:5199";
let song=null,presets=[],sampleMap=[];

async function req(p,b){
 const r=await fetch(API+p,{method:b?"POST":"GET",headers:{"Content-Type":"application/json"},body:b?JSON.stringify(b):undefined});
 if(!r.ok)throw new Error(await r.text());
 return r.json();
}
function log(m){logs.innerHTML=`<div>${new Date().toLocaleTimeString()} ${m}</div>`+logs.innerHTML}
function hz(n){return 440*Math.pow(2,(n-69)/12)}
function body(){
 const p=presets.find(x=>x.name===presetSel.value);
 return p?{...p,name:projectName.value||p.name,preset:p.name}:{name:projectName.value||"UAOS V11 Song",tempo:Number(tempo.value),maqam:maqam.value,progression:progression.value.split(/\s+/),structure:structure.value.split(",").map(x=>x.trim())};
}
async function load(){
 status.textContent=JSON.stringify(await req("/api/status"),null,2);
 checklist.textContent=JSON.stringify(await req("/api/launch/checklist"),null,2);
 report.textContent=JSON.stringify(await req("/api/release/report"),null,2);
 policy.textContent=JSON.stringify(await req("/api/legal/sample-policy"),null,2);
 domain.textContent=JSON.stringify(await req("/api/domain/status"),null,2);
 routes.textContent=JSON.stringify(await req("/api/qa/routes"),null,2);
 projects.textContent=JSON.stringify(await req("/api/project/list"),null,2);
 sampleMap=await req("/api/sampler/map");
 map.value=JSON.stringify(sampleMap,null,2);
 presets=await req("/api/presets");
 presetSel.innerHTML='<option value="">Custom</option>'+presets.map(p=>`<option>${p.name}</option>`).join("");
 log("V11 loaded");
}
async function generate(){
 song=await req("/api/song/generate",body());
 out.textContent=JSON.stringify(song,null,2);
 monitor.textContent=song.notes.map(n=>`${n.time} ${n.section} ${n.chord} CH${n.channel} NOTE${n.note} ${n.role}`).join("\n");
 log("Song generated");
}
function play(){
 if(!song){generate().then(play);return}
 const ctx=new AudioContext();
 for(const n of song.notes){
  setTimeout(()=>{
   const o=ctx.createOscillator(),g=ctx.createGain();
   o.type=n.channel===9?"square":n.role==="bass"?"triangle":"sine";
   o.frequency.value=n.channel===9?(n.note===36?70:130):hz(n.note);
   g.gain.value=(n.velocity||90)/(n.channel===9?900:1100);
   o.connect(g).connect(ctx.destination);
   o.start();o.stop(ctx.currentTime+Math.max(.05,(n.duration||120)/1000));
  },n.time*(60000/song.tempo)/480);
 }
 log("Playback started");
}
async function exportMidi(){
 const r=await fetch(API+"/api/song/export-midi",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body())});
 const blob=await r.blob();const u=URL.createObjectURL(blob);const a=document.createElement("a");
 a.href=u;a.download="uaos-v11-song.mid";a.click();
}
async function saveProject(){
 if(!song)await generate();
 await req("/api/project/save",{name:projectName.value||song.name,song});
 projects.textContent=JSON.stringify(await req("/api/project/list"),null,2);
}
async function saveMap(){
 sampleMap=JSON.parse(map.value);
 await req("/api/sampler/map",sampleMap);
 log("Sample map saved");
}
async function importWav(){
 const f=wav.files[0]; if(!f)return;
 const arr=await f.arrayBuffer();
 let bin=""; const bytes=new Uint8Array(arr);
 for(let i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);
 await req("/api/samples/import",{filename:f.name,base64:btoa(bin)});
 log("WAV imported");
}
async function downloadReport(){
 const r=await req("/api/release/report");
 const blob=new Blob([JSON.stringify(r,null,2)],{type:"application/json"});
 const u=URL.createObjectURL(blob);const a=document.createElement("a");
 a.href=u;a.download="uaos-v11-release-report.json";a.click();
}
function applyPreset(){
 const p=presets.find(x=>x.name===presetSel.value);if(!p)return;
 tempo.value=p.tempo;maqam.value=p.maqam;progression.value=p.progression.join(" ");structure.value=p.structure.join(",");
}
window.generate=generate;window.play=play;window.exportMidi=exportMidi;window.saveProject=saveProject;window.saveMap=saveMap;window.importWav=importWav;window.downloadReport=downloadReport;window.applyPreset=applyPreset;
load();
