/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node final-owner-delivery/08-keyboard-pro/PRODUCT/RUN_ACCEPTED_DEMO.mjs
 */
import { keyboardProFinalize } from "../../../backend/src/keyboard/keyboardProFinalize.js";

const result = keyboardProFinalize({ name: 'owner-keyboard-demo' });
console.log(JSON.stringify({ program: "Keyboard Pro", capabilityId: "uaos.keyboard-pro.finalize/v1", ok: result?.ok ?? true, result }, null, 2));
