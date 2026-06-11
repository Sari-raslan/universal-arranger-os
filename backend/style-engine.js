const fs = require("fs");
const path = require("path");

const sections = ["Intro","Main A","Main B","Main C","Main D","Fill","Break","Ending"];

function chordToNotes(chord){
  const rootMap={C:60,"C#":61,Db:61,D:62,"D#":63,Eb:63,E:64,F:65,"F#":66,Gb:66,G:67,"G#":68,Ab:68,A:69,"A#":70,Bb:70,B:71};
  const m = String(chord||"C").match(/^([A-G](#|b)?)(.*)$/);
  const root = m ? rootMap[m[1]] : 60;
  const q = m ? m[3] : "";
  if(q.includes("m") && !q.includes("maj")) return [root,root+3,root+7];
  if(q.includes("dim")) return [root,root+3,root+6];
  if(q.includes("7")) return [root,root+4,root+7,root+10];
  return [root,root+4,root+7];
}

function makeStylePattern({section="Main A", chord="C", tempo=120, maqam="Nahawand", groove="khaliji"}){
  const base = chordToNotes(chord);
  const notes=[];
  const bar=1920;

  for(let i=0;i<4;i++){
    const t=i*480;
    notes.push({time:t,duration:420,note:base[i%base.length],velocity:92,channel:0});
    notes.push({time:t+120,duration:180,note:36,velocity:i===0?120:95,channel:9});
    notes.push({time:t+360,duration:120,note:42,velocity:70,channel:9});
  }

  if(section.includes("Intro")){
    notes.push({time:bar,duration:960,note:base[0]+12,velocity:110,channel:0});
  }

  if(section.includes("Fill")){
    notes.push({time:1440,duration:120,note:38,velocity:118,channel:9});
    notes.push({time:1560,duration:120,note:40,velocity:118,channel:9});
    notes.push({time:1680,duration:120,note:43,velocity:118,channel:9});
  }

  return {name:`UAOS ${section} ${chord} ${maqam}`, tempo, section, chord, maqam, groove, ppq:480, notes};
}

module.exports={sections,makeStylePattern,chordToNotes};
