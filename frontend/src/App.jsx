import { useState } from "react";
import "./style.css";

const tests = [
  "Frontend Loaded",
  "Runtime Start/Stop",
  "Tempo Control",
  "Arranger Sections",
  "Maqam Selector",
  "Sampler Browser",
  "Offline Mode",
  "Legal Local Host"
];

export default function App() {
  const [running, setRunning] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [section, setSection] = useState("Variation 1");
  const [maqam, setMaqam] = useState("Rast");
  const [results, setResults] = useState({});

  function mark(name, value) {
    setResults({ ...results, [name]: value });
  }

  const passCount = Object.values(results).filter(Boolean).length;

  return (
    <main className="app">
      <section className="hero">
        <div className="badge">UAOS Offline Verification Console</div>

        <h1>UAOS HyperStation</h1>
        <h2>Local Verified Runtime</h2>

        <p className="lead">
          Test V1/V2/V3 locally before public deployment.
        </p>

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
            {["Rast", "Bayati", "Hijaz", "Nahawand"].map(x => (
              <button className={maqam === x ? "selected" : ""} onClick={() => setMaqam(x)} key={x}>{x}</button>
            ))}
          </div>
        </div>

        <div className="split">
          <div className="card">
            <h3>Manual Verification</h3>
            <p className="small">Mark each feature after testing it.</p>

            {tests.map(t => (
              <div className="testRow" key={t}>
                <span>{t}</span>
                <button onClick={() => mark(t, true)} className={results[t] ? "ok" : ""}>PASS</button>
                <button onClick={() => mark(t, false)} className={results[t] === false ? "danger" : ""}>FAIL</button>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Sampler / Oriental Engine</h3>
            <ul>
              <li>Oud</li>
              <li>Kanun</li>
              <li>Persian Ney</li>
              <li>Turkish Ney</li>
              <li>Oriental Violins</li>
              <li>Kemence</li>
            </ul>
          </div>
        </div>

        <pre className="json">
{JSON.stringify({
  localVerified: passCount === tests.length,
  passCount,
  total: tests.length,
  running,
  tempo,
  section,
  maqam,
  deployReady: passCount === tests.length,
  note: "Deploy only after all tests are PASS."
}, null, 2)}
        </pre>
      </section>
    </main>
  );
}
