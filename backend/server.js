const fs=require("fs");
const path=require("path");
const express=require("express");
const app=express();
const PORT=process.env.PORT||5199;

const dataDir=path.join(__dirname,"data");
const projectsFile=path.join(dataDir,"projects.json");
fs.mkdirSync(dataDir,{recursive:true});
if(!fs.existsSync(projectsFile))fs.writeFileSync(projectsFile,"[]","utf8");
app.use(express.json({limit:"200mb"}));

function readJson(f,d){try{return JSON.parse(fs.readFileSync(f,"utf8"))}catch{return d}}
function writeJson(f,d){fs.writeFileSync(f,JSON.stringify(d,null,2),"utf8")}

const product={
 name:"UAOS HyperStation",
 company:"AEPlatform",
 version:"V9",
 domain:"aeplatform.app",
 repo:"universal-arranger-os",
 policy:"Original/licensed samples only. No proprietary Kontakt/NI/KORG/Genos/Ketron sample copying."
};

const routes=[
 "/health","/api/status","/api/presets","/api/payments","/api/launch/checklist",
 "/api/release/report","/api/legal/sample-policy","/api/domain/status"
];

const presets=[
 {name:"Khaliji Pop 96",tempo:96,maqam:"Nahawand",progression:["Cm","F","G7","Cm"],structure:["Intro","Main A","Main A","Fill","Main B","Break","Main A","Ending"]},
 {name:"Oriental Ballad 76",tempo:76,maqam:"Bayati",progression:["Dm","G7","Cm","Dm"],structure:["Intro","Main A","Fill","Main B","Main B","Ending"]},
 {name:"Hijaz Dance 112",tempo:112,maqam:"Hijaz",progression:["Cm","Bb","G7","Cm"],structure:["Intro","Main A","Main B","Fill","Main C","Break","Main D","Ending"]},
 {name:"Rast Classic 88",tempo:88,maqam:"Rast",progression:["C","F","G7","C"],structure:["Intro","Main A","Main A","Fill","Main B","Ending"]}
];

const payments={
 starter:{name:"Starter",status:"placeholder",link:"ADD_PAYMENT_LINK_STARTER"},
 pro:{name:"Pro",status:"placeholder",link:"ADD_PAYMENT_LINK_PRO"},
 founder:{name:"Founder Edition",status:"placeholder",link:"ADD_PAYMENT_LINK_FOUNDER"}
};

const checklist=[
 {area:"Build",item:"Frontend production build",status:"pass"},
 {area:"Backend",item:"Express API health",status:"pass"},
 {area:"MIDI",item:"Binary .mid export",status:"pass"},
 {area:"Arranger",item:"Song/section engine",status:"pass"},
 {area:"Audio",item:"Browser playback foundation",status:"pass"},
 {area:"Libraries",item:"Original/licensed sample policy",status:"pass"},
 {area:"Payments",item:"Stripe/LemonSqueezy links",status:"pending"},
 {area:"Domain",item:"aeplatform.app / www verification",status:"refresh-or-txt-needed"},
 {area:"Desktop",item:"Electron package",status:"prepared"},
 {area:"Android",item:"Capacitor APK",status:"prepared"},
 {area:"iOS",item:"App Store",status:"requires-macos-xcode"}
];

const chordMap={C:[60,64,67],Cm:[60,63,67],Dm:[62,65,69],G7:[67,71,74,77],F:[65,69,72],Bb:[70,74,77],Am:[69,72,76],E7:[64,68,71,74]};

function song(body={}){
 const preset=presets.find(p=>p.name===body.preset);
 if(preset)body={...preset,...body};
 const tempo=Number(body.tempo||96),maqam=body.maqam||"Nahawand";
 const progression=body.progression||["Cm","F","G7","Cm"];
 const structure=body.structure||["Intro","Main A","Main A","Fill","Main B","Break","Main A","Ending"];
 let notes=[],pos=0;
 structure.forEach((sec,i)=>{
  const ch=progression[i%progression.length],base=chordMap[ch]||chordMap.Cm;
  for(let step=0;step<4;step++){
   notes.push({time:pos+step*480,duration:380,note:base[step%base.length]+(sec==="Main B"?12:0),velocity:105-step*3,channel:0,role:"melody",section:sec,chord:ch});
   notes.push({time:pos+step*480+240,duration:160,note:base[0]-12,velocity:74,channel:1,role:"bass",section:sec,chord:ch});
   notes.push({time:pos+step*480,duration:100,note:step%2?42:36,velocity:step%2?78:122,channel:9,role:"drum",section:sec,chord:ch});
  }
  if(sec==="Fill")[38,40,43,45].forEach((n,k)=>notes.push({time:pos+1440+k*100,duration:90,note:n,velocity:124,channel:9,role:"fill",section:sec,chord:ch}));
  pos+=1920;
 });
 return {name:body.name||body.preset||"UAOS V9 Song",version:"V9",tempo,maqam,progression,structure,ppq:480,notes};
}

