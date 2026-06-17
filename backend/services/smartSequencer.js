const crypto = require("crypto");
const { getDeviceProfile } = require("./deviceProfiles");

function normalizeTimeSignature(value) {
  const candidate = String(value || "4/4").trim();
  return /^\d{1,2}\/\d{1,2}$/.test(candidate) ? candidate : "4/4";
}

function buildSections(durationSeconds) {
  const duration = Math.max(1, Number(durationSeconds || 180));
  const bars = Math.max(16, Math.round(duration / 2));
  return [
    { id: "intro", label: "Intro", bars: Math.max(4, Math.round(bars * 0.1)) },
    { id: "verse", label: "Verse", bars: Math.max(8, Math.round(bars * 0.3)) },
    { id: "chorus", label: "Chorus", bars: Math.max(8, Math.round(bars * 0.3)) },
    { id: "outro", label: "Outro", bars: Math.max(4, Math.round(bars * 0.1)) }
  ];
}

function createSmartSequencerService() {
  const jobs = new Map();

  function createJob(input) {
    const device = getDeviceProfile(input.deviceProfileId);
    if (!device) {
      const error = new Error("Unknown device profile.");
      error.code = "INVALID_DEVICE_PROFILE";
      throw error;
    }

    const jobId = crypto.randomUUID();
    const job = {
      jobId,
      status: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input: { ...input },
      result: null,
      error: null
    };

    jobs.set(jobId, job);
    return { ...job };
  }

  function getJob(jobId) {
    const job = jobs.get(jobId);
    return job ? JSON.parse(JSON.stringify(job)) : null;
  }

  async function processJob(jobId) {
    const job = jobs.get(jobId);
    if (!job) {
      const error = new Error("Job not found.");
      error.code = "JOB_NOT_FOUND";
      throw error;
    }

    job.status = "analyzing";
    job.updatedAt = new Date().toISOString();

    const tempo = Number(job.input.tempoHint || 120);
    const timeSignature = normalizeTimeSignature(job.input.timeSignatureHint);
    const device = getDeviceProfile(job.input.deviceProfileId);

    job.result = {
      detectedTempo: tempo,
      timeSignature,
      sections: buildSections(job.input.durationSeconds),
      trackPlan: [
        { id: "drums", role: "Drums", channel: 10, status: "planned" },
        { id: "bass", role: "Bass", channel: 2, status: "planned" },
        { id: "chords", role: "Chord accompaniment", channel: 3, status: "planned" },
        { id: "pad", role: "Pad", channel: 4, status: "planned" }
      ],
      targetDevice: {
        id: device.id,
        vendor: device.vendor,
        model: device.model
      },
      compatibility: device.implementationStatus,
      warnings: [
        "Result is derived from metadata only.",
        "No proprietary arranger export has been generated."
      ],
      unavailableFeatures: [
        "audio-source-separation",
        "real-audio-analysis",
        "proprietary-style-export"
      ],
      audioAnalysis: {
        status: "unavailable",
        reason: "Audio analysis engine is not connected in this vertical slice."
      }
    };

    job.status = "completed";
    job.updatedAt = new Date().toISOString();
    return getJob(jobId);
  }

  function clearJobs() {
    jobs.clear();
  }

  return { createJob, getJob, processJob, clearJobs };
}

module.exports = {
  createSmartSequencerService,
  buildSections,
  normalizeTimeSignature
};
