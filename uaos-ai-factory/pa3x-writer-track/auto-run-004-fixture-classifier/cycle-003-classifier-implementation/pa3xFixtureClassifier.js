import fs from 'node:fs';

export function classifyFile(file) {
  const ext = String(file.extension || '').toLowerCase();
  const rel = String(file.relativePath || '');
  const upper = rel.toUpperCase();
  const base = {
    '.sty': ['style-related', 'high', 'Style bank metadata parser; deep parse blocked until owner approval.'],
    '.pad': ['pad-related', 'high', 'Pad bank metadata parser.'],
    '.prf': ['performance-related', 'high', 'Performance bank metadata parser.'],
    '.gbl': ['global-related', 'high', 'Global settings metadata parser.'],
    '.mxp': ['global-mixer-preset-related', 'medium', 'Mixer preset metadata parser.'],
    '.voc': ['vocal-preset-related', 'medium', 'Vocal preset metadata parser.'],
    '.sbd': ['songbook-related', 'medium', 'SongBook metadata parser.'],
    '.sbl': ['songbook-list-related', 'medium', 'SongBook list metadata parser.'],
    '.md': ['metadata-report', 'high', 'No parser required.']
  }[ext] || ['unknown', 'low', 'Unknown metadata classifier.'];
  let [role, confidence, parserNeed] = base;
  if (upper.includes('/SOUND/')) [role, confidence, parserNeed] = ['sound-related', 'medium', 'Sound metadata parser; no sample extraction.'];
  if (upper.includes('/PCM/')) [role, confidence, parserNeed] = ['PCM/sample-related', 'medium', 'Inventory-only sample presence detector.'];
  return {
    relativePath: rel,
    extension: ext,
    sizeBytes: file.sizeBytes,
    role,
    confidence,
    parserNeed,
    setContainer: upper.includes('.SET/') ? rel.slice(0, upper.indexOf('.SET/') + 4) : null,
    korgLikeHeader: String(file.asciiSignature || '').includes('KORF')
  };
}

export function classifyFixture(fileIndexPath) {
  const input = JSON.parse(fs.readFileSync(fileIndexPath, 'utf8'));
  const records = input.files.map(classifyFile);
  const summary = {};
  for (const record of records) {
    summary[record.role] = (summary[record.role] || 0) + 1;
  }
  return {
    generatedAt: new Date().toISOString(),
    source: fileIndexPath,
    readOnly: true,
    filesClassified: records.length,
    roleSummary: summary,
    records
  };
}
