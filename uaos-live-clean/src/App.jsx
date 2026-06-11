import React, { useMemo, useState } from "react";
import "./style.css";

const plans = [
  { id: "sing", name: "UAOS Sing", price: "9-15 EUR", text: "Voice to full music for singers." },
  { id: "studio", name: "UAOS Studio", price: "19-29 EUR", text: "Easy music studio for creators." },
  { id: "pro", name: "UAOS Pro Arranger", price: "49-99 EUR", text: "Professional arranger tools for keyboards." }
];

function route(page, setPage) {
  window.location.hash = "#/" + page;
  setPage(page);
}

function Nav({ page, setPage }) {
  const items = ["home", "sing", "studio", "pro", "midi", "sounds", "sampler", "promo", "pricing", "downloads"];
  return (
    <nav className="nav">
      <b className="brand">UAOS</b>
      <div className="navItems">
        {items.map((x) => (
          <button key={x} className={page === x ? "active" : ""} onClick={() => route(x, setPage)}>
            {x}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Home({ setPage }) {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">PUBLIC V1.2</p>
        <h1>Sing. Create. Arrange.</h1>
        <p className="lead">UAOS is a multi-product music platform: Singer, Creator Studio, Pro Arranger, Sound Library, and Sampler foundation.</p>
        <div className="heroActions">
          <button onClick={() => route("sing", setPage)}>Start Sing</button>
          <button className="secondary" onClick={() => route("studio", setPage)}>Open Studio</button>
          <button className="secondary" onClick={() => route("pro", setPage)}>Pro Arranger</button>
        </div>
      </section>
      <section className="cards">
        {plans.map((p) => (
          <article className="card" key={p.id}>
            <h2>{p.name}</h2>
            <p>{p.text}</p>
            <b>{p.price}</b>
          </article>
        ))}
      </section>
    </main>
  );
}

function Sing() {
  const [name, setName] = useState(localStorage.getItem("uaos_project_name") || "My UAOS Song");
  const [voice, setVoice] = useState("No file selected");
  function save() {
    localStorage.setItem("uaos_project_name", name);
    alert("Saved locally");
  }
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">UAOS Sing</p>
        <h1>Voice to Music</h1>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <input type="file" accept="audio/*" onChange={(e) => setVoice(e.target.files?.[0]?.name || "No file selected")} />
        <div className="fakeBox"><b>Voice:</b> {voice}</div>
        <div className="workflow"><div>Upload</div><div>Style</div><div>Generate</div><div>Export</div></div>
        <button onClick={save}>Save Local Project</button>
      </section>
    </main>
  );
}

function Studio() {
  return <main className="page"><section className="panel"><h1>Creator Studio</h1><div className="studioGrid">{["Drums","Bass","Chords","Piano","Strings","Lead","Vocal","FX"].map((t)=><div className="track" key={t}><span>{t}</span><button>Mute</button><button>Solo</button></div>)}</div></section></main>;
}

function Pro() {
  return <main className="page"><section className="panel"><h1>Keyboard Tools</h1><div className="cards">{["KORG","Yamaha","Roland","Ketron"].map((d)=><article className="card" key={d}><h2>{d}</h2><p>Style, Set, MIDI, SongBook profile.</p></article>)}</div></section></main>;
}

function Midi() {
  const [status, setStatus] = useState("Not scanned");
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);

  async function scan() {
    if (window.uaosMidi) {
      const test = await window.uaosMidi.test();
      const ins = await window.uaosMidi.listInputs();
      const outs = await window.uaosMidi.listOutputs();
      setStatus(test.message || "Electron MIDI bridge ready");
      setInputs(ins.inputs || []);
      setOutputs(outs.outputs || []);
      return;
    }

    if (!navigator.requestMIDIAccess) {
      setStatus("WebMIDI not available. Use Chrome or UAOS Desktop.");
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess();
      setInputs([...access.inputs.values()].map((x) => x.name));
      setOutputs([...access.outputs.values()].map((x) => x.name));
      setStatus("WebMIDI scan complete");
    } catch {
      setStatus("MIDI permission failed");
    }
  }

  return <main className="page"><section className="panel"><h1>MIDI Diagnostics</h1><button onClick={scan}>Scan MIDI</button><div className="fakeBox">{status}</div><div className="cards"><article className="card"><h2>Inputs</h2>{inputs.length ? inputs.map((x)=><p key={x}>{x}</p>) : <p>No inputs found</p>}</article><article className="card"><h2>Outputs</h2>{outputs.length ? outputs.map((x)=><p key={x}>{x}</p>) : <p>No outputs found</p>}</article></div></section></main>;
}

function Sounds() {
  return <main className="page"><section className="panel"><h1>Sounds & Libraries</h1><div className="cards">{["Oriental","Gulf","Turkish","Western","Violin","Oud"].map((x)=><article className="card" key={x}><h2>{x}</h2><p>Library placeholder with articulations and human feel plan.</p></article>)}</div></section></main>;
}

function Sampler() {
  return <main className="page"><section className="panel"><h1>Sampler Foundation</h1><div className="workflow"><div>Samples</div><div>Velocity</div><div>Round Robin</div><div>Articulations</div></div></section></main>;
}

function Promo() {
  return <main className="page"><section className="panel"><h1>Marketing Message</h1><div className="fakeBox">Sing. Create. Arrange. UAOS turns your voice and ideas into complete arrangements.</div></section></main>;
}

function Pricing() {
  return <main className="page"><section className="panel"><h1>Pricing</h1><div className="cards">{plans.map((p)=><article className="card" key={p.id}><h2>{p.name}</h2><p>{p.price}</p></article>)}</div></section></main>;
}

function Downloads() {
  return <main className="page"><section className="panel"><h1>Downloads</h1><p className="lead">Web is live. Desktop and APK come after V1 web stabilization.</p></section></main>;
}

export default function App() {
  const [page, setPage] = useState(window.location.hash.replace("#/", "") || "home");
  const screen = useMemo(() => {
    if (page === "sing") return <Sing />;
    if (page === "studio") return <Studio />;
    if (page === "pro") return <Pro />;
    if (page === "midi") return <Midi />;
    if (page === "sounds") return <Sounds />;
    if (page === "sampler") return <Sampler />;
    if (page === "promo") return <Promo />;
    if (page === "pricing") return <Pricing />;
    if (page === "downloads") return <Downloads />;
    return <Home setPage={setPage} />;
  }, [page]);

  return <><Nav page={page} setPage={setPage} />{screen}<footer>UAOS Public V1.2</footer></>;
}

