import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const WINDOW_BYTES = 64;
const MAX_STABLE_OFFSETS_PER_FILE = 32;
const MAX_BYTES_PER_FILE_READ = 4096;
const NATIVE_EXTENSIONS = new Set(['.set', '.sty', '.prs', '.prf', '.kst']);

function readWindow(filePath, offset, sizeBytes) {
  const start = Math.max(0, Math.min(offset, Math.max(0, sizeBytes - 1)));
  const length = Math.min(WINDOW_BYTES, Math.max(0, sizeBytes - start));
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, start);
    return { start, buffer: buffer.subarray(0, bytesRead) };
  } finally {
    fs.closeSync(fd);
  }
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

function similarity(a, b) {
  if (!a || !b) return 0;
  let bucketDiff = 0;
  const totalA = a.histogram16.reduce((s, n) => s + n, 0) || 1;
  const totalB = b.histogram16.reduce((s, n) => s + n, 0) || 1;
  for (let i = 0; i < 16; i += 1) {
    bucketDiff += Math.abs((a.histogram16[i] / totalA) - (b.histogram16[i] / totalB));
  }
  const histScore = Math.max(0, 1 - bucketDiff / 2);
  const zeroScore = Math.max(0, 1 - Math.abs(a.zeroRatio - b.zeroRatio));
  const printableScore = Math.max(0, 1 - Math.abs(a.printableRatio - b.printableRatio));
  return Number((0.6 * histScore + 0.2 * zeroScore + 0.2 * printableScore).toFixed(4));
}

function chooseRepresentative(fingerprints) {
  if (!fingerprints.length) return null;
  return fingerprints[0].fingerprint;
}

export function selectPrfFiles(fileIndex) {
  return (fileIndex.files || [])
    .filter((file) => String(file.extension).toLowerCase() === '.prf')
    .map((file) => ({
      relativePath: file.relativePath.replaceAll('\\', '/'),
      extension: '.prf',
      sizeBytes: file.sizeBytes,
      sha256: file.sha256
    }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function validateStableOffsets({ fixtureRoot, fileIndex, stableRegions, consistencyResults, criteria }) {
  const prfFiles = selectPrfFiles(fileIndex);
  const stableOffsets = (stableRegions.stableRegions || [])
    .map((region) => ({ offset: region.startOffset, filesPresent: region.filesPresent, stability: region.stability }))
    .filter((region) => Number.isInteger(region.offset))
    .slice(0, MAX_STABLE_OFFSETS_PER_FILE);
  const perFile = [];
  for (const file of prfFiles) {
    const fullPath = path.join(fixtureRoot, ...file.relativePath.split('/'));
    const stat = fs.statSync(fullPath);
    let bytesRead = 0;
    const windows = [];
    for (const offsetInfo of stableOffsets) {
      const { start, buffer } = readWindow(fullPath, offsetInfo.offset, stat.size);
      bytesRead += buffer.length;
      windows.push({
        requestedOffset: offsetInfo.offset,
        actualStartOffset: start,
        bytesRead: buffer.length,
        structuralFingerprint: structuralFingerprint(buffer),
        decodedValue: false,
        musicalMeaning: false
      });
    }
    perFile.push({
      relativePath: file.relativePath,
      sizeBytes: stat.size,
      stableOffsetsChecked: stableOffsets.length,
      totalBytesRead: bytesRead,
      withinReadLimit: bytesRead <= MAX_BYTES_PER_FILE_READ,
      windows,
      noValueDecoding: true,
      noMusicalMeaning: true,
      noKeyboardOutput: true
    });
  }
  const offsetResults = stableOffsets.map((offsetInfo) => {
    const fingerprints = perFile.map((file) => {
      const window = file.windows.find((item) => item.requestedOffset === offsetInfo.offset);
      return { relativePath: file.relativePath, fingerprint: window?.structuralFingerprint, bytesRead: window?.bytesRead || 0 };
    }).filter((item) => item.fingerprint);
    const representative = chooseRepresentative(fingerprints);
    const scores = fingerprints.map((item) => ({ relativePath: item.relativePath, similarity: similarity(representative, item.fingerprint) }));
    const averageSimilarity = scores.length ? Number((scores.reduce((sum, item) => sum + item.similarity, 0) / scores.length).toFixed(4)) : 0;
    const outliers = scores.filter((item) => item.similarity < 0.72);
    const presentRatio = fingerprints.length / Math.max(1, prfFiles.length);
    const status = presentRatio >= criteria.stableOffsetExistsInMajorityOfPrfFiles.threshold && averageSimilarity >= 0.72
      ? 'stable'
      : presentRatio >= criteria.stableOffsetExistsInMajorityOfPrfFiles.threshold
        ? 'variable'
        : 'unknown';
    return {
      offset: offsetInfo.offset,
      filesPresentInRun009: offsetInfo.filesPresent,
      windowsValidated: fingerprints.length,
      presentRatio: Number(presentRatio.toFixed(4)),
      averageStructuralSimilarity: averageSimilarity,
      status,
      outliers
    };
  });
  const stableCount = offsetResults.filter((item) => item.status === 'stable').length;
  const variableCount = offsetResults.filter((item) => item.status === 'variable').length;
  const unknownCount = offsetResults.filter((item) => item.status === 'unknown').length;
  const allOutlierPaths = [...new Set(offsetResults.flatMap((item) => item.outliers.map((outlier) => outlier.relativePath)))].sort();
  const confidenceScore = offsetResults.length
    ? Number(((stableCount / offsetResults.length) * 0.65 + (1 - Math.min(1, allOutlierPaths.length / Math.max(1, prfFiles.length))) * 0.2 + (consistencyResults.structuralConsistencyScore || 0) * 0.15).toFixed(4))
    : 0;
  const finalDecision = confidenceScore >= criteria.parserV1ReadyThreshold && stableCount >= Math.ceil(offsetResults.length * 0.75)
    ? 'A. PRF ready for read-only parser v1'
    : confidenceScore >= criteria.moveToStylePadThreshold
      ? 'B. Move to STYLE/PAD structural probe first'
      : 'C. Need more PRF fixtures';
  return {
    prfFilesValidated: prfFiles.length,
    stableOffsetCountFromRun009: stableOffsets.length,
    validatedOffsetCount: offsetResults.length,
    stableOffsetCount: stableCount,
    unstableOffsetCount: variableCount + unknownCount,
    variableOffsetCount: variableCount,
    unknownOffsetCount: unknownCount,
    outlierFiles: allOutlierPaths,
    confidenceScore,
    parserV1Readiness: {
      ready: finalDecision.startsWith('A.'),
      finalDecision,
      reason: finalDecision.startsWith('A.')
        ? 'Stable offsets validated strongly enough for a read-only parser v1.'
        : finalDecision.startsWith('B.')
          ? 'Stable subset is useful, but PRF confidence is not high enough; compare STYLE/PAD before parser v1.'
          : 'PRF confidence is low; more PRF fixtures are needed before parser v1.'
    },
    offsetResults,
    perFile,
    noValueDecoding: true,
    noMusicalMeaning: true,
    noKeyboardOutput: true
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
