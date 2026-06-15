const crypto = require("crypto");
const express = require("express");

const PHASE8_SCHEMA_VERSION = 1;
const SESSION_COOKIE = "uaos_cloud_session";
const CSRF_HEADER = "x-uaos-csrf";

const PLAN_CATALOG = Object.freeze([
  { id: "free", name: "Free / Sing", price: 0, currency: "EUR", interval: "month", checkoutAvailable: false, entitlements: ["basic-singing", "limited-local-projects", "demo-export-metadata"] },
  { id: "studio-founders", name: "Studio Founders", introPrice: 7.99, regularPrice: 12.99, introMonths: 3, currency: "EUR", interval: "month", checkoutAvailable: false, entitlements: ["daw", "sampler", "recording", "metadata-sync-when-enabled", "local-ai"] },
  { id: "pro-arranger-founders", name: "Pro Arranger Founders", introPrice: 19.99, regularPrice: 29.99, introMonths: 3, currency: "EUR", interval: "month", checkoutAvailable: false, entitlements: ["arranger", "advanced-midi", "hardware-profiles", "ai-arrangement", "extended-project-limits"] },
  { id: "ultimate-planned", name: "Ultimate / Performer", plannedPrice: 49.99, currency: "EUR", interval: "month", checkoutAvailable: false, notForSale: true, entitlements: ["future-metadata-only"] },
]);

const ROLE_PERMISSIONS = Object.freeze({
  user: ["account:read", "account:update", "project:create", "project:read", "project:update", "project:delete", "project:sync", "export", "billing:read"],
  founder: ["account:read", "account:update", "project:create", "project:read", "project:update", "project:delete", "project:sync", "export", "billing:read"],
  support: ["account:read", "billing:read", "admin:read"],
  administrator: ["account:read", "account:update", "project:create", "project:read", "project:update", "project:delete", "project:sync", "export", "billing:read", "billing:manage", "admin:read", "admin:manage"],
  "system-service": ["admin:read"],
});

const COMMON_PASSWORDS = new Set(["password", "password123", "123456789012", "qwerty123456", "uaospassword"]);

function iso(now = new Date()) {
  return now.toISOString();
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function opaque(prefix = "tok") {
  return `${prefix}_${crypto.randomBytes(24).toString("base64url")}`;
}

function maskSecret(value) {
  if (!value) return null;
  const text = String(value);
  if (text.length <= 8) return "****";
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function normalizeEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
    throw normalizedError("validation-error", "A valid email is required.", 400);
  }
  return normalized;
}

function normalizedError(code, message, status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    normalizedEmail: user.normalizedEmail,
    displayName: user.displayName,
    emailVerified: Boolean(user.emailVerifiedAt),
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin,
    locale: user.locale,
    timezone: user.timezone,
    preferredLanguage: user.preferredLanguage,
    plan: user.plan,
    subscription: user.subscription,
    roles: user.roles,
    permissions: Array.from(new Set(user.roles.flatMap((role) => ROLE_PERMISSIONS[role] || []))),
    deleted: user.deleted,
    anonymized: user.anonymized,
    schemaVersion: user.schemaVersion,
  };
}

function createDefaultConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const production = nodeEnv === "production";
  const required = ["UAOS_SESSION_SECRET", "DATABASE_URL", "SMTP_HOST", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];
  const missing = production ? required.filter((name) => !env[name]) : [];
  return {
    schemaVersion: PHASE8_SCHEMA_VERSION,
    serviceName: "uaos-cloud-platform",
    environment: nodeEnv,
    mode: production ? "production" : nodeEnv === "test" ? "test" : "development",
    production,
    publicFrontendUrl: env.UAOS_PUBLIC_BASE_URL || "http://127.0.0.1:5173",
    apiBaseUrl: env.UAOS_API_BASE_URL || "http://127.0.0.1:3041",
    port: clampNumber(env.PORT || 3041, 1, 65535),
    cookie: { httpOnly: true, secure: production, sameSite: "Lax", path: "/", domain: env.UAOS_COOKIE_DOMAIN || null },
    cors: { allowlist: ["http://127.0.0.1:5173", "http://localhost:5173"] },
    rateLimit: { windowMs: 60_000, max: 120, authMax: 20 },
    uploadLimits: { jsonBytes: 1024 * 1024, assetBytes: 1024 * 1024, wavUploadEnabled: false },
    featureFlags: {
      remoteAiProvider: env.UAOS_REMOTE_AI_ENABLED === "true",
      cloudSync: env.UAOS_CLOUD_SYNC_ENABLED === "true",
      maintenanceMode: env.UAOS_MAINTENANCE_MODE === "true",
    },
    database: { configured: Boolean(env.DATABASE_URL), urlValid: !env.DATABASE_URL || /^postgres(ql)?:\/\//.test(env.DATABASE_URL), maskedUrl: maskSecret(env.DATABASE_URL) },
    smtp: { configured: Boolean(env.SMTP_HOST), host: env.SMTP_HOST || null, user: env.SMTP_USER || null, password: maskSecret(env.SMTP_PASSWORD) },
    stripe: { configured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET), secretKey: maskSecret(env.STRIPE_SECRET_KEY), webhookSecret: maskSecret(env.STRIPE_WEBHOOK_SECRET), liveModeExplicit: env.STRIPE_LIVE_MODE === "true" },
    missingSecrets: missing,
    safeFallback: !production || missing.length === 0,
  };
}

