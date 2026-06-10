
class DeviceAutoMapper {
  constructor(){
    this.mappings = [];
  }

  detectProfile(name){
    const lower = String(name).toLowerCase();

    if(lower.includes("korg") || lower.includes("pa5x") || lower.includes("pa3x")){
      return "korg-pa";
    }

    if(lower.includes("genos") || lower.includes("yamaha")){
      return "yamaha-genos";
    }

    if(lower.includes("kontakt") || lower.includes("native")){
      return "kontakt-library";
    }

    if(lower.includes("roland")){
      return "roland-arranger";
    }

    return "generic-midi";
  }

  mapDevice(name,type="midi"){
    const mapping = {
      id:"map_" + Date.now(),
      name,
      type,
      profile:this.detectProfile(name),
      createdAt:Date.now()
    };

    this.mappings.push(mapping);

    return mapping;
  }

  status(){
    return {
      ok:true,
      module:"device-auto-mapper",
      mappings:this.mappings
    };
  }
}

module.exports = { DeviceAutoMapper };
