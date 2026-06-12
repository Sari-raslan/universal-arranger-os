import { createAllNotesOffMessages } from "../midi/midiEngine.js";

export function createMixer(lanes = []) {
  return {
    masterVolume: 100,
    lanes: Object.fromEntries(lanes.map((lane) => [lane, { volume: 100, pan: 64, mute: false, solo: false, meter: 0, clipping: false, output: "" }])),
    scenes: []
  };
}

export function updateMixerLane(mixer, lane, patch) {
  return { ...mixer, lanes: { ...mixer.lanes, [lane]: { ...mixer.lanes[lane], ...patch } } };
}

export function saveMixerScene(mixer, name = `Mixer Scene ${mixer.scenes.length + 1}`) {
  return { ...mixer, scenes: [...mixer.scenes, { name, masterVolume: mixer.masterVolume, lanes: mixer.lanes }] };
}

export function recallMixerScene(mixer, index) {
  const scene = mixer.scenes[index];
  return scene ? { ...mixer, masterVolume: scene.masterVolume, lanes: scene.lanes } : mixer;
}

export function resetMixer(mixer) {
  return createMixer(Object.keys(mixer.lanes));
}

export function mixerPanic() {
  return createAllNotesOffMessages();
}

