import { useMemo } from "react";
import "./modern-home.css";

const homeAreas = [
  { id: "create", title: "Create", subtitle: "Sing, record and compose", icon: "*", accent: "violet",
    tools: [["sing","Sing"],["studio","Studio"],["audio","Audio"],["sampler","Sampler"],["ai","AI Music"]] },
  { id: "perform", title: "Perform", subtitle: "Play with MIDI and arranger tools", icon: ">", accent: "cyan",
    tools: [["midi","MIDI"],["hardware","Hardware"],["arranger","Arranger"],["pro","Pro Arranger"],["live","Live"]] },
  { id: "library", title: "Library", subtitle: "Sounds, instruments and presets", icon: "~", accent: "emerald",
    tools: [["sounds","Sound Library"],["sampler","Sampler Presets"]] },
  { id: "projects", title: "Projects", subtitle: "Sessions, timeline and studio", icon: "[]", accent: "amber",
    tools: [["sessions","Projects / Sessions"],["timeline","Timeline"],["studio","Studio"]] }
];

const quickTools = [
  ["diagnostics","Diagnostics"],["downloads","Downloads"],["support","Support"],
  ["account","Account"],["status","Release Status"]
];

const continueLabels = Object.fromEntries(
  [...homeAreas.flatMap((area) => area.tools), ...quickTools, ...homeAreas.map((area) => [area.id, area.title])]
);

function ToolButton({ route, label, onOpen }) {
  return <button type="button" className="mh-tool" onClick={() => onOpen?.(route)}>{label}</button>;
}

export function ModernHome({ continueRoute = "", onOpen }) {
  const continueLabel = useMemo(() => continueLabels[continueRoute] || "", [continueRoute]);

  return (
    <main className="mh-shell">
      <div className="mh-ambient mh-ambient-one" aria-hidden="true" />
      <div className="mh-ambient mh-ambient-two" aria-hidden="true" />

      <section className="mh-hero" aria-labelledby="mh-title">
        <div className="mh-hero-copy">
          <span className="mh-kicker">UNIVERSAL ARRANGER OS</span>
          <h1 id="mh-title">Make music.<span>Your way.</span></h1>
          <p>Open a complete workspace or jump directly to every real UAOS tool. Audio, MIDI, sampler, arranger, sessions, and hardware stay local-first.</p>
          <button type="button" className="mh-continue" onClick={() => onOpen?.(continueLabel ? continueRoute : "studio")}>
            <span className="mh-continue-dot" />
            {continueLabel ? `Continue with ${continueLabel}` : "Open Studio"}
            <span className="mh-arrow" aria-hidden="true">{"->"}</span>
          </button>
        </div>

        <div className="mh-visual" aria-hidden="true">
          <div className="mh-orbit mh-orbit-one" />
          <div className="mh-orbit mh-orbit-two" />
          <div className="mh-core"><span>UAOS</span></div>
          <div className="mh-wave mh-wave-one" />
          <div className="mh-wave mh-wave-two" />
          <div className="mh-wave mh-wave-three" />
        </div>
      </section>

      <section className="mh-grid" aria-label="UAOS workspaces and tools">
        {homeAreas.map((area, index) => (
          <article key={area.id} className={`mh-card mh-${area.accent}`} style={{ "--mh-delay": `${index * 80}ms` }}>
            <div className="mh-card-glow" />
            <div className="mh-card-top">
              <span className="mh-icon" aria-hidden="true">{area.icon}</span>
              <button type="button" className="mh-open" onClick={() => onOpen?.(area.id)}>Open workspace {"->"}</button>
            </div>
            <div className="mh-card-copy"><h2>{area.title}</h2><p>{area.subtitle}</p></div>
            <div className="mh-tags" aria-label={`${area.title} tools`}>
              {area.tools.map(([route, label]) => <ToolButton key={`${area.id}-${route}`} route={route} label={label} onOpen={onOpen} />)}
            </div>
          </article>
        ))}
      </section>

      <section className="mh-quick-tools" aria-label="Quick access">
        <div><span className="mh-kicker">QUICK ACCESS</span><h2>Open every important UAOS area directly</h2></div>
        <div className="mh-quick-grid">
          {quickTools.map(([route, label]) => <ToolButton key={route} route={route} label={label} onOpen={onOpen} />)}
        </div>
      </section>

      <section className="mh-footer-strip" aria-label="Home highlights">
        <div><strong>Local-first</strong><span>Your projects stay on your device.</span></div>
        <div><strong>Real workspaces</strong><span>Studio, Audio, MIDI, Sampler, and Arranger.</span></div>
        <div><strong>Backend ready</strong><span>Local runtime uses port 5199.</span></div>
      </section>
    </main>
  );
}
