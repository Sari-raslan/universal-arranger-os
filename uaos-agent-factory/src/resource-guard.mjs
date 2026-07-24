import {
  freeRamGb,
  freeDiskGb,
  loadFactoryConfig,
  nowIso
} from './lib.mjs';

export function evaluateResources() {
  const cfg = loadFactoryConfig();
  const ram = freeRamGb();
  const disks = {
    C: freeDiskGb('C'),
    D: freeDiskGb('D'),
    E: freeDiskGb('E')
  };

  let limits;
  if (ram.freeGb >= 12) limits = cfg.resourcePolicy.ramFreeGe12;
  else if (ram.freeGb >= 7) limits = cfg.resourcePolicy.ramFreeGe7;
  else if (ram.freeGb >= 4) limits = cfg.resourcePolicy.ramFreeGe4;
  else limits = cfg.resourcePolicy.ramFreeLt4;

  const diskMin = cfg.resourcePolicy.diskMinGb;
  const diskWarnings = [];
  for (const [letter, min] of Object.entries(diskMin)) {
    const free = disks[letter];
    if (free != null && free < min) {
      diskWarnings.push({ drive: letter, freeGb: free, minGb: min, action: 'pause_packaging_only' });
    }
  }

  const critical = Object.entries(disks).some(
    ([letter, free]) => letter === 'C' && free != null && free < cfg.resourcePolicy.diskCriticalGb
  );

  return {
    checkedAt: nowIso(),
    ram,
    disks,
    limits,
    diskWarnings,
    pauseFactory: critical,
    pausePackagingDrives: diskWarnings.map((d) => d.drive)
  };
}
