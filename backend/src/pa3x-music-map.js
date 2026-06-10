export const PA3X_CHORDS = {
  C:[60,64,67], CM:[60,63,67],
  F:[65,69,72], FM:[65,68,72],
  G:[67,71,74], GM:[67,70,74],
  AM:[69,72,76],
  AB:[68,72,75],
  BB:[70,74,77],
  DM:[62,65,69]
};

export const PROGRESSIONS = {
  oriental_pop:["CM","AB","BB","G","CM"],
  dabke:["DM","C","BB","C"],
  pop:["C","G","AM","F"],
  ballad:["AM","F","C","G"]
};

export function chordNotes(name="C"){
  return PA3X_CHORDS[String(name).toUpperCase()] || PA3X_CHORDS.C;
}

export function progression(name="oriental_pop"){
  return PROGRESSIONS[name] || PROGRESSIONS.oriental_pop;
}
