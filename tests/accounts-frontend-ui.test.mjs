import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const mainSource = read("uaos-live-clean/src/main.jsx");
const clientSource = read(
  "uaos-live-clean/src/api/accountsClient.js",
);
const hookSource = read(
  "uaos-live-clean/src/hooks/useAccountSession.js",
);
const shellSource = read(
  "uaos-live-clean/src/components/AccountShell.jsx",
);
const cssSource = read(
  "uaos-live-clean/src/components/account-shell.css",
);

test("frontend root mounts the AccountShell around App", () => {
  assert.equal(mainSource.includes("AccountShell"), true);
  assert.match(
    mainSource,
    /<AccountShell>[\s\S]*?<App\s*\/?>[\s\S]*?<\/AccountShell>/,
  );
});

test("account client exposes all current account endpoints", () => {
  for (const endpoint of [
    "/api/accounts/register",
    "/api/accounts/verify-email",
    "/api/accounts/login",
    "/api/accounts/me",
    "/api/accounts/logout",
    "/api/accounts/password-reset/request",
    "/api/accounts/password-reset/confirm",
  ]) {
    assert.equal(clientSource.includes(endpoint), true);
  }
});

test("account session stores a versioned session and supports logout", () => {
  assert.equal(
    hookSource.includes("uaos.accounts.session.v1"),
    true,
  );
  assert.equal(hookSource.includes("logoutAccount"), true);
  assert.equal(hookSource.includes("fetchCurrentAccount"), true);
});

test("account UI includes all required screens and plan labels", () => {
  for (const marker of [
    "Create account",
    "Verify email",
    "Forgot password",
    "Current plan",
    "7.99 EUR/month",
    "29.99 EUR/month",
  ]) {
    assert.equal(shellSource.includes(marker), true);
  }
});

test("account UI remains responsive and does not use random IDs", () => {
  assert.equal(cssSource.includes("@media"), true);
  assert.equal(shellSource.includes("Math.random"), false);
  assert.equal(hookSource.includes("Math.random"), false);
});