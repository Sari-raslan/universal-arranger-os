
class RuntimeOrchestrator {
  constructor({midi,chordDetector,stylePlayer,sampler,hardware,ai}){
    this.midi = midi;
    this.chordDetector = chordDetector;
    this.stylePlayer = stylePlayer;
    this.sampler = sampler;
    this.hardware = hardware;
    this.ai = ai;
    this.events = [];
  }

  noteOn(note){
    const midiEvent = this.midi.noteOn(note);

    const chord = this.chordDetector.noteOn(note);

    if(chord.detected){
      const suggestion = this.ai.suggestStyle(chord.chord);

      this.stylePlayer.loadStyle(suggestion.suggestion);

      this.events.push({
        type:"styleSuggestion",
        chord:chord.chord,
        style:suggestion.suggestion,
        time:Date.now()
      });
    }

    this.sampler.trigger("RealtimeVoice",note,100);

    return {
      ok:true,
      midiEvent,
      chord,
      style:this.stylePlayer.status(),
      sampler:this.sampler.status()
    };
  }

  noteOff(note){
    return {
      ok:true,
      midi:this.midi.noteOff(note),
      chord:this.chordDetector.noteOff(note)
    };
  }

  runtimeStatus(){
    return {
      ok:true,
      modules:{
        midi:this.midi.status(),
        arranger:this.stylePlayer.status(),
        sampler:this.sampler.status(),
        hardware:this.hardware.status(),
        ai:this.ai.status()
      },
      orchestration:{
        active:true,
        recentEvents:this.events.slice(-20)
      }
    };
  }
}

module.exports = { RuntimeOrchestrator };
