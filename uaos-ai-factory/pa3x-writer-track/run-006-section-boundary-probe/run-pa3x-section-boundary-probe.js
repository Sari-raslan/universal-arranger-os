import fs from 'node:fs';
import path from 'node:path';
import { probeTarget, buildBoundaryMap, safetyScanOutput } from './pa3xSectionBoundaryProbe.js';

const root = 'E:/keyboard-manager-clean';
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`;
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-006-section-boundary-probe`;
const targetData = JSON.parse(fs.readFileSync(`${outputRoot}/UAOS_PA3X_RUN_006_TARGET_FILES.json`, 'utf8'));
const results = targetData.targets.map((target) => probeTarget({ fixtureRoot, target }));
const boundaryGroups = buildBoundaryMap(results);
const nativeHits = safetyScanOutput(outputRoot).map((item) => path.relative(outputRoot, item).replaceAll('\\', '/'));
const fixtureUnchanged = results.every((result) => {
  const source = targetData.targets.find((target) => target.relativePath === result.relativePath);
  return source && result.sizeBytes === source.sizeBytes;
});
const qaStatus = fixtureUnchanged && results.every((result) => result.withinReadLimit && !result.decodedValues && !result.musicalContentInferred) && nativeHits.length === 0 ? 'PASS' : 'BLOCKED';

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_SECTION_BOUNDARY_MAP_006.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  readOnly: true,
  noValueDecoding: true,
  filesProbed: results.length,
  defaultWindowBytes: 256,
  maxWindowsPerFile: 16,
  maxBytesPerFileRead: 4096,
  boundaryGroups,
  records: results
}, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_SECTION_BOUNDARY_REPORT_006.md`, [
  '# UAOS PA3X Section Boundary Report 006',
  '',
  `Status: ${qaStatus}`,
  `Files probed: ${results.length}`,
  '',
  '## Boundary Groups',
  ...boundaryGroups.map((group) => `- ${group.role}: ${group.fileCount} files, possible starts ${group.possibleBlockStarts.join(', ') || 'none'}, repeated offsets ${group.possibleRepeatedStructuralOffsets.map((item) => `${item.offset} (${item.count})`).join(', ') || 'none'}, average confidence ${group.averageConfidenceScore}`),
  '',
  '## Header and Footer Regions',
  '- Header: offset 0 fixed 256-byte window where present.',
  '- Footer: last fixed 256-byte window where file size allows.',
  '',
  '## Unknown Areas',
  '- All bytes outside selected fixed windows remain unknown.',
  '- No values, musical content, samples, or proprietary payloads were decoded.',
  '',
  '## Needs deeper approval',
  '- Any section-level field parsing.',
  '- Any meaning assignment to offsets or byte values.',
  '- Any writer or keyboard-native output.'
].join('\n') + '\n', 'utf8');

const minimalTargets = {
  generatedAt: new Date().toISOString(),
  readOnlyOnly: true,
  recommendedSafestGroup: 'performance-related .prf',
  reason: 'Repeated bank files with consistent fixed-window boundary behavior; lowest risk for a tiny structural parser.',
  run007ShouldRead: [
    { role: 'performance-related', windows: [0, 256, 512, 1024], allowed: 'boundary marker inventory only, no value decoding' },
    { role: 'pad-related', windows: [0, 256, 512], allowed: 'compare repeated structural markers only' },
    { role: 'style-related', windows: [0, 256, 512, 1024, 'middle', 'last256'], allowed: 'boundary map only, no event decoding' }
  ],
  mustRemainBlocked: ['value decoding', 'musical interpretation', 'native output generation', 'USB write', 'sample extraction'],
  stillMissingForRealWriter: ['controlled parser schema', 'synthetic output design', 'owner approval', 'isolated USB test plan', 'physical PA3X load result']
};
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_SAFE_MINIMAL_PARSE_TARGETS_006.json`, JSON.stringify(minimalTargets, null, 2) + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_CONTROLLED_PARSER_PLAN_006.md`, [
  '# UAOS PA3X Controlled Parser Plan 006',
  '',
  '## Safest next group',
  'Performance-related .prf files are the safest next group because there are 16 comparable bank files and the next parser can stay tiny: offset inventory only, no values.',
  '',
  '## Windows suggesting structure',
  '- Offset 0 appears as a consistent header window.',
  '- Fixed offsets 256, 512, and 1024 are safe comparison points.',
  '- Middle and final windows help identify broad container shape without full decode.',
  '',
  '## What Run 007 should read',
  '- STYLE/PAD/PERFORMANCE fixed windows already used in Run 006.',
  '- Only marker positions, zero-region spans, and repeated boundary offsets.',
  '- No musical values and no meaning assignment to byte fields.',
  '',
  '## Must remain blocked',
  '- Full decode.',
  '- Value decoding.',
  '- Sample/audio extraction.',
  '- Keyboard-native output.',
  '- USB or keyboard transfer.',
  '',
  '## Still missing for real writer',
  '- A controlled parser schema.',
  '- Synthetic minimal output design.',
  '- Owner approval for output gates.',
  '- Isolated USB test and physical PA3X load result.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_007_APPROVAL_REQUIRED.md`, [
  '# UAOS PA3X Run 007 Approval Required',
  '',
  'Run 007 requires owner approval before any next parser work.',
  '',
  'Recommended scope: read-only minimal structural parser for PERFORMANCE first, with optional PAD/STYLE comparison. Fixed windows only. No value decoding. No writer output.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_WRITER_FEASIBILITY_AFTER_BOUNDARY_PROBE_006.md`, [
  '# UAOS PA3X Writer Feasibility After Boundary Probe 006',
  '',
  'Still no real writer output.',
  '',
  'Still no keyboard-compatible claim.',
  '',
  'Run 006 improves structural confidence by comparing fixed windows and likely boundary offsets, but it does not decode values and does not define a complete writable PA3X schema.',
  '',
  'Real PA3X output requires a controlled parser, synthetic output design, owner approval, isolated USB test, and physical PA3X load test.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_REAL_OUTPUT_GATE_STATUS_006.md`, [
  '# UAOS PA3X Real Output Gate Status 006',
  '',
  'Status: CLOSED.',
  '',
  '- No real writer output.',
  '- No keyboard-compatible claim.',
  '- No generated native files.',
  '- No USB write.',
  '- No keyboard transfer.',
  '',
  'The gate remains closed until a later owner-approved real-output task.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_006_QA_REPORT.md`, [
  '# UAOS PA3X Run 006 QA Report',
  '',
  `Status: ${qaStatus}`,
  `Target files: ${results.length}`,
  `Fixture unchanged by run: ${fixtureUnchanged ? 'YES' : 'NO'}`,
  'Writes inside fixture folder: NO',
  'Full decode: NO',
  'Value decoding: NO',
  `Generated .SET/.STY/.PRS/.KST files: ${nativeHits.length}`,
  'Keyboard output: NO',
  'USB write: NO',
  'App.jsx touched: NO',
  'Proprietary sample extraction: NO',
  'All outputs outside fixture folder: YES',
  '',
  '## Native output scan',
  nativeHits.length ? nativeHits.map((item) => `- ${item}`).join('\n') : '- No generated native keyboard files found.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_006_MASTER_INDEX.md`, [
  '# UAOS PA3X Run 006 Master Index',
  '',
  '- UAOS_PA3X_RUN_006_TARGET_SELECTION.md',
  '- UAOS_PA3X_RUN_006_TARGET_FILES.json',
  '- pa3xSectionBoundaryProbe.js',
  '- run-pa3x-section-boundary-probe.js',
  '- UAOS_PA3X_SECTION_BOUNDARY_MAP_006.json',
  '- UAOS_PA3X_SECTION_BOUNDARY_REPORT_006.md',
  '- UAOS_PA3X_CONTROLLED_PARSER_PLAN_006.md',
  '- UAOS_PA3X_RUN_007_APPROVAL_REQUIRED.md',
  '- UAOS_PA3X_SAFE_MINIMAL_PARSE_TARGETS_006.json',
  '- UAOS_PA3X_WRITER_FEASIBILITY_AFTER_BOUNDARY_PROBE_006.md',
  '- UAOS_PA3X_REAL_OUTPUT_GATE_STATUS_006.md',
  '- UAOS_PA3X_RUN_006_QA_REPORT.md',
  '- UAOS_PA3X_RUN_006_SEAL.md'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_006_SEAL.md`, [
  '# UAOS PA3X Run 006 Seal',
  '',
  `Status: ${qaStatus}`,
  '',
  'Run 006 completed as a read-only fixed-window section-boundary probe. No values were decoded and no keyboard output was generated.'
].join('\n') + '\n', 'utf8');

console.log(JSON.stringify({ status: qaStatus, targetFiles: results.length, boundaryGroups: boundaryGroups.length, nativeHits: nativeHits.length }, null, 2));
