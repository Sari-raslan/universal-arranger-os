import { runSupervisorLoop } from './supervisor.mjs';
import { atomicWriteJson, FACTORY_ROOT, nowIso } from './lib.mjs';
import path from 'node:path';

runSupervisorLoop({ once: false }).catch((err) => {
  console.error(err);
  atomicWriteJson(path.join(FACTORY_ROOT, 'state', 'factory-state.json'), {
    status: 'crashed',
    error: String(err.message || err),
    at: nowIso()
  });
  process.exit(1);
});
