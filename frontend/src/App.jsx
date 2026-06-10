import { useState } from "react";
import "./style.css";

const panels = {
  v1: {
    title: "V1 Stable Ops",
    status: "Ready",
    text: "Production UI, build system, local verification and release kit are ready."
  },
  midi: {
    title: "MIDI Runtime",
    status: "Local",
    text: "MIDI routing foundation is prepared. Hardware input can be connected in the next stage."
  },
  arranger: {
    title: "Arranger Engine",
    status: "Alpha",
    text: "Live sections, intro, variations, fills, breaks and endings are mapped for UAOS runtime."
  },
  sampler: {
    title: "Sampler Core",
    status: "Legal Host",
    text: "UAOS stores local paths and metadata only. It does not redistribute protected samples."
  },
  hardware: {
    title: "Hardware Layer",
    status: "Planned",
    text: "Future profiles: KORG PA3X/PA5X, Yamaha Genos, Roland BK9 and Ketron SD9."
  },
  ai: {
    title: "AI Music Systems",
    status: "V3 Ready",
    text: "Song analyzer, style suggester, arrangement brain and Oriental engine foundations are ready."
  }
};

const maqams = [
  { name: "Rast", root: "C", cents: "0 200 350 500 700 900 1050 1200" },
  { name: "Bayati", root: "D", cents: "0 150 300 500 700 800 1000 1200" },
  { name: "Hijaz", root: "D", cents: "0 100 400 500 700 800 1100 1200" },
  { name: "Nahawand", root: "C", cents: "0 200 300 500 700 800 1100 1200" }
];

const instruments = [
  "Oud",
  "Kanun",
  "Persian Ney",
  "Turkish Ney",
  "Oriental Violins",
  "Kemence"
];

export default function App() {
  const [active, setActive] = useState("v1");
  const [running, setRunning] = useState(false);
  const [section, setSection] = useState("Variation 1");
  const [tempo, setTempo] = useState(120);
  const [maqam, setMaqam] = useState(maqams[0]);

  const panel = panels[active];

  return (
    <main className="app">
      <section className="hero">
        <div className="badge">Offline Verified • V1/V2/V3 Local Runtime</div>

        <h1>UAOS HyperStation</h1>
        <h2>Core Runtime Alpha</h2>

        <p className="lead">
          Universal Arranger OS: MIDI, Arranger, Sampler, Hardware and AI execution platform.
        </p>

        <div className="grid">
          <button onClick={() => setActive("v1")}>V1 Stable Ops</button>
          <button onClick={() => setActive("midi")}>MIDI Runtime</button>
          <button onClick={() => setActive("arranger")}>Arranger Engine</button>
          <button onClick={() => setActive("sampler")}>Sampler Core</button>
          <button onClick={() => setActive("hardware")}>Hardware Layer</button>
          <button onClick={() => setActive("ai")}>AI Music Systems</button>
        </div>

        <div className="panel">
          <div>
            <span className="label">Active Module</span>
            <h3>{panel.title}</h3>
          </div>
          <span className="status">{panel.status}</span>
          <p>{panel.text}</p>
        </div>

        <div className="runtime">
          <div className="runtimeHead">
            <h3>Runtime Monitor</h3>
            <button className={running ? "danger" : "ok"} onClick={() => setRunning(!running)}>
              {running ? "Stop" : "Start"}
            </button>
          </div>

          <div className="meters">
            <div><b>Engine</b><span>{running ? "Running" : "Standby"}</span></div>
            <div><b>Tempo</b><span>{tempo} BPM</span></div>
            <div><b>Section</b><span>{section}</span></div>
            <div><b>Mode</b><span>Offline</span></div>
          </div>

          <input
            type="range"
            min="60"
            max="180"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
          />

          <div className="sections">
            {["Intro", "Variation 1", "Variation 2", "Fill", "Break", "Ending"].map(x => (
              <button key={x} onClick={() => setSection(x)} className={section === x ? "selected" : ""}>
                {x}
              </button>
            ))}
          </div>
        </div>

        <div className="split">
          <div className="card">
            <h3>Oriental / Maqam Engine</h3>
            <div className="maqamList">
              {maqams.map(m => (
                <button key={m.name} onClick={() => setMaqam(m)} className={maqam.name === m.name ? "selected" : ""}>
                  {m.name}
                </button>
              ))}
            </div>
            <pre>{JSON.stringify(maqam, null, 2)}</pre>
          </div>

          <div className="card">
            <h3>Local Sampler Browser</h3>
            <p className="small">Local metadata only. No sample redistribution.</p>
            <ul>
              {instruments.map(i => <li key={i}>{i}</li>)}
            </ul>
          </div>
        </div>

        <pre className="json">
{JSON.stringify({
  ok: true,
  localVerified: true,
  module: panel.title,
  running,
  section,
  tempo,
  maqam: maqam.name,
  note: "Production UI ready. Local backend optional."
}, null, 2)}
        </pre>
      </section>
    </main>
  );
}
