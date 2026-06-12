export class UAOSMidiEngine {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.access = null;
    this.outputs = [];
    this.selectedOutputId = "";
  }

  async start(){
    if(!navigator.requestMIDIAccess){
      const ev = this.bus.emit("midi.unsupported", {});
      this.timeline.add(ev);
      return;
    }

    this.access = await navigator.requestMIDIAccess();

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

        const ev = this.bus.emit(type, {
          device: input.name,
          status,
          command,
          channel,
          note,
          velocity
        });

        this.timeline.add(ev);
      };
    });
  }

  setOutput(id){
    this.selectedOutputId = id;
  }

  sendNote(note = 60, velocity = 100, duration = 250, channel = 1){
    const output = this.outputs.find(o => o.id === this.selectedOutputId) || this.outputs[0];
    if(!output) return false;

    const ch = Math.max(0, Math.min(15, channel - 1));
    output.send([0x90 + ch, note, velocity]);

    setTimeout(()=>{
      output.send([0x80 + ch, note, 0]);
    }, duration);

    return true;
  }
}
