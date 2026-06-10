
class NativeMidiBridge{
constructor(){
this.enabled=false;
this.devices=[];
this.events=[];
}

enable(){
this.enabled=true;
return this.status();
}

scan(){
this.devices=[
{id:"virtual_in",name:"UAOS MIDI IN",type:"input"},
{id:"virtual_out",name:"UAOS MIDI OUT",type:"output"}
];

```
return this.status();
```

}

send(note=60){
const e={
type:"native-midi",
note:Number(note),
time:Date.now()
};

```
this.events.push(e);

return e;
```

}

status(){
return {
ok:true,
enabled:this.enabled,
devices:this.devices,
events:this.events.slice(-20)
};
}
}

module.exports = { NativeMidiBridge };
