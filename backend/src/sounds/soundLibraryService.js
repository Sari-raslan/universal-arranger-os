import fs from 'fs';
import path from 'path';

export function loadFactorySoundLibrary() {
  const file = path.resolve(
    process.cwd(),
    '..',
    'sound-library',
    'presets',
    'uaos-factory-sounds.json'
  );

  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

export function getPresetById(id) {
  const library = loadFactorySoundLibrary();
  return library.presets.find(preset => preset.id === id) || null;
}
