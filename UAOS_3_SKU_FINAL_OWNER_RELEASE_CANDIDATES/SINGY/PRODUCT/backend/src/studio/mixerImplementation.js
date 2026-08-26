/**
 * Offline mixer implementation — gain/pan/mute ops on contract channels.
 * No realtime DSP claim.
 */
import { createMixerContract, validateMixerState } from "./mixerContract.js";

export function applyChannelGain(state, channelId, gainDb) {
  const next = {
    ...state,
    channels: state.channels.map((ch) => (ch.id === channelId ? { ...ch, gainDb } : ch)),
    realtimeDsp: false
  };
  const v = validateMixerState(next);
  return v.ok ? { ok: true, state: next } : { ok: false, errorCode: v.errorCode };
}

export function toggleMute(state, channelId) {
  const next = {
    ...state,
    channels: state.channels.map((ch) => (ch.id === channelId ? { ...ch, mute: !ch.mute } : ch)),
    realtimeDsp: false
  };
  return { ok: true, state: next };
}

export function runMixerImplementation() {
  const base = createMixerContract();
  const gained = applyChannelGain(base, "ch1", -6);
  const muted = toggleMute(gained.state, "ch2");
  const invalid = applyChannelGain(base, "ch1", 99);
  return {
    ok: base.ok && gained.ok && muted.ok && !invalid.ok && muted.state.channels[1].mute === true,
    channelCount: muted.state.channels.length,
    realtimeDsp: false,
    musicalQualityClaim: false
  };
}
