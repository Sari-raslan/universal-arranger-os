import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePath, supportedExtensions } from './services/analyzer.js';
import { ensureDir, listLibraryItems, removeLibraryItem, safeName } from './services/library.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');
const samplesDir = path.join(rootDir, 'samples');
const docsDir = path.join(rootDir, 'docs');
const uploadsDir = path.join(samplesDir, 'uploads');

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
app.use(express.json({ limit: '2mb' }));

app.get('/api/status', (_req, res) => {
  res.json({
    ok: true,
    app: 'Keyboard Manager',
    supportedExtensions,
    samplesDir
  });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const analysis = await analyzePath(req.file.path, { rootDir: samplesDir });
    res.status(201).json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Upload failed.', detail: error.message });
  }
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

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Keyboard Manager backend listening on http://localhost:${port}`);
});
