import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const sounds = [
  {
    id: 'uaos-grand-piano',
    name: 'UAOS Grand Piano',
    category: 'Piano'
  },
  {
    id: 'uaos-orient-strings',
    name: 'UAOS Oriental Strings',
    category: 'Strings'
  },
  {
    id: 'uaos-synth-pad',
    name: 'UAOS Synth Pad',
    category: 'Synth'
  }
];

app.get('/api/sounds/health', (req, res) => {
  res.json({
    ok: true,
    service: 'UAOS Sound Library',
    sounds: sounds.length
  });
});

app.get('/api/sounds/library', (req, res) => {
  res.json({
    ok: true,
    items: sounds
  });
});

app.listen(3030, () => {
  console.log('UAOS Sound Library running on 3030');
});
