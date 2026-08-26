/**
 * Incident / bridge response contract. Fail closed on extra fields and missing ids.
 */
export function validateIncidentResponse(payload, schema) {
  if (!schema || schema.type !== "object") return { ok: false, error: "Schema required." };
  if (!payload || typeof payload !== "object") return { ok: false, error: "Payload must be an object." };
  for (const key of schema.required || []) {
    if (!(key in payload)) return { ok: false, error: `Missing ${key}` };
  }
  if (schema.additionalProperties === false) {
    const allowed = new Set(Object.keys(schema.properties || {}));
    for (const key of Object.keys(payload)) {
      if (!allowed.has(key)) return { ok: false, error: `Unexpected field ${key}` };
    }
  }
  if (typeof payload.ok !== "boolean") return { ok: false, error: "ok must be boolean." };
  if (typeof payload.requestId !== "string" || !payload.requestId) return { ok: false, error: "requestId required." };
  if (payload.ok === false && !payload.errorCode) return { ok: false, error: "Failures must include errorCode." };
  return { ok: true };
}
