const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
  PUBLIC_URL,
  isTrustedAppUrl,
  shouldOpenExternally,
  resolveStartupTarget
} = require("../desktop/desktopLoadPolicy.cjs");

test("desktop policy keeps trusted app routes inside the desktop window", () => {
  assert.equal(isTrustedAppUrl(PUBLIC_URL), true);
  assert.equal(isTrustedAppUrl(`${PUBLIC_URL}/api/status`), true);
  assert.equal(shouldOpenExternally(`${PUBLIC_URL}/downloads`), false);
});

test("desktop policy opens untrusted web links externally", () => {
  assert.equal(shouldOpenExternally("https://example.com"), true);
  assert.equal(shouldOpenExternally("mailto:support@example.com"), true);
  assert.equal(shouldOpenExternally("file:///C:/uaos/index.html"), false);
});

test("desktop policy can prefer the offline fallback when present", () => {
  const fallbackPath = path.join(__dirname, "desktop-load-policy.test.cjs");
  const target = resolveStartupTarget({ preferOffline: true, fallbackPath });

  assert.equal(target.type, "file");
  assert.equal(target.value, fallbackPath);
});
