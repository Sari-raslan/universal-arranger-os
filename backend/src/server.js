import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
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
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const paypalBase =
  process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
const paypalAmount = process.env.PAYPAL_UAOS_AMOUNT || '25.00';
const paypalCurrency = process.env.PAYPAL_UAOS_CURRENCY || 'USD';

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    uaos_access INTEGER NOT NULL DEFAULT 0
  )
`).run();

const userColumns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name);
if (!userColumns.includes('uaos_access')) {
  db.prepare('ALTER TABLE users ADD COLUMN uaos_access INTEGER NOT NULL DEFAULT 0').run();
}

db.prepare(`
  CREATE TABLE IF NOT EXISTS library_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    type TEXT,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    paypal_order_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    amount TEXT NOT NULL,
    currency TEXT NOT NULL,
    raw TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
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
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '2mb' }));

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication is required.' });
    return;
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (_error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

async function readPayPalError(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
}

async function paypalRequest(pathname, options = {}) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const error = new Error('PayPal credentials are not configured.');
    error.statusCode = 500;
    throw error;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenResponse = await fetch(`${paypalBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!tokenResponse.ok) {
    const detail = await readPayPalError(tokenResponse);
    console.error('PayPal OAuth failed', detail);
    const error = new Error('PayPal authorization failed.');
    error.statusCode = 502;
    throw error;
  }

  const { access_token: accessToken } = await tokenResponse.json();
  const response = await fetch(`${paypalBase}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const detail = await readPayPalError(response);
    console.error('PayPal request failed', { pathname, detail });
    const error = new Error('PayPal request failed.');
    error.statusCode = 502;
    throw error;
  }

  return response.json();
}

function isPaidCapture(capture) {
  const paymentCapture = capture?.purchase_units?.[0]?.payments?.captures?.[0];
  return (
    capture?.status === 'COMPLETED' &&
    paymentCapture?.status === 'COMPLETED' &&
    paymentCapture?.amount?.value === paypalAmount &&
    paymentCapture?.amount?.currency_code === paypalCurrency
  );
}

function upsertPayment({ userId, orderID, status, raw }) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO payments (user_id, paypal_order_id, status, amount, currency, raw, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(paypal_order_id) DO UPDATE SET
      status = excluded.status,
      raw = excluded.raw,
      updated_at = excluded.updated_at
  `).run(userId, orderID, status, paypalAmount, paypalCurrency, JSON.stringify(raw || null), now, now);
}

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

app.post('/api/paypal/orders', requireAuth, async (req, res) => {
  try {
    const order = await paypalRequest('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: paypalCurrency,
              value: paypalAmount
            }
          }
        ]
      })
    });

    upsertPayment({
      userId: req.user.id,
      orderID: order.id,
      status: order.status || 'CREATED',
      raw: order
    });

    res.status(201).json({ id: order.id, status: order.status });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: 'Could not create PayPal order.', detail: error.message });
  }
});

app.post('/api/paypal/orders/:orderID/capture', requireAuth, async (req, res) => {
  try {
    const orderID = String(req.params.orderID || '').trim();
    const payment = db.prepare('SELECT * FROM payments WHERE paypal_order_id = ?').get(orderID);
    if (!payment) return res.status(404).json({ error: 'PayPal order is not registered.' });
    if (payment.user_id !== req.user.id) return res.status(403).json({ error: 'PayPal order does not belong to this user.' });

    const capture = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
      method: 'POST'
    });
    const paid = isPaidCapture(capture);

    upsertPayment({
      userId: req.user.id,
      orderID,
      status: capture.status || 'CAPTURED',
      raw: capture
    });

    if (!paid) {
      res.status(400).json({ error: 'Payment was not completed for the expected amount and currency.' });
      return;
    }

    db.prepare('UPDATE users SET uaos_access = 1 WHERE id = ?').run(req.user.id);
    res.json({ ok: true, uaosAccess: true, orderID });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: 'Could not capture PayPal order.', detail: error.message });
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

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Keyboard Manager backend listening on http://localhost:${port}`);
});
