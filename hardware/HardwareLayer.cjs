
class HardwareLayer {
constructor(){
this.devices = [];
}

scan(){
return this.status();
}

addDevice(name,type="midi"){
const device = { id:"dev_" + Date.now(), name, type, connected:true };
this.devices.push(device);
return device;
}

removeDevice(id){
this.devices = this.devices.filter(d => d.id !== id);
return this.status();
}

status(){
return { ok:true, module:"hardware", devices:this.devices };
}
}

module.exports = { HardwareLayer };
