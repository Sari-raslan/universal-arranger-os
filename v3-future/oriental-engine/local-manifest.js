import fs from 'fs';

export function createLocalLibraryManifest(items = []) {
  return {
    createdAt: new Date().toISOString(),
    mode: 'local-paths-only',
    redistributesContent: false,
    items: items.map(x => ({
      name: x.name,
      category: x.category,
      kontakt: x.kontakt,
      path: x.path || null,
      microtonal: !!x.microtonal,
      tags: x.style || []
    }))
  };
}

export function saveManifest(manifest, outFile = 'uaos-oriental-manifest.json') {
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2));
  return outFile;
}
