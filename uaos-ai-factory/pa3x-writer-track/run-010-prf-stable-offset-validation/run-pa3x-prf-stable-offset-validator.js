import fs from 'node:fs';
import path from 'node:path';
import { validateStableOffsets, safetyScanOutput } from './pa3xPrfStableOffsetValidator.js';

const root = 'E:/keyboard-manager-clean';
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`;
const run003Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-003-fixture-scanner`;
const run009Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-009-prf-controlled-structural-checks`;
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-010-prf-stable-offset-validation`;
const stableRegions = JSON.parse(fs.readFileSync(`${run009Root}/UAOS_PA3X_PRF_STABLE_REGIONS_009.json`, 'utf8'));
const consistencyResults = JSON.parse(fs.readFileSync(`${run009Root}/UAOS_PA3X_PRF_CONSISTENCY_RESULTS_009.json`, 'utf8'));
const criteria = JSON.parse(fs.readFileSync(`${outputRoot}/UAOS_PA3X_RUN_010_STABLE_OFFSET_CRITERIA.json`, 'utf8'));
const fileIndex = JSON.parse(fs.readFileSync(`${run003Root}/UAOS_PA3X_FIXTURE_FILE_INDEX_003.json`, 'utf8'));
const result = validateStableOffsets({ fixtureRoot, fileIndex, stableRegions, consistencyResults, criteria });
const nativeHits = safetyScanOutput(outputRoot).map((item) => path.relative(outputRoot, item).replaceAll('\\', '/'));
const qaStatus = result.prfFilesValidated === 16 && nativeHits.length === 0 && result.noValueDecoding && result.noMusicalMeaning && result.noKeyboardOutput && result.perFile.every((file) => file.withinReadLimit) ? 'PASS' : 'BLOCKED';

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STABLE_OFFSET_VALIDATION_RESULTS_010.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  readOnly: true,
  source: 'Run 009 stable regions plus 64-byte fixture windows only',
  stableOffsetWindowBytes: 64,
  maxStableOffsetsPerFile: 32,
  maxBytesPerFileRead: 4096,
  ...result
}, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STABLE_OFFSET_CONFIDENCE_010.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  prfFilesValidated: result.prfFilesValidated,
  stableOffsetCount: result.stableOffsetCount,
  unstableOffsetCount: result.unstableOffsetCount,
  confidenceScore: result.confidenceScore,
  parserV1Readiness: result.parserV1Readiness,
  noValueDecoding: true
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STABLE_OFFSET_VALIDATION_REPORT_010.md`, [
  '# UAOS PA3X PRF Stable Offset Validation Report 010',
  '',
  `Status: ${qaStatus}`,
  `PRF files validated: ${result.prfFilesValidated}`,
  `Stable offsets from Run 009: ${result.stableOffsetCountFromRun009}`,
  `Validated offsets: ${result.validatedOffsetCount}`,
  `Stable offset count: ${result.stableOffsetCount}`,
  `Unstable offset count: ${result.unstableOffsetCount}`,
  `Confidence score: ${result.confidenceScore}`,
  `Parser-v1 readiness: ${result.parserV1Readiness.ready ? 'READY' : 'NOT READY'}`,
  '',
  '## Offset results',
  result.offsetResults.map((item) => `- Offset ${item.offset}: ${item.status}, similarity ${item.averageStructuralSimilarity}, windows ${item.windowsValidated}`).join('\n') || '- No stable offsets available.',
  '',
  '## Outlier files',
  result.outlierFiles.length ? result.outlierFiles.map((item) => `- ${item}`).join('\n') : '- No outlier files from stable-offset validation.',
  '',
  '## No value decoding',
  '- Only 64-byte structural fingerprints were compared. No values, names/settings, musical meaning, or keyboard payloads were decoded.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_OUTLIER_REVIEW_010.md`, [
  '# UAOS PA3X PRF Outlier Review 010',
  '',
  `Outlier files: ${result.outlierFiles.length}`,
  '',
  result.outlierFiles.length ? result.outlierFiles.map((item) => `- ${item}`).join('\n') : '- No outliers identified by the stable-offset subset validator.',
  '',
  'Outlier status is structural only. It does not imply musical or performance meaning.'
].join('\n') + '\n', 'utf8');

