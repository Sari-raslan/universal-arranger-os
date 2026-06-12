const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function freqToNote(freq){
  if(!freq || freq < 40 || freq > 2000) return null;
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  return {
    midi,
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    freq: Math.round(freq * 10) / 10
  };
}

function autoCorrelate(buffer, sampleRate){
  let size = buffer.length;
  let rms = 0;

  for(let i=0;i<size;i++){
    rms += buffer[i] * buffer[i];
  }

  rms = Math.sqrt(rms / size);
  if(rms < 0.01) return null;

  let bestOffset = -1;
  let bestCorrelation = 0;

  const minOffset = Math.floor(sampleRate / 1000);
  const maxOffset = Math.floor(sampleRate / 50);

  for(let offset = minOffset; offset < maxOffset; offset++){
    let correlation = 0;

    for(let i=0;i<size-offset;i++){
      correlation += Math.abs(buffer[i] - buffer[i+offset]);
    }

    correlation = 1 - correlation / (size - offset);

    if(correlation > bestCorrelation){
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if(bestCorrelation > 0.88 && bestOffset > 0){
    return sampleRate / bestOffset;
  }

  return null;
}

export class UAOSAudioIntelligence {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.ctx = null;
    this.analyser = null;
    this.running = false;
    this.lastBeat = 0;
    this.beats = [];
  }

  async start(){
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(stream);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;

    src.connect(this.analyser);

    this.running = true;

    const ev = this.bus.emit("audio.started", {
      sampleRate: this.ctx.sampleRate
    });

    this.timeline.add(ev);

    this.loop();
  }

  loop(){
    if(!this.running || !this.analyser) return;

    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Float32Array(this.analyser.fftSize);

    this.analyser.getByteFrequencyData(freqData);
    this.analyser.getFloatTimeDomainData(timeData);

    const level = Math.round(freqData.reduce((a,b)=>a+b,0) / freqData.length);
    const peak = Math.max(...freqData);

    const pitchHz = autoCorrelate(timeData, this.ctx.sampleRate);
    const note = freqToNote(pitchHz);

    let bpm = null;
    const now = performance.now();

    if(level > 75 && now - this.lastBeat > 260){
      if(this.lastBeat > 0){
        const diff = now - this.lastBeat;
        const instantBpm = Math.round(60000 / diff);

        if(instantBpm >= 60 && instantBpm <= 200){
          this.beats.push(instantBpm);
          if(this.beats.length > 8) this.beats.shift();
          bpm = Math.round(this.beats.reduce((a,b)=>a+b,0) / this.beats.length);
        }
      }
      this.lastBeat = now;
    }

    const ev = this.bus.emit("audio.intelligence", {
      level,
      peak,
      pitchHz: pitchHz ? Math.round(pitchHz * 10) / 10 : null,
      note,
      bpm
    });

    this.timeline.add(ev);

    requestAnimationFrame(()=>this.loop());
  }

  stop(){
    this.running = false;
    const ev = this.bus.emit("audio.stopped", {});
    this.timeline.add(ev);
  }
}
