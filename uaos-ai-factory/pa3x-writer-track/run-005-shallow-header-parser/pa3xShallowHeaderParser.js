import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_HEADER_BYTES = 256;
const MAX_METADATA_READ_BYTES = 4096;
const METADATA_EXTENSIONS = new Set(['.md', '.txt', '.json']);
const KEYBOARD_NATIVE_EXTENSIONS = new Set(['.set', '.sty', '.prs', '.kst', '.pcg']);

export function toHexWindows(buffer) {
  const windows = {};
  for (const size of [16, 32, 64, 128, 256]) {
    windows[`first${size}BytesHex`] = buffer.subarray(0, Math.min(size, buffer.length)).toString('hex');
  }
  return windows;
}

export function printableAscii(buffer) {
  let out = '';
  for (const byte of buffer) {
    if (byte === 10 || byte === 13 || byte === 9) out += ' ';
    else if (byte >= 32 && byte <= 126) out += String.fromCharCode(byte);
    else out += '.';
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function nullByteRatio(buffer) {
  if (!buffer.length) return 0;
  let count = 0;
  for (const byte of buffer) if (byte === 0) count += 1;
  return Number((count / buffer.length).toFixed(4));
}

export function repeatedMagicPatterns(buffer) {
  const text = buffer.toString('latin1');
  const patterns = ['KORF', 'RIFF', 'MThd', 'PK\u0003\u0004'];
  return patterns
    .map((pattern) => ({ pattern, count: text.split(pattern).length - 1 }))
    .filter((entry) => entry.count > 0);
}

export function likelyBinaryText(buffer) {
  if (!buffer.length) return 'unknown';
  let printable = 0;
  for (const byte of buffer) {
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126)) printable += 1;
  }
  const printableRatio = printable / buffer.length;
  const nullRatio = nullByteRatio(buffer);
  if (nullRatio > 0.05) return 'binary';
  if (printableRatio > 0.85) return 'text-like';
  return 'binary-like';
}

export function groupKey(record) {
  const magic = record.repeatedMagicPatterns.map((item) => item.pattern).join('+') || 'no-magic';
  const sizeBand = record.sizeBytes < 4096 ? 'small' : record.sizeBytes < 65536 ? 'medium' : 'large';
  return `${record.extension}|${record.likelyRole}|${magic}|${sizeBand}`;
}

function readHeader(filePath, extension, sizeBytes) {
  const readLimit = METADATA_EXTENSIONS.has(extension)
    ? Math.min(sizeBytes, MAX_METADATA_READ_BYTES)
    : Math.min(sizeBytes, DEFAULT_HEADER_BYTES);
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(readLimit);
    const bytesRead = fs.readSync(fd, buffer, 0, readLimit, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

export function buildRoleMap(classifierResults) {
  const roleMap = new Map();
  for (const record of classifierResults.records || []) {
    roleMap.set(record.relativePath.replaceAll('\\', '/'), record);
  }
  return roleMap;
}

export function parseShallowHeaders({ fixtureRoot, fileIndex, classifierResults }) {
  const roleMap = buildRoleMap(classifierResults);
  const records = [];
  const unchangedChecks = [];

  for (const file of fileIndex.files || []) {
    const relativePath = file.relativePath.replaceAll('\\', '/');
    const extension = String(file.extension || path.extname(relativePath)).toLowerCase();
    const fullPath = path.join(fixtureRoot, ...relativePath.split('/'));
    const stat = fs.statSync(fullPath);
    const header = readHeader(fullPath, extension, stat.size);
    const currentSha256 = sha256File(fullPath);
    const classifier = roleMap.get(relativePath) || {};
    const unchanged = currentSha256 === file.sha256 && stat.size === file.sizeBytes;
    unchangedChecks.push({ relativePath, unchanged, run003Sha256: file.sha256, currentSha256 });

    records.push({
      relativePath,
      extension,
      sizeBytes: stat.size,
      run003Sha256: file.sha256,
      currentSha256,
      fixtureUnchangedAgainstRun003: unchanged,
      bytesReadForHeader: header.length,
      readLimitApplied: METADATA_EXTENSIONS.has(extension) ? 'metadata-4096-max' : 'default-256-max',
      ...toHexWindows(header),
      printableAsciiSnippet: printableAscii(header).slice(0, 240),
      repeatedMagicPatterns: repeatedMagicPatterns(header),
      nullByteRatio: nullByteRatio(header),
      likelyBinaryText: likelyBinaryText(header),
      likelyRole: classifier.role || 'unknown',
      classifierConfidence: classifier.confidence || 'unknown',
      parserNeed: classifier.parserNeed || 'unknown',
      folderRole: relativePath.includes('/STYLE/') ? 'STYLE' : relativePath.includes('/PAD/') ? 'PAD' : relativePath.includes('/PERFORM/') ? 'PERFORM' : relativePath.includes('/GLOBAL/') ? 'GLOBAL' : relativePath.includes('/SONGBOOK/') ? 'SONGBOOK' : 'OTHER'
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    readOnly: true,
    defaultHeaderBytes: DEFAULT_HEADER_BYTES,
    maxMetadataReadBytes: MAX_METADATA_READ_BYTES,
    filesParsed: records.length,
    fixtureUnchanged: unchangedChecks.every((item) => item.unchanged),
    records,
    unchangedChecks
  };
}

export function buildGroups(records) {
  const groups = new Map();
  for (const record of records) {
    const key = groupKey(record);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        extension: record.extension,
        likelyRole: record.likelyRole,
        folderRoles: new Set(),
        classifierConfidence: record.classifierConfidence,
        magicPatterns: record.repeatedMagicPatterns.map((item) => item.pattern),
        files: [],
        totalBytes: 0,
        minSize: record.sizeBytes,
        maxSize: record.sizeBytes
      });
    }
    const group = groups.get(key);
    group.folderRoles.add(record.folderRole);
    group.files.push(record.relativePath);
    group.totalBytes += record.sizeBytes;
    group.minSize = Math.min(group.minSize, record.sizeBytes);
    group.maxSize = Math.max(group.maxSize, record.sizeBytes);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    folderRoles: [...group.folderRoles],
    fileCount: group.files.length,
    averageBytes: Math.round(group.totalBytes / group.files.length)
  }));
}

export function safetyScanOutput(outputRoot) {
  const hits = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (KEYBOARD_NATIVE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) hits.push(full);
    }
  }
  walk(outputRoot);
  return hits;
}
