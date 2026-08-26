/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node final-owner-delivery/06-creator/PRODUCT/RUN_ACCEPTED_DEMO.mjs
 */
import { createMemoryStorage } from '../../../backend/src/session/memoryStorage.js';
import { createCreatorWorkspace } from "../../../backend/src/creator/creatorWorkspace.js";

const result = createCreatorWorkspace({ title: 'Owner Demo Creator', storage: createMemoryStorage() });
console.log(JSON.stringify({ program: "Creator", capabilityId: "uaos.creator.workspace/v1", ok: result?.ok ?? true, result }, null, 2));
