import fs from 'node:fs';
import path from 'node:path';
import {
  ensureDir,
  atomicWriteJson,
  sha256File,
  nowIso
} from './lib.mjs';
import { resolveArtifactRoot } from './paths.mjs';

export function artifactDir(lane, version = 'v1') {
  const folder = lane === 'library' ? 'library-factory' : lane;
  const dir = path.join(resolveArtifactRoot(), folder, version);
  ensureDir(dir);
  return dir;
}

export function writeSha256Sums(dir, files) {
  const lines = files.map((f) => `${f.sha256}  ${path.basename(f.path)}`);
  const out = path.join(dir, 'SHA256SUMS.txt');
  fs.writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');
  return out;
}

export function recordArtifactManifest(lane, entries) {
  const dir = artifactDir(lane);
  const hashed = entries
    .filter((p) => fs.existsSync(p))
    .map((p) => ({
      path: p,
      name: path.basename(p),
      sha256: sha256File(p),
      bytes: fs.statSync(p).size
    }));
  const manifest = {
    lane,
    updatedAt: nowIso(),
    files: hashed
  };
  atomicWriteJson(path.join(dir, 'RELEASE_FILE_MANIFEST.json'), manifest);
  if (hashed.length) writeSha256Sums(dir, hashed);
  return manifest;
}
