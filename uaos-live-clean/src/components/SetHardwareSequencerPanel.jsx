import { useEffect, useState } from "react";

export function SetHardwareSequencerPanel() {
  const [devices, setDevices] = useState([]);
  const [scanPath, setScanPath] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [job, setJob] = useState(null);
  const [form, setForm] = useState({
    title: "",
    durationSeconds: 180,
    tempoHint: 120,
    timeSignatureHint: "4/4",
    deviceProfileId: "korg-pa5x"
  });

  useEffect(() => {
    fetch("/api/hardware/devices")
      .then((response) => response.json())
      .then((payload) => setDevices(payload.ok ? payload.data : []))
      .catch(() => setDevices([]));
  }, []);

  async function scanSet() {
    setScanError("");
    setScanResult(null);
    const response = await fetch("/api/set/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: scanPath })
    });
    const payload = await response.json();
    if (!payload.ok) {
      setScanError(payload.error?.message || "SET scan failed.");
      return;
    }
    setScanResult(payload.data);
  }

  async function analyze(event) {
    event.preventDefault();
    const response = await fetch("/api/smart-sequencer/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (!payload.ok) {
      setJob({ status: "failed", error: payload.error });
      return;
    }
    setJob(payload.data);
  }

  useEffect(() => {
    if (!job?.jobId || ["completed", "failed"].includes(job.status)) return undefined;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/smart-sequencer/status/${job.jobId}`);
      const payload = await response.json();
      if (payload.ok) setJob(payload.data);
    }, 700);
    return () => window.clearInterval(timer);
  }, [job]);

  const result = job?.result;

  return (
    <section className="uaosInfoCard">
      <h2>SET Hardware & Smart Sequencer</h2>
      <p>KORG SET support is metadata indexing only. Proprietary parsing and export are not included.</p>

      <label className="uaosField">
        <span>Allowed local SET folder path</span>
        <input value={scanPath} onChange={(event) => setScanPath(event.target.value)} />
      </label>
      <button type="button" onClick={scanSet} disabled={!scanPath.trim()}>
        Scan SET
      </button>

      {scanError && <p role="alert">{scanError}</p>}
      {scanResult && (
        <div>
          <strong>{scanResult.fileCount} indexed files</strong>
          <p>Status: {scanResult.implementationStatus}</p>
          <ul>
            {scanResult.files.slice(0, 20).map((item) => (
              <li key={`${item.kind}:${item.relativePath}`}>{item.relativePath} â€” {item.implementationStatus}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={analyze}>
        <label className="uaosField">
          <span>Song title</span>
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>
        <label className="uaosField">
          <span>Duration in seconds</span>
          <input type="number" min="1" max="21600" value={form.durationSeconds} onChange={(event) => setForm({ ...form, durationSeconds: Number(event.target.value) })} />
        </label>
        <label className="uaosField">
          <span>Tempo hint</span>
          <input type="number" min="20" max="300" value={form.tempoHint} onChange={(event) => setForm({ ...form, tempoHint: Number(event.target.value) })} />
        </label>
        <label className="uaosField">
          <span>Time signature</span>
          <input value={form.timeSignatureHint} onChange={(event) => setForm({ ...form, timeSignatureHint: event.target.value })} />
        </label>
        <label className="uaosField">
          <span>Target device</span>
          <select value={form.deviceProfileId} onChange={(event) => setForm({ ...form, deviceProfileId: event.target.value })}>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>{device.vendor} {device.model} â€” {device.implementationStatus}</option>
            ))}
          </select>
        </label>
        <button type="submit">Create metadata sequencer plan</button>
      </form>

      <button type="button" disabled title="Audio analysis engine is not connected.">
        Upload audio â€” unavailable
      </button>

      {job && <p>Job status: {job.status}</p>}
      {job?.error && <p role="alert">{job.error.message}</p>}
      {result && (
        <div>
          <p>Tempo: {result.detectedTempo}</p>
          <p>Time signature: {result.timeSignature}</p>
          <p>Compatibility: {result.compatibility}</p>
          <h3>Sections</h3>
          <ul>{result.sections.map((section) => <li key={section.id}>{section.label}: {section.bars} bars</li>)}</ul>
          <h3>Track plan</h3>
          <ul>{result.trackPlan.map((track) => <li key={track.id}>{track.role}: channel {track.channel} ({track.status})</li>)}</ul>
          <h3>Warnings</h3>
          <ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
