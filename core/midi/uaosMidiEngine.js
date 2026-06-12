export class UAOSMidiEngine {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.access = null;
  }

  async start(){
    if(!navigator.requestMIDIAccess){
      this.bus.emit("midi.unsupported", {});
      return;
    }

    this.access = await navigator.requestMIDIAccess();
    const inputs = [...this.access.inputs.values()];
    const outputs = [...this.access.outputs.values()];

    this.bus.emit("midi.scan", {
      inputs: inputs.map(i => i.name),
      outputs: outputs.map(o => o.name)
    });

    inputs.forEach(input => {
      input.onmidimessage = msg => {
        const [status, note, velocity] = msg.data;
        const type = velocity > 0 ? "midi.noteon" : "midi.noteoff";
        const ev = { status, note, velocity, device: input.name, time: performance.now() };
        this.bus.emit(type, ev);
        this.timeline?.add(type, ev);
      };
    });
  }
}
