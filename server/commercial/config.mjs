function required(name, environment) {
  const value = String(environment[name] || "").trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function integer(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readCommercialConfig(
  environment = process.env,
  { strict = false } = {},
) {
  const config = {
    nodeEnv: String(environment.NODE_ENV || "development"),
    port: integer(environment.UAOS_COMMERCIAL_PORT, 3040),
    publicBaseUrl: String(
      environment.UAOS_PUBLIC_BASE_URL || "http://127.0.0.1:5173",
    ),
    paymentProvider: String(
      environment.UAOS_PAYMENT_PROVIDER || "disabled",
    ),
    paymentSecret: String(environment.UAOS_PAYMENT_SECRET || ""),
    licenseSigningSecret: String(
      environment.UAOS_LICENSE_SIGNING_SECRET || "",
    ),
    adminSecret: String(environment.UAOS_ADMIN_SECRET || ""),
    storageMode: String(
      environment.UAOS_COMMERCIAL_STORAGE || "development-memory",
    ),
    supportEmail: String(environment.UAOS_SUPPORT_EMAIL || ""),
  };

  if (strict) {
    required("UAOS_PUBLIC_BASE_URL", environment);
    required("UAOS_PAYMENT_PROVIDER", environment);
    required("UAOS_PAYMENT_SECRET", environment);
    required("UAOS_LICENSE_SIGNING_SECRET", environment);
    required("UAOS_ADMIN_SECRET", environment);
    required("UAOS_SUPPORT_EMAIL", environment);

    if (config.storageMode !== "database") {
      throw new Error(
        "UAOS_COMMERCIAL_STORAGE must be database for production.",
      );
    }

    if (config.paymentProvider === "disabled") {
      throw new Error(
        "UAOS_PAYMENT_PROVIDER cannot be disabled in production.",
      );
    }
  }

  return Object.freeze(config);
}

export function commercialConfigStatus(environment = process.env) {
  const config = readCommercialConfig(environment);
  const checks = [
    {
      name: "public-base-url",
      passed: Boolean(environment.UAOS_PUBLIC_BASE_URL),
    },
    {
      name: "payment-provider",
      passed:
        Boolean(environment.UAOS_PAYMENT_PROVIDER) &&
        config.paymentProvider !== "disabled",
    },
    {
      name: "payment-secret",
      passed: Boolean(environment.UAOS_PAYMENT_SECRET),
    },
    {
      name: "license-signing-secret",
      passed: Boolean(environment.UAOS_LICENSE_SIGNING_SECRET),
    },
    {
      name: "admin-secret",
      passed: Boolean(environment.UAOS_ADMIN_SECRET),
    },
    {
      name: "support-email",
      passed: Boolean(environment.UAOS_SUPPORT_EMAIL),
    },
    {
      name: "database-storage",
      passed: config.storageMode === "database",
    },
  ];

  return {
    config,
    checks,
    productionReady: checks.every((check) => check.passed),
  };
}