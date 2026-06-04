import express from 'express';
import cors from 'cors';
import { analyzeFrequencySequence } from './src/live-audio/pipeline.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.get('/api/live-audio/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'UAOS Live Audio To MIDI Arranger',
    modes: ['full', 'ork', 'studio']
  });
});

app.post('/api/live-audio/analyze', (req, res) => {
  try {
    const { frequencies, mode } = req.body;

    if (!Array.isArray(frequencies) || frequencies.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'frequencies array is required'
      });
    }

    const result = analyzeFrequencySequence(frequencies, mode || 'full');
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.listen(3020, () => {
  console.log('UAOS Live Audio To MIDI Arranger running on 3020');
});
