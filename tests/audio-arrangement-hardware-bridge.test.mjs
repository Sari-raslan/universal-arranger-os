import test from "node:test";
import assert from "node:assert/strict";
import {
  ARRANGEMENT_PLAN_READY_EVENT,
  normalizeArrangementTransport,
  publishArrangementPlanToHardware,
  subscribeArrangementPlanForHardware,
} from "../uaos-live-clean/src/hardware/audioArrangementHardwareBridge.js";

class TestEventTarget extends EventTarget {
  dispatchEvent(event) {
    return super.dispatchEvent(event);
  }
}

if (typeof globalThis.CustomEvent !== "function") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

test("normalizes BPM and total bars from sections", () => {
  const transport = normalizeArrangementTransport({
    title: "Song",
    bpm: 96,
    key: "D",
    scale: "nahawand",
    sections: [
      { startBar: 1, lengthBars: 4 },
      { startBar: 5, lengthBars: 8 },
      { startBar: 13, lengthBars: 8 },
    ],
  });

  assert.equal(transport.bpm, 96);
  assert.equal(transport.bars, 20);
  assert.equal(transport.key, "D");
  assert.equal(transport.scale, "nahawand");
  assert.equal(transport.sectionCount, 3);
});

test("clamps unsafe transport values", () => {
  const transport = normalizeArrangementTransport({ bpm: 9999, bars: 9999 });
  assert.equal(transport.bpm, 240);
  assert.equal(transport.bars, 128);
});

test("publishes and subscribes to arrangement hardware event", () => {
  const target = new TestEventTarget();
  let received = null;

  const unsubscribe = subscribeArrangementPlanForHardware(
    (detail) => {
      received = detail;
    },
    target,
  );

  const transport = publishArrangementPlanToHardware(
    { bpm: 88, bars: 16, title: "Test" },
    target,
  );

  assert.equal(transport.bpm, 88);
  assert.equal(received.transport.bars, 16);
  assert.equal(ARRANGEMENT_PLAN_READY_EVENT, "uaos:arrangement-plan-ready");

  unsubscribe();
});