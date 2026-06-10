import { runCoreAgent } from './agents/core-agent.js';
import { runDebugAgent } from './agents/debug-agent.js';
import { runPublishingAgent } from './agents/publishing-agent.js';
import { runRecoveryAgent } from './agents/recovery-agent.js';
import { createArrangerState } from './music-engine/arranger-state.js';
import { startDesktopLauncher } from './desktop/desktop-launcher.js';

const boot = {
  core: runCoreAgent('boot'),
  debug: runDebugAgent(''),
  publishing: runPublishingAgent(),
  recovery: runRecoveryAgent({ boot: true }),
  arranger: createArrangerState(),
  desktop: startDesktopLauncher()
};

console.log(JSON.stringify(boot, null, 2));
