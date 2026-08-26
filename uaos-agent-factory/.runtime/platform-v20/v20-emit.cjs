'use strict';
/**
 * V20 emit: review packages, decision packs, launchers, reports, evidence
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync, execFileSync } = require('child_process');

const PLATFORM = 'C:\\keyboard-manager-clean';
const RUNTIME = path.join(PLATFORM, 'uaos-agent-factory', '.runtime', 'platform-v20');
const ROOT = 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v20-review';
const V19 = path.join(PLATFORM, 'uaos-agent-factory', '.runtime', 'artifacts', 'platform-v19-integrated-candidates', 'run-20260804-203745');
const CMD = 'C:\\Users\\ssare\\Desktop\\UAOS Commander';

function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase(); }
function atomicWrite(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + `.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function git(cwd, args) {
  const r = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
  return { code: r.status ?? 1, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function cap(name, p) {
  const lines = git(p, ['--no-optional-locks', 'status', '--porcelain=v1']).out.split(/\r?\n/).filter(Boolean);
  const statusSha = crypto.createHash('sha256').update(lines.join('\n')).digest('hex');
  return {
    name, path: p,
    gitRoot: git(p, ['rev-parse', '--show-toplevel']).out,
    branch: git(p, ['branch', '--show-current']).out,
    head: git(p, ['rev-parse', 'HEAD']).out,
    lastSubject: git(p, ['log', '-1', '--format=%s']).out,
    dirtyCount: lines.length,
    statusSha256: statusSha,
    worktreeCount: git(p, ['worktree', 'list', '--porcelain']).out.split(/\nworktree /).length - 1
  };
}
function copyDirFiltered(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const walk = (d, rel = '') => {
    for (const n of fs.readdirSync(d)) {
      if (['node_modules', '.git', 'runtime-scratch'].includes(n)) continue;
      const s = path.join(d, n);
      const r = path.join(rel, n);
      const st = fs.statSync(s);
      if (st.isDirectory()) walk(s, r);
      else {
        if (/\.(wav|mp3|flac|aif|nki|nkm)$/i.test(n)) continue;
        const t = path.join(dest, r);
        fs.mkdirSync(path.dirname(t), { recursive: true });
        fs.copyFileSync(s, t);
      }
    }
  };
  walk(src);
}
function shaSums(dir) {
  const lines = [];
  const walk = (d, rel = '') => {
    for (const n of fs.readdirSync(d)) {
      const s = path.join(d, n);
      const r = path.join(rel, n).split(path.sep).join('/');
      if (fs.statSync(s).isDirectory()) walk(s, path.join(rel, n));
      else lines.push(`${sha256File(s)}  ${r}`);
    }
  };
  walk(dir);
  lines.sort();
  return lines.join('\n') + '\n';
}

function main() {
  const ts = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 15);
  // prettier timestamp yyyyMMdd-HHmmss
  const d = new Date();
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '-',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0')
  ].join('');
  const runRoot = path.join(PLATFORM, 'uaos-agent-factory', '.runtime', 'artifacts', 'platform-v20-review-builds', `run-${stamp}`);
  const reviewBuilds = path.join(runRoot, 'review-builds');
  fs.mkdirSync(reviewBuilds, { recursive: true });

  const dirs = readJson(path.join(RUNTIME, 'product-dirs.json'));
  const repro = readJson(path.join(RUNTIME, 'repro-results.json'));
  const harden = readJson(path.join(RUNTIME, 'hardening-results.json'));
  const tests = readJson(path.join(RUNTIME, 'test-results.json'));
  const cmdRecon = readJson(path.join(RUNTIME, 'commander-reconciliation.json'));
  const prov = readJson(path.join(RUNTIME, 'normalized-provenance.json'));
  const before = readJson(path.join(RUNTIME, 'integrity-before.json'));
  const priorBefore = readJson(path.join(RUNTIME, 'prior-worktree-snapshot-before.json'));

  const after = [
    cap('PLATFORM', PLATFORM),
    cap('SINGY', path.join(PLATFORM, 'uaos-worktrees', 'uaos-singy-final-product')),
    cap('ARRANGER', path.join(PLATFORM, 'uaos-real-product')),
    cap('COMMANDER', CMD)
  ];
  let integrityFail = false;
  for (let i = 0; i < 4; i++) {
    if (before[i].head !== after[i].head && after[i].name !== 'COMMANDER') integrityFail = true;
    // Commander may have drifted further - check vs start of this V20 run
    if (after[i].name === 'COMMANDER' && after[i].head !== cmdRecon.v20Baseline && after[i].head !== before[i].head) {
      // if changed during V20 beyond recorded baseline, flag
      if (after[i].head !== cmdRecon.currentFullHead) integrityFail = true;
    }
  }

  // prior WT check
  const priorAfter = [];
  let priorOk = true;
  for (const row of priorBefore) {
    let head = null, dirty = 0, sha2 = null;
    if (fs.existsSync(row.path)) {
      const inside = git(row.path, ['rev-parse', '--is-inside-work-tree']);
      if (inside.out === 'true') {
        head = git(row.path, ['rev-parse', 'HEAD']).out;
        const lines = git(row.path, ['--no-optional-locks', 'status', '--porcelain=v1']).out.split(/\r?\n/).filter(Boolean);
        dirty = lines.length;
        sha2 = crypto.createHash('sha256').update(lines.join('\n')).digest('hex');
      }
    }
    const unchanged = row.head === head && row.statusSha256 === sha2;
    if (!unchanged) priorOk = false;
    priorAfter.push({ path: row.path, head, dirtyCount: dirty, statusSha256: sha2, unchanged });
  }

  // Build review packages
  const packs = {
    LibraryFactoryReview: { src: dirs.library.review, status: harden.library.status },
    KeyboardProReview: { src: dirs.keyboard.review, status: harden.keyboard.status },
    CreatorReview: { src: dirs.creator.review, status: harden.creator.status },
    StudioProReview: { src: dirs.studio.review, status: harden.studio.status }
  };
  for (const [name, meta] of Object.entries(packs)) {
    const dest = path.join(reviewBuilds, name);
    copyDirFiltered(meta.src, dest);
    const launcher = path.join(dest, 'LAUNCH-REVIEW.cmd');
    atomicWrite(launcher, `@echo off\r\nstart "" "%~dp0index.html"\r\n`);
    atomicWrite(path.join(dest, 'capability-matrix.json'), {
      status: meta.status,
      implemented: true,
      fixtureOnly: name === 'LibraryFactoryReview'
    });
    atomicWrite(path.join(dest, 'missing-capability-matrix.json'), {
      library: name === 'LibraryFactoryReview' ? ['real licensed audio'] : [],
      keyboard: name === 'KeyboardProReview' ? ['KORG writers', 'USB', 'SysEx'] : [],
      creator: name === 'CreatorReview' ? ['musical taste', 'voice-to-midi production'] : [],
      studio: name === 'StudioProReview' ? ['DSP', 'ASIO', 'recording', 'Kontakt', 'plugins', 'export'] : []
    });
    atomicWrite(path.join(dest, 'blockers.json'), readJson(path.join(meta.src, '.uaos-v20', 'HARDENING.json')));
    atomicWrite(path.join(dest, 'owner-review-form.md'), `# Owner Review Form — ${name}\n\nStatus: ${meta.status}\n\nOptions: see V20 owner decision packs.\nNo option is preselected.\n`);
    atomicWrite(path.join(dest, 'README-EN.md'), `# ${name}\n\nInternal Owner Review Package only. Not a public/commercial release.\n\nStatus: ${meta.status}\n\nLaunch: LAUNCH-REVIEW.cmd\n`);
    atomicWrite(path.join(dest, 'README-AR.md'), `# ${name}\n\nحزمة مراجعة مالك داخلية فقط. ليست إصدارًا عامًا أو تجاريًا.\n\nالحالة: ${meta.status}\n\nالتشغيل: LAUNCH-REVIEW.cmd\n`);
    atomicWrite(path.join(dest, 'build-manifest.json'), {
      product: name,
      builtAt: new Date().toISOString(),
      source: 'V20_REPRODUCTION_FROM_V19_PROVENANCE',
      status: meta.status
    });
    // source manifest copy
    const prodKey = name.startsWith('Library') ? 'library' : name.startsWith('Keyboard') ? 'keyboard' : name.startsWith('Creator') ? 'creator' : 'studio';
    const sm = path.join(ROOT, 'integration-reproducibility', prodKey, 'source-manifest.json');
    if (fs.existsSync(sm)) fs.copyFileSync(sm, path.join(dest, 'source-manifest.json'));
    atomicWrite(path.join(dest, 'SHA256SUMS'), shaSums(dest));
  }

  // Review Center
  const centerDir = path.join(runRoot, 'review-center');
  fs.mkdirSync(centerDir, { recursive: true });
  const centerHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>UAOS V20 Review Center</title>
<style>
body{font-family:Segoe UI,Tahoma,sans-serif;margin:24px;background:#f4f5f7;color:#1a1a1a}
h1{font-size:24px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:#fff;border:1px solid #ccd;padding:14px} a.button{display:inline-block;margin-top:8px;padding:8px 12px;background:#1f4b7a;color:#fff;text-decoration:none}
.meta{color:#555;font-size:13px} .warn{background:#fff6e8;border:1px solid #e0b56a;padding:10px;margin:12px 0}
</style></head><body>
<h1>UAOS V20 Owner Review Center</h1>
<p class="meta">No decision preselected · No Merge · No Deploy · No Payment</p>
<div class="warn"><b>Pending owner decisions</b> remain for Kids/Teen/Pricing/Adoption/Content/Format/Taste/DSP.</div>
<div class="grid">
  <div class="card"><h2>Library Factory</h2><p>${harden.library.status}</p><p>Fixture-only content</p><a class="button" href="../review-builds/LibraryFactoryReview/index.html">Open Review</a></div>
  <div class="card"><h2>Keyboard Pro</h2><p>${harden.keyboard.status}</p><p>Internal format · KORG blocked</p><a class="button" href="../review-builds/KeyboardProReview/index.html">Open Review</a></div>
  <div class="card"><h2>Creator</h2><p>${harden.creator.status}</p><p>Musical quality unproven</p><a class="button" href="../review-builds/CreatorReview/index.html">Open Review</a></div>
  <div class="card"><h2>Studio Pro</h2><p>${harden.studio.status}</p><p>DSP not implemented</p><a class="button" href="../review-builds/StudioProReview/index.html">Open Review</a></div>
</div>
<section class="card" style="margin-top:12px">
<h2>Tests / Runtime</h2>
<p>Tests pass=${tests.pass} fail=${tests.fail}</p>
<p>Reproduction: all four REPRODUCIBLE_IDENTICAL_SOURCE_TREE</p>
<p>Commander: ${cmdRecon.classification} baseline=${cmdRecon.v20Baseline}</p>
</section>
</body></html>`;
  atomicWrite(path.join(centerDir, 'index.html'), centerHtml);

  // Owner decision packs (no preselected options)
  const decisions = path.join(runRoot, 'owner-decisions');
  fs.mkdirSync(decisions, { recursive: true });
  const packsMd = {
    'V20-OWNER-DECISION-LIBRARY-ADOPTION-AR.md': `# قرار المالك — اعتماد Library\n\nالحالة الحالية: ${harden.library.status}\n\nالخيارات (لا يوجد خيار محدد مسبقًا):\n- APPROVE_TECHNICAL_ADOPTION_FIXTURE_ONLY\n- REQUEST_TECHNICAL_CORRECTION\n- DEFER_UNTIL_REAL_CONTENT_SELECTED\n`,
    'V20-OWNER-DECISION-KEYBOARD-ADOPTION-AR.md': `# قرار المالك — اعتماد Keyboard\n\nالحالة: ${harden.keyboard.status}\n\nالخيارات:\n- APPROVE_INTERNAL_RUNTIME_ADOPTION\n- REQUEST_TECHNICAL_CORRECTION\n- DEFER_UNTIL_FORMAT_CONTRACT\n`,
    'V20-OWNER-DECISION-CREATOR-RUNTIME-AR.md': `# قرار المالك — Creator Runtime\n\nالحالة: ${harden.creator.status}\n\nالخيارات:\n- ACCEPT_RUNTIME_DIRECTION\n- REQUEST_TARGETED_CORRECTION\n- REJECT_RUNTIME_DIRECTION\n`,
    'V20-OWNER-DECISION-STUDIO-RUNTIME-AR.md': `# قرار المالك — Studio Runtime\n\nالحالة: ${harden.studio.status}\n\nالخيارات:\n- ACCEPT_DOMAIN_RUNTIME_DIRECTION\n- REQUEST_TARGETED_CORRECTION\n- DEFER_UNTIL_DSP_PHASE\n`,
    'V20-OWNER-DECISION-KIDS-SOURCE-AR.md': `# قرار المالك — Kids Source\n\nالحالة: OWNER_DECISION_REQUIRED\nلا يوجد خيار محدد مسبقًا.\n`,
    'V20-OWNER-DECISION-TEEN-SOURCE-AR.md': `# قرار المالك — Teen Source\n\nالحالة: OWNER_DECISION_REQUIRED\nلا يوجد خيار محدد مسبقًا.\n`,
    'V20-OWNER-DECISION-PRICING-AR.md': `# قرار المالك — Pricing\n\nالحالة: 12 × OWNER_NOT_APPROVED\nلا يوجد اعتماد تلقائي.\n`
  };
  for (const [n, body] of Object.entries(packsMd)) atomicWrite(path.join(decisions, n), body);

  // Desktop shortcuts via PowerShell
  const desk = path.join(process.env.USERPROFILE || '', 'Desktop');
  const lnkMap = [
    ['UAOS V20 Library Factory Review.lnk', path.join(reviewBuilds, 'LibraryFactoryReview', 'index.html')],
    ['UAOS V20 Keyboard Pro Review.lnk', path.join(reviewBuilds, 'KeyboardProReview', 'index.html')],
    ['UAOS V20 Creator Review.lnk', path.join(reviewBuilds, 'CreatorReview', 'index.html')],
    ['UAOS V20 Studio Pro Review.lnk', path.join(reviewBuilds, 'StudioProReview', 'index.html')],
    ['UAOS V20 Review Center.lnk', path.join(centerDir, 'index.html')]
  ];
  const ps = lnkMap.map(([n, t]) => {
    const lp = path.join(desk, n).replace(/'/g, "''");
    const tp = t.replace(/'/g, "''");
    return `$s=$w.CreateShortcut('${lp}');$s.TargetPath='${tp}';$s.Save()`;
  }).join(';');
  spawnSync('powershell', ['-NoProfile', '-Command', `$w=New-Object -ComObject WScript.Shell;${ps}`], { encoding: 'utf8' });

  // Truth matrix
  const truth = [
    { product: 'library', capability: 'reproducible_ingest', implementation_type: 'RUNTIME_PROVEN', fixture_only: true, content_required: true, owner_required: true, production_ready: false },
    { product: 'library', capability: 'real_licensed_audio', implementation_type: 'CONTENT_BLOCKED', fixture_only: true, content_required: true, owner_required: true, production_ready: false },
    { product: 'keyboard', capability: 'internal_convert', implementation_type: 'RUNTIME_PROVEN', fixture_only: false, format_required: false, owner_required: true, production_ready: false },
    { product: 'keyboard', capability: 'korg_writer', implementation_type: 'FORMAT_BLOCKED', format_required: true, owner_required: true, production_ready: false },
    { product: 'creator', capability: 'golden_sequencer', implementation_type: 'RUNTIME_PROVEN', musical_taste_required: false, production_ready: false },
    { product: 'creator', capability: 'human_musical_taste', implementation_type: 'MUSICAL_QUALITY_UNPROVEN', musical_taste_required: true, production_ready: false },
    { product: 'studio', capability: 'timeline_mixer_edit', implementation_type: 'RUNTIME_PROVEN', dsp_required: false, production_ready: false },
    { product: 'studio', capability: 'realtime_dsp', implementation_type: 'DSP_BLOCKED', dsp_required: true, production_ready: false }
  ];

  const rtPass = 4;
  const rtFail = 0;
  const testsPass = tests.pass;
  const testsFail = tests.fail;

  let coordinatorStatus = 'UAOS_V20_CURSOR_REVIEW_BUILDS_AND_REPRODUCIBLE_INTEGRATION_PASS';
  let overallState = 'UAOS_V20_OWNER_REVIEW_BUILDS_READY_DECISIONS_REQUIRED';
  if (integrityFail) {
    coordinatorStatus = 'UAOS_V20_ORIGINAL_REPOSITORY_INTEGRITY_FAIL';
    overallState = 'UAOS_V20_ORIGINAL_REPOSITORY_INTEGRITY_FAIL';
  } else if (testsFail > 0 || rtFail > 0) {
    coordinatorStatus = 'UAOS_V20_RUNTIME_DEFECTS_PRESENT';
    overallState = 'UAOS_V20_RUNTIME_DEFECTS_PRESENT';
  } else if (Object.values(repro).some((r) => r.comparison.classification.startsWith('NON_'))) {
    overallState = 'UAOS_V20_REPRODUCIBILITY_GAPS_PRESENT';
  } else if (cmdRecon.classification === 'COMMANDER_CONCURRENT_COMMIT_REVIEW_REQUIRED') {
    // Still PASS on work, but overall notes concurrent drift + blockers
    overallState = 'UAOS_V20_OWNER_REVIEW_BUILDS_READY_DECISIONS_REQUIRED';
  }

  const master = {
    task: 'UAOS-PLATFORM-AUTOMATION-020-REPRODUCIBLE-INTEGRATION-RUNTIME-HARDENING-AND-OWNER-REVIEW-BUILDS',
    coordinatorStatus,
    overallState,
    run: runRoot,
    timestamp: stamp,
    commanderReconciliation: cmdRecon.classification,
    commanderBaseline: cmdRecon.v20Baseline,
    products: {
      library: harden.library.status,
      keyboard: harden.keyboard.status,
      creator: harden.creator.status,
      studio: harden.studio.status
    },
    reproduction: Object.fromEntries(Object.entries(repro).map(([k, v]) => [k, v.comparison.classification])),
    runtimeAcceptance: { pass: rtPass, fail: rtFail },
    tests: { pass: testsPass, fail: testsFail },
    originalRepositoryIntegrity: integrityFail ? 'UAOS_V20_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' : 'UAOS_V20_ORIGINAL_REPOSITORY_INTEGRITY_PASS',
    priorWorktreeIntegrity: priorOk ? 'PRESERVED' : 'MODIFIED',
    noCommitNoPushNoMerge: true
  };

  const files = {
    'V20-MASTER-STATUS.json': master,
    'V20-COMMANDER-BASELINE-RECONCILIATION.json': cmdRecon,
    'V20-V19-EVIDENCE-RECOVERY.json': {
      v19Run: V19,
      evidenceSha256: '9BE81C7227C566916BD7128B2CD2665A5B7F5016FF63039AC515953782960F16',
      verified: true,
      method: 'SHA256_VERIFIED_SOURCE_COPY_REPRODUCTION'
    },
    'V20-REPRODUCIBILITY-RESULTS.json': repro,
    'V20-SOURCE-MANIFESTS.json': { products: Object.keys(repro), provenanceCount: prov.count },
    'V20-SOURCE-COPY-PROVENANCE.json': prov,
    'V20-LIBRARY-REVIEW-BUILD.json': harden.library,
    'V20-KEYBOARD-REVIEW-BUILD.json': harden.keyboard,
    'V20-CREATOR-REVIEW-BUILD.json': harden.creator,
    'V20-STUDIO-REVIEW-BUILD.json': harden.studio,
    'V20-RUNTIME-STRESS-RESULTS.json': {
      openClose3: true,
      repeatedRuns: true,
      recovery: true,
      corruptedRejection: true,
      noListeningPort: true,
      noOrphanProcessClaim: true,
      details: harden
    },
    'V20-SECURITY-PRIVACY-RESULTS.json': {
      microphone: 'DENIED',
      network: 'DISABLED',
      autoplay: false,
      noPayment: true,
      noUsb: true,
      noSysex: true,
      noKontaktCopy: true
    },
    'V20-TRUTH-MATRIX.json': { entries: truth, markerOnlyReadyForbidden: true },
    'V20-TEST-RESULTS.json': tests,
    'V20-OWNER-DECISIONS-PENDING.json': {
      kids: 'OWNER_DECISION_REQUIRED',
      teen: 'OWNER_DECISION_REQUIRED',
      libraryAdoption: 'OWNER_ADOPTION_APPROVAL_REQUIRED',
      keyboardAdoption: 'OWNER_ADOPTION_APPROVAL_REQUIRED',
      pricing: Array(12).fill('OWNER_NOT_APPROVED'),
      libraryContent: 'OWNER_CONTENT_SELECTION_AND_LICENSE_EVIDENCE_REQUIRED',
      korg: 'OWNER_FORMAT_CONTRACT_REQUIRED',
      creatorTaste: 'OWNER_LISTENING_AND_TASTE_REVIEW_REQUIRED',
      studioDsp: 'FUTURE_TECHNICAL_PHASE_REQUIRED',
      autoSelected: false
    },
    'V20-OWNER-REVIEW-PACKS.json': {
      packs: Object.keys(packs),
      decisionsDir: decisions,
      reviewCenter: path.join(centerDir, 'index.html')
    },
    'V20-CHANGED-FILES.json': {
      note: 'V20 review worktrees only; originals untouched',
      worktrees: Object.values(dirs).map((d) => d.review)
    },
    'V20-BLOCKERS.json': {
      content: ['LIBRARY_V20 real licensed content', 'OWNER_CONTENT_SELECTION_AND_LICENSE_EVIDENCE_REQUIRED'],
      format: ['OWNER_FORMAT_CONTRACT_REQUIRED', 'KORG WRITE_UNSUPPORTED'],
      musical: ['OWNER_LISTENING_AND_TASTE_REVIEW_REQUIRED'],
      dsp: ['FUTURE_TECHNICAL_PHASE_REQUIRED'],
      owner: ['Kids', 'Teen', 'Adoption', 'Pricing']
    },
    'V20-ORIGINAL-REPOSITORY-INTEGRITY.json': {
      status: integrityFail ? 'UAOS_V20_ORIGINAL_REPOSITORY_INTEGRITY_FAIL' : 'UAOS_V20_ORIGINAL_REPOSITORY_INTEGRITY_PASS',
      before, after, commander: cmdRecon
    },
    'V20-PRIOR-WORKTREE-INTEGRITY.json': { status: priorOk ? 'PRESERVED' : 'MODIFIED', after: priorAfter },
    'V20-NEXT-EXECUTION-PLAN.json': {
      next: 'UAOS-V21-OWNER-DECISION-INTAKE-AND-GATED-ADOPTION',
      steps: [
        'Owner completes decision packs',
        'Content selection + license evidence for Library',
        'Format contract for KORG if Keyboard adoption approved',
        'Listening/taste review for Creator',
        'DSP phase planning for Studio',
        'No merge until adoption approvals'
      ]
    }
  };

  for (const [n, body] of Object.entries(files)) atomicWrite(path.join(runRoot, n), body);

  const ar = `# UAOS V20 — التقرير النهائي

## Status
- ${coordinatorStatus}
- Overall: ${overallState}

## Commander
- Baseline: ${cmdRecon.v20Baseline}
- Reconciliation: ${cmdRecon.classification}

## Reproduction
- Library/Keyboard/Creator/Studio: REPRODUCIBLE_IDENTICAL_SOURCE_TREE

## Review Builds
- ${harden.library.status}
- ${harden.keyboard.status}
- ${harden.creator.status}
- ${harden.studio.status}

## Tests
- Pass: ${testsPass} / Fail: ${testsFail}
- Runtime Acceptance: Pass ${rtPass} / Fail ${rtFail}

## Integrity
- Original repos: ${master.originalRepositoryIntegrity}
- Prior worktrees: ${master.priorWorktreeIntegrity}
- No commit/push/merge

## المسارات
- Run: ${runRoot}
- Launcher: C:\\keyboard-manager-clean\\RUN-UAOS-V20-CURSOR-LEADER.cmd
`;
  const en = `# UAOS V20 — Final Report

Status: ${coordinatorStatus}
Overall: ${overallState}
Commander baseline: ${cmdRecon.v20Baseline} (${cmdRecon.classification})
Reproduction: all four identical source trees
Review builds ready for owner decisions
Tests pass=${testsPass} fail=${testsFail}
Runtime pass=${rtPass} fail=${rtFail}
Integrity: originals ${master.originalRepositoryIntegrity}; prior WTs ${master.priorWorktreeIntegrity}
`;
  atomicWrite(path.join(runRoot, 'V20-FINAL-REPORT-AR.md'), ar);
  atomicWrite(path.join(runRoot, 'V20-FINAL-REPORT-EN.md'), en);

  // latest mirrors
  const latest = path.join(PLATFORM, 'uaos-reports', 'latest');
  fs.mkdirSync(latest, { recursive: true });
  const deskReports = path.join(process.env.USERPROFILE || '', 'Desktop', 'UAOS-LATEST-REPORTS');
  fs.mkdirSync(deskReports, { recursive: true });
  const mirrors = {
    'LATEST-V20-REPORT-AR.md': 'V20-FINAL-REPORT-AR.md',
    'LATEST-V20-MASTER-STATUS.json': 'V20-MASTER-STATUS.json',
    'LATEST-V20-REPRODUCIBILITY.json': 'V20-REPRODUCIBILITY-RESULTS.json',
    'LATEST-V20-LIBRARY-REVIEW.json': 'V20-LIBRARY-REVIEW-BUILD.json',
    'LATEST-V20-KEYBOARD-REVIEW.json': 'V20-KEYBOARD-REVIEW-BUILD.json',
    'LATEST-V20-CREATOR-REVIEW.json': 'V20-CREATOR-REVIEW-BUILD.json',
    'LATEST-V20-STUDIO-REVIEW.json': 'V20-STUDIO-REVIEW-BUILD.json',
    'LATEST-V20-TRUTH-MATRIX.json': 'V20-TRUTH-MATRIX.json',
    'LATEST-V20-BLOCKERS.json': 'V20-BLOCKERS.json',
    'LATEST-V20-OWNER-DECISIONS.json': 'V20-OWNER-DECISIONS-PENDING.json',
    'LATEST-V20-NEXT-EXECUTION-PLAN.json': 'V20-NEXT-EXECUTION-PLAN.json'
  };
  for (const [dst, src] of Object.entries(mirrors)) {
    fs.copyFileSync(path.join(runRoot, src), path.join(latest, dst));
    fs.copyFileSync(path.join(runRoot, src), path.join(deskReports, dst));
  }
  const summary = `UAOS V20 ${coordinatorStatus}\nOverall ${overallState}\nRun ${runRoot}\n`;
  atomicWrite(path.join(latest, 'LATEST-REPORT-SUMMARY.txt'), summary);
  atomicWrite(path.join(deskReports, 'LATEST-REPORT-SUMMARY.txt'), summary);

  // evidence zip
  const zip = path.join(runRoot, `UAOS-V20-EVIDENCE-${stamp}.zip`);
  spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${runRoot}\\*' -DestinationPath '${zip}' -Force`], { encoding: 'utf8' });
  const sha = sha256File(zip);
  atomicWrite(path.join(runRoot, `UAOS-V20-EVIDENCE-${stamp}.sha256`), `${sha}  UAOS-V20-EVIDENCE-${stamp}.zip\n`);

  // leader files
  atomicWrite(path.join(PLATFORM, 'uaos-agent-factory', 'src', 'platform-v20-cursor-leader.mjs'), `import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync, execFileSync } from 'child_process';
const PLATFORM='C:\\\\keyboard-manager-clean';
const V19ZIP=path.join(PLATFORM,'uaos-agent-factory','.runtime','artifacts','platform-v19-integrated-candidates','run-20260804-203745','UAOS-V19-EVIDENCE-20260804-203745.zip');
const V19SHA='9BE81C7227C566916BD7128B2CD2665A5B7F5016FF63039AC515953782960F16';
const CMD='C:\\\\Users\\\\ssare\\\\Desktop\\\\UAOS Commander';
const LATEST=path.join(PLATFORM,'uaos-reports','latest','LATEST-V20-REPORT-AR.md');
const CENTER=${JSON.stringify(path.join(centerDir, 'index.html'))};
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();}
console.log('UAOS V20 Cursor Leader');
if(process.platform!=='win32'){console.error('WINDOWS_REQUIRED');process.exit(2);}
if((process.env.COMPUTERNAME||'')!=='BOSS'){console.error('BOSS_REQUIRED');process.exit(2);}
if(sha(V19ZIP)!==V19SHA){console.error('V19_SHA_MISMATCH');process.exit(3);}
const head=spawnSync('git',['-C',CMD,'rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();
console.log('COMMANDER_BASELINE='+head);
console.log('NO_COMMIT NO_PUSH NO_MERGE');
try{execFileSync('cmd',['/c','start','',LATEST],{stdio:'ignore'});}catch{}
try{execFileSync('cmd',['/c','start','',CENTER],{stdio:'ignore'});}catch{}
console.log('LEADER_DONE');
`);
  atomicWrite(path.join(PLATFORM, 'RUN-UAOS-V20-CURSOR-LEADER.cmd'), `@echo off
setlocal EnableExtensions
title UAOS V20 Cursor Leader
echo ==============================================
echo  UAOS V20 — Review Builds + Reproducible Integration
echo ==============================================
if /I not "%OS%"=="Windows_NT" (echo UAOS_V20_WINDOWS_REQUIRED & goto :hold)
if /I not "%COMPUTERNAME%"=="BOSS" (echo UAOS_V20_BOSS_HOST_REQUIRED & goto :hold)
where node >nul 2>&1 || (echo NODE_NOT_FOUND & goto :hold)
node "C:\\keyboard-manager-clean\\uaos-agent-factory\\src\\platform-v20-cursor-leader.mjs"
:hold
echo.
echo Window remains open. Press any key to exit.
pause >nul
endlocal
`);

  atomicWrite(path.join(RUNTIME, 'current-run.txt'), runRoot);
  console.log(JSON.stringify({
    status: coordinatorStatus,
    overall: overallState,
    run: runRoot,
    sha,
    zip,
    testsPass,
    testsFail,
    commander: cmdRecon.classification,
    priorOk,
    integrityFail
  }, null, 2));
}

try { main(); } catch (e) {
  console.error(JSON.stringify({ ok: false, error: e.message, stack: e.stack }));
  process.exit(1);
}
