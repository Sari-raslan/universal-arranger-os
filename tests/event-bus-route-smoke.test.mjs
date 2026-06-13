import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createEventBus } from "../uaos-live-clean/src/core/eventBus.js";

test("event bus supports on off once and wildcard cleanup", () => {
  const bus = createEventBus();
  const received = [];
  const off = bus.on("demo", (event) => received.push(event.payload.value));
  const offAny = bus.on("*", (event) => received.push(event.type));
  bus.emit("demo", { value: 1 });
  off();
  bus.emit("demo", { value: 2 });
  offAny();
  bus.emit("demo", { value: 3 });
  assert.deepEqual(received, [1, "demo", "demo"]);

  let onceCount = 0;
  bus.once("once", () => onceCount += 1);
  bus.emit("once");
  bus.emit("once");
  assert.equal(onceCount, 1);
});

test("active app preserves required public routes", () => {
  const app = fs.readFileSync("uaos-live-clean/src/App.jsx", "utf8");
  for (const route of ["home", "sing", "studio", "pro", "midi", "audio", "timeline", "sessions", "live", "sounds", "sampler", "ai", "diagnostics", "pricing", "downloads", "status"]) {
    assert.match(app, new RegExp(`["']${route}["']`), `missing route ${route}`);
  }
});
