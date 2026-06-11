const fs = require("fs");
const path = require("path");

const PUBLIC_URL = "https://universal-arranger-os.vercel.app";
const localIndex = path.join(__dirname, "local-app", "index.html");

function hasOfflineFallback(filePath = localIndex) {
  return fs.existsSync(filePath);
}

function isTrustedAppUrl(targetUrl, publicUrl = PUBLIC_URL) {
  try {
    const target = new URL(targetUrl);
    const trusted = new URL(publicUrl);
    return target.origin === trusted.origin;
  } catch {
    return false;
  }
}

function shouldOpenExternally(targetUrl, publicUrl = PUBLIC_URL) {
  if (!targetUrl || targetUrl.startsWith("file:")) {
    return false;
  }

  return !isTrustedAppUrl(targetUrl, publicUrl);
}

function resolveStartupTarget({ preferOffline = false, fallbackPath = localIndex } = {}) {
  if (preferOffline && hasOfflineFallback(fallbackPath)) {
    return { type: "file", value: fallbackPath };
  }

  return { type: "url", value: PUBLIC_URL };
}

module.exports = {
  PUBLIC_URL,
  localIndex,
  hasOfflineFallback,
  isTrustedAppUrl,
  shouldOpenExternally,
  resolveStartupTarget
};
