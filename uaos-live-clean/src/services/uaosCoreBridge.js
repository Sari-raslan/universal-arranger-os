// UAOS MASTER ENGINE INTERACTIVE MATRIX
export const UAOS_CORE_ENGINE = {
  version: "2.0.0-Xenon",
  totalLanes: 9,
  isLinkedToMainOS: true,
  generateSynthPulse: (audioCtx, freq, type) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq || 440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }
};
