export const PROVIDER_CAPABILITIES = Object.freeze({
  localDeterministic: ["audio-analysis", "voice-melody", "arrangement-plan", "offline"],
  mock: ["tests"],
  remoteDisabled: ["requires-explicit-consent", "cost-warning", "disabled-by-default"],
});

export function createProviderRequest(task, payload, metadata = {}) {
  return {
    schemaVersion: 1,
    task,
    payload,
    metadata,
    createdAt: new Date().toISOString(),
    upload: false,
  };
}

export function normalizeProviderError(error) {
  return {
    message: error?.message || "Provider failed.",
    code: error?.code || "PROVIDER_ERROR",
    retryable: Boolean(error?.retryable),
  };
}

export function createLocalDeterministicProvider(handlers = {}) {
  return {
    id: "local-deterministic-phase5",
    location: "local",
    requiresSecret: false,
    remote: false,
    status: "available",
    capabilities: PROVIDER_CAPABILITIES.localDeterministic,
    async run(request, { signal } = {}) {
      if (signal?.aborted) throw Object.assign(new Error("Request cancelled."), { code: "CANCELLED" });
      const handler = handlers[request.task];
      return {
        schemaVersion: 1,
        providerId: "local-deterministic-phase5",
        task: request.task,
        ok: true,
        offline: true,
        costWarning: "No remote cost; local deterministic provider.",
        result: handler ? await handler(request.payload) : request.payload,
      };
    },
  };
}

export function createDisabledRemoteProvider() {
  return {
    id: "remote-provider-disabled",
    location: "remote",
    requiresSecret: true,
    remote: true,
    status: "disabled",
    capabilities: PROVIDER_CAPABILITIES.remoteDisabled,
    costWarning: "Remote providers require explicit user consent and configured secrets.",
    async run() {
      throw Object.assign(new Error("Remote AI providers are disabled by default."), { code: "REMOTE_DISABLED", retryable: false });
    },
  };
}

export function createMockProvider() {
  return {
    id: "mock-phase5-test",
    location: "local",
    requiresSecret: false,
    status: "test-only",
    capabilities: PROVIDER_CAPABILITIES.mock,
    async run(request) {
      return { schemaVersion: 1, providerId: "mock-phase5-test", task: request.task, ok: true, result: request.payload };
    },
  };
}
