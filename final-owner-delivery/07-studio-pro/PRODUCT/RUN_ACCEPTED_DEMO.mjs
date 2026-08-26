/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node final-owner-delivery/07-studio-pro/PRODUCT/RUN_ACCEPTED_DEMO.mjs
 */
import { createMemoryStorage } from '../../../backend/src/session/memoryStorage.js';
import { studioProSurface } from "../../../backend/src/studio/studioProSurface.js";

const result = studioProSurface({ storage: createMemoryStorage(), title: 'Owner Demo Studio' });
console.log(JSON.stringify({ program: "Studio Pro", capabilityId: "uaos.studio-pro.surface/v1", ok: result?.ok ?? true, result }, null, 2));
