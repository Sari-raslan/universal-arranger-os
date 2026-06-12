export class UAOSWavRecorder {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.mediaRecorder = null;
    this.chunks = [];
    this.stream = null;
  }

  async start(){
    this.stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = e => {
      if(e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start();

    const ev = this.bus.emit("audio.record.start", {});
    this.timeline.add(ev);
  }

  stopAndDownload(){
    if(!this.mediaRecorder) return;

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type:"audio/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "uaos-v115-audio-recording.webm";
      a.click();
      URL.revokeObjectURL(url);

      this.stream?.getTracks()?.forEach(t=>t.stop());

      const ev = this.bus.emit("audio.record.export", {
        format:"webm",
        chunks:this.chunks.length
      });

      this.timeline.add(ev);
    };

    this.mediaRecorder.stop();
  }
}
