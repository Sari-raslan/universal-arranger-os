/**
 * Local project store — save/reopen/recovery without silent data loss.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function projectsDir(dataDir) {
  return path.join(dataDir, "projects");
}

function autosavePath(dataDir) {
  return path.join(dataDir, "autosave.json");
}

export function ensureProjectDirs(dataDir) {
  fs.mkdirSync(projectsDir(dataDir), { recursive: true });
  fs.mkdirSync(path.join(dataDir, "exports"), { recursive: true });
  fs.mkdirSync(path.join(dataDir, "diagnostics"), { recursive: true });
  fs.mkdirSync(path.join(dataDir, "trash"), { recursive: true });
}

export function saveProject(dataDir, project) {
  ensureProjectDirs(dataDir);
  if (!project || typeof project !== "object") {
    return { ok: false, errorCode: "INVALID_PROJECT" };
  }
  const id = project.projectId || project.id || `project-${Date.now()}`;
  const payload = {
    ...project,
    projectId: id,
    updatedAt: new Date().toISOString(),
    schema: project.schema || "uaos.project/v1"
  };
  const file = path.join(projectsDir(dataDir), `${id}.json`);
  const tmp = `${file}.tmp`;
  const json = JSON.stringify(payload, null, 2);
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, file);
  fs.writeFileSync(autosavePath(dataDir), json);
  return {
    ok: true,
    projectId: id,
    fileName: path.basename(file),
    sha256: crypto.createHash("sha256").update(json).digest("hex")
  };
}

export function autosaveProject(dataDir, project) {
  ensureProjectDirs(dataDir);
  if (!project) return { ok: false, errorCode: "INVALID_PROJECT" };
  const payload = { ...project, autosavedAt: new Date().toISOString() };
  const json = JSON.stringify(payload, null, 2);
  const tmp = `${autosavePath(dataDir)}.tmp`;
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, autosavePath(dataDir));
  return { ok: true, autosaved: true };
}

export function reopenProject(dataDir, projectId) {
  ensureProjectDirs(dataDir);
  if (!projectId) {
    // try autosave
    try {
      const raw = fs.readFileSync(autosavePath(dataDir), "utf8");
      return { ok: true, source: "autosave", project: JSON.parse(raw) };
    } catch {
      return { ok: false, errorCode: "NO_AUTOSAVE" };
    }
  }
  const file = path.join(projectsDir(dataDir), `${projectId}.json`);
  try {
    const raw = fs.readFileSync(file, "utf8");
    return { ok: true, source: "disk", project: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, errorCode: "PROJECT_NOT_FOUND", detail: e.code || e.message };
  }
}

export function listProjects(dataDir) {
  ensureProjectDirs(dataDir);
  const files = fs.readdirSync(projectsDir(dataDir)).filter((f) => f.endsWith(".json"));
  return {
    ok: true,
    projects: files.map((f) => {
      try {
        const p = JSON.parse(fs.readFileSync(path.join(projectsDir(dataDir), f), "utf8"));
        return { projectId: p.projectId || f.replace(/\.json$/, ""), title: p.title || p.name || f, updatedAt: p.updatedAt };
      } catch {
        return { projectId: f, corrupt: true };
      }
    })
  };
}

export function handleCorruptProject(dataDir, projectId) {
  ensureProjectDirs(dataDir);
  const file = path.join(projectsDir(dataDir), `${projectId}.json`);
  if (!fs.existsSync(file)) return { ok: false, errorCode: "PROJECT_NOT_FOUND" };
  const dest = path.join(dataDir, "trash", `${projectId}-${Date.now()}.json`);
  fs.renameSync(file, dest);
  return { ok: true, quarantined: path.basename(dest), recovered: false, note: "Corrupt project moved to trash; not deleted permanently." };
}

export function uniqueExportPath(dataDir, baseName) {
  ensureProjectDirs(dataDir);
  const dir = path.join(dataDir, "exports");
  let name = baseName;
  let n = 1;
  while (fs.existsSync(path.join(dir, name))) {
    const m = baseName.match(/^(.*?)(\.[^.]+)?$/);
    name = `${m[1]}-${n}${m[2] || ""}`;
    n += 1;
  }
  return path.join(dir, name);
}
