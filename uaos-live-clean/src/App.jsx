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
import { autosaveSession, createDefaultSession, loadSession } from "./session/sessionStore.js";

const plans = [
  { id: "sing", name: "UAOS Sing", price: "9-15 EUR", text: "Voice capture, pitch tracking, and session export for singers.", status: "available" },
  { id: "studio", name: "UAOS Studio", price: "19-29 EUR", text: "Audio lab, timeline capture, and session tools for creators.", status: "experimental" },
  { id: "pro", name: "UAOS Pro Arranger", price: "49-99 EUR", text: "Live arranger controls and MIDI performance foundation.", status: "experimental" }
];

const routeItems = ["home", "sing", "studio", "pro", "midi", "sounds", "sampler", "promo", "pricing", "downloads", "audio", "timeline", "arranger", "live", "sessions", "diagnostics", "ai"];

function route(page, setPage) {
  window.location.hash = "#/" + page;
  setPage(page);
}

function Nav({ page, setPage }) {
  return (
    <nav className="nav">
      <button className="brandButton" onClick={() => route("home", setPage)}>UAOS</button>
      <div className="navItems">
        {routeItems.map((item) => (
          <button key={item} className={page === item ? "active" : ""} onClick={() => route(item, setPage)}>
            {item}
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
        <p className="eyebrow">UAOS V1</p>
        <h1>Universal Arranger OS</h1>
        <p className="lead">A browser-first arranger workspace for microphone analysis, MIDI monitoring, timeline capture, session export, and live performance experiments.</p>
        <div className="heroActions">
          <button onClick={() => route("audio", setPage)}>Open Audio Lab</button>
          <button className="secondary" onClick={() => route("midi", setPage)}>Scan MIDI</button>
          <button className="secondary" onClick={() => route("live", setPage)}>Live Mode</button>
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
        <p className="lead">Draft profiles and mapping templates are shown as templates only. Proprietary style-file parsing is not claimed in V1.</p>
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
              <p>Planned library category. V1 does not ship sampled instruments.</p>
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

function Promo() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Promo <StatusBadge status="available" /></p>
        <h1>Marketing Message</h1>
        <p className="lead">Sing. Create. Arrange. UAOS presents a local V1 foundation for audio analysis, MIDI monitoring, arranging, and sessions.</p>
      </section>
    </main>
  );
}

function Pricing() {
  return <main className="page"><section className="panel"><h1>Pricing</h1><div className="cards">{plans.map((plan) => <article className="card" key={plan.id}><StatusBadge status={plan.status} /><h2>{plan.name}</h2><p>{plan.price}</p></article>)}</div></section></main>;
}

function Downloads() {
  return <main className="page"><section className="panel"><p className="eyebrow">Downloads <StatusBadge status="desktop only" /></p><h1>Downloads</h1><p className="lead">Web V1 can be built locally. Desktop scripts are prepared for smoke checks; final signed installers are outside V1 automation.</p></section></main>;
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
    if (page === "promo") return <Promo />;
    if (page === "pricing") return <Pricing />;
    if (page === "downloads") return <Downloads />;
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
      <footer>UAOS V1 - local build, no deploy automation</footer>
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
