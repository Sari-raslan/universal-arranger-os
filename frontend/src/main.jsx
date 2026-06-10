import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const tests = [
  "Frontend Loaded",
  "Runtime Start/Stop",
  "Tempo Control",
  "Arranger Sections",
  "Maqam Selector",
  "Sampler Browser",
  "Offline Mode",
  "Legal Local Host",
  "Backend Health",
  "V1/V2/V3 Ready"
];

const instruments = ["Oud", "Kanun", "Persian Ney", "Turkish Ney", "Oriental Violins", "Kemence"];
const maqams = ["Rast", "Bayati", "Hijaz", "Nahawand"];
const sections = ["Intro", "Variation 1", "Variation 2", "Fill", "Break", "Ending"];

function App() {
  const [running, setRunning] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [section, setSection] = useState("Variation 1");
  const [maqam, setMaqam] = useState("Rast");
  const [results, setResults] = useState({});
  const [backend, setBackend] = useState("not checked");

  const passCount = Object.values(results).filter(Boolean).length;
  const failCount = Object.values(results).filter(v => v === false).length;
  const ready = passCount === tests.length && failCount === 0;

  const report = useMemo(() => ({
    product: "UAOS HyperStation",
    build: "LOCAL-STABLE-5180",
    frontend: "working",
    backend,
    runtime: { running, tempo, section, maqam },
    tests: results,
    passCount,
    failCount,
    total: tests.length,
    deployReady: ready
  }), [backend, running, tempo, section, maqam, results, passCount, failCount, ready]);

  function mark(t, value) {
    setResults({ ...results, [t]: value });
  }

  function markAllPass() {
    const all = {};
    tests.forEach(t => all[t] = true);
    setResults(all);
  }

  async function checkBackend() {
    try {
      const res = await fetch("http://localhost:8090/health");
      const json = await res.json();
      setBackend(json.ok ? "online" : "unknown");
    } catch {
      setBackend("offline");
    }
  }

  async function copyReport() {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    alert("Report copied");
  }

  function downloadReport() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uaos-local-verification-report.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app">
      <section className="card">
        <div className="badge">UAOS LOCAL VERIFIED UI • BUILD 5180</div>
        <h1>UAOS HyperStation</h1>
        <h2>{ready ? "Release Ready Locally" : "Offline Verification Console"}</h2>
        <p>Universal Arranger OS: MIDI, Arranger, Sampler, Hardware and AI execution platform.</p>

        <div className={ready ? "status ready" : "status wait"}>
          <b>{ready ? "READY FOR DEPLOY" : "LOCAL TEST REQUIRED"}</b>
          <span>{passCount}/{tests.length} PASS • {failCount} FAIL • Backend: {backend}</span>
        </div>

        <div className="panel">
          <div className="head">
            <h3>Runtime Control</h3>
            <button className={running ? "danger" : "ok"} onClick={() => setRunning(!running)}>
              {running ? "Stop" : "Start"}
            </button>
          </div>

          <div className="meters">
            <div><b>Status</b><span>{running ? "Running" : "Standby"}</span></div>
            <div><b>Tempo</b><span>{tempo} BPM</span></div>
            <div><b>Section</b><span>{section}</span></div>
            <div><b>Maqam</b><span>{maqam}</span></div>
          </div>

          <input type="range" min="60" max="180" value={tempo} onChange={e => setTempo(e.target.value)} />

          <div className="buttons">
            {sections.map(x => (
              <button key={x} className={section === x ? "selected" : ""} onClick={() => setSection(x)}>{x}</button>
            ))}
          </div>

          <div className="buttons">
            {maqams.map(x => (
              <button key={x} className={maqam === x ? "selected" : ""} onClick={() => setMaqam(x)}>{x}</button>
            ))}
          </div>
        </div>

        <div className="split">
          <div className="panel">
            <h3>Manual Verification</h3>
            <div className="buttons">
              <button onClick={markAllPass}>Mark All PASS after real test</button>
              <button onClick={checkBackend}>Check Backend</button>
              <button onClick={copyReport}>Copy Report</button>
              <button onClick={downloadReport}>Download Report</button>
            </div>

            {tests.map(t => (
              <div className="row" key={t}>
                <span>{t}</span>
                <button className={results[t] ? "ok" : ""} onClick={() => mark(t, true)}>PASS</button>
                <button className={results[t] === false ? "danger" : ""} onClick={() => mark(t, false)}>FAIL</button>
              </div>
            ))}
          </div>

          <div className="panel">
            <h3>Oriental Sampler Host</h3>
            <p className="small">Local metadata only. No sample redistribution.</p>
            <ul>{instruments.map(i => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>

        <pre>{JSON.stringify(report, null, 2)}</pre>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
