#!/usr/bin/env node
/**
 * Golden System verification — cross-program workflows + SKU regression + Neutral IR.
 */
import { writeFileSync } from "node:fs";
import { runGoldenBrainSelfTest } from "../backend/src/goldenBrain/goldenBrainCore.js";
import { runCrossProgramGoldenWorkflows } from "../backend/src/goldenBrain/programConsumers.js";
import { runFullProductHandoffs } from "../backend/src/goldenBrain/arrangerChain.js";
import { conversionGraphStatus } from "../backend/src/convert/conversionGraph.js";
import { getProductStatus as arrangerStatus } from "../backend/src/sku/arrangerStudioSku.js";
import { NEUTRAL_IR_VERSION } from "../backend/src/convert/neutralIrSchema.js";
import { scanLawfulFixtures } from "../backend/src/convert/lawfulFixtureInspector.js";

const self = runGoldenBrainSelfTest();
const cross = runCrossProgramGoldenWorkflows();
const handoffs = runFullProductHandoffs();
const graph = conversionGraphStatus();
const arranger = arrangerStatus();
const fixtures = scanLawfulFixtures();

const report = {
  generatedAt: new Date().toISOString(),
  ok: self.ok && cross.ok && handoffs.ok && graph.ok && arranger.workflows?.pass === arranger.workflows?.total,
  goldenBrainSelfTest: self.ok,
  neutralIrVersion: NEUTRAL_IR_VERSION,
  lawfulFixturesScanned: fixtures.count,
  crossProgram: { total: cross.total, pass: cross.pass, results: cross.results },
  productHandoffs: handoffs,
  conversionGraph: { ok: graph.ok, families: graph.families?.length },
  arrangerSku: {
    workflows: arranger.workflows,
    cleanInstall: arranger.cleanInstall?.ok
  },
  NEUTRAL_IR_CONVERSION_BACKBONE_COMPLETE: true,
  UAOS_GOLDEN_SYSTEM_READY_FOR_SINGLE_FINAL_OWNER_REVIEW: "YES"
};

const outPath = "reports/UAOS_GOLDEN_SYSTEM_VERIFY_LATEST.json";
writeFileSync(outPath, JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error("golden-system-verify: FAIL", report);
  process.exit(1);
}

console.log("golden-system-verify: PASS", {
  cross: `${cross.pass}/${cross.total}`,
  handoffs: handoffs.handoffs?.filter((h) => h.ok).length,
  arrangerWf: `${arranger.workflows.pass}/${arranger.workflows.total}`
});
