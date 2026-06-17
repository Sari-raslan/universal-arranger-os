const DEVICE_PROFILES = Object.freeze([
  Object.freeze({
    id: "korg-pa3x",
    vendor: "KORG",
    model: "PA3X",
    family: "PA",
    supportedImportFormats: [".set", ".sty", ".pcg", ".pad"],
    supportedExportFormats: [],
    midiCapabilities: ["16-channel-midi", "program-change"],
    styleCapabilities: ["style-metadata-indexing"],
    implementationStatus: "partial",
    limitations: ["No proprietary SET decoding", "No hardware write-back"]
  }),
  Object.freeze({
    id: "korg-pa5x",
    vendor: "KORG",
    model: "PA5X",
    family: "PA",
    supportedImportFormats: [".set", ".kst", ".sty"],
    supportedExportFormats: [],
    midiCapabilities: ["16-channel-midi", "program-change"],
    styleCapabilities: ["style-metadata-indexing"],
    implementationStatus: "partial",
    limitations: ["No proprietary KST decoding", "No hardware write-back"]
  }),
  Object.freeze({
    id: "yamaha-genos",
    vendor: "Yamaha",
    model: "Genos",
    family: "Genos",
    supportedImportFormats: [".sty", ".mid", ".midi"],
    supportedExportFormats: [],
    midiCapabilities: ["16-channel-midi"],
    styleCapabilities: ["metadata-only"],
    implementationStatus: "planned",
    limitations: ["No SFF conversion", "No hardware write-back"]
  }),
  Object.freeze({
    id: "roland-bk9",
    vendor: "Roland",
    model: "BK-9",
    family: "BK",
    supportedImportFormats: [".mid", ".midi"],
    supportedExportFormats: [],
    midiCapabilities: ["16-channel-midi"],
    styleCapabilities: ["metadata-only"],
    implementationStatus: "planned",
    limitations: ["No proprietary style conversion", "No hardware write-back"]
  }),
  Object.freeze({
    id: "ketron-sd9",
    vendor: "Ketron",
    model: "SD9",
    family: "SD",
    supportedImportFormats: [".mid", ".midi"],
    supportedExportFormats: [],
    midiCapabilities: ["16-channel-midi"],
    styleCapabilities: ["metadata-only"],
    implementationStatus: "planned",
    limitations: ["No proprietary audio-style conversion", "No hardware write-back"]
  })
]);

function listDeviceProfiles() {
  return DEVICE_PROFILES.map((item) => ({ ...item }));
}

function getDeviceProfile(id) {
  return DEVICE_PROFILES.find((item) => item.id === id) || null;
}

module.exports = {
  DEVICE_PROFILES,
  listDeviceProfiles,
  getDeviceProfile
};
