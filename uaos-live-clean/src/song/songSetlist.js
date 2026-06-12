export function createSong(name = "Untitled Song") {
  return { version: 2, name, sections: [], chordProgression: [], markers: [], lyrics: "", tempoMap: [{ tick: 0, bpm: 120 }], sceneChanges: [], keyboardSetup: {}, styleAssignment: "", notes: "" };
}

export function addSongSection(song, section) {
  return { ...song, sections: [...song.sections, { name: "VARIATION_A", bars: 8, ...section }] };
}

export function createSetlist(name = "Setlist") {
  return { version: 2, name, songs: [], currentIndex: 0, updatedAt: new Date().toISOString() };
}

export function addSongToSetlist(setlist, song) {
  return { ...setlist, songs: [...setlist.songs, song], updatedAt: new Date().toISOString() };
}

export function nextSong(setlist) {
  return { ...setlist, currentIndex: Math.min(setlist.songs.length - 1, setlist.currentIndex + 1) };
}

export function previousSong(setlist) {
  return { ...setlist, currentIndex: Math.max(0, setlist.currentIndex - 1) };
}

export function validateSongProject(project) {
  if (!project || typeof project !== "object") return { ok: false, error: "Project must be an object." };
  if (!Array.isArray(project.songs)) return { ok: false, error: "Setlist songs must be an array." };
  return { ok: true };
}

