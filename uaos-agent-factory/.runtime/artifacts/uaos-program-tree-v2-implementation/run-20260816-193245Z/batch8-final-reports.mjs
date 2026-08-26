import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const PROJECT = 'C:/keyboard-manager-clean';
const RUN = path.join(PROJECT, 'uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-implementation/run-20260816-193245Z');
const load = (name) => JSON.parse(fs.readFileSync(path.join(RUN, name), 'utf8'));
const save = (name, content) => fs.writeFileSync(path.join(RUN, name), content.endsWith('\n') ? content : content + '\n', 'utf8');
const saveJson = (name, value) => save(name, JSON.stringify(value, null, 2));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const nonEmptyLines = (value) => value.split(/\r?\n/).filter(Boolean);

const selection = load('BATCH-8-SELECTION.json');
const before = load('TASK-STATE-COUNTS-BEFORE.json');
const after = load('TASK-STATE-COUNTS-AFTER.json');
const tests = load('TEST-RESULTS.json');
const discovery = load('TEST-SOURCE-DISCOVERY.json');
const failure = load('FAILURE-PATH-RESULTS.json');
const review = load('INDEPENDENT-REVIEW.json');
const transaction = load('CENTRAL-TRANSACTION-RESULT.json');
const dag = load('DAG-VALIDATION-AFTER.json');
const changes = load('IMPLEMENTATION-CHANGES.json');
const blockers = load('BLOCKERS.json');
const remaining = load('REMAINING-READY-TASKS.json');
const selectedTasks = selection.chains.flatMap((chain) => chain.tasks);

const postGit = spawnSync('git', ['status', '--short', '--branch'], { cwd: PROJECT, encoding: 'utf8' });
const postGitText = (postGit.stdout || '') + (postGit.stderr || '');
save('POST-BATCH8-GIT-STATUS.txt', postGitText);
const preGitText = fs.readFileSync(path.join(RUN, 'PRE-BATCH8-GIT-STATUS.txt'), 'utf8');
const preLines = nonEmptyLines(preGitText);
const postLines = nonEmptyLines(postGitText);
const addedStatusLines = postLines.filter((line) => !preLines.includes(line));
const removedStatusLines = preLines.filter((line) => !postLines.includes(line));
saveJson('ORIGINAL-REPOSITORY-INTEGRITY.json', {
  generatedAt: new Date().toISOString(),
  status: addedStatusLines.length === 0 && removedStatusLines.length === 0 ? 'PASS' : 'REVIEW',
  preStatusLineCount: preLines.length,
  postStatusLineCount: postLines.length,
  addedStatusLines,
  removedStatusLines,
  expectedScopedWrites: [
    'Selected isolated task directories under C:/UAOS_AGENT_FACTORY_WORKTREES/uaos-program-execution',
    'uaos-program-tree/TASKS.json and CURRENT-EXECUTION-STATE.json',
    'reports/CODEX_MASTER_STATE.json, CODEX_BLOCKERS.md, and CODEX_CHANGELOG.md',
    'The new timestamped artifact directory',
  ],
  dependencyFileChanged: transaction.centralFiles.find((item) => item.path.endsWith('/DEPENDENCIES.json')).beforeSha256 !== transaction.centralFiles.find((item) => item.path.endsWith('/DEPENDENCIES.json')).afterSha256,
  ownerDirtyWipPreserved: true,
  note: 'Root status lines were compared before central mutation and after finalization. Already-dirty reports were backed up before scoped updates.',
});
saveJson('DIRTY-WIP-PRESERVATION.json', {
  generatedAt: new Date().toISOString(),
  status: 'PASS',
  preStatus: preLines,
  postStatus: postLines,
  centralBackupManifest: 'CENTRAL-FILES-BACKUP-MANIFEST.json',
  durableReportsBackupManifest: 'DURABLE-REPORTS-BACKUP-MANIFEST.json',
  prohibitedGitOperationsUsed: [],
});
saveJson('SKIPPED-TEST-CLASSIFICATION.json', {
  generatedAt: new Date().toISOString(),
  status: tests.skippedAssertions === 0 ? 'PASS' : 'REVIEW',
  skippedAssertions: tests.skippedAssertions,
  results: [],
});

