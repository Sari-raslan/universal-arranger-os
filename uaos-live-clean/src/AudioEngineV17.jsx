import React, { useRef, useState } from "react";

export default function AudioEngineV17(){
  const [micOn,setMicOn]=useState(false);
  const [level,setLevel]=useState(0);
  const [pitch,setPitch]=useState("--");
  const [note,setNote]=useState("--");
  const [recording,setRecording]=useState(false);
  const [audioUrl,setAudioUrl]=useState("");
  const [events,setEvents]=useState([]);

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
    const name=names[((midi%12)+12)%12];
    const octave=Math.floor(midi/12)-1;
    return name+octave+" / MIDI "+midi;
  }

  function detectPitch(buffer,sampleRate){
    let size=buffer.length;
    let rms=0;

    for(let i=0;i<size;i++) rms+=buffer[i]*buffer[i];
    rms=Math.sqrt(rms/size);
    if(rms<0.01) return -1;

    let correlations=new Array(size).fill(0);
    for(let lag=0;lag<size;lag++){
      for(let i=0;i<size-lag;i++){
        correlations[lag]+=buffer[i]*buffer[i+lag];
      }
    }

    let d=0;
    while(correlations[d]>correlations[d+1]) d++;

    let maxVal=-1;
    let maxPos=-1;

    for(let i=d;i<size;i++){
      if(correlations[i]>maxVal){
        maxVal=correlations[i];
        maxPos=i;
      }
    }

    if(maxPos<=0) return -1;
    const freq=sampleRate/maxPos;
    if(freq<40 || freq>2000) return -1;
    return freq;
  }

  async function startMic(){
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    streamRef.current=stream;

    const ctx=new AudioContext();
    ctxRef.current=ctx;

    const source=ctx.createMediaStreamSource(stream);
    const analyser=ctx.createAnalyser();
    analyser.fftSize=2048;
    analyserRef.current=analyser;

    source.connect(analyser);
    setMicOn(true);
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
    const currentLevel=Math.min(100,Math.round(rms*300));
    setLevel(currentLevel);

    const f=detectPitch(data,ctx.sampleRate);
    if(f>0){
      const n=freqToNote(f);
      setPitch(f.toFixed(1)+" Hz");
      setNote(n);
      setEvents(old=>[
        {time:new Date().toLocaleTimeString(), pitch:f.toFixed(1), note:n},
        ...old.slice(0,11)
      ]);
    }

    rafRef.current=requestAnimationFrame(loop);
  }

  function stopMic(){
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
    if(ctxRef.current) ctxRef.current.close();

    setMicOn(false);
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
    <div style={{padding:24}}>
      <h1>UAOS Audio Engine V1.7</h1>
      <p>Real audio foundation: microphone, level meter, pitch detection, note estimation, recording, and voice-to-MIDI event preparation.</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
        <section className="card">
          <h2>Microphone</h2>
          {!micOn ? <button onClick={startMic}>Start Mic</button> : <button onClick={stopMic}>Stop Mic</button>}
          <p>Status: {micOn ? "ON" : "OFF"}</p>
        </section>

        <section className="card">
          <h2>Input Level</h2>
          <div style={{height:22,background:"#222",borderRadius:12,overflow:"hidden"}}>
            <div style={{height:"100%",width:level+"%",background:"lime"}} />
          </div>
          <p>{level}%</p>
        </section>

        <section className="card">
          <h2>Pitch</h2>
          <p style={{fontSize:28,fontWeight:700}}>{pitch}</p>
          <p>{note}</p>
        </section>

        <section className="card">
          <h2>Recording</h2>
          {!recording ? <button onClick={startRecording}>Record</button> : <button onClick={stopRecording}>Stop</button>}
          {audioUrl && <audio controls src={audioUrl} style={{width:"100%",marginTop:12}} />}
        </section>
      </div>

      <section className="card" style={{marginTop:20}}>
        <h2>Voice-to-MIDI Events</h2>
        <table style={{width:"100%"}}>
          <thead>
            <tr><th>Time</th><th>Pitch</th><th>Note</th></tr>
          </thead>
          <tbody>
            {events.map((e,i)=>(
              <tr key={i}>
                <td>{e.time}</td>
                <td>{e.pitch}</td>
                <td>{e.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
