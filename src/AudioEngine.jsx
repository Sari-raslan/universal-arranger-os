$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$App="$Root\uaos-live-clean"
$Log="$Root\reports\UAOS_V17_AUDIO_REAL_FIX.txt"

function L($m){
  Write-Host $m -ForegroundColor Cyan
  $m | Out-File $Log -Append -Encoding utf8
}

Set-Location $App

L "Writing real AudioEngine.jsx..."

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
    if(!freq || freq < 40) return "--";
    const midi=Math.round(69+12*Math.log2(freq/440));
    const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    return names[((midi%12)+12)%12] + (Math.floor(midi/12)-1) + " / MIDI " + midi;
  }

  function detectPitch(buf,sampleRate){
    let size=buf.length;
    let rms=0;
    for(let i=0;i<size;i++) rms+=buf[i]*buf[i];
    rms=Math.sqrt(rms/size);
    if(rms < 0.01) return -1;

    let bestOffset=-1;
    let bestCorrelation=0;

    for(let offset=40; offset<1000; offset++){
      let correlation=0;
      for(let i=0;i<size-offset;i++){
        correlation += Math.abs(buf[i]-buf[i+offset]);
      }
      correlation = 1 - correlation/(size-offset);
      if(correlation > bestCorrelation){
        bestCorrelation=correlation;
        bestOffset=offset;
      }
    }

    if(bestCorrelation > 0.9 && bestOffset > 0){
      return sampleRate / bestOffset;
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
    <div style={{padding:24,border:"1px solid #333",borderRadius:16,marginTop:20}}>
      <h2>UAOS Audio Engine V1.7 Real</h2>

      {!running
        ? <button onClick={start}>Start Microphone</button>
        : <button onClick={stop}>Stop Microphone</button>
      }

      <div style={{height:24,background:"#222",borderRadius:12,overflow:"hidden",marginTop:20}}>
        <div style={{height:"100%",width:level+"%",background:"lime"}} />
      </div>

      <p>Input Level: {level}%</p>
      <p>Pitch: {pitch}</p>
      <p>Note: {note}</p>

      {!recording
        ? <button onClick={startRecording}>Record</button>
        : <button onClick={stopRecording}>Stop Recording</button>
      }

      {audioUrl && <audio controls src={audioUrl} style={{width:"100%",marginTop:15}} />}

      <p style={{marginTop:20}}>
        Next: detected pitch will become MIDI notes for UAOS Voice-to-MIDI.
      </p>
    </div>
  );
}
