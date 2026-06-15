import test from "node:test";
import assert from "node:assert/strict";

import {
  beatsToSeconds,
  createTransport,
  secondsToBeats,
  updateTransport,
} from "../uaos-live-clean/src/daw/transportEngine.js";

import {
  addClipToTrack,
  createClip,
  createTrack,
} from "../uaos-live-clean/src/daw/timelineModel.js";

import {
  createSamplerZone,
  matchSamplerZones,
} from "../uaos-live-clean/src/sampler/samplerZoneModel.js";

test("transport converts beats and seconds", () => {
  assert.equal(beatsToSeconds(4, 120), 2);
  assert.equal(secondsToBeats(2, 120), 4);

  const transport = createTransport({ tempo: 120 });
  const playing = updateTransport(transport, {
    state: "playing",
    positionBeats: 8,
  });

  assert.equal(playing.state, "playing");
  assert.equal(playing.positionBeats, 8);
});

test("timeline sorts clips by position", () => {
  let track = createTrack({ name: "Audio 1" });

  track = addClipToTrack(
    track,
    createClip({ name: "Second", startBeats: 8 }),
  );

  track = addClipToTrack(
    track,
    createClip({ name: "First", startBeats: 0 }),
  );

  assert.equal(track.clips.length, 2);
  assert.equal(track.clips[0].name, "First");
});

test("sampler matches key and velocity", () => {
  const zone = createSamplerZone({
    lowKey: 48,
    highKey: 72,
    lowVelocity: 1,
    highVelocity: 80,
  });

  assert.equal(matchSamplerZones([zone], 60, 64).length, 1);
  assert.equal(matchSamplerZones([zone], 80, 64).length, 0);
  assert.equal(matchSamplerZones([zone], 60, 100).length, 0);
});
