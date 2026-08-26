export const presetBank = [
  { id:"oriental-pop", name:"Oriental Pop", tempo:120, scale:"Nahawand", defaultChord:"Cm" },
  { id:"dabke-live", name:"Dabke Live", tempo:132, scale:"Hijaz", defaultChord:"Dm" },
  { id:"slow-ballad", name:"Slow Ballad", tempo:76, scale:"Minor", defaultChord:"Am" },
  { id:"khaleeji", name:"Khaleeji", tempo:96, scale:"Bayati", defaultChord:"D" }
];

export function getPresets(){ return presetBank; }
export function getPreset(id){ return presetBank.find(p=>p.id===id) || presetBank[0]; }