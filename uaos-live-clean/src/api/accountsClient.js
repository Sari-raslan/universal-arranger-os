const DEFAULT_BASE_URL = "http://127.0.0.1:3041";

export const ACCOUNTS_API_BASE_URL = String(
  import.meta.env.VITE_UAOS_ACCOUNTS_URL || DEFAULT_BASE_URL,
).replace(/\/+$/, "");

async function request(
  path,
  {
    method = "GET",
    body,
    token,
  } = {},
) {
  const response = await fetch(`${ACCOUNTS_API_BASE_URL}${path}`, {
    credentials: "include",
    method,
    headers: {
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({
    error: `HTTP ${response.status}`,
  }));

  if (!response.ok) {
    throw new Error(
      payload.error ||
      payload.message ||
      `Account request failed (${response.status}).`,
    );
  }

  return payload;
}

export function registerAccount(input) {
  return request("/api/accounts/register", {
    method: "POST",
    body: input,
  });
}

export function verifyAccountEmail(token) {
  return request("/api/accounts/verify-email", {
    method: "POST",
    body: { token },
  });
}

export function loginAccount(input) {
  return request("/api/accounts/login", {
    method: "POST",
    body: input,
  });
}

export function fetchCurrentAccount(token) {
  return request("/api/accounts/me", { token });
}

export function logoutAccount(token) {
  return request("/api/accounts/logout", {
    method: "POST",
    token,
  });
}

export function requestPasswordReset(email) {
  return request("/api/accounts/password-reset/request", {
    method: "POST",
    body: { email },
  });
}

export function confirmPasswordReset(input) {
  return request("/api/accounts/password-reset/confirm", {
    method: "POST",
    body: input,
  });
}

export function fetchAccountsHealth() {
  return request("/health");
}