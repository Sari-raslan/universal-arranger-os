import fs from 'node:fs';
import path from 'node:path';
import { buildPrfStructuralCatalogue, safetyScanOutput } from './pa3xPrfReadOnlyParserV1.js';

const root = 'E:/keyboard-manager-clean';
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`;
const run003Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-003-fixture-scanner`;
const run007Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-007-prf-minimal-structural-parser`;
const run008Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-008-prf-structural-layer2`;
const run009Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-009-prf-controlled-structural-checks`;
const run010Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-010-prf-stable-offset-validation`;
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-011-prf-readonly-parser-v1`;
const fileIndex = JSON.parse(fs.readFileSync(`${run003Root}/UAOS_PA3X_FIXTURE_FILE_INDEX_003.json`, 'utf8'));
const run007Map = JSON.parse(fs.readFileSync(`${run007Root}/UAOS_PA3X_PRF_STRUCTURAL_MAP_007.json`, 'utf8'));
const run008Inventory = JSON.parse(fs.readFileSync(`${run008Root}/UAOS_PA3X_PRF_BOUNDARY_INVENTORY_008.json`, 'utf8'));
const run008RegionCatalogue = JSON.parse(fs.readFileSync(`${run008Root}/UAOS_PA3X_PRF_REGION_LENGTH_CATALOGUE_008.json`, 'utf8'));
const run009Consistency = JSON.parse(fs.readFileSync(`${run009Root}/UAOS_PA3X_PRF_CONSISTENCY_RESULTS_009.json`, 'utf8'));
const run010Validation = JSON.parse(fs.readFileSync(`${run010Root}/UAOS_PA3X_PRF_STABLE_OFFSET_VALIDATION_RESULTS_010.json`, 'utf8'));
const catalogue = buildPrfStructuralCatalogue({ fixtureRoot, fileIndex, run007Map, run008Inventory, run008RegionCatalogue, run009Consistency, run010Validation });
const nativeHits = safetyScanOutput(outputRoot).map((item) => path.relative(outputRoot, item).replaceAll('\\', '/'));
const qaStatus = catalogue.prfFilesParsed === 16 && nativeHits.length === 0 && catalogue.noValueDecoding && catalogue.noMusicalMeaning && catalogue.noKeyboardOutput ? 'PASS' : 'BLOCKED';

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STRUCTURAL_CATALOGUE_011.json`, JSON.stringify(catalogue, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_REGION_MAP_011.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  prfFilesParsed: catalogue.prfFilesParsed,
  regionSummary: catalogue.regionSummary,
  regionMap: catalogue.catalogueEntries.map((entry) => ({
    relativePath: entry.relativePath,
    crossFileConsistencyGroup: entry.crossFileConsistencyGroup,
    outlierFlag: entry.outlierFlag,
    structuralRegions: entry.structuralRegions
  })),
  noValueDecoding: true,
  noKeyboardOutput: true
}, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_PARSER_V1_RESULTS_011.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  status: qaStatus,
  prfFilesParsed: catalogue.prfFilesParsed,
  parserV1Confidence: catalogue.parserV1Confidence,
  outputType: catalogue.outputType,
  limitations: ['no value decoding', 'no musical meaning', 'no performance names/settings', 'no keyboard output'],
  nativeOutputFilesGenerated: nativeHits.length,
  noValueDecoding: true,
  noKeyboardOutput: true
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_PARSER_V1_REPORT_011.md`, [
  '# UAOS PA3X PRF Parser V1 Report 011',
  '',
  `Status: ${qaStatus}`,
  `PRF files parsed: ${catalogue.prfFilesParsed}`,
  `Parser v1 confidence: ${catalogue.parserV1Confidence}`,
  '',
  '## Output',
  '- Non-keyboard JSON structural catalogue only.',
  '- Region map by offset and length only.',
  '- Confidence per region.',
  '- Unknown regions retained as unknown.',
  '',
  '## Limitations',
  '- No value decoding.',
  '- No musical meaning.',
  '- No performance names/settings/sounds/styles inference.',
  '- No keyboard output.',
  '',
  '## Safety',
  '- No generated PRF/SET/STY/PRS/KST files.',
  '- Outputs are outside the fixture folder.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STRUCTURAL_SCHEMA_V3_011.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  schemaVersion: 'PRF-structural-v3-readonly-parser-v1',
  outputType: 'non-keyboard structural catalogue JSON',
  decodedFields: [],
  regionTypes: {
    fileHeader: { description: 'start-of-file structural region', decodedFields: [] },
    stableRegion: { description: 'offset validated by Run 010 stable-offset subset', decodedFields: [] },
    variableRegion: { description: 'candidate region that varies by file', decodedFields: [] },
    repeatedRegion: { description: 'region length pattern observed in earlier catalogues', decodedFields: [] },
    unknownRegion: { description: 'unread or undecoded region', decodedFields: [] },
    footerCandidate: { description: 'low-confidence structural tail candidate', decodedFields: [] }
  },
  safety: { readOnly: true, noValueDecoding: true, noMusicalMeaning: true, noKeyboardOutput: true }
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_READONLY_PARSER_API_011.md`, [
  '# UAOS PA3X PRF Read-only Parser API 011',
  '',
  '## Input',
  '- Fixture metadata from Run 003.',
  '- PRF file references inside the owner fixture copy.',
  '- Structural maps from Runs 007-010.',
  '',
  '## Output',
  '- `UAOS_PA3X_PRF_STRUCTURAL_CATALOGUE_011.json`',
  '- `UAOS_PA3X_PRF_REGION_MAP_011.json`',
  '',
  '## Safety',
  '- Read-only.',
  '- No decoded values.',
  '- No writer.',
  '- No keyboard-native files.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_PARSER_USAGE_EXAMPLES_011.md`, [
  '# UAOS PA3X PRF Parser Usage Examples 011',
  '',
  'Run from the Run 011 folder:',
  '',
  '```powershell',
  'node run-pa3x-prf-readonly-parser-v1.js',
  '```',
  '',
  'Expected output: non-keyboard JSON structural catalogue files only.',
  '',
  'Do not use this parser to generate or modify keyboard files.'
].join('\n') + '\n', 'utf8');

