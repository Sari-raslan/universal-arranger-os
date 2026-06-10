
class SongTimeline {
  constructor(){
    this.tracks = [];
    this.markers = [];
    this.playing = false;
    this.position = 0;
  }

  addTrack(name,type="midi"){
    const track = {
      id:"track_" + Date.now(),
      name,
      type
    };

    this.tracks.push(track);

    return track;
  }

  addMarker(name,bar){
    const marker = {
      id:"marker_" + Date.now(),
      name,
      bar
    };

    this.markers.push(marker);

    return marker;
  }

  play(){
    this.playing = true;
    return this.status();
  }

  stop(){
    this.playing = false;
    return this.status();
  }

  seek(bar){
    this.position = Number(bar);
    return this.status();
  }

  status(){
    return {
      ok:true,
      module:"timeline",
      playing:this.playing,
      position:this.position,
      tracks:this.tracks,
      markers:this.markers
    };
  }
}

module.exports = { SongTimeline };
