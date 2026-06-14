export function detectRecordingSupport(scope = globalThis) {
  const navigatorRef = scope.navigator || {};
  return {
    mediaDevices: Boolean(navigatorRef.mediaDevices?.getUserMedia),
    mediaRecorder: typeof scope.MediaRecorder === "function",
    supportedMimeTypes: ["audio/webm", "audio/webm;codecs=opus", "audio/mp4"].filter((type) =>
      typeof scope.MediaRecorder?.isTypeSupported === "function"
        ? scope.MediaRecorder.isTypeSupported(type)
        : type === "audio/webm",
    ),
  };
}

export class RecordingEngine {
  constructor(scope = globalThis) {
    this.scope = scope;
    this.state = "idle";
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
    this.clips = [];
    this.level = { peak: 0, clipping: false };
  }

  async selectMicrophone(deviceId = null) {
    const support = detectRecordingSupport(this.scope);
    if (!support.mediaDevices) {
      throw new Error("Microphone input is not supported in this runtime.");
    }

    this.stream = await this.scope.navigator.mediaDevices.getUserMedia({
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    });
    return this.stream;
  }

  start({ mimeType = null } = {}) {
    const support = detectRecordingSupport(this.scope);
    if (!support.mediaRecorder) {
      throw new Error("MediaRecorder is not supported in this runtime.");
    }
    if (!this.stream) {
      throw new Error("Select a microphone before recording.");
    }

    const selectedMimeType = mimeType || support.supportedMimeTypes[0] || "";
    this.chunks = [];
    this.recorder = new this.scope.MediaRecorder(
      this.stream,
      selectedMimeType ? { mimeType: selectedMimeType } : undefined,
    );
    this.recorder.ondataavailable = (event) => {
      if (event.data?.size) this.chunks.push(event.data);
    };
    this.recorder.start();
    this.state = "recording";
    return this.state;
  }

  pause() {
    if (this.recorder?.state === "recording") {
      this.recorder.pause();
      this.state = "paused";
    }
    return this.state;
  }

  resume() {
    if (this.recorder?.state === "paused") {
      this.recorder.resume();
      this.state = "recording";
    }
    return this.state;
  }

  async stop() {
    if (!this.recorder || this.state === "idle") {
      return null;
    }

    const recorder = this.recorder;
    await new Promise((resolve) => {
      recorder.onstop = resolve;
      recorder.stop();
    });

    const type = recorder.mimeType || "application/octet-stream";
    const blob = new Blob(this.chunks, { type });
    const clip = {
      id: `clip-${this.clips.length + 1}`,
      createdAt: new Date().toISOString(),
      type,
      size: blob.size,
      blob,
      offlineRenderAvailable: false,
    };
    this.clips.push(clip);
    this.state = "idle";
    return clip;
  }

  updateLevel(samples = []) {
    const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(Number(sample))), 0);
    this.level = { peak, clipping: peak >= 0.98 };
    return this.level;
  }

  stopTracks() {
    for (const track of this.stream?.getTracks?.() || []) {
      track.stop();
    }
    this.stream = null;
  }
}
