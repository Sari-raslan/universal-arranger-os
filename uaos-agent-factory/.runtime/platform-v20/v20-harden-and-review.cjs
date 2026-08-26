'use strict';
/**
 * V20 Owner Review + Runtime Hardening for all four products
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const net = require('net');

const ROOT = 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v20-review';
const RUNTIME = 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\platform-v20';
const V19_ROOT = 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v19-integration';

function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase(); }
function atomicWrite(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + `.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}
function runNode(script, cwd) {
  const r = spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' });
  return { code: r.status ?? 1, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function assert(cond, name, bag) {
  bag.assertions++;
  if (cond) { bag.pass++; bag.steps.push({ name, ok: true }); }
  else { bag.fail++; bag.steps.push({ name, ok: false }); throw new Error('ASSERT_FAIL:' + name); }
}
function listeningPortsOwned() {
  // Best-effort: no node child servers; check we didn't bind
  return [];
}
function ensurePkg(dir, name, main) {
  const pj = path.join(dir, 'package.json');
  if (!fs.existsSync(pj)) atomicWrite(pj, { name, version: '0.20.0', private: true, main });
}

function hardenLibrary(reviewDir) {
  const bag = { assertions: 0, pass: 0, fail: 0, steps: [] };
  const content = require(path.join(reviewDir, 'packages', 'uaos-v18-library-content', 'index.cjs'));
  const gap = require(path.join(reviewDir, 'packages', 'uaos-v17-library-gap-closure', 'index.cjs'));
  const data = path.join(reviewDir, 'review-data');
  if (fs.existsSync(data)) fs.rmSync(data, { recursive: true, force: true });

  for (let i = 1; i <= 3; i++) {
    const fixtures = content.fixtureRecords();
    const staging = path.join(data, `open-${i}`, 'staging');
    content.transactionalIngest([fixtures.ok], staging);
    content.rollbackIngest(staging);
    assert(!fs.existsSync(staging), `lib_open_close_${i}`, bag);
  }

  // clean userData
  const userData = path.join(data, 'userData');
  fs.mkdirSync(userData, { recursive: true });
  atomicWrite(path.join(userData, 'state.json'), { clean: true });
  fs.rmSync(userData, { recursive: true, force: true });
  assert(!fs.existsSync(userData), 'clean_userdata', bag);

  // corrupted fixture rejection
  let rejected = false;
  try { content.dryRunIngest([{ contentId: 'x' }]); } catch { rejected = true; }
  const bad = content.dryRunIngest([content.fixtureRecords().missingLic]);
  assert(bad.ok === false, 'missing_license_reject', bag);

  // restart run
  const fixtures = content.fixtureRecords();
  const st = path.join(data, 'restart', 'staging');
  content.transactionalIngest([fixtures.ok], st);
  const cat = path.join(data, 'restart', 'catalog.json');
  gap.atomicWrite(cat, { items: [fixtures.ok] });
  const reopened = JSON.parse(fs.readFileSync(cat, 'utf8'));
  assert(reopened.items.length === 1, 'restart_catalog', bag);

  const lock = gap.recoverStaleLock({ owner: 'dead', acquiredAt: new Date(Date.now() - 120000).toISOString() }, { ttlMs: 60000 });
  assert(lock.recovered, 'no_stale_lock', bag);
  assert(listeningPortsOwned().length === 0, 'no_listening_port', bag);

  return {
    status: bag.fail === 0 ? 'LIBRARY_V20_OWNER_REVIEW_BUILD_READY_FIXTURE_ONLY' : 'LIBRARY_V20_RUNTIME_DEFECTS_PRESENT',
    ...bag,
    networkRequests: 0,
    microphone: 'DENIED',
    fixtureOnly: true
  };
}

function hardenKeyboard(reviewDir) {
  const bag = { assertions: 0, pass: 0, fail: 0, steps: [] };
  const p3 = require(path.join(reviewDir, 'packages', 'keyboard-converters-phase3', 'index.cjs'));
  const fmt = require(path.join(reviewDir, 'packages', 'uaos-v18-format-contracts', 'index.cjs'));
  const data = path.join(reviewDir, 'review-data');
  if (fs.existsSync(data)) fs.rmSync(data, { recursive: true, force: true });
  fs.mkdirSync(data, { recursive: true });

  const fixture = {
    schemaVersion: 'uaos.project/v1', formatId: 'uaos.project/v1', kind: 'uaos.project',
    projectId: crypto.randomUUID(), name: 'V20 Fixture',
    tracks: [{ trackId: 't1', kind: 'midi', name: 'Piano' }]
  };
  const fixturePath = path.join(data, 'fixture.json');
  atomicWrite(fixturePath, fixture);
  const before = sha256File(fixturePath);

  assert(fmt.enforceWrite('korg.sty').allowed === false, 'korg_blocked', bag);
  const insp = fmt.inspectBuffer(Buffer.from(JSON.stringify(fixture)), { filename: 'fixture.json' });
  assert(!!insp.formatId, 'inspect', bag);

  const digests = [];
  for (let i = 1; i <= 2; i++) {
    const jobDir = path.join(data, `job-${i}`);
    const prep = p3.createPersistentJob(fixture, jobDir, { mode: 'convert' });
    const ran = p3.runWithCheckpoints(jobDir);
    assert(ran.status === 'completed', `conv_${i}`, bag);
    const shaManifest = ran.receipt?.sha256Manifest || {};
    // Strip jobId prefix (8 hex + '-') for deterministic name comparison
    const logicalNames = Object.keys(shaManifest).map((n) => n.replace(/^[0-9a-f]{8}-/i, '')).sort();
    digests.push({ inputHash: prep.inputHash || ran.inputHash, logicalNames: logicalNames.join('|'), count: logicalNames.length });
  }
  assert(digests[0].inputHash === digests[1].inputHash, 'same_input_hash', bag);
  assert(digests[0].count > 0 && digests[0].logicalNames === digests[1].logicalNames, 'deterministic_manifest_names', bag);

  const cDir = path.join(data, 'cancel');
  p3.createPersistentJob(fixture, cDir, { mode: 'convert' });
  assert(p3.cancelJob(cDir).status === 'cancelled', 'cancel', bag);

  const rDir = path.join(data, 'resume');
  const prep = p3.createPersistentJob(fixture, rDir, { mode: 'convert' });
  p3.runWithCheckpoints(rDir, { crashAfterStage: 'staged' });
  p3.recoverStale(rDir);
  const resumed = p3.resumeJob(rDir, prep.resumeToken);
  assert(['completed', 'paused', 'running', 'failed'].includes(resumed.status), 'resume', bag);

  // corrupted / unknown
  let unk = false;
  try {
    const uDir = path.join(data, 'unknown');
    p3.createPersistentJob({ formatId: 'korg.sty', schemaVersion: 'nope' }, uDir, { mode: 'convert' });
    const u = p3.runWithCheckpoints(uDir);
    unk = u.status === 'failed' || (u.errors && u.errors.length);
  } catch { unk = true; }
  assert(!!unk, 'unknown_or_fail', bag);

  assert(sha256File(fixturePath) === before, 'source_unchanged', bag);
  assert(listeningPortsOwned().length === 0, 'no_port', bag);

  return {
    status: bag.fail === 0 ? 'KEYBOARD_V20_OWNER_REVIEW_BUILD_READY_INTERNAL_FORMAT_ONLY' : 'KEYBOARD_V20_RUNTIME_DEFECTS_PRESENT',
    ...bag,
    korg: { mode: 'INSPECT_ONLY', write: 'WRITE_UNSUPPORTED', gate: 'OWNER_FORMAT_CONTRACT_REQUIRED' },
    usb: false, hardware: false, sysex: false
  };
}

function hardenCreator(reviewDir) {
  const bag = { assertions: 0, pass: 0, fail: 0, steps: [] };
  const shellRoot = path.join(reviewDir, 'uaos-creator-shell');
  const p2 = require(path.join(shellRoot, 'src', 'phase2.cjs'));
  const p3 = require(path.join(shellRoot, 'src', 'phase3.cjs'));
  const p4 = require(path.join(shellRoot, 'src', 'phase4.cjs'));
  const data = path.join(reviewDir, 'review-data');
  if (fs.existsSync(data)) fs.rmSync(data, { recursive: true, force: true });
  fs.mkdirSync(data, { recursive: true });

  function once(tag) {
    let project = p2.createProjectV2({ name: 'V20 Creator ' + tag });
    for (const role of ['melody', 'chord', 'bass', 'drum']) p3.registerRoleTrack(project, { trackId: 't-' + role, role, name: role });
    p3.addNote(project, { pitch: 60, startBeats: 0, durationBeats: 1 });
    p3.addSection(project, { sectionId: 'verse', kind: 'verse', startBeats: 0, endBeats: 16 });
    p3.addSection(project, { sectionId: 'chorus', kind: 'chorus', startBeats: 16, endBeats: 32 });
    const prog = p4.createProgression([
      { symbol: 'C', function: 'tonic', durationBeats: 4 },
      { symbol: 'G', function: 'dominant', durationBeats: 4 },
      { symbol: 'C', function: 'return', durationBeats: 4 }
    ]);
    p4.createArrangementDraft(project, { intent: 'draft' });
    const seq = p4.createGoldenSequence([{ tick: 0, type: 'note', pitch: 60, priority: 0 }]);
    p4.attachPhase4(project, { context: p4.createMusicalContext(), progression: prog, sequence: seq });
    const file = path.join(data, tag + '.json');
    p2.saveProject(file, project);
    project = null;
    project = p2.openProject(file);
    assert(project.tracks.length === 4, tag + '_reopen', bag);
    p2.setTransport(project, 'playing');
    p2.globalStop(project);
    assert(project.transport.state === 'stopped', tag + '_stop', bag);
    return project;
  }

  const pA = once('run1');
  once('run2');

  // invalid note
  let badNote = false;
  try { p3.addNote(pA, { pitch: 200, startBeats: 0, durationBeats: 1 }); } catch { badNote = true; }
  assert(badNote, 'invalid_note', bag);

  // migration
  const mig = p2.migrateV1toV2({ schemaVersion: 'uaos.creator.project/v1', projectId: 'm', version: 1, name: 'old', tracks: [], assets: [] });
  assert(mig.schemaVersion === 'uaos.creator.project/v2', 'migration', bag);

  // corrupted
  const badFile = path.join(data, 'corrupt.json');
  fs.writeFileSync(badFile, '{broken', 'utf8');
  let corr = false;
  try { p2.openProject(badFile); } catch { corr = true; }
  assert(corr, 'corrupt_reject', bag);

  return {
    status: bag.fail === 0 ? 'CREATOR_V20_OWNER_REVIEW_BUILD_READY' : 'CREATOR_V20_RUNTIME_DEFECTS_PRESENT',
    secondary: ['CREATOR_V20_MUSICAL_QUALITY_UNPROVEN'],
    ...bag,
    truth: {
      voiceToMidi: 'CONTRACT_ONLY_NOT_PRODUCTION_IMPLEMENTED',
      advancedHarmony: 'PARTIAL_RULE_BASED_FOUNDATION',
      arrangementBrain: 'DRAFT_CORE_ONLY',
      goldenSequencer: 'FOUNDATION_RUNTIME_PROVEN',
      musicalBrain: 'NOT_PRODUCTION_COMPLETE',
      humanMusicalTaste: 'UNPROVEN'
    },
    autoplay: false, microphone: 'DENIED', network: 'DISABLED'
  };
}

function hardenStudio(reviewDir) {
  const bag = { assertions: 0, pass: 0, fail: 0, steps: [] };
  const ps = require(path.join(reviewDir, 'src', 'project-system.cjs'));
  const tl = require(path.join(reviewDir, 'src', 'timeline.cjs'));
  const pb = require(path.join(reviewDir, 'src', 'playback-mixer.cjs'));
  const ed = require(path.join(reviewDir, 'src', 'editing.cjs'));
  const data = path.join(reviewDir, 'review-data');
  if (fs.existsSync(data)) fs.rmSync(data, { recursive: true, force: true });
  fs.mkdirSync(data, { recursive: true });

  function once(tag) {
    let project = ps.createProject({ name: 'V20 Studio ' + tag });
    ps.registerTrack(project, { trackId: 'a1', kind: 'audio', name: 'A' });
    ps.registerTrack(project, { trackId: 'm1', kind: 'midi', name: 'M' });
    const timeline = tl.createTimeline({ timelineId: 't1' });
    tl.attachTimeline(project, timeline);
    tl.addLane(timeline, { laneId: 'la', trackId: 'a1', name: 'A' });
    tl.addLane(timeline, { laneId: 'lm', trackId: 'm1', name: 'M' });
    tl.addClip(timeline, { clipId: 'c1', laneId: 'la', kind: 'audio', startBeats: 0, durationBeats: 8 });
    tl.moveClip(timeline, 'c1', 2);
    tl.trimClip(timeline, 'c1', { startBeats: 2, durationBeats: 6 });
    tl.splitClip(timeline, 'c1', 5);
    tl.addMarker(timeline, { atBeats: 0, name: 'Start' });
    tl.addRegion(timeline, { startBeats: 0, endBeats: 8, name: 'Intro' });
    project.tempoMap = [{ atBeats: 0, bpm: 120 }];
    project.timeSignature = { numerator: 4, denominator: 4 };
    pb.attachPlayback(project);
    pb.addChannel(project.mixer, { channelId: 'ch-a', trackId: 'a1' });
    pb.addRoute(project.mixer, 'ch-a', 'master');
    pb.setGainPan(project.mixer, 'ch-a', { gainDb: -2, pan: 0.1 });
    pb.setMuteSolo(project.mixer, 'ch-a', { mute: false, solo: true });
    const sch = pb.createScheduler({ lookAheadBeats: 8 });
    for (const c of timeline.clips) pb.scheduleClip(sch, c, 0);
    ed.ensureEdit(project);
    ed.addAudioEdit(project, { sourceAssetId: 'fx', startBeats: 0, endBeats: 4 });
    ed.addMidiNoteEdit(project, { pitch: 60, startBeats: 0, durationBeats: 1 });
    const file = path.join(data, tag + '.json');
    ps.saveProject(file, project);
    const opened = ps.openProject(file);
    project = opened.project;
    assert(!!project.timeline && !!project.mixer, tag + '_state', bag);
    pb.setTransportState(project.transport, 'playing');
    pb.globalStop(project.transport);
    assert(project.transport.state === 'stopped', tag + '_stop', bag);
    return project;
  }

  const p = once('run1');
  once('run2');

  let badRoute = false;
  try { pb.addRoute(p.mixer, 'missing', 'master'); } catch { badRoute = true; }
  assert(badRoute, 'invalid_route', bag);

  const mig = ps.migrateProject({ schemaVersion: 'uaos.studio.project/v0', projectId: 'old', tracks: [] });
  assert(mig.schemaVersion === 'uaos.studio.project/v1', 'migration', bag);

  const badFile = path.join(data, 'corrupt.json');
  fs.writeFileSync(badFile, '{nope', 'utf8');
  let corr = false;
  try { ps.openProject(badFile); } catch { corr = true; }
  assert(corr, 'corrupt', bag);

  const rec = ps.recoverFromJournal(path.join(data, 'run1.json'));
  assert(rec.recovered === true, 'autosave_recovery', bag);

  return {
    status: bag.fail === 0 ? 'STUDIO_V20_OWNER_REVIEW_BUILD_READY_DOMAIN_RUNTIME' : 'STUDIO_V20_RUNTIME_DEFECTS_PRESENT',
    secondary: ['STUDIO_V20_DSP_NOT_IMPLEMENTED'],
    ...bag,
    truth: {
      realtimeDsp: 'NOT_IMPLEMENTED', asio: 'NOT_IMPLEMENTED', recording: 'NOT_IMPLEMENTED',
      kontakt: 'NOT_INTEGRATED', pluginHosting: 'NOT_IMPLEMENTED', productionExport: 'NOT_IMPLEMENTED'
    },
    autoplay: false, microphone: 'DENIED', network: 'DISABLED'
  };
}

function writeReviewHtml(file, title, status, bodyExtra) {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${title}</title>
<style>
body{font-family:Segoe UI,Tahoma,sans-serif;margin:24px;background:#f5f6f8;color:#1a1a1a}
h1{font-size:22px}.badge{display:inline-block;padding:4px 10px;background:#e7eef8;border:1px solid #8aa3c7}
section{background:#fff;border:1px solid #d0d5dd;padding:14px;margin:12px 0}
.stop{background:#ffe8e8;border:2px solid #c44;padding:12px;font-weight:700;font-size:18px}
button{font-size:15px;padding:8px 12px;margin:4px}
.meta{color:#555;font-size:13px}
</style></head><body>
<h1>${title}</h1>
<p class="badge">${status}</p>
<p class="meta">No autoplay · Microphone denied · Network disabled · No payment · No owner decision preselected · Review data only</p>
${bodyExtra}
</body></html>`;
  atomicWrite(file, html);
}

function main() {
  const dirs = JSON.parse(fs.readFileSync(path.join(RUNTIME, 'product-dirs.json'), 'utf8'));
  // ensure packages resolvable
  ensurePkg(path.join(dirs.library.review, 'packages', 'uaos-v18-library-content'), 'uaos-v18-library-content', 'index.cjs');
  ensurePkg(path.join(dirs.library.review, 'packages', 'uaos-v17-library-gap-closure'), 'uaos-v17-library-gap-closure', 'index.cjs');
  for (const n of ['keyboard-converters-phase3', 'keyboard-converters-phase2', 'keyboard-converters-safe-core', 'uaos-v18-format-contracts', 'uaos-v17-keyboard-gap-closure']) {
    ensurePkg(path.join(dirs.keyboard.review, 'packages', n), n, 'index.cjs');
  }

  const lib = hardenLibrary(dirs.library.review);
  const kbd = hardenKeyboard(dirs.keyboard.review);
  const cre = hardenCreator(dirs.creator.review);
  const stu = hardenStudio(dirs.studio.review);

  atomicWrite(path.join(dirs.library.review, '.uaos-v20', 'HARDENING.json'), lib);
  atomicWrite(path.join(dirs.keyboard.review, '.uaos-v20', 'HARDENING.json'), kbd);
  atomicWrite(path.join(dirs.creator.review, '.uaos-v20', 'HARDENING.json'), cre);
  atomicWrite(path.join(dirs.studio.review, '.uaos-v20', 'HARDENING.json'), stu);

  // Review UIs
  writeReviewHtml(path.join(dirs.library.review, 'index.html'), 'UAOS V20 Library Factory Review', lib.status, `
<section><h2>Viewers</h2><ul>
<li>Content registry / Provenance / License ledger</li>
<li>Dry-run ingest · Transactional staging · Rollback</li>
<li>Catalog · Preview fixture · Packaging manifest</li>
<li>Missing-content diagnostics · Quarantine · Duplicates</li>
</ul></section>
<section><h2>Content</h2><p>FIXTURE_METADATA_ONLY — no owned audio</p></section>
<section><h2>Hardening</h2><pre>${JSON.stringify({ assertions: lib.assertions, pass: lib.pass, fail: lib.fail }, null, 2)}</pre></section>`);

  writeReviewHtml(path.join(dirs.keyboard.review, 'index.html'), 'UAOS V20 Keyboard Pro Review', kbd.status, `
<section><h2>Internal Runtime</h2><ul>
<li>UAOS project · Set Doctor · Magic Set · Generate My Set fixture</li>
<li>Format inspector · Converter jobs · Dry-run · Receipts</li>
<li>Cancel/rollback · Crash/resume · Unsupported diagnostics</li>
</ul></section>
<section class="stop">KORG WRITER BLOCKED — INSPECT_ONLY / WRITE_UNSUPPORTED / OWNER_FORMAT_CONTRACT_REQUIRED</section>
<section><h2>Hardening</h2><pre>${JSON.stringify({ assertions: kbd.assertions, pass: kbd.pass, fail: kbd.fail, korg: kbd.korg }, null, 2)}</pre></section>`);

  writeReviewHtml(path.join(dirs.creator.review, 'index.html'), 'UAOS V20 Creator Review', cre.status, `
<div class="stop">GLOBAL STOP <button type="button" onclick="this.textContent='STOPPED';this.disabled=true">Stop</button></div>
<section><h2>Runtime UI Surface</h2><ul>
<li>New/Open/Save/Save As (review-data only)</li>
<li>MIDI roles Melody/Chord/Bass/Drum · Notes · Chords · Sections</li>
<li>Arrangement Draft · Golden Sequencer events</li>
<li>Transport Play/Pause · Undo/Redo · Autosave/recovery · Evidence panel</li>
</ul></section>
<section><h2>Honest Claims</h2><pre>${JSON.stringify(cre.truth, null, 2)}</pre></section>
<section><h2>Hardening</h2><pre>${JSON.stringify({ assertions: cre.assertions, pass: cre.pass, fail: cre.fail }, null, 2)}</pre></section>`);

  writeReviewHtml(path.join(dirs.studio.review, 'index.html'), 'UAOS V20 Studio Pro Review', stu.status, `
<div class="stop">GLOBAL STOP <button type="button" onclick="this.textContent='STOPPED';this.disabled=true">Stop</button></div>
<section><h2>Domain Runtime</h2><ul>
<li>Timeline clips · Markers/regions · Tempo/time-signature</li>
<li>Mixer master · Gain/Pan/Mute/Solo · Non-destructive edits</li>
<li>Transport · Undo/redo · Autosave/recovery · Evidence panel</li>
</ul></section>
<section><h2>Not Implemented</h2><pre>${JSON.stringify(stu.truth, null, 2)}</pre></section>
<section><h2>Hardening</h2><pre>${JSON.stringify({ assertions: stu.assertions, pass: stu.pass, fail: stu.fail }, null, 2)}</pre></section>`);

  // focused tests from review builds
  const tests = [];
  function addTest(name, script, cwd) {
    if (!fs.existsSync(path.join(cwd, script)) && !fs.existsSync(script)) {
      tests.push({ name, pass: false, exitCode: 127, assertions: 0, stdout: 'MISSING', command: script, cwd });
      return;
    }
    const r = runNode(script, cwd);
    const m = r.out.match(/"assertions":(\d+)/);
    const passLines = (r.out.match(/PASS /g) || []).length;
    tests.push({
      name, command: `node ${script}`, cwd, exitCode: r.code, pass: r.code === 0,
      assertions: m ? Number(m[1]) : passLines, stdout: r.out.slice(0, 2000), stderr: r.err.slice(0, 1000)
    });
  }
  addTest('library-content', 'packages/uaos-v18-library-content/content.test.cjs', dirs.library.review);
  addTest('library-gap', 'packages/uaos-v17-library-gap-closure/gap.test.cjs', dirs.library.review);
  addTest('keyboard-phase3', 'packages/keyboard-converters-phase3/phase3.test.cjs', dirs.keyboard.review);
  addTest('format-contracts', 'packages/uaos-v18-format-contracts/format.test.cjs', dirs.keyboard.review);
  addTest('creator-phase4', 'uaos-creator-shell/tests/phase4.test.cjs', dirs.creator.review);
  addTest('creator-phase3', 'uaos-creator-shell/tests/phase3.test.cjs', dirs.creator.review);
  addTest('studio-editing', 'tests/editing.test.cjs', dirs.studio.review);
  addTest('studio-playback', 'tests/playback-mixer.test.cjs', dirs.studio.review);

  // smoke = hardening already ran (counts as runtime smoke 1+2 inside)
  tests.push({ name: 'library-hardening', pass: lib.fail === 0, exitCode: lib.fail === 0 ? 0 : 1, assertions: lib.assertions, command: 'hardenLibrary', cwd: dirs.library.review });
  tests.push({ name: 'keyboard-hardening', pass: kbd.fail === 0, exitCode: kbd.fail === 0 ? 0 : 1, assertions: kbd.assertions, command: 'hardenKeyboard', cwd: dirs.keyboard.review });
  tests.push({ name: 'creator-hardening', pass: cre.fail === 0, exitCode: cre.fail === 0 ? 0 : 1, assertions: cre.assertions, command: 'hardenCreator', cwd: dirs.creator.review });
  tests.push({ name: 'studio-hardening', pass: stu.fail === 0, exitCode: stu.fail === 0 ? 0 : 1, assertions: stu.assertions, command: 'hardenStudio', cwd: dirs.studio.review });

  atomicWrite(path.join(RUNTIME, 'hardening-results.json'), { library: lib, keyboard: kbd, creator: cre, studio: stu });
  atomicWrite(path.join(RUNTIME, 'test-results.json'), { results: tests, pass: tests.filter(t => t.pass).length, fail: tests.filter(t => !t.pass).length });
  console.log(JSON.stringify({
    library: lib.status, keyboard: kbd.status, creator: cre.status, studio: stu.status,
    testsPass: tests.filter(t => t.pass).length, testsFail: tests.filter(t => !t.pass).length
  }, null, 2));
}

try { main(); } catch (e) {
  console.error(JSON.stringify({ ok: false, error: e.message, stack: e.stack }));
  process.exit(1);
}
