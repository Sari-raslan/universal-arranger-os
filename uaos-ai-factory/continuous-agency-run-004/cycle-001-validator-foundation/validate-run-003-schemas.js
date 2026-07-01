import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateKnownRun003File } from "./uaosSchemaValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const outputPath = path.join(__dirname, "UAOS_CYCLE_001_VALIDATOR_TEST_RESULTS.json");

const targets = [
  ["uaos-ai-factory/implementation/product-core-architecture-run-003/UAOS_MODULE_BOUNDARY_MAP_RUN_003.json", "moduleBoundary"],
  ["uaos-ai-factory/library-factory/run-003-library-development/UAOS_LIBRARY_FACTORY_SCHEMA_RUN_003.json", "libraryFactory"],
  ["uaos-ai-factory/library-factory/oriental-strings/run-003-oriental-strings/UAOS_ORIENTAL_STRINGS_ARTICULATION_MAP_RUN_003.json", "orientalStrings"],
  ["uaos-ai-factory/library-factory/oriental-strings/run-003-oriental-strings/UAOS_ORIENTAL_STRINGS_DEMO_MIDI_SPEC_RUN_003.json", "demoMidiSpec"],
  ["uaos-ai-factory/arranger-intelligence/run-003-arranger-development/UAOS_ARRANGER_INTELLIGENCE_SCHEMA_RUN_003.json", "arrangerSchema"],
  ["uaos-ai-factory/arranger-intelligence/run-003-arranger-development/UAOS_SONG_TO_ARRANGER_TEST_CASES_RUN_003.json", "testCases"],
  ["uaos-ai-factory/live-monitor/run-003-monitor-data/UAOS_LIVE_MONITOR_DATA_MODEL_RUN_003.json", "monitorModel"],
  ["uaos-ai-factory/qa/run-003-product-reality-audit/UAOS_SAFE_NEXT_IMPLEMENTATION_ITEMS_RUN_003.json", "safeNextItems"]
];

const results = targets.map(([relativePath, type]) => {
  const filePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    return { file: relativePath, type, status: "FAIL", errors: ["file missing"] };
  }
  return validateKnownRun003File(filePath, type);
});

const summary = {
  run: "004",
  cycle: "001",
  status: results.every((result) => result.status === "PASS") ? "PASS" : "FAIL",
  generatedAt: new Date().toISOString(),
  deployAttempted: false,
  vercelUsed: false,
  appJsTouched: false,
  restrictedOutputCreated: false,
  results
};

fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log(JSON.stringify(summary, null, 2));
if (summary.status !== "PASS") process.exit(1);
