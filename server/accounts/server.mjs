import http from "node:http";
import os from "node:os";
import path from "node:path";
import { AccountService } from "./accountService.mjs";
import { JsonAccountStore } from "./stores.mjs";

const port = Number.parseInt(
  process.env.UAOS_ACCOUNTS_PORT || "3041",
  10,
);

const dataFile =
  process.env.UAOS_ACCOUNTS_DATA_FILE ||
  path.join(os.homedir(), ".uaos", "accounts.dev.json");

const publicOrigin =
  process.env.UAOS_PUBLIC_BASE_URL ||
  "http://127.0.0.1:5173";

const production = process.env.NODE_ENV === "production";
const store = new JsonAccountStore(dataFile);
const service = new AccountService(store);

const rateLimits = new Map();

function clientKey(request) {
  return String(
    request.socket.remoteAddress || "unknown",
  );
}

function allowRequest(request, limit = 60, windowMs = 60_000) {
  const key = clientKey(request);
  const now = Date.now();
  const current = rateLimits.get(key) || [];
  const recent = current.filter((time) => now - time < windowMs);

  if (recent.length >= limit) {
    rateLimits.set(key, recent);
    return false;
  }

  recent.push(now);
  rateLimits.set(key, recent);
  return true;
}

function json(response, statusCode, value, origin = null) {
  const payload = JSON.stringify(value);
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  };

  if (origin && origin === publicOrigin) {
    headers["access-control-allow-origin"] = origin;
    headers.vary = "origin";
  }

  response.writeHead(statusCode, headers);
  response.end(payload);
}

async function readJson(request, maximumBytes = 256 * 1024) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;

    if (total > maximumBytes) {
      throw new Error("Request body is too large.");
    }

    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");

  return text ? JSON.parse(text) : {};
}

function bearerToken(request) {
  const value = String(request.headers.authorization || "");
  const match = /^Bearer\s+(.+)$/i.exec(value);

  return match ? match[1] : null;
}

const server = http.createServer(async (request, response) => {
  const origin = String(request.headers.origin || "");

  try {
    if (!allowRequest(request)) {
      return json(response, 429, {
        ok: false,
        error: "rate-limit-exceeded",
      }, origin);
    }

    const url = new URL(
      request.url || "/",
      `http://${request.headers.host || "127.0.0.1"}`,
    );

    if (request.method === "OPTIONS") {
      if (origin !== publicOrigin) {
        return json(response, 403, {
          ok: false,
          error: "origin-not-allowed",
        });
      }

      response.writeHead(204, {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers":
          "content-type,authorization",
        vary: "origin",
      });
      return response.end();
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, {
        ok: true,
        service: "uaos-accounts",
        storage: "local-json-development",
        emailProviderConfigured: false,
      }, origin);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/accounts/register"
    ) {
      const result = await service.register(
        await readJson(request),
      );

      return json(response, 201, {
        user: result.user,
        verificationRequired: true,
        verificationToken: production
          ? undefined
          : result.verificationToken,
      }, origin);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/accounts/verify-email"
    ) {
      const body = await readJson(request);
      const user = await service.verifyEmail(body.token);

      return json(response, 200, {
        verified: true,
        user,
      }, origin);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/accounts/login"
    ) {
      const result = await service.login(
        await readJson(request),
      );

      return json(response, 200, result, origin);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/accounts/logout"
    ) {
      const token = bearerToken(request);

      if (!token) {
        return json(response, 401, {
          ok: false,
          error: "missing-session",
        }, origin);
      }

      return json(
        response,
        200,
        await service.logout(token),
        origin,
      );
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/accounts/me"
    ) {
      const user = await service.authenticateSession(
        bearerToken(request),
      );

      if (!user) {
        return json(response, 401, {
          ok: false,
          error: "invalid-session",
        }, origin);
      }

      return json(response, 200, { user }, origin);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/accounts/password-reset/request"
    ) {
      const body = await readJson(request);
      const result = await service.requestPasswordReset(
        body.email,
      );

      return json(response, 202, {
        accepted: true,
        resetToken: production
          ? undefined
          : result.resetToken,
      }, origin);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/accounts/password-reset/confirm"
    ) {
      const result = await service.resetPassword(
        await readJson(request),
      );

      return json(response, 200, result, origin);
    }

    return json(response, 404, {
      ok: false,
      error: "not-found",
    }, origin);
  } catch (error) {
    const status = /already exists/i.test(error.message)
      ? 409
      : /Invalid email or password|verification is required/i.test(
          error.message,
        )
        ? 401
        : 400;

    return json(response, status, {
      ok: false,
      error: error.message,
    }, origin);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(
    `UAOS accounts foundation listening on http://127.0.0.1:${port}`,
  );
  console.log(
    `Development account data: ${dataFile}`,
  );
  console.log(
    "Production database and email provider remain unconfigured.",
  );
});