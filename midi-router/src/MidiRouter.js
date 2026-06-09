export class MidiRouter {
  constructor() {
    this.outputs = [];
    this.inputs = [];
  }

  addOutput(output) {
    this.outputs.push(output);
  }

  send(message) {
    for (const output of this.outputs) {
      if (output && typeof output.send === "function") {
        output.send(message);
      }
    }
  }

  noteOn(note, velocity = 100, channel = 0) {
    this.send([0x90 + channel, note, velocity]);
  }

  noteOff(note, channel = 0) {
    this.send([0x80 + channel, note, 0]);
  }

  controlChange(controller, value, channel = 0) {
    this.send([0xB0 + channel, controller, value]);
  }

  programChange(program, channel = 0) {
    this.send([0xC0 + channel, program]);
  }
}
