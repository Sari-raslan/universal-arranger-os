import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
import { createDefaultSession, exportSession, importSession, migrateSession } from "../uaos-live-clean/src/session/sessionStore.js";

const require = createRequire(import.meta.url);
const express = require("express");
const {
  PLAN_CATALOG,
  ROLE_PERMISSIONS,
  CSRF_HEADER,
  MemoryEmailProvider,
  createDefaultConfig,
  validateConfig,
  createMemoryState,
  createPhase8Platform,
  createUser,
  createPasswordHash,
  verifyPassword,
  validatePassword,
  maskSecret,
  renderEmailTemplate,
  resolveConflict,
  createSyncStatus,
  validateAssetPolicy,
} = require("../server/cloud/phase8Platform.cjs");

function listen(router) {
  return new Promise((resolve) => {
    const app = express();
    app.use(router);
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    method: options.method || "GET",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await response.json();
  return { status: response.status, json, headers: response.headers };
}

test("Phase 8 configuration validates environments and masks secrets", () => {
  const config = createDefaultConfig({ NODE_ENV: "production", DATABASE_URL: "postgres://user:pass@host/db", STRIPE_SECRET_KEY: "sk_live_secret", STRIPE_WEBHOOK_SECRET: "whsec_secret" });
  assert.equal(validateConfig(config).valid, false);
  assert.ok(config.missingSecrets.includes("UAOS_SESSION_SECRET"));
  assert.equal(maskSecret("sk_test_123456789"), "sk_t...6789");
  const dev = createDefaultConfig({ NODE_ENV: "development" });
  assert.equal(validateConfig(dev).valid, true);
  assert.equal(dev.stripe.configured, false);
});

test("Phase 8 account model, password policy and email templates are safe", () => {
  const state = createMemoryState();
  const result = createUser({ email: "USER@Example.COM", password: "correct horse battery" }, state);
  assert.equal(result.user.normalizedEmail, "user@example.com");
  assert.throws(() => createUser({ email: "user@example.com", password: "correct horse battery" }, state), /already exists/);
  assert.throws(() => validatePassword("password123"), /at least|common/);
  const hash = createPasswordHash("another correct horse");
  assert.equal(verifyPassword("another correct horse", hash), true);
  assert.equal(hash.includes("another correct horse"), false);
  const email = renderEmailTemplate("verify", { actionUrl: "https://example.test", expiresIn: "24 hours" }, "ar");
  assert.equal(email.html.includes("<script"), false);
  assert.match(email.text, /24 hours/);
});

test("Phase 8 auth endpoints cover registration, verification, login, CSRF, session rotation and logout", async () => {
  const platform = createPhase8Platform({ env: { NODE_ENV: "test" } });
  const server = await listen(platform.router);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const registered = await request(base, "/auth/register", { method: "POST", body: { email: "a@example.com", password: "correct horse battery" } });
    assert.equal(registered.status, 201);
    assert.ok(registered.json.verificationToken);
    assert.equal(platform.api.emailProvider.sent.length, 1);
    assert.equal((await request(base, "/auth/login", { method: "POST", body: { email: "a@example.com", password: "bad password here" } })).status, 401);
    assert.equal((await request(base, "/auth/verify-email", { method: "POST", body: { token: registered.json.verificationToken } })).status, 200);
    const login = await request(base, "/auth/login", { method: "POST", body: { email: "a@example.com", password: "correct horse battery" } });
    assert.equal(login.status, 200);
    assert.ok(login.json.sessionToken);
    assert.equal((await request(base, "/auth/session", { headers: { authorization: `Bearer ${login.json.sessionToken}` } })).status, 200);
    assert.equal((await request(base, "/auth/logout-all", { method: "POST", headers: { authorization: `Bearer ${login.json.sessionToken}` } })).status, 403);
    assert.equal((await request(base, "/auth/logout-all", { method: "POST", headers: { authorization: `Bearer ${login.json.sessionToken}`, [CSRF_HEADER]: login.json.csrfToken } })).status, 200);
  } finally {
    server.close();
  }
});

test("Phase 8 authorization uses least privilege and no automatic admin", () => {
  assert.ok(ROLE_PERMISSIONS.user.includes("project:create"));
  assert.equal(ROLE_PERMISSIONS.user.includes("admin:manage"), false);
  assert.ok(ROLE_PERMISSIONS.administrator.includes("admin:manage"));
});

test("Phase 8 project API supports metadata CRUD, versions, sync disabled and conflict states", async () => {
  const platform = createPhase8Platform({ env: { NODE_ENV: "test" } });
  const server = await listen(platform.router);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const registered = await request(base, "/auth/register", { method: "POST", body: { email: "p@example.com", password: "correct horse battery" } });
    await request(base, "/auth/verify-email", { method: "POST", body: { token: registered.json.verificationToken } });
    const login = await request(base, "/auth/login", { method: "POST", body: { email: "p@example.com", password: "correct horse battery" } });
    const auth = { authorization: `Bearer ${login.json.sessionToken}`, [CSRF_HEADER]: login.json.csrfToken };
    const created = await request(base, "/projects", { method: "POST", headers: auth, body: { name: "Cloud Song", schemaVersion: 6, localOnlyAssetReferences: ["take-1"] } });
    assert.equal(created.status, 201);
    const id = created.json.project.id;
    assert.equal((await request(base, "/projects", { headers: auth })).json.total, 1);
    assert.equal((await request(base, `/projects/${id}`, { headers: auth })).json.project.name, "Cloud Song");
    assert.equal((await request(base, `/projects/${id}`, { method: "PATCH", headers: auth, body: { name: "Renamed" } })).json.project.name, "Renamed");
    assert.equal((await request(base, `/projects/${id}/archive`, { method: "POST", headers: auth })).json.project.archivedAt !== null, true);
    assert.equal((await request(base, `/projects/${id}/restore`, { method: "POST", headers: auth })).json.project.archivedAt, null);
    assert.equal((await request(base, `/projects/${id}/versions`, { headers: auth })).json.versions.length >= 1, true);
    const sync = await request(base, `/projects/${id}/sync`, { method: "POST", headers: auth, body: { enabled: false } });
    assert.equal(sync.json.sync.status, "disabled");
    assert.equal(sync.json.sync.rawAudioUpload, false);
    assert.equal(resolveConflict({ localRevision: 2, remoteRevision: 2, baseRevision: 1 }), "both-changed");
    assert.equal(createSyncStatus(created.json.project, { offline: true, enabled: true }).status, "offline");
  } finally {
    server.close();
  }
});

