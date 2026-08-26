import fs from 'fs';
import path from 'path';

export function loadMidiProfile(profilePath) {
  const raw = fs.readFileSync(profilePath, 'utf8');
  return JSON.parse(raw);
}

export function loadAllMidiProfiles(rootDir = 'midi-profiles') {
  const resolvedRootDir = fs.existsSync(rootDir) ? rootDir : path.join('..', rootDir);

  if (!fs.existsSync(resolvedRootDir)) return [];

  return fs.readdirSync(resolvedRootDir)
    .filter(file => file.endsWith('.json'))
    .map(file => loadMidiProfile(path.join(resolvedRootDir, file)));
}

export function matchProfileForDevice(deviceName, profiles) {
  const name = String(deviceName || '').toLowerCase();

  for (const profile of profiles) {
    const includes = profile?.match?.nameIncludes || [];

    if (includes.some(part => name.includes(String(part).toLowerCase()))) {
      return profile;
    }
  }

  return profiles.find(profile => profile.id === 'generic-midi-controller') || profiles[0] || null;
}

export function normalizeMidiEvent(event) {
  return {
    type: event.type || 'unknown',
    channel: event.channel || 1,
    note: event.note ?? null,
    velocity: event.velocity ?? null,
    controller: event.controller ?? null,
    value: event.value ?? null,
    program: event.program ?? null,
    timestamp: new Date().toISOString()
  };
}

export function resolveMidiAction(event, profile) {
  const normalized = normalizeMidiEvent(event);

  let control = null;

  if (normalized.type === 'noteon') {
    control = profile?.mappings?.notes?.[String(normalized.note)];
  }

  if (normalized.type === 'cc') {
    control = profile?.mappings?.cc?.[String(normalized.controller)];
  }

  if (normalized.type === 'programchange') {
    control =
      profile?.mappings?.programChange?.[String(normalized.program)] ||
      profile?.mappings?.programChange?.['*'];
  }

  if (normalized.type === 'pitchbend') {
    control = profile?.mappings?.pitchBend;
  }

  if (normalized.type === 'aftertouch') {
    control = profile?.mappings?.aftertouch;
  }

  return {
    event: normalized,
    control,
    action: control ? profile?.actions?.[control] : null,
    profile: profile?.id || null
  };
}
