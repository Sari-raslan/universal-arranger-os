export function createUpdatePolicy({
  autoDownload = false,
  autoInstallOnAppQuit = true,
  allowPrerelease = false,
  rollbackEnabled = true,
  minimumBatteryPercent = 20,
} = {}) {
  if (minimumBatteryPercent < 0 || minimumBatteryPercent > 100) {
    throw new RangeError("minimumBatteryPercent must be between 0 and 100");
  }

  return Object.freeze({
    autoDownload: Boolean(autoDownload),
    autoInstallOnAppQuit: Boolean(autoInstallOnAppQuit),
    allowPrerelease: Boolean(allowPrerelease),
    rollbackEnabled: Boolean(rollbackEnabled),
    minimumBatteryPercent,
  });
}

export function shouldInstallUpdate(policy, context = {}) {
  const batteryPercent = Number(context.batteryPercent ?? 100);
  const isMetered = Boolean(context.isMetered);
  const hasBackup = Boolean(context.hasBackup);

  if (batteryPercent < policy.minimumBatteryPercent) {
    return { allowed: false, reason: "battery-too-low" };
  }

  if (isMetered && !context.allowMetered) {
    return { allowed: false, reason: "metered-network" };
  }

  if (policy.rollbackEnabled && !hasBackup) {
    return { allowed: false, reason: "rollback-backup-missing" };
  }

  return { allowed: true, reason: "ready" };
}