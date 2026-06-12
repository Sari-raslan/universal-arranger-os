export function createPattern(id = "pattern-1") {
  return { version: 2, id, name: "New Pattern", ppq: 480, lengthTicks: 1920, lanes: {}, metadata: {}, notes: [] };
}

export function validatePattern(pattern) {
  if (!pattern || typeof pattern !== "object") return { ok: false, error: "Pattern must be an object." };
  if (!Array.isArray(pattern.notes)) return { ok: false, error: "Pattern notes must be an array." };
  for (const note of pattern.notes) {
    if (!Number.isFinite(note.tick) || note.tick < 0) return { ok: false, error: "Note tick must be non-negative." };
    if (!Number.isFinite(note.note) || note.note < 0 || note.note > 127) return { ok: false, error: "Note pitch must be 0-127." };
    if (!Number.isFinite(note.duration) || note.duration <= 0) return { ok: false, error: "Note duration must be positive." };
  }
  return { ok: true };
}

export function createPatternEditor(pattern = createPattern()) {
  let past = [];
  let present = pattern;
  let future = [];

  function commit(next) {
    const validation = validatePattern(next);
    if (!validation.ok) throw new Error(validation.error);
    past.push(present);
    present = next;
    future = [];
    return present;
  }

  return {
    get: () => present,
    addNote: (note) => commit({ ...present, notes: [...present.notes, { lane: "drums", velocity: 100, ...note }] }),
    updateNote: (index, patch) => commit({ ...present, notes: present.notes.map((note, i) => i === index ? { ...note, ...patch } : note) }),
    deleteNote: (index) => commit({ ...present, notes: present.notes.filter((_, i) => i !== index) }),
    duplicate: () => commit({ ...present, id: `${present.id}-copy`, name: `${present.name} Copy` }),
    setLoop: (startTick, endTick) => commit({ ...present, loop: { startTick, endTick } }),
    setMetadata: (metadata) => commit({ ...present, metadata: { ...present.metadata, ...metadata } }),
    undo: () => {
      if (!past.length) return present;
      future.unshift(present);
      present = past.pop();
      return present;
    },
    redo: () => {
      if (!future.length) return present;
      past.push(present);
      present = future.shift();
      return present;
    },
    exportJson: () => JSON.stringify(present, null, 2),
    importJson: (text) => commit(JSON.parse(text))
  };
}

