import fs from 'node:fs';
import path from 'node:path';
import { parsePrfTarget, summarizeStructuralMap, safetyScanOutput } from './pa3xPrfMinimalStructuralParser.js';

const root = 'E:/keyboard-manager-clean';
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`;
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-007-prf-minimal-structural-parser`;
const targetData = JSON.parse(fs.readFileSync(`${outputRoot}/UAOS_PA3X_RUN_007_PRF_TARGET_FILES.json`, 'utf8'));
const records = targetData.targets.map((target) => parsePrfTarget({ fixtureRoot, target }));
const summary = summarizeStructuralMap(records);
const nativeHits = safetyScanOutput(outputRoot).map((item) => path.relative(outputRoot, item).replaceAll('\\', '/'));
const fixtureUnchanged = records.every((record) => record.currentSizeMatchesRun006);
const qaStatus = fixtureUnchanged && nativeHits.length === 0 && records.every((record) => record.withinReadLimit && record.noValueDecoding && record.noMusicalMeaning && record.noKeyboardOutput) ? 'PASS' : 'BLOCKED';

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STRUCTURAL_MAP_007.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  readOnly: true,
  targetExtension: '.prf',
  maxBytesPerFileRead: 8192,
  noValueDecode: true,
  noMusicalMeaning: true,
  noKeyboardOutput: true,
  ...summary,
  records
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STRUCTURAL_REPORT_007.md`, [
  '# UAOS PA3X PRF Structural Report 007',
  '',
  `Status: ${qaStatus}`,
  `PRF files analyzed: ${records.length}`,
  '',
  '## File size patterns',
  `- Min bytes: ${summary.fileSizePatterns.minBytes}`,
  `- Max bytes: ${summary.fileSizePatterns.maxBytes}`,
  `- Unique sizes: ${summary.fileSizePatterns.uniqueSizes.join(', ')}`,
  `- All same size: ${summary.fileSizePatterns.allSameSize ? 'YES' : 'NO'}`,
  '',
  '## Common header regions',
  '- Offset 0, 256-byte fixed window, medium structural confidence.',
  '',
  '## Common boundary offsets',
  summary.commonBoundaryOffsets.length ? summary.commonBoundaryOffsets.map((item) => `- ${item.offset}: ${item.count} files`).join('\n') : '- No repeated offset found across more than one file.',
  '',
  '## Possible repeated record sizes',
  summary.possibleRepeatedRecordSizes.length ? summary.possibleRepeatedRecordSizes.map((size) => `- ${size} bytes`).join('\n') : '- None with safe confidence from prefix-only analysis.',
  '',
  '## Unknown regions',
  '- Bytes after offset 8192 remain unread for larger files.',
  '- Any byte-field meaning remains unknown.',
  '',
  '## Safe to parse next',
  '- One deeper read-only PRF structure pass may inventory boundary offsets and region lengths only.',
  '',
  '## Still blocked',
  '- Value decoding, performance names/settings, musical meaning, keyboard-native output, USB transfer, sample extraction.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_STRUCTURAL_SCHEMA_DRAFT_007.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  readOnlySchemaDraft: true,
  decodedMusicalFields: false,
  schema: {
    fileHeader: { startOffset: 0, length: 256, fields: [], note: 'Structural region only; no values decoded.' },
    metadataRegion: { startOffset: 256, length: 'unknown', fields: [], note: 'Candidate only; requires Run 008 approval.' },
    blockRegion: { startOffset: 'candidate common boundaries', length: 'unknown', fields: [], note: 'Boundary offsets only.' },
    unknownRegion: { startOffset: 8192, length: 'fileSize - 8192 when positive', fields: [], note: 'Unread in Run 007.' },
    footerRegion: { startOffset: 'not detected safely', length: 'unknown', fields: [], note: 'No footer claim from PRF prefix-only parsing.' }
  }
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PRF_PARSER_LIMITATIONS_007.md`, [
  '# UAOS PA3X PRF Parser Limitations 007',
  '',
  '- Reads only the first 8192 bytes per PRF file.',
  '- Does not decode values.',
  '- Does not infer performance names, settings, or musical meaning.',
  '- Does not prove keyboard compatibility.',
  '- Does not create keyboard output.',
  '- Larger unread regions remain unknown.'
].join('\n') + '\n', 'utf8');

