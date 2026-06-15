const DEVICE_LIMITS = Object.freeze({
  "korg-pa3x": {
    manufacturer: "KORG",
    model: "PA3X",
    maxStyleTracks: 8,
    format: "KORG_STYLE",
    extensions: [".sty"],
  },
  "korg-pa5x": {
    manufacturer: "KORG",
    model: "PA5X",
    maxStyleTracks: 8,
    format: "KORG_STYLE",
    extensions: [".sty"],
  },
  "yamaha-genos": {
    manufacturer: "Yamaha",
    model: "Genos",
    maxStyleTracks: 8,
    format: "YAMAHA_STYLE",
    extensions: [".sty", ".prs", ".sst"],
  },
  "roland-bk9": {
    manufacturer: "Roland",
    model: "BK-9",
    maxStyleTracks: 8,
    format: "ROLAND_STYLE",
    extensions: [".stl"],
  },
  "ketron-sd9": {
    manufacturer: "Ketron",
    model: "SD9",
    maxStyleTracks: 8,
    format: "KETRON_STYLE",
    extensions: [".pat"],
  },
});

export function getExportDevice(deviceId) {
  return DEVICE_LIMITS[String(deviceId).toLowerCase()] ?? null;
}

export function classifyTrack(track = {}) {
  const name = String(track.name ?? "").toLowerCase();
  const role = String(track.role ?? "").toLowerCase();
  const source = role || name;

  if (source.includes("drum") || source.includes("perc")) return "drums";
  if (source.includes("bass")) return "bass";
  if (source.includes("chord")) return "chord";
  if (source.includes("pad")) return "pad";
  if (source.includes("phrase")) return "phrase";

  return "other";
}

export function validateProjectForDevice(project, deviceId) {
  const device = getExportDevice(deviceId);

  if (!device) {
    return {
      ok: false,
      errors: ["Unsupported export device: " + deviceId],
      warnings: [],
      device: null,
    };
  }

  const tracks = Array.isArray(project?.tracks) ? project.tracks : [];
  const errors = [];
  const warnings = [];

  if (tracks.length === 0) {
    errors.push("Project has no tracks.");
  }

  if (tracks.length > device.maxStyleTracks) {
    errors.push(
      "Project has " + tracks.length +
      " tracks, but " + device.model +
      " supports " + device.maxStyleTracks +
      " style tracks in this export profile.",
    );
  }

  const classified = tracks.map((track) => ({
    id: track.id ?? null,
    name: track.name ?? "Unnamed Track",
    role: classifyTrack(track),
  }));

  if (!classified.some((track) => track.role === "drums")) {
    warnings.push("No drum track was detected.");
  }

  if (!classified.some((track) => track.role === "bass")) {
    warnings.push("No bass track was detected.");
  }

  return {
    ok: errors.length === 0,
    device,
    errors,
    warnings,
    tracks: classified,
  };
}

export function createDeviceExportPlan(project, deviceId) {
  const validation = validateProjectForDevice(project, deviceId);

  if (!validation.ok) {
    return {
      ok: false,
      validation,
      plan: null,
    };
  }

  return {
    ok: true,
    validation,
    plan: {
      deviceId,
      format: validation.device.format,
      suggestedExtension: validation.device.extensions[0],
      projectName: project.name ?? "UAOS Export",
      tempo: project.tempo ?? 120,
      timeSignature: project.timeSignature ?? "4/4",
      tracks: validation.tracks.map((track, index) => ({
        slot: index + 1,
        ...track,
      })),
      generatedAt: new Date().toISOString(),
      status: "planning-only",
    },
  };
}