function clampNumber(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value)));
}

function validateConfig(config) {
  const errors = [];
  try { new URL(config.publicFrontendUrl); } catch { errors.push("public-frontend-url-invalid"); }
  try { new URL(config.apiBaseUrl); } catch { errors.push("api-base-url-invalid"); }
  if (!config.port || config.port < 1 || config.port > 65535) errors.push("port-invalid");
  if (config.database.configured && !config.database.urlValid) errors.push("database-url-invalid");
  if (config.production && config.missingSecrets.length) errors.push("production-secrets-missing");
  return { valid: errors.length === 0, errors, missingSecrets: config.missingSecrets };
}

function createMemoryState() {
  return {
    users: [],
    credentials: [],
    sessions: [],
    verificationTokens: [],
    resetTokens: [],
    projects: [],
    versions: [],
    billingEvents: [],
    auditEvents: [],
    consents: [],
    rateLimits: new Map(),
    processedWebhooks: new Set(),
  };
}

function createPasswordHash(password) {
  validatePassword(password);
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return `pbkdf2-v1$120000$${salt}$${hash}`;
}

function verifyPassword(password, encoded) {
  const [version, iterations, salt, hash] = String(encoded || "").split("$");
  if (version !== "pbkdf2-v1") return false;
  const candidate = crypto.pbkdf2Sync(String(password), salt, Number(iterations), 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function validatePassword(password) {
  const text = String(password || "");
  if (text.length < 12) throw normalizedError("password-policy", "Password must be at least 12 characters.", 400);
  if (text.length > 128) throw normalizedError("password-policy", "Password is too long.", 400);
  if (COMMON_PASSWORDS.has(text.toLowerCase())) throw normalizedError("password-policy", "Password is too common.", 400);
  return { valid: true, hashVersion: "pbkdf2-v1" };
}

function createUser({ email, password, displayName = "", locale = "en", timezone = "UTC", preferredLanguage = "en" }, state, now = new Date()) {
  const normalizedEmail = normalizeEmail(email);
  if (state.users.some((user) => user.normalizedEmail === normalizedEmail && !user.deleted)) {
    throw normalizedError("duplicate-email", "An account with this email already exists.", 409);
  }
  const user = {
    id: `usr_${crypto.randomUUID()}`,
    email: normalizedEmail,
    normalizedEmail,
    displayName: String(displayName || normalizedEmail.split("@")[0]),
    passwordCredential: { hashVersion: "pbkdf2-v1", updatedAt: iso(now) },
    oauthIdentities: [],
    emailVerifiedAt: null,
    accountStatus: "active",
    createdAt: iso(now),
    updatedAt: iso(now),
    lastLogin: null,
    locale,
    timezone,
    preferredLanguage,
    plan: "free",
    subscription: { planId: "free", status: "free", provider: "none" },
    roles: ["user"],
    permissions: [],
    deleted: false,
    anonymized: false,
    schemaVersion: PHASE8_SCHEMA_VERSION,
  };
  state.users.push(user);
  state.credentials.push({ userId: user.id, passwordHash: createPasswordHash(password), failedLogins: 0, lockedUntil: null });
  const token = createTokenRecord(state.verificationTokens, user.id, "verify", 24 * 60 * 60 * 1000, now);
  audit(state, "registration", user.id, { email: normalizedEmail });
  return { user: publicUser(user), verificationToken: token.raw };
}

function createTokenRecord(list, userId, type, ttlMs, now = new Date()) {
  const raw = opaque(type);
  const record = { id: `tok_${crypto.randomUUID()}`, userId, tokenHash: sha256(raw), createdAt: iso(now), expiresAt: iso(new Date(now.getTime() + ttlMs)), usedAt: null, replayNonce: opaque("nonce") };
  list.push(record);
  return { raw, record };
}

function verifyToken(list, raw, now = new Date()) {
  const hash = sha256(raw);
  const record = list.find((item) => item.tokenHash === hash && !item.usedAt);
  if (!record || new Date(record.expiresAt).getTime() <= now.getTime()) throw normalizedError("invalid-token", "Token is invalid or expired.", 400);
  record.usedAt = iso(now);
  return record;
}

function createSession(state, user, metadata = {}, now = new Date()) {
  const raw = opaque("sess");
  const csrf = opaque("csrf");
  const record = {
    id: `ses_${crypto.randomUUID()}`,
    userId: user.id,
    tokenHash: sha256(raw),
    csrfHash: sha256(csrf),
    createdAt: iso(now),
    expiresAt: iso(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
    revokedAt: null,
    rotatedFrom: metadata.rotatedFrom || null,
    rememberMe: Boolean(metadata.rememberMe),
    device: { label: metadata.device || "browser", userAgentHash: metadata.userAgent ? sha256(metadata.userAgent).slice(0, 12) : null, ipHash: metadata.ip ? sha256(metadata.ip).slice(0, 12) : null },
  };
  state.sessions = state.sessions.filter((session) => session.userId !== user.id || !session.revokedAt).slice(-4);
  state.sessions.push(record);
  return { session: record, raw, csrf };
}

function sessionFromToken(state, raw) {
  const hash = sha256(raw || "");
  const session = state.sessions.find((item) => item.tokenHash === hash && !item.revokedAt && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) return null;
  const user = state.users.find((item) => item.id === session.userId && !item.deleted);
  return user ? { session, user } : null;
}

function requirePermission(context, permission) {
  const permissions = new Set(context.user.roles.flatMap((role) => ROLE_PERMISSIONS[role] || []));
  if (!permissions.has(permission)) {
    audit(context.state, "admin access denied", context.user.id, { permission });
    throw normalizedError("access-denied", "Access denied.", 403);
  }
}

function audit(state, type, userId = null, metadata = {}) {
  const sanitized = { ...metadata };
  for (const key of Object.keys(sanitized)) {
    if (/password|token|secret|cookie|audio|raw/i.test(key)) sanitized[key] = "[redacted]";
  }
  const event = { id: `aud_${crypto.randomUUID()}`, type, userId, metadata: sanitized, createdAt: iso() };
  state.auditEvents.push(event);
  return event;
}

function createProject(state, user, body) {
  const project = {
    id: `prj_${crypto.randomUUID()}`,
    ownerId: user.id,
    name: String(body.name || "Untitled UAOS Project").slice(0, 120),
    schemaVersion: Number(body.schemaVersion || 1),
    clientVersion: String(body.clientVersion || "uaos-local"),
    contentHash: sha256(JSON.stringify(body.metadata || {})),
    sizeBytes: Number(body.sizeBytes || 0),
    missingAssets: Array.isArray(body.missingAssets) ? body.missingAssets : [],
    localOnlyAssetReferences: Array.isArray(body.localOnlyAssetReferences) ? body.localOnlyAssetReferences : [],
    archivedAt: null,
    deletedAt: null,
    localProjectId: body.localProjectId || null,
    remoteProjectId: null,
    revision: 1,
    lastOpenedAt: null,
    createdAt: iso(),
    updatedAt: iso(),
  };
  state.projects.push(project);
  createProjectVersion(state, user, project, "Project created", "manual-save");
  audit(state, "project created", user.id, { projectId: project.id });
  return project;
}

function createProjectVersion(state, user, project, changeSummary = "Manual save", kind = "manual-save") {
  const version = {
    id: `ver_${crypto.randomUUID()}`,
    projectId: project.id,
    parentVersionId: state.versions.filter((item) => item.projectId === project.id).at(-1)?.id || null,
    createdAt: iso(),
    createdBy: user.id,
    clientVersion: project.clientVersion,
    schemaVersion: project.schemaVersion,
    contentHash: project.contentHash,
    changeSummary,
    kind,
    maxRetainedVersions: 30,
  };
  state.versions.push(version);
  return version;
}

function publicProject(project) {
  return { ...project, ownerId: undefined };
}

function resolveConflict(sync) {
  if (sync.localDeleted && sync.remoteDeleted) return "no-conflict";
  if (sync.schemaVersion && sync.schemaVersion > PHASE8_SCHEMA_VERSION) return "unsupported-version";
  if (sync.localDeleted) return "deleted-locally";
  if (sync.remoteDeleted) return "deleted-remotely";
  if (sync.localRevision > sync.baseRevision && sync.remoteRevision > sync.baseRevision) return "both-changed";
  if (sync.localRevision > sync.remoteRevision) return "local-newer";
  if (sync.remoteRevision > sync.localRevision) return "remote-newer";
  return "no-conflict";
}

function createSyncStatus(project, overrides = {}) {
  const disabled = overrides.enabled !== true;
  return {
    localProjectId: project.localProjectId || project.id,
    remoteProjectId: project.remoteProjectId,
    localRevision: project.revision,
    remoteRevision: overrides.remoteRevision || 0,
    baseRevision: overrides.baseRevision || project.revision,
    contentHash: project.contentHash,
    modifiedAt: project.updatedAt,
    status: disabled ? "disabled" : overrides.offline ? "offline" : "metadata-only-ready",
    pendingUpload: false,
    pendingDownload: false,
    conflictState: disabled ? "disabled" : resolveConflict({ localRevision: project.revision, remoteRevision: overrides.remoteRevision || 0, baseRevision: overrides.baseRevision || project.revision }),
    lastSync: null,
    retry: { attempts: 0, nextAt: null },
    offline: Boolean(overrides.offline),
    disabled,
    userConsent: Boolean(overrides.userConsent),
    progress: 0,
    mode: "metadata-only",
    rawAudioUpload: false,
  };
}

function validateAssetPolicy(file = {}) {
  const name = sanitizeFilename(file.filename || "");
  if (!name) return { allowed: false, reason: "filename-required" };
  if (name.includes("..") || /[\\/]/.test(name)) return { allowed: false, reason: "path-traversal-blocked" };
  const ext = name.split(".").pop().toLowerCase();
  const allowed = new Set(["json", "mid", "midi", "preset", "txt"]);
  const forbidden = new Set(["exe", "dll", "bat", "cmd", "zip", "rar", "wav"]);
  if (forbidden.has(ext)) return { allowed: false, reason: ext === "wav" ? "wav-upload-disabled-by-default" : "forbidden-extension" };
  if (!allowed.has(ext)) return { allowed: false, reason: "invalid-extension" };
  if (Number(file.sizeBytes || 0) > 1024 * 1024) return { allowed: false, reason: "file-too-large" };
  return { allowed: true, filename: name, checksum: sha256(`${name}:${file.sizeBytes || 0}`), storage: "local-mock" };
}

function sanitizeFilename(value) {
  return String(value || "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function renderEmailTemplate(type, data = {}, locale = "en") {
  const titles = {
    verify: { en: "Verify your UAOS account", ar: "تأكيد حساب UAOS", de: "UAOS Konto bestaetigen" },
    reset: { en: "Reset your UAOS password", ar: "إعادة تعيين كلمة مرور UAOS", de: "UAOS Passwort zuruecksetzen" },
    changed: { en: "Your UAOS password changed", ar: "تم تغيير كلمة مرور UAOS", de: "UAOS Passwort geaendert" },
    login: { en: "New UAOS login", ar: "تسجيل دخول جديد إلى UAOS", de: "Neue UAOS Anmeldung" },
    conflict: { en: "Project sync conflict", ar: "تعارض مزامنة المشروع", de: "Projekt-Sync-Konflikt" },
    subscription: { en: "Subscription state changed", ar: "تغيرت حالة الاشتراك", de: "Abo-Status geaendert" },
    deletion: { en: "Account deletion requested", ar: "تم طلب حذف الحساب", de: "Kontoloeschung angefragt" },
  };
  const title = titles[type]?.[locale] || titles[type]?.en || "UAOS notification";
  const expiration = data.expiresIn || "1 hour";
  const text = `${title}\n\nThis message contains no raw secret logs. Token expires in ${expiration}.\n${data.actionUrl ? `Open: ${data.actionUrl}` : ""}`;
  const html = `<h1>${escapeHtml(title)}</h1><p>This message contains no raw secret logs.</p><p>Token expires in ${escapeHtml(expiration)}.</p>`;
  return { subject: title, text, html, locale };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

class MemoryEmailProvider {
  constructor() { this.sent = []; this.type = "memory"; }
  async send(message) {
    const safe = { ...message, token: undefined, rawToken: undefined };
    this.sent.push({ ...safe, status: "queued-memory", id: `mail_${this.sent.length + 1}` });
    return this.sent.at(-1);
  }
}

function createBillingProvider(config, state) {
  return {
    status: config.stripe.configured ? "configured-disabled-until-explicit-live" : "disabled-provider",
    lazyLoaded: false,
    liveModeExplicit: config.stripe.liveModeExplicit,
    checkout(body = {}) {
      return { ok: false, disabled: true, reason: "checkout-disabled-until-stripe-configured", planId: body.planId || null };
    },
    portal() {
      return { ok: false, disabled: true, reason: "customer-portal-disabled-until-stripe-configured" };
    },
    webhook(headers = {}, rawBody = "") {
      const signature = headers["stripe-signature"] || headers["Stripe-Signature"];
      if (!signature) throw normalizedError("webhook-signature-missing", "Webhook signature is required.", 400);
      const eventId = headers["x-uaos-event-id"] || sha256(rawBody).slice(0, 24);
      if (state.processedWebhooks.has(eventId)) return { ok: true, duplicate: true };
      state.processedWebhooks.add(eventId);
      const event = { id: eventId, provider: "stripe-contract", normalized: true, receivedAt: iso() };
      state.billingEvents.push(event);
      audit(state, "billing event received", null, { eventId });
      return { ok: true, event };
    },
  };
}

function createConsentRecord(state, userId, body = {}) {
  const consent = {
    id: `con_${crypto.randomUUID()}`,
    userId,
    termsVersion: body.termsVersion || "draft-2026-06",
    privacyVersion: body.privacyVersion || "draft-2026-06",
    consentAt: iso(),
    analytics: Boolean(body.analytics),
    cloudSync: Boolean(body.cloudSync),
    aiRemoteProvider: Boolean(body.aiRemoteProvider),
    marketing: Boolean(body.marketing),
    withdrawnAt: null,
    retention: "minimal",
    advertiserSharing: false,
    rawAudioUploadDefault: false,
    commercialLibraryUpload: false,
  };
  state.consents.push(consent);
  return consent;
}

function rateLimit(state, key, limit = 120, windowMs = 60_000) {
  const now = Date.now();
  const current = state.rateLimits.get(key) || [];
  const recent = current.filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  state.rateLimits.set(key, recent);
  return true;
}

function createPhase8Platform(options = {}) {
  const state = options.state || createMemoryState();
  const config = options.config || createDefaultConfig(options.env || process.env);
  const emailProvider = options.emailProvider || new MemoryEmailProvider();
  const billingProvider = createBillingProvider(config, state);
  const startedAt = Date.now();

  function contextFromRequest(req) {
    const raw = req.cookies?.[SESSION_COOKIE] || bearer(req);
    const found = raw ? sessionFromToken(state, raw) : null;
    return found ? { ...found, state, rawSession: raw } : null;
  }

  function requireAuth(req, permission = null) {
    const context = contextFromRequest(req);
    if (!context) throw normalizedError("authentication-required", "Authentication is required.", 401);
    if (permission) requirePermission(context, permission);
    return context;
  }

  function requireCsrf(req, context) {
    const csrf = req.headers[CSRF_HEADER] || req.body?.csrfToken;
    if (!csrf || sha256(csrf) !== context.session.csrfHash) throw normalizedError("csrf-invalid", "CSRF token is invalid.", 403);
  }

  const api = {
    state,
    config,
    emailProvider,
    billingProvider,
    register(body) {
      const result = createUser(body, state);
      emailProvider.send({ to: result.user.email, ...renderEmailTemplate("verify", { expiresIn: "24 hours" }, result.user.locale) });
      return result;
    },
    verifyEmail(token) {
      const record = verifyToken(state.verificationTokens, token);
      const user = state.users.find((item) => item.id === record.userId);
      user.emailVerifiedAt = iso();
      user.updatedAt = iso();
      audit(state, "email verified", user.id);
      return publicUser(user);
    },
    login(body, metadata = {}) {
      const email = normalizeEmail(body.email);
      const user = state.users.find((item) => item.normalizedEmail === email && !item.deleted);
      const credential = user && state.credentials.find((item) => item.userId === user.id);
      if (!user || !credential || !verifyPassword(body.password, credential.passwordHash)) {
        if (credential) credential.failedLogins += 1;
        audit(state, "login failure", user?.id || null, { email });
        throw normalizedError("invalid-credentials", "Invalid email or password.", 401);
      }
      if (!user.emailVerifiedAt) throw normalizedError("email-verification-required", "Email verification is required.", 401);
      credential.failedLogins = 0;
      user.lastLogin = { at: iso(), device: metadata.device || "browser" };
      const session = createSession(state, user, metadata);
      audit(state, "login success", user.id);
      return { user: publicUser(user), sessionToken: session.raw, csrfToken: session.csrf, session: publicSession(session.session) };
    },
    logout(raw) {
      const found = sessionFromToken(state, raw);
      if (found) {
        found.session.revokedAt = iso();
        audit(state, "logout", found.user.id);
      }
      return { revoked: Boolean(found) };
    },
    logoutAll(userId) {
      let count = 0;
      for (const session of state.sessions) {
        if (session.userId === userId && !session.revokedAt) {
          session.revokedAt = iso();
          count += 1;
        }
      }
      audit(state, "session revoked", userId, { count });
      return { revoked: count };
    },
    requestPasswordReset(email) {
      const user = state.users.find((item) => item.normalizedEmail === normalizeEmail(email));
      if (!user) return { accepted: true, resetToken: null };
      const token = createTokenRecord(state.resetTokens, user.id, "reset", 60 * 60 * 1000);
      emailProvider.send({ to: user.email, ...renderEmailTemplate("reset", { expiresIn: "1 hour" }, user.locale) });
      audit(state, "password reset requested", user.id);
      return { accepted: true, resetToken: token.raw };
    },
    resetPassword(body) {
      const record = verifyToken(state.resetTokens, body.token);
      const credential = state.credentials.find((item) => item.userId === record.userId);
      credential.passwordHash = createPasswordHash(body.password);
      api.logoutAll(record.userId);
      audit(state, "password changed", record.userId);
      return { changed: true };
    },
    createProjectForUser(user, body) { return publicProject(createProject(state, user, body)); },
    listProjectsForUser(user, query = {}) {
      const page = Math.max(1, Number(query.page || 1));
      const pageSize = Math.min(50, Math.max(1, Number(query.pageSize || 20)));
      const projects = state.projects.filter((item) => item.ownerId === user.id && !item.deletedAt);
      return { items: projects.slice((page - 1) * pageSize, page * pageSize).map(publicProject), page, pageSize, total: projects.length };
    },
    getProject(user, id) {
      const project = state.projects.find((item) => item.id === id && item.ownerId === user.id && !item.deletedAt);
      if (!project) throw normalizedError("project-not-found", "Project was not found.", 404);
      return project;
    },
    updateProject(user, id, body) {
      const project = api.getProject(user, id);
      project.name = body.name == null ? project.name : String(body.name).slice(0, 120);
      project.modifiedAt = iso();
      project.updatedAt = iso();
      project.revision += 1;
      project.contentHash = body.contentHash || sha256(JSON.stringify(body.metadata || project));
      audit(state, "project updated", user.id, { projectId: id });
      return publicProject(project);
    },
  };

  const router = express.Router();
  router.use(express.json({ limit: config.uploadLimits.jsonBytes }));
  router.use((req, res, next) => {
    req.cookies = parseCookies(req.headers.cookie);
    req.requestId = req.headers["x-request-id"] || `req_${crypto.randomUUID()}`;
    res.setHeader("x-request-id", req.requestId);
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("referrer-policy", "no-referrer");
    if (!rateLimit(state, `${req.ip}:${req.path}`, config.rateLimit.max, config.rateLimit.windowMs)) {
      return res.status(429).json({ ok: false, error: { code: "rate-limit-exceeded", message: "Too many requests." }, requestId: req.requestId });
    }
    next();
  });

  router.get("/health", (_req, res) => res.json({ ok: true, service: config.serviceName, environment: config.environment, uptimeMs: Date.now() - startedAt }));
  router.get("/ready", (_req, res) => res.json({ ok: true, ready: true, dependencies: dependencyStatus(config), productionActivationReady: false }));
  router.get("/version", (_req, res) => res.json({ ok: true, version: "phase8-cloud-foundation", schemaVersion: PHASE8_SCHEMA_VERSION, build: { source: "local", production: false } }));
  router.get("/capabilities", (_req, res) => res.json({ ok: true, capabilities: { accounts: true, projects: true, sync: "disabled-by-default", billing: billingProvider.status, email: emailProvider.type, database: "memory-dev", rawAudioUpload: false, commercialLibraryUpload: false } }));

  router.post("/auth/register", (req, res, next) => handle(next, () => res.status(201).json({ ok: true, ...api.register(req.body), verificationRequired: true })));
  router.post("/auth/verify-email", (req, res, next) => handle(next, () => res.json({ ok: true, user: api.verifyEmail(req.body.token) })));
  router.post("/auth/login", (req, res, next) => handle(next, () => {
    const result = api.login(req.body, { userAgent: req.headers["user-agent"], ip: req.ip, rememberMe: req.body.rememberMe });
    res.cookie?.(SESSION_COOKIE, result.sessionToken, config.cookie);
    res.json({ ok: true, ...result });
  }));
  router.post("/auth/logout", (req, res, next) => handle(next, () => res.json({ ok: true, ...api.logout(req.cookies?.[SESSION_COOKIE] || bearer(req)) })));
  router.post("/auth/logout-all", (req, res, next) => handle(next, () => { const context = requireAuth(req); requireCsrf(req, context); res.json({ ok: true, ...api.logoutAll(context.user.id) }); }));
  router.get("/auth/session", (req, res) => { const context = contextFromRequest(req); res.status(context ? 200 : 401).json(context ? { ok: true, user: publicUser(context.user), session: publicSession(context.session) } : { ok: false, error: { code: "invalid-session", message: "No active session." } }); });
  router.post("/auth/request-password-reset", (req, res, next) => handle(next, () => res.status(202).json({ ok: true, ...api.requestPasswordReset(req.body.email) })));
  router.post("/auth/reset-password", (req, res, next) => handle(next, () => res.json({ ok: true, ...api.resetPassword(req.body) })));

  router.get("/account", (req, res, next) => handle(next, () => { const context = requireAuth(req, "account:read"); res.json({ ok: true, user: publicUser(context.user), consents: state.consents.filter((item) => item.userId === context.user.id) }); }));
  router.patch("/account", (req, res, next) => handle(next, () => { const context = requireAuth(req, "account:update"); requireCsrf(req, context); context.user.displayName = String(req.body.displayName || context.user.displayName); context.user.locale = req.body.locale || context.user.locale; context.user.timezone = req.body.timezone || context.user.timezone; context.user.preferredLanguage = req.body.preferredLanguage || context.user.preferredLanguage; context.user.updatedAt = iso(); res.json({ ok: true, user: publicUser(context.user) }); }));
  router.get("/account/sessions", (req, res, next) => handle(next, () => { const context = requireAuth(req, "account:read"); res.json({ ok: true, sessions: state.sessions.filter((item) => item.userId === context.user.id).map(publicSession) }); }));
  router.delete("/account/sessions/:id", (req, res, next) => handle(next, () => { const context = requireAuth(req, "account:update"); const session = state.sessions.find((item) => item.id === req.params.id && item.userId === context.user.id); if (session) session.revokedAt = iso(); res.json({ ok: true, revoked: Boolean(session) }); }));
  router.post("/account/export-request", (req, res, next) => handle(next, () => { const context = requireAuth(req); audit(state, "data export requested", context.user.id); res.json({ ok: true, queued: true, delivery: "manual-foundation" }); }));
  router.post("/account/delete-request", (req, res, next) => handle(next, () => { const context = requireAuth(req); audit(state, "account deletion requested", context.user.id); res.json({ ok: true, queued: true, anonymization: "foundation" }); }));
  router.post("/account/consent", (req, res, next) => handle(next, () => { const context = requireAuth(req); res.json({ ok: true, consent: createConsentRecord(state, context.user.id, req.body) }); }));

  router.post("/projects", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:create"); res.status(201).json({ ok: true, project: api.createProjectForUser(context.user, req.body) }); }));
  router.get("/projects", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:read"); res.json({ ok: true, ...api.listProjectsForUser(context.user, req.query) }); }));
  router.get("/projects/:id", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:read"); res.json({ ok: true, project: publicProject(api.getProject(context.user, req.params.id)) }); }));
  router.patch("/projects/:id", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:update"); requireCsrf(req, context); res.json({ ok: true, project: api.updateProject(context.user, req.params.id, req.body) }); }));
  router.post("/projects/:id/archive", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:update"); const project = api.getProject(context.user, req.params.id); project.archivedAt = iso(); audit(state, "project archived", context.user.id, { projectId: project.id }); res.json({ ok: true, project: publicProject(project) }); }));
  router.post("/projects/:id/restore", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:update"); const project = api.getProject(context.user, req.params.id); project.archivedAt = null; res.json({ ok: true, project: publicProject(project) }); }));
  router.delete("/projects/:id", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:delete"); const project = api.getProject(context.user, req.params.id); project.deletedAt = iso(); res.json({ ok: true, deleted: true }); }));
  router.get("/projects/:id/versions", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:read"); const project = api.getProject(context.user, req.params.id); res.json({ ok: true, versions: state.versions.filter((item) => item.projectId === project.id) }); }));
  router.post("/projects/:id/versions", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:update"); const project = api.getProject(context.user, req.params.id); res.status(201).json({ ok: true, version: createProjectVersion(state, context.user, project, req.body.changeSummary, req.body.kind || "manual-save") }); }));
  router.post("/projects/:id/sync", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:sync"); const project = api.getProject(context.user, req.params.id); const sync = createSyncStatus(project, req.body); if (sync.conflictState !== "disabled" && sync.conflictState !== "no-conflict") audit(state, "sync conflict", context.user.id, { projectId: project.id, conflictState: sync.conflictState }); else audit(state, "sync requested", context.user.id, { projectId: project.id, status: sync.status }); res.json({ ok: true, sync }); }));
  router.get("/projects/:id/sync-status", (req, res, next) => handle(next, () => { const context = requireAuth(req, "project:read"); res.json({ ok: true, sync: createSyncStatus(api.getProject(context.user, req.params.id)) }); }));

  router.get("/billing/plans", (_req, res) => res.json({ ok: true, plans: PLAN_CATALOG, provider: billingProvider.status, checkoutDisabled: true }));
  router.get("/billing/status", (req, res) => { const context = contextFromRequest(req); res.json({ ok: true, currentPlan: context?.user.plan || "free", provider: billingProvider.status, testMode: true, checkoutAvailable: false, noHiddenCharge: true }); });
  router.post("/billing/checkout", (req, res) => res.status(409).json(billingProvider.checkout(req.body)));
  router.post("/billing/portal", (_req, res) => res.status(409).json(billingProvider.portal()));
  router.post("/billing/webhook", (req, res, next) => handle(next, () => res.json(billingProvider.webhook(req.headers, JSON.stringify(req.body || {})))));

  router.get("/admin/health", (req, res, next) => handle(next, () => { const context = requireAuth(req, "admin:read"); res.json({ ok: true, users: state.users.length, projects: state.projects.length, auditEvents: state.auditEvents.length, featureFlags: config.featureFlags, providerStatus: dependencyStatus(config), requester: context.user.id }); }));
  router.post("/assets/validate", (req, res) => res.json({ ok: true, policy: validateAssetPolicy(req.body) }));
  router.get("/audit", (req, res, next) => handle(next, () => { const context = requireAuth(req, "admin:read"); res.json({ ok: true, events: state.auditEvents, requester: context.user.id }); }));

  router.use((error, req, res, _next) => {
    const status = error.status || 500;
    res.status(status).json({ ok: false, error: { code: error.code || "internal-error", message: status >= 500 && config.production ? "Internal server error." : error.message }, requestId: req.requestId });
  });

  return { router, api };
}

function parseCookies(header = "") {
  return String(header || "").split(";").filter(Boolean).reduce((cookies, part) => {
    const index = part.indexOf("=");
    if (index === -1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function dependencyStatus(config) {
  return {
    database: config.database.configured ? "configured" : "disabled-local-memory",
    emailProvider: config.smtp.configured ? "smtp-configured-disabled-until-explicit" : "memory-provider",
    billingProvider: config.stripe.configured ? "stripe-configured-disabled-until-explicit" : "disabled-provider",
    syncProvider: config.featureFlags.cloudSync ? "metadata-ready" : "disabled-by-default",
    telemetry: "disabled-by-default",
  };
}

function publicSession(session) {
  return session ? { id: session.id, createdAt: session.createdAt, expiresAt: session.expiresAt, revoked: Boolean(session.revokedAt), rememberMe: session.rememberMe, device: session.device } : null;
}

function bearer(req) {
  const match = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || ""));
  return match ? match[1] : null;
}

function handle(next, fn) {
  try {
    Promise.resolve(fn()).catch(next);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  PHASE8_SCHEMA_VERSION,
  PLAN_CATALOG,
  ROLE_PERMISSIONS,
  SESSION_COOKIE,
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
  createPluginHostContract: () => ({ externalPlugins: false }),
};
