export function downloadText(filename,text){
  const blob=new Blob([text],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();
  URL.revokeObjectURL(url);
}

function str(s){return [...s].map(c=>c.charCodeAt(0));}
function u16(n){return [(n>>8)&255,n&255];}
function u32(n){return [(n>>24)&255,(n>>16)&255,(n>>8)&255,n&255];}
function vlq(v){
  let b=v&0x7f;
  const out=[];
  while((v>>=7)){b<<=8;b|=((v&0x7f)|0x80);}
  while(true){out.push(b&255);if(b&0x80)b>>=8;else break;}
  return out;
}

export function makeMidi(events,bpm=100){
  const ppq=480;
  const track=[];
  track.push(...vlq(0),0xff,0x51,0x03);
  const mpqn=Math.round(60000000/bpm);
  track.push((mpqn>>16)&255,(mpqn>>8)&255,mpqn&255);

  const evs=events.filter(e=>["midi.noteon","arranger.step","voice.midi.draft"].includes(e.type)).map(e=>({
    t:e.time||0,
    note:e.payload.note||e.payload.midi||60,
    velocity:e.payload.velocity||90,
    channel:e.payload.channel||1
  })).sort((a,b)=>a.t-b.t);

  let last=evs.length?evs[0].t:0;
  for(const e of evs){
    const ticks=Math.round(((e.t-last)/60000)*bpm*ppq);
    last=e.t;
    const ch=Math.max(0,Math.min(15,e.channel-1));
    track.push(...vlq(Math.max(0,ticks)),0x90+ch,e.note,e.velocity);
    track.push(...vlq(120),0x80+ch,e.note,0);
  }

  track.push(...vlq(0),0xff,0x2f,0);
  return new Uint8Array([...str("MThd"),...u32(6),...u16(0),...u16(1),...u16(ppq),...str("MTrk"),...u32(track.length),...track]);
}

export function downloadMidi(filename,bytes){
  const blob=new Blob([bytes],{type:"audio/midi"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();
  URL.revokeObjectURL(url);
}
