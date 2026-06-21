import {
  UAOS_HARDWARE_TARGETS,
  createHardwareExportPackage,
  serializeHardwareExportPackage,
  validateHardwareExportPackage
} from "../src/hardware/uaosHardwareExportLayer.js";

const targets = Object.keys(UAOS_HARDWARE_TARGETS);

if (targets.length < 4) {
  throw new Error("Expected at least 4 hardware targets.");
}

for (const target of targets) {
  const pkg = createHardwareExportPackage({
    target,
    projectName: `UAOS Phase 28 ${target}`,
    tempo: 100,
    key: "C minor"
  });

  const valid = validateHardwareExportPackage(pkg);
  if (!valid.ok) {
    throw new Error(`${target} validation failed: ${valid.errors.join(", ")}`);
  }

  const text = serializeHardwareExportPackage(pkg);
  if (!text.includes("UAOS_HARDWARE_EXPORT_PACKAGE")) {
    throw new Error(`${target} serialization failed.`);
  }

  console.log(`PASS ${target}: ${pkg.targetName}`);
}

console.log("PHASE 28 HARDWARE EXPORT CHECK PASS");
