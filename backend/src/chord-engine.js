const names = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];

export class ChordEngine {
  detect(notes=[]){
    const pcs = [...new Set(notes.map(n => Number(n) % 12))].sort((a,b)=>a-b);
    if(!pcs.length) return { ok:true, chord:"N/A", notes };

    for(const root of pcs){
      const rel = pcs.map(n => (n - root + 12) % 12);
      if(rel.includes(4) && rel.includes(7)) return { ok:true, chord:names[root], quality:"major", notes };
      if(rel.includes(3) && rel.includes(7)) return { ok:true, chord:names[root] + "m", quality:"minor", notes };
      if(rel.includes(3) && rel.includes(6)) return { ok:true, chord:names[root] + "dim", quality:"diminished", notes };
      if(rel.includes(4) && rel.includes(8)) return { ok:true, chord:names[root] + "aug", quality:"augmented", notes };
    }

    return { ok:true, chord:names[pcs[0]] + "5", quality:"power/unknown", notes };
  }
}