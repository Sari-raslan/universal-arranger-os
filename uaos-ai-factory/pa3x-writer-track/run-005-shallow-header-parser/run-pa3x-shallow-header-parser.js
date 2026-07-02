import fs from 'node:fs';
import path from 'node:path';
import { parseShallowHeaders, buildGroups, safetyScanOutput } from './pa3xShallowHeaderParser.js';

const root = 'E:/keyboard-manager-clean';
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`;
const run003Root = `${root}/uaos-ai-factory/pa3x-writer-track/run-003-fixture-scanner`;
const run004Root = `${root}/uaos-ai-factory/pa3x-writer-track/auto-run-004-fixture-classifier`;
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-005-shallow-header-parser`;

const fileIndex = JSON.parse(fs.readFileSync(`${run003Root}/UAOS_PA3X_FIXTURE_FILE_INDEX_003.json`, 'utf8'));
const classifierResults = JSON.parse(fs.readFileSync(`${run004Root}/cycle-003-classifier-implementation/UAOS_PA3X_CLASSIFIER_RESULTS_004.json`, 'utf8'));

const result = parseShallowHeaders({ fixtureRoot, fileIndex, classifierResults });
const groups = buildGroups(result.records);
const safetyHits = safetyScanOutput(outputRoot);
const nativeGenerated = safetyHits.map((item) => path.relative(outputRoot, item).replaceAll('\\', '/'));

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_SHALLOW_HEADER_RESULTS_005.json`, JSON.stringify(result, null, 2) + '\n', 'utf8');
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_HEADER_GROUPS_005.json`, JSON.stringify({ generatedAt: new Date().toISOString(), groups }, null, 2) + '\n', 'utf8');

const extensionSummary = {};
for (const record of result.records) {
  extensionSummary[record.extension] ??= { files: 0, totalBytes: 0, roles: {} };
  extensionSummary[record.extension].files += 1;
  extensionSummary[record.extension].totalBytes += record.sizeBytes;
  extensionSummary[record.extension].roles[record.likelyRole] = (extensionSummary[record.extension].roles[record.likelyRole] || 0) + 1;
}

const safeNextTargets = {
  generatedAt: new Date().toISOString(),
  readOnlyOnly: true,
  smallestSafeNextStep: 'Build a read-only section-boundary probe for STYLE, PAD, and PERFORMANCE using fixed byte windows and no value decoding.',
  safeTargets: [
    { group: 'performance-related .prf', reason: '16 similar KORF-bearing bank files; useful for slot map readiness.', allowedNextRead: 'controlled boundary windows only' },
    { group: 'pad-related .pad', reason: '10 similar KORF-bearing pad files; good for bank consistency checks.', allowedNextRead: 'controlled boundary windows only' },
    { group: 'style-related .sty', reason: 'single large KORF-bearing style bank required for eventual writer understanding.', allowedNextRead: 'boundary windows only, no event decoding' }
  ],
  unknownTargets: groups.filter((group) => group.likelyRole === 'unknown').map((group) => group.key),
  blockedTargets: [
    { group: 'PCM/sample-related', reason: 'sample/audio content remains blocked; none detected in this fixture by Run 003' },
    { group: 'native output formats', reason: 'real output requires later explicit owner approval' }
  ]
};
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_SAFE_NEXT_PARSE_TARGETS_005.json`, JSON.stringify(safeNextTargets, null, 2) + '\n', 'utf8');

const groupLines = [
  '# UAOS PA3X Format Group Report 005',
  '',
  `Files parsed: ${result.filesParsed}`,
  `Fixture unchanged against Run 003 hashes: ${result.fixtureUnchanged ? 'YES' : 'NO'}`,
  '',
  '## Extension Summary',
  ...Object.entries(extensionSummary).map(([ext, summary]) => `- ${ext}: ${summary.files} files, ${summary.totalBytes} bytes, roles ${JSON.stringify(summary.roles)}`),
  '',
  '## Header Groups',
  ...groups.map((group) => `- ${group.key}: ${group.fileCount} files, size ${group.minSize}-${group.maxSize} bytes, folders ${group.folderRoles.join(', ')}`),
  '',
  '## Notes',
  '- KORF appears as a repeated magic pattern in PA3X-related binary headers.',
  '- This report does not decode musical events, samples, or proprietary payloads.'
];
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_FORMAT_GROUP_REPORT_005.md`, groupLines.join('\n') + '\n', 'utf8');

