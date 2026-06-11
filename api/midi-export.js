function vlq(v){
  const b=[v&127]; v >>= 7;
  while(v>0){ b.unshift((v&127)|128); v >>= 7; }
  return Buffer.from(b);
}
function ev(d,a){ return Buffer.concat([vlq(d),Buffer.from(a)]); }

function makeSong(body={}){
  const tempo=Number(body.tempo||96);
  const section=body.section||"Main A";
  const chord=body.chord||"Cm";
  const maqam=body.maqam||"Nahawand";
  const map={C:[60,64,67],Cm:[60,63,67],Dm:[62,65,69],G7:[67,71,74,77],F:[65,69,72],Bb:[70,74,77],Am:[69,72,76]};
  const base=map[chord]||map.Cm;
  const notes=[];

  for(let i=0;i<8;i++){
    notes.push({time:i*480,duration:360,note:base[i%base.length]+(section==="Main B"?12:0),velocity:105-i%3*7,channel:0,role:"melody"});
    notes.push({time:i*480+240,duration:150,note:base[0]-12,velocity:75,channel:1,role:"bass"});
    notes.push({time:i*480,duration:90,note:i%2?42:36,velocity:i%2?80:122,channel:9,role:"drum"});
  }

  if(section==="Fill"){
    [38,40,43,45,47,50].forEach((n,k)=>notes.push({time:2880+k*90,duration:70,note:n,velocity:124,channel:9,role:"fill"}));
  }

  return {name:`UAOS ${section} ${chord} ${maqam}`,tempo,section,chord,maqam,ppq:480,notes};
}

function midi(pattern){
  const mpqn=Math.round(60000000/(pattern.tempo||120));
  const events=[Buffer.from([0,255,81,3,(mpqn>>16)&255,(mpqn>>8)&255,mpqn&255])];
  const flat=[];
  for(const n of pattern.notes||[]){
    flat.push({t:n.time,on:1,n:n.note,v:n.velocity||100,ch:n.channel||0});
    flat.push({t:n.time+n.duration,on:0,n:n.note,v:0,ch:n.channel||0});
  }
  flat.sort((a,b)=>a.t-b.t || a.on-b.on);

  let last=0;
  for(const x of flat){
    events.push(ev(Math.max(0,x.t-last),[x.on?144+x.ch:128+x.ch,x.n,x.v]));
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

export default function handler(req,res){
  const p=makeSong(req.body||{});
  const file=midi(p);
  res.setHeader("Content-Type","audio/midi");
  res.setHeader("Content-Disposition","attachment; filename=uaos-public-style.mid");
  res.status(200).send(file);
}
