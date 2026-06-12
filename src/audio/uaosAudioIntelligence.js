import { autoCorrelate, freqToNote, guessChordFromNotes } from "./musicTheory.js";

export class UAOSAudioIntelligence {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.ctx = null;
    this.analyser = null;
    this.running = false;
    this.lastBeat = 0;
    this.beats = [];
    this.noteWindow = [];
    this.lastVoiceMidi = null;
    this.voiceGate = false;
  }

  async start(){
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    src.connect(this.analyser);
    this.running = true;

    const ev = this.bus.emit("audio.started", { sampleRate: this.ctx.sampleRate });
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

    if(note && level > 18){
      this.noteWindow.push({ midi: note.midi, ts: Date.now() });
      this.noteWindow = this.noteWindow.filter(n => Date.now() - n.ts < 2200);
    }

    const chord = guessChordFromNotes(this.noteWindow.map(n => n.midi));

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

    if(note && level > 22 && this.lastVoiceMidi !== note.midi){
      const voiceEv = this.bus.emit("voice.midi.draft", {
        note: note.label,
        midi: note.midi,
        velocity: Math.max(30, Math.min(120, level)),
        pitchHz: note.freq
      });
      this.timeline.add(voiceEv);
      this.lastVoiceMidi = note.midi;
      this.voiceGate = true;
    }

    if(level < 10 && this.voiceGate){
      const offEv = this.bus.emit("voice.midi.off", { midi: this.lastVoiceMidi });
      this.timeline.add(offEv);
      this.voiceGate = false;
      this.lastVoiceMidi = null;
    }

    const ev = this.bus.emit("audio.intelligence", {
      level,
      peak,
      pitchHz: pitchHz ? Math.round(pitchHz * 10) / 10 : null,
      note,
      chord,
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
