function makeSong(body = {}) {
  const tempo = Number(body.tempo || 96);
  const section = body.section || "Main A";
  const chord = body.chord || "Cm";
  const maqam = body.maqam || "Nahawand";

  const map = {
    C:[60,64,67], Cm:[60,63,67], Dm:[62,65,69],
    G7:[67,71,74,77], F:[65,69,72], Bb:[70,74,77], Am:[69,72,76]
  };
  const base = map[chord] || map.Cm;
  const notes = [];

  for(let i=0;i<8;i++){
    notes.push({time:i*480,duration:360,note:base[i%base.length]+(section==="Main B"?12:0),velocity:105-i%3*7,channel:0,role:"melody"});
    notes.push({time:i*480+240,duration:150,note:base[0]-12,velocity:75,channel:1,role:"bass"});
    notes.push({time:i*480,duration:90,note:i%2?42:36,velocity:i%2?80:122,channel:9,role:"drum"});
  }

  if(section === "Fill"){
    [38,40,43,45,47,50].forEach((n,k)=>{
      notes.push({time:2880+k*90,duration:70,note:n,velocity:124,channel:9,role:"fill"});
    });
  }

  return { ok:true, name:`UAOS ${section} ${chord} ${maqam}`, tempo, section, chord, maqam, ppq:480, notes };
}

export default function handler(req,res){
  res.status(200).json(makeSong(req.body || {}));
}
