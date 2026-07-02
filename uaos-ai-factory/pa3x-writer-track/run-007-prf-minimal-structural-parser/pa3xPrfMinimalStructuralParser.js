import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_BYTES_PER_FILE_READ = 8192;
const WINDOW_BYTES = 256;
const NATIVE_EXTENSIONS = new Set(['.set', '.sty', '.prs', '.prf', '.kst']);

function printableAscii(buffer) {
  let out = '';
  for (const byte of buffer) {
    if (byte === 9 || byte === 10 || byte === 13) out += ' ';
    else if (byte >= 32 && byte <= 126) out += String.fromCharCode(byte);
    else out += '.';
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, 160);
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
  return regions;
}

function repeatedBytePatterns(buffer, baseOffset = 0) {
  const hits = [];
  for (let i = 0; i <= buffer.length - 8; i += 1) {
    const chunk = buffer.subarray(i, i + 4).toString('hex');
    const next = buffer.subarray(i + 4, i + 8).toString('hex');
    if (chunk === next) {
      hits.push({ startOffset: baseOffset + i, patternHex: chunk, repeatedBytes: 8 });
      i += 7;
    }
  }
  return hits.slice(0, 48);
}

function korgMarkers(buffer, baseOffset = 0) {
  const text = buffer.toString('latin1');
  const out = [];
  let idx = text.indexOf('KORF');
  while (idx !== -1) {
    out.push(baseOffset + idx);
    idx = text.indexOf('KORF', idx + 1);
  }
  return out;
}

function candidateRecordSizes(markerOffsets, fileSize) {
  const sorted = [...new Set(markerOffsets)].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i += 1) gaps.push(sorted[i] - sorted[i - 1]);
  const counts = new Map();
  for (const gap of gaps) counts.set(gap, (counts.get(gap) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([size, count]) => ({ size, count, confidence: count >= 3 ? 'medium' : 'low' }));
}

function windowOffsets(sizeBytes) {
  const offsets = [0, 256, 512, 1024, 2048, 4096, 6144];
  return offsets.filter((offset) => offset < sizeBytes && offset < MAX_BYTES_PER_FILE_READ);
}

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

export function parsePrfTarget({ fixtureRoot, target }) {
  const fullPath = path.join(fixtureRoot, ...target.relativePath.split('/'));
  const stat = fs.statSync(fullPath);
  const prefix = readPrefix(fullPath, stat.size);
  const offsets = windowOffsets(stat.size);
  const windows = offsets.map((offset) => {
    const buffer = prefix.subarray(offset, Math.min(offset + WINDOW_BYTES, prefix.length));
    return {
      offset,
      bytesRead: buffer.length,
      first32Hex: buffer.subarray(0, Math.min(32, buffer.length)).toString('hex'),
      printableAsciiSnippet: printableAscii(buffer),
      zeroRegions: zeroRegions(buffer, offset).slice(0, 16),
      repeatedBytePatterns: repeatedBytePatterns(buffer, offset).slice(0, 16),
      korgMarkerOffsets: korgMarkers(buffer, offset)
    };
  });
  const allMarkers = korgMarkers(prefix, 0);
  const allZeroRegions = zeroRegions(prefix, 0).slice(0, 64);
  const allPatterns = repeatedBytePatterns(prefix, 0).slice(0, 64);
  const candidateBoundaries = [...new Set([0, ...target.run006BoundaryOffsets, ...allMarkers, ...allZeroRegions.map((r) => r.startOffset)])].filter((n) => n < prefix.length).sort((a, b) => a - b);
  const possibleTableRegions = candidateRecordSizes(candidateBoundaries, stat.size);
  const confidence = target.classifierConfidence === 'high' && allMarkers.length > 0 ? 'medium' : 'low';
  return {
    relativePath: target.relativePath,
    extension: target.extension,
    sizeBytes: stat.size,
    bytesRead: prefix.length,
    withinReadLimit: prefix.length <= MAX_BYTES_PER_FILE_READ,
    run003Sha256: target.run003Sha256,
    currentSizeMatchesRun006: stat.size === target.sizeBytes,
    prefixSha256: crypto.createHash('sha256').update(prefix).digest('hex'),
    selectedOffsetWindows: windows,
    possibleHeaderRegion: { startOffset: 0, length: Math.min(WINDOW_BYTES, prefix.length), basis: 'fixed first window only' },
    possibleTableLikeRegions: possibleTableRegions,
    possibleBlockBoundaries: candidateBoundaries.map((offset) => ({ offset, basis: offset === 0 ? 'file start' : allMarkers.includes(offset) ? 'KORF marker in prefix' : 'zero/repeated/window boundary candidate' })).slice(0, 96),
    zeroFilledRegions: allZeroRegions,
    repeatedBytePatterns: allPatterns,
    printableAsciiSnippetsOnly: windows.map((w) => ({ offset: w.offset, snippet: w.printableAsciiSnippet })),
    unknownRegion: prefix.length < stat.size ? { startOffset: prefix.length, endOffsetExclusive: stat.size, note: 'Not read in Run 007.' } : null,
    confidenceLevel: confidence,
    noValueDecoding: true,
    noMusicalMeaning: true,
    noKeyboardOutput: true
  };
}

export function summarizeStructuralMap(records) {
  const fileSizes = records.map((r) => r.sizeBytes);
  const commonBoundaryCounts = new Map();
  for (const record of records) {
    for (const boundary of record.possibleBlockBoundaries) {
      commonBoundaryCounts.set(boundary.offset, (commonBoundaryCounts.get(boundary.offset) || 0) + 1);
    }
  }
  return {
    filesAnalyzed: records.length,
    fileSizePatterns: {
      minBytes: Math.min(...fileSizes),
      maxBytes: Math.max(...fileSizes),
      uniqueSizes: [...new Set(fileSizes)].sort((a, b) => a - b),
      allSameSize: new Set(fileSizes).size === 1
    },
    commonHeaderRegions: [{ startOffset: 0, length: 256, files: records.length, confidence: 'medium' }],
    commonBoundaryOffsets: [...commonBoundaryCounts.entries()].filter(([, count]) => count > 1).map(([offset, count]) => ({ offset, count })).sort((a, b) => a.offset - b.offset),
    possibleRepeatedRecordSizes: [...new Set(records.flatMap((r) => r.possibleTableLikeRegions.map((t) => t.size)))].sort((a, b) => a - b),
    unknownRegions: 'Bytes after offset 8192 remain unread for larger files. Byte values are not decoded.',
    confidenceLevels: {
      medium: records.filter((r) => r.confidenceLevel === 'medium').length,
      low: records.filter((r) => r.confidenceLevel === 'low').length
    }
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
