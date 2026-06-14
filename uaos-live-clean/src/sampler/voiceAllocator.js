function clampMidi(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`${label} must be an integer from 0 to 127`);
  }
  return value;
}

export class VoiceAllocator {
  constructor({ maxVoices = 64 } = {}) {
    if (!Number.isInteger(maxVoices) || maxVoices < 1 || maxVoices > 512) {
      throw new RangeError("maxVoices must be an integer from 1 to 512");
    }

    this.maxVoices = maxVoices;
    this.nextVoiceId = 1;
    this.voices = [];
  }

  noteOn({
    note,
    velocity,
    sampleId,
    chokeGroup = null,
    startedAt = Date.now(),
  }) {
    clampMidi(note, "note");
    clampMidi(velocity, "velocity");

    if (typeof sampleId !== "string" || sampleId.trim() === "") {
      throw new TypeError("sampleId is required");
    }

    const chokedVoices = [];
    if (chokeGroup) {
      for (const voice of this.voices.filter((item) => item.chokeGroup === chokeGroup)) {
        chokedVoices.push(voice);
      }
      this.voices = this.voices.filter((item) => item.chokeGroup !== chokeGroup);
    }

    let stolenVoice = null;
    if (this.voices.length >= this.maxVoices) {
      this.voices.sort((a, b) => {
        if (a.startedAt !== b.startedAt) {
          return a.startedAt - b.startedAt;
        }
        return a.id - b.id;
      });
      stolenVoice = this.voices.shift() || null;
    }

    const voice = Object.freeze({
      id: this.nextVoiceId++,
      note,
      velocity,
      sampleId,
      chokeGroup,
      startedAt,
    });

    this.voices.push(voice);

    return {
      voice,
      stolenVoice,
      chokedVoices,
      activeVoiceCount: this.voices.length,
    };
  }

  noteOff(note) {
    clampMidi(note, "note");
    const released = this.voices.filter((voice) => voice.note === note);
    this.voices = this.voices.filter((voice) => voice.note !== note);
    return released;
  }

  panic() {
    const released = [...this.voices];
    this.voices = [];
    return released;
  }

  getActiveVoices() {
    return [...this.voices].sort((a, b) => a.id - b.id);
  }
}