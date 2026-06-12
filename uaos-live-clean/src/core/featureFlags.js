export const FEATURE_FLAGS = Object.freeze({
  audioLab: "available",
  midiMonitor: "available",
  timeline: "available",
  arranger: "experimental",
  liveMode: "experimental",
  sampler: "planned",
  desktopBridge: "desktop only"
});

export function getFeatureStatus(name) {
  return FEATURE_FLAGS[name] || "planned";
}

