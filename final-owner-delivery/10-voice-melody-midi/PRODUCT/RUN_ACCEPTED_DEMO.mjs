/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node final-owner-delivery/10-voice-melody-midi/PRODUCT/RUN_ACCEPTED_DEMO.mjs
 */
import { voiceMelodyToMidiFinalize } from "../../../backend/src/perception/voiceMelodyFinalize.js";

const result = voiceMelodyToMidiFinalize();
console.log(JSON.stringify({ program: "Voice / Melody-to-MIDI", capabilityId: "uaos.voice.melody-to-midi.finalize/v1", ok: result?.ok ?? true, result }, null, 2));
