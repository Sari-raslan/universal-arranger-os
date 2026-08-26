import fs from 'node:fs/promises';
import path from 'node:path';

export const supportedExtensions = ['.mid', '.midi', '.syx', '.sty', '.set', '.pcg', '.kst', '.pad', '.prs', '.all', '.bkp', '.pkg'];
const arrangerExtensions = new Set(['.sty', '.set', '.pcg', '.kst', '.pad', '.prs', '.all', '.bkp', '.pkg']);

function detectKorgPadFolderPresence(input) {
  const values = [];

  function collect(value) {
    if (!value) return;

    if (typeof value === 'string') {
      values.push(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) collect(item);
      return;
    }

    if (typeof value === 'object') {
      for (const key of ['path', 'name', 'filename', 'originalname', 'relativePath']) {
        if (value[key]) values.push(String(value[key]));
      }

      for (const key of Object.keys(value)) {
        if (key.toLowerCase().includes('pad')) values.push(key);
      }
    }
  }

  collect(input);

  return values
    .map((value) => String(value).replace(/\\/g, '/').toUpperCase())
    .some((value) =>
      value === 'PAD' ||
      value.endsWith('/PAD') ||
      value.includes('/PAD/') ||
      value.includes('.PAD') ||
      value.endsWith('/PAD/')
    );
}

export async function analyzePath(targetPath, options = {}) {
  const stat = await fs.stat(targetPath);
  const rootDir = options.rootDir || path.dirname(targetPath);
  if (stat.isDirectory()) return analyzeDirectory(targetPath, rootDir);
  return analyzeFile(targetPath, rootDir);
}

async function analyzeDirectory(targetPath, rootDir) {
  const files = await walk(targetPath);
  const summaries = [];
  const extCounts = {};
  let totalSize = 0;
  for (const filePath of files) {
    const stat = await fs.stat(filePath);
    totalSize += stat.size;
    const ext = path.extname(filePath).toLowerCase() || '[none]';
    extCounts[ext] = (extCounts[ext] || 0) + 1;
    if (summaries.length < 60) {
      summaries.push(await analyzeFile(filePath, rootDir, { lightweight: true }));
    }
  }
  const strings = unique(summaries.flatMap((item) => item.strings || [])).slice(0, 80);
  return baseResult(targetPath, rootDir, {
    kind: 'directory',
    extension: path.extname(targetPath).toLowerCase(),
    size: totalSize,
    fileCount: files.length,
    possibleBrand: detectBrand(`${targetPath}\n${strings.join('\n')}`),
    proprietary: true,
    deepParserNeeded: true,
    message: 'Directory-based arranger set inspected safely. Proprietary subformats are summarized without decoding musical/sample content.',
    extensionCounts: extCounts,
    strings,
    children: summaries
  });
}

async function analyzeFile(filePath, rootDir, options = {}) {
  const stat = await fs.stat(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const maxRead = options.lightweight ? 256 * 1024 : 2 * 1024 * 1024;
  const handle = await fs.open(filePath, 'r');
  const buffer = Buffer.alloc(Math.min(stat.size, maxRead));
  try {
    await handle.read(buffer, 0, buffer.length, 0);
  } finally {
    await handle.close();
  }

  const common = {
    kind: 'file',
    extension,
    size: stat.size,
    supported: supportedExtensions.includes(extension),
    hexPreview: buffer.subarray(0, 128).toString('hex').match(/.{1,2}/g)?.join(' ') || '',
    strings: extractStrings(buffer).slice(0, options.lightweight ? 20 : 120)
  };

  try {
    if (extension === '.mid' || extension === '.midi' || buffer.subarray(0, 4).toString('ascii') === 'MThd') {
      return baseResult(filePath, rootDir, { ...common, parser: 'midi', midi: parseMidi(buffer) });
    }
    if (extension === '.syx') {
      return baseResult(filePath, rootDir, { ...common, parser: 'sysex', sysex: parseSysex(buffer) });
    }
    if (arrangerExtensions.has(extension) || !supportedExtensions.includes(extension)) {
      return baseResult(filePath, rootDir, {
        ...common,
        parser: 'arranger-safe-inspector',
        possibleBrand: detectBrand(`${filePath}\n${common.strings.join('\n')}`),
        proprietary: arrangerExtensions.has(extension),
        deepParserNeeded: arrangerExtensions.has(extension),
        metadata: inspectBinary(buffer, stat.size)
      });
    }
    return baseResult(filePath, rootDir, { ...common, parser: 'binary-safe-inspector', metadata: inspectBinary(buffer, stat.size) });
  } catch (error) {
    return baseResult(filePath, rootDir, { ...common, parser: 'error-safe-inspector', warning: error.message });
  }
}

function baseResult(filePath, rootDir, data) {
  const analysis = {
    id: path.relative(rootDir, filePath).replaceAll(path.sep, '/'),
    name: path.basename(filePath),
    path: path.relative(process.cwd(), filePath).replaceAll(path.sep, '/'),
    analyzedAt: new Date().toISOString(),
    ...data
  };

  analysis.korg = analysis.korg || {};
  analysis.korg.pad = analysis.korg.pad || {};
  analysis.korg.pad.folderPresent = detectKorgPadFolderPresence([
    analysis,
    analysis.children,
    analysis.files,
    analysis.entries,
    analysis.paths,
    analysis.archiveEntries,
    analysis.detectedFiles,
    analysis.metadata
  ]);

  return analysis;
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(fullPath));
    if (entry.isFile()) out.push(fullPath);
  }
  return out;
}

