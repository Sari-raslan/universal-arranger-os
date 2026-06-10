export const PA3X_CHORDS = {
  C:[60,64,67],
  CM:[60,63,67],
  D:[62,66,69],
  DM:[62,65,69],
  E:[64,68,71],
  EM:[64,67,71],
  F:[65,69,72],
  FM:[65,68,72],
  G:[67,71,74],
  GM:[67,70,74],
  A:[69,73,76],
  AM:[69,72,76],
  BB:[70,74,77],
  AB:[68,72,75]
};

export const PROGRESSIONS = {
  oriental_pop:["CM","AB","BB","G"],
  pop:["C","G","AM","F"],
  minor_ballad:["AM","F","C","G"],
  dabke:["DM","C","BB","C"]
};

export function getChord(name){
  return PA3X_CHORDS[String(name || "C").toUpperCase()] || PA3X_CHORDS.C;
}

export function getProgression(name){
  return PROGRESSIONS[name] || PROGRESSIONS.oriental_pop;
}
