export class UAOSMidiEngine {
  constructor(bus,timeline){
    this.bus=bus;
    this.timeline=timeline;
    this.outputs=[];
    this.selectedOutputId="";
    this.learnTarget=null;
    this.learnMap=JSON.parse(localStorage.getItem("uaos.learn.map") || "{}");
  }

  async start(){
    if(!navigator.requestMIDIAccess){
      this.timeline.add(this.bus.emit("midi.unsupported",{}));
      return;
    }

    this.access = await navigator.requestMIDIAccess({sysex:false});
    const inputs = [...this.access.inputs.values()];
    this.outputs = [...this.access.outputs.values()];

    this.timeline.add(this.bus.emit("midi.scan",{
      inputs:inputs.map(i=>({id:i.id,name:i.name})),
      outputs:this.outputs.map(o=>({id:o.id,name:o.name}))
    }));

    inputs.forEach(input=>{
      input.onmidimessage = msg => {
        const [status,note,velocity] = msg.data;
        const command = status & 0xf0;
        const channel = (status & 0x0f) + 1;

        let type="midi.raw";
        if(command===144 && velocity>0) type="midi.noteon";
        if(command===128 || (command===144 && velocity===0)) type="midi.noteoff";

        const payload = {device:input.name,status,command,channel,note,velocity};

        if(this.learnTarget){
          const key = [status,note,velocity].join(":");
          this.learnMap[this.learnTarget]=key;
          localStorage.setItem("uaos.learn.map",JSON.stringify(this.learnMap));
          this.timeline.add(this.bus.emit("midi.learn.captured",{target:this.learnTarget,key}));
          this.learnTarget=null;
        }

        this.timeline.add(this.bus.emit(type,payload));
      };
    });
  }

  learn(target){
    this.learnTarget=target;
    this.timeline.add(this.bus.emit("midi.learn.start",{target}));
  }

  setOutput(id){
    this.selectedOutputId=id;
  }

  output(){
    return this.outputs.find(o=>o.id===this.selectedOutputId) || this.outputs[0];
  }

  sendNote(note=60, velocity=100, duration=180, channel=1){
    const o=this.output();
    if(!o) return false;
    const ch=Math.max(0,Math.min(15,channel-1));
    o.send([0x90+ch,note,velocity]);
    setTimeout(()=>o.send([0x80+ch,note,0]), duration);
    return true;
  }

  panic(){
    const o=this.output();
    if(!o) return false;
    for(let ch=0;ch<16;ch++){
      o.send([0xB0+ch,123,0]);
      o.send([0xB0+ch,120,0]);
      for(let n=0;n<128;n++) o.send([0x80+ch,n,0]);
    }
    this.timeline.add(this.bus.emit("midi.panic",{}));
    return true;
  }
}
