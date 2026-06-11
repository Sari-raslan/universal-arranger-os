const fs=require("fs");
const path=require("path");
const express=require("express");
const app=express();
const PORT=process.env.PORT||5199;

app.use(express.json({limit:"100mb"}));
app.use("/samples",express.static(path.join(__dirname,"uploads")));

function pattern(body={}){
  const tempo=body.tempo||96;
  const chord=body.chord||"Cm";
  const section=body.section||"Main A";
  const maqam=body.maqam||"Nahawand";
  const notes=[
    {time:0,duration:420,note:60,velocity:110,channel:0},
    {time:480,duration:420,note:63,velocity:100,channel:0},
    {time:960,duration:420,note:67,velocity:100,channel:0},
    {time:1440,duration:420,note:72,velocity:105,channel:0},
    {time:0,duration:120,note:36,velocity:120,channel:9},
    {time:480,duration:120,note:42,velocity:80,channel:9},
    {time:960,duration:120,note:38,velocity:105,channel:9},
    {time:1440,duration:120,note:42,velocity:80,channel:9}
  ];
  return {name:`UAOS ${section} ${chord} ${maqam}`,tempo,chord,section,maqam,ppq:480,notes};
}

function vlq(v){
  let b=[v&127]; v>>=7;
  while(v>0){b.unshift((v&127)|128);v>>=7}
  return Buffer.from(b);
}
function ev(d,a){return Buffer.concat([vlq(d),Buffer.from(a)])}
function midi(p){
  let events=[Buffer.from([0,255,81,3,7,161,32]),ev(0,[192,0])];
  let flat=[];
  for(const n of p.notes){
    flat.push({t:n.time,on:1,n:n.note,v:n.velocity,ch:n.channel||0});
    flat.push({t:n.time+n.duration,on:0,n:n.note,v:0,ch:n.channel||0});
  }
  flat.sort((a,b)=>a.t-b.t);
  let last=0;
  for(const x of flat){
    events.push(ev(x.t-last,[x.on?144+x.ch:128+x.ch,x.n,x.v]));
    last=x.t;
  }
  events.push(Buffer.from([0,255,47,0]));
  const body=Buffer.concat(events);
  const head=Buffer.alloc(14);
  head.write("MThd"); head.writeUInt32BE(6,4); head.writeUInt16BE(0,8); head.writeUInt16BE(1,10); head.writeUInt16BE(480,12);
  const tr=Buffer.alloc(8);
  tr.write("MTrk"); tr.writeUInt32BE(body.length,4);
  return Buffer.concat([head,tr,body]);
}

app.get("/health",(q,s)=>s.json({ok:true,version:"UAOS V5"}));
app.get("/api/status",(q,s)=>s.json({ok:true,app:"UAOS HyperStation",version:"V5",audio:true,midi:true,style:true}));
app.get("/api/sounds",(q,s)=>s.json({
  oriental:["Oud Pro","Qanun Pro","Nay/Kawala","Arabic Strings"],
  gulf:["Khaliji Rhythm Engine","Gulf Strings","Gulf Percussion"]
}));
app.get("/api/maqam",(q,s)=>s.json(["Nahawand","Bayati","Hijaz","Rast","Saba","Kurd","Ajam"]));
app.get("/api/keyswitches",(q,s)=>s.json({C0:"normal","C#0":"slide",D0:"tremolo","D#0":"ornament",E0:"gliss"}));
app.post("/api/patterns/generate",(q,s)=>s.json(pattern(q.body)));
app.post("/api/patterns/export",(q,s)=>{
  const p=pattern(q.body||{});
  s.setHeader("Content-Type","audio/midi");
  s.setHeader("Content-Disposition","attachment; filename=uaos-pattern.mid");
  s.send(midi(p));
});
app.post("/api/samples/import",(q,s)=>{
  const file=(q.body.filename||"sample.wav").replace(/[^a-z0-9._-]/gi,"_");
  fs.writeFileSync(path.join(__dirname,"uploads",file),Buffer.from(q.body.base64||"","base64"));
  s.json({ok:true,file,url:"/samples/"+file});
});
app.listen(PORT,()=>console.log("UAOS Backend V5 http://127.0.0.1:"+PORT));
