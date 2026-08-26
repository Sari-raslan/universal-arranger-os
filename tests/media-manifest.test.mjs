import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateMediaManifest } from "../backend/src/content/mediaManifest.js";

const MANIFEST =
  "C:/UAOS-WT/uaos-open-library-factory-v3-20260723_185921/docs/media/manifest.json";

test("media manifest references are unique and not licensed copies", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const result = validateMediaManifest(manifest);
  assert.equal(result.ok, true, result.error);
  assert.equal(result.fixturesAreNotProductContent, true);
  assert.equal(result.licensedContentCopied, false);
  assert.equal(result.count, 12);
});

test("educational lesson media uses the same reference contract", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  for (const video of manifest.videos) {
    assert.match(video.src, /^\/media\//);
    assert.ok(video.title.includes("UAOS"));
  }
});

test("count mismatch fails closed", () => {
  const result = validateMediaManifest({ videos: [{ title: "a", src: "/media/a.mp4", file: "a.mp4" }], count: 9 });
  assert.equal(result.ok, false);
});
