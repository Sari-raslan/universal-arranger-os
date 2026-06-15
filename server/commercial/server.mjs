import http from "node:http";
import { readCommercialConfig } from "./config.mjs";
import { getPublicPlans } from "./plans.mjs";
import {
  issueLicense,
  verifyLicense,
} from "./licenseService.mjs";
import {
  MemoryIdempotencyStore,
  processPaymentWebhook,
} from "./paymentWebhook.mjs";
import { safeEqualText } from "./crypto.mjs";

const config = readCommercialConfig();
const webhookStore = new MemoryIdempotencyStore();

function json(response, statusCode, value) {
  const payload = JSON.stringify(value);

  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });

  response.end(payload);
}

async function readRawBody(request, maximumBytes = 1024 * 1024) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;

    if (total > maximumBytes) {
      throw new Error("Request body is too large.");
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function authorizedAdmin(request) {
  const presented = String(
    request.headers["x-uaos-admin-secret"] || "",
  );

  return Boolean(
    config.adminSecret &&
    presented &&
    safeEqualText(config.adminSecret, presented),
  );
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(
      request.url || "/",
      `http://${request.headers.host || "127.0.0.1"}`,
    );

    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, {
        ok: true,
        service: "uaos-commercial",
        paymentProvider: config.paymentProvider,
        storageMode: config.storageMode,
      });
    }

    if (request.method === "GET" && url.pathname === "/api/plans") {
      return json(response, 200, {
        plans: getPublicPlans(),
      });
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/license/verify"
    ) {
      if (!config.licenseSigningSecret) {
        return json(response, 503, {
          ok: false,
          error: "license-service-not-configured",
        });
      }

      const body = JSON.parse(await readRawBody(request));
      const result = verifyLicense(
        body.token,
        config.licenseSigningSecret,
        { deviceId: body.deviceId || null },
      );

      return json(response, result.valid ? 200 : 401, result);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/internal/license/issue"
    ) {
      if (!authorizedAdmin(request)) {
        return json(response, 401, {
          ok: false,
          error: "unauthorized",
        });
      }

      if (!config.licenseSigningSecret) {
        return json(response, 503, {
          ok: false,
          error: "license-service-not-configured",
        });
      }

      const body = JSON.parse(await readRawBody(request));
      const result = issueLicense(
        body,
        config.licenseSigningSecret,
      );

      return json(response, 201, result);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/webhooks/payment"
    ) {
      if (!config.paymentSecret) {
        return json(response, 503, {
          ok: false,
          error: "payment-service-not-configured",
        });
      }

      const rawBody = await readRawBody(request);
      const result = processPaymentWebhook({
        rawBody,
        signature: request.headers["x-uaos-signature"],
        secret: config.paymentSecret,
        store: webhookStore,
      });

      return json(response, 202, result);
    }

    return json(response, 404, {
      ok: false,
      error: "not-found",
    });
  } catch (error) {
    return json(response, 400, {
      ok: false,
      error: error.message,
    });
  }
});

server.listen(config.port, "127.0.0.1", () => {
  console.log(
    `UAOS commercial foundation listening on http://127.0.0.1:${config.port}`,
  );
  console.log(
    "Provider integration and production database remain disabled until configured.",
  );
});