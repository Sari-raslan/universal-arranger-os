import test from "node:test";
import assert from "node:assert/strict";
import handler, { RELEASE_STATUS } from "../api/status.js";

test("release status exposes honest capability states", () => {
  assert.deepEqual(RELEASE_STATUS.statusModel, ["available", "experimental", "planned", "not-included"]);
  assert.equal(RELEASE_STATUS.capabilities.webAudio, "available");
  assert.equal(RELEASE_STATUS.capabilities.webMidi, "experimental");
  assert.equal(RELEASE_STATUS.capabilities.proprietaryStyleParsing, "not-included");
  assert.equal(RELEASE_STATUS.capabilities.trainedCommercialAiModel, "not-included");
});

test("status api returns HTTP 200 payload", () => {
  let statusCode = 0;
  let payload;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      payload = value;
    }
  };

  handler({}, res);
  assert.equal(statusCode, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.capabilities.localStorage, "available");
});
