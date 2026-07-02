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

function fingerprintWindow(buffer) {
  let zeroCount = 0;
  let printableCount = 0;
  for (const byte of buffer) {
    if (byte === 0) zeroCount += 1;
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126)) printableCount += 1;
  }
  return {
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    first16Hex: buffer.subarray(0, Math.min(16, buffer.length)).toString('hex'),
    zeroRatio: buffer.length ? Number((zeroCount / buffer.length).toFixed(4)) : 0,
    printableRatio: buffer.length ? Number((printableCount / buffer.length).toFixed(4)) : 0
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => Number.isInteger(value) && value >= 0))].sort((a, b) => a - b);
}

function makeRegions({ fileSize, prefixLength, stableOffsets, run007Record, run008Record, run010OffsetResults }) {
  const stableSet = new Set(stableOffsets);
  const variableStarts = (run008Record?.candidateRegionStarts || []).filter((offset) => !stableSet.has(offset));
  const boundaryStarts = uniqueSorted([0, 256, ...stableOffsets, ...variableStarts.filter((offset) => offset < prefixLength), prefixLength]);
  const regions = [];
  for (let i = 0; i < boundaryStarts.length - 1; i += 1) {
    const start = boundaryStarts[i];
    const end = boundaryStarts[i + 1];
    if (end <= start) continue;
    let label = 'variableRegion';
    let confidence = 'low';
    if (start === 0) {
      label = 'fileHeader';
      confidence = 'medium';
    } else if (stableSet.has(start)) {
      label = 'stableRegion';
      confidence = 'high';
    } else if ((run008Record?.candidateRegionLengths || []).includes(end - start)) {
      label = 'repeatedRegion';
      confidence = 'low-medium';
    }
    const stableValidation = run010OffsetResults.find((item) => item.offset === start) || null;
    regions.push({
      label,
      startOffset: start,
      length: end - start,
      endOffsetExclusive: end,
      confidence,
      stableValidationStatus: stableValidation?.status || null,
      decodedValue: false,
      musicalMeaning: false
    });
  }
  if (prefixLength < fileSize) {
    regions.push({
      label: 'unknownRegion',
      startOffset: prefixLength,
      length: fileSize - prefixLength,
      endOffsetExclusive: fileSize,
      confidence: 'high',
      note: 'Unread in parser v1 by safety limit.',
      decodedValue: false,
      musicalMeaning: false
    });
  }
  const footerCandidate = run007Record?.possibleTableLikeRegions?.length ? null : regions.at(-1) || null;
  if (footerCandidate && footerCandidate.label !== 'unknownRegion') {
    regions.push({
      label: 'footerCandidate',
      startOffset: Math.max(0, fileSize - Math.min(256, fileSize)),
      length: Math.min(256, fileSize),
      endOffsetExclusive: fileSize,
      confidence: 'low',
      decodedValue: false,
      musicalMeaning: false
    });
  }
  return regions;
}

export function buildPrfStructuralCatalogue({ fixtureRoot, fileIndex, run007Map, run008Inventory, run008RegionCatalogue, run009Consistency, run010Validation }) {
  const prfFiles = (fileIndex.files || [])
    .filter((file) => String(file.extension).toLowerCase() === '.prf')
    .map((file) => ({ ...file, relativePath: file.relativePath.replaceAll('\\', '/') }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const run007ByPath = new Map((run007Map.records || []).map((record) => [record.relativePath, record]));
  const run008ByPath = new Map((run008Inventory.records || []).map((record) => [record.relativePath, record]));
  const stableOffsets = (run010Validation.offsetResults || [])
    .filter((item) => item.status === 'stable')
    .map((item) => item.offset);
  const outlierSet = new Set(run010Validation.outlierFiles || []);
  const entries = [];
  for (const file of prfFiles) {
    const fullPath = path.join(fixtureRoot, ...file.relativePath.split('/'));
    const stat = fs.statSync(fullPath);
    const prefix = readPrefix(fullPath, stat.size);
    const run007Record = run007ByPath.get(file.relativePath);
    const run008Record = run008ByPath.get(file.relativePath);
    const regions = makeRegions({
      fileSize: stat.size,
      prefixLength: prefix.length,
      stableOffsets,
      run007Record,
      run008Record,
      run010OffsetResults: run010Validation.offsetResults || []
    });
    const regionFingerprints = regions
      .filter((region) => region.startOffset < prefix.length)
      .map((region) => {
        const slice = prefix.subarray(region.startOffset, Math.min(region.endOffsetExclusive, prefix.length));
        return {
          label: region.label,
          startOffset: region.startOffset,
          lengthSampled: slice.length,
          structuralFingerprint: fingerprintWindow(slice)
        };
      });
    entries.push({
      relativePath: file.relativePath,
      extension: '.prf',
      sizeBytes: stat.size,
      run003Sha256: file.sha256,
      bytesRead: prefix.length,
      readLimit: MAX_BYTES_PER_FILE_READ,
      crossFileConsistencyGroup: outlierSet.has(file.relativePath) ? 'outlier' : 'validated-prf-structural-group',
      outlierFlag: outlierSet.has(file.relativePath),
      structuralRegions: regions,
      regionFingerprints,
      confidence: {
        overall: run010Validation.confidenceScore >= 0.9 ? 'high' : 'medium',
        source: 'Run 010 stable-offset validation plus parser-v1 structural catalogue'
      },
      limitations: ['no value decoding', 'no musical meaning', 'no performance names/settings', 'no keyboard output'],
      decodedValues: false,
      inferredNamesSettingsSoundsStyles: false,
      keyboardOutput: false
    });
  }
  const regionSummary = entries.map((entry) => ({
    relativePath: entry.relativePath,
    regionCount: entry.structuralRegions.length,
    labels: entry.structuralRegions.reduce((acc, region) => {
      acc[region.label] = (acc[region.label] || 0) + 1;
      return acc;
    }, {}),
    outlierFlag: entry.outlierFlag
  }));
  return {
    generatedAt: new Date().toISOString(),
    parser: 'pa3x-prf-readonly-parser-v1',
    outputType: 'non-keyboard JSON structural catalogue only',
    readOnly: true,
    targetExtension: '.prf',
    prfFilesParsed: entries.length,
    maxBytesPerFileRead: MAX_BYTES_PER_FILE_READ,
    parserV1Confidence: run010Validation.confidenceScore,
    run009Decision: run009Consistency.decision,
    run010Decision: run010Validation.parserV1Readiness?.finalDecision,
    noValueDecoding: true,
    noMusicalMeaning: true,
    noKeyboardOutput: true,
    catalogueEntries: entries,
    regionSummary,
    sourceSchemas: {
      run008RegionCatalogue: run008RegionCatalogue.regionLengthDistribution ? 'loaded' : 'missing',
      stableOffsets: stableOffsets.length
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
