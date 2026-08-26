/**
 * In-memory IO for library-build journal recovery tests.
 */
export function createMemoryIo(seed = {}) {
  const files = new Map(Object.entries(seed));
  const dirs = new Set();
  return {
    files,
    exists(p) {
      return files.has(p);
    },
    readText(p) {
      if (!files.has(p)) throw new Error(`missing ${p}`);
      return files.get(p);
    },
    writeText(p, text) {
      files.set(p, String(text));
    },
    mkdir(p) {
      dirs.add(p);
    },
    remove(p) {
      files.delete(p);
    },
    rmdir(p) {
      dirs.delete(p);
      for (const key of [...files.keys()]) {
        if (key.startsWith(p)) files.delete(key);
      }
    },
    copyFile(from, to) {
      if (!files.has(from)) throw new Error(`missing backup ${from}`);
      files.set(to, files.get(from));
    }
  };
}
