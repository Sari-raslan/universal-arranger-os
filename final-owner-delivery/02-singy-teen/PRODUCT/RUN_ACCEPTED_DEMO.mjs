/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node final-owner-delivery/02-singy-teen/PRODUCT/RUN_ACCEPTED_DEMO.mjs
 */
import { createMemoryStorage } from '../../../backend/src/session/memoryStorage.js';
import { teenStudioFundamentals } from "../../../backend/src/singy/teenStudio.js";

const result = teenStudioFundamentals({ storage: createMemoryStorage(), tempo: 104 });
console.log(JSON.stringify({ program: "Singy Teen", capabilityId: "uaos.singy.teen-studio-fundamentals/v1", ok: result?.ok ?? true, result }, null, 2));
