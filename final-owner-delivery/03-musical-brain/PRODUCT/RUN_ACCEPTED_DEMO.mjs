/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node final-owner-delivery/03-musical-brain/PRODUCT/RUN_ACCEPTED_DEMO.mjs
 */
import { runPipeline } from "../../../backend/src/render/musicalListeningPipeline.js";

const result = runPipeline({ variant: 'hijaz', includeArrangement: true });
console.log(JSON.stringify({ program: "Musical Brain / Golden Brain", capabilityId: "uaos.golden-brain.arrangement-intelligence/v1", ok: result?.ok ?? true, result }, null, 2));