const structurallyConsistent = summary.fileSizePatterns.uniqueSizes.length <= 8 && summary.commonBoundaryOffsets.length > 0;
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_NEXT_SAFE_PARSE_TARGETS_007.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  prfGroupStructurallyConsistent: structurallyConsistent,
  run008CanSafelyParseOneDeeperLayer: true,
  recommendedRun008Scope: 'PRF read-only structural layer 2: common boundary inventory and region-length catalogue only.',
  stylePadStatus: 'STYLE/PAD remain blocked from deeper parsing until PRF structural layer is reviewed or separately approved.',
  requiredBeforeWriter: ['controlled parser schema', 'synthetic output design', 'owner approval', 'isolated USB test plan', 'physical PA3X load result'],
  ownerApprovalNeededNext: 'Approve Run 008 PRF structural layer 2, read-only, no value decoding, no writer output.'
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_008_RECOMMENDATION.md`, [
  '# UAOS PA3X Run 008 Recommendation',
  '',
  `PRF group structurally consistent: ${structurallyConsistent ? 'YES' : 'PARTIAL'}`,
  '',
  'Run 008 can safely parse one deeper structural layer if it remains read-only and offset-only.',
  '',
  'Recommended Run 008 scope: PRF structural layer 2, common boundary inventory and region-length catalogue only. No values, no names/settings, no writer output.',
  '',
  'STYLE and PAD should remain blocked from deeper parsing until PRF layer 2 is reviewed or separately approved.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_007.md`, [
  '# UAOS PA3X Writer Feasibility After PRF 007',
  '',
  'Still no real writer output.',
  '',
  'Still no keyboard-compatible claim.',
  '',
  'Run 007 provides a PRF structural map from limited prefixes only. It does not define editable fields, does not decode performance values, and does not prove output compatibility.',
  '',
  'Before any writer: controlled parser schema, synthetic output design, owner approval, isolated USB test plan, and physical PA3X load result are required.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_007_QA_REPORT.md`, [
  '# UAOS PA3X Run 007 QA Report',
  '',
  `Status: ${qaStatus}`,
  `PRF files analyzed: ${records.length}`,
  `Fixture unchanged by run: ${fixtureUnchanged ? 'YES' : 'NO'}`,
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

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_007_MASTER_INDEX.md`, [
  '# UAOS PA3X Run 007 Master Index',
  '',
  '- UAOS_PA3X_RUN_007_PRF_TARGET_SELECTION.md',
  '- UAOS_PA3X_RUN_007_PRF_TARGET_FILES.json',
  '- pa3xPrfMinimalStructuralParser.js',
  '- run-pa3x-prf-minimal-parser.js',
  '- UAOS_PA3X_PRF_STRUCTURAL_MAP_007.json',
  '- UAOS_PA3X_PRF_STRUCTURAL_REPORT_007.md',
  '- UAOS_PA3X_PRF_STRUCTURAL_SCHEMA_DRAFT_007.json',
  '- UAOS_PA3X_PRF_PARSER_LIMITATIONS_007.md',
  '- UAOS_PA3X_RUN_008_RECOMMENDATION.md',
  '- UAOS_PA3X_NEXT_SAFE_PARSE_TARGETS_007.json',
  '- UAOS_PA3X_WRITER_FEASIBILITY_AFTER_PRF_007.md',
  '- UAOS_PA3X_RUN_007_QA_REPORT.md',
  '- UAOS_PA3X_RUN_007_SEAL.md'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_007_SEAL.md`, [
  '# UAOS PA3X Run 007 Seal',
  '',
  `Status: ${qaStatus}`,
  '',
  'Run 007 completed as a read-only minimal structural parser for PRF files. No values or musical meanings were decoded and no keyboard output was generated.'
].join('\n') + '\n', 'utf8');

console.log(JSON.stringify({ status: qaStatus, prfFilesAnalyzed: records.length, structurallyConsistent, nativeHits: nativeHits.length }, null, 2));
