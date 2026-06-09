export class ChordEngine {
  detect(notes=[]){
    if(!notes.length) return { ok:true, chord:"N/A", notes };
    const root = notes[0] % 12;
    const names = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
    return { ok:true, chord:names[root] + "m/auto", notes };
  }
}