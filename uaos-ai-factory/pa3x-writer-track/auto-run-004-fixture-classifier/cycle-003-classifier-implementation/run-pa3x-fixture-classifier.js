import fs from 'node:fs';
import { classifyFixture } from './pa3xFixtureClassifier.js';

const source = "E:\\keyboard-manager-clean\\uaos-ai-factory\\pa3x-writer-track\\run-003-fixture-scanner\\UAOS_PA3X_FIXTURE_FILE_INDEX_003.json";
const resultPath = new URL('./UAOS_PA3X_CLASSIFIER_RESULTS_004.json', import.meta.url);
const reportPath = new URL('./UAOS_PA3X_CLASSIFIER_REPORT_004.md', import.meta.url);
const result = classifyFixture(source);
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
const lines = [
  '# UAOS PA3X Classifier Report 004',
  '',
  `Files classified: ${result.filesClassified}`,
  '',
  '## Role Summary',
  ...Object.entries(result.roleSummary).map(([role, count]) => `- ${role}: ${count}`),
  '',
  '## Safety',
  '- Source: Run 003 metadata only.',
  '- Fixture files were not opened or modified by this classifier.',
  '- No keyboard output was generated.'
];
fs.writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');
console.log(`classified ${result.filesClassified} files`);
