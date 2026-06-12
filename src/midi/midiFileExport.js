export function downloadBytes(filename, bytes){
  const blob = new Blob([bytes], {type:"audio/midi"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function strBytes(s){
  return [...s].map(c=>c.charCodeAt(0));
}

function u16(n){
  return [(n>>8)&255,n&255];
}

function u32(n){
  return [(n>>24)&255,(n>>16)&255,(n>>8)&255,n&255];
}

function vlq(value){
  let buffer = value & 0x7f;
  const bytes = [];

  while((value >>= 7)){
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }

  while(true){
    bytes.push(buffer & 0xff);
    if(buffer & 0x80) buffer >>= 8;
    else break;
  }

  return bytes;
}

export function makeMidiFile(events, bpm=100){
  const ppq = 480;
  const track = [];

  track.push(...vlq(0), 0xff, 0x51, 0x03);
  const mpqn = Math.round(60000000 / bpm);
  track.push((mpqn>>16)&255, (mpqn>>8)&255, mpqn&255);

  const midiEvents = events
    .filter(e => ["midi.noteon","voice.midi.draft","arranger.step"].includes(e.type))
    .map(e => ({
      t: e.time || 0,
      note: e.payload.note || e.payload.midi || 60,
      velocity: e.payload.velocity || 90,
      channel: e.payload.channel || 1
    }))
    .sort((a,b)=>a.t-b.t);

  let lastMs = midiEvents.length ? midiEvents[0].t : 0;

  for(const ev of midiEvents){
    const deltaMs = Math.max(0, ev.t - lastMs);
    const ticks = Math.round((deltaMs / 60000) * bpm * ppq);
    lastMs = ev.t;

    const ch = Math.max(0, Math.min(15, ev.channel - 1));
    const note = Math.max(0, Math.min(127, ev.note));
    const vel = Math.max(1, Math.min(127, ev.velocity));

    track.push(...vlq(ticks), 0x90 + ch, note, vel);
    track.push(...vlq(120), 0x80 + ch, note, 0);
  }

  track.push(...vlq(0), 0xff, 0x2f, 0x00);

  const header = [
    ...strBytes("MThd"),
    ...u32(6),
    ...u16(0),
    ...u16(1),
    ...u16(ppq)
  ];

  const trackChunk = [
    ...strBytes("MTrk"),
    ...u32(track.length),
    ...track
  ];

  return new Uint8Array([...header, ...trackChunk]);
}
