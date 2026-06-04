import cors from 'cors';
import express from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';

import { generateMidiFromNotes } from './omr/midi-generator.js';
import { analyzeSheetImage } from './omr/sheet-analyzer.js';

const app = express();
const uploadDir = path.join(process.cwd(), 'uploads', 'sheetmusic');
const midiDir = path.join(process.cwd(), 'generated-midi');

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(midiDir, { recursive: true });

app.use(cors());
app.use('/generated-midi', express.static(midiDir));

const upload = multer({
  dest: uploadDir
});

app.post('/api/omr/upload-sheet', upload.single('sheet'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: 'Sheet music file is required.' });
      return;
    }

    const analysis = await analyzeSheetImage(req.file.path);
    const midiName = `${Date.now()}.mid`;
    const midiPath = path.join(midiDir, midiName);

    await generateMidiFromNotes(analysis.notes, midiPath);

    res.json({
      ok: true,
      analysis,
      midi: path.join('generated-midi', midiName),
      midiUrl: `/generated-midi/${midiName}`
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'OMR analysis failed.'
    });
  }
});

app.listen(3002, () => {
  console.log('OMR engine running on 3002');
});
