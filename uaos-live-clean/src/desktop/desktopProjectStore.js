export function createDesktopProjectStore(adapter) {
  return {
    available: Boolean(adapter?.read && adapter?.write),
    async save(path, project) {
      if (!adapter?.write) throw new Error("Desktop file write adapter unavailable.");
      await adapter.write(path, JSON.stringify(project, null, 2));
      return { ok: true, path };
    },
    async load(path) {
      if (!adapter?.read) throw new Error("Desktop file read adapter unavailable.");
      return JSON.parse(await adapter.read(path));
    }
  };
}

