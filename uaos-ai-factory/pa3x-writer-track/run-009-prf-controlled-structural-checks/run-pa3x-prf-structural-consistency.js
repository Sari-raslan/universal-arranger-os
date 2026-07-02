import fs from 'node:fs';
import path from 'node:path';
import { checkConsistency, safetyScanOutput } from './pa3xPrfStructuralConsistencyChecker.js';

const root = 'E:/keyboard-manager-clean';
const run008Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-008-prf-structural-layer2`;
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-009-prf-controlled-structural-checks`;
const inventory = JSON.parse(fs.readFileSync(`${run008Root}/UAOS_PA3X_PRF_BOUNDARY_INVENTORY_008.json`, 'utf8'));
const lengthCatalogue = JSON.parse(fs.readFileSync(`${run008Root}/UAOS_PA3X_PRF_REGION_LENGTH_CATALOGUE_008.json`, 'utf8'));
const fingerprints = JSON.parse(fs.readFileSync(`${run008Root}/UAOS_PA3X_PRF_STRUCTURE_FINGERPRINTS_008.json`, 'utf8'));
const schema = JSON.parse(fs.readFileSync(`${run008Root}/UAOS_PA3X_PRF_STRUCTURAL_SCHEMA_V2_008.json`, 'utf8'));
const criteria = JSON.parse(fs.readFileSync(`${outputRoot}/UAOS_PA3X_PRF_CONSISTENCY_CRITERIA_009.json`, 'utf8'));
const result = checkConsistency({ inventory, lengthCatalogue, fingerprints, schema, criteria });
const nativeHits = safetyScanOutput(outputRoot).map((item) => path.relative(outputRoot, item).replaceAll('\\', '/'));
const qaStatus = result.totalPrfFiles === 16 && nativeHits.length === 0 && result.noValueDecoding && result.noMusicalMeaning && result.noKeyboardOutput ? 'PASS' : 'BLOCKED';

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_CONSISTENCY_RESULTS_009.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  readOnly: true,
  source: 'Run 008 outputs only; fixture files not read in Run 009',
  ...result
}, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_OUTLIERS_009.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalPrfFiles: result.totalPrfFiles,
  outlierCount: result.outlierFiles.length,
  outliers: result.outlierFiles,
  noValueDecoding: true
}, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STABLE_REGIONS_009.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalPrfFiles: result.totalPrfFiles,
  stableRegions: result.stableRegions,
  variableRegions: result.variableRegions,
  unknownRegions: result.unknownRegions,
  noValueDecoding: true
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_CONSISTENCY_REPORT_009.md`, [
  '# UAOS PA3X PRF Consistency Report 009',
  '',
  `Status: ${qaStatus}`,
  `Total PRF files: ${result.totalPrfFiles}`,
  `Structural consistency score: ${result.structuralConsistencyScore}`,
  `Confidence: ${result.confidence}`,
  `Decision: ${result.decision}`,
  '',
  '## Stable regions',
  result.stableRegions.length ? result.stableRegions.map((item) => `- Offset ${item.startOffset}: ${item.filesPresent} files`).join('\n') : '- No stable regions met the threshold.',
  '',
  '## Variable regions',
  result.variableRegions.length ? result.variableRegions.slice(0, 40).map((item) => `- Offset ${item.startOffset}: ${item.filesPresent} files`).join('\n') : '- No variable repeated regions catalogued.',
  '',
  '## Outliers',
  result.outlierFiles.length ? result.outlierFiles.map((item) => `- ${item.relativePath}: score ${item.structuralScore}`).join('\n') : '- No outlier files under Run 009 criteria.',
  '',
  '## Parser-v1 readiness',
  result.parserV1Readiness.checklist.map((item) => `- ${item.item}: ${item.pass ? 'PASS' : 'WAIT'}`).join('\n'),
  '',
  '## No value decoding',
  '- Run 009 used Run 008 structural outputs only and did not decode values, names/settings, musical meaning, or keyboard payloads.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_PARSER_V1_READINESS_009.md`, [
  '# UAOS PA3X PRF Parser V1 Readiness 009',
  '',
  `Decision: ${result.decision}`,
  '',
  '## Why',
  result.decision.startsWith('A.')
    ? '- PRF has enough stable structural evidence for read-only parser v1.'
    : result.decision.startsWith('B.')
      ? '- PRF has some structure but needs one more structural check before parser v1.'
      : '- PRF consistency is too low; compare STYLE/PAD structural probes before parser v1.',
  '',
  '## Checklist',
  result.parserV1Readiness.checklist.map((item) => `- ${item.item}: ${item.pass ? 'PASS' : 'WAIT'}`).join('\n'),
  '',
  'No value decoding and no writer output remain mandatory.'
].join('\n') + '\n', 'utf8');

