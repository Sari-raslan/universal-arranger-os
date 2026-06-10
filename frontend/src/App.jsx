import { useMemo, useState } from "react";
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
  "V1 Build Ready",
  "V2 Runtime Ready",
  "V3 Oriental Engine Ready"
];

const instruments = ["Oud", "Kanun", "Persian Ney", "Turkish Ney", "Oriental Violins", "Kemence"];
const maqams = ["Rast", "Bayati", "Hijaz", "Nahawand"];

export default function App() {
  const [running, setRunning] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [section, setSection] = useState("Variation 1");
  const [maqam, setMaqam] = useState("Rast");
  const [results, setResults] = useState({});
  const [note, setNote] = useState("");

  const passCount = Object.values(results).filter(Boolean).length;
  const failCount = Object.values(results).filter(v => v === false).length;
  const deployReady = passCount === tests.length && failCount === 0;

  const report = useMemo(() => ({
    product: "UAOS HyperStation",
    mode: "Offline Local Verification",
    timestamp: new Date().toISOString(),
    runtime: { running, tempo, section, maqam },
    tests: results,
    passCount,
    failCount,
    total: tests.length,
    deployReady,
    note
  }), [running, tempo, section, maqam, results, passCount, failCount, deployReady, note]);

  function mark(name, value) {
    setResults({ ...results, [name]: value });
  }

  async function copyReport() {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    alert("UAOS verification report copied.");
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

  function passAllSafe() {
    const all = {};
    tests.forEach(t => all[t] = true);
    setResults(all);
  }

  return (
    <main className="app">
      <section className="hero">
        <div className="badge">UAOS Offline Verification Console</div>

        <h1>UAOS HyperStation</h1>
        <h2>{deployReady ? "Release Ready Locally" : "Local Test Required"}</h2>

        <p className="lead">
          Verify every V1/V2/V3 feature locally before public deployment.
        </p>

        <div className={deployReady ? "release ready" : "release wait"}>
          <b>{deployReady ? "READY FOR TOMORROW DEPLOY" : "NOT READY YET"}</b>
          <span>{passCount}/{tests.length} passed • {failCount} failed</span>
        </div>

        <div className="runtime">
          <div className="runtimeHead">
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

          <div className="sections">
            {["Intro", "Variation 1", "Variation 2", "Fill", "Break", "Ending"].map(x => (
              <button className={section === x ? "selected" : ""} onClick={() => setSection(x)} key={x}>{x}</button>
            ))}
          </div>

          <div className="sections">
            {maqams.map(x => (
              <button className={maqam === x ? "selected" : ""} onClick={() => setMaqam(x)} key={x}>{x}</button>
            ))}
          </div>
        </div>

        <div className="split">
          <div className="card">
            <h3>Manual Verification</h3>
            <p className="small">Mark each feature after testing it.</p>

            <div className="actions">
              <button onClick={passAllSafe}>Mark All PASS after real test</button>
              <button onClick={copyReport}>Copy Report</button>
              <button onClick={downloadReport}>Download Report</button>
            </div>

            {tests.map(t => (
              <div className="testRow" key={t}>
                <span>{t}</span>
                <button onClick={() => mark(t, true)} className={results[t] ? "ok" : ""}>PASS</button>
                <button onClick={() => mark(t, false)} className={results[t] === false ? "danger" : ""}>FAIL</button>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Oriental Sampler Host</h3>
            <p className="small">Local metadata only. No sample redistribution.</p>
            <ul>{instruments.map(i => <li key={i}>{i}</li>)}</ul>

            <h3>Tester Notes</h3>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write what works or what needs fixing..." />
          </div>
        </div>

        <pre className="json">{JSON.stringify(report, null, 2)}</pre>
      </section>
    </main>
  );
}
