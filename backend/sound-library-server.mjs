import express from 'express';
import cors from 'cors';
import {
  loadFactorySoundLibrary,
  getPresetById
} from './src/sounds/soundLibraryService.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/sounds/library', (req, res) => {
  res.json(loadFactorySoundLibrary());
});

app.get('/api/sounds/presets/:id', (req, res) => {
  const preset = getPresetById(req.params.id);

  if (!preset) {
    return res.status(404).json({
      ok: false,
      error: 'Preset not found'
    });
  }

  res.json({
    ok: true,
    preset
  });
});

app.listen(3020, () => {
  console.log('UAOS sound library backend running on 3020');
});
