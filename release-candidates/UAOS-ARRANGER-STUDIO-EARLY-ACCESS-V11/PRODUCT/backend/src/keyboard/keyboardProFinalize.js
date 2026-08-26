/**
 * Keyboard Pro finalization within FORMAT_CONTRACT / HARDWARE gates.
 * Completes inspect/read path + honest write denial.
 */
import { createInspectionProject, verifyInspectionEnvelope } from "./inspectionProject.js";
import { inspectBuffer, familyFromExtension, canClaim } from "../convert/uaosNeutralIr.js";

export function keyboardProFinalize({ name = "keyboard-pro-inspect", fixtureBytes } = {}) {
  const bytes = Buffer.isBuffer(fixtureBytes) ? fixtureBytes : Buffer.from("KORG SET META ONLY");
  const inspected = inspectBuffer(bytes, ".set", "Korg");
  const fam = familyFromExtension(".set", "Korg");
  const writeClaim = canClaim(fam, "WRITE");
  const convertClaim = canClaim(fam, "CONVERT_FROM_UAOS_IR");
  const project = createInspectionProject({
    name,
    files: [{ path: "sample.set", bytes, family: "korg", level: inspected.level }]
  });
  const verified = verifyInspectionEnvelope(project.project);
  return {
    ok: project.ok && verified.ok && inspected.level === "INSPECT" && !writeClaim.ok && !convertClaim.ok,
    inspected,
    project: project.project,
    verified,
    write: {
      ok: writeClaim.ok,
      errorCode: writeClaim.errorCode || "FORMAT_CONTRACT_REQUIRED"
    },
    convertFromIr: {
      ok: convertClaim.ok,
      errorCode: convertClaim.errorCode || "FORMAT_CONTRACT_REQUIRED"
    },
    BLOCKED_EXTERNAL_GATES: ["FORMAT_CONTRACT_REQUIRED", "HARDWARE_REQUIRED"],
    commercialReady: false,
    capabilityId: "uaos.keyboard-pro.finalize/v1"
  };
}
