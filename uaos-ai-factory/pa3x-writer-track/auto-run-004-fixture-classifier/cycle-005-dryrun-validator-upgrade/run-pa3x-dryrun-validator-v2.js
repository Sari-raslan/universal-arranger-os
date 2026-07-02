import fs from 'node:fs';
import { validateDryrunPackage } from './pa3xDryrunPackageValidatorV2.js';

const packageDir = 'E:/keyboard-manager-clean/uaos-ai-factory/pa3x-writer-track/run-001-output/PA3X_ORIENTAL_TEST_PACKAGE_001';
const result = validateDryrunPackage(packageDir);
fs.writeFileSync(new URL('./UAOS_PA3X_DRYRUN_VALIDATOR_V2_RESULTS_004.json', import.meta.url), JSON.stringify(result, null, 2) + '\n', 'utf8');
const report = [
  '# UAOS PA3X Dryrun Validator V2 Report 004',
  '',
  `Status: ${result.status}`,
  `Files checked: ${result.filesChecked}`,
  `Generated native keyboard files: ${result.generatedNativeFiles.length}`,
  `Risky phrase hits: ${result.riskyPhraseHits.length}`,
  `Package manifest present: ${result.packageManifestPresent ? 'yes' : 'no'}`,
  '',
  '## Scope',
  'This validator checks dry-run/spec/test artifacts only. It does not create keyboard output.'
].join('\n');
fs.writeFileSync(new URL('./UAOS_PA3X_DRYRUN_VALIDATOR_V2_REPORT_004.md', import.meta.url), report + '\n', 'utf8');
console.log(`validator ${result.status}`);
