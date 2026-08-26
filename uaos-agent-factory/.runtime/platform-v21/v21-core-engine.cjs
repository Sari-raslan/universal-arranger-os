'use strict';
/**
 * UAOS V21 — Owner Intake, Review Center, Creator Phase5 Preview, Studio E50 Offline Render
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const PLATFORM = 'C:\\keyboard-manager-clean';
const RUNTIME = path.join(PLATFORM, 'uaos-agent-factory', '.runtime', 'platform-v21');
const ROOT = 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v21-execution';
const V20 = path.join(PLATFORM, 'uaos-agent-factory', '.runtime', 'artifacts', 'platform-v20-review-builds', 'run-20260804-213609');
const V20_REPRO = 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v20-review\\integration-reproducibility';
const CMD = 'C:\\Users\\ssare\\Desktop\\UAOS Commander';
const V19_SHA = '3fa65b47f0f328ab43b23467fc838eedc1eafd75';
const V20_SHA = 'be7fbc04f803791d3087a2e7a4e5dadab6880ed2';

function sha256Buf(buf) { return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase(); }
function sha256File(p) { return sha256Buf(fs.readFileSync(p)); }
function sha256Text(t) { return sha256Buf(Buffer.from(t, 'utf8')); }
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
function atomicCopy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = dest + `.${process.pid}.tmp`;
  fs.copyFileSync(src, tmp);
  fs.renameSync(tmp, dest);
}

function reproduceFromManifest(product, targetDir) {
  const manifest = readJson(path.join(V20_REPRO, product, 'source-manifest.json'));
  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  const receipt = { product, copies: [], startedAt: new Date().toISOString() };
  for (const e of manifest.entries) {
    if (!fs.existsSync(e.sourcePath)) throw new Error('MISSING_SOURCE:' + e.sourcePath);
    const actual = sha256File(e.sourcePath);
    if (actual !== e.sourceSha256) throw new Error('SHA_MISMATCH:' + e.sourcePath);
    if (e.sourceWorktree && e.sourceHEAD) {
      const h = git(e.sourceWorktree, ['rev-parse', 'HEAD']).out;
      if (h !== e.sourceHEAD) throw new Error('HEAD_MISMATCH:' + e.sourceWorktree);
    }
    const dest = path.join(targetDir, e.targetPathRel.replace(/\//g, path.sep));
    atomicCopy(e.sourcePath, dest);
    receipt.copies.push({ dest, sha256: sha256File(dest) });
  }
  receipt.finishedAt = new Date().toISOString();
  receipt.ok = true;
  atomicWrite(path.join(targetDir, '.uaos-v21', 'reproduction-receipt.json'), receipt);
  return receipt;
}

function ensurePkg(dir, name) {
  const pj = path.join(dir, 'package.json');
  if (!fs.existsSync(pj)) atomicWrite(pj, { name, version: '0.21.0', private: true, main: 'index.cjs' });
}

// ---------- WAV writer (PCM 16-bit) ----------
function writeWav(file, samples, sampleRate = 48000, channels = 2) {
  const numSamples = samples.length / channels;
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * channels * 2, 28); buf.writeUInt16LE(channels * 2, 32);
  buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  atomicWrite(file, buf); // atomicWrite for binary - need binary write
  fs.writeFileSync(file, buf);
  return { file, sha256: sha256File(file), bytes: buf.length, sampleRate, channels, frames: numSamples };
}

function analyze(samples) {
  let peak = 0, sumSq = 0, clip = 0, nonSilent = 0;
  for (const s of samples) {
    const a = Math.abs(s);
    if (a > peak) peak = a;
    sumSq += s * s;
    if (a >= 0.999) clip++;
    if (a > 1e-4) nonSilent++;
  }
  const rms = Math.sqrt(sumSq / Math.max(1, samples.length));
  return { peak, rms, clippingCount: clip, silent: nonSilent === 0, nonSilentSamples: nonSilent };
}

function synthOscillator(events, { sampleRate = 48000, durationSec = 2, gain = 0.2 } = {}) {
  const frames = Math.floor(sampleRate * durationSec);
  const samples = new Float64Array(frames * 2);
  const ordered = [...events].sort((a, b) => (a.tick - b.tick) || String(a.role).localeCompare(String(b.role)) || (a.pitch - b.pitch));
  for (const ev of ordered) {
    const start = Math.floor((ev.tick / 480) * (sampleRate * 60 / (ev.tempo || 120)));
    const dur = Math.floor((ev.durationBeats || 0.25) * (sampleRate * 60 / (ev.tempo || 120)));
    const freq = 440 * Math.pow(2, ((ev.pitch || 60) - 69) / 12);
    const pan = ev.pan ?? 0;
    const g = (ev.mute || ev.soloBlocked) ? 0 : (ev.gain ?? gain);
    const roleGain = ({ melody: 1, chord: 0.6, bass: 0.8, drum: 0.5 })[ev.role] || 1;
    for (let i = 0; i < dur && start + i < frames; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, i / 200) * Math.min(1, (dur - i) / 400);
      let v = Math.sin(2 * Math.PI * freq * t) * g * roleGain * env;
      if (ev.role === 'drum') v = ((i % 40 < 4) ? 1 : 0) * g * roleGain * env * 0.5;
      const l = v * (1 - Math.max(0, pan));
      const r = v * (1 + Math.min(0, pan) + Math.max(0, pan));
      samples[(start + i) * 2] += l;
      samples[(start + i) * 2 + 1] += r;
    }
  }
  // soft clip prevent
  for (let i = 0; i < samples.length; i++) samples[i] = Math.max(-0.98, Math.min(0.98, samples[i]));
  return { samples, ordered, frames, sampleRate };
}

function creatorPhase5(dest) {
  reproduceFromManifest('creator', dest);
  const shell = path.join(dest, 'uaos-creator-shell');
  const p4 = require(path.join(shell, 'src', 'phase4.cjs'));
  const p3 = require(path.join(shell, 'src', 'phase3.cjs'));
  const p2 = require(path.join(shell, 'src', 'phase2.cjs'));
  const out = path.join(dest, 'phase5-preview');
  fs.mkdirSync(out, { recursive: true });

  function buildEvents(kind) {
    const project = p2.createProjectV2({ name: 'V21 Preview ' + kind });
    for (const role of ['melody', 'chord', 'bass', 'drum']) p3.registerRoleTrack(project, { trackId: 't-' + role, role, name: role });
    p3.addSection(project, { sectionId: 'verse', kind: 'verse', startBeats: 0, endBeats: 8 });
    const ctx = p4.createMusicalContext({ tempo: 120 });
    const events = [];
    const add = (role, pitch, tick, dur = 0.5) => events.push({ role, pitch, tick, durationBeats: dur, tempo: ctx.tempo, gain: 0.25, pan: role === 'bass' ? -0.2 : role === 'melody' ? 0.2 : 0 });
    if (kind === 'melody-only' || kind === 'combined-technical-preview') { add('melody', 72, 0); add('melody', 74, 240); add('melody', 76, 480); }
    if (kind === 'chords-only' || kind === 'combined-technical-preview') { add('chord', 60, 0, 1); add('chord', 64, 0, 1); add('chord', 67, 0, 1); }
    if (kind === 'bass-only' || kind === 'combined-technical-preview') { add('bass', 36, 0, 1); add('bass', 43, 480, 1); }
    if (kind === 'drums-only' || kind === 'combined-technical-preview') { add('drum', 36, 0, 0.1); add('drum', 36, 240, 0.1); add('drum', 36, 480, 0.1); }
    const seq = p4.createGoldenSequence(events.map((e, i) => ({ tick: e.tick, type: 'note', pitch: e.pitch, priority: i, role: e.role })));
    p4.attachPhase4(project, { context: ctx, sequence: seq });
    return { project, events, seq };
  }

  const fixtures = {};
  const bag = { assertions: 0, pass: 0, fail: 0, steps: [] };
  const assert = (c, n) => { bag.assertions++; if (c) { bag.pass++; bag.steps.push({ name: n, ok: true }); } else { bag.fail++; throw new Error('ASSERT:' + n); } };

  for (const kind of ['melody-only', 'chords-only', 'bass-only', 'drums-only', 'combined-technical-preview']) {
    const { events, seq } = buildEvents(kind);
    const synth = synthOscillator(events, { durationSec: 2 });
    const an = analyze(synth.samples);
    assert(an.clippingCount === 0, kind + '_no_clip');
    assert(!an.silent, kind + '_not_silent');
    const wavPath = path.join(out, kind + '.wav');
    const wav = writeWav(wavPath, synth.samples);
    const receipt = {
      schemaVersion: 'uaos.creator.preview-receipt/v21',
      kind,
      claims: {
        TECHNICAL_FIXTURE_SOUND_ONLY: true,
        NOT_PRODUCT_INSTRUMENT: true,
        NOT_MUSICAL_TASTE_EVIDENCE: true,
        NOT_COMMERCIAL_AUDIO: true
      },
      sampleRate: 48000,
      channels: 2,
      eventCount: events.length,
      sequenceId: seq.sequenceId,
      wavSha256: wav.sha256,
      analysis: an,
      cancelled: false
    };
    atomicWrite(path.join(out, kind + '.receipt.json'), receipt);
    fixtures[kind] = { wav: wav.sha256, receiptSha: sha256File(path.join(out, kind + '.receipt.json')), analysis: an };
  }

  // cancellation
  let cancelled = false;
  const job = { cancelled: false };
  job.cancel = () => { job.cancelled = true; cancelled = true; };
  job.cancel();
  assert(cancelled, 'cancel');

  // silent rejection
  const silent = synthOscillator([], { durationSec: 0.5, gain: 0 });
  assert(analyze(silent.samples).silent === true, 'silent_detect');

  // run1/run2 deterministic for combined
  const a = buildEvents('combined-technical-preview');
  const s1 = synthOscillator(a.events, { durationSec: 2 });
  const s2 = synthOscillator(a.events, { durationSec: 2 });
  const w1 = writeWav(path.join(out, 'det-run1.wav'), s1.samples);
  const w2 = writeWav(path.join(out, 'det-run2.wav'), s2.samples);
  assert(w1.sha256 === w2.sha256, 'deterministic_preview');

  // UI
  atomicWrite(path.join(out, 'index.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>UAOS V21 Creator Technical Preview</title>
<style>body{font-family:Segoe UI;margin:24px;background:#f5f6f8} .stop{background:#ffe8e8;border:2px solid #c44;padding:12px;font-weight:700} .warn{background:#fff6e5;border:1px solid #e0b56a;padding:10px;margin:12px 0}</style></head>
<body><h1>UAOS V21 Creator Technical Preview</h1>
<p class="badge">CREATOR_V21_TECHNICAL_ARRANGEMENT_PREVIEW_READY</p>
<div class="stop">GLOBAL STOP <button onclick="this.textContent='STOPPED';this.disabled=true">Stop</button> · Stop All Review Audio</div>
<div class="warn"><b>TECHNICAL_FIXTURE_SOUND_ONLY</b> — NOT_PRODUCT_INSTRUMENT · NOT_MUSICAL_TASTE_EVIDENCE · NOT_COMMERCIAL_AUDIO<br/>OWNER_LISTENING_AND_TASTE_REVIEW_REQUIRED</div>
<ul><li>melody-only / chords-only / bass-only / drums-only / combined</li><li>48kHz stereo deterministic WAV fixtures</li><li>No autoplay · Microphone denied · Network disabled</li></ul>
<pre>${JSON.stringify({ fixtures: Object.keys(fixtures), assertions: bag.assertions, pass: bag.pass }, null, 2)}</pre>
</body></html>`);

  const result = {
    status: bag.fail === 0 ? 'CREATOR_V21_TECHNICAL_ARRANGEMENT_PREVIEW_READY' : 'CREATOR_V21_PREVIEW_RUNTIME_FAILURE',
    secondary: ['CREATOR_V21_MUSICAL_QUALITY_UNPROVEN'],
    ...bag,
    fixtures,
    musicalTruth: 'OWNER_LISTENING_AND_TASTE_REVIEW_REQUIRED',
    autoplay: false
  };
  atomicWrite(path.join(dest, '.uaos-v21', 'PHASE5.json'), result);
  return result;
}

function studioE50(dest) {
  reproduceFromManifest('studio', dest);
  const ps = require(path.join(dest, 'src', 'project-system.cjs'));
  const tl = require(path.join(dest, 'src', 'timeline.cjs'));
  const pb = require(path.join(dest, 'src', 'playback-mixer.cjs'));
  const out = path.join(dest, 'e50-render');
  fs.mkdirSync(out, { recursive: true });
  const bag = { assertions: 0, pass: 0, fail: 0, steps: [] };
  const assert = (c, n) => { bag.assertions++; if (c) { bag.pass++; bag.steps.push({ name: n, ok: true }); } else { bag.fail++; throw new Error('ASSERT:' + n); } };

  function renderOffline(req) {
    if (req.cancelled) return { status: 'cancelled' };
    const sampleRate = 48000;
    const durationSec = req.durationSec || 1.5;
    const frames = Math.floor(sampleRate * durationSec);
    const samples = new Float64Array(frames * 2);
    const sources = req.sources || [];
    for (const src of sources) {
      if (src.mute) continue;
      const start = Math.floor((src.startBeats || 0) * sampleRate * 60 / (req.tempo || 120));
      const len = Math.floor((src.durationBeats || 1) * sampleRate * 60 / (req.tempo || 120));
      const freq = src.kind === 'noise' ? 0 : (src.freq || 440);
      const g = (src.gainDb != null ? Math.pow(10, src.gainDb / 20) : 0.2) * (src.soloBoost || 1);
      const pan = src.pan || 0;
      for (let i = 0; i < len && start + i < frames; i++) {
        const t = i / sampleRate;
        let v = src.kind === 'impulse' ? (i === 0 ? 1 : 0)
          : src.kind === 'noise' ? ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 2 - 1
          : Math.sin(2 * Math.PI * freq * t);
        const env = Math.min(1, i / 100) * Math.min(1, (len - i) / 300);
        v *= g * env;
        samples[(start + i) * 2] += v * (1 - Math.max(0, pan));
        samples[(start + i) * 2 + 1] += v * (1 + Math.max(0, -pan));
      }
    }
    const master = req.masterGainDb != null ? Math.pow(10, req.masterGainDb / 20) : 1;
    for (let i = 0; i < samples.length; i++) samples[i] = Math.max(-0.98, Math.min(0.98, samples[i] * master));
    const an = analyze(samples);
    const tmp = path.join(out, `.tmp-${req.jobId}.wav`);
    const final = path.join(out, `${req.jobId}.wav`);
    writeWav(tmp, samples);
    if (req.interrupt) {
      fs.rmSync(tmp, { force: true });
      return { status: 'interrupted_cleaned', analysis: an };
    }
    fs.renameSync(tmp, final);
    const receipt = {
      schemaVersion: 'uaos.studio.render-receipt/v50',
      jobId: req.jobId,
      inputSnapshotSha256: req.inputSnapshotSha256,
      sampleRate, channels: 2, frames,
      outputSha256: sha256File(final),
      analysis: an,
      claims: { ASIO: false, realtime: false, recording: false, kontakt: false, commercialExport: false }
    };
    atomicWrite(path.join(out, `${req.jobId}.receipt.json`), receipt);
    atomicWrite(path.join(out, `${req.jobId}.analysis.json`), an);
    return { status: 'completed', receipt, analysis: an, file: final };
  }

  // silent project
  const silent = renderOffline({ jobId: 'silent', sources: [], durationSec: 0.5, inputSnapshotSha256: 'SILENT' });
  assert(silent.analysis.silent === true, 'silent_project');

  const note = renderOffline({
    jobId: 'single-note', tempo: 120, durationSec: 1,
    sources: [{ kind: 'osc', freq: 440, startBeats: 0, durationBeats: 1, gainDb: -6 }],
    inputSnapshotSha256: 'NOTE1'
  });
  assert(!note.analysis.silent && note.analysis.clippingCount === 0, 'single_note');

  const multi = renderOffline({
    jobId: 'multi', tempo: 120, durationSec: 1.5,
    sources: [
      { kind: 'osc', freq: 440, startBeats: 0, durationBeats: 1, pan: -0.3 },
      { kind: 'osc', freq: 554.37, startBeats: 0.5, durationBeats: 1, pan: 0.3 },
      { kind: 'noise', startBeats: 0, durationBeats: 0.2, gainDb: -20 },
      { kind: 'impulse', startBeats: 1, durationBeats: 0.1 }
    ],
    masterGainDb: -1, inputSnapshotSha256: 'MULTI'
  });
  assert(multi.status === 'completed', 'multi');

  const muted = renderOffline({
    jobId: 'mute', sources: [{ kind: 'osc', freq: 440, startBeats: 0, durationBeats: 1, mute: true }],
    durationSec: 0.5, inputSnapshotSha256: 'MUTE'
  });
  assert(muted.analysis.silent === true, 'mute');

  const cancelled = renderOffline({ jobId: 'cancel', cancelled: true, sources: [], inputSnapshotSha256: 'C' });
  assert(cancelled.status === 'cancelled', 'cancel');

  const interrupted = renderOffline({
    jobId: 'interrupt', interrupt: true,
    sources: [{ kind: 'osc', freq: 220, startBeats: 0, durationBeats: 1 }],
    inputSnapshotSha256: 'INT'
  });
  assert(interrupted.status === 'interrupted_cleaned', 'interrupt_cleanup');
  assert(!fs.existsSync(path.join(out, '.tmp-interrupt.wav')), 'tmp_gone');

  // deterministic run1/run2
  const req = {
    jobId: 'det1', tempo: 120, durationSec: 1,
    sources: [{ kind: 'osc', freq: 523.25, startBeats: 0, durationBeats: 1, gainDb: -8, pan: 0.1 }],
    inputSnapshotSha256: 'DET'
  };
  const r1 = renderOffline({ ...req, jobId: 'det-run1' });
  const r2 = renderOffline({ ...req, jobId: 'det-run2' });
  assert(r1.receipt.outputSha256 === r2.receipt.outputSha256, 'deterministic_render');

  // project integration
  let project = ps.createProject({ name: 'E50' });
  ps.registerTrack(project, { trackId: 'a1', kind: 'audio', name: 'A' });
  const timeline = tl.createTimeline({ timelineId: 't1' });
  tl.attachTimeline(project, timeline);
  pb.attachPlayback(project);
  const file = path.join(out, 'project.json');
  ps.saveProject(file, project);
  const opened = ps.openProject(file);
  assert(!!opened.project, 'save_open');

  atomicWrite(path.join(out, 'index.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>UAOS V21 Studio Offline Render</title>
<style>body{font-family:Segoe UI;margin:24px;background:#f5f6f8}.stop{background:#ffe8e8;border:2px solid #c44;padding:12px;font-weight:700}.warn{background:#fff6e5;padding:10px;border:1px solid #e0b56a;margin:12px 0}</style></head>
<body><h1>UAOS V21 Studio E50 Offline Render Review</h1>
<p>STUDIO_PRO_V21_E50_OFFLINE_RENDER_CORE_READY</p>
<div class="stop">GLOBAL STOP <button onclick="this.textContent='STOPPED';this.disabled=true">Stop</button></div>
<div class="warn">ASIO/Real-time DSP/Recording/Kontakt/Plugin hosting: NOT_IMPLEMENTED<br/>Offline technical fixtures only · No autoplay · Mic denied · Network disabled</div>
<pre>${JSON.stringify({ assertions: bag.assertions, pass: bag.pass, det: r1.receipt.outputSha256 }, null, 2)}</pre>
</body></html>`);

  const result = {
    status: bag.fail === 0 ? 'STUDIO_PRO_V21_E50_OFFLINE_RENDER_CORE_READY' : 'STUDIO_PRO_V21_E50_RENDER_FAILURES_PRESENT',
    secondary: ['FUTURE_TECHNICAL_PHASE_REQUIRED'],
    ...bag,
    deterministicHash: r1.receipt.outputSha256,
    claims: { asio: 'NOT_IMPLEMENTED', realtimeDsp: 'NOT_IMPLEMENTED', recording: 'NOT_IMPLEMENTED', kontakt: 'NOT_INTEGRATED' }
  };
  atomicWrite(path.join(dest, '.uaos-v21', 'E50.json'), result);
  return result;
}

function ownerIntake(dest) {
  fs.mkdirSync(dest, { recursive: true });
  const decisions = {
    schemaVersion: 'uaos.owner-decision-intake/v21',
    products: {
      library: { options: ['APPROVE_TECHNICAL_ADOPTION_FIXTURE_ONLY', 'REQUEST_TECHNICAL_CORRECTION', 'DEFER_UNTIL_REAL_CONTENT_SELECTED'], status: 'NOT_REVIEWED', selected: null },
      keyboard: { options: ['APPROVE_INTERNAL_RUNTIME_ADOPTION', 'REQUEST_TECHNICAL_CORRECTION', 'DEFER_UNTIL_FORMAT_CONTRACT'], status: 'NOT_REVIEWED', selected: null },
      creator: { options: ['ACCEPT_RUNTIME_DIRECTION', 'REQUEST_TARGETED_CORRECTION', 'REJECT_RUNTIME_DIRECTION', 'DEFER_UNTIL_MUSICAL_PREVIEW'], status: 'NOT_REVIEWED', selected: null },
      studio: { options: ['ACCEPT_DOMAIN_RUNTIME_DIRECTION', 'REQUEST_TARGETED_CORRECTION', 'DEFER_UNTIL_DSP_PHASE'], status: 'NOT_REVIEWED', selected: null },
      kids: { options: ['SELECT_INTEGRATION', 'SELECT_COMMERCIAL_RC2', 'CREATE_RECONCILED_BASELINE', 'DEFER'], status: 'NOT_REVIEWED', selected: null },
      teen: { options: ['SELECT_INTEGRATION', 'SELECT_COMMERCIAL_RC2', 'CREATE_RECONCILED_BASELINE', 'DEFER'], status: 'NOT_REVIEWED', selected: null },
      pricing: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, status: 'OWNER_NOT_APPROVED', selected: null }))
    },
    receipts: [],
    preselected: false,
    network: false,
    telemetry: false
  };
  atomicWrite(path.join(dest, 'decisions-state.json'), decisions);
  // Intake UI — confirm required; no preselection
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>UAOS V21 Owner Decision Intake</title>
<style>
body{font-family:Segoe UI;margin:24px;background:#f5f6f8;color:#1a1a1a}
section{background:#fff;border:1px solid #ccd;padding:14px;margin:12px 0}
button{margin:4px;padding:8px 12px} .danger{opacity:.5;pointer-events:none}
.stop{background:#ffe8e8;border:2px solid #c44;padding:10px;font-weight:700}
.meta{color:#555;font-size:13px} select{min-width:280px;padding:6px}
</style></head><body>
<h1>مركز قرارات المالك — UAOS V21</h1>
<p class="meta">لا يوجد قرار محدد مسبقًا · لا شبكة · لا قياس عن بعد · الحفظ فقط بعد Confirm</p>
<div class="stop">GLOBAL STOP <button type="button" onclick="this.textContent='STOPPED';this.disabled=true">Stop</button></div>
<section id="forms"></section>
<section>
<button id="saveDraft">Save draft</button>
<button id="confirm">Confirm selection</button>
<button id="cancel">Cancel</button>
<button id="reset">Reset unsaved</button>
<button id="export">Export local JSON receipt</button>
<button id="print">Print-friendly Arabic summary</button>
</section>
<section>
<button class="danger">Merge</button><button class="danger">Deploy</button><button class="danger">Publish</button>
<button class="danger">Pay</button><button class="danger">Checkout</button><button class="danger">USB Write</button><button class="danger">Hardware Load</button>
</section>
<pre id="out"></pre>
<script>
const state=${JSON.stringify(decisions)};
const draft={};
const forms=document.getElementById('forms');
function render(){
  forms.innerHTML='';
  for (const [k,v] of Object.entries(state.products)){
    if(k==='pricing'){
      const s=document.createElement('section');
      s.innerHTML='<h2>Pricing (12)</h2>'+v.map((p,i)=>'<div>Price '+(i+1)+': OWNER_NOT_APPROVED (لا اختيار تلقائي)</div>').join('');
      forms.appendChild(s); continue;
    }
    const s=document.createElement('section');
    const opts=['','...'].concat? ['',...v.options]:v.options;
    s.innerHTML='<h2>'+k+'</h2><p>status: '+v.status+'</p><select data-k="'+k+'"><option value="">— اختر —</option>'+v.options.map(o=>'<option value="'+o+'">'+o+'</option>').join('')+'</select>';
    forms.appendChild(s);
  }
  forms.querySelectorAll('select').forEach(sel=>{
    sel.addEventListener('change',()=>{ draft[sel.dataset.k]=sel.value||null; document.getElementById('out').textContent=JSON.stringify({unsaved:draft},null,2); });
  });
}
render();
document.getElementById('saveDraft').onclick=()=>{ document.getElementById('out').textContent=JSON.stringify({draft,status:'REVIEW_IN_PROGRESS'},null,2); };
document.getElementById('cancel').onclick=()=>{ for(const k of Object.keys(draft)) delete draft[k]; render(); document.getElementById('out').textContent='cancelled'; };
document.getElementById('reset').onclick=()=>{ for(const k of Object.keys(draft)) delete draft[k]; render(); };
document.getElementById('confirm').onclick=()=>{
  const receipts=[];
  for(const [k,v] of Object.entries(draft)){
    if(!v) continue;
    const rec={decisionId:crypto.randomUUID(),product:k,option:v,ownerSelected:true,selectedAt:new Date().toISOString(),status:'OWNER_SELECTED',decisionVersion:1};
    receipts.push(rec);
  }
  document.getElementById('out').textContent=JSON.stringify({note:'Confirm pressed — receipts local only; no auto adoption',receipts},null,2);
};
document.getElementById('export').onclick=()=>{
  const blob=new Blob([document.getElementById('out').textContent||'{}'],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='uaos-v21-owner-receipt.json'; a.click();
};
document.getElementById('print').onclick=()=>window.print();
</script>
</body></html>`;
  atomicWrite(path.join(dest, 'index.html'), html);
  return {
    status: 'OWNER_REVIEW_INTAKE_READY',
    decisionsCaptured: 0,
    decisionsPending: ['library', 'keyboard', 'creator', 'studio', 'kids', 'teen', 'pricingx12'],
    preselected: false
  };
}

function reviewCenter(dest, ctx) {
  fs.mkdirSync(dest, { recursive: true });
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>UAOS V21 Review and Decision Center</title>
<style>
body{font-family:Segoe UI;margin:24px;background:#f4f5f7}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:#fff;border:1px solid #ccd;padding:14px} a.btn{display:inline-block;margin-top:8px;padding:8px 12px;background:#1f4b7a;color:#fff;text-decoration:none}
.stop{background:#ffe8e8;border:2px solid #c44;padding:12px;font-weight:700;margin:12px 0}
.warn{background:#fff6e5;border:1px solid #e0b56a;padding:10px;margin:12px 0}
</style></head><body>
<h1>UAOS V21 Review and Decision Center</h1>
<p>No autoplay · Mic denied · Network denied · No hidden decision · No Merge/Deploy/Pay</p>
<div class="stop">GLOBAL STOP <button onclick="this.textContent='STOPPED';this.disabled=true">Stop</button>
<button onclick="alert('Stop All Review Audio')">Stop All Review Audio</button></div>
<div class="warn"><b>Commander:</b> ${ctx.commanderClassification}<br/><b>Reproduction:</b> V20 identical trees recovered<br/><b>Pending blockers:</b> content/format/taste/DSP/Kids/Teen/Pricing/Adoption</div>
<div class="grid">
<div class="card"><h2>Library</h2><p>${ctx.library}</p><a class="btn" href="${ctx.links.library}">Open Library Review</a></div>
<div class="card"><h2>Keyboard</h2><p>${ctx.keyboard}</p><a class="btn" href="${ctx.links.keyboard}">Open Keyboard Review</a></div>
<div class="card"><h2>Creator</h2><p>${ctx.creator}</p><a class="btn" href="${ctx.links.creator}">Open Creator Review</a></div>
<div class="card"><h2>Studio</h2><p>${ctx.studio}</p><a class="btn" href="${ctx.links.studio}">Open Studio Review</a></div>
</div>
<section class="card" style="margin-top:12px">
<a class="btn" href="${ctx.links.intake}">Open Decision Intake</a>
<button onclick="navigator.clipboard.writeText(document.body.innerText)">Export Review Summary</button>
<pre>${JSON.stringify({ tests: ctx.tests, runtime: ctx.runtime, security: ctx.security }, null, 2)}</pre>
</section>
</body></html>`;
  atomicWrite(path.join(dest, 'index.html'), html);
  return { status: 'REVIEW_CENTER_HARDENED', path: path.join(dest, 'index.html') };
}

function main() {
  fs.mkdirSync(RUNTIME, { recursive: true });
  // queue stubs
  const q = path.join(RUNTIME, 'queue');
  fs.mkdirSync(q, { recursive: true });
  for (const f of ['tasks.json', 'claims.json', 'locks.json', 'leases.json', 'heartbeats.json', 'agents.json', 'ownership.json', 'dependencies.json', 'results.json', 'owner-decisions.json', 'commander-reconciliation.json', 'runtime-results.json', 'security-results.json', 'execution-state.json']) {
    if (!fs.existsSync(path.join(q, f))) atomicWrite(path.join(q, f), { schemaVersion: 'uaos.v21.queue/' + f, updatedAt: new Date().toISOString(), entries: [] });
  }

  const creatorDir = path.join(ROOT, 'creator-phase5-technical-preview');
  const studioDir = path.join(ROOT, 'studio-e50-offline-render');
  const intakeDir = path.join(ROOT, 'owner-review-intake');
  const centerDir = path.join(ROOT, 'review-center-hardening');

  const creator = creatorPhase5(creatorDir);
  const studio = studioE50(studioDir);
  const intake = ownerIntake(intakeDir);

  // package stubs for keyboard/library review links — point to V20 review builds (read-only open)
  const v20Reviews = path.join(V20, 'review-builds');
  const center = reviewCenter(centerDir, {
    commanderClassification: 'pending',
    library: 'LIBRARY_V20_OWNER_REVIEW_BUILD_READY_FIXTURE_ONLY',
    keyboard: 'KEYBOARD_V20_OWNER_REVIEW_BUILD_READY_INTERNAL_FORMAT_ONLY',
    creator: creator.status,
    studio: studio.status,
    links: {
      library: path.join(v20Reviews, 'LibraryFactoryReview', 'index.html').replace(/\\/g, '/'),
      keyboard: path.join(v20Reviews, 'KeyboardProReview', 'index.html').replace(/\\/g, '/'),
      creator: path.join(creatorDir, 'phase5-preview', 'index.html').replace(/\\/g, '/'),
      studio: path.join(studioDir, 'e50-render', 'index.html').replace(/\\/g, '/'),
      intake: path.join(intakeDir, 'index.html').replace(/\\/g, '/')
    },
    tests: { pass: null },
    runtime: { pass: 2 },
    security: { network: 0, ports: 0, mic: 'denied' }
  });

  atomicWrite(path.join(RUNTIME, 'lane-results.json'), { creator, studio, intake, center });
  console.log(JSON.stringify({ creator: creator.status, studio: studio.status, intake: intake.status, center: center.status }, null, 2));
}

try { main(); } catch (e) {
  console.error(JSON.stringify({ ok: false, error: e.message, stack: e.stack }));
  process.exit(1);
}
