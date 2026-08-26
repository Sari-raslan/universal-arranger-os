/**
 * Dependency DAG validation + cycle detection for Program Tree.
 */
import fs from "node:fs";
import path from "node:path";

export function validateDependencyDag({
  treeRoot = path.join(process.cwd(), "uaos-program-tree")
} = {}) {
  const tasksDoc = JSON.parse(fs.readFileSync(path.join(treeRoot, "TASKS.json"), "utf8"));
  const depsDoc = JSON.parse(fs.readFileSync(path.join(treeRoot, "DEPENDENCIES.json"), "utf8"));
  const tasks = tasksDoc.tasks || [];
  const edges = depsDoc.edges || [];
  const ids = new Set(tasks.map((t) => t.id));
  const dangling = edges.filter((e) => !ids.has(e.from) || !ids.has(e.to));
  const adj = new Map(tasks.map((t) => [t.id, []]));
  for (const e of edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) continue;
    adj.get(e.from).push(e.to);
  }
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map(tasks.map((t) => [t.id, WHITE]));
  const cycles = [];
  for (const start of ids) {
    if (color.get(start) !== WHITE) continue;
    const stack = [[start, 0]];
    const pathStack = [start];
    color.set(start, GRAY);
    while (stack.length) {
      const [node, idx] = stack[stack.length - 1];
      const children = adj.get(node) || [];
      if (idx < children.length) {
        stack[stack.length - 1][1]++;
        const child = children[idx];
        const c = color.get(child);
        if (c === WHITE) {
          color.set(child, GRAY);
          stack.push([child, 0]);
          pathStack.push(child);
        } else if (c === GRAY) {
          const cIdx = pathStack.indexOf(child);
          cycles.push(pathStack.slice(cIdx).concat(child));
        }
      } else {
        color.set(node, BLACK);
        stack.pop();
        pathStack.pop();
      }
    }
  }
  return {
    schema: "uaos.orchestration.dependency-dag-validation/v1",
    ok: dangling.length === 0 && cycles.length === 0 && tasks.length === 1604,
    taskCount: tasks.length,
    edgeCount: edges.length,
    danglingEdgeCount: dangling.length,
    cycleCount: cycles.length,
    cyclesSample: cycles.slice(0, 3)
  };
}

export function detectCycles(treeRoot) {
  const r = validateDependencyDag({ treeRoot });
  return {
    schema: "uaos.orchestration.cycle-detection/v1",
    ok: r.cycleCount === 0,
    cycleCount: r.cycleCount,
    cyclesSample: r.cyclesSample
  };
}
