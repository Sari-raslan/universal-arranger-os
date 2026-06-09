export function generateStyle(seed="Oriental Pop"){
  return {
    name: seed,
    tempo: 120,
    sections: {
      Intro: ["Cm","Ab","Bb","G"],
      "Main A": ["Cm","Cm","Ab","G"],
      "Main B": ["Ab","Bb","Cm","G"],
      Fill: ["G","Ab","G"],
      Ending: ["Cm"]
    },
    drums: ["kick","snare","hat","perc"],
    bass: "root-follow",
    generatedAt: new Date().toISOString()
  };
}