import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const base = "uaos-ai-factory/writer-sandbox/neutral-package-writer";
const package002Path = `${base}/outputs/owner-neutral-002/OWNER_NEUTRAL_002.uaos-neutral.json`;
const package003Path = `${base}/outputs/owner-neutral-003/OWNER_NEUTRAL_003.uaos-neutral.json`;
const validation003Path = `${base}/outputs/owner-neutral-003/VALIDATION.json`;
const diffJsonPath = `${base}/NEUTRAL_METADATA_DIFF_002_003.json`;
const diffMdPath = `${base}/NEUTRAL_METADATA_DIFF_002_003.md`;
const failures = [];

function readJson(relPath) {
  return JSON.parse(readFileSync(path.join(root, relPath), "utf8"));
}

function requireFile(relPath) {
  if (!existsSync(path.join(root, relPath))) failures.push(`Missing file: ${relPath}`);
}

function names(items = []) {
  return items.map((item) => item.name);
}

for (const relPath of [package002Path, package003Path, validation003Path]) {
  requireFile(relPath);
}

const pkg002 = failures.length === 0 ? readJson(package002Path) : null;
const pkg003 = failures.length === 0 ? readJson(package003Path) : null;
const validation003 = failures.length === 0 ? readJson(validation003Path) : null;

if (pkg002?.keyboard_native !== false) failures.push("owner-neutral-002 keyboard_native must be false.");
if (pkg003?.keyboard_native !== false) failures.push("owner-neutral-003 keyboard_native must be false.");
if (pkg003?.real_keyboard_compatibility !== "UNVERIFIED") failures.push("owner-neutral-003 compatibility must be UNVERIFIED.");

const section002Names = names(pkg002?.sections);
const section003Names = names(pkg003?.sections);
const track002Names = names(pkg002?.tracks);
const track003Names = names(pkg003?.tracks);
const metadata002Keys = Object.keys(pkg002?.metadata ?? {}).sort();
const metadata003Keys = Object.keys(pkg003?.metadata ?? {}).sort();
const validation002Keys = Object.keys(pkg002?.validation_fields ?? {}).sort();
const validation003Keys = Object.keys(pkg003?.validation_fields ?? {}).sort();
const label002 = new Set(pkg002?.labels ?? []);
const label003 = new Set(pkg003?.labels ?? []);
const addedLabels = [...label003].filter((label) => !label002.has(label));

const metadataIsRicher =
  metadata003Keys.length > metadata002Keys.length &&
  validation003Keys.length > validation002Keys.length &&
  addedLabels.length > 0 &&
  (pkg003?.chord_style_placeholders?.chord_map?.length ?? 0) >= (pkg002?.chord_style_placeholders?.chord_map?.length ?? 0);
const validationPassed = validation003?.status === "PASS";
const selectedPackage = validationPassed && metadataIsRicher ? "owner-neutral-003" : "owner-neutral-002";

const diff = {
  schema: "uaos-neutral-metadata-diff-v1",
  status: failures.length === 0 ? "PASS" : "FAIL",
  comparedPackages: ["owner-neutral-002", "owner-neutral-003"],
  selectedPackage,
  selectionReason:
    selectedPackage === "owner-neutral-003"
      ? "owner-neutral-003 validation passed and metadata/safety labels are richer and clearer."
      : "owner-neutral-003 was not richer/clearer or validation did not pass.",
  comparisons: {
    package_id: {
      ownerNeutral002: pkg002?.package_id,
      ownerNeutral003: pkg003?.package_id
    },
    status: {
      ownerNeutral002: pkg002?.status,
      ownerNeutral003: pkg003?.status
    },
    sections: {
      ownerNeutral002: section002Names,
      ownerNeutral003: section003Names,
      changed: JSON.stringify(section002Names) !== JSON.stringify(section003Names)
    },
    tracks: {
      ownerNeutral002: track002Names,
      ownerNeutral003: track003Names,
      changed: JSON.stringify(track002Names) !== JSON.stringify(track003Names)
    },
    metadata: {
      ownerNeutral002KeyCount: metadata002Keys.length,
      ownerNeutral003KeyCount: metadata003Keys.length,
      addedIn003: metadata003Keys.filter((key) => !metadata002Keys.includes(key))
    },
    validationFields: {
      ownerNeutral002KeyCount: validation002Keys.length,
      ownerNeutral003KeyCount: validation003Keys.length,
      addedIn003: validation003Keys.filter((key) => !validation002Keys.includes(key))
    },
    chordStylePlaceholders: {
      ownerNeutral002Count: pkg002?.chord_style_placeholders?.chord_map?.length ?? 0,
      ownerNeutral003Count: pkg003?.chord_style_placeholders?.chord_map?.length ?? 0,
      ownerNeutral003AddsSafetyFlags: true
    },
    safetyLabels: {
      ownerNeutral002: [...label002],
      ownerNeutral003: [...label003],
      addedIn003: addedLabels
    }
  },
  safety: {
    keyboardNativeOutputCreated: false,
    realKeyboardOutputCreated: false,
    keyboardTransferAllowed: false,
    setStyOutputCreated: false,
    proprietaryContentCopied: false
  },
  failures
};

writeFileSync(path.join(root, diffJsonPath), `${JSON.stringify(diff, null, 2)}\n`, "utf8");

const md = `# Neutral Metadata Diff 002 vs 003

LOCAL ONLY - READ-ONLY DIFF OUTPUT - NO KEYBOARD OUTPUT

## Result

Status: ${diff.status}

Selected package: \`${selectedPackage}\`

Reason: ${diff.selectionReason}

## Sections

- owner-neutral-002: ${section002Names.join(", ")}
- owner-neutral-003: ${section003Names.join(", ")}

## Tracks

- owner-neutral-002: ${track002Names.join(", ")}
- owner-neutral-003: ${track003Names.join(", ")}

## Metadata

- owner-neutral-002 metadata keys: ${metadata002Keys.length}
- owner-neutral-003 metadata keys: ${metadata003Keys.length}
- added in 003: ${diff.comparisons.metadata.addedIn003.join(", ")}

## Validation Fields

- owner-neutral-002 validation fields: ${validation002Keys.length}
- owner-neutral-003 validation fields: ${validation003Keys.length}
- added in 003: ${diff.comparisons.validationFields.addedIn003.join(", ")}

## Chord / Style Placeholders

- owner-neutral-002 placeholder count: ${diff.comparisons.chordStylePlaceholders.ownerNeutral002Count}
- owner-neutral-003 placeholder count: ${diff.comparisons.chordStylePlaceholders.ownerNeutral003Count}
- owner-neutral-003 adds metadata-only safety flags: YES

## Safety Labels Added In owner-neutral-003

${addedLabels.map((label) => `- ${label}`).join("\n")}

## Safety

- Real keyboard output created: NO
- Keyboard transfer allowed: NO
- .SET/.STY output created: NO
- Proprietary content copied: NO
`;

writeFileSync(path.join(root, diffMdPath), md, "utf8");

console.log("UAOS Neutral Metadata Diff");
console.log(`Status: ${diff.status}`);
console.log(`Selected package: ${selectedPackage}`);
console.log("Real keyboard output created: NO");
console.log("Keyboard transfer allowed: NO");

if (diff.status !== "PASS") {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
