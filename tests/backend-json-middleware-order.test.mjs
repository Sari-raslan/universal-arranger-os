import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("express JSON middleware is registered before API routers", () => {
  const source = fs.readFileSync("backend/server.js", "utf8");

  const jsonIndex = source.indexOf(
    'app.use(express.json({ limit: "25mb" }));'
  );
  const arrangementIndex = source.indexOf(
    'app.use("/api", createAudioArrangementApiRouter(express));'
  );
  const midiIndex = source.indexOf(
    'app.use("/api", createAudioArrangementMidiApiRouter(express));'
  );

  assert.ok(jsonIndex >= 0, "express.json middleware is missing");
  assert.ok(arrangementIndex >= 0, "arrangement router is missing");
  assert.ok(midiIndex >= 0, "MIDI router is missing");
  assert.ok(
    jsonIndex < arrangementIndex,
    "express.json must run before arrangement API"
  );
  assert.ok(
    jsonIndex < midiIndex,
    "express.json must run before MIDI API"
  );
});