function parseMidi(buffer) {
  if (buffer.length < 14 || buffer.subarray(0, 4).toString('ascii') !== 'MThd') throw new Error('Missing MThd header.');
  const headerLength = buffer.readUInt32BE(4);
  const format = buffer.readUInt16BE(8);
  const trackCount = buffer.readUInt16BE(10);
  const divisionRaw = buffer.readUInt16BE(12);
  let offset = 8 + headerLength;
  let notes = 0;
  let controllers = 0;
  let programChanges = 0;
  let tempoEvents = 0;
  let sysexEvents = 0;

  for (let track = 0; track < trackCount && offset + 8 <= buffer.length; track += 1) {
    if (buffer.subarray(offset, offset + 4).toString('ascii') !== 'MTrk') break;
    const length = buffer.readUInt32BE(offset + 4);
    const end = Math.min(buffer.length, offset + 8 + length);
    let cursor = offset + 8;
    let runningStatus = null;
    while (cursor < end) {
      const delta = readVarLen(buffer, cursor, end);
      cursor = delta.next;
      let status = buffer[cursor++];
      if (status < 0x80) {
        cursor -= 1;
        status = runningStatus;
      } else if (status < 0xf0) {
        runningStatus = status;
      }
      if (status === 0xff) {
        const type = buffer[cursor++];
        const len = readVarLen(buffer, cursor, end);
        cursor = len.next + len.value;
        if (type === 0x51) tempoEvents += 1;
      } else if (status === 0xf0 || status === 0xf7) {
        const len = readVarLen(buffer, cursor, end);
        cursor = len.next + len.value;
        sysexEvents += 1;
      } else if (status >= 0x80 && status <= 0xef) {
        const event = status & 0xf0;
        const size = event === 0xc0 || event === 0xd0 ? 1 : 2;
        if (event === 0x90 && buffer[cursor + 1] > 0) notes += 1;
        if (event === 0xb0) controllers += 1;
        if (event === 0xc0) programChanges += 1;
        cursor += size;
      } else {
        break;
      }
    }
    offset = end;
  }
  return {
    validHeader: true,
    headerLength,
    format,
    trackCount,
    division: divisionRaw,
    ppq: divisionRaw < 0x8000 ? divisionRaw : null,
    notes,
    controllers,
    programChanges,
    tempoEvents,
    sysexEvents
  };
}

function readVarLen(buffer, start, end) {
  let value = 0;
  let cursor = start;
  for (let i = 0; i < 4 && cursor < end; i += 1) {
    const byte = buffer[cursor++];
    value = (value << 7) + (byte & 0x7f);
    if ((byte & 0x80) === 0) break;
  }
  return { value, next: cursor };
}

function parseSysex(buffer) {
  const blocks = [];
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] !== 0xf0 && buffer[i] !== 0xf7) continue;
    const start = i;
    let end = i + 1;
    while (end < buffer.length && buffer[end] !== 0xf7) end += 1;
    if (end < buffer.length) end += 1;
    blocks.push({
      start,
      length: end - start,
      startsWith: `0x${buffer[start].toString(16).padStart(2, '0')}`,
      manufacturerByte: buffer[start + 1] === undefined ? null : `0x${buffer[start + 1].toString(16).padStart(2, '0')}`
    });
    i = end;
  }
  return {
    hasF0: buffer.includes(0xf0),
    hasF7: buffer.includes(0xf7),
    blockCount: blocks.length,
    manufacturerByte: blocks[0]?.manufacturerByte || null,
    blocks: blocks.slice(0, 50),
    rawHexPreview: buffer.subarray(0, 256).toString('hex').match(/.{1,2}/g)?.join(' ') || ''
  };
}

function inspectBinary(buffer, size) {
  const zeroBytes = buffer.filter((byte) => byte === 0).length;
  return {
    inspectedBytes: buffer.length,
    totalBytes: size,
    asciiRatio: buffer.length ? Number((buffer.filter((byte) => byte >= 32 && byte <= 126).length / buffer.length).toFixed(3)) : 0,
    zeroByteRatio: buffer.length ? Number((zeroBytes / buffer.length).toFixed(3)) : 0
  };
}

function extractStrings(buffer) {
  const text = buffer.toString('latin1').replace(/[^\x20-\x7e]+/g, '\n');
  return unique(text.split('\n').map((item) => item.trim()).filter((item) => item.length >= 4));
}

function detectBrand(text) {
  const haystack = text.toLowerCase();
  if (haystack.includes('korg') || haystack.includes('.set') || haystack.includes('pa80') || haystack.includes('pa1x')) return 'Korg';
  if (haystack.includes('yamaha') || haystack.includes('tyros') || haystack.includes('psr')) return 'Yamaha';
  if (haystack.includes('roland')) return 'Roland';
  if (haystack.includes('ketron')) return 'Ketron';
  return 'unknown';
}

function unique(values) {
  return [...new Set(values)];
}
