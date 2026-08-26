/**
 * Keyboard Pro internal inspection project envelope.
 * SHA256 transactional metadata. No proprietary writer.
 */
import crypto from "node:crypto";

export function createInspectionProject({ name, files = [] } = {}) {
  if (!name) return { ok: false, errorCode: "NAME_REQUIRED" };
  const entries = files.map((f) => {
    const bytes = Buffer.isBuffer(f.bytes) ? f.bytes : Buffer.from(String(f.bytes || ""), "utf8");
    return {
      path: f.path || "unknown.bin",
      size: bytes.length,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      family: f.family || "unknown",
      level: f.level || "INSPECT"
    };
  });
  const project = {
    schema: "uaos.keyboard-pro.inspection/v1",
    name,
    createdAt: new Date().toISOString(),
    entries,
    write: "FORMAT_CONTRACT_REQUIRED",
    hardwareWrite: "HARDWARE_REQUIRED",
    commercialReady: false
  };
  const envelope = {
    ...project,
    envelopeSha256: crypto.createHash("sha256").update(JSON.stringify(project)).digest("hex")
  };
  return { ok: true, project: envelope };
}

export function verifyInspectionEnvelope(project) {
  if (!project?.envelopeSha256) return { ok: false, errorCode: "NO_ENVELOPE" };
  const clone = { ...project };
  delete clone.envelopeSha256;
  const live = crypto.createHash("sha256").update(JSON.stringify(clone)).digest("hex");
  return { ok: live === project.envelopeSha256, live, expected: project.envelopeSha256 };
}
