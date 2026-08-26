#!/usr/bin/env node
/**
 * UAOS MASTER PROGRAM TREE V1 — Portfolio generator
 * Emits complete portfolio/epics/tasks/deps + contracts. No Commander activation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const RUNTIME = 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\program-tree';
const WORKTREES = 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution';
const ARTIFACTS = 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\uaos-program-tree';
const REPORTS = 'C:\\keyboard-manager-clean\\uaos-reports\\program-tree';
const V21_ZIP = 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts\\platform-v21-owner-review-offline-render\\run-20260804-215604\\UAOS-V21-EVIDENCE-20260804-215604.zip';
const V21_SHA = '5F5C44C1AE9669269A0F55623768D5855850FA931F60B76BCA7F84448FE878B6';

const STATES = [
  'DISCOVERED','READY','CLAIMED','PREPARING','IMPLEMENTING','TESTING','REVIEWING',
  'INTEGRATION_READY','OWNER_GATE','BLOCKED_BY_DEPENDENCY','BLOCKED_BY_CONTENT',
  'BLOCKED_BY_FORMAT','BLOCKED_BY_HARDWARE','BLOCKED_BY_LEGAL','RETRY_READY','FAILED','DONE'
];

const TRAINS = [
  { id: 'RC1-COMMERCIAL-EARLY-ACCESS', priority: 1, goal: 'Fastest commercial path' },
  { id: 'R1-STABLE-COMMERCIAL', priority: 2, goal: 'Stable commercial after RC1' },
  { id: 'R2-PRO-HARDWARE-AND-REALTIME', priority: 3, goal: 'Hardware writers + realtime DSP' },
  { id: 'R3-AI-CLOUD-MARKETPLACE', priority: 4, goal: 'AI/cloud/marketplace expansion' }
];

const DOMAINS = [
  ['00-ORCHESTRATION','Orchestration fabric'],
  ['01-SHARED-PLATFORM','Shared platform contracts'],
  ['02-LIBRARY-FACTORY','Library Factory'],
  ['03-KEYBOARD-PRO','Keyboard Pro'],
  ['04-KEYBOARD-CONVERTERS','Keyboard Converters'],
  ['05-CREATOR','Creator'],
  ['06-STUDIO-PRO','Studio Pro'],
  ['07-SINGY-CORE','Singy Core'],
  ['08-SINGY-KIDS','Singy Kids'],
  ['09-SINGY-TEEN','Singy Teen'],
  ['10-CONTENT-ASSETS','Content and musical assets'],
  ['11-COMMERCIAL-PLATFORM','Commercial platform'],
  ['12-WEBSITE-DELIVERY','Website and delivery'],
  ['13-SECURITY-LEGAL','Security and legal'],
  ['14-QA-RELEASE-OPERATIONS','QA release operations'],
  ['15-COMMANDER-FUTURE-ADAPTER','Future Commander adapter only']
];

function ensure(dir){ fs.mkdirSync(dir,{recursive:true}); }
function write(p, obj){
  ensure(path.dirname(p));
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  fs.writeFileSync(p, body.endsWith('\n') ? body : body + '\n', 'utf8');
}
function sha256File(p){ return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase(); }
function now(){ return new Date().toISOString(); }
function slug(s){ return String(s).toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,''); }

const epics = [];
const tasks = [];
const deps = [];
const fileOwnership = {};
const ownerGates = [];
const risks = [];
let taskSeq = 0;
let epicSeq = 0;

function addEpic({ domain, title, train, rc1Focus=false, description }) {
  epicSeq += 1;
  const id = `EPIC-${domain.split('-')[0]}-${String(epicSeq).padStart(4,'0')}-${slug(title).slice(0,48)}`;
  const epic = { id, domain, title, description: description || title, releaseTrain: train, rc1Focus, status: 'ACTIVE', createdAt: now() };
  epics.push(epic);
  return epic;
}

function addTask({
  epic, title, phase, train, state='DISCOVERED', estimateMin=60, estimateMax=180,
  inputs=[], acceptance=[], tests=[], evidence=[], allowedPaths=[], gate=null,
  blockedReason=null, rc1=false, ownerFile=null, priority=50
}) {
  taskSeq += 1;
  const id = `TASK-${epic.domain.split('-')[0]}-${String(taskSeq).padStart(5,'0')}-${slug(title).slice(0,40)}`;
  const worktree = path.join(WORKTREES, id.toLowerCase());
  const owner = ownerFile || path.join(worktree, 'src', `${slug(title).toLowerCase().slice(0,32)}.mjs`);
  fileOwnership[owner] = id;
  const task = {
    id,
    epicId: epic.id,
    domain: epic.domain,
    title,
    phase, // DEFINE | IMPLEMENT | TEST | EVIDENCE | GATE
    releaseTrain: train || epic.releaseTrain,
    state,
    priority: rc1 ? Math.min(priority, 10) : priority,
    estimateMinutesMin: estimateMin,
    estimateMinutesMax: estimateMax,
    inputs,
    acceptanceCriteria: acceptance.length ? acceptance : [
      `${title} contract file exists`,
      `Unit assertions pass for ${title}`,
      `Evidence JSON written with SHA256`
    ],
    tests: tests.length ? tests : [`node --test ${path.join(worktree,'tests','main.test.mjs')}`],
    evidence: evidence.length ? evidence : [`${worktree}/evidence/result.json`],
    allowedPaths: allowedPaths.length ? allowedPaths : [worktree, path.join(ARTIFACTS, id)],
    ownerFile: owner,
    worktree,
    gate,
    blockedReason,
    rc1Critical: !!rc1,
    claims: [],
    lease: null,
    heartbeats: [],
    createdAt: now(),
    updatedAt: now()
  };
  tasks.push(task);
  return task;
}

function link(fromId, toId, type='BLOCKS') {
  deps.push({ from: fromId, to: toId, type });
}

function chainEpicTasks(epic, features, { train, rc1=false, defaultState='READY', gateState=null, gateReason=null, priority=40 }) {
  const created = [];
  for (const feature of features) {
    const name = typeof feature === 'string' ? feature : feature.name;
    const fGate = typeof feature === 'object' ? feature.gate : null;
    const fState = typeof feature === 'object' && feature.state ? feature.state : (fGate ? gateState : defaultState);
    const fReason = typeof feature === 'object' ? feature.reason : gateReason;
    const fTrain = typeof feature === 'object' && feature.train ? feature.train : train;
    const fRc1 = typeof feature === 'object' && feature.rc1 != null ? feature.rc1 : rc1;

    const define = addTask({
      epic, title: `${name} contract`, phase: 'DEFINE', train: fTrain, state: fState === 'READY' || fState === 'DISCOVERED' ? 'READY' : fState,
      estimateMin: 30, estimateMax: 90, rc1: fRc1, priority: fRc1 ? 8 : priority,
      gate: fGate, blockedReason: fReason,
      acceptance: [`Schema for ${name} exists`, `Allowed paths documented`, `No ambiguous human-only steps`]
    });
    const impl = addTask({
      epic, title: `${name} implementation`, phase: 'IMPLEMENT', train: fTrain,
      state: 'BLOCKED_BY_DEPENDENCY', blockedReason: `Depends on ${define.id}`,
      estimateMin: 60, estimateMax: 240, rc1: fRc1, priority: fRc1 ? 9 : priority + 1,
      gate: fGate
    });
    const test = addTask({
      epic, title: `${name} tests`, phase: 'TEST', train: fTrain,
      state: 'BLOCKED_BY_DEPENDENCY', blockedReason: `Depends on ${impl.id}`,
      estimateMin: 45, estimateMax: 180, rc1: fRc1, priority: fRc1 ? 10 : priority + 2,
      gate: fGate
    });
    const evid = addTask({
      epic, title: `${name} evidence`, phase: 'EVIDENCE', train: fTrain,
      state: 'BLOCKED_BY_DEPENDENCY', blockedReason: `Depends on ${test.id}`,
      estimateMin: 30, estimateMax: 120, rc1: fRc1, priority: fRc1 ? 11 : priority + 3,
      gate: fGate
    });
    link(define.id, impl.id);
    link(impl.id, test.id);
    link(test.id, evid.id);
    if (fGate) {
      ownerGates.push({
        id: `GATE-${slug(name)}-${define.id.slice(-8)}`,
        taskId: evid.id,
        gateType: fGate,
        status: 'OPEN',
        description: `${name} requires ${fGate} before activation beyond preparation`,
        autoApprove: false
      });
    }
    created.push({ define, impl, test, evid, name });
  }
  return created;
}

// ---------- Wave 0 / Orchestration ----------
const orch = addEpic({ domain: '00-ORCHESTRATION', title: 'Program tree fabric', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
const wave0Features = [
  'Recover V15-V21 evidence index',
  'Portfolio tree materialization',
  'Schema validation suite',
  'Dependency DAG validation',
  'Cycle detection',
  'Allowed path validation',
  'Queue initialization',
  'Protected repository verification',
  'Claim lease heartbeat fabric',
  'Agent client registration',
  'Evidence contract enforcement',
  'Stale worker reclamation',
  'Dashboard status publisher',
  'Automatic READY promotion'
];
chainEpicTasks(orch, wave0Features, { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, defaultState: 'READY', priority: 1 });

// ---------- Shared Platform ----------
const shared = addEpic({ domain: '01-SHARED-PLATFORM', title: 'Shared product platform', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(shared, [
  'Shared project identity','Project schemas','Atomic save','Autosave','Recovery','Migration',
  'Undo redo','Evidence records','Error envelope','Capability registry','Entitlements',
  'Offline trial','Signed licenses','Product IDs','Customer license receipts','Update manifests',
  'Installer packaging','Portable packaging','Versioning','About screen','Privacy notices',
  'Localization Arabic','Localization English','Localization German','Accessibility baseline',
  'Crash logging local only','Support bundle','Export import user data','Single instance',
  'Global Stop contract','No autoplay contract','Permission denial contract',
  'Network disabled operation','No listening port verification','Process cleanup'
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 5 });

// ---------- Library Factory ----------
const lib = addEpic({ domain: '02-LIBRARY-FACTORY', title: 'Library Factory full tree', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(lib, [
  { name: 'User-supplied WAV ingestion', rc1: true },
  { name: 'Source scanning', rc1: true },
  { name: 'SHA256 inventory', rc1: true },
  { name: 'Provenance', rc1: true },
  { name: 'License ledger', rc1: true },
  { name: 'Sample mapping', rc1: true },
  { name: 'Note mapping', rc1: true },
  { name: 'Velocity layers', rc1: true },
  { name: 'Round robin', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Articulations', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Loop metadata', rc1: true },
  { name: 'Choke groups', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Sustain', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Voice lifecycle', rc1: true },
  { name: 'Sampler runtime', rc1: true },
  { name: 'Preview player', rc1: true },
  { name: 'Catalog', rc1: true },
  { name: 'Transactional build', rc1: true },
  { name: 'Staging', rc1: true },
  { name: 'Rollback', rc1: true },
  { name: 'Journal', rc1: true },
  { name: 'Locks', rc1: true },
  { name: 'Stale recovery', rc1: true },
  { name: 'Packaging', rc1: true },
  { name: 'Library validation', rc1: true },
  { name: 'Commercial content acquisition', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner content approval required' },
  { name: 'Public-domain content pipeline', train: 'R1-STABLE-COMMERCIAL', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'License evidence required' },
  { name: 'Contributor pipeline', train: 'R3-AI-CLOUD-MARKETPLACE', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Contributor legal terms required' },
  { name: 'Marketplace-ready package model', train: 'R3-AI-CLOUD-MARKETPLACE' },
  { name: 'Owner content approval', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner content selection required' }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 6 });

// ---------- Keyboard Pro ----------
const kbd = addEpic({ domain: '03-KEYBOARD-PRO', title: 'Keyboard Pro full tree', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(kbd, [
  { name: 'Internal project format', rc1: true },
  { name: 'Set Doctor', rc1: true },
  { name: 'Magic Set', rc1: true },
  { name: 'Generate My Set', rc1: true },
  { name: 'Catalog', rc1: true },
  { name: 'Inspector', rc1: true },
  { name: 'Preview', rc1: true },
  { name: 'Media references', rc1: true },
  { name: 'Migration', rc1: true },
  { name: 'Validation', rc1: true },
  { name: 'Error recovery', rc1: true },
  { name: 'Format capability registry', rc1: true },
  { name: 'KORG inspection', rc1: true, gate: 'FORMAT_GATE' },
  { name: 'Yamaha inspection', train: 'R1-STABLE-COMMERCIAL', gate: 'FORMAT_GATE', state: 'BLOCKED_BY_FORMAT', reason: 'Yamaha format contract pending' },
  { name: 'Roland inspection', train: 'R1-STABLE-COMMERCIAL', gate: 'FORMAT_GATE', state: 'BLOCKED_BY_FORMAT', reason: 'Roland format contract pending' },
  { name: 'Ketron inspection', train: 'R1-STABLE-COMMERCIAL', gate: 'FORMAT_GATE', state: 'BLOCKED_BY_FORMAT', reason: 'Ketron format contract pending' },
  { name: 'Internal conversion', rc1: true },
  { name: 'Mapping plans', rc1: true },
  { name: 'Conversion receipts', rc1: true },
  { name: 'Transactional output', rc1: true },
  { name: 'Resume recovery', rc1: true },
  { name: 'Proprietary format contracts', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner format contract required' },
  { name: 'Writer research', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'FORMAT_GATE', state: 'BLOCKED_BY_FORMAT', reason: 'Writer unsupported until format gate' },
  { name: 'KORG Writer', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'FORMAT_GATE', state: 'BLOCKED_BY_FORMAT', reason: 'WRITE_UNSUPPORTED until owner contract' },
  { name: 'USB transport', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'Hardware gate' },
  { name: 'SysEx', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'SysEx blocked until hardware gate' },
  { name: 'Hardware verification', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'Hardware verification gate' },
  { name: 'Device-specific acceptance', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'Device acceptance gate' }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 7 });

// ---------- Keyboard Converters ----------
const conv = addEpic({ domain: '04-KEYBOARD-CONVERTERS', title: 'Keyboard Converters full tree', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(conv, [
  { name: 'Input detection', rc1: true },
  { name: 'Capability registry', rc1: true },
  { name: 'Immutable snapshots', rc1: true },
  { name: 'Job queue', rc1: true },
  { name: 'Batch conversion', rc1: true },
  { name: 'Mapping engine', rc1: true },
  { name: 'Validation', rc1: true },
  { name: 'Preview', rc1: true },
  { name: 'Dry-run', rc1: true },
  { name: 'Transactional output', rc1: true },
  { name: 'Rollback', rc1: true },
  { name: 'Cancel', rc1: true },
  { name: 'Resume', rc1: true },
  { name: 'Crash recovery', rc1: true },
  { name: 'Receipts', rc1: true },
  { name: 'Deterministic manifests', rc1: true },
  { name: 'Round-trip fixtures', rc1: true },
  { name: 'Corruption rejection', rc1: true },
  { name: 'Unsupported-format reports', rc1: true },
  { name: 'Format adapter SDK', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Vendor-specific adapters', train: 'R1-STABLE-COMMERCIAL', gate: 'FORMAT_GATE', state: 'BLOCKED_BY_FORMAT', reason: 'Vendor adapters gated' },
  { name: 'Writer adapters', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'FORMAT_GATE', state: 'BLOCKED_BY_FORMAT', reason: 'Writer adapters gated' },
  { name: 'Hardware delivery adapters', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'Hardware delivery gated' }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 8 });

// ---------- Creator ----------
const creator = addEpic({ domain: '05-CREATOR', title: 'Creator full tree', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(creator, [
  { name: 'Project workspace', rc1: true },
  { name: 'MIDI tracks', rc1: true },
  { name: 'Audio references', rc1: true },
  { name: 'Note editing', rc1: true },
  { name: 'Chords', rc1: true },
  { name: 'Sections', rc1: true },
  { name: 'Arrangement graph', rc1: true },
  { name: 'Harmony rules', rc1: true },
  { name: 'Advanced Harmony', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Melody analysis', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Voice-to-Melody', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner musical review required' },
  { name: 'Voice-to-MIDI', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Pitch and rhythm analysis', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Bass generation', rc1: true },
  { name: 'Drum generation', rc1: true },
  { name: 'Instrument roles', rc1: true },
  { name: 'Orchestration', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Golden Smart Sequencer', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Deterministic sequencing', rc1: true },
  { name: 'Humanization', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Arrangement Brain', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Musical Brain', train: 'R3-AI-CLOUD-MARKETPLACE', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Musical quality unproven' },
  { name: 'Style and emotion intent', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Musical critic', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner taste review required' },
  { name: 'Refinement cycles', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Technical preview', rc1: true },
  { name: 'Production preview', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner listening required' },
  { name: 'MIDI import export', rc1: true },
  { name: 'WAV export', rc1: true },
  { name: 'Stem export', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Project recovery', rc1: true },
  { name: 'Owner musical review loops', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner listening and taste review' },
  { name: 'Taste datasets and review receipts', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Taste datasets require owner' }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 7 });

// ---------- Studio Pro ----------
const studio = addEpic({ domain: '06-STUDIO-PRO', title: 'Studio Pro full tree', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(studio, [
  { name: 'Project system', rc1: true },
  { name: 'Timeline', rc1: true },
  { name: 'Audio tracks', rc1: true },
  { name: 'MIDI tracks', rc1: true },
  { name: 'Clip editing', rc1: true },
  { name: 'Markers', rc1: true },
  { name: 'Regions', rc1: true },
  { name: 'Tempo map', rc1: true },
  { name: 'Time signatures', rc1: true },
  { name: 'Transport', rc1: true },
  { name: 'Scheduler', rc1: true },
  { name: 'Mixer', rc1: true },
  { name: 'Master bus', rc1: true },
  { name: 'Gain pan', rc1: true },
  { name: 'Mute solo', rc1: true },
  { name: 'Sends returns', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Non-destructive edits', rc1: true },
  { name: 'Offline render', rc1: true },
  { name: 'Real-time DSP', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'FORMAT_GATE', state: 'BLOCKED_BY_DEPENDENCY', reason: 'FUTURE_TECHNICAL_PHASE_REQUIRED REAL_TIME_DSP_NOT_IMPLEMENTED' },
  { name: 'ASIO', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'ASIO hardware gate' },
  { name: 'Audio device management', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'Device management gated' },
  { name: 'Recording', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'Recording gated' },
  { name: 'Punch in out', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Monitoring', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'MIDI piano roll', rc1: true },
  { name: 'Automation', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Plugin hosting', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Sampler integration', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Freeze render', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Stem export', rc1: true },
  { name: 'Mastering', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Loudness', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Commercial export', rc1: true },
  { name: 'Recovery', rc1: true },
  { name: 'Crash-safe sessions', rc1: true }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 7 });

// ---------- Singy Core ----------
const singyCore = addEpic({ domain: '07-SINGY-CORE', title: 'Singy Core full tree', train: 'R1-STABLE-COMMERCIAL' });
chainEpicTasks(singyCore, [
  { name: 'Conversational musical brain', train: 'R3-AI-CLOUD-MARKETPLACE' },
  { name: 'Child-safe conversation', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true },
  { name: 'Teen-safe conversation', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true },
  { name: 'Pedagogical planner', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Lesson generator', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Exercise generator', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Feedback engine', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Music theory tutor', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Instrument tutor', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Singing tutor', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Rhythm tutor', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Listening tutor', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Composition tutor', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Arrangement tutor', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Parent controls', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true },
  { name: 'Teacher controls', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Progress model', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true },
  { name: 'Local profile', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true },
  { name: 'Multilingual Arabic English German', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true },
  { name: 'Voice input', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Speech output', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Safety filters', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true },
  { name: 'Age adaptation', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true },
  { name: 'Emotional adaptation', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Musical games', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Ensemble learning', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Band simulation', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Operetta creation', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Children learning instruments', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Interactive musician conversations', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Offline model adapters', train: 'R2-PRO-HARDWARE-AND-REALTIME' },
  { name: 'Optional cloud model adapters', train: 'R3-AI-CLOUD-MARKETPLACE', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Cloud adapters owner gate' },
  { name: 'Content moderation', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true },
  { name: 'Curriculum versioning', train: 'R1-STABLE-COMMERCIAL' }
], { train: 'R1-STABLE-COMMERCIAL', priority: 20 });

// ---------- Singy Kids ----------
const kids = addEpic({ domain: '08-SINGY-KIDS', title: 'Singy Kids full tree', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(kids, [
  { name: 'Parent gate', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Kids OWNER_DECISION_REQUIRED' },
  { name: 'Age bands', rc1: true },
  { name: 'Beginner curriculum', rc1: true },
  { name: 'Instrument recognition', rc1: true },
  { name: 'Note recognition', rc1: true },
  { name: 'Rhythm games', rc1: true },
  { name: 'Singing exercises', rc1: true },
  { name: 'Instrument lessons', rc1: true },
  { name: 'Story-based music lessons', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Operetta participation', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Rewards without addictive dark patterns', rc1: true },
  { name: 'Local progress', rc1: true },
  { name: 'Accessibility', rc1: true },
  { name: 'Offline lessons', rc1: true },
  { name: 'Safe AI conversation', rc1: true },
  { name: 'Parent reports', rc1: true },
  { name: 'Teacher packs', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Content packs', train: 'R1-STABLE-COMMERCIAL', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'Content packs need license evidence' },
  { name: 'Subscription and family licensing', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Pricing OWNER_NOT_APPROVED' },
  { name: 'Child privacy compliance', rc1: true, gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Legal review required' }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 12 });

// ---------- Singy Teen ----------
const teen = addEpic({ domain: '09-SINGY-TEEN', title: 'Singy Teen full tree', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(teen, [
  { name: 'Guided music projects', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Teen OWNER_DECISION_REQUIRED' },
  { name: 'Beat making', rc1: true },
  { name: 'Chord progressions', rc1: true },
  { name: 'MIDI composition', rc1: true },
  { name: 'Arrangement', rc1: true },
  { name: 'Recording fundamentals', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'Recording hardware gate' },
  { name: 'Studio fundamentals', rc1: true },
  { name: 'Song structure', rc1: true },
  { name: 'Instrument practice', rc1: true },
  { name: 'Singing practice', rc1: true },
  { name: 'Portfolio projects', rc1: true },
  { name: 'Local progress', rc1: true },
  { name: 'Safe tutor conversation', rc1: true },
  { name: 'Teacher review', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Exportable projects', rc1: true },
  { name: 'Collaboration architecture', train: 'R3-AI-CLOUD-MARKETPLACE' },
  { name: 'Cloud sharing architecture', train: 'R3-AI-CLOUD-MARKETPLACE', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Cloud sharing owner gate' },
  { name: 'Teen privacy and moderation', rc1: true, gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Teen privacy legal gate' },
  { name: 'Subscription and education licensing', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Pricing OWNER_NOT_APPROVED' }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 12 });

// ---------- Content Assets ----------
const content = addEpic({ domain: '10-CONTENT-ASSETS', title: 'Content and musical assets', train: 'R1-STABLE-COMMERCIAL' });
chainEpicTasks(content, [
  { name: 'Public-domain source discovery', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'No fictional licenses; evidence required' },
  { name: 'Permissive-license verification', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'License verification required' },
  { name: 'License evidence', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'License evidence required' },
  { name: 'Attribution', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Attribution evidence required' },
  { name: 'Audio recording specifications', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Instrument recording', train: 'R2-PRO-HARDWARE-AND-REALTIME', gate: 'HARDWARE_GATE', state: 'BLOCKED_BY_HARDWARE', reason: 'Recording hardware' },
  { name: 'Sample editing', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Loop editing', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Quality review', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner quality review' },
  { name: 'Oud asset pipeline', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'No fabricated content' },
  { name: 'Qanun asset pipeline', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'No fabricated content' },
  { name: 'Ney asset pipeline', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'No fabricated content' },
  { name: 'Darbuka asset pipeline', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'No fabricated content' },
  { name: 'Oriental percussion pipeline', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'No fabricated content' },
  { name: 'Piano asset pipeline', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'No fabricated content' },
  { name: 'Strings asset pipeline', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'No fabricated content' },
  { name: 'Drums asset pipeline', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'No fabricated content' },
  { name: 'Educational lesson media', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Kids curriculum media', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Kids decision required' },
  { name: 'Teen projects media', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Teen decision required' },
  { name: 'Operetta content', train: 'R1-STABLE-COMMERCIAL', gate: 'CONTENT_GATE', state: 'BLOCKED_BY_CONTENT', reason: 'Content gate' },
  { name: 'Legal content ledger', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Legal ledger required' },
  { name: 'Commercial package approval', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Commercial package owner approval' }
], { train: 'R1-STABLE-COMMERCIAL', priority: 30 });

// ---------- Commercial ----------
const commercial = addEpic({ domain: '11-COMMERCIAL-PLATFORM', title: 'Commercial platform', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(commercial, [
  { name: 'Product catalog', rc1: true },
  { name: 'SKUs', rc1: true },
  { name: 'Pricing', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: '12x OWNER_NOT_APPROVED' },
  { name: 'Trial', rc1: true },
  { name: 'License generation', rc1: true },
  { name: 'License delivery', rc1: true },
  { name: 'Checkout preparation', rc1: true },
  { name: 'Payments activation', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Payment activation owner gate; no auto activate' },
  { name: 'VAT handling', train: 'R1-STABLE-COMMERCIAL', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'VAT legal gate' },
  { name: 'Invoices', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Refund policy', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner policy gate' },
  { name: 'Customer accounts', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Download entitlement', rc1: true },
  { name: 'Update entitlement', rc1: true },
  { name: 'Support tickets', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Knowledge base', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Release notes', rc1: true },
  { name: 'Privacy commercial', rc1: true },
  { name: 'EULA', rc1: true, gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Legal gate' },
  { name: 'Terms', rc1: true, gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Legal gate' },
  { name: 'Commercial readiness gates', rc1: true },
  { name: 'Founder launch', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner final launch gate' },
  { name: 'Closed beta', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner beta gate' },
  { name: 'Early access', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner early access gate' },
  { name: 'Stable release', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Owner stable release gate' },
  { name: 'Bundles', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Pricing unapproved' },
  { name: 'Educational plans', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Pricing unapproved' },
  { name: 'Family plans', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Pricing unapproved' }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 4 });

// ---------- Website ----------
const web = addEpic({ domain: '12-WEBSITE-DELIVERY', title: 'Website and delivery', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(web, [
  { name: 'Main site', rc1: true },
  { name: 'Product pages', rc1: true },
  { name: 'Kids page', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Kids decision required' },
  { name: 'Teen page', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Teen decision required' },
  { name: 'Library page', rc1: true },
  { name: 'Keyboard page', rc1: true },
  { name: 'Creator page', rc1: true },
  { name: 'Studio page', rc1: true },
  { name: 'Pricing page', rc1: true, gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Pricing unapproved' },
  { name: 'Trial download', rc1: true },
  { name: 'Checkout integration prep', rc1: true },
  { name: 'Customer portal', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Documentation', rc1: true },
  { name: 'Support', rc1: true },
  { name: 'Status page', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Update feed', rc1: true },
  { name: 'Download hosting prep', rc1: true },
  { name: 'Analytics privacy mode', rc1: true },
  { name: 'SEO', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Website Arabic English German', rc1: true },
  { name: 'Website accessibility', rc1: true },
  { name: 'Legal pages', rc1: true, gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Legal pages gated' },
  { name: 'Release announcements', train: 'R1-STABLE-COMMERCIAL' }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 9 });

// ---------- Security Legal ----------
const legal = addEpic({ domain: '13-SECURITY-LEGAL', title: 'Security and legal', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(legal, [
  { name: 'Threat model baseline', rc1: true },
  { name: 'Local data protection', rc1: true },
  { name: 'No listening ports policy', rc1: true },
  { name: 'Secret scanning policy', rc1: true },
  { name: 'EULA drafting', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Legal drafting' },
  { name: 'Privacy policy drafting', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Legal drafting' },
  { name: 'Child privacy compliance framework', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Legal gate' },
  { name: 'Content license compliance audits', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'No fictional licenses' },
  { name: 'Export control review', gate: 'LEGAL_GATE', state: 'BLOCKED_BY_LEGAL', reason: 'Legal gate' },
  { name: 'Signed update chain', train: 'R1-STABLE-COMMERCIAL' }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 3 });

// ---------- QA ----------
const qa = addEpic({ domain: '14-QA-RELEASE-OPERATIONS', title: 'QA release operations', train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1Focus: true });
chainEpicTasks(qa, [
  { name: 'Unit tests fabric', rc1: true },
  { name: 'Integration tests fabric', rc1: true },
  { name: 'End-to-end tests fabric', rc1: true },
  { name: 'Runtime acceptance', rc1: true },
  { name: 'Clean machine', rc1: true },
  { name: 'Portable validation', rc1: true },
  { name: 'Installer validation', rc1: true },
  { name: 'Restart acceptance', rc1: true },
  { name: 'Recovery acceptance', rc1: true },
  { name: 'Upgrade acceptance', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Uninstall acceptance', rc1: true },
  { name: 'Data preservation', rc1: true },
  { name: 'Security tests', rc1: true },
  { name: 'Privacy tests', rc1: true },
  { name: 'Performance tests', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Stress tests', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Accessibility tests', rc1: true },
  { name: 'Localization tests', rc1: true },
  { name: 'Release signing', train: 'R1-STABLE-COMMERCIAL', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'Signing owner gate' },
  { name: 'Artifact registry', rc1: true },
  { name: 'SHA256 evidence', rc1: true },
  { name: 'SBOM', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Dependency audit', rc1: true },
  { name: 'Backup operations', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Old-laptop server', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Monitoring', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Incident response', train: 'R1-STABLE-COMMERCIAL' },
  { name: 'Rollback operations', rc1: true },
  { name: 'Customer support evidence bundles', rc1: true }
], { train: 'RC1-COMMERCIAL-EARLY-ACCESS', rc1: true, priority: 2 });

// ---------- Commander Future Adapter (contracts only) ----------
const cmd = addEpic({ domain: '15-COMMANDER-FUTURE-ADAPTER', title: 'Future Commander adapter contracts', train: 'R1-STABLE-COMMERCIAL' });
const cmdTasks = chainEpicTasks(cmd, [
  { name: 'Commander adapter contract', state: 'READY' },
  { name: 'Commander readiness checklist', state: 'READY' },
  { name: 'Commander event schema', state: 'READY' },
  { name: 'Commander command schema', state: 'READY' },
  { name: 'Commander result schema', state: 'READY' },
  { name: 'listTasks adapter surface', state: 'READY' },
  { name: 'claimTask adapter surface', state: 'READY' },
  { name: 'renewLease adapter surface', state: 'READY' },
  { name: 'reportHeartbeat adapter surface', state: 'READY' },
  { name: 'reportProgress adapter surface', state: 'READY' },
  { name: 'attachEvidence adapter surface', state: 'READY' },
  { name: 'submitResult adapter surface', state: 'READY' },
  { name: 'requestReview adapter surface', state: 'READY' },
  { name: 'releaseClaim adapter surface', state: 'READY' },
  { name: 'pauseQueue adapter surface', state: 'READY' },
  { name: 'resumeQueue adapter surface', state: 'READY' },
  { name: 'Commander activation', gate: 'OWNER_GATE', state: 'OWNER_GATE', reason: 'COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED; do not open Commander repo' }
], { train: 'R1-STABLE-COMMERCIAL', priority: 40 });

// Cross-product RC1 completion -> auto-open R1 successor stubs (represented as READY promotion deps)
risks.push(
  { id: 'RISK-001', severity: 'HIGH', title: 'Owner decisions block Kids/Teen/Pricing', mitigation: 'Keep OWNER_GATE tasks visible; never auto-approve' },
  { id: 'RISK-002', severity: 'HIGH', title: 'KORG write unsupported', mitigation: 'Keep WRITE_UNSUPPORTED tasks gated; inspection only in RC1' },
  { id: 'RISK-003', severity: 'HIGH', title: 'Musical quality unproven', mitigation: 'Technical WAV success != musical quality; keep taste gates' },
  { id: 'RISK-004', severity: 'MEDIUM', title: 'Realtime DSP not implemented', mitigation: 'Offline render core only until R2' },
  { id: 'RISK-005', severity: 'CRITICAL', title: 'No fictional content licenses', mitigation: 'Content tasks blocked until real evidence' },
  { id: 'RISK-006', severity: 'HIGH', title: 'Protected V15-V21 worktrees', mitigation: 'Read-only enforcement in leader' }
);

// Detect cycles (simple DFS)
function detectCycles(edges, nodeIds) {
  const graph = new Map();
  for (const id of nodeIds) graph.set(id, []);
  for (const e of edges) {
    if (!graph.has(e.from)) graph.set(e.from, []);
    graph.get(e.from).push(e.to);
  }
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];
  function dfs(n, stack) {
    if (visiting.has(n)) { cycles.push([...stack, n]); return; }
    if (visited.has(n)) return;
    visiting.add(n); stack.push(n);
    for (const m of graph.get(n) || []) dfs(m, stack);
    stack.pop(); visiting.delete(n); visited.add(n);
  }
  for (const id of graph.keys()) dfs(id, []);
  return cycles;
}

const cycleReport = detectCycles(deps, tasks.map(t => t.id));

// Promote READY only for DEFINE tasks without blocking gates already handled
for (const t of tasks) {
  if (t.phase === 'DEFINE' && !t.gate && t.state === 'DISCOVERED') t.state = 'READY';
  if (t.phase === 'DEFINE' && t.gate && ['OWNER_GATE','BLOCKED_BY_CONTENT','BLOCKED_BY_FORMAT','BLOCKED_BY_HARDWARE','BLOCKED_BY_LEGAL'].includes(t.state)) {
    // keep blocked/gated; preparation contracts may still be READY for documentation-only
  }
}

const products = {
  schema: 'uaos.products/v1',
  generatedAt: now(),
  products: [
    { id: 'library-factory', domain: '02-LIBRARY-FACTORY', rc1Target: 'USER_SUPPLIED_CONTENT_ONLY', adoption: 'OWNER_ADOPTION_APPROVAL_REQUIRED' },
    { id: 'keyboard-pro', domain: '03-KEYBOARD-PRO', rc1Target: 'INTERNAL_FORMAT_AND_INSPECTION', adoption: 'OWNER_ADOPTION_APPROVAL_REQUIRED', korg: 'INSPECT_ONLY_WRITE_UNSUPPORTED' },
    { id: 'keyboard-converters', domain: '04-KEYBOARD-CONVERTERS', rc1Target: 'INTERNAL_CONVERSION_RECEIPTS' },
    { id: 'creator', domain: '05-CREATOR', rc1Target: 'LIMITED_MIDI_COMPOSER_AND_ARRANGEMENT_DRAFT', musicalQuality: 'MUSICAL_QUALITY_UNPROVEN' },
    { id: 'studio-pro', domain: '06-STUDIO-PRO', rc1Target: 'OFFLINE_AUDIO_MIDI_EDITOR', realtimeDsp: 'REAL_TIME_DSP_NOT_IMPLEMENTED' },
    { id: 'singy-core', domain: '07-SINGY-CORE', rc1Target: 'SHARED_SAFE_TUTOR_FOUNDATION' },
    { id: 'singy-kids', domain: '08-SINGY-KIDS', rc1Target: 'PARENT_SUPERVISED_OFFLINE_EDUCATION', decision: 'OWNER_DECISION_REQUIRED' },
    { id: 'singy-teen', domain: '09-SINGY-TEEN', rc1Target: 'OFFLINE_GUIDED_MUSIC_PROJECTS', decision: 'OWNER_DECISION_REQUIRED' }
  ]
};

const capabilities = {
  schema: 'uaos.capabilities/v1',
  generatedAt: now(),
  capabilities: tasks.filter(t => t.phase === 'DEFINE').map(t => ({
    id: `CAP-${t.id}`,
    taskId: t.id,
    domain: t.domain,
    title: t.title.replace(/ contract$/, ''),
    releaseTrain: t.releaseTrain,
    state: t.state,
    gate: t.gate
  }))
};

const portfolio = {
  schema: 'uaos.portfolio/v1',
  generatedAt: now(),
  baseline: {
    v21Status: 'UAOS_V21_CURSOR_OWNER_REVIEW_INTAKE_AND_OFFLINE_RENDER_CORE_PASS',
    v21Overall: 'UAOS_V21_REVIEW_INTAKE_READY_OFFLINE_RENDER_TECHNICALLY_PROVEN_OWNER_DECISIONS_REQUIRED',
    v21EvidenceZip: V21_ZIP,
    v21Sha256: V21_SHA,
    priorWorktrees: 'V15_TO_V21_READ_ONLY',
    commander: 'NOT_IN_SCOPE_CONTRACT_ONLY'
  },
  domains: DOMAINS.map(([id, title]) => ({ id, title })),
  counts: {
    domains: DOMAINS.length,
    epics: epics.length,
    tasks: tasks.length,
    dependencies: deps.length,
    ownerGates: ownerGates.length,
    ready: tasks.filter(t => t.state === 'READY').length,
    blocked: tasks.filter(t => String(t.state).startsWith('BLOCKED_') || t.state === 'OWNER_GATE').length
  }
};

const truth = {
  schema: 'uaos.product-truth-matrix/v1',
  generatedAt: now(),
  truths: [
    { id: 'T1', statement: 'Technical WAV success does not prove musical quality', appliesTo: ['05-CREATOR','06-STUDIO-PRO'] },
    { id: 'T2', statement: 'Fixtures are not product content', appliesTo: ['02-LIBRARY-FACTORY','10-CONTENT-ASSETS'] },
    { id: 'T3', statement: 'Studio Offline Render is not Real-time DSP', appliesTo: ['06-STUDIO-PRO'] },
    { id: 'T4', statement: 'KORG WRITE_UNSUPPORTED / INSPECT_ONLY', appliesTo: ['03-KEYBOARD-PRO'] },
    { id: 'T5', statement: 'Kids/Teen/Pricing require owner decisions; no auto adoption', appliesTo: ['08-SINGY-KIDS','09-SINGY-TEEN','11-COMMERCIAL-PLATFORM'] },
    { id: 'T6', statement: 'No fictional content licenses', appliesTo: ['10-CONTENT-ASSETS'] },
    { id: 'T7', statement: 'Commander not activated; adapter contract only', appliesTo: ['15-COMMANDER-FUTURE-ADAPTER'] }
  ]
};

const commercialMatrix = {
  schema: 'uaos.commercial-readiness-matrix/v1',
  generatedAt: now(),
  items: [
    { product: 'library-factory', rc1: 'USER_SUPPLIED_CONTENT_ONLY', ready: false, blocker: 'OWNER_ADOPTION_APPROVAL_REQUIRED' },
    { product: 'keyboard-pro', rc1: 'INTERNAL_FORMAT_AND_INSPECTION', ready: false, blocker: 'OWNER_ADOPTION_APPROVAL_REQUIRED' },
    { product: 'creator', rc1: 'LIMITED_MIDI_COMPOSER_AND_ARRANGEMENT_DRAFT', ready: false, blocker: 'MUSICAL_QUALITY_UNPROVEN' },
    { product: 'studio-pro', rc1: 'OFFLINE_AUDIO_MIDI_EDITOR', ready: false, blocker: 'REAL_TIME_DSP_FUTURE' },
    { product: 'singy-kids', rc1: 'PARENT_SUPERVISED_OFFLINE_EDUCATION', ready: false, blocker: 'OWNER_DECISION_REQUIRED' },
    { product: 'singy-teen', rc1: 'OFFLINE_GUIDED_MUSIC_PROJECTS', ready: false, blocker: 'OWNER_DECISION_REQUIRED' },
    { product: 'pricing', rc1: 'PRICING_MATRIX', ready: false, blocker: '12x OWNER_NOT_APPROVED' },
    { product: 'checkout', rc1: 'CHECKOUT_READINESS', ready: false, blocker: 'OWNER_GATE_NO_PAYMENT_ACTIVATION' },
    { product: 'website', rc1: 'WEBSITE_DELIVERY', ready: false, blocker: 'OWNER_CONTENT_AND_PRICING_GATES' }
  ]
};

const agentRegistry = {
  schema: 'uaos.agent-registry/v1',
  generatedAt: now(),
  clients: [
    { type: 'CURSOR_SUBAGENT', status: 'ENABLED', maxParallel: 4 },
    { type: 'CODEX_LOCAL', status: 'ENABLED', maxParallel: 2 },
    { type: 'NODE_LOCAL_WORKER', status: 'ENABLED', maxParallel: 8 },
    { type: 'POWERSHELL_LOCAL_WORKER', status: 'ENABLED', maxParallel: 4 },
    { type: 'TEST_REVIEW_AGENT', status: 'ENABLED', maxParallel: 2 },
    { type: 'HUMAN_REVIEW', status: 'ENABLED', maxParallel: 1 },
    { type: 'FUTURE_UAOS_COMMANDER', status: 'CONTRACT_READY_NOT_ACTIVATED', maxParallel: 0 }
  ]
};

const securityPolicy = {
  schema: 'uaos.security-policy/v1',
  forbidden: [
    'git reset','git clean','git stash','git restore','delete WIP',
    'modify V15-V21 worktrees','parallel write same file','push','merge','public deploy',
    'payment activation','USB','hardware write','SysEx','KORG Writer before gates',
    'copy Kontakt or Native Instruments content','fabricate content licenses'
  ],
  protectedWorktreesGlob: 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v1[5-9]*;C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v2[0-1]*',
  noListeningPorts: true,
  noAutoplay: true,
  networkDisabledAcceptanceRequired: true
};

const evidenceContract = {
  schema: 'uaos.evidence-contract/v1',
  requiredFields: ['taskId','agentId','startedAt','endedAt','status','tests','sha256','allowedPathsUsed','truthStatements'],
  artifactRoot: ARTIFACTS
};

const executionState = {
  schema: 'uaos.current-execution-state/v1',
  generatedAt: now(),
  wave: 0,
  status: 'GENERATED_AWAITING_LEADER',
  readyCount: tasks.filter(t => t.state === 'READY').length,
  blockedCount: tasks.filter(t => String(t.state).startsWith('BLOCKED_') || t.state === 'OWNER_GATE').length,
  cycleCount: cycleReport.length,
  commander: 'COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED'
};

// Schemas
const schemas = {
  'task.schema.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['id','epicId','domain','title','state','acceptanceCriteria','tests','evidence','allowedPaths','ownerFile','worktree'],
    properties: {
      id: { type: 'string' },
      state: { enum: STATES },
      estimateMinutesMin: { type: 'number', minimum: 30, maximum: 240 },
      estimateMinutesMax: { type: 'number', minimum: 30, maximum: 240 }
    }
  },
  'portfolio.schema.json': { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', required: ['schema','domains','counts'] },
  'dependencies.schema.json': { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', required: ['edges'] },
  'lease.schema.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['leaseId','taskId','agentId','expiresAt'],
    properties: { leaseMs: { type: 'number', minimum: 60000 } }
  }
};

for (const [name, schema] of Object.entries(schemas)) write(path.join(TREE, 'schemas', name), schema);

// Commander adapter files
write(path.join(TREE, 'COMMANDER-ADAPTER-CONTRACT.json'), {
  schema: 'uaos.commander-adapter-contract/v1',
  status: 'COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED',
  note: 'Do not open or modify Commander repository. Contract only.',
  endpoints: ['listTasks','claimTask','renewLease','reportHeartbeat','reportProgress','attachEvidence','submitResult','requestReview','releaseClaim','pauseQueue','resumeQueue'],
  activation: false
});
write(path.join(TREE, 'adapters', 'COMMANDER-READINESS-CHECKLIST.md'), `# Commander Readiness Checklist
- [x] Adapter contract authored
- [x] Event/command/result schemas authored
- [ ] Commander repository untouched (required)
- [ ] Activation owner gate open
- [ ] Live bridge disabled until owner approval
Status: COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED
`);
write(path.join(TREE, 'adapters', 'COMMANDER-EVENT-SCHEMA.json'), {
  schema: 'uaos.commander-event/v1',
  type: 'object',
  required: ['eventId','type','taskId','at'],
  properties: { type: { enum: ['TASK_CLAIMED','HEARTBEAT','PROGRESS','EVIDENCE','RESULT','LEASE_EXPIRED','QUEUE_PAUSED','QUEUE_RESUMED'] } }
});
write(path.join(TREE, 'adapters', 'COMMANDER-COMMAND-SCHEMA.json'), {
  schema: 'uaos.commander-command/v1',
  type: 'object',
  required: ['commandId','command','at'],
  properties: { command: { enum: ['listTasks','claimTask','renewLease','reportHeartbeat','reportProgress','attachEvidence','submitResult','requestReview','releaseClaim','pauseQueue','resumeQueue'] } }
});
write(path.join(TREE, 'adapters', 'COMMANDER-RESULT-SCHEMA.json'), {
  schema: 'uaos.commander-result/v1',
  type: 'object',
  required: ['resultId','taskId','status','evidence'],
  properties: { status: { enum: ['PASS','FAIL','BLOCKED','OWNER_GATE'] } }
});

write(path.join(TREE, 'PROGRAM-CHARTER.md'), `# UAOS MASTER PROGRAM TREE V1
Authoritative portfolio decomposition and autonomous execution fabric.

## Baseline
- V21 PASS evidence preserved (read-only prior worktrees V15–V21)
- Commander: contract only, not activated, repository untouched
- RC1 is the fastest commercial path; all ideas remain in the tree

## Truth
- Technical WAV ≠ musical quality
- Fixtures ≠ product content
- Offline render ≠ realtime DSP
- KORG inspect-only / write unsupported
- No auto adoption of Kids/Teen/Pricing

## Execution
Wave 0 validates schemas/DAG/queue, then dispatches all READY tasks under lease/claim/heartbeat rules.
`);

write(path.join(TREE, 'PORTFOLIO.json'), portfolio);
write(path.join(TREE, 'PRODUCTS.json'), products);
write(path.join(TREE, 'CAPABILITIES.json'), capabilities);
write(path.join(TREE, 'EPICS.json'), { schema: 'uaos.epics/v1', generatedAt: now(), epics });
write(path.join(TREE, 'TASKS.json'), { schema: 'uaos.tasks/v1', generatedAt: now(), states: STATES, tasks });
write(path.join(TREE, 'DEPENDENCIES.json'), { schema: 'uaos.dependencies/v1', generatedAt: now(), edges: deps, cycleCount: cycleReport.length, cycles: cycleReport.slice(0, 20) });
write(path.join(TREE, 'RELEASE-TRAINS.json'), { schema: 'uaos.release-trains/v1', trains: TRAINS });
write(path.join(TREE, 'OWNER-GATES.json'), { schema: 'uaos.owner-gates/v1', generatedAt: now(), gates: ownerGates });
write(path.join(TREE, 'RISK-REGISTER.json'), { schema: 'uaos.risk-register/v1', risks });
write(path.join(TREE, 'FILE-OWNERSHIP.json'), { schema: 'uaos.file-ownership/v1', ownership: fileOwnership });
write(path.join(TREE, 'AGENT-REGISTRY.json'), agentRegistry);
write(path.join(TREE, 'EVIDENCE-CONTRACT.json'), evidenceContract);
write(path.join(TREE, 'SECURITY-POLICY.json'), securityPolicy);
write(path.join(TREE, 'PRODUCT-TRUTH-MATRIX.json'), truth);
write(path.join(TREE, 'COMMERCIAL-READINESS-MATRIX.json'), commercialMatrix);
write(path.join(TREE, 'CURRENT-EXECUTION-STATE.json'), executionState);
write(path.join(TREE, 'AGENT-CLIENT-PROTOCOL.md'), `# UAOS Agent Client Protocol

Supported clients:
- CURSOR_SUBAGENT
- CODEX_LOCAL
- NODE_LOCAL_WORKER
- POWERSHELL_LOCAL_WORKER
- TEST_REVIEW_AGENT
- HUMAN_REVIEW
- FUTURE_UAOS_COMMANDER (contract only)

Each client must:
1. Register
2. Request task
3. Obtain atomic claim
4. Obtain lease
5. Send heartbeat
6. Respect allowed paths
7. Write only in dedicated worktree
8. Run tests
9. Emit evidence
10. Submit result
11. Release lease
12. Never claim the same task twice
`);

// Runtime seed queue
ensure(path.join(RUNTIME, 'queue'));
write(path.join(RUNTIME, 'queue', 'program-tree.queue.json'), {
  lane: 'program-tree',
  updatedAt: now(),
  tasks: tasks.map(t => ({
    id: t.id,
    status: t.state,
    epicId: t.epicId,
    domain: t.domain,
    title: t.title,
    priority: t.priority,
    rc1Critical: t.rc1Critical,
    releaseTrain: t.releaseTrain,
    worktree: t.worktree,
    ownerFile: t.ownerFile,
    allowedPaths: t.allowedPaths,
    blockedReason: t.blockedReason,
    gate: t.gate,
    phase: t.phase
  }))
});
write(path.join(RUNTIME, 'GENERATION-RECEIPT.json'), {
  generatedAt: now(),
  epicCount: epics.length,
  taskCount: tasks.length,
  dependencyCount: deps.length,
  readyCount: tasks.filter(t => t.state === 'READY').length,
  cycleCount: cycleReport.length,
  commanderTasks: cmdTasks.length
});

console.log(JSON.stringify({
  ok: true,
  epics: epics.length,
  tasks: tasks.length,
  deps: deps.length,
  ready: tasks.filter(t => t.state === 'READY').length,
  blocked: tasks.filter(t => String(t.state).startsWith('BLOCKED_') || t.state === 'OWNER_GATE').length,
  cycles: cycleReport.length,
  ownerGates: ownerGates.length
}, null, 2));