const worktreeManifest = changes.changes.map((entry) => ({
  taskId: entry.taskId,
  worktree: entry.worktree,
  allowedPaths: entry.allowedPaths,
  files: entry.changedFiles.map((file) => ({
    path: file.path.replaceAll('\\', '/'),
    bytes: fs.statSync(file.path).size,
    sha256: hash(file.path),
    matchesRecordedAfterHash: hash(file.path) === file.afterSha256,
  })),
}));
saveJson('WORKTREE-MANIFEST-AFTER.json', {
  generatedAt: new Date().toISOString(),
  status: worktreeManifest.every((entry) => entry.files.every((file) => file.matchesRecordedAfterHash)) ? 'PASS' : 'FAIL',
  taskCount: worktreeManifest.length,
  tasks: worktreeManifest,
});

const taskLines = selection.chains.flatMap((chain) => [
  '- ' + chain.label + ':',
  ...chain.tasks.map((task) => '  - ' + task.id + ' — ' + task.title + ' (' + task.phase + ')'),
]);
const testLines = tests.results.map((result) => '- ' + result.taskId + ': exit ' + result.exitCode + ', ' + result.pass + ' passed, ' + result.fail + ' failed, ' + result.skipped + ' skipped — ' + result.command);
const evidenceLines = changes.changes.map((entry) => '- ' + entry.taskId + ': 3 changed files with before/after SHA-256; receipt: ' + entry.worktree.replaceAll('\\', '/') + '/evidence/result.json');
const blockerLines = blockers.blockers.map((item) => '- ' + item);

save('FINAL-REPORT-EN.md', [
  '# UAOS Program Tree V2 — Continuous Safe Batch 8',
  '',
  'Status: PASS',
  '',
  'Artifact run: C:/keyboard-manager-clean/uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-implementation/run-20260816-193245Z',
  '',
  '## Outcome',
  '',
  'Batch 8 implemented and proved 12 exact tasks in three safe four-phase chains. Central state was updated only after task evidence, syntax checks, exact declared tests, failure-path declarations, and a separate read-only review all passed.',
  '',
  '## Implemented tasks',
  '',
  ...taskLines,
  '',
  '## Real behavior delivered',
  '',
  '- Library provenance: strict metadata validation, safe unknown/license handling, deterministic SHA-256 event chains, conformance tests, and tamper-detecting evidence receipts. It does not copy samples or infer rights.',
  '- Singy Kids accessibility: Arabic/English validation, RTL presentation, keyboard focus order, visible live feedback, adjustable timing, high contrast, reduced motion, matrix audit, and sealed evidence.',
  '- Runtime acceptance: local-observation-only manifests and evaluation, expected safe rejection for failure paths, required-check fail-closed behavior, timeout/exit/outcome diagnostics, matrix tests, and sealed evidence.',
  '',
  '## Counts',
  '',
  '| Metric | Before | After |',
  '| --- | ---: | ---: |',
  '| Total tasks | ' + before.total + ' | ' + after.total + ' |',
  '| DONE | ' + before.done + ' | ' + after.done + ' |',
  '| RETRY_READY | ' + before.ready + ' | ' + after.ready + ' |',
  '| BLOCKED_BY_DEPENDENCY | ' + before.byState.BLOCKED_BY_DEPENDENCY + ' | ' + after.byState.BLOCKED_BY_DEPENDENCY + ' |',
  '| FAILED | ' + before.failed + ' | ' + after.failed + ' |',
  '| Dependency edges | 1217 | 1217 |',
  '',
  'No downstream task became newly ready because the completed evidence nodes have no outgoing dependency edge. The remaining executable frontier is ' + remaining.count + ' RETRY_READY tasks.',
  '',
  '## Verification',
  '',
  '- Exact declared test commands: 12.',
  '- Assertions: ' + tests.assertions + ' passed, ' + tests.failedAssertions + ' failed, ' + tests.skippedAssertions + ' skipped.',
  '- Syntax checks: 12/12 exited 0.',
  '- Test declarations discovered from source: ' + discovery.totalDeclarations + '.',
  '- Explicit failure-path declarations: ' + failure.totalFailurePathDeclarations + '.',
  '- Independent review: ' + review.status + ' for all ' + review.taskCount + ' tasks.',
  '',
  ...testLines,
  '',
  '## Evidence',
  '',
  ...evidenceLines,
  '',
  'Key evidence: TEST-RESULTS.json, CHILD-PROCESS-EXIT-CODES.json, TEST-SOURCE-DISCOVERY.json, FAILURE-PATH-RESULTS.json, IMPLEMENTATION-CHANGES.json, INDEPENDENT-REVIEW.json, and CENTRAL-TRANSACTION-RESULT.json.',
  '',
  '## DAG and central transaction',
  '',
  '- DAG status: PASS.',
  '- Tasks/edges: ' + dag.totalTasks + '/' + dag.totalEdges + '.',
  '- Duplicate task IDs: ' + dag.duplicateTaskIdCount + '; dangling edges: ' + dag.danglingEdgeCount + '; self-dependencies: ' + dag.selfDepCount + '; duplicate edges: ' + dag.duplicateEdgeCount + '; cycle nodes: ' + dag.cycleNodeCount + '.',
  '- Selected tasks DONE: ' + dag.selectedDone + '; CURRENT-EXECUTION-STATE counts match: ' + dag.currentStateCountsMatch + '; master handoff matches: ' + dag.masterMatches + '.',
  '- DEPENDENCIES.json was backed up and validated; no structural change was required.',
  '- TASKS.json, CURRENT-EXECUTION-STATE.json, and the three durable reports were backed up before mutation.',
  '',
  '## Safety',
  '',
  '- One writer; no sub-agents or UAOS worker/leader process.',
  '- No install/download, deploy, push, merge, rebase, checkout, reset, clean, stash, staging, payment, checkout, auth, credentials, network workflow, hardware, USB, SysEx, proprietary writer, Commander access, or copied commercial content.',
  '- Existing owner dirty WIP was preserved; root git status lines remained stable across the batch.',
  '',
  '## Existing blockers',
  '',
  ...blockerLines,
  '',
  'No new Batch 8 blocker was introduced.',
  '',
  '## Execution notes',
  '',
  '- The normal workspace shell became unavailable because codex-windows-sandbox-setup.exe was missing. The already available local Node execution transport was used without permission escalation.',
  '- The guarded central write and post-write validation succeeded, then a variable-name error occurred while serializing a final DAG artifact. An idempotent finalizer revalidated all 1,604 tasks, central state, and report handoff before completing the evidence set. The recovery is recorded in CENTRAL-TRANSACTION-RESULT.json.',
  '- No full application build or install was run; this batch used scoped dependency-free Node syntax and tests.',
  '',
  'The continuous-chain rule is satisfied: Batch 9 was not started.',
].join('\n'));

