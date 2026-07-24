import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FACTORY_ROOT, loadFactoryConfig } from './lib.mjs';

/**
 * Portable root resolution for the Agent Factory's scratch directories
 * (build cache, artifacts, disposable worktrees). Precedence:
 *   1. Explicit environment variable.
 *   2. A configured path, but only if it isn't pointing at a Windows
 *      drive that doesn't exist on this machine.
 *   3. A repo-relative runtime folder under FACTORY_ROOT.
 * Never silently falls back to a configured D:/E: path when that drive
 * is absent - that's exactly the failure mode this module exists to fix.
 */

function driveLetterOf(p) {
  const m = /^([A-Za-z]):[\\/]/.exec(String(p || ''));
  return m ? m[1].toUpperCase() : null;
}

export function driveExists(letter) {
  if (process.platform !== 'win32' || !letter) return false;
  try {
    fs.statSync(`${letter}:\\`);
    return true;
  } catch {
    return false;
  }
}

function resolveRoot(envVar, configuredValue, repoRelativeDefault) {
  const envValue = process.env[envVar];
  if (envValue) return path.resolve(envValue);

  if (configuredValue) {
    const letter = driveLetterOf(configuredValue);
    if (!letter) {
      // Relative (or non-drive-letter absolute) config value: resolve
      // against FACTORY_ROOT so a portable, version-controlled default works.
      return path.isAbsolute(configuredValue)
        ? configuredValue
        : path.resolve(FACTORY_ROOT, configuredValue);
    }
    if (driveExists(letter)) return path.resolve(configuredValue);
    // Configured drive doesn't exist on this machine - fall through to
    // the repo-relative default instead of failing every mkdir downstream.
  }

  return path.resolve(FACTORY_ROOT, repoRelativeDefault);
}

function safeConfig() {
  try {
    return loadFactoryConfig();
  } catch {
    return {};
  }
}

export function resolveBuildRoot() {
  return resolveRoot('UAOS_FACTORY_BUILD_ROOT', safeConfig().buildCacheRoot, path.join('.runtime', 'build'));
}

export function resolveArtifactRoot() {
  return resolveRoot('UAOS_FACTORY_ARTIFACT_ROOT', safeConfig().artifactRoot, path.join('.runtime', 'artifacts'));
}

export function resolveWorktreeRoot() {
  return resolveRoot('UAOS_FACTORY_WORKTREE_ROOT', safeConfig().worktreeRoot, path.join('.runtime', 'worktrees'));
}

/** Finer-grained overrides than UAOS_FACTORY_ROOT, for callers that want to
 * redirect only one of these without moving the whole factory root. Default
 * behavior (no env var set) stays FACTORY_ROOT-relative, matching every
 * existing call site that already does path.join(FACTORY_ROOT, 'state'|'logs'|'queues', ...). */
export function resolveStateRoot() {
  return process.env.UAOS_FACTORY_STATE_ROOT
    ? path.resolve(process.env.UAOS_FACTORY_STATE_ROOT)
    : path.join(FACTORY_ROOT, 'state');
}

export function resolveLogRoot() {
  return process.env.UAOS_FACTORY_LOG_ROOT
    ? path.resolve(process.env.UAOS_FACTORY_LOG_ROOT)
    : path.join(FACTORY_ROOT, 'logs');
}

export function resolveQueueRoot() {
  return process.env.UAOS_FACTORY_QUEUE_ROOT
    ? path.resolve(process.env.UAOS_FACTORY_QUEUE_ROOT)
    : path.join(FACTORY_ROOT, 'queues');
}

/** Build/artifact/worktree/temp roots are scratch space - only create them
 * when a caller explicitly asks, never as a side effect of path resolution. */
export function ensureDirRequested(p) {
  fs.mkdirSync(p, { recursive: true });
  return p;
}

/** A fresh, disposable directory under the OS temp root - for test data that
 * must never touch the real repo checkout. */
export function disposableTempRoot(prefix = 'uaos-factory-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}
