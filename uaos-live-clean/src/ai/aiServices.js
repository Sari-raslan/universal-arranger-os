export function createJobQueue() {
  const jobs = new Map();
  return {
    create(type, input) {
      const id = `job-${jobs.size + 1}`;
      const job = { id, type, input, status: "queued", progress: 0, createdAt: new Date().toISOString() };
      jobs.set(id, job);
      return job;
    },
    update(id, patch) {
      const job = { ...jobs.get(id), ...patch };
      jobs.set(id, job);
      return job;
    },
    cancel(id) {
      return this.update(id, { status: "cancelled" });
    },
    get(id) {
      return jobs.get(id);
    },
    deleteUserData() {
      jobs.clear();
    }
  };
}

export const MODEL_REGISTRY = [
  { id: "rule-based-v3", location: "local", requiresSecret: false, status: "available" },
  { id: "cloud-adapter", location: "optional-cloud", requiresSecret: true, status: "not-configured" }
];

