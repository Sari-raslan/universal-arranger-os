import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export function safeName(name) {
  return String(name).replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/\s+/g, ' ').trim() || 'file';
}

export async function listLibraryItems(samplesDir) {
  await ensureDir(samplesDir);
  const entries = await collectItems(samplesDir, samplesDir);
  const items = [];
  for (const fullPath of entries) {
    const stat = await fs.stat(fullPath);
    items.push(await toItem(path.relative(samplesDir, fullPath), fullPath, stat));
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

async function collectItems(dir, samplesDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const items = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile()) {
      items.push(fullPath);
      continue;
    }
    if (!entry.isDirectory()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    const relative = path.relative(samplesDir, fullPath).replaceAll(path.sep, '/');
    if (ext === '.set' || relative.startsWith('uploads/')) {
      items.push(fullPath);
    } else {
      items.push(...await collectItems(fullPath, samplesDir));
    }
  }
  return items;
}

async function toItem(id, fullPath, stat) {
  const isDirectory = stat.isDirectory();
  return {
    id: id.replaceAll(path.sep, '/'),
    name: path.basename(fullPath),
    isDirectory,
    size: isDirectory ? await directorySize(fullPath) : stat.size,
    updatedAt: stat.mtime.toISOString()
  };
}

async function directorySize(dir) {
  let size = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) size += await directorySize(fullPath);
    if (entry.isFile()) size += (await fs.stat(fullPath)).size;
  }
  return size;
}

export async function removeLibraryItem(samplesDir, id) {
  const target = path.resolve(samplesDir, id);
  if (!target.startsWith(path.resolve(samplesDir))) throw new Error('Invalid library id.');
  await fs.rm(target, { recursive: true, force: false });
}
