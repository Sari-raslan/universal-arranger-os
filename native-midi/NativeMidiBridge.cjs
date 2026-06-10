
class NativeMidiBridge {
constructor(){
this.enabled = false;
this.devices = [];
this.events = [];
}

enable(){
this.enabled = true;
return this.status();
}

disable(){
this.enabled = false;
return this.status();
}

scan(){
this.devices = [
{ id:"virtual_in_1", name:"UAOS Virtual MIDI In", type:"input" },
{ id:"virtual_out_1", name:"UAOS Virtual MIDI Out", type:"output" }
];

```
return this.status();
```

}

send(note=60, velocity=100, channel=1){
const event = {
type:"native-midi-send",
note:Number(note),
velocity:Number(velocity),
channel:Number(channel),
time:Date.now()
};

```
this.events.push(event);

return event;
```

}

status(){
return {
ok:true,
module:"native-midi",
enabled:this.enabled,
devices:this.devices,
recentEvents:this.events.slice(-20)
};
}
}

module.exports = { NativeMidiBridge };
