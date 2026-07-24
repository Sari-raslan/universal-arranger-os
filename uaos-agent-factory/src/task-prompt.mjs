import fs from 'node:fs';
import path from 'node:path';
import { nowIso } from './lib.mjs';

const SAFETY = `
GLOBAL SAFETY (NON-NEGOTIABLE):
- Never run remote publish actions (no push, no deploy, no npm publish, no payment activation)
- No USB, SysEx, KORG writer, or proprietary arranger binary outputs (.STY/.SET/.PRS/.PRF/.KST)
- Never rewrite owner history (no reset/clean/stash of owner trees)
- Never stage everything — exact paths only (never add-dot / add-all)
- No fabricated PASS
- Use D: for TEMP/TMP/large builds; C is low on space
- Offline product work; no accounts/cloud/telemetry
`.trim();

export function buildTaskPrompt(task, { scout = null, reviewFeedback = null, worktreePath = '' } = {}) {
  const cmds = task.commands || {};
  const lines = [
    `# UAOS Factory Task ${task.id}`,
    '',
    `Lane: ${task.lane}`,
    `Title: ${task.title}`,
    `Worktree: ${worktreePath}`,
    `Priority: ${task.priority ?? ''}`,
    '',
    '## Objective',
    task.objective || task.title || '(see title)',
    task.description || '',
    '',
    '## Allowed paths',
    ...(task.allowedPaths || ['**/*']).map((p) => `- ${p}`),
    '',
    '## Forbidden paths',
    ...(task.forbiddenPaths || ['node_modules/**', 'release/**', 'dist/**']).map((p) => `- ${p}`),
    '',
    '## Required commands after implementation',
    '### preflight',
    ...(cmds.preflight || []).map((c) => `- \`${c}\``),
    '### tests',
    ...(cmds.tests || []).map((c) => `- \`${c}\``),
    '### build',
    ...(cmds.build || []).map((c) => `- \`${c}\``),
    '### acceptance',
    ...(cmds.acceptance || []).map((c) => `- \`${c}\``),
    '',
    '## Expected artifacts',
    ...(task.artifactsExpected || []).map((a) => `- ${a}`),
    '',
    '## Deliverables',
    '1. Implement the smallest honest change in the worktree.',
    '2. Run the listed tests; leave raw logs.',
    `3. Write RESULT.json at the artifact/evidence path with status PASS or FAIL, filesChanged[], testResults[].`,
    '4. Do not package Setup/Portable unless the task explicitly requires it.',
    '',
    SAFETY
  ];

  if (scout) {
    lines.push('', '## Scout report', JSON.stringify(scout, null, 2));
  }
  if (reviewFeedback) {
    lines.push('', '## Previous review feedback (repair cycle)', JSON.stringify(reviewFeedback, null, 2));
  }

  return lines.filter((l) => l !== undefined).join('\n');
}

export function writePromptFiles(dir, task, extras = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const prompt = buildTaskPrompt(task, extras);
  const promptPath = path.join(dir, 'PROMPT.md');
  const taskPath = path.join(dir, 'TASK.json');
  fs.writeFileSync(promptPath, prompt, 'utf8');
  fs.writeFileSync(taskPath, `${JSON.stringify({ ...task, generatedAt: nowIso() }, null, 2)}\n`, 'utf8');
  return { promptPath, taskPath, prompt };
}
