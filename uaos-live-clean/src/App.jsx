import { useEffect, useMemo, useState } from "react";
import "./style.css";
import { ArrangerPanel } from "./components/ArrangerPanel.jsx";
import { AudioLab } from "./components/AudioLab.jsx";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { MidiMonitor } from "./components/MidiMonitor.jsx";
import { RuntimeStatus } from "./components/RuntimeStatus.jsx";
import { SessionsPanel } from "./components/SessionsPanel.jsx";
import { StatusBadge } from "./components/StatusBadge.jsx";
import { TimelinePanel } from "./components/TimelinePanel.jsx";
import { ProfessionalArrangerPanel } from "./components/ProfessionalArrangerPanel.jsx";
import { AILabsPanel } from "./components/AILabsPanel.jsx";
import { EVENT_TYPES } from "./core/eventTypes.js";
import { eventBus } from "./core/eventBus.js";
import { detectRuntimeFeatures } from "./core/diagnostics.js";
import { autosaveSession, createDefaultSession, loadSession } from "./session/sessionStore.js";

const plans = [
  { id: "sing", name: "UAOS Sing", price: "Included in Studio workspace", text: "Voice capture, pitch tracking, and session export for singers.", status: "available" },
  { id: "studio", name: "UAOS Studio", price: "19.99 EUR/month", text: "Audio lab, timeline capture, and session tools for creators.", status: "experimental" },
  { id: "pro", name: "UAOS Pro Arranger", price: "49.99 EUR/month", text: "Live arranger controls, scenes, MIDI profiles, and performance foundations.", status: "experimental" }
];

const routeItems = [
  { id: "home", label: "Home" },
  { id: "sing", label: "UAOS Sing" },
  { id: "studio", label: "UAOS Studio" },
  { id: "pro", label: "Pro Arranger" },
  { id: "midi", label: "MIDI" },
  { id: "audio", label: "Audio Lab" },
  { id: "timeline", label: "Timeline" },
  { id: "sessions", label: "Sessions" },
  { id: "live", label: "Live Mode" },
  { id: "sounds", label: "Sounds" },
  { id: "sampler", label: "Sampler" },
  { id: "ai", label: "AI Labs" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "pricing", label: "Pricing" },
  { id: "downloads", label: "Downloads" },
  { id: "status", label: "Release Status" }
];

function route(page, setPage) {
  window.location.hash = "#/" + page;
  setPage(page);
}

function Nav({ page, setPage }) {
  return (
    <nav className="nav">
      <div className="navControls">
        <button className="brandButton" onClick={() => route("home", setPage)}>UAOS</button>
        <button className="secondary" onClick={() => window.history.back()}>Back</button>
        <button className="secondary" onClick={() => route("home", setPage)}>Home</button>
      </div>
      <div className="navItems">
        {routeItems.map((item) => (
          <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => route(item.id, setPage)}>
            {item.label}
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
        <p className="eyebrow">Arabic / English / Deutsch workspace</p>
        <h1>Universal Arranger OS</h1>
        <p className="lead">A browser-first music workstation for microphone analysis, MIDI monitoring, professional arranger experiments, timeline capture, sessions, and local AI arrangement labs.</p>
        <div className="heroActions">
          <button onClick={() => route("audio", setPage)}>Open Audio Lab</button>
          <button className="secondary" onClick={() => route("pro", setPage)}>Pro Arranger</button>
          <button className="secondary" onClick={() => route("ai", setPage)}>AI Labs</button>
        </div>
      </section>
      <RuntimeStatus />
      <section className="cards">
        {plans.map((plan) => (
          <article className="card" key={plan.id}>
            <StatusBadge status={plan.status} />
            <h2>{plan.name}</h2>
            <p>{plan.text}</p>
            <b>{plan.price}</b>
          </article>
        ))}
      </section>
    </main>
  );
}

function Sing({ session, setSession }) {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">UAOS Sing <StatusBadge status="available" /></p>
        <h1>Voice to Music</h1>
        <p className="lead">Capture microphone input, estimate pitch and note names, record supported browser audio formats, and save the result as a UAOS session.</p>
        <input value={session.name} onChange={(event) => setSession({ ...session, name: event.target.value })} />
        <AudioLab />
      </section>
    </main>
  );
}

function Studio({ session, setSession }) {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Creator Studio <StatusBadge status="experimental" /></p>
        <h1>Studio</h1>
        <AudioLab compact />
        <TimelinePanel session={session} onSessionChange={setSession} />
        <SessionsPanel session={session} onSessionChange={setSession} />
      </section>
    </main>
  );
}

