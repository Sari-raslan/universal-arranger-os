export const DEFAULT_SONG_SECTIONS = [
  { id:"intro", name:"Intro", section:"INTRO", chord:"C", bars:4 },
  { id:"verse", name:"Verse", section:"VAR_A", chord:"Am", bars:8 },
  { id:"chorus", name:"Chorus", section:"VAR_B", chord:"F", bars:8 },
  { id:"fill", name:"Fill", section:"FILL", chord:"G", bars:1 },
  { id:"ending", name:"Ending", section:"ENDING", chord:"C", bars:4 }
];

export class UAOSSongArrangement {
  constructor(bus, timeline, arranger){
    this.bus = bus;
    this.timeline = timeline;
    this.arranger = arranger;
    this.key = "uaos.v115.songArrangement";
    this.sections = JSON.parse(localStorage.getItem(this.key) || "null") || DEFAULT_SONG_SECTIONS;
    this.index = 0;
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.sections));
  }

  addSection(){
    this.sections.push({
      id:"section-" + Date.now(),
      name:"New Section",
      section:"VAR_A",
      chord:"C",
      bars:4
    });
    this.save();
  }

  updateSection(i, patch){
    this.sections[i] = {
      ...this.sections[i],
      ...patch
    };
    this.save();
  }

  removeSection(i){
    this.sections.splice(i,1);
    this.save();
  }

  trigger(i){
    const s = this.sections[i];
    if(!s) return;

    this.index = i;

    this.arranger?.setSection?.(s.section);
    this.arranger?.setChord?.(s.chord);

    const ev = this.bus.emit("song.section.trigger", s);
    this.timeline.add(ev);
  }

  exportSong(){
    return JSON.stringify({
      product:"UAOS",
      version:"1.15-song-arrangement",
      exportedAt:new Date().toISOString(),
      sections:this.sections
    }, null, 2);
  }
}
