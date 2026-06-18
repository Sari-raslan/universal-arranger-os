import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("UAOS build uses Vite code splitting wrapper", () => {
  const pkg = JSON.parse(
    fs.readFileSync("uaos-live-clean/package.json", "utf8")
  );

  assert.match(
    pkg.scripts.build,
    /vite\.config\.code-splitting\.mjs/
  );

  const source = fs.readFileSync(
    "uaos-live-clean/vite.config.code-splitting.mjs",
    "utf8"
  );

  assert.match(source, /codeSplitting:\s*true/);
  assert.match(source, /manualChunks/);
  assert.match(source, /react-vendor/);
  assert.match(source, /audio-vendor/);
  assert.match(source, /midi-vendor/);
});