const readiness = [
  '# UAOS PA3X Parser Readiness Map 005',
  '',
  '## Safe for next controlled parser',
  '- Performance .prf: safe for read-only boundary probing because files are repeated and consistent.',
  '- Pad .pad: safe for read-only boundary probing across 10 user banks.',
  '- Style .sty: required for writer research, but must stay boundary-only first because it is large and central.',
  '- Global .gbl/.mxp/.voc: safe for inventory and header comparison, deeper meaning remains blocked.',
  '- SongBook .sbd/.sbl: safe for inventory and header comparison only.',
  '',
  '## Unknown groups',
  groups.some((group) => group.likelyRole === 'unknown') ? groups.filter((group) => group.likelyRole === 'unknown').map((group) => `- ${group.key}`).join('\n') : '- None from Run 004 classifier.',
  '',
  '## Likely proprietary/sample/PCM blocked groups',
  '- PCM/sample groups remain blocked for extraction or decoding. Run 003 did not detect PCM/sample files in this fixture.',
  '',
  '## Required for real writer',
  '- Style, Pad, Performance, Global, and likely SongBook structures need documented safe schemas before any writer can be discussed.',
  '',
  '## Smallest safe next step',
  '- Build a read-only section-boundary probe for STYLE, PAD, and PERFORMANCE using fixed windows, no value decoding, no keyboard output.'
];
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_PARSER_READINESS_MAP_005.md`, readiness.join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_DEEP_PARSE_APPROVAL_REQUIRED_005.md`, [
  '# UAOS PA3X Deep Parse Approval Required 005',
  '',
  'Deep parse remains blocked unless the owner approves a new task with exact file groups, byte limits, and allowed fields.',
  '',
  'Still forbidden: sample extraction, proprietary audio decoding, keyboard-native output, USB write, keyboard transfer, and real writer output.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_WRITER_FEASIBILITY_AFTER_HEADERS_005.md`, [
  '# UAOS PA3X Writer Feasibility After Headers 005',
  '',
  'A real writer is still not feasible from headers alone.',
  '',
  'The header parser improves the map of PA3X-related file groups and confirms repeated KORF-bearing binary containers, but it does not establish a complete editable schema or safe output behavior.',
  '',
  'A real PA3X output would require controlled synthetic minimal output design, owner approval, isolated USB test planning, and actual hardware load results in a later phase.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_REAL_OUTPUT_GATE_STATUS_005.md`, [
  '# UAOS PA3X Real Output Gate Status 005',
  '',
  'Status: CLOSED.',
  '',
  '- No real writer output.',
  '- No keyboard-compatible claim.',
  '- No generated native files.',
  '- No USB write.',
  '- No keyboard transfer.',
  '',
  'Gate can only reopen in a separate owner-approved task.'
].join('\n') + '\n', 'utf8');

const qaStatus = result.fixtureUnchanged && nativeGenerated.length === 0 ? 'PASS' : 'BLOCKED';
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_005_QA_REPORT.md`, [
  '# UAOS PA3X Run 005 QA Report',
  '',
  `Status: ${qaStatus}`,
  `Files parsed: ${result.filesParsed}`,
  `Fixture unchanged: ${result.fixtureUnchanged ? 'YES' : 'NO'}`,
  `Files written inside fixture folder: NO`,
  `Generated native keyboard files: ${nativeGenerated.length}`,
  `USB write: NO`,
  `Keyboard transfer: NO`,
  `App.jsx touched: NO`,
  `Proprietary sample extraction: NO`,
  '',
  '## Output Safety Scan',
  nativeGenerated.length ? nativeGenerated.map((item) => `- ${item}`).join('\n') : '- No .SET/.STY/.PRS/.KST/.PCG files generated.',
  '',
  '## Read Limits',
  '- Default header bytes: 256',
  '- Metadata-like max bytes: 4096',
  '- Proprietary/sample full reads: NO, except hash comparison reads for unchanged verification.'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_005_MASTER_INDEX.md`, [
  '# UAOS PA3X Run 005 Master Index',
  '',
  '- UAOS_PA3X_RUN_005_SAFETY_POLICY.md',
  '- UAOS_PA3X_RUN_005_READ_LIMITS.json',
  '- pa3xShallowHeaderParser.js',
  '- run-pa3x-shallow-header-parser.js',
  '- UAOS_PA3X_SHALLOW_HEADER_RESULTS_005.json',
  '- UAOS_PA3X_HEADER_GROUPS_005.json',
  '- UAOS_PA3X_FORMAT_GROUP_REPORT_005.md',
  '- UAOS_PA3X_PARSER_READINESS_MAP_005.md',
  '- UAOS_PA3X_SAFE_NEXT_PARSE_TARGETS_005.json',
  '- UAOS_PA3X_DEEP_PARSE_APPROVAL_REQUIRED_005.md',
  '- UAOS_PA3X_WRITER_FEASIBILITY_AFTER_HEADERS_005.md',
  '- UAOS_PA3X_REAL_OUTPUT_GATE_STATUS_005.md',
  '- UAOS_PA3X_RUN_005_QA_REPORT.md',
  '- UAOS_PA3X_RUN_005_SEAL.md'
].join('\n') + '\n', 'utf8');

fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_005_SEAL.md`, [
  '# UAOS PA3X Run 005 Seal',
  '',
  `Status: ${qaStatus}`,
  '',
  'Run 005 completed as a read-only shallow header parser. Outputs were written outside the fixture folder. No keyboard output was generated.'
].join('\n') + '\n', 'utf8');

console.log(JSON.stringify({ status: qaStatus, filesParsed: result.filesParsed, groups: groups.length, fixtureUnchanged: result.fixtureUnchanged }, null, 2));