test("Phase 8 asset policy blocks traversal, WAV, DLL and invalid MIME foundations", () => {
  assert.equal(validateAssetPolicy({ filename: "project.json", sizeBytes: 10 }).allowed, true);
  assert.equal(validateAssetPolicy({ filename: "../secret.json", sizeBytes: 10 }).allowed, false);
  assert.equal(validateAssetPolicy({ filename: "take.wav", sizeBytes: 10 }).reason, "wav-upload-disabled-by-default");
  assert.equal(validateAssetPolicy({ filename: "plugin.dll", sizeBytes: 10 }).allowed, false);
});

test("Phase 8 billing keeps approved prices and Stripe disabled safely", async () => {
  assert.equal(PLAN_CATALOG.find((plan) => plan.id === "studio-founders").introPrice, 7.99);
  assert.equal(PLAN_CATALOG.find((plan) => plan.id === "pro-arranger-founders").regularPrice, 29.99);
  assert.equal(PLAN_CATALOG.find((plan) => plan.id === "ultimate-planned").notForSale, true);
  const platform = createPhase8Platform({ env: { NODE_ENV: "test" } });
  const server = await listen(platform.router);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await request(base, "/billing/plans")).json.checkoutDisabled, true);
    assert.equal((await request(base, "/billing/checkout", { method: "POST", body: { planId: "studio-founders" } })).status, 409);
    assert.equal((await request(base, "/billing/webhook", { method: "POST", body: {} })).status, 400);
    const webhook = await request(base, "/billing/webhook", { method: "POST", headers: { "stripe-signature": "test", "x-uaos-event-id": "evt_1" }, body: { id: "evt_1" } });
    assert.equal(webhook.json.ok, true);
    const duplicate = await request(base, "/billing/webhook", { method: "POST", headers: { "stripe-signature": "test", "x-uaos-event-id": "evt_1" }, body: { id: "evt_1" } });
    assert.equal(duplicate.json.duplicate, true);
  } finally {
    server.close();
  }
});

test("Phase 8 health readiness capabilities and audit logs sanitize sensitive details", async () => {
  const platform = createPhase8Platform({ env: { NODE_ENV: "test" } });
  const server = await listen(platform.router);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await request(base, "/health")).json.ok, true);
    assert.equal((await request(base, "/ready")).json.productionActivationReady, false);
    assert.equal((await request(base, "/capabilities")).json.capabilities.rawAudioUpload, false);
    platform.api.state.auditEvents.push({ id: "x", type: "test", metadata: { password: "[redacted]", rawAudio: "[redacted]" } });
    assert.equal(JSON.stringify(platform.api.state.auditEvents).includes("correct horse battery"), false);
  } finally {
    server.close();
  }
});

test("Phase 8 session migration and frontend UI expose cloud/account/billing offline-first state", () => {
  const migrated = migrateSession({ version: 5, cloud: { sync: { enabled: true, rawAudioUpload: true }, privacy: { advertiserSharing: true } } });
  assert.equal(migrated.version, 7);
  assert.equal(migrated.cloud.sync.rawAudioUpload, false);
  assert.equal(migrated.cloud.privacy.noAdvertiserSharing, true);
  assert.equal(migrated.beta.flags.values.billingBeta, false);
  assert.equal(importSession(exportSession(createDefaultSession())).cloud.schemaVersion, 1);
  assert.equal(importSession(exportSession(createDefaultSession())).beta.schemaVersion, 1);
  const panel = fs.readFileSync(path.join(process.cwd(), "uaos-live-clean", "src", "components", "CloudPlatformPanel.jsx"), "utf8");
  for (const text of ["UAOS Cloud Platform", "Cloud Projects", "Billing", "Offline First", "Raw audio upload: disabled", "Provider unavailable"]) {
    assert.equal(panel.includes(text), true);
  }
  const app = fs.readFileSync(path.join(process.cwd(), "uaos-live-clean", "src", "App.jsx"), "utf8");
  assert.equal(app.includes('id: "account"'), true);
});
