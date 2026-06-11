$ErrorActionPreference="Continue"
$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Report="agent-output\UAOS_MASTER_REMAINING_REPORT.md"
"# UAOS MASTER REMAINING ALL IN ONE`nGenerated: $(Get-Date)`n" | Set-Content $Report -Encoding UTF8
function Log($m){ $m | Tee-Object -FilePath $Report -Append }

Log "## 1. Stop old node"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Log "## 2. Write backend final V11"

@'
const fs=require("fs");
const path=require("path");
const express=require("express");
const app=express();
const PORT=process.env.PORT||5199;

const data=path.join(__dirname,"data");
const uploads=path.join(__dirname,"uploads");
fs.mkdirSync(data,{recursive:true});
fs.mkdirSync(uploads,{recursive:true});

app.use(express.json({limit:"300mb"}));
app.use("/samples",express.static(uploads));

const product={
 name:"UAOS HyperStation",
 company:"AEPlatform",
 version:"V11",
 domain:"aeplatform.app",
 policy:"Only original recordings, licensed samples, or self-recorded WAV files. No copying NI/Kontakt/KORG/Genos/Ketron protected samples."
};

const presets=[
 {name:"Khaliji Pop 96",tempo:96,maqam:"Nahawand",progression:["Cm","F","G7","Cm"],structure:["Intro","Main A","Main A","Fill","Main B","Break","Main A","Ending"]},
 {name:"Oriental Ballad 76",tempo:76,maqam:"Bayati",progression:["Dm","G7","Cm","Dm"],structure:["Intro","Main A","Fill","Main B","Main B","Ending"]},
 {name:"Hijaz Dance 112",tempo:112,maqam:"Hijaz",progression:["Cm","Bb","G7","Cm"],structure:["Intro","Main A","Main B","Fill","Main C","Break","Main D","Ending"]},
 {name:"Rast Classic 88",tempo:88,maqam:"Rast",progression:["C","F","G7","C"],structure:["Intro","Main A","Main A","Fill","Main B","Ending"]}
];

const checklist=[
 {area:"Backend",item:"API health",status:"pass"},
 {area:"Frontend",item:"Vite preview",status:"pass"},
 {area:"Music",item:"Song arranger",status:"pass"},
 {area:"Music",item:"MIDI export",status:"pass"},
 {area:"Audio",item:"Sampler map + WAV import foundation",status:"pass"},
 {area:"Business",item:"Payment links",status:"pending"},
 {area:"Domain",item:"Vercel domain verification",status:"pending"},
 {area:"Desktop",item:"Electron package",status:"prepared"},
 {area:"Android",item:"Capacitor APK",status:"prepared"},
 {area:"iOS",item:"Xcode/App Store",status:"requires-mac"}
];

const chordMap={C:[60,64,67],Cm:[60,63,67],Dm:[62,65,69],G7:[67,71,74,77],F:[65,69,72],Bb:[70,74,77],Am:[69,72,76],E7:[64,68,71,74]};

function readJson(file,fallback){try{return JSON.parse(fs.readFileSync(file,"utf8"))}catch{return fallback}}
function writeJson(file,data){fs.writeFileSync(file,JSON.stringify(data,null,2),"utf8")}

const projectsFile=path.join(data,"projects.json");
const mapFile=path.join(data,"sample-map.json");
if(!fs.existsSync(projectsFile))writeJson(projectsFile,[]);
if(!fs.existsSync(mapFile))writeJson(mapFile,[
 {id:"oud_normal_soft",name:"Oud Normal Soft",file:null,rootNote:60,lowNote:48,highNote:72,velocityMin:1,velocityMax:80,roundRobin:1,articulation:"normal"},
 {id:"oud_normal_hard",name:"Oud Normal Hard",file:null,rootNote:60,lowNote:48,highNote:72,velocityMin:81,velocityMax:127,roundRobin:2,articulation:"normal"},
 {id:"oud_slide",name:"Oud Slide",file:null,rootNote:60,lowNote:48,highNote:72,velocityMin:1,velocityMax:127,roundRobin:1,articulation:"slide"}
]);

