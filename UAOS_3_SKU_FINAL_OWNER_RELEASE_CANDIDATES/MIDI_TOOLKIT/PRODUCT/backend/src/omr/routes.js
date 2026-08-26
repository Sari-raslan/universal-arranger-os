import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';

const router = express.Router();
const uploadDir = path.resolve('uploads', 'sheet');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const stamp = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${stamp}${path.extname(file.originalname || '').toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/upload-sheet', upload.single('sheet'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: 'No sheet file uploaded'
      });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const supported = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];

    if (!supported.includes(ext)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        ok: false,
        error: 'Unsupported sheet file type. Use image or PDF.'
      });
    }

    return res.json({
      ok: true,
      mode: 'omr-fallback',
      message: 'Sheet file received. Professional OMR conversion is in beta; this result prepares the file for future MIDI conversion.',
      file: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      analysis: {
        detected: true,
        staffDetection: 'pending-ml-model',
        noteRecognition: 'beta',
        midiReady: false,
        nextStep: 'Train OMR model and convert recognized notes to MIDI.'
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
