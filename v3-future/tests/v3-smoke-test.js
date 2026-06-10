import { createArrangementBrain } from '../ai-brain/arrangement-brain.js';
import { createSamplerEngine } from '../sampler-engine/sampler-core.js';
import { deviceProfiles } from '../device-profiles/profiles.js';

const brain = createArrangementBrain();
const sampler = createSamplerEngine();

if (!brain.name) throw new Error('Brain missing');
if (!sampler.engine) throw new Error('Sampler missing');
if (!deviceProfiles.length) throw new Error('Device profiles missing');

console.log('V3 smoke test PASS');
