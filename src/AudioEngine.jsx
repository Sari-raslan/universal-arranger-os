$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
$Public="https://universal-arranger-os.vercel.app"

Set-Location $App

Write-Host "UAOS REAL ENGINES PACK" -ForegroundColor Cyan

@'
import React, { useRef, useState } from "react";

export default function AudioEngine(){
  const [level,setLevel]=useState(0);
  const [running,setRunning]=useState(false);
  const [events,setEvents]=useState([]);
  const ctx=useRef(null);
  const analyser=useRef(null);
  const stream=useRef(null);

  async function start(){
    stream.current=await navigator.mediaDevices.getUserMedia({audio:true});
    ctx.current=new AudioContext();
    analyser.current=ctx.current.createAnalyser();
    analyser.current.fftSize=2048;
    ctx.current.createMediaStreamSource(stream.current).connect(analyser.current);
    setRunning(true);
    loop();
  }

  function loop(){
    if(!analyser.current) return;
    const data=new Float32Array(analyser.current.fftSize);
    analyser.current.getFloatTimeDomainData(data);
    let sum=0;
    for(const v of data) sum+=v*v;
    const rms=Math.sqrt(sum/data.length);
    const lvl=Math.min(100,Math.round(rms*350));
    setLevel(lvl);
    if(lvl>15){
      setEvents(e=>[{time:new Date().toLocaleTimeString(),level:lvl},...e.slice(0,8)]);
    }
    requestAnimationFrame(loop);
  }

  function stop(){
    if(stream.current) stream.current.getTracks().forEach(t=>t.stop());
    if(ctx.current) ctx.current.close();
    setRunning(false);
    setLevel(0);
  }

  return (
    <section style={{padding:20,border:"1px solid #333",borderRadius:14,marginTop:20}}>
      <h2>UAOS Audio Engine Real</h2>
      {!running ? <button onClick={start}>Start Mic</button> : <button onClick={stop}>Stop Mic</button>}
      <div style={{height:22,background:"#222",borderRadius:12,overflow:"hidden",marginTop:15}}>
        <div style={{height:"100%",width:level+"%",background:"lime"}} />
      </div>
      <p>Level: {level}%</p>
      <h3>Voice Events</h3>
      <ul>{events.map((e,i)=><li key={i}>{e.time} — level {e.level}</li>)}</ul>
    </section>
  );
}
