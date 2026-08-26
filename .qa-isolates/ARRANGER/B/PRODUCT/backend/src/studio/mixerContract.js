/**
 * Offline mixer contract — channel strip schema only.
 * Real-time DSP is explicitly not claimed.
 */
export const MIXER_CHANNEL_SCHEMA = Object.freeze({
  id: "string",
  name: "string",
  gainDb: "number",
  pan: "number",
  mute: "boolean",
  solo: "boolean",
  sends: "array"
});

export function createMixerContract() {
  return {
    schema: "uaos.studio.mixer-contract/v1",
    ok: true,
    realtimeDsp: false,
    offlineEditOnly: true,
    channels: [
      { id: "ch1", name: "Melody", gainDb: 0, pan: 0, mute: false, solo: false, sends: [] },
      { id: "ch2", name: "Pads", gainDb: -3, pan: -0.2, mute: false, solo: false, sends: ["reverb"] },
      { id: "ch3", name: "Drums", gainDb: -1, pan: 0, mute: false, solo: false, sends: [] }
    ],
    channelSchema: MIXER_CHANNEL_SCHEMA,
    allowedPaths: ["backend/src/studio/**", "tests/studio-pro-bundle.test.mjs"],
    humanOnlySteps: [],
    musicalQualityClaim: false
  };
}

export function validateMixerState(state) {
  if (!state || !Array.isArray(state.channels) || state.channels.length < 1) {
    return { ok: false, errorCode: "CHANNELS_REQUIRED" };
  }
  for (const ch of state.channels) {
    if (!ch.id || typeof ch.gainDb !== "number" || typeof ch.mute !== "boolean") {
      return { ok: false, errorCode: "INVALID_CHANNEL", channel: ch?.id || null };
    }
    if (ch.gainDb < -60 || ch.gainDb > 12) return { ok: false, errorCode: "GAIN_OUT_OF_RANGE" };
  }
  if (state.realtimeDsp === true) {
    return { ok: false, errorCode: "REALTIME_DSP_NOT_IMPLEMENTED" };
  }
  return { ok: true, channelCount: state.channels.length, realtimeDsp: false };
}
