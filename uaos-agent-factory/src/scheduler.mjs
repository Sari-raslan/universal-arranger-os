import { evaluateResources } from './resource-guard.mjs';
import { nextRunnableTask, loadQueue } from './queue-manager.mjs';
import { loadFactoryConfig } from './lib.mjs';
import { countHeavyWriters, activeWriterMap } from './dispatch.mjs';

/** Dispatch-order override: max two heavy writers on this laptop. */
export function effectiveMaxHeavyWriters(resources) {
  const ram = resources?.ram?.freeGb ?? 0;
  if (ram < 4) return 0;
  // Order: Maximum two heavy writers at once
  return Math.min(2, Math.max(resources?.limits?.maxHeavyWriters ?? 1, 2));
}

export function pickNextLaneWork(activeWriters = null) {
  const resources = evaluateResources();
  if (resources.pauseFactory) {
    return { action: 'pause_factory', resources };
  }

  const live = activeWriters || activeWriterMap();
  const maxWriters = effectiveMaxHeavyWriters(resources);
  const activeCount = Math.max(
    Object.values(live).filter(Boolean).length,
    countHeavyWriters()
  );
  if (activeCount >= maxWriters) {
    return { action: 'wait_capacity', resources, activeCount, maxWriters };
  }

  const cfg = loadFactoryConfig();
  const lanes = Object.entries(cfg.lanePriority)
    .sort((a, b) => b[1] - a[1])
    .map(([lane]) => lane);

  for (const lane of lanes) {
    if (live[lane]) continue;
    const q = loadQueue(lane);
    const waitingHuman = q.tasks.some((t) => t.status === 'waiting_human');
    const task = nextRunnableTask(lane);
    if (!task) continue;
    if (task.humanGate) continue;
    if (waitingHuman && task.humanGate) continue;
    // Eligible ready/retry/pending with deps — generic runner handles all task ids
    return { action: 'run', lane, task, resources, maxWriters };
  }

  return { action: 'idle', resources, maxWriters, activeCount };
}