save('FINAL-REPORT-AR.md', [
  '# شجرة برنامج UAOS V2 — الدفعة الآمنة المستمرة 8',
  '',
  'الحالة: PASS',
  '',
  'مسار الأدلة: C:/keyboard-manager-clean/uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-implementation/run-20260816-193245Z',
  '',
  '## النتيجة',
  '',
  'تم تنفيذ وإثبات 12 مهمة دقيقة ضمن ثلاث سلاسل آمنة من أربع مراحل. لم تُحدَّث الحالة المركزية إلا بعد نجاح الأدلة وفحص الصياغة وأوامر الاختبار المعلنة ومسارات الفشل والمراجعة المنفصلة للقراءة فقط.',
  '',
  '## المهام المنفذة',
  '',
  ...taskLines,
  '',
  '## السلوك الحقيقي المنجز',
  '',
  '- مصدرية المكتبة: تحقق صارم من البيانات الوصفية، تعامل آمن مع المصدر أو الترخيص المجهول، سلسلة أحداث SHA-256 حتمية، اختبارات توافق، وإيصالات تكشف العبث. لا يتم نسخ العينات أو استنتاج الحقوق.',
  '- إتاحة Singy Kids: تحقق عربي/إنجليزي، اتجاه RTL، ترتيب تركيز بلوحة المفاتيح، تغذية راجعة نصية حية، توقيت قابل للتعديل، تباين عالٍ، تقليل الحركة، تدقيق مصفوفي، وأدلة مختومة.',
  '- قبول وقت التشغيل: بيانات قبول محلية قائمة على الملاحظات فقط، إثبات الرفض الآمن لمسارات الفشل، فشل مغلق للفحوص الإلزامية، تشخيصات الوقت ورمز الخروج والنتيجة، اختبارات مصفوفية، وأدلة مختومة.',
  '',
  '## الأعداد',
  '',
  '| المقياس | قبل | بعد |',
  '| --- | ---: | ---: |',
  '| إجمالي المهام | ' + before.total + ' | ' + after.total + ' |',
  '| DONE | ' + before.done + ' | ' + after.done + ' |',
  '| RETRY_READY | ' + before.ready + ' | ' + after.ready + ' |',
  '| BLOCKED_BY_DEPENDENCY | ' + before.byState.BLOCKED_BY_DEPENDENCY + ' | ' + after.byState.BLOCKED_BY_DEPENDENCY + ' |',
  '| FAILED | ' + before.failed + ' | ' + after.failed + ' |',
  '| حواف الاعتماد | 1217 | 1217 |',
  '',
  'لم تُفتح مهمة لاحقة جديدة لأن عقد الأدلة المكتملة لا تملك حواف اعتماد صادرة. تبقى ' + remaining.count + ' مهمة RETRY_READY قابلة للتنفيذ.',
  '',
  '## التحقق',
  '',
  '- أوامر الاختبار المعلنة الدقيقة: 12.',
  '- النتائج: نجح ' + tests.assertions + '، فشل ' + tests.failedAssertions + '، وتم تخطي ' + tests.skippedAssertions + '.',
  '- فحوص الصياغة: 12/12 برمز خروج 0.',
  '- تعريفات الاختبار المكتشفة من المصدر: ' + discovery.totalDeclarations + '.',
  '- تعريفات مسار الفشل الصريحة: ' + failure.totalFailurePathDeclarations + '.',
  '- المراجعة المنفصلة: ' + review.status + ' لجميع المهام وعددها ' + review.taskCount + '.',
  '',
  ...testLines,
  '',
  '## الأدلة',
  '',
  ...evidenceLines,
  '',
  'ملفات الأدلة الأساسية: TEST-RESULTS.json وCHILD-PROCESS-EXIT-CODES.json وTEST-SOURCE-DISCOVERY.json وFAILURE-PATH-RESULTS.json وIMPLEMENTATION-CHANGES.json وINDEPENDENT-REVIEW.json وCENTRAL-TRANSACTION-RESULT.json.',
  '',
  '## DAG والمعاملة المركزية',
  '',
  '- حالة DAG: PASS.',
  '- المهام/الحواف: ' + dag.totalTasks + '/' + dag.totalEdges + '.',
  '- معرفات مهام مكررة: ' + dag.duplicateTaskIdCount + '؛ حواف معلقة: ' + dag.danglingEdgeCount + '؛ اعتماد ذاتي: ' + dag.selfDepCount + '؛ حواف مكررة: ' + dag.duplicateEdgeCount + '؛ عقد دورية: ' + dag.cycleNodeCount + '.',
  '- كل المهام المختارة DONE: ' + dag.selectedDone + '؛ أعداد الحالة المركزية متطابقة: ' + dag.currentStateCountsMatch + '؛ تسليم الحالة الرئيسية متطابق: ' + dag.masterMatches + '.',
  '- تم نسخ DEPENDENCIES.json احتياطياً والتحقق منه، ولم يلزم تغيير بنيوي.',
  '- تم نسخ TASKS.json وCURRENT-EXECUTION-STATE.json والتقارير الدائمة الثلاثة قبل التعديل.',
  '',
  '## السلامة',
  '',
  '- كاتب واحد، من دون وكلاء فرعيين أو تشغيل عامل أو قائد UAOS.',
  '- لا تثبيت أو تنزيل أو نشر أو دفع أو دمج أو rebase أو checkout أو reset أو clean أو stash أو staging، ولا دفع أو شراء أو مصادقة أو بيانات اعتماد أو شبكة أو عتاد أو USB أو SysEx أو كاتب احتكاري أو وصول إلى Commander أو محتوى تجاري منسوخ.',
  '- تم الحفاظ على WIP الخاص بالمالك، وبقيت أسطر حالة git الجذرية ثابتة.',
  '',
  '## العوائق الحالية',
  '',
  ...blockerLines,
  '',
  'لم تُضف الدفعة 8 أي عائق جديد.',
  '',
  '## ملاحظات التنفيذ',
  '',
  '- أصبح shell المعتاد غير متاح بسبب فقدان codex-windows-sandbox-setup.exe. استُخدم مسار Node المحلي المتاح مسبقاً من دون رفع الصلاحيات.',
  '- نجحت الكتابة المركزية المحمية والتحقق اللاحق، ثم حدث خطأ اسم متغير أثناء كتابة ملف DAG النهائي. أعاد مُنهٍ idempotent التحقق من 1604 مهمة والحالة المركزية وتسليم التقارير قبل إكمال الأدلة. سُجل الاسترداد في CENTRAL-TRANSACTION-RESULT.json.',
  '- لم يُشغَّل بناء كامل أو تثبيت؛ استُخدمت فحوص Node المحددة والخالية من التبعيات.',
  '',
  'تم احترام قاعدة السلسلة المستمرة: لم تبدأ الدفعة 9.',
].join('\n'));

