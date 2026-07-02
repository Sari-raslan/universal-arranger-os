import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const WINDOW_BYTES = 256;
const MAX_WINDOWS_PER_FILE = 16;
const MAX_BYTES_PER_FILE_READ = 8192;
const NATIVE_EXTENSIONS = new Set(['.set', '.sty', '.prs', '.prf', '.kst']);

function selectedOffsets(sizeBytes) {
  const base = [0, 256, 512, 1024, 2048, 4096, 6144, 8192, 12288, 16384, 32768, 65536];
  if (sizeBytes > WINDOW_BYTES) base.push(Math.max(0, Math.floor((sizeBytes - WINDOW_BYTES) / 2)));
  if (sizeBytes > WINDOW_BYTES) base.push(Math.max(0, sizeBytes - WINDOW_BYTES));
  return [...new Set(base.filter((offset) => offset >= 0 && offset < sizeBytes))].slice(0, MAX_WINDOWS_PER_FILE);
}

function readWindow(filePath, offset, sizeBytes) {
  const length = Math.min(WINDOW_BYTES, Math.max(0, sizeBytes - offset));
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, offset);
    return buffer.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
}

function printableAscii(buffer) {
  let out = '';
  for (const byte of buffer) {
    if (byte === 9 || byte === 10 || byte === 13) out += ' ';
    else if (byte >= 32 && byte <= 126) out += String.fromCharCode(byte);
    else out += '.';
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function zeroRegions(buffer, baseOffset = 0) {
  const regions = [];
  let start = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] === 0 && start === -1) start = i;
    if ((buffer[i] !== 0 || i === buffer.length - 1) && start !== -1) {
      const end = buffer[i] === 0 && i === buffer.length - 1 ? i : i - 1;
      const length = end - start + 1;
      if (length >= 4) regions.push({ startOffset: baseOffset + start, length });
      start = -1;
    }
  }
  return regions.slice(0, 24);
}

function repeatedBytePatterns(buffer, baseOffset = 0) {
  const hits = [];
  for (let i = 0; i <= buffer.length - 8; i += 1) {
    const first = buffer.subarray(i, i + 4).toString('hex');
    const second = buffer.subarray(i + 4, i + 8).toString('hex');
    if (first === second) {
      hits.push({ startOffset: baseOffset + i, patternHex: first, repeatedBytes: 8 });
      i += 7;
    }
  }
  return hits.slice(0, 24);
}

function markers(buffer, baseOffset = 0) {
  const text = buffer.toString('latin1');
  const names = ['KORF', 'STY', 'STYL'];
  const out = [];
  for (const name of names) {
    let idx = text.indexOf(name);
    while (idx !== -1) {
      out.push({ marker: name, offset: baseOffset + idx });
      idx = text.indexOf(name, idx + 1);
    }
  }
  return out;
}

function structuralFingerprint(buffer) {
  let zeroCount = 0;
  let printableCount = 0;
  const buckets = new Array(16).fill(0);
  for (const byte of buffer) {
    if (byte === 0) zeroCount += 1;
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126)) printableCount += 1;
    buckets[Math.floor(byte / 16)] += 1;
  }
  return {
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    first16Hex: buffer.subarray(0, Math.min(16, buffer.length)).toString('hex'),
    zeroRatio: buffer.length ? Number((zeroCount / buffer.length).toFixed(4)) : 0,
    printableRatio: buffer.length ? Number((printableCount / buffer.length).toFixed(4)) : 0,
    histogram16: buckets
  };
}

export function probeStyleTarget({ fixtureRoot, target }) {
  const fullPath = path.join(fixtureRoot, ...target.relativePath.split('/'));
  const stat = fs.statSync(fullPath);
  const offsets = selectedOffsets(stat.size);
  const windows = offsets.map((offset) => {
    const buffer = readWindow(fullPath, offset, stat.size);
    const zero = zeroRegions(buffer, offset);
    const repeats = repeatedBytePatterns(buffer, offset);
    const markerHits = markers(buffer, offset);
    return {
      offset,
      bytesRead: buffer.length,
      first32Hex: buffer.subarray(0, Math.min(32, buffer.length)).toString('hex'),
      printableAsciiSnippet: printableAscii(buffer),
      repeatedBytePatterns: repeats,
      zeroFilledRegions: zero,
      markerHits,
      structuralFingerprint: structuralFingerprint(buffer),
      possibleBoundary: offset === 0 || markerHits.length > 0 || zero.some((r) => r.length >= 16) || repeats.length > 0
    };
  });
  const totalBytesRead = windows.reduce((sum, w) => sum + w.bytesRead, 0);
  const boundaryOffsets = [...new Set(windows.filter((w) => w.possibleBoundary).map((w) => w.offset))].sort((a, b) => a - b);
  const candidateRegions = [];
  for (let i = 0; i < boundaryOffsets.length; i += 1) {
    const start = boundaryOffsets[i];
    const next = boundaryOffsets[i + 1] ?? Math.min(stat.size, start + WINDOW_BYTES);
    if (next > start) {
      candidateRegions.push({
        startOffset: start,
        length: next - start,
        endOffsetExclusive: next,
        label: start === 0 ? 'styleFileHeader' : 'candidateSectionRegion',
        confidence: start === 0 ? 'medium' : 'low',
        decodedValue: false,
        musicalMeaning: false
      });
    }
  }
  candidateRegions.push({
    startOffset: totalBytesRead,
    length: Math.max(0, stat.size - totalBytesRead),
    endOffsetExclusive: stat.size,
    label: 'unknownRegion',
    confidence: 'high',
    note: 'Not read or decoded; totalBytesRead is non-contiguous window total, not a continuous prefix.',
    decodedValue: false,
    musicalMeaning: false
  });
  return {
    relativePath: target.relativePath,
    extension: target.extension,
    sizeBytes: stat.size,
    bytesReadTotalAcrossWindows: totalBytesRead,
    withinReadLimit: totalBytesRead <= MAX_BYTES_PER_FILE_READ,
    windowsRead: windows.length,
    selectedOffsetWindows: windows,
    possibleHeaderRegion: { startOffset: 0, length: WINDOW_BYTES, confidence: 'medium' },
    possibleSectionLikeBoundariesByOffsetOnly: boundaryOffsets,
    possibleTableLikeRegions: candidateRegions.filter((r) => r.label === 'candidateSectionRegion'),
    repeatedRegionCandidates: windows.flatMap((w) => w.repeatedBytePatterns).slice(0, 64),
    zeroFilledRegions: windows.flatMap((w) => w.zeroFilledRegions).slice(0, 64),
    candidateRegions,
    unknownRegions: candidateRegions.filter((r) => r.label === 'unknownRegion'),
    confidenceLevel: boundaryOffsets.length > 1 ? 'low-medium' : 'low',
    crossFileConsistency: 'not available; only one STYLE file in fixture',
    noValueDecoding: true,
    noMusicalMeaning: true,
    noKeyboardOutput: true
  };
}

export function buildHeaderGroups(records) {
  return records.map((record) => ({
    relativePath: record.relativePath,
    extension: record.extension,
    sizeBytes: record.sizeBytes,
    headerRegion: record.possibleHeaderRegion,
    firstWindowFingerprint: record.selectedOffsetWindows[0]?.structuralFingerprint || null,
    markerHits: record.selectedOffsetWindows[0]?.markerHits || [],
    confidence: record.confidenceLevel
  }));
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
