export const RELEASE_STATUS = {
  ok: true,
  app: "Universal Arranger OS",
  version: "V2-V3-production-candidate",
  statusModel: ["available", "experimental", "planned", "not-included"],
  capabilities: {
    browserSecureContext: "available",
    mediaDevices: "available",
    webAudio: "available",
    mediaRecorder: "available",
    webMidi: "experimental",
    localStorage: "available",
    electronBridge: "experimental",
    professionalArranger: "experimental",
    aiLabs: "experimental",
    proprietaryStyleParsing: "not-included",
    trainedCommercialAiModel: "not-included",
    signedInstallers: "planned"
  },
  limitations: [
    "Microphone capture requires user permission and HTTPS or localhost.",
    "MIDI hardware validation requires a connected MIDI device.",
    "Commercial keyboard style parsing is not included.",
    "Cloud AI models are not configured in this release."
  ]
};

export default function handler(req, res) {
  res.status(200).json(RELEASE_STATUS);
}