function makeSong(body={}){
 const preset=presets.find(p=>p.name===body.preset);
 if(preset)body={...preset,...body};
 const tempo=Number(body.tempo||96);
 const maqam=body.maqam||"Nahawand";
 const progression=body.progression||["Cm","F","G7","Cm"];
 const structure=body.structure||["Intro","Main A","Fill","Main B","Ending"];
 let notes=[],pos=0;
 structure.forEach((sec,i)=>{
  const chord=progression[i%progression.length];
  const base=chordMap[chord]||chordMap.Cm;
  for(let s=0;s<4;s++){
   notes.push({time:pos+s*480,duration:380,note:base[s%base.length],velocity:108-s*4,channel:0,role:"melody",section:sec,chord});
   notes.push({time:pos+s*480+240,duration:150,note:base[0]-12,velocity:74,channel:1,role:"bass",section:sec,chord});
   notes.push({time:pos+s*480,duration:100,note:s%2?42:36,velocity:s%2?78:122,channel:9,role:"drum",section:sec,chord});
  }
  if(sec==="Fill")[38,40,43,45].forEach((n,k)=>notes.push({time:pos+1440+k*100,duration:90,note:n,velocity:124,channel:9,role:"fill",section:sec,chord}));
  pos+=1920;
 });
 return {name:body.name||body.preset||"UAOS V11 Song",version:"V11",tempo,maqam,progression,structure,ppq:480,notes};
}

function vlq(v){let b=[v&127];v>>=7;while(v>0){b.unshift((v&127)|128);v>>=7}return Buffer.from(b)}
function ev(d,a){return Buffer.concat([vlq(d),Buffer.from(a)])}
function midi(p){
 let mpqn=Math.round(60000000/(p.tempo||120));
 let events=[Buffer.from([0,255,81,3,(mpqn>>16)&255,(mpqn>>8)&255,mpqn&255])],flat=[];
 for(const n of p.notes||[]){
  flat.push({t:n.time,on:1,n:n.note,v:n.velocity||100,ch:n.channel||0});
  flat.push({t:n.time+n.duration,on:0,n:n.note,v:0,ch:n.channel||0});
 }
 flat.sort((a,b)=>a.t-b.t||a.on-b.on);
 let last=0;
 for(const x of flat){events.push(ev(Math.max(0,x.t-last),[x.on?144+x.ch:128+x.ch,x.n,x.v]));last=x.t}
 events.push(Buffer.from([0,255,47,0]));
 const body=Buffer.concat(events),head=Buffer.alloc(14),tr=Buffer.alloc(8);
 head.write("MThd");head.writeUInt32BE(6,4);head.writeUInt16BE(0,8);head.writeUInt16BE(1,10);head.writeUInt16BE(480,12);
 tr.write("MTrk");tr.writeUInt32BE(body.length,4);
 return Buffer.concat([head,tr,body]);
}

app.get("/health",(q,s)=>s.json({ok:true,version:"UAOS V11",time:new Date().toISOString()}));
app.get("/api/status",(q,s)=>s.json({ok:true,product,features:{arranger:true,midi:true,sampler:true,qa:true,packaging:true,release:true}}));
app.get("/api/presets",(q,s)=>s.json(presets));
app.get("/api/launch/checklist",(q,s)=>s.json(checklist));
app.get("/api/payments",(q,s)=>s.json({starter:"ADD_LINK",pro:"ADD_LINK",founder:"ADD_LINK"}));
app.get("/api/legal/sample-policy",(q,s)=>s.json({policy:product.policy}));
app.get("/api/domain/status",(q,s)=>s.json({domain:"aeplatform.app",A:"76.76.21.21",CNAME:"cname.vercel-dns.com",next:"Refresh Vercel verification or add TXT record if requested"}));
app.get("/api/sampler/map",(q,s)=>s.json(readJson(mapFile,[])));
app.post("/api/sampler/map",(q,s)=>{writeJson(mapFile,q.body||[]);s.json({ok:true,count:(q.body||[]).length})});
app.post("/api/samples/import",(q,s)=>{
 const file=(q.body.filename||"sample.wav").replace(/[^a-z0-9._-]/gi,"_");
 fs.writeFileSync(path.join(uploads,file),Buffer.from(q.body.base64||"","base64"));
 s.json({ok:true,file,url:"/samples/"+file});
});
app.get("/api/release/report",(q,s)=>s.json({product,gate:"local-pass-public-pending",ready:checklist.filter(x=>x.status==="pass"),pending:checklist.filter(x=>x.status!=="pass")}));
app.get("/api/qa/routes",(q,s)=>s.json({routes:["/health","/api/status","/api/presets","/api/release/report","/api/sampler/map"],total:5}));
app.post("/api/song/generate",(q,s)=>s.json(makeSong(q.body)));
app.post("/api/song/export-midi",(q,s)=>{const p=makeSong(q.body||{});s.setHeader("Content-Type","audio/midi");s.setHeader("Content-Disposition","attachment; filename=uaos-v11-song.mid");s.send(midi(p))});
app.post("/api/project/save",(q,s)=>{let all=readJson(projectsFile,[]);let p={id:Date.now(),created:new Date().toISOString(),...q.body};all.unshift(p);writeJson(projectsFile,all);s.json({ok:true,project:p})});
app.get("/api/project/list",(q,s)=>s.json(readJson(projectsFile,[])));
app.listen(PORT,()=>console.log("UAOS Backend V11 http://127.0.0.1:"+PORT));
