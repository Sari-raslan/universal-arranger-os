
const fs = require("fs");
const path = require("path");

class ProjectStore {
  constructor(root){
    this.root = root;
    this.dir = path.join(root,"projects");
    if(!fs.existsSync(this.dir)){
      fs.mkdirSync(this.dir,{recursive:true});
    }
  }

  save(name,state){
    const safe = String(name).replace(/[^a-z0-9-_]/gi,"_");
    const file = path.join(this.dir, safe + ".json");
    const payload = {
      ok:true,
      name:safe,
      savedAt:Date.now(),
      state
    };
    fs.writeFileSync(file, JSON.stringify(payload,null,2), "utf8");
    return payload;
  }

  load(name){
    const safe = String(name).replace(/[^a-z0-9-_]/gi,"_");
    const file = path.join(this.dir, safe + ".json");
    if(!fs.existsSync(file)){
      return { ok:false, error:"Project not found", name:safe };
    }
    return JSON.parse(fs.readFileSync(file,"utf8"));
  }

  list(){
    return {
      ok:true,
      projects:fs.readdirSync(this.dir).filter(f=>f.endsWith(".json"))
    };
  }
}

module.exports = { ProjectStore };
