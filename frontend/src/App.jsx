import { useMemo, useState } from "react";
import "./style.css";

const productStatus = [
  ["Demo/Presentation", "100%", "ready"],
  ["Isolated Send Packs", "100%", "ready"],
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
  "Select isolated ZIP",
  "Review send folder",
  "Keep writer blocked"
];

const packs = [
  ["Tester Isolated ZIP", "Testing-only package", "Ready"],
  ["Official Review ZIP", "Formal project package", "Ready"],
  ["Private Support ZIP", "Simple support package", "Ready"]
];

const safetyGates = [
  "No device writer enabled",
  "No real keyboard output",
  "No commercial-final claim",
  "Final Writer requires real device testing",
  "Safety gates unchanged"
];

const commandItems = [
  ["Start Demo", "Begin the owner review walkthrough"],
  ["Open Pixi", "Assistant demo and guided explanation"],
  ["What To Send", "Review the isolated send choices"],
  ["Export Summary", "Read the current package summary"],
  ["Generate", "Create a demo-ready project result"],
  ["Save", "Keep current local session state"],
  ["Export", "Prepare demo/support files"],
  ["Presentation Mode", "Use this screen for private walkthroughs"]
];

export default function App() {
  const [sessionReady, setSessionReady] = useState(true);
  const [selectedPack, setSelectedPack] = useState("Official Review ZIP");
  const [pixiOpen, setPixiOpen] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [completed, setCompleted] = useState(["Open Pixi", "Keep writer blocked"]);
  const [demoStarted, setDemoStarted] = useState(false);

  const completedCount = completed.length;
  const selectedPackInfo = packs.find(([name]) => name === selectedPack);

  const manifestPreview = useMemo(() => ({
    phase: "UAOS CONTINUOUS PRODUCT COMPLETION LOOP V1 - PHASE A",
    displayFinish: "100%",
    supportReady: true,
    selectedPack,
    sessionReady,
    demoStarted,
    realDeviceWriter: "BLOCKED",
    commercialRelease: "NOT CLAIMED"
  }), [selectedPack, sessionReady, demoStarted]);

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
          <span className="topbarTitle">Owner Review Console</span>
        </div>
        <div className="topbarStatus">
          <span className="statusDot readyDot" />
          <span>Owner Review Polish</span>
          <span className="statusDot blockDot" />
          <span>Writer Blocked</span>
        </div>
      </nav>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">UAOS CONTINUOUS PRODUCT COMPLETION LOOP V1</p>
          <h1>Final owner review, clean send flow, and safety truth.</h1>
          <p className="lead">
            UAOS is organized for owner review, local demo presentation, isolated
            package selection, and honest safety status. Real writer remains
            blocked until real hardware testing.
          </p>
          <div className="heroActions">
            <button onClick={() => setDemoStarted(true)}>Start Demo</button>
            <button onClick={() => setPixiOpen(true)}>Open Pixi</button>
            <a href="#send-ready">What To Send</a>
            <a href="#export-summary">Export Summary</a>
            <button onClick={() => setPresentationMode(!presentationMode)}>
              {presentationMode ? "Exit Presentation" : "Presentation Mode"}
            </button>
          </div>
        </div>

        <div className="readinessPanel">
          <div className="scoreBlock">
            <span>Manager Ready</span>
            <strong>90%</strong>
            <small>V8.1 manager readiness is visible and support-ready.</small>
          </div>
          <div className={demoStarted ? "sessionCard okState" : "sessionCard waitState"}>
            {demoStarted ? "Demo walkthrough started." : "Press Start Demo when ready."}
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
              <button
                className="commandButton"
                key={title}
                onClick={() => {
                  if (title === "Open Pixi") setPixiOpen(true);
                  if (title === "Start Demo") setDemoStarted(true);
                }}
              >
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
                <span>Start the demo, choose the isolated package, and keep the final writer blocked.</span>
              </div>
            </>
          )}
        </article>
      </section>

      <section className="sendReady" id="send-ready">
        <div className="sectionHead">
          <p className="eyebrow">What To Send</p>
          <h2>Choose one isolated package</h2>
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

      <section className="manifestPanel" id="export-summary">
        <div className="sectionHead">
          <p className="eyebrow">Export Summary</p>
          <h2>Owner truth state</h2>
        </div>
        <pre>{JSON.stringify(manifestPreview, null, 2)}</pre>
      </section>
    </main>
  );
}
