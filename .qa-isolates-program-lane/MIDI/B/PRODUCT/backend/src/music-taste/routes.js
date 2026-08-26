import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMusicTasteProfile } from './profile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..', '..');
const uploadDir = path.join(backendDir, 'uploads', 'taste');
const dbPath = path.join(backendDir, 'uaos-taste-profiles.json');

fs.mkdirSync(uploadDir, { recursive: true });

const router = express.Router();
const upload = multer({ dest: uploadDir });

function readDb() {
  if (!fs.existsSync(dbPath)) return [];
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

router.post('/profile', upload.array('files'), async (req, res) => {
  try {
    const input = {
      favoriteGenres: req.body.favoriteGenres,
      favoriteArtists: req.body.favoriteArtists,
      youtube: req.body.youtube,
      spotify: req.body.spotify,
      zodiac: req.body.zodiac,
      zodiacOptIn: req.body.zodiacOptIn === 'true',
      sheetMusic: (req.files || []).map((file) => ({
        originalName: file.originalname,
        storedName: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }))
    };

    const profile = buildMusicTasteProfile(input);
    const row = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      profile
    };

    const db = readDb();
    db.push(row);
    writeDb(db);

    res.status(201).json({ ok: true, id: row.id, profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save taste profile.', detail: error.message });
  }
});

router.get('/profiles', (_req, res) => {
  try {
    res.json(readDb());
  } catch (error) {
    res.status(500).json({ error: 'Failed to read taste profiles.', detail: error.message });
  }
});

export default router;
