const path = require("path");
const fs = require("fs");

const library = {
  oriental:[
    {id:"oud_pro",name:"UAOS Oud Pro",type:"plucked",articulations:["normal","slide","tremolo","ornament"],quarterTone:true},
    {id:"qanun_pro",name:"UAOS Qanun Pro",type:"plucked",articulations:["normal","gliss","tremolo"],quarterTone:true},
    {id:"nay_kawala",name:"UAOS Nay/Kawala",type:"wind",articulations:["breath","legato","ornament"],quarterTone:true}
  ],
  gulf:[
    {id:"gulf_strings",name:"Gulf Strings",type:"strings",articulations:["legato","staccato","falls"],quarterTone:true},
    {id:"khaliji_drums",name:"Khaliji Rhythm Engine",type:"percussion",articulations:["dum","tak","clap","roll"],quarterTone:false}
  ]
};

function buildSamplerMap(){
  const root = path.join(__dirname,"uploads");
  if(!fs.existsSync(root)) fs.mkdirSync(root,{recursive:true});
  const files = fs.readdirSync(root).filter(f=>f.toLowerCase().endsWith(".wav"));
  return files.map((file,i)=>({
    id:`sample_${i+1}`,
    file,
    url:`/samples/${file}`,
    rootNote:60,
    lowNote:48,
    highNote:72,
    velocityMin:1,
    velocityMax:127,
    roundRobin:1
  }));
}

module.exports={library,buildSamplerMap};
