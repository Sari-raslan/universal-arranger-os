import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const FRONTEND_ORIGIN =
  process.env.UAOS_FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_ORIGIN
}));

app.use(express.json());

const db = new Database('uaos-payments.db');

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  uaos_access INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS paypal_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  paypal_order_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  paypal_order_id TEXT UNIQUE NOT NULL,
  paypal_capture_id TEXT,
  status TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  raw_json TEXT,
  created_at TEXT NOT NULL
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  product TEXT NOT NULL,
  created_at TEXT NOT NULL
)
`).run();

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

const PRICE = process.env.UAOS_PRICE || '25.00';
const CURRENCY = process.env.UAOS_CURRENCY || 'USD';

function now() {
  return new Date().toISOString();
}

function requireEmail(req, res, next) {
  const email = String(req.headers['x-uaos-email'] || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return res.status(401).json({
      ok: false,
      error: 'Missing x-uaos-email header'
    });
  }

  let user = db.prepare(
    'SELECT * FROM users WHERE email=?'
  ).get(email);

  if (!user) {
    const info = db.prepare(
      'INSERT INTO users (email, created_at) VALUES (?, ?)'
    ).run(email, now());

    user = db.prepare(
      'SELECT * FROM users WHERE id=?'
    ).get(info.lastInsertRowid);
  }

  req.user = user;
  next();
}

async function paypalFetch(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('PayPal API error:', response.status, data);
    throw new Error(
      data?.message || data?.error_description || 'PayPal API request failed'
    );
  }

  return data;
}

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!client || !secret) {
    throw new Error('Missing PayPal credentials');
  }

  const auth = Buffer
    .from(`${client}:${secret}`)
    .toString('base64');

  const data = await paypalFetch(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    }
  );

  return data.access_token;
}

app.get('/api/paypal/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.PAYPAL_ENV || 'sandbox',
    price: PRICE,
    currency: CURRENCY
  });
});

app.post('/api/paypal/create-order', requireEmail, async (req, res) => {
  try {
    const token = await getAccessToken();

    const order = await paypalFetch(
      `${PAYPAL_BASE}/v2/checkout/orders`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: CURRENCY,
              value: PRICE
            },
            description: 'UAOS Early Access'
          }]
        })
      }
    );

    db.prepare(`
      INSERT OR IGNORE INTO paypal_orders
      (user_id, paypal_order_id, status, amount, currency, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      order.id,
      order.status || 'CREATED',
      PRICE,
      CURRENCY,
      now()
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.post('/api/paypal/capture-order', requireEmail, async (req, res) => {
  try {
    const orderID = String(req.body.orderID || '');

    const owned = db.prepare(`
      SELECT * FROM paypal_orders
      WHERE paypal_order_id=? AND user_id=?
    `).get(orderID, req.user.id);

    if (!owned) {
      return res.status(403).json({
        ok: false,
        error: 'Order does not belong to this user'
      });
    }

    const existing = db.prepare(`
      SELECT * FROM payments
      WHERE paypal_order_id=? AND user_id=?
    `).get(orderID, req.user.id);

    if (existing && existing.status === 'COMPLETED') {
      const license = db.prepare(`
        SELECT * FROM licenses WHERE user_id=?
      `).get(req.user.id);

      return res.json({
        ok: true,
        alreadyCaptured: true,
        licenseToken: license?.token
      });
    }

    const token = await getAccessToken();

    const capture = await paypalFetch(
      `${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const cap =
      capture?.purchase_units?.[0]?.payments?.captures?.[0];

    const paid =
      capture?.status === 'COMPLETED' &&
      cap?.status === 'COMPLETED' &&
      cap?.amount?.value === PRICE &&
      cap?.amount?.currency_code === CURRENCY;

    if (!paid) {
      return res.status(400).json({
        ok: false,
        error: 'Payment not verified',
        capture
      });
    }

    db.prepare(`
      INSERT OR REPLACE INTO payments
      (user_id, paypal_order_id, paypal_capture_id, status, amount, currency, raw_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      orderID,
      cap.id,
      'COMPLETED',
      PRICE,
      CURRENCY,
      JSON.stringify(capture),
      now()
    );

    db.prepare(`
      UPDATE users SET uaos_access=1 WHERE id=?
    `).run(req.user.id);

    let license = db.prepare(`
      SELECT * FROM licenses WHERE user_id=?
    `).get(req.user.id);

    if (!license) {
      const licenseToken =
        'UAOS-' + crypto.randomBytes(18).toString('hex').toUpperCase();

      db.prepare(`
        INSERT INTO licenses (user_id, token, product, created_at)
        VALUES (?, ?, ?, ?)
      `).run(
        req.user.id,
        licenseToken,
        'UAOS Early Access',
        now()
      );

      license = db.prepare(`
        SELECT * FROM licenses WHERE user_id=?
      `).get(req.user.id);
    }

    res.json({
      ok: true,
      licenseToken: license.token
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.listen(3010, () => {
  console.log('UAOS secure PayPal backend running on 3010');
});
