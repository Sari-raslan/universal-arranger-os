function required(environment, name) {
  const value = String(environment[name] || "").trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function numberValue(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value, fallback = false) {
  if (value == null || value === "") {
    return fallback;
  }

  return /^(1|true|yes|on)$/i.test(String(value));
}

export function readProductionIntegrationsConfig(
  environment = process.env,
  { strict = true } = {},
) {
  const config = {
    nodeEnv: String(environment.NODE_ENV || "development"),
    port: numberValue(environment.UAOS_PRODUCTION_ACCOUNTS_PORT, 3051),
    publicBaseUrl: String(
      environment.UAOS_PUBLIC_BASE_URL || "http://127.0.0.1:5173",
    ).replace(/\/+$/, ""),
    databaseUrl: String(environment.UAOS_DATABASE_URL || ""),
    databaseSsl: booleanValue(environment.UAOS_DATABASE_SSL, true),
    smtpHost: String(environment.UAOS_SMTP_HOST || ""),
    smtpPort: numberValue(environment.UAOS_SMTP_PORT, 587),
    smtpSecure: booleanValue(environment.UAOS_SMTP_SECURE, false),
    smtpUser: String(environment.UAOS_SMTP_USER || ""),
    smtpPassword: String(environment.UAOS_SMTP_PASSWORD || ""),
    smtpFrom: String(environment.UAOS_EMAIL_FROM || ""),
    supportEmail: String(environment.UAOS_SUPPORT_EMAIL || ""),
  };

  if (strict) {
    required(environment, "UAOS_PUBLIC_BASE_URL");
    required(environment, "UAOS_DATABASE_URL");
    required(environment, "UAOS_SMTP_HOST");
    required(environment, "UAOS_SMTP_USER");
    required(environment, "UAOS_SMTP_PASSWORD");
    required(environment, "UAOS_EMAIL_FROM");
    required(environment, "UAOS_SUPPORT_EMAIL");
  }

  return Object.freeze(config);
}

export function productionIntegrationsStatus(
  environment = process.env,
) {
  const config = readProductionIntegrationsConfig(
    environment,
    { strict: false },
  );

  const checks = [
    {
      name: "public-base-url",
      passed: Boolean(environment.UAOS_PUBLIC_BASE_URL),
    },
    {
      name: "database-url",
      passed: Boolean(environment.UAOS_DATABASE_URL),
    },
    {
      name: "smtp-host",
      passed: Boolean(environment.UAOS_SMTP_HOST),
    },
    {
      name: "smtp-user",
      passed: Boolean(environment.UAOS_SMTP_USER),
    },
    {
      name: "smtp-password",
      passed: Boolean(environment.UAOS_SMTP_PASSWORD),
    },
    {
      name: "email-from",
      passed: Boolean(environment.UAOS_EMAIL_FROM),
    },
    {
      name: "support-email",
      passed: Boolean(environment.UAOS_SUPPORT_EMAIL),
    },
  ];

  return {
    config,
    checks,
    productionConfigured: checks.every((check) => check.passed),
  };
}