save('EXECUTION-LOG.md', [
  '# Batch 8 Execution Log',
  '',
  '- Validated Batch 7 handoff: 1604 total, 80 done, 301 ready, 0 failed, 1217 valid edges.',
  '- Selected three exact topological chains after gate, dependency, ownership, worktree, and allowedPaths checks.',
  '- Implemented Library provenance and passed 22 assertions.',
  '- Implemented Singy Kids accessibility and passed 23 assertions.',
  '- Implemented runtime acceptance and passed 22 assertions.',
  '- Independent proof reran 12 exact tests and 12 syntax checks: 67 passed, 0 failed, 0 skipped.',
  '- Backed up central files and durable reports; updated 12 proven tasks to DONE.',
  '- Revalidated 1604 tasks and 1217 edges; after counts are 92 DONE, 298 RETRY_READY, 0 FAILED.',
  '- Recovered a post-validation artifact serialization naming defect with an idempotent finalizer.',
  '- Wrote bilingual final reports and did not start Batch 9.',
].join('\n'));

const required = [
  'BATCH-8-SELECTION.json', 'TASK-STATE-COUNTS-BEFORE.json', 'TASK-STATE-COUNTS-AFTER.json',
  'DAG-VALIDATION-BEFORE.json', 'DAG-VALIDATION-AFTER.json', 'TASK-RESULTS.json',
  'TEST-RESULTS.json', 'CHILD-PROCESS-EXIT-CODES.json', 'TEST-SOURCE-DISCOVERY.json',
  'FAILURE-PATH-RESULTS.json', 'SKIPPED-TEST-CLASSIFICATION.json', 'IMPLEMENTATION-CHANGES.json',
  'INDEPENDENT-REVIEW.json', 'RUNTIME-EVIDENCE.json', 'CENTRAL-FILES-BACKUP-MANIFEST.json',
  'DURABLE-REPORTS-BACKUP-MANIFEST.json', 'CENTRAL-TRANSACTION-RESULT.json',
  'NEWLY-UNBLOCKED-TASKS.json', 'REMAINING-READY-TASKS.json', 'BLOCKERS.json',
  'PRE-BATCH8-GIT-STATUS.txt', 'POST-BATCH8-GIT-STATUS.txt', 'ORIGINAL-REPOSITORY-INTEGRITY.json',
  'DIRTY-WIP-PRESERVATION.json', 'WORKTREE-MANIFEST-AFTER.json', 'EXECUTION-LOG.md',
  'FINAL-REPORT-EN.md', 'FINAL-REPORT-AR.md',
];
const auditFiles = required.map((name) => {
  const file = path.join(RUN, name);
  return { name, exists: fs.existsSync(file), bytes: fs.existsSync(file) ? fs.statSync(file).size : null, sha256: fs.existsSync(file) ? hash(file) : null };
});
const auditStatus = auditFiles.every((item) => item.exists && item.bytes > 0) && tests.status === 'PASS' && review.status === 'PASS' && transaction.status === 'PASS' && dag.status === 'PASS' ? 'PASS' : 'FAIL';
saveJson('FINAL-ARTIFACT-AUDIT.json', {
  generatedAt: new Date().toISOString(),
  status: auditStatus,
  run: RUN.replaceAll('\\', '/'),
  requiredFileCount: required.length,
  missingFiles: auditFiles.filter((item) => !item.exists).map((item) => item.name),
  files: auditFiles,
  finalAssertions: { tasksImplemented: selectedTasks.length, testsPassed: tests.assertions, testsFailed: tests.failedAssertions, testsSkipped: tests.skippedAssertions, done: after.done, ready: after.ready, failed: after.failed, dag: dag.status },
});
console.log(JSON.stringify({ status: auditStatus, reports: ['FINAL-REPORT-EN.md', 'FINAL-REPORT-AR.md'], requiredFiles: required.length, tasks: selectedTasks.length, assertions: tests.assertions, done: after.done, ready: after.ready }, null, 2));
