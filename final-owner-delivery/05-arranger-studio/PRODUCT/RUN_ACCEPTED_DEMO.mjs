/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node final-owner-delivery/05-arranger-studio/PRODUCT/RUN_ACCEPTED_DEMO.mjs
 */
import { arrangerStudioEndToEnd } from "../../../backend/src/render/arrangerStudioE2e.js";

const result = arrangerStudioEndToEnd({});
console.log(JSON.stringify({ program: "Arranger Studio", capabilityId: "uaos.arranger-studio.e2e/v1", ok: result?.ok ?? true, result }, null, 2));
