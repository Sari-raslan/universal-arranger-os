import { createArrangementBrain } from './ai-brain/arrangement-brain.js';
import { createPluginRegistry } from './plugin-system/plugin-registry.js';
import { createSamplerEngine } from './sampler-engine/sampler-core.js';
import { createDawSession } from './daw-layer/daw-session.js';
import { deviceProfiles } from './device-profiles/profiles.js';
import { createSyncState } from './cloud-sync/sync-state.js';

const v3 = {
  brain: createArrangementBrain(),
  plugins: createPluginRegistry(),
  sampler: createSamplerEngine(),
  daw: createDawSession(),
  devices: deviceProfiles,
  sync: createSyncState()
};

console.log(JSON.stringify(v3, null, 2));
