export class MidiRouter {
  scan(){
    return {
      ok:true,
      inputs:["Generic MIDI Input","UAOS Virtual Input"],
      outputs:["Generic MIDI Output","UAOS Virtual Output"]
    };
  }
  send(note=60, velocity=100, channel=1){
    return { ok:true, note, velocity, channel };
  }
}