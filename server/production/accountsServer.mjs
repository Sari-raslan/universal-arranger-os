import http from "node:http";
import {
  readProductionIntegrationsConfig,
} from "./config.mjs";
import {
  PostgresAccountRepository,
} from "./postgresAccountRepository.mjs";
import {
  PostgresAccountService,
} from "./postgresAccountService.mjs";
import {
  createSmtpEmailService,
} from "./smtpEmailService.mjs";

const config = readProductionIntegrationsConfig(
  process.env,
  { strict: true },
);

const repository = new PostgresAccountRepository({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl,
});

const service = new PostgresAccountService(repository);
const email = createSmtpEmailService(config);

function json(response, status, value, origin = null) {
  const payload = JSON.stringify(value);
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  };

  if (origin === config.publicBaseUrl) {
    headers["access-control-allow-origin"] = origin;
    headers.vary = "origin";
  }

  response.writeHead(status, headers);
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
  const match = /^Bearer\s+(.+)$/i.exec(
    String(request.headers.authorization || ""),
  );

  return match ? match[1] : null;
}

const server = http.createServer(async (request, response) => {
  const origin = String(request.headers.origin || "");

  try {
    const url = new URL(
      request.url || "/",
      `http://${request.headers.host || "127.0.0.1"}`,
    );

    if (request.method === "OPTIONS") {
      if (origin !== config.publicBaseUrl) {
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
      const database = await repository.health();

      return json(response, 200, {
        ok: true,
        service: "uaos-production-accounts",
        database: database.database,
        smtpConfigured: true,
      }, origin);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/accounts/register"
    ) {
      const result = await service.register(
        await readJson(request),
      );

      await email.sendVerificationEmail({
        email: result.user.email,
        token: result.verificationToken,
      });

      return json(response, 201, {
        user: result.user,
        verificationRequired: true,
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
      return json(
        response,
        200,
        await service.login(await readJson(request)),
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
      request.method === "POST" &&
      url.pathname === "/api/accounts/password-reset/request"
    ) {
      const body = await readJson(request);
      const result = await service.requestPasswordReset(body.email);

      if (result.resetToken) {
        await email.sendPasswordResetEmail({
          email: result.email,
          token: result.resetToken,
        });
      }

      return json(response, 202, {
        accepted: true,
      }, origin);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/accounts/password-reset/confirm"
    ) {
      return json(
        response,
        200,
        await service.resetPassword(await readJson(request)),
        origin,
      );
    }

    return json(response, 404, {
      ok: false,
      error: "not-found",
    }, origin);
  } catch (error) {
    const status = error?.code === "23505"
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

async function shutdown(signal) {
  console.log(`Received ${signal}; closing UAOS production accounts.`);
  server.close(async () => {
    await repository.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

await repository.health();
await email.verifyConnection();

server.listen(config.port, "127.0.0.1", () => {
  console.log(
    `UAOS production accounts listening on http://127.0.0.1:${config.port}`,
  );
});