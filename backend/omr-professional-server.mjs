import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { analyzeSheetToMidi } from './src/omr/pipeline.js';

const app = express();
const upload = multer({ dest: 'uploads/omr' });

app.use(cors());
app.use(express.json());

app.get('/api/omr/health', (req, res) => {
  res.json({
    ok: true,
    service: 'UAOS Professional OMR Engine',
    stages: [
      'computer-vision',
      'staff-segmentation',
      'symbol-classification',
      'musicxml',
      'midi',
      'rhythm-reconstruction',
      'beam-slur-tie',
      'chord-separation',
      'voice-separation'
    ]
  });
});

app.post('/api/omr/upload-sheet', upload.single('sheet'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: 'Missing sheet file'
      });
    }

    const result = await analyzeSheetToMidi(req.file.path);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.listen(3002, () => {
  console.log('UAOS Professional OMR Engine running on 3002');
});
