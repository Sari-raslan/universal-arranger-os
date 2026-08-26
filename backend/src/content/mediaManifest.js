/**
 * Media/lesson reference validator. Paths are references, not licensed content copies.
 */
export function validateMediaManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.videos)) {
    return { ok: false, error: "Manifest must include videos[]." };
  }
  if (manifest.count != null && manifest.count !== manifest.videos.length) {
    return { ok: false, error: "count does not match videos length." };
  }
  const files = new Set();
  for (const video of manifest.videos) {
    if (!video.title || !video.src || !video.file) return { ok: false, error: "Video missing title/src/file." };
    if (files.has(video.file)) return { ok: false, error: `Duplicate media file ${video.file}` };
    files.add(video.file);
    if (/C:\\Users\\|owner-path|licensed-content/i.test(JSON.stringify(video))) {
      return { ok: false, error: "Owner/licensed path leak in media reference." };
    }
  }
  return {
    ok: true,
    count: manifest.videos.length,
    fixturesAreNotProductContent: true,
    licensedContentCopied: false
  };
}
