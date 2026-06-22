export function createKorgDeviceDiagnosticProof(compat = {}) {
  const checks = [
    { id: "sale_locked", pass: compat.sale === "LOCKED" },
    { id: "writer_forbidden", pass: compat.writer === "FORBIDDEN" },
    { id: "output_forbidden", pass: compat.realKeyboardOutput === "FORBIDDEN" },
    { id: "not_commercial_ready", pass: compat.commercialReady === false }
  ];
  const failures = checks.filter((x) => !x.pass);
  return {
    gate: "KORG-REAL-PRODUCT-GATE-07-DEVICE-DIAGNOSTIC-PROOF",
    mode: "READ_ONLY_DEVICE_DIAGNOSTIC_PROOF",
    sale: "LOCKED",
    payment: "NOT_ACTIVE",
    writer: "FORBIDDEN",
    realKeyboardOutput: "FORBIDDEN",
    checks,
    failures,
    pass: failures.length === 0,
    commercialReady: false,
    nextGate: "KORG-REAL-PRODUCT-GATE-08-SAFE-WRITER-APPROVAL-LOCK"
  };
}
