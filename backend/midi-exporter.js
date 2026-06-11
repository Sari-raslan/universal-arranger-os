$ErrorActionPreference="Continue"
$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Report="agent-output/UAOS_V5_REAL_AUDIO_MIDI_STYLE_REPORT.md"
"# UAOS V5 Real Audio + MIDI + Style Engine Report`nGenerated: $(Get-Date)`n" | Set-Content $Report -Encoding UTF8

function Log($m){
  $m | Tee-Object -FilePath $Report -Append
}

Log "## 1. Creating backend V5 engines"

New-Item -ItemType Directory -Force backend\data,backend\uploads,uaos-live-clean\src,uaos-live-clean\src\lib,uaos-live-clean\src\components | Out-Null

@'
const fs = require("fs");
const path = require("path");

const ppq = 480;

function vlq(value){
  const bytes = [value & 0x7F];
  value >>= 7;
  while(value > 0){
    bytes.unshift((value & 0x7F) | 0x80);
    value >>= 7;
  }
  return Buffer.from(bytes);
}

function meta(type, data){
  return Buffer.concat([Buffer.from([0x00,0xFF,type,data.length]), Buffer.from(data)]);
}

function midiEvent(delta, bytes){
  return Buffer.concat([vlq(delta), Buffer.from(bytes)]);
}

function noteOn(delta, ch, note, vel){ return midiEvent(delta,[0x90+ch,note,vel]); }
function noteOff(delta, ch, note){ return midiEvent(delta,[0x80+ch,note,0]); }
function program(delta, ch, p){ return midiEvent(delta,[0xC0+ch,p]); }

function makeTrack(events){
  const body = Buffer.concat([...events, Buffer.from([0x00,0xFF,0x2F,0x00])]);
  const head = Buffer.alloc(8);
  head.write("MTrk",0);
  head.writeUInt32BE(body.length,4);
  return Buffer.concat([head,body]);
}

function createMidi(pattern){
  const tempo = pattern.tempo || 120;
  const mpqn = Math.round(60000000 / tempo);
  const tempoBuf = Buffer.from([(mpqn>>16)&255,(mpqn>>8)&255,mpqn&255]);

  const events = [
    meta(0x03, Buffer.from(pattern.name || "UAOS Pattern")),
    meta(0x51, tempoBuf),
    program(0,0,0),
    program(0,9,0)
  ];

  const notes = pattern.notes || [
    {time:0,duration:480,note:60,velocity:100,channel:0},
    {time:480,duration:480,note:64,velocity:100,channel:0},
    {time:960,duration:480,note:67,velocity:100,channel:0}
  ];

  const flat=[];
  for(const n of notes){
    flat.push({time:n.time,type:"on",ch:n.channel||0,note:n.note,vel:n.velocity||100});
    flat.push({time:n.time+n.duration,type:"off",ch:n.channel||0,note:n.note,vel:0});
  }

  flat.sort((a,b)=>a.time-b.time || (a.type==="off"?-1:1));
  let last=0;
  for(const e of flat){
    const d=Math.max(0,e.time-last);
    if(e.type==="on") events.push(noteOn(d,e.ch,e.note,e.vel));
    else events.push(noteOff(d,e.ch,e.note));
    last=e.time;
  }

  const header = Buffer.alloc(14);
  header.write("MThd",0);
  header.writeUInt32BE(6,4);
  header.writeUInt16BE(0,8);
  header.writeUInt16BE(1,10);
  header.writeUInt16BE(ppq,12);

  return Buffer.concat([header, makeTrack(events)]);
}

module.exports={createMidi};
