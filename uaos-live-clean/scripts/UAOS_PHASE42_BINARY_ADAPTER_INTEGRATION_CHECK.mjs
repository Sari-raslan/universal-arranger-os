import {
  createBinaryAdapterExport,
  inspectBinaryAdapterExport,
  validateBinaryAdapterExport
} from "../src/hardware/binary/uaosBinaryAdapterIntegration.js";

const profiles = [
  "korg_pa3x_oriental",
  "korg_pa5x",
  "yamaha_genos",
  "roland_bk9",
  "ketron_sd9"
];

for (const deviceProfileId of profiles) {
  const result = createBinaryAdapterExport({
    deviceProfileId,
    packageManifest: {
      format: "UAOS_HARDWARE_EXPORT_PACKAGE",
      projectName: `UAOS Phase 42 ${deviceProfileId}`,
      target: deviceProfileId.split("_")[0],
      styleMap: {
        tempo: 100,
        sections: [
          { id: "intro1", bars: 4 },
          { id: "mainA", bars: 8 },
          { id: "fill1", bars: 1 },
          { id: "ending1", bars: 4 }
        ],
        tracks: [
          { id: "drums", channel: 10 },
          { id: "bass", channel: 2 },
          { id: "chords", channel: 3 }
        ]
      }
    }
  });

  const valid = validateBinaryAdapterExport(result);
  if (!valid.ok) {
    throw new Error(`${deviceProfileId}: ${valid.errors.join(", ")}`);
  }

  const info = inspectBinaryAdapterExport(result);
  if (info.binaryMagic !== "UAOSBIN1") {
    throw new Error(`${deviceProfileId}: invalid magic`);
  }

  if (info.realBinaryExportReady !== false) {
    throw new Error(`${deviceProfileId}: unsafe readiness claim`);
  }

  console.log(`PASS ${deviceProfileId}: ${result.byteLength} bytes`);
}

console.log("PHASE 42 BINARY ADAPTER INTEGRATION CHECK PASS");
