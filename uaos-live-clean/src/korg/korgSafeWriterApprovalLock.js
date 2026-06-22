export const KORG_WRITER_APPROVAL_LOCK = Object.freeze({
  gate: "KORG-REAL-PRODUCT-GATE-08-SAFE-WRITER-APPROVAL-LOCK",
  writer: "BLOCKED_UNTIL_EXPLICIT_APPROVAL",
  allowedNow: ["read_only_scan", "read_only_validation", "report_generation"],
  blockedNow: [".STY_WRITE", ".SET_WRITE", ".PRS_WRITE", "REAL_KEYBOARD_OUTPUT"],
  sale: "LOCKED",
});
export function assertKorgWriterBlocked(request = {}) {
  const wantsWriter = Boolean(request.writer || request.outputExtension);
  return {
    gate: KORG_WRITER_APPROVAL_LOCK.gate,
    sale: "LOCKED",
    writerAllowed: false,
    blocked: wantsWriter,
    reason: wantsWriter ? "REAL_WRITER_REQUIRES_EXPLICIT_FUTURE_GATE_APPROVAL" : "READ_ONLY_OPERATION_ALLOWED",
    commercialReady: false,
  };
}