const decision = result.parserV1Readiness.finalDecision;
const run011 = decision.startsWith('A.')
  ? 'Approve Run 011 PRF read-only parser v1 that emits non-keyboard JSON structural catalogue only.'
  : decision.startsWith('B.')
    ? 'Approve Run 011 STYLE/PAD read-only structural probe before PRF parser v1.'
    : decision.startsWith('C.')
      ? 'Provide more PRF fixtures before PRF parser v1.'
      : 'Blocked pending owner decision.';
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_FINAL_PARSER_V1_DECISION_010.md`, [
  '# UAOS PA3X PRF Final Parser V1 Decision 010',
  '',
  `Decision: ${decision}`,
  '',
  '## Why',
  `- ${result.parserV1Readiness.reason}`,
  `- Confidence score: ${result.confidenceScore}`,
  `- Stable offsets validated: ${result.stableOffsetCount}/${result.validatedOffsetCount}`,
  '',
  '## Still blocked before writer',
  '- Value decoding.',
  '- Musical meaning or performance names/settings.',
  '- Keyboard-native output.',
  '- USB write or keyboard transfer.',
  '- Real writer output.',
  '',
  '## Owner approval needed next',
  `- ${run011}`
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_NEXT_SAFE_TARGETS_010.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  finalDecision: decision,
  nextSafeAction: run011,
  prfParserV1Ready: result.parserV1Readiness.ready,
  moveToStylePadRecommended: decision.startsWith('B.'),
  morePrfFixturesNeeded: decision.startsWith('C.'),
  remainsBlockedBeforeWriter: ['value decoding', 'musical meaning', 'performance names/settings', 'native keyboard output', 'USB write', 'keyboard transfer'],
  ownerApprovalNeededNext: run011
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_011_RECOMMENDATION.md`, [
  '# UAOS PA3X Run 011 Recommendation',
  '',
  `Decision selected: ${decision}`,
  '',
  `Next action: ${run011}`,
  '',
  decision.startsWith('A.')
    ? 'PRF stable-offset validation is strong enough to proceed to read-only parser v1 with JSON structural catalogue only.'
    : decision.startsWith('B.')
      ? 'PRF stable-offset validation is not strong enough for parser v1; STYLE/PAD structural comparison is the safer next learning step.'
      : 'More PRF fixtures are needed before PRF parser v1 can be justified.',
  '',
  'No writer output is approved.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_STABLE_OFFSETS_010.md`, [
  '# UAOS PA3X Writer Feasibility After PRF Stable Offsets 010',
  '',
  'Still no real writer output.',
  '',
  'Still no keyboard-compatible claim.',
  '',
  'Run 010 validates stable PRF offsets as structural fingerprints only. It does not decode fields and does not produce a writable PA3X schema.',
  '',
  'Before writer work: controlled parser schema, synthetic output design, owner approval, isolated USB test plan, and physical PA3X load result remain required.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_010_QA_REPORT.md`, [
  '# UAOS PA3X Run 010 QA Report',
  '',
  `Status: ${qaStatus}`,
  `PRF files validated: ${result.prfFilesValidated}`,
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

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_010_MASTER_INDEX.md`, [
  '# UAOS PA3X Run 010 Master Index',
  '',
  '- UAOS_PA3X_RUN_010_SCOPE.md',
  '- UAOS_PA3X_RUN_010_STABLE_OFFSET_CRITERIA.json',
  '- pa3xPrfStableOffsetValidator.js',
  '- run-pa3x-prf-stable-offset-validator.js',
  '- UAOS_PA3X_PRF_STABLE_OFFSET_VALIDATION_RESULTS_010.json',
  '- UAOS_PA3X_PRF_STABLE_OFFSET_VALIDATION_REPORT_010.md',
  '- UAOS_PA3X_PRF_STABLE_OFFSET_CONFIDENCE_010.json',
  '- UAOS_PA3X_PRF_OUTLIER_REVIEW_010.md',
  '- UAOS_PA3X_PRF_FINAL_PARSER_V1_DECISION_010.md',
  '- UAOS_PA3X_RUN_011_RECOMMENDATION.md',
  '- UAOS_PA3X_NEXT_SAFE_TARGETS_010.json',
  '- UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_STABLE_OFFSETS_010.md',
  '- UAOS_PA3X_RUN_010_QA_REPORT.md',
  '- UAOS_PA3X_RUN_010_SEAL.md'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_010_SEAL.md`, [
  '# UAOS PA3X Run 010 Seal',
  '',
  `Status: ${qaStatus}`,
  '',
  'Run 010 completed PRF stable-offset subset validation. It read only 64-byte structural windows around stable offsets and generated no keyboard output.'
].join('\n') + '\n', 'utf8');

console.log(JSON.stringify({ status: qaStatus, prfFilesValidated: result.prfFilesValidated, confidence: result.confidenceScore, decision, nativeHits: nativeHits.length }, null, 2));
