const { createSetScanner } = require("../services/setScanner");
const { listDeviceProfiles, getDeviceProfile } = require("../services/deviceProfiles");
const { createSmartSequencerService } = require("../services/smartSequencer");

function publicError(res, status, code, message) {
  return res.status(status).json({
    ok: false,
    error: { code, message }
  });
}

function createSetHardwareApiRouter(express, options = {}) {
  const router = express.Router();
  const allowedRoots = (options.allowedRoots || []).filter(Boolean);
  const scanner = createSetScanner({ allowedRoots });
  const sequencer = createSmartSequencerService();

  router.get("/hardware/devices", (_req, res) => {
    res.json({ ok: true, data: listDeviceProfiles() });
  });

  router.post("/set/scan", async (req, res) => {
    try {
      const inputPath = req.body && req.body.path;
      if (!inputPath || typeof inputPath !== "string") {
        return publicError(res, 400, "INVALID_PATH", "A scan path is required.");
      }
      const data = await scanner.scan(inputPath);
      return res.json({ ok: true, data });
    } catch (error) {
      if (error.code === "PATH_OUTSIDE_ALLOWED_ROOT" || error.code === "SYMLINK_NOT_ALLOWED") {
        return publicError(res, 403, error.code, "The requested path is not allowed.");
      }
      if (error.code === "INVALID_PATH" || error.code === "NOT_A_DIRECTORY") {
        return publicError(res, 400, error.code, error.message);
      }
      if (error.code === "ENOENT") {
        return publicError(res, 404, "PATH_NOT_FOUND", "The requested path was not found.");
      }
      return publicError(res, 500, "SET_SCAN_FAILED", "The SET scan failed.");
    }
  });

  router.post("/smart-sequencer/analyze", async (req, res) => {
    const body = req.body || {};
    const durationSeconds = Number(body.durationSeconds);
    const tempoHint = body.tempoHint === "" || body.tempoHint == null ? 120 : Number(body.tempoHint);

    if (!body.title || typeof body.title !== "string") {
      return publicError(res, 400, "INVALID_TITLE", "A title is required.");
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 21600) {
      return publicError(res, 400, "INVALID_DURATION", "Duration must be between 1 and 21600 seconds.");
    }
    if (!Number.isFinite(tempoHint) || tempoHint < 20 || tempoHint > 300) {
      return publicError(res, 400, "INVALID_TEMPO", "Tempo must be between 20 and 300 BPM.");
    }
    if (!getDeviceProfile(body.deviceProfileId)) {
      return publicError(res, 400, "INVALID_DEVICE_PROFILE", "Unknown device profile.");
    }

    const job = sequencer.createJob({
      title: body.title.trim().slice(0, 160),
      durationSeconds,
      tempoHint,
      timeSignatureHint: body.timeSignatureHint || "4/4",
      deviceProfileId: body.deviceProfileId
    });

    setImmediate(() => {
      sequencer.processJob(job.jobId).catch(() => {});
    });

    return res.status(202).json({
      ok: true,
      data: { jobId: job.jobId, status: job.status }
    });
  });

  router.get("/smart-sequencer/status/:jobId", (req, res) => {
    const job = sequencer.getJob(req.params.jobId);
    if (!job) {
      return publicError(res, 404, "JOB_NOT_FOUND", "The Smart Sequencer job was not found.");
    }
    return res.json({ ok: true, data: job });
  });

  return router;
}

module.exports = { createSetHardwareApiRouter };
