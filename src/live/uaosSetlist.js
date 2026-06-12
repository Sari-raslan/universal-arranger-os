export class UAOSSetlist {
  constructor(bus, timeline, arranger){
    this.bus = bus;
    this.timeline = timeline;
    this.arranger = arranger;
    this.key = "uaos.v117.setlist";
    this.songs = JSON.parse(localStorage.getItem(this.key) || "null") || [
      { id:"song-1", title:"Demo Pop", bpm:100, chord:"C", section:"INTRO" },
      { id:"song-2", title:"Demo Oriental", bpm:92, chord:"Am", section:"VAR_A" },
      { id:"song-3", title:"Demo Ballad", bpm:76, chord:"F", section:"VAR_B" }
    ];
    this.activeIndex = 0;
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.songs));
  }

  addSong(){
    this.songs.push({
      id:"song-" + Date.now(),
      title:"New Song",
      bpm:100,
      chord:"C",
      section:"INTRO"
    });
    this.save();
  }

  updateSong(i, patch){
    this.songs[i] = { ...this.songs[i], ...patch };
    this.save();
  }

  removeSong(i){
    this.songs.splice(i,1);
    this.save();
  }

  launch(i){
    const song = this.songs[i];
    if(!song) return false;

    this.activeIndex = i;
    this.arranger.setBpm(song.bpm);
    this.arranger.setChord(song.chord);
    this.arranger.setSection(song.section);

    const ev = this.bus.emit("setlist.song.launch", song);
    this.timeline.add(ev);

    return true;
  }

  next(){
    const i = Math.min(this.songs.length - 1, this.activeIndex + 1);
    return this.launch(i);
  }

  previous(){
    const i = Math.max(0, this.activeIndex - 1);
    return this.launch(i);
  }

  exportSetlist(){
    return JSON.stringify({
      product:"UAOS",
      version:"1.17-setlist",
      exportedAt:new Date().toISOString(),
      songs:this.songs
    }, null, 2);
  }
}
