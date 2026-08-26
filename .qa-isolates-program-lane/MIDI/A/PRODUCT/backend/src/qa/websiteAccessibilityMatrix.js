/**
 * Recorded website accessibility matrix validator.
 * Recorded PASS is not a live browser accessibility proof.
 */
export function validateAccessibilityMatrix(rows) {
  if (!Array.isArray(rows) || rows.length < 1) return { ok: false, error: "matrix required" };
  const routes = new Set();
  for (const row of rows) {
    if (!row.route || typeof row.route !== "string") return { ok: false, error: "route required" };
    if (routes.has(row.route)) return { ok: false, error: `duplicate route ${row.route}` };
    routes.add(row.route);
    if (!["PASS", "FAIL", "SKIP"].includes(row.status)) return { ok: false, error: `bad status ${row.status}` };
    if (Number(row.resourceErrors) > 0 && row.status === "PASS") {
      return { ok: false, error: "PASS with resourceErrors is invalid" };
    }
  }
  return {
    ok: true,
    count: rows.length,
    liveBrowserProof: false,
    recordedMatrixOnly: true
  };
}
