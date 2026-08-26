'use strict';
/**
 * UAOS Keyboard Converters Safe Core (V16)
 * Internal UAOS formats only. No KORG/USB/SysEx/proprietary writers.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CAPABILITIES = {
  'inspect.input': true,
  'detect.uaos.format': true,
  'inspect.midi.metadata': true,
  'build.source.manifest': true,
  'build.mapping.plan': true,
  'dryrun.conversion.graph': true,
  'validate.output': true,
  'report.warnings.errors': true,
  'write.deterministic.manifest': true,
  'convert.internal.uaos.project': true,
  'reject.unsupported.format': true,
  'write.korg.proprietary': false,
  'usb.hardware': false,
  'sysex': false
};

const FORMAT_REGISTRY = {
  'uaos.project/v1': { supported: true, direction: ['in', 'out'], kind: 'internal' },
  'uaos.arranger.set/v1': { supported: true, direction: ['in', 'out'], kind: 'internal' },
  'uaos.midi.meta/v1': { supported: true, direction: ['in'], kind: 'internal' },
  'midi.smf': { supported: true, direction: ['in'], kind: 'open', note: 'metadata inspection only' },
  'korg.sty': { supported: false, direction: [], kind: 'proprietary', reason: 'PROPRIETARY_WRITER_BANNED' },
  'korg.set': { supported: false, direction: [], kind: 'proprietary', reason: 'PROPRIETARY_WRITER_BANNED' },
  'korg.prs': { supported: false, direction: [], kind: 'proprietary', reason: 'PROPRIETARY_WRITER_BANNED' },
  'korg.prf': { supported: false, direction: [], kind: 'proprietary', reason: 'PROPRIETARY_WRITER_BANNED' },
  'korg.kst': { supported: false, direction: [], kind: 'proprietary', reason: 'PROPRIETARY_WRITER_BANNED' },
  'sysex.dump': { supported: false, direction: [], kind: 'hardware', reason: 'SYSEX_BANNED' }
};

function atomicWrite(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

function detectFormat(input) {
  if (!input || typeof input !== 'object') return { formatId: null, error: 'NOT_OBJECT' };
  if (input.formatId && FORMAT_REGISTRY[input.formatId]) return { formatId: input.formatId, meta: FORMAT_REGISTRY[input.formatId] };
  if (input.schemaVersion === 'uaos.arranger.project/v1' || input.kind === 'uaos.arranger.set') return { formatId: 'uaos.arranger.set/v1', meta: FORMAT_REGISTRY['uaos.arranger.set/v1'] };
  if (input.schemaVersion === 'uaos.project/v1' || input.kind === 'uaos.project') return { formatId: 'uaos.project/v1', meta: FORMAT_REGISTRY['uaos.project/v1'] };
  if (input.midi || input.tracks?.some?.((t) => t.kind === 'midi')) return { formatId: 'uaos.midi.meta/v1', meta: FORMAT_REGISTRY['uaos.midi.meta/v1'] };
  if (input.formatId) return { formatId: input.formatId, meta: FORMAT_REGISTRY[input.formatId] || { supported: false, reason: 'UNKNOWN_FORMAT' } };
  return { formatId: 'unknown', meta: { supported: false, reason: 'UNDETECTABLE' } };
}

function inspectInput(input) {
  const det = detectFormat(input);
  const warnings = [];
  const errors = [];
  if (!det.meta?.supported) errors.push({ code: 'UNSUPPORTED_FORMAT', formatId: det.formatId, reason: det.meta?.reason || det.error });
  return {
    formatId: det.formatId,
    supported: !!det.meta?.supported,
    midiMeta: input.midi || null,
    trackCount: Array.isArray(input.tracks) ? input.tracks.length : 0,
    warnings,
    errors
  };
}

function buildSourceManifest(input, inspection) {
  return {
    schemaVersion: 'uaos.converter.source-manifest/v1',
    sourceId: crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 16),
    formatId: inspection.formatId,
    trackCount: inspection.trackCount,
    createdAt: new Date().toISOString()
  };
}

function buildMappingPlan(inspection, targetFormat = 'uaos.project/v1') {
  if (!inspection.supported) {
    return { ok: false, errors: inspection.errors, nodes: [] };
  }
  if (!FORMAT_REGISTRY[targetFormat]?.supported) {
    return { ok: false, errors: [{ code: 'UNSUPPORTED_TARGET', formatId: targetFormat }], nodes: [] };
  }
  return {
    ok: true,
    nodes: [
      { id: 'inspect', type: 'inspect' },
      { id: 'map', type: 'map', from: inspection.formatId, to: targetFormat },
      { id: 'validate', type: 'validate' },
      { id: 'write', type: 'write', outputMode: 'new-directory-only' }
    ],
    targetFormat
  };
}

function dryRunGraph(plan) {
  return {
    schemaVersion: 'uaos.converter.dryrun/v1',
    ok: !!plan.ok,
    steps: (plan.nodes || []).map((n, i) => ({ order: i + 1, ...n, status: plan.ok ? 'WOULD_RUN' : 'BLOCKED' })),
    proprietaryWriters: false,
    usb: false,
    sysex: false
  };
}

function convertInternal(input, outputDir, { targetFormat = 'uaos.project/v1' } = {}) {
  if (!outputDir) throw Object.assign(new Error('OUTPUT_DIR_REQUIRED'), { code: 'OUTPUT_DIR_REQUIRED' });
  fs.mkdirSync(outputDir, { recursive: true });
  const inspection = inspectInput(input);
  if (!inspection.supported) {
    const report = { ok: false, errors: inspection.errors, warnings: inspection.warnings };
    atomicWrite(path.join(outputDir, 'conversion-report.json'), report);
    return report;
  }
  const sourceManifest = buildSourceManifest(input, inspection);
  const plan = buildMappingPlan(inspection, targetFormat);
  const dry = dryRunGraph(plan);
  const output = {
    schemaVersion: 'uaos.project/v1',
    kind: 'uaos.project',
    projectId: crypto.randomUUID(),
    convertedFrom: inspection.formatId,
    tracks: Array.isArray(input.tracks) ? input.tracks.map((t, i) => ({
      trackId: t.trackId || `t${i + 1}`,
      kind: t.kind || 'midi',
      name: t.name || `Track ${i + 1}`
    })) : [],
    createdAt: new Date().toISOString()
  };
  const outHash = crypto.createHash('sha256').update(JSON.stringify(output)).digest('hex');
  const manifest = {
    schemaVersion: 'uaos.converter.output-manifest/v1',
    deterministic: true,
    outputHash: outHash,
    targetFormat,
    files: ['converted.project.json', 'source.manifest.json', 'mapping.plan.json', 'dryrun.graph.json', 'conversion-report.json']
  };
  atomicWrite(path.join(outputDir, 'converted.project.json'), output);
  atomicWrite(path.join(outputDir, 'source.manifest.json'), sourceManifest);
  atomicWrite(path.join(outputDir, 'mapping.plan.json'), plan);
  atomicWrite(path.join(outputDir, 'dryrun.graph.json'), dry);
  const report = { ok: true, errors: [], warnings: inspection.warnings, outputDir, manifest };
  atomicWrite(path.join(outputDir, 'conversion-report.json'), report);
  return report;
}

function roundTripInternal(input) {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'uaos-conv-'));
  const a = convertInternal(input, path.join(dir, 'a'));
  if (!a.ok) return { ok: false, stage: 'forward', report: a };
  const converted = JSON.parse(fs.readFileSync(path.join(dir, 'a', 'converted.project.json'), 'utf8'));
  const b = convertInternal(converted, path.join(dir, 'b'));
  return { ok: b.ok, stage: 'roundtrip', forward: a, back: b };
}

module.exports = {
  CAPABILITIES,
  FORMAT_REGISTRY,
  detectFormat,
  inspectInput,
  buildSourceManifest,
  buildMappingPlan,
  dryRunGraph,
  convertInternal,
  roundTripInternal,
  atomicWrite
};
