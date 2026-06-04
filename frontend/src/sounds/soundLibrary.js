export async function loadUaosFactorySounds() {
  const response = await fetch('/sound-library/presets/uaos-factory-sounds.json');

  if (!response.ok) {
    throw new Error('Could not load UAOS factory sounds.');
  }

  return await response.json();
}

export function groupPresetsByCategory(presets) {
  return presets.reduce((groups, preset) => {
    const category = preset.category || 'other';
    groups[category] = groups[category] || [];
    groups[category].push(preset);
    return groups;
  }, {});
}