function vlq(v){let b=[v&127];v>>=7;while(v>0){b.unshift((v&127)|128);v>>=7}return Buffer.from(b)}
function ev(d,a){return Buffer.concat([vlq(d),Buffer.from(a)])}
function midi(p){
 let mpqn=Math.round(60000000/(p.tempo||120));
 let events=[Buffer.from([0,255,81,3,(mpqn>>16)&255,(mpqn>>8)&255,mpqn&255])],flat=[];
 for(const n of p.notes||[]){flat.push({t:n.time,on:1,n:n.note,v:n.velocity||100,ch:n.channel||0});flat.push({t:n.time+n.duration,on:0,n:n.note,v:0,ch:n.channel||0})}
 flat.sort((a,b)=>a.t-b.t||a.on-b.on);
 let last=0;for(const x of flat){events.push(ev(Math.max(0,x.t-last),[x.on?144+x.ch:128+x.ch,x.n,x.v]));last=x.t}
 events.push(Buffer.from([0,255,47,0]));
 const body=Buffer.concat(events),head=Buffer.alloc(14),tr=Buffer.alloc(8);
 head.write("MThd");head.writeUInt32BE(6,4);head.writeUInt16BE(0,8);head.writeUInt16BE(1,10);head.writeUInt16BE(480,12);
 tr.write("MTrk");tr.writeUInt32BE(body.length,4);
 return Buffer.concat([head,tr,body]);
}

app.get("/health",(q,s)=>s.json({ok:true,version:"UAOS V9",time:new Date().toISOString()}));
app.get("/api/status",(q,s)=>s.json({ok:true,product,features:{songEngine:true,midiExport:true,launchChecklist:true,legalPolicy:true,domainStatus:true}}));
app.get("/api/presets",(q,s)=>s.json(presets));
app.get("/api/payments",(q,s)=>s.json(payments));
app.get("/api/launch/checklist",(q,s)=>s.json(checklist));
app.get("/api/legal/sample-policy",(q,s)=>s.json({ok:true,policy:product.policy,allowed:["original recordings","licensed samples","self-recorded WAV","royalty-free with proof"],forbidden:["copying NI/Kontakt libraries","copying KORG/Genos/Ketron ROM samples","unlicensed commercial samples"]}));
app.get("/api/domain/status",(q,s)=>s.json({domain:"aeplatform.app",www:"www.aeplatform.app",dns:{A:"76.76.21.21",CNAME:"cname.vercel-dns.com"},vercel:"may require refresh/TXT verification"}));
app.get("/api/test/routes",(q,s)=>s.json({routes,expected:"all local API routes should return 200"}));
app.get("/api/release/report",(q,s)=>s.json({product,ready:checklist.filter(x=>x.status==="pass"),pending:checklist.filter(x=>x.status!=="pass")}));
app.post("/api/song/generate",(q,s)=>s.json(song(q.body)));
app.post("/api/song/export-midi",(q,s)=>{const p=song(q.body||{});s.setHeader("Content-Type","audio/midi");s.setHeader("Content-Disposition","attachment; filename=uaos-v9-song.mid");s.send(midi(p))});
app.post("/api/project/save",(q,s)=>{let all=readJson(projectsFile,[]);let p={id:Date.now(),created:new Date().toISOString(),...q.body};all.unshift(p);writeJson(projectsFile,all);s.json({ok:true,project:p})});
app.get("/api/project/list",(q,s)=>s.json(readJson(projectsFile,[])));
app.listen(PORT,()=>console.log("UAOS Backend V9 http://127.0.0.1:"+PORT));
