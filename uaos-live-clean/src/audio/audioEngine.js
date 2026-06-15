import { VoiceAllocator } from "../sampler/voiceAllocator.js";

const DEFAULT_CHANNELS = Object.freeze(["master", "sampler", "arranger", "recording"]);

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value)));
}

function createParam(value = 0) {
  return {
    value,
    setTargetAtTime(next) {
      this.value = next;
    },
    setValueAtTime(next) {
      this.value = next;
    },
    linearRampToValueAtTime(next) {
      this.value = next;
    },
    exponentialRampToValueAtTime(next) {
      this.value = next;
    },
    cancelScheduledValues() {},
  };
}

function createSilentNode() {
  return {
    gain: createParam(1),
    pan: createParam(0),
    connect() {
      return this;
    },
    disconnect() {},
  };
}

function createFallbackContext() {
  return {
    state: "unsupported",
    currentTime: 0,
    sampleRate: 48000,
    destination: createSilentNode(),
    createGain: createSilentNode,
    createStereoPanner: createSilentNode,
    createAnalyser() {
      return {
        fftSize: 2048,
        connect() {},
        disconnect() {},
        getByteTimeDomainData(array) {
          array.fill(128);
        },
      };
    },
    resume() {
      this.state = "running";
      return Promise.resolve();
    },
    suspend() {
      this.state = "suspended";
      return Promise.resolve();
    },
  };
}

export class AudioEngine {
  constructor({
    AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext,
    maxPolyphony = 64,
    channelNames = DEFAULT_CHANNELS,
  } = {}) {
    this.AudioContextClass = AudioContextClass;
    this.context = null;
    this.supported = typeof AudioContextClass === "function";
    this.allocator = new VoiceAllocator({ maxVoices: maxPolyphony });
    this.maxPolyphony = maxPolyphony;
    this.channels = new Map();
    this.soloChannels = new Set();
    this.mutedChannels = new Set();
    this.sustain = false;
    this.sustainedNotes = new Set();
    this.transpose = 0;
    this.fineTuneCents = 0;
    this.pitchBend = 0;
    this.meter = { peak: 0, rms: 0, clipping: false };
    this.channelNames = channelNames;
  }

  ensureContext() {
    if (!this.context) {
      this.context = this.supported ? new this.AudioContextClass() : createFallbackContext();
      this.masterGain = this.context.createGain();
      this.analyser = this.context.createAnalyser();
      this.masterGain.gain.value = 0.9;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.context.destination);

      for (const name of this.channelNames) {
        this.createChannel(name);
      }
    }

    return this.context;
  }

  async resume() {
    const context = this.ensureContext();
    if (context.state === "suspended" || context.state === "unsupported") {
      await context.resume();
    }
    return this.getStatus();
  }

  async suspend() {
    const context = this.ensureContext();
    if (context.state === "running") {
      await context.suspend();
    }
    return this.getStatus();
  }

  createChannel(name) {
    const context = this.ensureContext();
    if (this.channels.has(name)) {
      return this.channels.get(name);
    }

    const gain = context.createGain();
    const pan = typeof context.createStereoPanner === "function"
      ? context.createStereoPanner()
      : null;

    if (pan) {
      gain.connect(pan);
      pan.connect(this.masterGain);
    } else {
      gain.connect(this.masterGain);
    }

    const channel = { name, gain, pan, muted: false, solo: false, level: 1 };
    this.channels.set(name, channel);
    return channel;
  }

  setMasterGain(value) {
    this.ensureContext();
    const next = clamp(value, 0, 2);
    this.masterGain.gain.setTargetAtTime(next, this.context.currentTime, 0.01);
    return next;
  }

  setChannelGain(name, value) {
    const channel = this.createChannel(name);
    channel.level = clamp(value, 0, 2);
    this.applyChannelMix();
    return channel.level;
  }

  setChannelPan(name, value) {
    const channel = this.createChannel(name);
    if (channel.pan) {
      channel.pan.pan.setTargetAtTime(clamp(value, -1, 1), this.context.currentTime, 0.01);
    }
    return clamp(value, -1, 1);
  }

  setMute(name, muted) {
    const channel = this.createChannel(name);
    channel.muted = Boolean(muted);
    if (channel.muted) this.mutedChannels.add(name);
    else this.mutedChannels.delete(name);
    this.applyChannelMix();
  }

  setSolo(name, solo) {
    const channel = this.createChannel(name);
    channel.solo = Boolean(solo);
    if (channel.solo) this.soloChannels.add(name);
    else this.soloChannels.delete(name);
    this.applyChannelMix();
  }

  applyChannelMix() {
    const hasSolo = this.soloChannels.size > 0;
    for (const [name, channel] of this.channels) {
      const audible = !channel.muted && (!hasSolo || this.soloChannels.has(name));
      channel.gain.gain.setTargetAtTime(audible ? channel.level : 0, this.context.currentTime, 0.01);
    }
  }

  setTranspose(semitones) {
    this.transpose = clamp(semitones, -48, 48);
    return this.transpose;
  }

  setFineTune(cents) {
    this.fineTuneCents = clamp(cents, -100, 100);
    return this.fineTuneCents;
  }

  setPitchBend(centeredValue) {
    this.pitchBend = clamp(centeredValue, -8192, 8191);
    return this.pitchBend;
  }

  setSustain(enabled) {
    this.sustain = Boolean(enabled);
    if (!this.sustain) {
      const notes = [...this.sustainedNotes];
      this.sustainedNotes.clear();
      return notes;
    }
    return [];
  }

  allocateVoice({ note, velocity, sampleId, chokeGroup, startedAt }) {
    const allocation = this.allocator.noteOn({
      note: clamp(note + this.transpose, 0, 127),
      velocity,
      sampleId,
      chokeGroup,
      startedAt,
    });
    return allocation;
  }

  noteOff(note) {
    if (this.sustain) {
      this.sustainedNotes.add(clamp(note + this.transpose, 0, 127));
      return [];
    }
    return this.allocator.noteOff(clamp(note + this.transpose, 0, 127));
  }

  panic() {
    const voices = this.allocator.panic();
    this.sustain = false;
    this.sustainedNotes.clear();
    return voices;
  }

  updateMeter(samples = null) {
    if (!samples && this.analyser) {
      samples = new Uint8Array(this.analyser.fftSize || 2048);
      this.analyser.getByteTimeDomainData(samples);
      samples = Array.from(samples, (value) => (value - 128) / 128);
    }

    let peak = 0;
    let sum = 0;
    for (const sample of samples || []) {
      const absolute = Math.abs(Number(sample));
      peak = Math.max(peak, absolute);
      sum += absolute * absolute;
    }
    const rms = samples?.length ? Math.sqrt(sum / samples.length) : 0;
    this.meter = { peak, rms, clipping: peak >= 0.98 };
    return this.meter;
  }

  getStatus() {
    const context = this.ensureContext();
    return {
      supported: this.supported,
      state: context.state,
      maxPolyphony: this.maxPolyphony,
      activeVoices: this.allocator.getActiveVoices().length,
      sustain: this.sustain,
      transpose: this.transpose,
      fineTuneCents: this.fineTuneCents,
      pitchBend: this.pitchBend,
      meter: this.meter,
      channels: [...this.channels.values()].map((channel) => ({
        name: channel.name,
        gain: channel.level,
        muted: channel.muted,
        solo: channel.solo,
        pan: channel.pan?.pan?.value ?? 0,
      })),
    };
  }
}