function Pro({ session, setSession }) {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Pro Arranger <StatusBadge status="experimental" /></p>
        <h1>Keyboard Tools</h1>
        <p className="lead">Device profiles are MIDI mapping templates and runtime controls. Proprietary commercial style-file parsing is not claimed.</p>
        <ArrangerPanel session={session} onSessionChange={setSession} />
        <ProfessionalArrangerPanel />
        <div className="cards">
          {["KORG Draft Profile", "Yamaha Draft Profile", "Roland Mapping Template", "Ketron Mapping Template"].map((name) => (
            <article className="card" key={name}>
              <StatusBadge status="planned" />
              <h2>{name}</h2>
              <p>Device-oriented MIDI mapping notes for future parser work.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Midi() {
  return <main className="page"><section className="panel"><MidiMonitor /></section></main>;
}

function Sounds() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Sounds <StatusBadge status="planned" /></p>
        <h1>Sounds & Libraries</h1>
        <div className="cards">
          {["Oriental", "Gulf", "Turkish", "Western", "Violin", "Oud"].map((name) => (
            <article className="card" key={name}>
              <h2>{name}</h2>
              <p>Planned library category. This build does not ship commercial sampled instruments.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Sampler() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Sampler <StatusBadge status="planned" /></p>
        <h1>Sampler Foundation</h1>
        <div className="workflow"><div>Samples</div><div>Velocity</div><div>Zones</div><div>Export</div></div>
        <p className="lead">Sampler playback and instrument packaging remain planned for a later version.</p>
      </section>
    </main>
  );
}

function Pricing() {
  return <main className="page"><section className="panel"><h1>Pricing</h1><div className="cards">{plans.map((plan) => <article className="card" key={plan.id}><StatusBadge status={plan.status} /><h2>{plan.name}</h2><p>{plan.price}</p></article>)}</div></section></main>;
}

function Downloads() {
  return <main className="page"><section className="panel"><p className="eyebrow">Downloads <StatusBadge status="planned" /></p><h1>Downloads</h1><p className="lead">Web builds and desktop smoke checks are automated. Final signed installers require platform signing credentials.</p></section></main>;
}

function ReleaseStatus() {
  const features = detectRuntimeFeatures();
  const rows = [
    ["Browser secure context", features.secureContext ? "available" : "planned"],
    ["MediaDevices", features.microphone ? "available" : "planned"],
    ["Web Audio", features.audioContext ? "available" : "planned"],
    ["MediaRecorder", features.mediaRecorder ? "available" : "planned"],
    ["Web MIDI", features.webMidi ? "experimental" : "planned"],
    ["Local storage", features.localStorage ? "available" : "planned"],
    ["Electron bridge", features.electronBridge ? "experimental" : "planned"],
    ["Commercial style parsing", "not-included"],
    ["Cloud AI models", "not-included"]
  ];
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Release Status</p>
        <h1>Runtime Capabilities</h1>
        <p className="lead">The status page reports what the browser and desktop bridge can actually provide. Hardware-only checks remain manual until a MIDI controller or microphone is connected.</p>
        <div className="cards three">
          {rows.map(([name, status]) => (
            <article className="card" key={name}>
              <StatusBadge status={status} />
              <h2>{name}</h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function AppShell() {
  const [page, setPage] = useState(window.location.hash.replace("#/", "") || "home");
  const [session, setSession] = useState(() => {
    try {
      return loadSession();
    } catch {
      return createDefaultSession();
    }
  });

  useEffect(() => {
    const onHash = () => setPage(window.location.hash.replace("#/", "") || "home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    autosaveSession(session);
  }, [session]);

  const screen = useMemo(() => {
    if (page === "sing") return <Sing session={session} setSession={setSession} />;
    if (page === "studio") return <Studio session={session} setSession={setSession} />;
    if (page === "pro") return <Pro session={session} setSession={setSession} />;
    if (page === "midi") return <Midi />;
    if (page === "sounds") return <Sounds />;
    if (page === "sampler") return <Sampler />;
    if (page === "pricing") return <Pricing />;
    if (page === "downloads") return <Downloads />;
    if (page === "status") return <ReleaseStatus />;
    if (page === "audio") return <main className="page"><section className="panel"><AudioLab /></section></main>;
    if (page === "timeline") return <main className="page"><section className="panel"><TimelinePanel session={session} onSessionChange={setSession} /></section></main>;
    if (page === "arranger") return <main className="page"><section className="panel"><ArrangerPanel session={session} onSessionChange={setSession} /></section></main>;
    if (page === "live") return <main className="page"><section className="panel"><ArrangerPanel session={session} onSessionChange={setSession} live /><MidiMonitor compact /></section></main>;
    if (page === "sessions") return <main className="page"><section className="panel"><SessionsPanel session={session} onSessionChange={setSession} /></section></main>;
    if (page === "diagnostics") return <main className="page"><section className="panel"><DiagnosticsPanel /></section></main>;
    if (page === "ai") return <main className="page"><section className="panel"><AILabsPanel /></section></main>;
    return <Home setPage={setPage} />;
  }, [page, session]);

  return (
    <>
      <Nav page={page} setPage={setPage} />
      {screen}
      <footer>UAOS production candidate - V2/V3 experimental features are labelled honestly</footer>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary onError={(error) => eventBus.emit(EVENT_TYPES.RUNTIME_ERROR, { message: error.message })}>
      <AppShell />
    </ErrorBoundary>
  );
}
