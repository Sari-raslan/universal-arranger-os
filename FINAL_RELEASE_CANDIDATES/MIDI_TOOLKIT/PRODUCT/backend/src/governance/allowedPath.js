/**
 * Allowed-next-path gate. Docs/UI and planning only.
 * Fail-closed on writer, hardware output, deploy, and fixture copy.
 */
export const ALLOWED_PATHS = Object.freeze([
  "PATH-DOCS-UI",
  "PATH-NO-OUTPUT-PROTOTYPE-PLANNING",
  "PATH-DEFER-WRITER"
]);

export const EXCLUDED_PATHS = Object.freeze([
  "real writer",
  "real keyboard output",
  "production parser",
  "deploy/public release",
  "fixtures read/copy/modify"
]);

export const GOVERNANCE_HTML =
  "C:/UAOS-WT/uaos-open-library-factory-v3-20260723_185921/uaos-live-clean/public/governance/y1201-y1240/allowed-next-path-selector.html";

export function validateRequestedPath(pathId, options = {}) {
  const requested = String(pathId || options.selectedPath || "NONE").trim();
  if (requested === "NONE" || requested === "") {
    return {
      ok: true,
      selectedPath: "NONE",
      gate: "NO_FURTHER_CODE_UNTIL_OWNER_SELECTS",
      allowed: true,
      writer: false,
      hardwareWrite: false,
      deploy: false
    };
  }
  if (!ALLOWED_PATHS.includes(requested)) {
    return {
      ok: false,
      errorCode: "PATH_NOT_ALLOWED",
      requested,
      allowedPaths: ALLOWED_PATHS,
      excluded: EXCLUDED_PATHS
    };
  }
  return {
    ok: true,
    selectedPath: requested,
    allowed: true,
    writer: false,
    hardwareWrite: false,
    deploy: false,
    korgWrite: "UNSUPPORTED"
  };
}

export function assertSafeAction(action) {
  const text = String(action || "").toLowerCase();
  if (/writer|sysex|hardware write|korg write|deploy|production parser|copy fixture/.test(text)) {
    return { ok: false, errorCode: "EXCLUDED_ACTION", action };
  }
  return { ok: true, action };
}