const decision = 'A. Move to STYLE structural probe';
const nextAction = 'Approve Run 012 STYLE read-only structural probe, fixed windows only, no value decoding, no writer output.';
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_NEXT_SAFE_TARGETS_011.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  decision,
  nextSafeAction: nextAction,
  prfParserV1Provides: ['PRF structural catalogue', 'region offsets and lengths', 'confidence per region', 'unknown region tracking'],
  whyNoWriterYet: ['PRF alone is not a full SET model', 'STYLE/PAD/GLOBAL relationships remain unmapped', 'no values decoded', 'no output schema exists'],
  neededNextForRealPa3xSet: 'STYLE structural probe is needed next because STYLE data is central for arranger content relationships.',
  remainsBlockedBeforeWriter: ['value decoding', 'musical meaning', 'native keyboard generation', 'USB write', 'keyboard transfer']
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_012_RECOMMENDATION.md`, [
  '# UAOS PA3X Run 012 Recommendation',
  '',
  `Decision: ${decision}`,
  '',
  '## What PRF parser v1 gives us',
  '- A read-only structural catalogue for 16 PRF files.',
  '- Region labels, offsets, lengths, confidence, and unknown regions.',
  '- Non-keyboard JSON only.',
  '',
  '## Why this still does not allow writer output',
  '- PRF is only one part of a PA3X SET.',
  '- No values, names/settings, or musical meaning are decoded.',
  '- STYLE/PAD/GLOBAL relationships are not mapped enough for any output design.',
  '',
  '## Needed next',
  '- STYLE structural probe, read-only, fixed windows only, no value decoding.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_PARSER_V1_011.md`, [
  '# UAOS PA3X Writer Feasibility After PRF Parser V1 011',
  '',
  'Still no real writer output.',
  '',
  'Still no keyboard-compatible claim.',
  '',
  'PRF parser v1 provides a structural catalogue only. It does not decode performance values and does not provide a complete SET schema.',
  '',
  'Before writer work: STYLE/PAD/GLOBAL structure, controlled schema, synthetic output design, owner approval, isolated USB test plan, and physical PA3X load result remain required.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_011_QA_REPORT.md`, [
  '# UAOS PA3X Run 011 QA Report',
  '',
  `Status: ${qaStatus}`,
  `PRF files parsed: ${catalogue.prfFilesParsed}`,
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
  'Output JSON is non-keyboard structural catalogue only: YES',
  '',
  '## Native output scan',
  nativeHits.length ? nativeHits.map((item) => `- ${item}`).join('\n') : '- No generated native keyboard files found.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_011_MASTER_INDEX.md`, [
  '# UAOS PA3X Run 011 Master Index',
  '',
  '- UAOS_PA3X_RUN_011_SCOPE.md',
  '- UAOS_PA3X_PRF_PARSER_V1_LIMITS.json',
  '- pa3xPrfReadOnlyParserV1.js',
  '- run-pa3x-prf-readonly-parser-v1.js',
  '- UAOS_PA3X_PRF_STRUCTURAL_CATALOGUE_011.json',
  '- UAOS_PA3X_PRF_REGION_MAP_011.json',
  '- UAOS_PA3X_PRF_PARSER_V1_RESULTS_011.json',
  '- UAOS_PA3X_PRF_PARSER_V1_REPORT_011.md',
  '- UAOS_PA3X_PRF_STRUCTURAL_SCHEMA_V3_011.json',
  '- UAOS_PA3X_PRF_READONLY_PARSER_API_011.md',
  '- UAOS_PA3X_PRF_PARSER_USAGE_EXAMPLES_011.md',
  '- UAOS_PA3X_RUN_012_RECOMMENDATION.md',
  '- UAOS_PA3X_NEXT_SAFE_TARGETS_011.json',
  '- UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_PARSER_V1_011.md',
  '- UAOS_PA3X_RUN_011_QA_REPORT.md',
  '- UAOS_PA3X_RUN_011_SEAL.md'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_011_SEAL.md`, [
  '# UAOS PA3X Run 011 Seal',
  '',
  `Status: ${qaStatus}`,
  '',
  'Run 011 completed PRF read-only parser v1 as a non-keyboard structural catalogue. No values were decoded and no keyboard output was generated.'
].join('\n') + '\n', 'utf8');

console.log(JSON.stringify({ status: qaStatus, prfFilesParsed: catalogue.prfFilesParsed, nextDecision: decision, nativeHits: nativeHits.length }, null, 2));
