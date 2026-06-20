export class MidiRouter {
  constructor() {
    this.outputs = [];
    this.log = [];
  }

  addOutput(output) {
    if (output && typeof output.send === "function") this.outputs.push(output);
    return this.outputs.length;
  }

  send(message) {
    this.log.push({ time: Date.now(), message });
    for (const output of this.outputs) output.send(message);
    return message;
  }

  noteOn(note, velocity = 100, channel = 0) { return this.send([0x90 + channel, note, velocity]); }
  noteOff(note, channel = 0) { return this.send([0x80 + channel, note, 0]); }
  controlChange(controller, value, channel = 0) { return this.send([0xB0 + channel, controller, value]); }
  programChange(program, channel = 0) { return this.send([0xC0 + channel, program]); }
}
