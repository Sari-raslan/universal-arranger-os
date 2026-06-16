import { useMemo } from "react";
import "./modern-home.css";

const homeAreas = [
  {
    id: "create",
    title: "Create",
    subtitle: "Sing, record and compose",
    icon: "*",
    accent: "violet",
    features: ["Sing", "Studio", "Audio", "Sampler", "AI Music"]
  },
  {
    id: "perform",
    title: "Perform",
    subtitle: "Play with MIDI and arranger tools",
    icon: ">",
    accent: "cyan",
    features: ["MIDI", "Hardware", "Arranger", "Pro Arranger"]
  },
  {
    id: "library",
    title: "Library",
    subtitle: "Sounds, instruments and presets",
    icon: "~",
    accent: "emerald",
    features: ["Sound Library", "Sampler Presets"]
  },
  {
    id: "projects",
    title: "Projects",
    subtitle: "Sessions, timeline and studio",
    icon: "[]",
    accent: "amber",
    features: ["Projects", "Sessions", "Timeline", "Studio"]
  }
];

const continueLabels = {
  create: "Create",
  perform: "Perform",
  library: "Library",
  projects: "Projects",
  sing: "Sing",
  studio: "Studio",
  audio: "Audio",
  sampler: "Sampler",
  ai: "AI Music",
  midi: "MIDI",
  hardware: "Hardware",
  arranger: "Arranger",
  pro: "Pro Arranger",
  sounds: "Sound Library",
  sessions: "Projects / Sessions",
  timeline: "Timeline"
};

function resolveContinueLabel(route) {
  return continueLabels[route] || "";
}

export function ModernHome({ continueRoute = "", onOpen }) {
  const continueLabel = useMemo(() => resolveContinueLabel(continueRoute), [continueRoute]);
  const hasContinue = Boolean(continueLabel && typeof onOpen === "function");

  return (
    <main className="mh-shell">
      <div className="mh-ambient mh-ambient-one" aria-hidden="true" />
      <div className="mh-ambient mh-ambient-two" aria-hidden="true" />

      <section className="mh-hero" aria-labelledby="mh-title">
        <div className="mh-hero-copy">
          <span className="mh-kicker">UNIVERSAL ARRANGER OS</span>

          <h1 id="mh-title">
            Make music.
            <span>Your way.</span>
          </h1>

          <p>
            Choose one area and UAOS will open only the tools you need.
            Everything stays local-first and the buttons below perform real navigation.
          </p>

          {hasContinue ? (
            <button
              type="button"
              className="mh-continue"
              onClick={() => onOpen(continueRoute)}
            >
              <span className="mh-continue-dot" />
                Continue with {continueLabel}
              <span className="mh-arrow" aria-hidden="true">
                {"->"}
              </span>
            </button>
          ) : (
            <div
              className="mh-continue mh-continue-disabled"
              aria-live="polite"
              aria-disabled="true"
              style={{ cursor: "default" }}
            >
              <span className="mh-continue-dot" />
              Continue becomes available after you open a section
            </div>
          )}
        </div>

        <div className="mh-visual" aria-hidden="true">
          <div className="mh-orbit mh-orbit-one" />
          <div className="mh-orbit mh-orbit-two" />
          <div className="mh-core">
            <span>UAOS</span>
          </div>
          <div className="mh-wave mh-wave-one" />
          <div className="mh-wave mh-wave-two" />
          <div className="mh-wave mh-wave-three" />
        </div>
      </section>

      <section className="mh-grid" aria-label="Main areas">
        {homeAreas.map((area, index) => (
          <button
            key={area.id}
            type="button"
            className={`mh-card mh-${area.accent}`}
            style={{ "--mh-delay": `${index * 80}ms` }}
            onClick={() => onOpen?.(area.id)}
          >
            <div className="mh-card-glow" />

            <div className="mh-card-top">
              <span className="mh-icon" aria-hidden="true">
                {area.icon}
              </span>
              <span className="mh-open">Open {"->"}</span>
            </div>

            <div className="mh-card-copy">
              <h2>{area.title}</h2>
              <p>{area.subtitle}</p>
            </div>

            <div className="mh-tags">
              {area.features.map((feature) => (
                <span key={feature}>{feature}</span>
              ))}
            </div>
          </button>
        ))}
      </section>

      <section className="mh-footer-strip" aria-label="Home highlights">
        <div>
          <strong>Local-first</strong>
          <span>Your projects stay on your device.</span>
        </div>

        <div>
          <strong>Fast workflow</strong>
          <span>Only the tools you choose are shown.</span>
        </div>

        <div>
          <strong>Built for musicians</strong>
          <span>Audio, MIDI, arranger and sampler.</span>
        </div>
      </section>
    </main>
  );
}
