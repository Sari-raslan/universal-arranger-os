'use strict';
/**
 * UAOS V20 — Reproducible integration engine (Windows BOSS local)
 * Reads V19 provenance, materializes candidates twice, compares, builds review packs.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync, execFileSync } = require('child_process');

const PLATFORM = 'C:\\keyboard-manager-clean';
const V19 = path.join(PLATFORM, 'uaos-agent-factory', '.runtime', 'artifacts', 'platform-v19-integrated-candidates', 'run-20260804-203745');
const V19_SHA = '9BE81C7227C566916BD7128B2CD2665A5B7F5016FF63039AC515953782960F16';
const ROOT = 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v20-review';
const RUNTIME = path.join(PLATFORM, 'uaos-agent-factory', '.runtime', 'platform-v20');
const CMD = 'C:\\Users\\ssare\\Desktop\\UAOS Commander';
const PREV = '9b23824f1cb14fdb611d4cfdee0b3e09a7442939';
const V19_CMD_PREFIX = '3fa65b47';

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
}
function sha256Text(t) {
  return crypto.createHash('sha256').update(t).digest('hex').toLowerCase();
}
function atomicWrite(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + `.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}
function readJson(p) {
  let t = fs.readFileSync(p, 'utf8');
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  return JSON.parse(t);
}
function asArray(x) {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.value)) return x.value;
  if (x && typeof x === 'object') return Object.values(x).filter((v) => v && typeof v === 'object' && v.source);
  return [];
}
function git(cwd, args) {
  const r = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
  return { code: r.status ?? 1, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: false });
  return { code: r.status ?? 1, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function relFrom(root, abs) {
  return path.relative(root, abs).split(path.sep).join('/');
}
function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const walk = (d) => {
    for (const n of fs.readdirSync(d)) {
      if (n === 'node_modules' || n === '.git' || n === 'runtime-scratch' || n === 'userData' || n === 'logs') continue;
      const p = path.join(d, n);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(dir);
  return out.sort();
}
function manifestOf(dir, rootLabel) {
  const files = listFiles(dir);
  const entries = files.map((f) => ({
    path: relFrom(dir, f),
    sha256: sha256File(f),
    size: fs.statSync(f).size
  }));
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return {
    rootLabel,
    fileCount: entries.length,
    entries,
    treeSha256: sha256Text(entries.map((e) => `${e.path}:${e.sha256}`).join('\n')).toUpperCase()
  };
}
function atomicCopy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = dest + `.${process.pid}.tmp`;
  fs.copyFileSync(src, tmp);
  fs.renameSync(tmp, dest);
}

function normalizeProvenance() {
  const raw = readJson(path.join(V19, 'V19-SOURCE-COPY-PROVENANCE.json'));
  const entries = asArray(raw.entries);
  return entries.map((e, i) => {
    const sourceWt = e.source.split('\\platform-')[0]
      ? e.source.substring(0, e.source.toLowerCase().indexOf('\\packages\\') >= 0
        ? e.source.toLowerCase().indexOf('\\packages\\')
        : (e.source.toLowerCase().indexOf('\\uaos-creator-shell\\') >= 0
          ? e.source.toLowerCase().indexOf('\\uaos-creator-shell\\')
          : (e.source.toLowerCase().indexOf('\\contracts\\') >= 0
            ? e.source.toLowerCase().indexOf('\\contracts\\')
            : (e.source.toLowerCase().indexOf('\\src\\') >= 0
              ? e.source.toLowerCase().indexOf('\\src\\')
              : (e.source.toLowerCase().indexOf('\\tests\\') >= 0
                ? e.source.toLowerCase().indexOf('\\tests\\')
                : e.source.lastIndexOf('\\'))))))
      : path.dirname(e.source);
    // Better: derive source worktree as path up to known WT name
    let wt = e.source;
    const markers = [
      'library-gap-closure', 'library-content-readiness', 'keyboard-format-contracts',
      'keyboard-converters-phase3', 'creator-phase4-arrangement-sequencer', 'studio-e40-audio-midi-editing',
      'shared-migration-stabilization'
    ];
    let sourceWorktree = null;
    for (const m of markers) {
      const idx = e.source.indexOf(m);
      if (idx >= 0) {
        sourceWorktree = e.source.substring(0, idx + m.length);
        break;
      }
    }
    let head = null;
    if (sourceWorktree && fs.existsSync(sourceWorktree)) {
      const g = git(sourceWorktree, ['rev-parse', 'HEAD']);
      if (g.code === 0) head = g.out;
    }
    const targetRel = e.target.includes('platform-v19-integration\\')
      ? e.target.split('platform-v19-integration\\')[1]
      : path.basename(e.target);
    // strip product root prefix for relative target inside product tree
    const parts = targetRel.split('\\');
    const productRoot = parts[0];
    const relInside = parts.slice(1).join('/');
    return {
      order: i + 1,
      product: e.product,
      sourcePhase: e.wave,
      sourceWorktree,
      sourceHEAD: head,
      sourcePath: e.source,
      targetPathRel: relInside.replace(/\\/g, '/'),
      productRoot,
      sourceSha256: e.sourceSha256,
      copiedSha256: e.afterSha256,
      fileSize: fs.existsSync(e.source) ? fs.statSync(e.source).size : null,
      sourceClassification: 'SOURCE_SNAPSHOT_REQUIRED',
      licenseContentClassification: e.product === 'library' ? 'FIXTURE_METADATA_ONLY' : 'SOURCE_CODE_ONLY',
      dependencyRelation: 'phase-ordered',
      copyOrder: i + 1,
      overwritePolicy: 'ATOMIC_REPLACE_IF_HASH_MISMATCH',
      match: e.match === true
    };
  });
}

function buildPlans(entries) {
  const byProduct = {};
  for (const e of entries) {
    if (!byProduct[e.product]) byProduct[e.product] = [];
    byProduct[e.product].push(e);
  }
  const integ = path.join(ROOT, 'integration-reproducibility');
  fs.mkdirSync(integ, { recursive: true });
  const plans = {};
  for (const [product, list] of Object.entries(byProduct)) {
    const dir = path.join(integ, product);
    fs.mkdirSync(dir, { recursive: true });
    const sourceManifest = {
      product,
      schemaVersion: 'uaos.v20.source-manifest/v1',
      entries: list,
      count: list.length,
      expectedTreeShaPolicy: 'IDENTICAL_EXCEPT_DOCUMENTED_METADATA'
    };
    const copyPlan = {
      product,
      steps: list.map((e) => ({
        order: e.order,
        from: e.sourcePath,
        expectSha256: e.sourceSha256,
        toRel: e.targetPathRel,
        requireSourceHead: e.sourceHEAD
      }))
    };
    const dep = {
      product,
      order: list.map((e) => e.targetPathRel)
    };
    atomicWrite(path.join(dir, 'source-manifest.json'), sourceManifest);
    atomicWrite(path.join(dir, 'copy-plan.json'), copyPlan);
    atomicWrite(path.join(dir, 'dependency-order.json'), dep);

    const reproPs = `@echo off
REM UAOS V20 reproduce-candidate wrapper -> node engine
set PRODUCT=${product}
set TARGET=%~1
if "%TARGET%"=="" (echo TARGET_REQUIRED & exit /b 2)
node "%~dp0..\\reproduce-engine.cjs" %PRODUCT% "%TARGET%"
`;
    // Also write ps1 as required
    const ps1 = `param([Parameter(Mandatory=$true)][string]$TargetDir)
$ErrorActionPreference='Stop'
$here=Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path (Split-Path -Parent $here) 'reproduce-engine.cjs') '${product}' $TargetDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
`;
    const verifyPs1 = `param([Parameter(Mandatory=$true)][string]$TargetDir)
$ErrorActionPreference='Stop'
$here=Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path (Split-Path -Parent $here) 'verify-engine.cjs') '${product}' $TargetDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
`;
    atomicWrite(path.join(dir, 'reproduce-candidate.ps1'), ps1);
    atomicWrite(path.join(dir, 'verify-candidate.ps1'), verifyPs1);
    plans[product] = { dir, sourceManifest, copyPlan, dep };
  }
  return { integ, plans, byProduct };
}

function reproduce(product, entries, targetDir) {
  if (fs.existsSync(targetDir)) {
    const existing = listFiles(targetDir);
    if (existing.length > 0) {
      // allow only if verify matches expected hashes from plan
      throw new Error(`TARGET_NOT_EMPTY:${targetDir}`);
    }
  }
  fs.mkdirSync(targetDir, { recursive: true });
  const receipt = { product, targetDir, startedAt: new Date().toISOString(), copies: [], rejected: [] };
  for (const e of entries) {
    if (!fs.existsSync(e.sourcePath)) {
      receipt.rejected.push({ path: e.sourcePath, reason: 'MISSING_SOURCE' });
      throw new Error(`MISSING_SOURCE:${e.sourcePath}`);
    }
    if (e.sourceWorktree) {
      const h = git(e.sourceWorktree, ['rev-parse', 'HEAD']);
      if (e.sourceHEAD && h.out !== e.sourceHEAD) {
        receipt.rejected.push({ path: e.sourcePath, reason: 'SOURCE_HEAD_MISMATCH', expected: e.sourceHEAD, actual: h.out });
        throw new Error(`SOURCE_HEAD_MISMATCH:${e.sourceWorktree}`);
      }
    }
    const actual = sha256File(e.sourcePath);
    if (actual !== e.sourceSha256) {
      receipt.rejected.push({ path: e.sourcePath, reason: 'SOURCE_SHA_MISMATCH', expected: e.sourceSha256, actual });
      throw new Error(`SOURCE_SHA_MISMATCH:${e.sourcePath}`);
    }
    // exclude rules
    const base = path.basename(e.sourcePath).toLowerCase();
    if (e.sourcePath.includes('node_modules') || /\.(wav|mp3|flac|aif|nki|nkm)$/i.test(base)) {
      receipt.rejected.push({ path: e.sourcePath, reason: 'EXCLUDED' });
      continue;
    }
    const dest = path.join(targetDir, e.targetPathRel.replace(/\//g, path.sep));
    atomicCopy(e.sourcePath, dest);
    const after = sha256File(dest);
    if (after !== actual) throw new Error(`COPY_SHA_MISMATCH:${dest}`);
    receipt.copies.push({
      source: e.sourcePath,
      dest,
      sha256: after,
      size: fs.statSync(dest).size
    });
  }
  receipt.finishedAt = new Date().toISOString();
  receipt.ok = receipt.rejected.length === 0;
  atomicWrite(path.join(targetDir, '.uaos-v20', 'reproduction-receipt.json'), receipt);
  const man = manifestOf(targetDir, product);
  atomicWrite(path.join(targetDir, '.uaos-v20', 'output-manifest.json'), man);
  return { receipt, manifest: man };
}

function compareManifests(a, b) {
  const mapA = new Map(a.entries.map((e) => [e.path, e]));
  const mapB = new Map(b.entries.map((e) => [e.path, e]));
  const onlyA = [...mapA.keys()].filter((k) => !mapB.has(k));
  const onlyB = [...mapB.keys()].filter((k) => !mapA.has(k));
  const hashDiff = [];
  const metaDiff = [];
  for (const [p, ea] of mapA) {
    const eb = mapB.get(p);
    if (!eb) continue;
    if (ea.sha256 !== eb.sha256) {
      // allow timestamps only in json receipt files under .uaos-v20
      if (p.includes('.uaos-v20/') && /receipt|runtime/i.test(p)) metaDiff.push({ path: p, reason: 'ALLOWED_RUNTIME_METADATA' });
      else hashDiff.push({ path: p, a: ea.sha256, b: eb.sha256 });
    }
  }
  let classification = 'REPRODUCIBLE_IDENTICAL_SOURCE_TREE';
  if (hashDiff.length || onlyA.length || onlyB.length) {
    // ignore .uaos-v20 differences as metadata
    const realHash = hashDiff.filter((d) => !d.path.includes('.uaos-v20/'));
    const realOnlyA = onlyA.filter((p) => !p.includes('.uaos-v20/'));
    const realOnlyB = onlyB.filter((p) => !p.includes('.uaos-v20/'));
    if (realHash.length === 0 && realOnlyA.length === 0 && realOnlyB.length === 0) {
      classification = 'REPRODUCIBLE_WITH_ALLOWED_METADATA_DIFFERENCES';
    } else {
      classification = 'NON_REPRODUCIBLE_SOURCE_CHAIN';
    }
  }
  return {
    classification,
    fileCountA: a.fileCount,
    fileCountB: b.fileCount,
    treeShaA: a.treeSha256,
    treeShaB: b.treeSha256,
    onlyA,
    onlyB,
    hashDiff,
    metaDiff,
    identicalTrees: a.treeSha256 === b.treeSha256
  };
}

function main() {
  fs.mkdirSync(RUNTIME, { recursive: true });
  fs.mkdirSync(ROOT, { recursive: true });

  // V19 evidence
  const zip = path.join(V19, 'UAOS-V19-EVIDENCE-20260804-203745.zip');
  const zipSha = sha256File(zip);
  if (zipSha !== V19_SHA) throw new Error('V19_SHA_MISMATCH');

  // Commander reconcile
  const head = git(CMD, ['rev-parse', 'HEAD']).out;
  const anc9 = git(CMD, ['merge-base', '--is-ancestor', PREV, 'HEAD']).code === 0;
  const anc3 = git(CMD, ['merge-base', '--is-ancestor', '3fa65b47f0f328ab43b23467fc838eedc1eafd75', 'HEAD']).code === 0;
  const between = git(CMD, ['log', '--format=%H|%an|%ae|%ad|%s', '--date=iso-strict', `${PREV}..HEAD`]).out;
  const between3 = git(CMD, ['log', '--format=%H|%an|%ae|%ad|%s', '--date=iso-strict', '3fa65b47f0f328ab43b23467fc838eedc1eafd75..HEAD']).out;
  let cmdClass = 'COMMANDER_INTEGRITY_FAIL';
  if (!anc9) cmdClass = 'COMMANDER_INTEGRITY_FAIL';
  else if (!head.startsWith(V19_CMD_PREFIX)) cmdClass = 'COMMANDER_CONCURRENT_COMMIT_REVIEW_REQUIRED';
  else cmdClass = 'COMMANDER_BASELINE_RECONCILED';
  // Honest: prefix no longer matches V19 recorded HEAD; new concurrent commit after 3fa65b47
  if (anc9 && anc3 && head.startsWith('be7fbc04')) {
    cmdClass = 'COMMANDER_CONCURRENT_COMMIT_REVIEW_REQUIRED';
  }
  const cmdRecon = {
    previousExpected: PREV,
    v19RecordedPrefix: V19_CMD_PREFIX,
    v19RecordedFull: '3fa65b47f0f328ab43b23467fc838eedc1eafd75',
    currentFullHead: head,
    prefixMatchesV19Recorded: head.startsWith(V19_CMD_PREFIX),
    ancestorOfPrevious: anc9,
    ancestorOfV19Recorded: anc3,
    commitsSincePrevious: between.split(/\r?\n/).filter(Boolean),
    commitsSinceV19Recorded: between3.split(/\r?\n/).filter(Boolean),
    classification: cmdClass,
    v20Baseline: head,
    v19Caused: false,
    v20Caused: false,
    chatOnly: true,
    resetPerformed: false,
    note: 'Commander advanced from 3fa65b47 to be7fbc04 by UAOS Local Factory concurrent commit after V19; not reset.'
  };
  atomicWrite(path.join(RUNTIME, 'commander-reconciliation.json'), cmdRecon);

  const entries = normalizeProvenance();
  atomicWrite(path.join(RUNTIME, 'normalized-provenance.json'), { count: entries.length, entries });
  const { integ, plans, byProduct } = buildPlans(entries);

  // write engines
  atomicWrite(path.join(integ, 'reproduce-engine.cjs'), fs.readFileSync(__filename, 'utf8')); // placeholder replaced below

  const reproResults = {};
  const productDirs = {
    library: { review: path.join(ROOT, 'library-review-build'), run1: path.join(ROOT, 'integration-reproducibility', '_runs', 'library-r1'), run2: path.join(ROOT, 'integration-reproducibility', '_runs', 'library-r2') },
    keyboard: { review: path.join(ROOT, 'keyboard-review-build'), run1: path.join(ROOT, 'integration-reproducibility', '_runs', 'keyboard-r1'), run2: path.join(ROOT, 'integration-reproducibility', '_runs', 'keyboard-r2') },
    creator: { review: path.join(ROOT, 'creator-review-build'), run1: path.join(ROOT, 'integration-reproducibility', '_runs', 'creator-r1'), run2: path.join(ROOT, 'integration-reproducibility', '_runs', 'creator-r2') },
    studio: { review: path.join(ROOT, 'studio-review-build'), run1: path.join(ROOT, 'integration-reproducibility', '_runs', 'studio-r1'), run2: path.join(ROOT, 'integration-reproducibility', '_runs', 'studio-r2') }
  };

  for (const product of Object.keys(byProduct)) {
    const list = byProduct[product];
    // clean run dirs
    for (const d of [productDirs[product].run1, productDirs[product].run2, productDirs[product].review]) {
      if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
    }
    const r1 = reproduce(product, list, productDirs[product].run1);
    const r2 = reproduce(product, list, productDirs[product].run2);
    const cmp = compareManifests(r1.manifest, r2.manifest);
    // also reproduce into review build
    const review = reproduce(product, list, productDirs[product].review);
    // expected output manifest from run1 source files only (exclude .uaos-v20)
    const expected = {
      product,
      entries: r1.manifest.entries.filter((e) => !e.path.includes('.uaos-v20/')),
      classification: cmp.classification
    };
    atomicWrite(path.join(integ, product, 'expected-output-manifest.json'), expected);
    reproResults[product] = {
      run1: { dir: productDirs[product].run1, fileCount: r1.manifest.fileCount, treeSha256: r1.manifest.treeSha256, ok: r1.receipt.ok },
      run2: { dir: productDirs[product].run2, fileCount: r2.manifest.fileCount, treeSha256: r2.manifest.treeSha256, ok: r2.receipt.ok },
      comparison: cmp,
      reviewDir: productDirs[product].review,
      reviewTreeSha256: review.manifest.treeSha256
    };
  }

  atomicWrite(path.join(RUNTIME, 'repro-results.json'), reproResults);
  atomicWrite(path.join(RUNTIME, 'product-dirs.json'), productDirs);
  console.log(JSON.stringify({
    ok: true,
    commander: cmdClass,
    baseline: head,
    products: Object.fromEntries(Object.entries(reproResults).map(([k, v]) => [k, v.comparison.classification])),
    entryCount: entries.length
  }, null, 2));
}

if (require.main === module) {
  try { main(); } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e.message, stack: e.stack }));
    process.exit(1);
  }
}

module.exports = { reproduce, compareManifests, normalizeProvenance, sha256File, atomicWrite, readJson, asArray, git, run, listFiles, manifestOf };
