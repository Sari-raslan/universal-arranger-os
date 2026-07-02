import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_BYTES_PER_FILE_READ = 16384;
const NATIVE_EXTENSIONS = new Set(['.set', '.sty', '.prs', '.prf', '.kst']);

function readPrefix(filePath, sizeBytes) {
  const limit = Math.min(sizeBytes, MAX_BYTES_PER_FILE_READ);
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(limit);
    const bytesRead = fs.readSync(fd, buffer, 0, limit, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
}

function normalizeBoundaries(record, prefixLength) {
  const offsets = new Set([0]);
  for (const boundary of record.possibleBlockBoundaries || []) {
    if (Number.isInteger(boundary.offset) && boundary.offset >= 0 && boundary.offset < prefixLength) offsets.add(boundary.offset);
  }
  for (const region of record.zeroFilledRegions || []) {
    if (Number.isInteger(region.startOffset) && region.startOffset >= 0 && region.startOffset < prefixLength) offsets.add(region.startOffset);
  }
  offsets.add(prefixLength);
  return [...offsets].sort((a, b) => a - b);
}

function regionsFromBoundaries(boundaries) {
  const regions = [];
  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    if (end > start) regions.push({ startOffset: start, length: end - start, endOffsetExclusive: end });
  }
  return regions;
}

function regionFingerprint(buffer, region) {
  const slice = buffer.subarray(region.startOffset, Math.min(region.endOffsetExclusive, buffer.length));
  const first = slice.subarray(0, Math.min(16, slice.length)).toString('hex');
  const zeroBytes = [...slice].filter((b) => b === 0).length;
  return {
    startOffset: region.startOffset,
    length: region.length,
    first16Hex: first,
    sha256: crypto.createHash('sha256').update(slice).digest('hex'),
    zeroRatio: slice.length ? Number((zeroBytes / slice.length).toFixed(4)) : 0
  };
}

function sizeBand(length) {
  if (length <= 16) return 'tiny';
  if (length <= 64) return 'small';
  if (length <= 256) return 'medium';
  if (length <= 1024) return 'large';
  return 'xlarge';
}

export function analyzePrfLayer2({ fixtureRoot, run007Map }) {
  const records = [];
  for (const source of run007Map.records || []) {
    if (source.extension !== '.prf') continue;
    const fullPath = path.join(fixtureRoot, ...source.relativePath.split('/'));
    const stat = fs.statSync(fullPath);
    const prefix = readPrefix(fullPath, stat.size);
    const boundaries = normalizeBoundaries(source, prefix.length);
    const regions = regionsFromBoundaries(boundaries);
    const fingerprints = regions.map((region) => regionFingerprint(prefix, region));
    records.push({
      relativePath: source.relativePath,
      extension: '.prf',
      sizeBytes: stat.size,
      bytesRead: prefix.length,
      withinReadLimit: prefix.length <= MAX_BYTES_PER_FILE_READ,
      regionCount: regions.length,
      candidateRegionStarts: boundaries.slice(0, -1),
      candidateRegionLengths: regions.map((region) => region.length),
      fixedHeaderCandidate: regions.find((region) => region.startOffset === 0) || null,
      footerCandidate: stat.size <= prefix.length ? regions.at(-1) || null : { startOffset: prefix.length, length: stat.size - prefix.length, note: 'unread tail, not decoded' },
      variableBodyCandidate: regions.filter((region) => region.startOffset >= 256 && region.endOffsetExclusive <= prefix.length),
      regionFingerprints: fingerprints,
      structuralFingerprint: crypto.createHash('sha256').update(JSON.stringify(regions.map((region) => ({ s: region.startOffset, l: region.length })))).digest('hex'),
      noValueDecoding: true,
      noMusicalMeaning: true,
      noKeyboardOutput: true
    });
  }
  return records;
}

export function summarizeInventory(records) {
  const boundaryCounts = new Map();
  const lengthCounts = new Map();
  const fingerprintCounts = new Map();
  const regionCountDistribution = new Map();
  for (const record of records) {
    regionCountDistribution.set(record.regionCount, (regionCountDistribution.get(record.regionCount) || 0) + 1);
    fingerprintCounts.set(record.structuralFingerprint, (fingerprintCounts.get(record.structuralFingerprint) || 0) + 1);
    for (const start of record.candidateRegionStarts) boundaryCounts.set(start, (boundaryCounts.get(start) || 0) + 1);
    for (const length of record.candidateRegionLengths) lengthCounts.set(length, (lengthCounts.get(length) || 0) + 1);
  }
  const commonBoundaryOffsets = [...boundaryCounts.entries()].filter(([, count]) => count >= 2).map(([offset, count]) => ({ offset, count })).sort((a, b) => a.offset - b.offset);
  const regionLengthDistribution = [...lengthCounts.entries()].map(([length, count]) => ({ length, count, band: sizeBand(length) })).sort((a, b) => a.length - b.length);
  const recurringFingerprints = [...fingerprintCounts.entries()].filter(([, count]) => count >= 2).map(([fingerprint, count]) => ({ fingerprint, count }));
  const headerLengthCandidates = records.map((record) => record.fixedHeaderCandidate?.length).filter(Boolean);
  const likelyFixedHeaderLength = headerLengthCandidates.length ? [...new Set(headerLengthCandidates)].sort((a, b) => a - b)[0] : null;
  const consistencyScore = records.length ? Number(((commonBoundaryOffsets.filter((item) => item.count >= Math.ceil(records.length / 2)).length / Math.max(1, commonBoundaryOffsets.length)) * 0.55 + (recurringFingerprints.length ? 0.2 : 0) + (likelyFixedHeaderLength ? 0.2 : 0)).toFixed(2)) : 0;
  return {
    prfFilesAnalyzed: records.length,
    commonBoundaryOffsets,
    regionLengthDistribution,
    recurringStructuralFingerprints: recurringFingerprints,
    regionCountDistribution: [...regionCountDistribution.entries()].map(([regionCount, count]) => ({ regionCount, count })).sort((a, b) => a.regionCount - b.regionCount),
    likelyFixedHeaderLength,
    likelyVariableBodyAreas: 'Regions after the fixed header candidate vary by file and remain structural-only.',
    possibleFooterArea: 'Only a footer candidate can be named; unread tails are not decoded.',
    structuralConsistencyScore: consistencyScore,
    confidenceLevel: consistencyScore >= 0.65 ? 'medium' : consistencyScore >= 0.35 ? 'low-medium' : 'low',
    unknownRegions: 'Any bytes outside the 16384-byte prefix and all byte-field meanings remain unknown.'
  };
}

export function safetyScanOutput(outputRoot) {
  const hits = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (NATIVE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) hits.push(full);
    }
  }
  walk(outputRoot);
  return hits;
}