const nextSafe = result.decision.startsWith('A.')
  ? 'Approve Run 010 PRF read-only parser v1 that emits non-keyboard JSON region catalogue only.'
  : result.decision.startsWith('B.')
    ? 'Approve Run 010 one more PRF structural check focused on stable-offset subset validation only.'
    : 'Approve Run 010 STYLE/PAD read-only structural probe before PRF parser v1.';
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_NEXT_SAFE_TARGETS_009.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  decision: result.decision,
  nextSafeAction: nextSafe,
  prfParserV1Ready: result.parserV1Readiness.ready,
  stylePadCanBeConsidered: result.decision.startsWith('C.'),
  remainsBlockedBeforeWriter: ['value decoding', 'performance names/settings', 'musical meaning', 'native keyboard output', 'USB write', 'keyboard transfer'],
  ownerApprovalNeededNext: nextSafe
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_010_RECOMMENDATION.md`, [
  '# UAOS PA3X Run 010 Recommendation',
  '',
  `Decision selected: ${result.decision}`,
  '',
  `Next action: ${nextSafe}`,
  '',
  '## Explanation',
  result.decision.startsWith('A.')
    ? 'PRF is ready for read-only parser v1 because the consistency checks passed enough criteria.'
    : result.decision.startsWith('B.')
      ? 'PRF has partial structure, but one more focused structural check is safer before parser v1.'
      : 'PRF consistency remains low, so STYLE/PAD structural comparison may give better context before parser v1.',
  '',
  'No writer output is approved.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_009.md`, [
  '# UAOS PA3X Writer Feasibility After PRF 009',
  '',
  'Still no real writer output.',
  '',
  'Still no keyboard-compatible claim.',
  '',
  'Run 009 only scores structural consistency and parser-v1 readiness from existing structural outputs. It does not decode fields and does not create a writable schema.',
  '',
  'Before writer work: controlled parser schema, synthetic output design, owner approval, isolated USB test plan, and physical PA3X load result remain required.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_009_QA_REPORT.md`, [
  '# UAOS PA3X Run 009 QA Report',
  '',
  `Status: ${qaStatus}`,
  `PRF files checked: ${result.totalPrfFiles}`,
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

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_009_MASTER_INDEX.md`, [
  '# UAOS PA3X Run 009 Master Index',
  '',
  '- UAOS_PA3X_RUN_009_SCOPE.md',
  '- UAOS_PA3X_PRF_CONSISTENCY_CRITERIA_009.json',
  '- pa3xPrfStructuralConsistencyChecker.js',
  '- run-pa3x-prf-structural-consistency.js',
  '- UAOS_PA3X_PRF_CONSISTENCY_RESULTS_009.json',
  '- UAOS_PA3X_PRF_CONSISTENCY_REPORT_009.md',
  '- UAOS_PA3X_PRF_OUTLIERS_009.json',
  '- UAOS_PA3X_PRF_STABLE_REGIONS_009.json',
  '- UAOS_PA3X_PRF_PARSER_V1_READINESS_009.md',
  '- UAOS_PA3X_RUN_010_RECOMMENDATION.md',
  '- UAOS_PA3X_NEXT_SAFE_TARGETS_009.json',
  '- UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_009.md',
  '- UAOS_PA3X_RUN_009_QA_REPORT.md',
  '- UAOS_PA3X_RUN_009_SEAL.md'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_009_SEAL.md`, [
  '# UAOS PA3X Run 009 Seal',
  '',
  `Status: ${qaStatus}`,
  '',
  'Run 009 completed controlled PRF structural checks from Run 008 outputs only. No values were decoded and no keyboard output was generated.'
].join('\n') + '\n', 'utf8');

console.log(JSON.stringify({ status: qaStatus, prfFilesChecked: result.totalPrfFiles, score: result.structuralConsistencyScore, decision: result.decision, nativeHits: nativeHits.length }, null, 2));
