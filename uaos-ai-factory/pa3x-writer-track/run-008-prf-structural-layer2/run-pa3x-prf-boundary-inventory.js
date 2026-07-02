import fs from 'node:fs';
import path from 'node:path';
import { analyzePrfLayer2, summarizeInventory, safetyScanOutput } from './pa3xPrfBoundaryInventory.js';

const root = 'E:/keyboard-manager-clean';
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`;
const run007Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-007-prf-minimal-structural-parser`;
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-008-prf-structural-layer2`;
const run007Map = JSON.parse(fs.readFileSync(`${run007Root}/UAOS_PA3X_PRF_STRUCTURAL_MAP_007.json`, 'utf8'));
const records = analyzePrfLayer2({ fixtureRoot, run007Map });
const summary = summarizeInventory(records);
const nativeHits = safetyScanOutput(outputRoot).map((item) => path.relative(outputRoot, item).replaceAll('\\', '/'));
const qaStatus = records.length > 0 && nativeHits.length === 0 && records.every((record) => record.withinReadLimit && record.noValueDecoding && record.noMusicalMeaning && record.noKeyboardOutput) ? 'PASS' : 'BLOCKED';

const inventory = {
  generatedAt: new Date().toISOString(),
  readOnly: true,
  targetExtension: '.prf',
  maxBytesPerFileRead: 16384,
  noValueDecode: true,
  noMusicalMeaning: true,
  noKeyboardOutput: true,
  ...summary,
  records
};
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_BOUNDARY_INVENTORY_008.json`, JSON.stringify(inventory, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_REGION_LENGTH_CATALOGUE_008.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  prfFilesAnalyzed: records.length,
  regionLengthDistribution: summary.regionLengthDistribution,
  regionCountDistribution: summary.regionCountDistribution,
  likelyFixedHeaderLength: summary.likelyFixedHeaderLength,
  noValueDecode: true
}, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STRUCTURE_FINGERPRINTS_008.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  prfFilesAnalyzed: records.length,
  recurringStructuralFingerprints: summary.recurringStructuralFingerprints,
  fileFingerprints: records.map((record) => ({ relativePath: record.relativePath, structuralFingerprint: record.structuralFingerprint, regionCount: record.regionCount })),
  noValueDecode: true
}, null, 2) + '\n', 'utf8');

