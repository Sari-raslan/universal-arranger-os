export const SINGER_UPLOAD_GATE = Object.freeze({
  gate: "SINGER-REAL-PRODUCT-GATE-04-AUDIO-RECORD-UPLOAD-UI-MODEL",
  mode: "SAFE_AUDIO_RECORD_UPLOAD_MODEL",
  sale: "LOCKED",
  payment: "NOT_ACTIVE",
  maxBytes: 52428800,
  allowedTypes: ["audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/webm"]
});

export function validateSingerAudioInput(file = {}) {
  const name = String(file.name || "");
  const type = String(file.type || "");
  const size = Number(file.size || 0);
  const warnings = [];
  const errors = [];
  if (!name) errors.push("MISSING_FILE_NAME");
  if (!SINGER_UPLOAD_GATE.allowedTypes.includes(type)) errors.push("UNSUPPORTED_AUDIO_TYPE");
  if (size <= 0) errors.push("EMPTY_AUDIO_FILE");
  if (size > SINGER_UPLOAD_GATE.maxBytes) errors.push("AUDIO_FILE_TOO_LARGE");
  if (type === "audio/webm") warnings.push("WEBM_BROWSER_RECORDING_REQUIRES_DECODE_GATE");
  return {
    gate: SINGER_UPLOAD_GATE.gate,
    mode: SINGER_UPLOAD_GATE.mode,
    sale: SINGER_UPLOAD_GATE.sale,
    payment: SINGER_UPLOAD_GATE.payment,
    name, type, size,
    valid: errors.length === 0,
    errors, warnings,
    nextGate: "SINGER-REAL-PRODUCT-GATE-05-PITCH-DETECTION-PROOF"
  };
}
