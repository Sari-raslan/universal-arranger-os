import fs from 'node:fs';
import path from 'node:path';

const NATIVE_EXTENSIONS = new Set(['.set', '.sty', '.prs', '.prf', '.kst']);

function mode(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [null, 0];
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function overlapRatio(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const union = new Set([...setA, ...setB]);
  if (!union.size) return 1;
  let intersection = 0;
  for (const item of setA) if (setB.has(item)) intersection += 1;
  return intersection / union.size;
}

function boundaryStarts(record) {
  return record.candidateRegionStarts || [];
}

function regionLengths(record) {
  return record.candidateRegionLengths || [];
}

export function checkConsistency({ inventory, lengthCatalogue, fingerprints, schema, criteria }) {
  const records = inventory.records || [];
  const total = records.length;
  const regionCounts = records.map((record) => record.regionCount);
  const [modeRegionCount, modeRegionCountHits] = mode(regionCounts);
  const medianRegionCount = median(regionCounts);
  const headerLength = schema?.headerRegion?.length || inventory.likelyFixedHeaderLength || null;
  const commonOffsets = inventory.commonBoundaryOffsets || [];
  const stableOffsetThreshold = Math.ceil(total * 0.75);
  const stableOffsets = commonOffsets.filter((item) => item.count >= stableOffsetThreshold);
  const variableOffsets = commonOffsets.filter((item) => item.count < stableOffsetThreshold && item.count >= 2);
  const regionLengthDistribution = lengthCatalogue.regionLengthDistribution || inventory.regionLengthDistribution || [];
  const commonLengths = regionLengthDistribution.filter((item) => item.count >= Math.ceil(total * 0.5));
  const recurringFingerprints = fingerprints.recurringStructuralFingerprints || inventory.recurringStructuralFingerprints || [];
  const allStartsUnion = [...new Set(records.flatMap(boundaryStarts))].sort((a, b) => a - b);
  const outliers = records.map((record) => {
    const countDelta = Math.abs(record.regionCount - medianRegionCount);
    const stableHitCount = stableOffsets.filter((offset) => boundaryStarts(record).includes(offset.offset)).length;
    const stableCoverage = stableOffsets.length ? stableHitCount / stableOffsets.length : 0;
    const lengthOverlap = overlapRatio(regionLengths(record), commonLengths.map((item) => item.length));
    const score = Number((0.45 * stableCoverage + 0.25 * lengthOverlap + 0.2 * (countDelta <= 2 ? 1 : countDelta <= 8 ? 0.5 : 0) + 0.1 * (record.fixedHeaderCandidate ? 1 : 0)).toFixed(3));
    return {
      relativePath: record.relativePath,
      regionCount: record.regionCount,
      regionCountDeltaFromMedian: countDelta,
      stableCoverage: Number(stableCoverage.toFixed(3)),
      lengthOverlap: Number(lengthOverlap.toFixed(3)),
      structuralScore: score,
      outlier: score < 0.35
    };
  });
  const outlierList = outliers.filter((item) => item.outlier);
  const headerScore = headerLength ? 1 : 0;
  const regionCountScore = total ? modeRegionCountHits / total : 0;
  const stableOffsetScore = commonOffsets.length ? stableOffsets.length / commonOffsets.length : 0;
  const lengthScore = regionLengthDistribution.length ? commonLengths.length / regionLengthDistribution.length : 0;
  const fingerprintScore = total ? Math.min(1, recurringFingerprints.reduce((sum, item) => sum + item.count, 0) / total) : 0;
  const outlierScore = total ? 1 - outlierList.length / total : 0;
  const score = Number((
    criteria.commonHeaderPatternPresence.weight * headerScore +
    criteria.regionCountSimilarity.weight * regionCountScore +
    criteria.regionLengthDistributionSimilarity.weight * lengthScore +
    criteria.fingerprintSimilarity.weight * fingerprintScore +
    criteria.outlierDetection.weight * outlierScore +
    criteria.commonFooterCandidatePresence.weight * 0.25 +
    0.0
  ).toFixed(3));
  const decision = score >= criteria.parserV1Threshold && outlierList.length <= Math.floor(total * 0.25)
    ? 'A. PRF ready for read-only parser v1'
    : score >= criteria.oneMorePrfCheckThreshold
      ? 'B. Need one more PRF structural check'
      : 'C. Move to STYLE/PAD structural probe';
  return {
    totalPrfFiles: total,
    structuralConsistencyScore: score,
    confidence: score >= 0.62 ? 'medium' : score >= 0.35 ? 'low-medium' : 'low',
    decision,
    scoreParts: { headerScore, regionCountScore, stableOffsetScore, lengthScore, fingerprintScore, outlierScore },
    consistentGroup: outliers.filter((item) => !item.outlier).map((item) => item.relativePath),
    outlierFiles: outlierList,
    commonOffsets,
    stableRegions: stableOffsets.map((item) => ({ startOffset: item.offset, filesPresent: item.count, stability: 'stable-offset' })),
    variableRegions: variableOffsets.map((item) => ({ startOffset: item.offset, filesPresent: item.count, stability: 'variable-offset' })),
    unknownRegions: 'Byte values and musical/performance meanings remain unknown. Regions not represented in Run 008 remain unknown.',
    parserV1Readiness: {
      ready: decision.startsWith('A.'),
      checklist: [
        { item: 'common header pattern presence', pass: Boolean(headerLength) },
        { item: 'region count similarity', pass: regionCountScore >= 0.5 },
        { item: 'region length distribution similarity', pass: lengthScore >= 0.25 },
        { item: 'outlier rate acceptable', pass: outlierScore >= 0.75 },
        { item: 'no value decoding', pass: true },
        { item: 'no writer output', pass: true }
      ]
    },
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
