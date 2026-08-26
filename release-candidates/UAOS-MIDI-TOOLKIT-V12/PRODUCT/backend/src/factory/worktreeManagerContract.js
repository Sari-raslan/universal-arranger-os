/**
 * Portfolio/worktree manager contract. Inspects the existing manager.
 * Does not create git worktrees and does not touch Commander.
 */
import fs from "node:fs";

export const WORKTREE_MANAGER =
  "C:/UAOS-WT/uaos-open-library-factory-v3-20260723_185921/uaos-agent-factory/src/worktree-manager.mjs";

export const BLOCKED_PATHS = [
  "C:\\Users\\ssare\\Desktop\\UAOS Commander",
  "C:\\UAOS_AGENT_FACTORY_WORKTREES\\factory-clean-runtime-20260813",
  "C:\\UAOS_AGENT_FACTORY_WORKTREES\\arranger-A-020"
];

export function inspectWorktreeManager() {
  const source = fs.readFileSync(WORKTREE_MANAGER, "utf8");
  const required = ["worktreePathFor", "createIntegrationWorktree", "createTaskWorktree"];
  const missing = required.filter((name) => !source.includes(`export function ${name}`));
  if (missing.length) return { ok: false, error: `missing exports: ${missing.join(",")}` };
  if (!source.includes("ownerDirtyPreserved")) {
    return { ok: false, error: "manager must preserve owner dirty state" };
  }
  return {
    ok: true,
    required,
    blockedPaths: BLOCKED_PATHS,
    createsGitWorktreeOnInspect: false,
    commanderTouched: false
  };
}
