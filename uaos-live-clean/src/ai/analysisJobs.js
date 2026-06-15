export const JOB_STEPS = Object.freeze([
  "queued",
  "loading",
  "decoding",
  "analyzing",
  "generating-melody",
  "detecting-chords",
  "detecting-structure",
  "planning-arrangement",
  "complete",
  "failed",
  "cancelled",
]);

export class AnalysisJobSystem {
  constructor() {
    this.jobs = new Map();
    this.inputIndex = new Map();
    this.counter = 1;
  }

  create({ inputId, sessionId = null, type = "phase5-analysis" } = {}) {
    if (inputId && this.inputIndex.has(inputId)) return this.jobs.get(this.inputIndex.get(inputId));
    const id = `phase5-job-${this.counter++}`;
    const now = new Date().toISOString();
    const job = {
      id,
      inputId,
      sessionId,
      type,
      status: "queued",
      progress: 0,
      currentStep: "queued",
      createdAt: now,
      updatedAt: now,
      error: null,
      cancelled: false,
      attempts: 0,
    };
    this.jobs.set(id, job);
    if (inputId) this.inputIndex.set(inputId, id);
    return job;
  }

  update(id, patch) {
    const current = this.jobs.get(id);
    if (!current) throw new Error("Unknown job.");
    const next = {
      ...current,
      ...patch,
      progress: Math.max(0, Math.min(100, Number(patch.progress ?? current.progress))),
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, next);
    return next;
  }

  step(id, currentStep, progress) {
    if (!JOB_STEPS.includes(currentStep)) throw new Error("Unknown job step.");
    return this.update(id, { currentStep, status: currentStep === "complete" ? "complete" : currentStep, progress });
  }

  cancel(id) {
    return this.update(id, { status: "cancelled", currentStep: "cancelled", progress: 100, cancelled: true });
  }

  fail(id, error) {
    return this.update(id, { status: "failed", currentStep: "failed", error: { message: error.message || String(error) } });
  }

  retry(id) {
    const job = this.jobs.get(id);
    if (!job) throw new Error("Unknown job.");
    return this.update(id, { status: "queued", currentStep: "queued", progress: 0, attempts: job.attempts + 1, error: null, cancelled: false });
  }

  get(id) {
    return this.jobs.get(id) || null;
  }
}
