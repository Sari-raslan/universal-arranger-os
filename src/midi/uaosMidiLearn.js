$Root="$HOME\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
Set-Location $Root

$Stamp=Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force reports,release-kit,src\midi,src\scene,src\arranger,src\project | Out-Null

$Log="reports\UAOS_4H_AUTONOMOUS_DEV_$Stamp.txt"

function Log($m){
  $line="[$(Get-Date -Format 'HH:mm:ss')] $m"
  $line | Tee-Object -FilePath $Log -Append
}

Log "UAOS AUTONOMOUS DEV START - NO DEPLOY"

@'
export class UAOSMidiLearn {
  constructor(bus,timeline){
    this.bus=bus;
    this.timeline=timeline;
    this.learningTarget=null;
    this.map=JSON.parse(localStorage.getItem("uaos.v118.midiLearn")||"{}");
  }

  learn(target){
    this.learningTarget=target;
    const ev=this.bus.emit("midi.learn.start",{target});
    this.timeline.add(ev);
  }

  capture(message){
    if(!this.learningTarget)return null;
    const key=`${message.status}:${message.note}:${message.velocity}`;
    this.map[this.learningTarget]=key;
    localStorage.setItem("uaos.v118.midiLearn",JSON.stringify(this.map));
    const ev=this.bus.emit("midi.learn.captured",{target:this.learningTarget,key});
    this.timeline.add(ev);
    this.learningTarget=null;
    return key;
  }

  resolve(message){
    const key=`${message.status}:${message.note}:${message.velocity}`;
    return Object.entries(this.map).find(([target,k])=>k===key)?.[0] || null;
  }
}
