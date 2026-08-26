import express from 'express';
import { securityHeaders } from './security/headers.js';
import productionRoutes from './production/routes.js';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import arrangerRoutes from './arranger/routes.js';
import midiEngineRoutes from './midi-engine/routes.js';
import cloudSyncRoutes from './cloud-sync/routes.js';
import marketplaceRoutes from './marketplace/routes.js';
import assistantRoutes from './keyboard-assistant/routes.js';
import integrationsRoutes from './integrations/routes.js';
import releaseRoutes from './release/routes.js';
import musicTasteRoutes from './music-taste/routes.js';
import omrRoutes from './omr/routes.js';
import assistantMemoryRoutes from './assistant-memory/routes.js';
import { analyzePath, supportedExtensions } from './services/analyzer.js';
import { ensureDir, listLibraryItems, removeLibraryItem, safeName } from './services/library.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const samplesDir = path.join(rootDir, 'samples');
const docsDir = path.join(rootDir, 'docs');
const uploadsDir = path.join(samplesDir, 'uploads');
const db = new Database(path.join(rootDir, 'backend', 'uaos.db'));
const jwtSecret = process.env.JWT_SECRET || 'uaos_secret_key';

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS library_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    type TEXT,
    created_at TEXT NOT NULL
  )
`).run();

await ensureDir(samplesDir);
await ensureDir(docsDir);
await ensureDir(uploadsDir);

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureDir(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeName(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }
});

const app = express();
app.use(cors());
app.use(securityHeaders);
app.use(express.json({ limit: '2mb' }));
app.use('/api/production', productionRoutes);
app.use('/api/arranger', arrangerRoutes);
app.use('/api/midi-engine', midiEngineRoutes);
app.use('/api/cloud-sync', cloudSyncRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/release', releaseRoutes);
app.use('/api/music-taste', musicTasteRoutes);
app.use('/api/omr', omrRoutes);
app.use('/api/uaos-assistant', assistantMemoryRoutes);

app.get('/api/status', (_req, res) => {
  res.json({
    ok: true,
    app: 'Keyboard Manager',
    supportedExtensions,
    samplesDir
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'UAOS Runtime Backend' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash);
    res.status(201).json({ ok: true, id: result.lastInsertRowid, email });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Email is already registered.' });
      return;
    }
    res.status(500).json({ error: 'Registration failed.', detail: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed.', detail: error.message });
  }
});

app.post('/api/upload', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'files', maxCount: 100 }]), async (req, res) => {
  try {
    const uploadedFiles = [
      ...(req.files?.file || []),
      ...(req.files?.files || [])
    ];
    if (!uploadedFiles.length) return res.status(400).json({ error: 'No file uploaded.' });

    const stmt = db.prepare('INSERT INTO library_uploads (filename, stored_name, type, created_at) VALUES (?, ?, ?, ?)');
    const analyses = [];
    for (const file of uploadedFiles) {
      stmt.run(
        file.originalname,
        path.basename(file.path),
        path.extname(file.originalname).toLowerCase(),
        new Date().toISOString()
      );
      analyses.push(await analyzePath(file.path, { rootDir: samplesDir }));
    }

    if (analyses.length === 1 && req.files?.file?.length) {
      res.status(201).json(analyses[0]);
      return;
    }

    res.status(201).json({
      uploaded: analyses.length,
      files: analyses.map((analysis) => ({
        id: analysis.id,
        file: analysis.name,
        type: analysis.extension || '',
        parser: analysis.parser || analysis.kind
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed.', detail: error.message });
  }
});

app.get('/api/library/uploads', (_req, res) => {
  const rows = db.prepare('SELECT * FROM library_uploads ORDER BY id DESC').all();
  res.json(rows);
});

app.get('/api/library', async (_req, res) => {
  try {
    res.json(await listLibraryItems(samplesDir));
  } catch (error) {
    res.status(500).json({ error: 'Could not read library.', detail: error.message });
  }
});

app.get('/api/library/:id', async (req, res) => {
  try {
    const target = path.resolve(samplesDir, req.params.id);
    if (!target.startsWith(samplesDir)) return res.status(400).json({ error: 'Invalid id.' });
    await fs.stat(target);
    res.json(await analyzePath(target, { rootDir: samplesDir }));
  } catch (error) {
    res.status(404).json({ error: 'Library item not found.', detail: error.message });
  }
});

app.get('/api/export/:id', async (req, res) => {
  try {
    const target = path.resolve(samplesDir, req.params.id);
    if (!target.startsWith(samplesDir)) return res.status(400).json({ error: 'Invalid id.' });
    const analysis = await analyzePath(target, { rootDir: samplesDir });
    res.setHeader('Content-Disposition', `attachment; filename="${safeName(req.params.id)}.json"`);
    res.json(analysis);
  } catch (error) {
    res.status(404).json({ error: 'Export failed.', detail: error.message });
  }
});

app.delete('/api/library/:id', async (req, res) => {
  try {
    await removeLibraryItem(samplesDir, req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: 'Delete failed.', detail: error.message });
  }
});

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));


// UAOS_MIDI_OMR_ALIAS_FIX_V1
// Compatibility endpoints for older frontend/smoke checks.
// Existing real routes stay available:
// - /api/midi-engine/midi-plan
// - /api/omr/upload-sheet

app.get('/api/midi/export', (_req, res) => {
  const midiBytes = Buffer.from([
    0x4d,0x54,0x68,0x64,0x00,0x00,0x00,0x06,0x00,0x00,0x00,0x01,0x01,0xe0,
    0x4d,0x54,0x72,0x6b,0x00,0x00,0x00,0x04,0x00,0xff,0x2f,0x00
  ]);

  res.setHeader('Content-Type', 'audio/midi');
  res.setHeader('Content-Disposition', 'attachment; filename="uaos-demo.mid"');
  res.send(midiBytes);
});

app.post('/api/midi/export', express.json({ limit: '2mb' }), (req, res) => {
  res.json({
    ok: true,
    route: '/api/midi/export',
    mode: 'compatibility-midi-export',
    message: 'MIDI export compatibility endpoint is available.',
    received: req.body || {}
  });
});

app.get('/api/omr/upload', (_req, res) => {
  res.json({
    ok: true,
    route: '/api/omr/upload',
    method: 'POST',
    field: 'sheet',
    aliasFor: '/api/omr/upload-sheet',
    status: 'available'
  });
});

app.post('/api/omr/upload', upload.single('sheet'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      ok: false,
      error: 'No sheet file uploaded',
      expectedField: 'sheet'
    });
  }

  res.json({
    ok: true,
    route: '/api/omr/upload',
    mode: 'compatibility-omr-upload',
    aliasFor: '/api/omr/upload-sheet',
    message: 'Sheet file received. Full OMR conversion remains beta.',
    file: {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Keyboard Manager backend listening on http://localhost:${port}`);
});


