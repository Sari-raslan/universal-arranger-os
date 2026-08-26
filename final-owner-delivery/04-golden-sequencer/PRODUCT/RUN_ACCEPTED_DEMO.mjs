/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node final-owner-delivery/04-golden-sequencer/PRODUCT/RUN_ACCEPTED_DEMO.mjs
 */
import { goldenSequencerEndToEnd } from "../../../backend/src/render/goldenSequencerTransport.js";

const result = goldenSequencerEndToEnd({ tempo: 100, bars: 2 });
console.log(JSON.stringify({ program: "Golden Sequencer", capabilityId: "uaos.golden-sequencer.e2e/v1", ok: result?.ok ?? true, result }, null, 2));
