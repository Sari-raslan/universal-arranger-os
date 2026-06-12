import { PitchDetector } from "pitchy";
import { frequencyToNote } from "../core/music.js";

export function analyzeAudioFrame(data, sampleRate) {
  let sum = 0;
  let peak = 0;
  for (const sample of data) {
    sum += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }

  const rms = Math.sqrt(sum / data.length);
  const detector = PitchDetector.forFloat32Array(data.length);
  const [pitch, clarity] = detector.findPitch(data, sampleRate);
  const stable = clarity >= 0.82 && pitch >= 40 && pitch <= 2000;
  const note = stable ? frequencyToNote(pitch) : { midi: null, name: "--" };

  return {
    rms,
    peak,
    clipping: peak >= 0.98,
    pitch: stable ? pitch : null,
    confidence: stable ? clarity : 0,
    note
  };
}

export function chooseRecordingMimeType(mediaRecorder = MediaRecorder) {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((type) => mediaRecorder?.isTypeSupported?.(type)) || "";
}

export function extensionForMimeType(mimeType) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("webm")) return "webm";
  return "audio";
}