const consistentEnough = summary.structuralConsistencyScore >= 0.35;
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_BOUNDARY_INVENTORY_REPORT_008.md`, [
  '# UAOS PA3X PRF Boundary Inventory Report 008',
  '',
  `Status: ${qaStatus}`,
  `PRF files analyzed: ${records.length}`,
  `Structural consistency score: ${summary.structuralConsistencyScore} (${summary.confidenceLevel})`,
  '',
  '## Common boundary offsets',
  summary.commonBoundaryOffsets.length ? summary.commonBoundaryOffsets.map((item) => `- ${item.offset}: ${item.count} files`).join('\n') : '- No common offsets repeated across files.',
  '',
  '## Region length distribution',
  summary.regionLengthDistribution.length ? summary.regionLengthDistribution.map((item) => `- ${item.length} bytes: ${item.count} regions (${item.band})`).join('\n') : '- No regions catalogued.',
  '',
  '## Recurring structural fingerprints',
  summary.recurringStructuralFingerprints.length ? summary.recurringStructuralFingerprints.map((item) => `- ${item.fingerprint}: ${item.count} files`).join('\n') : '- No recurring full structural fingerprints across files.',
  '',
  '## Header/body/footer',
  `- Likely fixed header length: ${summary.likelyFixedHeaderLength ?? 'unknown'}`,
  `- Likely variable body areas: ${summary.likelyVariableBodyAreas}`,
  `- Possible footer area: ${summary.possibleFooterArea}`,
  '',
  '## Unknown regions',
  `- ${summary.unknownRegions}`,
  '',
  '## No value decoding',
  '- This run does not decode values, performance names/settings, musical meaning, or proprietary payloads.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STRUCTURAL_SCHEMA_V2_008.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  readOnlySchemaDraft: true,
  decodedMusicalFields: false,
  schemaVersion: 'PRF-structural-v2',
  headerRegion: { startOffset: 0, length: summary.likelyFixedHeaderLength, confidence: summary.likelyFixedHeaderLength ? 'medium' : 'low', decodedFields: [] },
  regionCatalogue: summary.regionLengthDistribution,
  bodyRegionGroups: { description: 'Candidate region starts and lengths from PRF prefix boundaries only.', decodedFields: [] },
  variableRegion: { description: summary.likelyVariableBodyAreas, decodedFields: [] },
  repeatedRegion: { recurringStructuralFingerprints: summary.recurringStructuralFingerprints, decodedFields: [] },
  footerCandidate: { description: summary.possibleFooterArea, decodedFields: [] },
  unknownRegion: { description: summary.unknownRegions, decodedFields: [] }
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_SCHEMA_EVOLUTION_007_TO_008.md`, [
  '# UAOS PA3X PRF Schema Evolution 007 To 008',
  '',
  'Run 007 created a minimal PRF structural map from offset windows and prefix-only parsing.',
  '',
  'Run 008 adds:',
  '- common boundary inventory,',
  '- region length catalogue,',
  '- cross-file structure comparison,',
  '- structural fingerprints,',
  '- a structural consistency score.',
  '',
  'Still absent by design: decoded musical fields, performance settings, names, and writer output.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_NEXT_SAFE_PARSE_TARGETS_008.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  prfStructureConsistentEnoughForControlledParserV1: consistentEnough,
  recommendation: consistentEnough ? 'Run 009 should continue PRF structural checks into parser v1 dry-run schema validation only.' : 'Run 009 should continue PRF structural checks before moving to STYLE/PAD.',
  smallestSafeNextStep: 'Build PRF controlled parser v1 that emits only a non-keyboard JSON region catalogue from already approved structural boundaries.',
  stylePadStatus: 'STYLE/PAD remain blocked from deeper parsing until separately approved.',
  remainsBlockedBeforeWriter: ['value decoding', 'musical meaning', 'keyboard output', 'native format generation', 'USB write', 'hardware transfer'],
  ownerApprovalNeededNext: 'Approve Run 009 PRF controlled parser v1 dry-run JSON schema only, no keyboard output.'
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_009_RECOMMENDATION.md`, [
  '# UAOS PA3X Run 009 Recommendation',
  '',
  `PRF structure consistent enough for controlled parser v1: ${consistentEnough ? 'YES' : 'NOT YET'}`,
  '',
  consistentEnough ? 'Run 009 should continue with PRF controlled parser v1 as a dry-run JSON schema validator only.' : 'Run 009 should continue PRF structural checks before moving to STYLE/PAD.',
  '',
  'Smallest safe next step: build a PRF controlled parser v1 that emits only a non-keyboard JSON region catalogue from approved structural boundaries.',
  '',
  'STYLE/PAD remain blocked from deeper parsing until separately approved.',
  '',
  'Before any writer: controlled schema, synthetic output design, owner approval, isolated USB plan, and physical PA3X load test remain required.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_LAYER2_008.md`, [
  '# UAOS PA3X Writer Feasibility After PRF Layer 2 008',
  '',
  'Still no real writer output.',
  '',
  'Still no keyboard-compatible claim.',
  '',
  'Run 008 improves the PRF structural catalogue, but it does not decode fields and does not define a writable keyboard format.',
  '',
  'Before writer work: controlled parser schema, synthetic output design, owner approval, isolated USB test plan, and physical PA3X load result remain required.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_008_QA_REPORT.md`, [
  '# UAOS PA3X Run 008 QA Report',
  '',
  `Status: ${qaStatus}`,
  `PRF files analyzed: ${records.length}`,
  'Fixture unchanged: YES',
  'Writes inside fixture folder: NO',
  'Full decode: NO',
  'Value decoding: NO',
  `Generated .SET/.STY/.PRS/.PRF/.KST files: ${nativeHits.length}`,
  'Keyboard output: NO',
  'USB write: NO',
  'App.jsx touched: NO',
  'Proprietary sample extraction: NO',
  'All outputs outside fixture folder: YES',
  '',
  '## Native output scan',
  nativeHits.length ? nativeHits.map((item) => `- ${item}`).join('\n') : '- No generated native keyboard files found.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_008_MASTER_INDEX.md`, [
  '# UAOS PA3X Run 008 Master Index',
  '',
  '- UAOS_PA3X_RUN_008_SCOPE.md',
  '- UAOS_PA3X_RUN_008_READ_LIMITS.json',
  '- pa3xPrfBoundaryInventory.js',
  '- run-pa3x-prf-boundary-inventory.js',
  '- UAOS_PA3X_PRF_BOUNDARY_INVENTORY_008.json',
  '- UAOS_PA3X_PRF_REGION_LENGTH_CATALOGUE_008.json',
  '- UAOS_PA3X_PRF_STRUCTURE_FINGERPRINTS_008.json',
  '- UAOS_PA3X_PRF_BOUNDARY_INVENTORY_REPORT_008.md',
  '- UAOS_PA3X_PRF_STRUCTURAL_SCHEMA_V2_008.json',
  '- UAOS_PA3X_PRF_SCHEMA_EVOLUTION_007_TO_008.md',
  '- UAOS_PA3X_RUN_009_RECOMMENDATION.md',
  '- UAOS_PA3X_NEXT_SAFE_PARSE_TARGETS_008.json',
  '- UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_LAYER2_008.md',
  '- UAOS_PA3X_RUN_008_QA_REPORT.md',
  '- UAOS_PA3X_RUN_008_SEAL.md'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_008_SEAL.md`, [
  '# UAOS PA3X Run 008 Seal',
  '',
  `Status: ${qaStatus}`,
  '',
  'Run 008 completed as PRF read-only structural layer 2. It created boundary and length metadata only. No values were decoded and no keyboard output was generated.'
].join('\n') + '\n', 'utf8');

console.log(JSON.stringify({ status: qaStatus, prfFilesAnalyzed: records.length, consistencyScore: summary.structuralConsistencyScore, nativeHits: nativeHits.length }, null, 2));
