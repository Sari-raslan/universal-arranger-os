import { useMemo, useState } from "react";
import "./style.css";

const productStatus = [
  ["Demo/Presentation", "100%", "ready"],
  ["Support Packs", "100%", "ready"],
  ["Pixi Assistant Demo", "100%", "ready"],
  ["Command Center", "100%", "ready"],
  ["Send Ready Selector", "100%", "ready"],
  ["Real Device Writer", "BLOCKED", "blocked"],
  ["Commercial Release", "NOT CLAIMED", "neutral"]
];

const checklist = [
  "Open Pixi",
  "Generate",
  "Save",
  "Export",
  "Send Friend ZIP",
  "Send Jobcenter ZIP",
  "Keep writer blocked"
];

const packs = [
  ["Friend Pack", "Private demo ZIP", "Ready to send"],
  ["Jobcenter Pack", "Support review ZIP", "Ready to send"],
  ["Master Review Pack", "Reviewer/investor overview", "Ready to send"]
];

const safetyGates = [
  "No device writer enabled",
  "No real keyboard output",
  "No commercial-final claim",
  "Final Writer requires real device testing",
  "Safety gates unchanged"
];

const commandItems = [
  ["Open Pixi", "Assistant demo and guided explanation"],
  ["Generate", "Create a demo-ready project result"],
  ["Save", "Keep current local session state"],
  ["Export", "Prepare demo/support files"],
  ["What to send now", "Choose Friend, Jobcenter, or Master review pack"],
  ["Presentation Mode", "Use this screen for private walkthroughs"]
];

export default function App() {
  const [sessionReady, setSessionReady] = useState(true);
  const [selectedPack, setSelectedPack] = useState("Jobcenter Pack");
  const [pixiOpen, setPixiOpen] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [completed, setCompleted] = useState(["Open Pixi", "Keep writer blocked"]);

  const completedCount = completed.length;
  const selectedPackInfo = packs.find(([name]) => name === selectedPack);

  const manifestPreview = useMemo(() => ({
    phase: "UAOS FINAL PRODUCT FINISH 100 DISPLAY V1",
    displayFinish: "100%",
    supportReady: true,
    selectedPack,
    sessionReady,
    realDeviceWriter: "BLOCKED",
    commercialRelease: "NOT CLAIMED"
  }), [selectedPack, sessionReady]);

  function toggleChecklist(item) {
    setCompleted(current =>
      current.includes(item)
        ? current.filter(entry => entry !== item)
        : [...current, item]
    );
  }

  return (
    <main className={presentationMode ? "uaos presentation" : "uaos"}>
      <nav className="topbar">
        <div>
          <span className="brandMark">UAOS</span>
          <span className="topbarTitle">Universal Arranger OS</span>
        </div>
        <div className="topbarStatus">
          <span className="statusDot readyDot" />
          <span>Display Finish V1</span>
          <span className="statusDot blockDot" />
          <span>Writer Blocked</span>
        </div>
      </nav>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">UAOS FINAL PRODUCT FINISH 100 DISPLAY V1</p>
          <h1>Ready for private demo, support review, and presentation.</h1>
          <p className="lead">
            UAOS is 100% ready for private demo, support review, and presentation.
            Real writer remains blocked until real hardware testing.
          </p>
          <div className="heroActions">
            <button onClick={() => setPixiOpen(true)}>Open Pixi</button>
            <button onClick={() => setPresentationMode(!presentationMode)}>
              {presentationMode ? "Exit Presentation" : "Presentation Mode"}
            </button>
            <a href="#send-ready">What to send now</a>
          </div>
        </div>

        <div className="readinessPanel">
          <div className="scoreBlock">
            <span>Manager Ready</span>
            <strong>90%</strong>
            <small>V8.1 manager readiness is visible and support-ready.</small>
          </div>
          <label className="sessionSwitch">
            <input
              type="checkbox"
              checked={sessionReady}
              onChange={() => setSessionReady(!sessionReady)}
            />
            <span>Session Ready</span>
          </label>
          <div className={sessionReady ? "sessionCard okState" : "sessionCard waitState"}>
            {sessionReady ? "Demo session is ready to show." : "Session needs owner review."}
          </div>
        </div>
      </section>

      <section className="statusDashboard" aria-label="Final Product Status">
        <div className="sectionHead">
          <p className="eyebrow">Final Product Status</p>
          <h2>Display and support readiness</h2>
        </div>
        <div className="statusGrid">
          {productStatus.map(([label, value, type]) => (
            <article className={`statusCard ${type}`} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace">
        <article className="commandCenter">
          <div className="sectionHead">
            <p className="eyebrow">Command Center</p>
            <h2>Owner actions</h2>
          </div>
          <div className="commandGrid">
            {commandItems.map(([title, text]) => (
              <button className="commandButton" key={title} onClick={() => title === "Open Pixi" && setPixiOpen(true)}>
                <span>{title}</span>
                <small>{text}</small>
              </button>
            ))}
          </div>
        </article>

        <article className={pixiOpen ? "pixiPanel open" : "pixiPanel"}>
          <div className="pixiHeader">
            <div>
              <p className="eyebrow">Pixi Assistant</p>
              <h2>Demo guide</h2>
            </div>
            <button onClick={() => setPixiOpen(!pixiOpen)}>{pixiOpen ? "Close" : "Open"}</button>
          </div>
          {pixiOpen && (
            <>
              <p className="pixiText">
                Pixi is a local demo assistant for explaining UAOS workflows, packs,
                and readiness. Pixi is not claimed to be conscious or equivalent to ChatGPT.
              </p>
              <div className="pixiPrompt">
                <b>Current answer:</b>
                <span>Show the product, export the right pack, and keep the final writer blocked.</span>
              </div>
            </>
          )}
        </article>
      </section>

      <section className="sendReady" id="send-ready">
        <div className="sectionHead">
          <p className="eyebrow">Send Ready Selector</p>
          <h2>Choose the next review pack</h2>
        </div>
        <div className="packGrid">
          {packs.map(([name, desc, state]) => (
            <button
              className={selectedPack === name ? "packCard selectedPack" : "packCard"}
              key={name}
              onClick={() => setSelectedPack(name)}
            >
              <span>{name}</span>
              <small>{desc}</small>
              <b>{state}</b>
            </button>
          ))}
        </div>
        <div className="sendSummary">
          <b>Selected:</b> {selectedPackInfo?.[0]} - {selectedPackInfo?.[1]}
        </div>
      </section>

      <section className="reviewArea">
        <article>
          <div className="sectionHead">
            <p className="eyebrow">Final Action Checklist</p>
            <h2>{completedCount}/{checklist.length} checked</h2>
          </div>
          <div className="checklist">
            {checklist.map(item => (
              <label key={item} className="checkRow">
                <input
                  type="checkbox"
                  checked={completed.includes(item)}
                  onChange={() => toggleChecklist(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </article>

        <article className="blockedPanel">
          <div className="sectionHead">
            <p className="eyebrow">What is still blocked</p>
            <h2>Final writer gate</h2>
          </div>
          <p>
            Final Writer requires real device testing. No KORG, Yamaha, Roland,
            or Ketron real writer is claimed or enabled in this display finish.
          </p>
          <ul>
            {safetyGates.map(item => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </section>

      <section className="manifestPanel">
        <div className="sectionHead">
          <p className="eyebrow">Final manifest snapshot</p>
          <h2>Support-ready truth state</h2>
        </div>
        <pre>{JSON.stringify(manifestPreview, null, 2)}</pre>
      </section>
    </main>
  );
}
