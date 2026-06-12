$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
Set-Location $App

Write-Host "[AUDIO REAL] writing AudioEngine.jsx" -ForegroundColor Cyan

@'
import React, { useRef, useState } from "react";

export default function AudioEngine(){
  const [running,setRunning]=useState(false);
  const [level,setLevel]=useState(0);
  const [pitch,setPitch]=useState("--");
  const [note,setNote]=useState("--");
  const [recording,setRecording]=useState(false);
  const [audioUrl,setAudioUrl]=useState("");

  const ctxRef=useRef(null);
  const analyserRef=useRef(null);
  const streamRef=useRef(null);
  const rafRef=useRef(null);
  const recorderRef=useRef(null);
  const chunksRef=useRef([]);

  function freqToNote(freq){
    if(!freq || freq<40) return "--";
    const midi=Math.round(69+12*Math.log2(freq/440));
    const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    return names[((midi%12)+12)%12]+(Math.floor(midi/12)-1)+" / MIDI "+midi;
  }

  function detectPitch(data,sampleRate){
    let rms=0;
    for(let i=0;i<data.length;i++) rms+=data[i]*data[i];
    rms=Math.sqrt(rms/data.length);
    if(rms<0.01) return -1;

    let bestOffset=-1;
    let bestCorr=0;

    for(let offset=40; offset<1000; offset++){
      let corr=0;
      for(let i=0;i<data.length-offset;i++){
        corr += Math.abs(data[i]-data[i+offset]);
      }
      corr = 1 - corr/(data.length-offset);
      if(corr>bestCorr){
        bestCorr=corr;
        bestOffset=offset;
      }
    }

    if(bestCorr>0.9 && bestOffset>0){
      return sampleRate/bestOffset;
    }

    return -1;
  }

  async function start(){
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    streamRef.current=stream;

    const ctx=new AudioContext();
    ctxRef.current=ctx;

    const analyser=ctx.createAnalyser();
    analyser.fftSize=2048;
    analyserRef.current=analyser;

    const source=ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    setRunning(true);
    loop();
  }

  function loop(){
    const analyser=analyserRef.current;
    const ctx=ctxRef.current;
    if(!analyser || !ctx) return;

    const data=new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);

    let sum=0;
    for(const v of data) sum+=v*v;
    const rms=Math.sqrt(sum/data.length);
    setLevel(Math.min(100,Math.round(rms*350)));

    const f=detectPitch(data,ctx.sampleRate);
    if(f>40 && f<2000){
      setPitch(f.toFixed(1)+" Hz");
      setNote(freqToNote(f));
    }

    rafRef.current=requestAnimationFrame(loop);
  }

  function stop(){
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
    if(ctxRef.current) ctxRef.current.close();
    setRunning(false);
    setLevel(0);
  }

  function startRecording(){
    if(!streamRef.current){
      alert("Start microphone first");
      return;
    }

    chunksRef.current=[];
    const rec=new MediaRecorder(streamRef.current);
    recorderRef.current=rec;

    rec.ondataavailable=e=>chunksRef.current.push(e.data);
    rec.onstop=()=>{
      const blob=new Blob(chunksRef.current,{type:"audio/webm"});
      setAudioUrl(URL.createObjectURL(blob));
    };

    rec.start();
    setRecording(true);
  }

  function stopRecording(){
    if(recorderRef.current){
      recorderRef.current.stop();
      setRecording(false);
    }
  }

  return (
    <section style={{padding:20,border:"1px solid #333",borderRadius:14,marginTop:20}}>
      <h2>UAOS Audio Engine V1.7 Real</h2>
      {!running ? <button onClick={start}>Start Microphone</button> : <button onClick={stop}>Stop Microphone</button>}

      <div style={{height:22,background:"#222",borderRadius:12,overflow:"hidden",marginTop:16}}>
        <div style={{height:"100%",width:level+"%",background:"lime"}} />
      </div>

      <p>Level: {level}%</p>
      <p>Pitch: {pitch}</p>
      <p>Note: {note}</p>

      {!recording ? <button onClick={startRecording}>Record</button> : <button onClick={stopRecording}>Stop Recording</button>}
      {audioUrl && <audio controls src={audioUrl} style={{width:"100%",marginTop:12}} />}
    </section>
  );
}
