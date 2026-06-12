import { loadKeyboardProfiles, saveKeyboardProfiles } from "../profiles/keyboardProfiles.js";

export class UAOSMidiEngine {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.access = null;
    this.outputs = [];
    this.selectedOutputId = "";
    this.profileKey = "GENERAL_MIDI";
    this.profiles = loadKeyboardProfiles();
    this.recordedNotes = [];
  }

  profile(){
    return this.profiles[this.profileKey] || this.profiles.GENERAL_MIDI;
  }

  getProfiles(){
    return this.profiles;
  }

  updateCurrentProfile(patch){
    this.profiles[this.profileKey] = {
      ...this.profile(),
      ...patch
    };
    saveKeyboardProfiles(this.profiles);

    const ev = this.bus.emit("midi.profile.updated", {
      key: this.profileKey,
      profile: this.profile()
    });
    this.timeline.add(ev);
  }

  setProfile(key){
    this.profileKey = key;
    const ev = this.bus.emit("midi.profile", { key, profile: this.profile() });
    this.timeline.add(ev);
  }

  async start(){
    if(!navigator.requestMIDIAccess){
      const ev = this.bus.emit("midi.unsupported", {});
      this.timeline.add(ev);
      return;
    }

    this.access = await navigator.requestMIDIAccess({ sysex:false });
    const inputs = [...this.access.inputs.values()];
    this.outputs = [...this.access.outputs.values()];

    const scan = this.bus.emit("midi.scan", {
      inputs: inputs.map(i => ({ id: i.id, name: i.name })),
      outputs: this.outputs.map(o => ({ id: o.id, name: o.name }))
    });
    this.timeline.add(scan);

    inputs.forEach(input => {
      input.onmidimessage = msg => {
        const [status, note, velocity] = msg.data;
        const command = status & 0xf0;
        const channel = (status & 0x0f) + 1;

        let type = "midi.raw";
        if(command === 144 && velocity > 0) type = "midi.noteon";
        if(command === 128 || (command === 144 && velocity === 0)) type = "midi.noteoff";

        const payload = { device: input.name, status, command, channel, note, velocity };

        if(type === "midi.noteon"){
          this.recordedNotes.push({ note, velocity, channel, time: performance.now() });
          if(this.recordedNotes.length > 512) this.recordedNotes = this.recordedNotes.slice(-512);
        }

        const ev = this.bus.emit(type, payload);
        this.timeline.add(ev);
      };
    });
  }

  setOutput(id){
    this.selectedOutputId = id;
  }

  output(){
    return this.outputs.find(o => o.id === this.selectedOutputId) || this.outputs[0];
  }

  sendRaw(bytes){
    const output = this.output();
    if(!output || !bytes) return false;
    output.send(bytes);
    return true;
  }

  sendNote(note = 60, velocity = 100, duration = 250, channel = null){
    const output = this.output();
    if(!output) return false;

    const profile = this.profile();
    const ch = Math.max(0, Math.min(15, (channel || profile.channel) - 1));
    const finalNote = Math.max(0, Math.min(127, note + (profile.transpose || 0)));

    output.send([0x90 + ch, finalNote, velocity]);
    setTimeout(()=>output.send([0x80 + ch, finalNote, 0]), duration);

    return true;
  }

  transportStart(){ return this.sendRaw(this.profile().controls.start); }
  transportStop(){ return this.sendRaw(this.profile().controls.stop); }
  sendSection(section){ return this.sendRaw(this.profile().sections[section]); }

  getRecordedNotes(){ return this.recordedNotes; }
  clearRecordedNotes(){ this.recordedNotes = []; }
}
