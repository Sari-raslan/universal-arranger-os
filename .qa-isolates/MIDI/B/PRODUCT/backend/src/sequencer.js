export class Sequencer {
  constructor(){
    this.steps = Array.from({length:16}, (_,i)=>({
      step: i + 1,
      kick: i % 4 === 0,
      snare: i % 8 === 4,
      hat: i % 2 === 0,
      bass: i % 4 === 0
    }));
    this.position = 0;
    this.running = false;
    this.bassPatternMidi = [36, 41, 43, 36];
  }
  start(){ this.running = true; return this.status(); }
  stop(){ this.running = false; return this.status(); }
  toggle(track, step){
    const s = this.steps[step-1];
    if(!s || !(track in s)) return this.status();
    s[track] = !s[track];
    return this.status();
  }
  tick(){
    if(this.running) this.position = (this.position % 16) + 1;
    return this.status();
  }
  status(){ return { ok:true, running:this.running, position:this.position, steps:this.steps }; }

  /**
   * Offline score for the independent musical sketch renderer.
   * Not V13 Mixer. Not Musical Brain quality PASS.
   */
  toRenderEvents({ tempo = 120, bars = 2, includeBass = true } = {}) {
    const sixteenth = (60 / tempo) / 4;
    const events = [];
    let bassHit = 0;
    for (let bar = 0; bar < bars; bar += 1) {
      for (const step of this.steps) {
        const startSec = (bar * 16 + (step.step - 1)) * sixteenth;
        if (step.kick) {
          events.push({ midi: 36, startSec, durationSec: 0.14, voice: "kick", velocity: 0.92 });
        }
        if (step.snare) {
          events.push({ midi: 38, startSec, durationSec: 0.1, voice: "snare", velocity: 0.78 });
        }
        if (step.hat) {
          events.push({ midi: 42, startSec, durationSec: 0.04, voice: "hat", velocity: 0.35 });
        }
        if (includeBass && step.bass) {
          const midi = this.bassPatternMidi[bassHit % this.bassPatternMidi.length];
          bassHit += 1;
          events.push({ midi, startSec, durationSec: sixteenth * 3.2, voice: "bass", wave: "saw", velocity: 0.7 });
        }
      }
    }
    return events;
  }
}