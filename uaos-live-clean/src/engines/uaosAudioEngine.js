import { freqToNote, guessChord } from "./musicTheory.js";

function autoCorrelate(buffer, sampleRate){
  let rms = 0;
  for(let i=0;i<buffer.length;i++) rms += buffer[i]*buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if(rms < 0.012) return null;

  let bestOffset = -1;
  let best = 0;
  const minOffset = Math.floor(sampleRate / 1000);
  const maxOffset = Math.floor(sampleRate / 50);

  for(let offset=minOffset; offset<maxOffset; offset++){
    let corr = 0;
    for(let i=0;i<buffer.length-offset;i++){
      corr += Math.abs(buffer[i] - buffer[i+offset]);
    }
    corr = 1 - corr / (buffer.length - offset);
    if(corr > best){
      best = corr;
      bestOffset = offset;
    }
  }

  if(best > 0.88 && bestOffset > 0) return sampleRate / bestOffset;
  return null;
}

export class UAOSAudioEngine {
  constructor(bus,timeline){
    this.bus=bus;
    this.timeline=timeline;
    this.running=false;
    this.noteWindow=[];
    this.beats=[];
    this.lastBeat=0;
  }

  async start(){
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    src.connect(this.analyser);
    this.running = true;
    this.timeline.add(this.bus.emit("audio.started",{sampleRate:this.ctx.sampleRate}));
    this.loop();
  }

  loop(){
    if(!this.running || !this.analyser) return;

    const f = new Uint8Array(this.analyser.frequencyBinCount);
    const t = new Float32Array(this.analyser.fftSize);

    this.analyser.getByteFrequencyData(f);
    this.analyser.getFloatTimeDomainData(t);

    const level = Math.round(f.reduce((a,b)=>a+b,0)/f.length);
    const peak = Math.max(...f);
    const pitchHz = autoCorrelate(t, this.ctx.sampleRate);
    const note = freqToNote(pitchHz);

    if(note && level > 18){
      this.noteWindow.push({midi:note.midi, ts:Date.now()});
      this.noteWindow = this.noteWindow.filter(n => Date.now()-n.ts < 2200);
    }

    const chord = guessChord(this.noteWindow.map(n=>n.midi));

    let bpm = null;
    const now = performance.now();

    if(level > 75 && now - this.lastBeat > 260){
      if(this.lastBeat > 0){
        const instant = Math.round(60000 / (now - this.lastBeat));
        if(instant >= 60 && instant <= 200){
          this.beats.push(instant);
          if(this.beats.length > 8) this.beats.shift();
          bpm = Math.round(this.beats.reduce((a,b)=>a+b,0)/this.beats.length);
        }
      }
      this.lastBeat = now;
    }

    const ev = this.bus.emit("audio.intelligence",{
      level,
      peak,
      pitchHz:pitchHz ? Math.round(pitchHz*10)/10 : null,
      note,
      chord,
      bpm
    });

    this.timeline.add(ev);
    requestAnimationFrame(()=>this.loop());
  }

  stop(){
    this.running=false;
    this.timeline.add(this.bus.emit("audio.stopped",{}));
  }
}
