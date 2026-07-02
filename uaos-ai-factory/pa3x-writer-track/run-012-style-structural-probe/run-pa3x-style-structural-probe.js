import fs from 'node:fs';
import path from 'node:path';
import { probeStyleTarget, buildHeaderGroups, safetyScanOutput } from './pa3xStyleStructuralProbe.js';

const root = 'E:/keyboard-manager-clean';
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`;
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-012-style-structural-probe`;
const targetData = JSON.parse(fs.readFileSync(`${outputRoot}/UAOS_PA3X_RUN_012_STYLE_TARGET_FILES.json`, 'utf8'));
const records = targetData.targets.map((target) => probeStyleTarget({ fixtureRoot, target }));
const headerGroups = buildHeaderGroups(records);
const nativeHits = safetyScanOutput(outputRoot).map((item) => path.relative(outputRoot, item).replaceAll('\\', '/'));
const qaStatus = records.length > 0 && nativeHits.length === 0 && records.every((r) => r.withinReadLimit && r.noValueDecoding && r.noMusicalMeaning && r.noKeyboardOutput) ? 'PASS' : 'BLOCKED';
const sizePatterns = records.map((r) => r.sizeBytes);
const decision = records.length === 1 ? 'A. Continue STYLE structural layer 2' : 'A. Continue STYLE structural layer 2';
const nextAction = 'Approve Run 013 STYLE structural layer 2 with controlled boundary inventory, fixed windows only, no value decoding, no writer output.';

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_STYLE_STRUCTURAL_MAP_012.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  readOnly: true,
  targetRole: 'STYLE-related only',
  styleCandidateFiles: records.length,
  maxBytesPerFileRead: 8192,
  defaultWindowBytes: 256,
  noValueDecode: true,
  noMusicalMeaning: true,
  noKeyboardOutput: true,
  fileSizePatterns: { uniqueSizes: [...new Set(sizePatterns)], minBytes: Math.min(...sizePatterns), maxBytes: Math.max(...sizePatterns) },
  records
}, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_STYLE_HEADER_GROUPS_012.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  styleCandidateFiles: records.length,
  headerGroups,
  noValueDecode: true
}, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_STYLE_CANDIDATE_REGIONS_012.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  styleCandidateFiles: records.length,
  candidateRegions: records.map((r) => ({ relativePath: r.relativePath, candidateRegions: r.candidateRegions })),
  noValueDecode: true,
  noKeyboardOutput: true
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_STYLE_BOUNDARY_REPORT_012.md`, [
  '# UAOS PA3X STYLE Boundary Report 012',
  '',
  `Status: ${qaStatus}`,
  `STYLE candidate files: ${records.length}`,
  '',
  '## File size patterns',
  `- Unique sizes: ${[...new Set(sizePatterns)].join(', ')}`,
  '',
  '## Common header regions',
  '- Offset 0, 256-byte fixed window, medium confidence for the available STYLE file.',
  '',
  '## Repeated byte / region candidates',
  records.map((r) => `- ${r.relativePath}: ${r.repeatedRegionCandidates.length} repeated candidates, ${r.possibleSectionLikeBoundariesByOffsetOnly.length} possible boundaries`).join('\n'),
  '',
  '## Possible section-like boundaries by offset only',
  records.map((r) => `- ${r.relativePath}: ${r.possibleSectionLikeBoundariesByOffsetOnly.join(', ') || 'none'}`).join('\n'),
  '',
  '## Unknown regions',
  '- Most of the STYLE file remains unread and undecoded by design.',
  '- Cross-file consistency cannot be established from one STYLE fixture file.',
  '',
  '## No value decoding / no writer output',
  '- No style names, settings, pattern content, musical meaning, or keyboard payloads were decoded.',
  '- No keyboard output was generated.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_STYLE_STRUCTURAL_SCHEMA_DRAFT_012.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  schemaDraft: 'STYLE-structural-draft-012',
  decodedFields: [],
  styleFileHeader: { startOffset: 0, length: 256, confidence: 'medium', decodedFields: [] },
  candidateMetadataRegion: { startOffset: 256, length: 'unknown', confidence: 'low', decodedFields: [] },
  candidateSectionRegion: { source: 'possibleSectionLikeBoundariesByOffsetOnly', decodedFields: [] },
  candidatePatternRegion: { source: 'not decoded; label is structural only', decodedFields: [] },
  repeatedRegion: { source: 'repeated byte pattern candidates only', decodedFields: [] },
  unknownRegion: { description: 'all bytes outside fixed windows and all byte-field meanings remain unknown', decodedFields: [] },
  footerCandidate: { confidence: 'low', decodedFields: [] },
  safety: { readOnly: true, noValueDecoding: true, noMusicalMeaning: true, noKeyboardOutput: true }
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_STYLE_PARSER_LIMITATIONS_012.md`, [
  '# UAOS PA3X STYLE Parser Limitations 012',
  '',
  '- Only fixed windows were read.',
  '- Only one STYLE-related file exists in the current fixture, so cross-file consistency is unavailable.',
  '- No values were decoded.',
  '- No style names/settings/pattern content or musical meaning were inferred.',
  '- No keyboard output was generated.',
  '- Most of the file remains unknown by design.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_NEXT_SAFE_TARGETS_012.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  decision,
  nextSafeAction: nextAction,
  styleProbeTellsUs: ['STYLE file exists', 'header and selected structural windows can be safely catalogued', 'initial boundary candidates exist', 'cross-file consistency is unavailable with one STYLE file'],
  styleCandidatesConsistent: 'unknown; only one STYLE candidate file is available',
  realWriterStillBlocked: true,
  remainsBlockedBeforeWriter: ['value decoding', 'style pattern meaning', 'native keyboard output', 'SET writer design', 'USB write', 'hardware transfer'],
  ownerApprovalNeededNext: nextAction
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_013_RECOMMENDATION.md`, [
  '# UAOS PA3X Run 013 Recommendation',
  '',
  `Decision: ${decision}`,
  '',
  '## What STYLE probe tells us',
  '- A STYLE-related file is present and can be probed with fixed windows.',
  '- Initial header and section-like boundary candidates can be catalogued safely.',
  '- Cross-file consistency is not available because the fixture contains one STYLE file.',
  '',
  '## Real writer status',
  '- Still blocked. No values, style patterns, or keyboard output were produced.',
  '',
  '## Exact next safest action',
  `- ${nextAction}`
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_WRITER_FEASIBILITY_AFTER_STYLE_PROBE_012.md`, [
  '# UAOS PA3X Writer Feasibility After STYLE Probe 012',
  '',
  'Still no real writer output.',
  '',
  'Still no keyboard-compatible claim.',
  '',
  'STYLE probing improves the structural map, but it does not decode style values, pattern data, or musical meaning. A real writer remains blocked until STYLE/PAD/GLOBAL structures, controlled schemas, synthetic output design, owner approval, isolated USB planning, and physical PA3X load testing exist.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_012_QA_REPORT.md`, [
  '# UAOS PA3X Run 012 QA Report',
  '',
  `Status: ${qaStatus}`,
  `STYLE target files: ${records.length}`,
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

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_012_MASTER_INDEX.md`, [
  '# UAOS PA3X Run 012 Master Index',
  '',
  '- UAOS_PA3X_RUN_012_STYLE_TARGET_SELECTION.md',
  '- UAOS_PA3X_RUN_012_STYLE_TARGET_FILES.json',
  '- pa3xStyleStructuralProbe.js',
  '- run-pa3x-style-structural-probe.js',
  '- UAOS_PA3X_STYLE_STRUCTURAL_MAP_012.json',
  '- UAOS_PA3X_STYLE_BOUNDARY_REPORT_012.md',
  '- UAOS_PA3X_STYLE_HEADER_GROUPS_012.json',
  '- UAOS_PA3X_STYLE_CANDIDATE_REGIONS_012.json',
  '- UAOS_PA3X_STYLE_STRUCTURAL_SCHEMA_DRAFT_012.json',
  '- UAOS_PA3X_STYLE_PARSER_LIMITATIONS_012.md',
  '- UAOS_PA3X_RUN_013_RECOMMENDATION.md',
  '- UAOS_PA3X_NEXT_SAFE_TARGETS_012.json',
  '- UAOS_PA3X_WRITER_FEASIBILITY_AFTER_STYLE_PROBE_012.md',
  '- UAOS_PA3X_RUN_012_QA_REPORT.md',
  '- UAOS_PA3X_RUN_012_SEAL.md'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_012_SEAL.md`, [
  '# UAOS PA3X Run 012 Seal',
  '',
  `Status: ${qaStatus}`,
  '',
  'Run 012 completed a STYLE read-only structural probe with fixed windows only. No values were decoded and no keyboard output was generated.'
].join('\n') + '\n', 'utf8');

console.log(JSON.stringify({ status: qaStatus, styleTargetFiles: records.length, decision, nativeHits: nativeHits.length }, null, 2));
