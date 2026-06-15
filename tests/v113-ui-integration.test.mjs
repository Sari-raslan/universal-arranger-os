import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const htmlPath = path.join(root, "uaos-live-clean", "public", "v113-control-center.html");
const launcherPath = path.join(root, "uaos-live-clean", "public", "v113-launcher.js");
const indexPath = path.join(root, "uaos-live-clean", "index.html");

test("11.3 control center assets exist", () => {
  assert.equal(fs.existsSync(htmlPath), true);
  assert.equal(fs.existsSync(launcherPath), true);
});

test("control center contains required diagnostics", () => {
  const html = fs.readFileSync(htmlPath, "utf8");
  for (const marker of [
    "Release Channel",
    "Hardware Profile",
    "MIDI Diagnostics",
    "Audio Diagnostics",
    "Crash Log Sanitizer",
    "Safety Gate",
    "navigator.requestMIDIAccess",
    "getUserMedia",
  ]) {
    assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("main app loads the 11.3 launcher", () => {
  const index = fs.readFileSync(indexPath, "utf8");
  assert.match(index, /\/v113-launcher\.js/);
});