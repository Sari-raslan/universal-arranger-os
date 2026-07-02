import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_WINDOW_BYTES = 256;
const MAX_WINDOWS_PER_FILE = 16;
const MAX_BYTES_PER_FILE_READ = 4096;
const NATIVE_EXTENSIONS = new Set(['.set', '.sty', '.prs', '.kst']);

export function selectedOffsets(sizeBytes) {
  const candidates = [0, 256, 512, 1024];
  if (sizeBytes > DEFAULT_WINDOW_BYTES) candidates.push(Math.max(0, Math.floor((sizeBytes - DEFAULT_WINDOW_BYTES) / 2)));
  if (sizeBytes > DEFAULT_WINDOW_BYTES) candidates.push(Math.max(0, sizeBytes - DEFAULT_WINDOW_BYTES));
  return [...new Set(candidates.filter((offset) => offset >= 0 && offset < sizeBytes))].slice(0, MAX_WINDOWS_PER_FILE);
}

export function readWindow(filePath, offset, sizeBytes) {
  const length = Math.min(DEFAULT_WINDOW_BYTES, Math.max(0, sizeBytes - offset));
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, offset);
    return buffer.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
}

export function printableAscii(buffer) {
  let out = '';
  for (const byte of buffer) {
    if (byte === 9 || byte === 10 || byte === 13) out += ' ';
    else if (byte >= 32 && byte <= 126) out += String.fromCharCode(byte);
    else out += '.';
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function repeatedByteSequences(buffer) {
  const hits = [];
  for (let i = 0; i <= buffer.length - 4; i += 1) {
    const a = buffer[i];
    if (buffer[i + 1] === a && buffer[i + 2] === a && buffer[i + 3] === a) {
      hits.push({ offsetInWindow: i, byteHex: a.toString(16).padStart(2, '0'), lengthAtLeast: 4 });
      i += 3;
    }
  }
  return hits.slice(0, 12);
}

export function zeroRegions(buffer) {
  const regions = [];
  let start = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] === 0 && start === -1) start = i;
    if ((buffer[i] !== 0 || i === buffer.length - 1) && start !== -1) {
      const end = buffer[i] === 0 && i === buffer.length - 1 ? i : i - 1;
      const length = end - start + 1;
      if (length >= 4) regions.push({ startInWindow: start, length });
      start = -1;
    }
  }
  return regions.slice(0, 12);
}

export function korgMarkers(buffer) {
  const text = buffer.toString('latin1');
  const markers = [];
  let idx = text.indexOf('KORF');
  while (idx !== -1) {
    markers.push(idx);
    idx = text.indexOf('KORF', idx + 1);
  }
  return markers;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

export function probeTarget({ fixtureRoot, target }) {
  const fullPath = path.join(fixtureRoot, ...target.relativePath.split('/'));
  const stat = fs.statSync(fullPath);
  const offsets = selectedOffsets(stat.size);
  const windows = offsets.map((offset) => {
    const buffer = readWindow(fullPath, offset, stat.size);
    const markerOffsets = korgMarkers(buffer);
    const zero = zeroRegions(buffer);
    const repeats = repeatedByteSequences(buffer);
    const likelyBlockBoundary = offset === 0 || markerOffsets.length > 0 || zero.some((region) => region.length >= 16);
    return {
      offset,
      bytesRead: buffer.length,
      first32Hex: buffer.subarray(0, Math.min(32, buffer.length)).toString('hex'),
      sha256OfWindow: crypto.createHash('sha256').update(buffer).digest('hex'),
      printableAsciiSnippet: printableAscii(buffer),
      repeatedByteSequences: repeats,
      zeroRegions: zero,
      korgMarkerOffsetsInWindow: markerOffsets,
      likelyBlockBoundary
    };
  });
  const boundaryOffsets = windows.filter((window) => window.likelyBlockBoundary).map((window) => window.offset);
  const totalBytesRead = windows.reduce((sum, window) => sum + window.bytesRead, 0);
  const confidenceScore = Math.min(1, Number(((boundaryOffsets.length / Math.max(1, windows.length)) * 0.65 + (target.classifierConfidence === 'high' ? 0.25 : 0.1) + (target.likelyRole.includes('global') ? 0.05 : 0.1)).toFixed(2)));
  return {
    relativePath: target.relativePath,
    extension: target.extension,
    sizeBytes: stat.size,
    likelyRole: target.likelyRole,
    classifierConfidence: target.classifierConfidence,
    fixedWindowBytes: DEFAULT_WINDOW_BYTES,
    windowsRead: windows.length,
    totalBytesReadForWindows: totalBytesRead,
    maxBytesPerFileRead: MAX_BYTES_PER_FILE_READ,
    withinReadLimit: totalBytesRead <= MAX_BYTES_PER_FILE_READ,
    currentSha256: sha256File(fullPath),
    selectedWindows: windows,
    likelyBlockBoundariesByOffsetOnly: boundaryOffsets,
    possibleHeaderRegion: windows.some((window) => window.offset === 0) ? { start: 0, length: DEFAULT_WINDOW_BYTES } : null,
    possibleFooterRegion: stat.size > DEFAULT_WINDOW_BYTES ? { start: Math.max(0, stat.size - DEFAULT_WINDOW_BYTES), length: DEFAULT_WINDOW_BYTES } : null,
    unknownAreas: [{ start: DEFAULT_WINDOW_BYTES, endExclusive: Math.max(DEFAULT_WINDOW_BYTES, stat.size - DEFAULT_WINDOW_BYTES), note: 'Not read or decoded in Run 006.' }],
    confidenceScore,
    decodedValues: false,
    musicalContentInferred: false
  };
}

export function buildBoundaryMap(results) {
  const roleMap = new Map();
  for (const result of results) {
    if (!roleMap.has(result.likelyRole)) roleMap.set(result.likelyRole, []);
    roleMap.get(result.likelyRole).push(result);
  }
  const groups = [];
  for (const [role, records] of roleMap.entries()) {
    const repeatedOffsets = new Map();
    for (const record of records) {
      for (const offset of record.likelyBlockBoundariesByOffsetOnly) repeatedOffsets.set(offset, (repeatedOffsets.get(offset) || 0) + 1);
    }
    groups.push({
      role,
      fileCount: records.length,
      possibleRepeatedStructuralOffsets: [...repeatedOffsets.entries()].filter(([, count]) => count > 1).map(([offset, count]) => ({ offset, count })),
      possibleBlockStarts: [...new Set(records.flatMap((record) => record.likelyBlockBoundariesByOffsetOnly))].sort((a, b) => a - b),
      possibleHeaderRegion: 'offset 0 fixed 256-byte window',
      possibleFooterRegion: 'last fixed 256-byte window when file size allows',
      averageConfidenceScore: Number((records.reduce((sum, record) => sum + record.confidenceScore, 0) / records.length).toFixed(2)),
      unknownAreas: 'All bytes outside selected fixed windows remain unknown and undecoded.',
      needsDeeperApproval: true
    });
  }
  return groups;
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
