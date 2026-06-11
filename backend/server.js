const fs=require("fs");
const path=require("path");
const express=require("express");
const app=express();
const PORT=process.env.PORT||5199;

const dataDir=path.join(__dirname,"data");
fs.mkdirSync(dataDir,{recursive:true});
app.use(express.json({limit:"200mb"}));

const product={
 name:"UAOS HyperStation",
 company:"AEPlatform",
 version:"V10",
 domain:"aeplatform.app",
 localFrontend:"http://127.0.0.1:5180",
 localBackend:"http://127.0.0.1:5199"
};

const routes=[
 "/health",
 "/api/status",
 "/api/presets",
 "/api/payments",
 "/api/launch/checklist",
 "/api/release/report",
 "/api/legal/sample-policy",
 "/api/domain/status",
 "/api/qa/routes",
 "/api/packaging/commands"
];

const checklist=[
 {area:"Core",item:"Backend health",status:"pass"},
 {area:"Core",item:"Frontend preview",status:"pass"},
 {area:"Music",item:"Song arranger",status:"pass"},
 {area:"Music",item:"MIDI export",status:"pass"},
 {area:"Music",item:"Maqam/articulation foundation",status:"pass"},
 {area:"Audio",item:"Real sample recording/import",status:"next"},
 {area:"Business",item:"Payment links",status:"pending"},
 {area:"Domain",item:"Vercel TXT/refresh",status:"pending"},
 {area:"Desktop",item:"Electron package",status:"prepared"},
 {area:"Android",item:"Capacitor APK",status:"prepared"},
 {area:"iOS",item:"Xcode/App Store",status:"requires-mac"}
];

const presets=[
 {name:"Khaliji Pop 96",tempo:96,maqam:"Nahawand",progression:["Cm","F","G7","Cm"],structure:["Intro","Main A","Main A","Fill","Main B","Break","Main A","Ending"]},
 {name:"Oriental Ballad 76",tempo:76,maqam:"Bayati",progression:["Dm","G7","Cm","Dm"],structure:["Intro","Main A","Fill","Main B","Main B","Ending"]},
 {name:"Hijaz Dance 112",tempo:112,maqam:"Hijaz",progression:["Cm","Bb","G7","Cm"],structure:["Intro","Main A","Main B","Fill","Main C","Break","Main D","Ending"]}
];

const payments={
 starter:"ADD_PAYMENT_LINK_STARTER",
 pro:"ADD_PAYMENT_LINK_PRO",
 founder:"ADD_PAYMENT_LINK_FOUNDER"
};

const commands={
 localRun:'powershell -ExecutionPolicy Bypass -File ".\\scripts\\UAOS_V10_RUN.ps1"',
 deploy:'vercel --prod --yes',
 desktop:'cd desktop && npm install && npm run pack',
 android:'cd mobile && npm install && npm run init && npm run android && npm run sync',
 ios:'Requires macOS + Xcode'
};

const chordMap={C:[60,64,67],Cm:[60,63,67],Dm:[62,65,69],G7:[67,71,74,77],F:[65,69,72],Bb:[70,74,77],Am:[69,72,76]};

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
 return {name:body.name||body.preset||"UAOS V10 Song",version:"V10",tempo,maqam,progression,structure,ppq:480,notes};
}

function vlq(v){let b=[v&127];v>>=7;while(v>0){b.unshift((v&127)|128);v>>=7}return Buffer.from(b)}
function ev(d,a){return Buffer.concat([vlq(d),Buffer.from(a)])}
function midi(p){
 let mpqn=Math.round(60000000/(p.tempo||120));
 let events=[Buffer.from([0,255,81,3,(mpqn>>16)&255,(mpqn>>8)&255,mpqn&255])],flat=[];
 for(const n of p.notes||[]){flat.push({t:n.time,on:1,n:n.note,v:n.velocity||100,ch:n.channel||0});flat.push({t:n.time+n.duration,on:0,n:n.note,v:0,ch:n.channel||0})}
 flat.sort((a,b)=>a.t-b.t||a.on-b.on);
 let last=0;
 for(const x of flat){events.push(ev(Math.max(0,x.t-last),[x.on?144+x.ch:128+x.ch,x.n,x.v]));last=x.t}
 events.push(Buffer.from([0,255,47,0]));
 const body=Buffer.concat(events),head=Buffer.alloc(14),tr=Buffer.alloc(8);
 head.write("MThd");head.writeUInt32BE(6,4);head.writeUInt16BE(0,8);head.writeUInt16BE(1,10);head.writeUInt16BE(480,12);
 tr.write("MTrk");tr.writeUInt32BE(body.length,4);
 return Buffer.concat([head,tr,body]);
}

app.get("/health",(q,s)=>s.json({ok:true,version:"UAOS V10",time:new Date().toISOString()}));
app.get("/api/status",(q,s)=>s.json({ok:true,product,features:{qa:true,packaging:true,releaseGate:true,midi:true,arranger:true}}));
app.get("/api/presets",(q,s)=>s.json(presets));
app.get("/api/payments",(q,s)=>s.json(payments));
app.get("/api/launch/checklist",(q,s)=>s.json(checklist));
app.get("/api/legal/sample-policy",(q,s)=>s.json({allowed:["original recordings","licensed samples","self-recorded WAV"],forbidden:["copying NI/Kontakt libraries","copying KORG/Genos/Ketron ROM samples","unlicensed sample packs"]}));
app.get("/api/domain/status",(q,s)=>s.json({domain:"aeplatform.app",A:"76.76.21.21",CNAME:"cname.vercel-dns.com",next:"refresh Vercel verification or add TXT if requested"}));
app.get("/api/qa/routes",(q,s)=>s.json({routes,total:routes.length}));
app.get("/api/packaging/commands",(q,s)=>s.json(commands));
app.get("/api/release/report",(q,s)=>s.json({
 product,
 gate:checklist.every(x=>x.status==="pass")?"pass-with-local-only":"partial-pass",
 ready:checklist.filter(x=>x.status==="pass"),
 pending:checklist.filter(x=>x.status!=="pass"),
 commands
}));
app.post("/api/song/generate",(q,s)=>s.json(makeSong(q.body)));
app.post("/api/song/export-midi",(q,s)=>{const p=makeSong(q.body||{});s.setHeader("Content-Type","audio/midi");s.setHeader("Content-Disposition","attachment; filename=uaos-v10-song.mid");s.send(midi(p))});
app.listen(PORT,()=>console.log("UAOS Backend V10 http://127.0.0.1:"+PORT));
