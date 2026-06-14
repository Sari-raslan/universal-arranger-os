import { playbackRateForNotes } from "./instrumentPreset.js";

function safeCancel(parameter, time) {
  try {
    parameter.cancelScheduledValues(time);
  } catch {
    // Older runtimes may not expose cancellation consistently.
  }
}

export class SampleVoiceEngine {
  constructor(audioContext) {
    if (!audioContext) {
      throw new TypeError("AudioContext is required.");
    }

    this.context = audioContext;
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = 0.9;
    this.masterGain.connect(audioContext.destination);
    this.voices = new Map();
  }

  setMasterGain(value) {
    const next = Math.min(2, Math.max(0, Number(value)));
    this.masterGain.gain.setTargetAtTime(
      next,
      this.context.currentTime,
      0.01,
    );
  }

  play({
    voiceId,
    buffer,
    note,
    rootNote,
    velocity,
    sampleGain = 1,
    samplePan = 0,
    envelope,
    filter,
  }) {
    if (!buffer) {
      throw new TypeError("Decoded AudioBuffer is required.");
    }

    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    const amp = this.context.createGain();
    const tone = this.context.createBiquadFilter();
    const panner = typeof this.context.createStereoPanner === "function"
      ? this.context.createStereoPanner()
      : null;

    source.buffer = buffer;
    source.playbackRate.value = playbackRateForNotes(note, rootNote);

    tone.type = filter.type || "lowpass";
    tone.frequency.value = Math.min(
      this.context.sampleRate / 2,
      Math.max(20, Number(filter.cutoff || 18000)),
    );
    tone.Q.value = Math.max(0.0001, Number(filter.resonance || 0.7));

    if (panner) {
      panner.pan.value = Math.min(1, Math.max(-1, Number(samplePan || 0)));
    }

    const peak = Math.max(
      0.0001,
      Math.min(2, (Number(velocity) / 127) * Number(sampleGain || 1)),
    );
    const attack = Math.max(0, Number(envelope.attack || 0));
    const decay = Math.max(0, Number(envelope.decay || 0));
    const sustain = Math.min(1, Math.max(0, Number(envelope.sustain ?? 1)));

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(peak, now + attack);
    amp.gain.linearRampToValueAtTime(
      Math.max(0.0001, peak * sustain),
      now + attack + decay,
    );

    source.connect(tone);
    tone.connect(amp);

    if (panner) {
      amp.connect(panner);
      panner.connect(this.masterGain);
    } else {
      amp.connect(this.masterGain);
    }

    const voice = {
      id: voiceId,
      source,
      amp,
      tone,
      panner,
      released: false,
      startedAt: now,
    };

    source.onended = () => {
      this.voices.delete(voiceId);
    };

    this.voices.set(voiceId, voice);
    source.start();

    return voice;
  }

  release(voiceId, releaseSeconds = 0.35) {
    const voice = this.voices.get(voiceId);

    if (!voice || voice.released) {
      return false;
    }

    voice.released = true;

    const now = this.context.currentTime;
    const release = Math.max(0.01, Number(releaseSeconds || 0.35));
    const gain = voice.amp.gain;

    safeCancel(gain, now);
    gain.setValueAtTime(Math.max(0.0001, gain.value), now);
    gain.exponentialRampToValueAtTime(0.0001, now + release);

    try {
      voice.source.stop(now + release + 0.03);
    } catch {
      // The source may already have ended.
    }

    return true;
  }

  stopImmediately(voiceId) {
    const voice = this.voices.get(voiceId);

    if (!voice) {
      return false;
    }

    try {
      voice.source.stop();
    } catch {
      // Already stopped.
    }

    this.voices.delete(voiceId);
    return true;
  }

  panic() {
    const ids = [...this.voices.keys()];

    for (const id of ids) {
      this.stopImmediately(id);
    }

    return ids.length;
  }

  getActiveVoiceIds() {
    return [...this.voices.keys()];
  }

  destroy() {
    this.panic();

    try {
      this.masterGain.disconnect();
    } catch {
      // Already disconnected.
    }
  }
}