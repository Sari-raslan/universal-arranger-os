import { useEffect, useRef, useState } from "react";
import { analyzeAudioFrame, chooseRecordingMimeType, extensionForMimeType } from "../audio/audioAnalysis.js";
import { eventBus } from "../core/eventBus.js";
import { EVENT_TYPES } from "../core/eventTypes.js";

export function AudioLab({ compact = false }) {
  const [status, setStatus] = useState("Stopped");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [analysis, setAnalysis] = useState({ rms: 0, peak: 0, clipping: false, pitch: null, confidence: 0, note: { name: "--", midi: null } });
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(null);
  const [error, setError] = useState("");
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function scanDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const list = await navigator.mediaDevices.enumerateDevices();
    setDevices(list.filter((item) => item.kind === "audioinput"));
  }

  async function start() {
    if (streamRef.current) return;
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true });
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextCtor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream;
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      setStatus("Running");
      scanDevices();
      loop();
    } catch (err) {
      setError(err.message || "Microphone permission failed.");
      setStatus("Error");
      eventBus.emit(EVENT_TYPES.AUDIO_ERROR, { message: err.message });
    }
  }

  async function resume() {
    await ctxRef.current?.resume?.();
    setStatus("Running");
  }

  async function suspend() {
    await ctxRef.current?.suspend?.();
    setStatus("Suspended");
  }

  function stop() {
    cancelAnimationFrame(rafRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    ctxRef.current?.close();
    streamRef.current = null;
    ctxRef.current = null;
    analyserRef.current = null;
    setRecording(false);
    setStatus("Stopped");
    setAnalysis((prev) => ({ ...prev, rms: 0, peak: 0, clipping: false, pitch: null, confidence: 0, note: { name: "--", midi: null } }));
  }

  function loop() {
    const analyser = analyserRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !ctx) return;
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    const next = analyzeAudioFrame(data, ctx.sampleRate);
    setAnalysis(next);
    eventBus.emit(EVENT_TYPES.AUDIO_ANALYSIS, next);
    rafRef.current = requestAnimationFrame(loop);
  }

  function startRecording() {
    if (!streamRef.current) {
      setError("Start microphone before recording.");
      return;
    }
    const mimeType = chooseRecordingMimeType();
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "application/octet-stream";
      const blob = new Blob(chunksRef.current, { type });
      setRecorded({ url: URL.createObjectURL(blob), type, extension: extensionForMimeType(type) });
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  useEffect(() => {
    scanDevices();
    return stop;
  }, []);

  const level = Math.min(100, Math.round(analysis.rms * 300));
  const peak = Math.min(100, Math.round(analysis.peak * 100));

  return (
    <section className={compact ? "panelSection compact" : "panelSection"}>
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Audio Lab</p>
          <h2>Microphone, pitch, and recording</h2>
        </div>
        <span className={analysis.clipping ? "clip on" : "clip"}>{analysis.clipping ? "Clipping" : "Clean"}</span>
      </div>
      <div className="controlRow">
        <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)} disabled={status === "Running"}>
          <option value="">Default input</option>
          {devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Input ${devices.indexOf(device) + 1}`}</option>)}
        </select>
        <button onClick={start} disabled={status === "Running"}>Start Mic</button>
        <button onClick={resume}>Resume</button>
        <button onClick={suspend}>Suspend</button>
        <button onClick={stop}>Stop</button>
      </div>
      {error && <p className="errorText">{error}</p>}
      <div className="meters">
        <Meter label="RMS" value={level} />
        <Meter label="Peak" value={peak} />
      </div>
      <div className="cards two">
        <article className="card">
          <h3>Pitch Estimate</h3>
          <strong>{analysis.pitch ? `${analysis.pitch.toFixed(1)} Hz` : "--"}</strong>
          <p>{analysis.note.name}{analysis.note.midi !== null ? ` / MIDI ${analysis.note.midi}` : ""}</p>
          <p>Confidence: {Math.round(analysis.confidence * 100)}%</p>
        </article>
        <article className="card">
          <h3>Recording</h3>
          {!recording ? <button onClick={startRecording}>Record</button> : <button onClick={stopRecording}>Stop Recording</button>}
          {recorded && (
            <>
              <audio controls src={recorded.url} />
              <a className="buttonLink" href={recorded.url} download={`uaos-recording.${recorded.extension}`}>Download {recorded.extension.toUpperCase()}</a>
              <p>Format: {recorded.type}</p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}

function Meter({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <div className="meter"><i style={{ width: `${value}%` }} /></div>
      <b>{value}%</b>
    </div>
  );
}

