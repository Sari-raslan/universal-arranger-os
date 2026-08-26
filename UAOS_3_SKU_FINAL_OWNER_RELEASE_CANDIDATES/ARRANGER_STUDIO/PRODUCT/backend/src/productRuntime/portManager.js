/**
 * Shared product runtime — port conflict handling for customer one-click start.
 * Distinguishes: healthy own instance, stale own instance, unrelated busy port.
 */
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import os from "node:os";

export function productPidPath(dataDir) {
  return path.join(dataDir, "runtime.pid.json");
}

export function writeOwnPid(dataDir, info) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    productPidPath(dataDir),
    JSON.stringify(
      {
        pid: process.pid,
        port: info.port,
        product: info.product,
        version: info.version,
        startedAt: new Date().toISOString(),
        host: info.host || "127.0.0.1"
      },
      null,
      2
    )
  );
}

export function readOwnPid(dataDir) {
  try {
    return JSON.parse(fs.readFileSync(productPidPath(dataDir), "utf8"));
  } catch {
    return null;
  }
}

export function clearOwnPid(dataDir) {
  try {
    fs.unlinkSync(productPidPath(dataDir));
  } catch {
    /* ignore */
  }
}

export function isPidAlive(pid) {
  if (!pid || typeof pid !== "number") return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function probeHealth(host, port, timeoutMs = 600) {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/api/pilot/health`, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve({ ok: res.statusCode === 200, statusCode: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ ok: res.statusCode === 200, statusCode: res.statusCode, body: null });
        }
      });
    });
    req.on("error", () => resolve({ ok: false }));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ ok: false, timeout: true });
    });
  });
}

export function canBind(host, port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(false));
    s.once("listening", () => s.close(() => resolve(true)));
    s.listen(port, host);
  });
}

/**
 * Resolve customer start strategy.
 * @returns {{ action: 'reuse'|'start'|'start_alt'|'fail', port, message, code }}
 */
export async function resolveStartPort({
  preferredPort,
  host = "127.0.0.1",
  dataDir,
  productId,
  altPorts = []
}) {
  const health = await probeHealth(host, preferredPort);
  if (health.ok) {
    const recorded = readOwnPid(dataDir);
    const sameProduct =
      health.body?.product &&
      (String(health.body.product).includes(productId) ||
        (recorded && recorded.product === productId && recorded.port === preferredPort));
    if (sameProduct || (recorded && isPidAlive(recorded.pid) && recorded.port === preferredPort)) {
      return {
        action: "reuse",
        port: preferredPort,
        message: "Already running — opening the existing product window.",
        code: "ALREADY_RUNNING_OWN"
      };
    }
    // Port answers but not our product
    const alts = [preferredPort, ...altPorts].filter((p, i, a) => a.indexOf(p) === i);
    for (const p of alts.slice(1)) {
      const free = await canBind(host, p);
      if (free) {
        return {
          action: "start_alt",
          port: p,
          message: `Port ${preferredPort} is used by another app. Starting on port ${p} instead.`,
          code: "PORT_BUSY_BY_OTHER_APP"
        };
      }
    }
    return {
      action: "fail",
      port: preferredPort,
      message:
        `Port ${preferredPort} is busy by another application and no alternate ports are free. Close the other app or restart your PC, then try again.`,
      code: "PORT_BUSY_NO_ALT"
    };
  }

  // No healthy listener — check bind + stale pid
  const recorded = readOwnPid(dataDir);
  if (recorded && !isPidAlive(recorded.pid)) {
    clearOwnPid(dataDir);
  }

  const free = await canBind(host, preferredPort);
  if (free) {
    return {
      action: "start",
      port: preferredPort,
      message: "Starting product…",
      code: recorded && !isPidAlive(recorded.pid) ? "STALE_PROCESS_CLEARED" : "FIRST_START"
    };
  }

  // Busy but no health — try alts
  for (const p of altPorts) {
    if (p === preferredPort) continue;
    if (await canBind(host, p)) {
      return {
        action: "start_alt",
        port: p,
        message: `Preferred port ${preferredPort} is busy. Starting on port ${p}.`,
        code: "PORT_BUSY_RECOVERED"
      };
    }
  }

  return {
    action: "fail",
    port: preferredPort,
    message:
      "Could not start: the network port is busy and recovery failed. Close other UAOS windows, wait 5 seconds, and double-click Start again.",
    code: "START_FAILED"
  };
}

export function customerErrorText(code, message) {
  const hints = {
    ALREADY_RUNNING_OWN: "No action needed — your product is already open.",
    PORT_BUSY_BY_OTHER_APP: "Another program is using the default port. UAOS tried an alternate port.",
    PORT_BUSY_NO_ALT: "Free the port or reboot, then start again. You do not need Task Manager for normal use.",
    STALE_PROCESS_CLEARED: "A previous session ended unexpectedly; starting clean.",
    FIRST_START: "First start.",
    PORT_BUSY_RECOVERED: "Recovered by using another local port.",
    START_FAILED: "If this keeps happening, restart Windows and try again."
  };
  return { code, message, hint: hints[code] || "" };
}

export function platformInfo() {
  return {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    osRelease: os.release(),
    electron: Boolean(process.versions.electron)
  };
}
