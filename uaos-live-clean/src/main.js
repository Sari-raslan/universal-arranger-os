const API="http://127.0.0.1:5199";
async function j(p,b){
 const r=await fetch(API+p,{method:b?"POST":"GET",headers:{"Content-Type":"application/json"},body:b?JSON.stringify(b):undefined});
 if(!r.ok)throw new Error(await r.text());
 return r.json();
}
function playSynth(notes,tempo){
 const ctx=new AudioContext();
 for(const n of notes){
  setTimeout(()=>{
   const o=ctx.createOscillator(),g=ctx.createGain();
   o.frequency.value=440*Math.pow(2,(n.note-69)/12);
   g.gain.value=(n.velocity||80)/900;
   o.connect(g).connect(ctx.destination);
   o.start(); o.stop(ctx.currentTime+(n.duration||200)/1000);
  },n.time*(60000/tempo)/480);
 }
}
async function exportMidi(body){
 const r=await fetch(API+"/api/patterns/export",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const blob=await r.blob(); const u=URL.createObjectURL(blob);
 const a=document.createElement("a"); a.href=u; a.download="uaos-pattern.mid"; a.click();
}
let current=null;
async function init(){
 const st=await j("/api/status");
 const sounds=await j("/api/sounds");
 document.querySelector("#status").textContent=JSON.stringify(st,null,2);
 document.querySelector("#sounds").textContent=JSON.stringify(sounds,null,2);
}
async function gen(){
 const body={section:section.value,chord:chord.value,maqam:maqam.value,tempo:Number(tempo.value)};
 current=await j("/api/patterns/generate",body);
 out.textContent=JSON.stringify(current,null,2);
}
window.gen=gen;
window.play=async()=>{if(!current)await gen();playSynth(current.notes,current.tempo)}
window.mid=async()=>{if(!current)await gen();exportMidi(current)}
init();
