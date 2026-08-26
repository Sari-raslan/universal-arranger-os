/**
 * Capability adapter: musical session memory for any UAOS program.
 * Does not copy per-program storage. Does not enable payments, writers, or deploy.
 */
import { CAPABILITY_ID, createMusicalSessionMemory } from "./musicalSessionMemory.js";
import { createMemoryStorage } from "./memoryStorage.js";

export function createSessionMemoryCapability({ storage, now } = {}) {
  const memory = createMusicalSessionMemory({
    storage: storage || createMemoryStorage(),
    now
  });
  return {
    id: CAPABILITY_ID,
    name: "Musical project/session memory",
    requiredEntitlementStates: [],
    invoke(command, payload) {
      if (command === "saveProject") return memory.saveProject(payload);
      if (command === "loadProject") return memory.loadProject();
      if (command === "saveSession") return memory.saveSession(payload);
      if (command === "restore") return memory.restore();
      if (command === "clear") {
        memory.clear();
        return { ok: true };
      }
      if (command === "snapshot") return memory.snapshot();
      throw new Error(`Unknown session-memory command: ${command}`);
    },
    memory
  };
}

export { CAPABILITY_ID };
