import { runFinalHardwareExportGate } from "../src/hardware/uaosFinalHardwareExportGate.js";

const gate = runFinalHardwareExportGate();

if (!gate.ok) throw new Error(gate.errors.join(", "));
if (gate.realBinaryExportReady !== false) throw new Error("Must not claim real binary export readiness.");
if (gate.profileCount < 5) throw new Error("Missing profiles.");
if (gate.fixtureCount < 2) throw new Error("Missing fixtures.");
if (gate.adapterPlanCount < 10) throw new Error("Missing adapter plans.");

console.log(JSON.stringify(gate, null, 2));
console.log("PHASE 40 FINAL HARDWARE GATE CHECK PASS");
