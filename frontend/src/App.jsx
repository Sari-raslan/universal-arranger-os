import { useMemo, useState } from "react";
import "./style.css";
import songStylePresets from "./data/uaos-song-style-presets.json";
import sectionBlueprints from "./data/uaos-section-blueprints.json";
import drumPatternBlueprints from "./data/uaos-drum-pattern-blueprints.json";
import bassPatternBlueprints from "./data/uaos-bass-pattern-blueprints.json";
import chordPatternBlueprints from "./data/uaos-chord-pattern-blueprints.json";
import maqamKeyBlueprints from "./data/uaos-maqam-key-blueprints.json";

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

const arrangerTracks = [
  "Drums",
  "Percussion",
  "Bass",
  "Chords",
  "Pad",
  "Strings",
  "Lead / Melody Guide",
  "FX / Hits"
];

const styleVariations = [
  ["Variation A", "quiet"],
  ["Variation B", "medium"],
  ["Variation C", "strong"],
  ["Variation D", "full"],
  ["Fill Up", "increase energy"],
  ["Fill Down", "reduce energy"],
  ["Break", "short stop"],
  ["Ending", "final cadence"]
];

const defaultSongRequest = {
  title: "Oriental Pop Song",
  reference: "",
  tempo: "",
  key: "",
  mood: "",
  style: "Oriental"
};

const commandItems = [
  ["Start Demo", "Begin the owner review walkthrough"],
  ["Open Pixi", "Assistant demo and guided explanation"],
  ["What To Send", "Review the isolated send choices"],
  ["Export Summary", "Read the current package summary"],
  ["Export Tester Feedback", "Prepare a local test feedback summary"],
  ["Load Demo Template", "Load a safe local arrangement template"],
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
  const [testerFeedbackExported, setTesterFeedbackExported] = useState(false);
  const [loadedTemplate, setLoadedTemplate] = useState("None");
  const [songRequest, setSongRequest] = useState(defaultSongRequest);
  const [arrangerProject, setArrangerProject] = useState(() => buildArrangerProject(defaultSongRequest));
  const [sequencerOpen, setSequencerOpen] = useState(true);

  const completedCount = completed.length;
  const selectedPackInfo = packs.find(([name]) => name === selectedPack);

  const manifestPreview = useMemo(() => ({
    phase: "UAOS CONTINUOUS PRODUCT COMPLETION LOOP V1 - PHASE A",
    displayFinish: "100%",
    supportReady: true,
    selectedPack,
    sessionReady,
    demoStarted,
    testerFeedbackExported,
    loadedTemplate,
    realDeviceWriter: "BLOCKED",
    commercialRelease: "NOT CLAIMED"
  }), [selectedPack, sessionReady, demoStarted, testerFeedbackExported, loadedTemplate]);

  function toggleChecklist(item) {
    setCompleted(current =>
      current.includes(item)
        ? current.filter(entry => entry !== item)
        : [...current, item]
    );
  }

  function updateSongRequest(field, value) {
    setSongRequest(current => ({ ...current, [field]: value }));
  }

  function generateArrangerProject() {
    setArrangerProject(buildArrangerProject(songRequest));
    setSequencerOpen(true);
  }

  function exportDemoProject() {
    downloadText(
      `${slugify(arrangerProject.analysis.title)}-uaos-arranger-project.json`,
      JSON.stringify(arrangerProject, null, 2),
      "application/json"
    );
  }

  function exportSequencerPreview() {
    downloadText(
      `${slugify(arrangerProject.analysis.title)}-sequencer-preview.html`,
      buildSequencerHtml(arrangerProject),
      "text/html"
    );
  }

  function exportMarkdownSummary() {
    downloadText(
      `${slugify(arrangerProject.analysis.title)}-arranger-summary.md`,
      buildMarkdownSummary(arrangerProject),
      "text/markdown"
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
                  if (title === "Export Tester Feedback") setTesterFeedbackExported(true);
                  if (title === "Load Demo Template") setLoadedTemplate("Oriental Pop Template");
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
                The Pixi Knowledge Pack is prepared for safe owner guidance.
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

      <section className="testerTools">
        <div className="sectionHead">
          <p className="eyebrow">Tester Experience Tools</p>
          <h2>Local feedback export</h2>
        </div>
        <div className="testerToolGrid">
          <article>
            <span>Checklist</span>
            <b>tester-checklist.json</b>
          </article>
          <article>
            <span>Feedback Form</span>
            <b>tester-feedback-form.md</b>
          </article>
          <article>
            <span>Bug Template</span>
            <b>tester-bug-template.md</b>
          </article>
          <article>
            <span>Session Report</span>
            <b>tester-session-report.html</b>
          </article>
        </div>
        <button className="wideAction" onClick={() => setTesterFeedbackExported(true)}>
          Export Tester Feedback
        </button>
        <p className={testerFeedbackExported ? "toolState readyText" : "toolState"}>
          {testerFeedbackExported
            ? "Tester feedback summary prepared for local review."
            : "Tester feedback tools are ready for local review."}
        </p>
        <button className="wideAction secondaryAction" onClick={() => setLoadedTemplate("Singer To Style Template")}>
          Load Demo Template
        </button>
        <p className="toolState">Loaded template: {loadedTemplate}</p>
      </section>

      <section className="songArranger" id="song-to-arranger">
        <div className="sectionHead">
          <p className="eyebrow">Song To Arranger</p>
          <h2>Generate an internal arranger sequencer project</h2>
        </div>

        <div className="songForm">
          <label>
            <span>Song name</span>
            <input
              value={songRequest.title}
              onChange={event => updateSongRequest("title", event.target.value)}
              placeholder="Write a song name or idea"
            />
          </label>
          <label>
            <span>Reference style</span>
            <input
              value={songRequest.reference}
              onChange={event => updateSongRequest("reference", event.target.value)}
              placeholder="Optional artist or style reference"
            />
          </label>
          <label>
            <span>Tempo</span>
            <input
              value={songRequest.tempo}
              onChange={event => updateSongRequest("tempo", event.target.value)}
              placeholder="Optional BPM"
              inputMode="numeric"
            />
          </label>
          <label>
            <span>Key / Maqam</span>
            <input
              value={songRequest.key}
              onChange={event => updateSongRequest("key", event.target.value)}
              placeholder="Optional key or maqam"
            />
          </label>
          <label>
            <span>Mood</span>
            <input
              value={songRequest.mood}
              onChange={event => updateSongRequest("mood", event.target.value)}
              placeholder="Optional mood"
            />
          </label>
          <label>
            <span>Target style</span>
            <select value={songRequest.style} onChange={event => updateSongRequest("style", event.target.value)}>
              {Object.keys(songStylePresets.styles).map(style => <option key={style}>{style}</option>)}
            </select>
          </label>
        </div>

        <div className="arrangerActions">
          <button onClick={generateArrangerProject}>Generate Arranger Project</button>
          <button onClick={() => setSequencerOpen(!sequencerOpen)}>Open Sequencer Grid</button>
          <button onClick={exportDemoProject}>Export Demo Project</button>
          <button onClick={exportSequencerPreview}>Export HTML Preview</button>
          <button onClick={exportMarkdownSummary}>Export Markdown Summary</button>
        </div>

        <p className="safetyNote">
          This creates an internal UAOS arranger project and demo JSON/HTML/Markdown only.
          Real keyboard writer remains blocked.
        </p>

        <div className="analysisCard">
          <div>
            <span>Song title</span>
            <b>{arrangerProject.analysis.title}</b>
          </div>
          <div>
            <span>Inferred style</span>
            <b>{arrangerProject.analysis.genre}</b>
          </div>
          <div>
            <span>Tempo</span>
            <b>{arrangerProject.analysis.tempo} BPM</b>
          </div>
          <div>
            <span>Key / Maqam</span>
            <b>{arrangerProject.analysis.key}</b>
          </div>
          <div>
            <span>Mood</span>
            <b>{arrangerProject.analysis.mood}</b>
          </div>
          <div>
            <span>Arrangement plan</span>
            <b>{arrangerProject.analysis.plan}</b>
          </div>
        </div>

        <div className="arrangerPanels">
          <article>
            <h3>Arranger Sections</h3>
            <div className="sectionList">
              {arrangerProject.sections.map(section => (
                <span key={section.name}>{section.name} · {section.bars} bars</span>
              ))}
            </div>
          </article>
          <article>
            <h3>Tracks</h3>
            <div className="sectionList">
              {arrangerProject.tracks.map(track => <span key={track.name}>{track.name} · {track.role}</span>)}
            </div>
          </article>
          <article>
            <h3>Style Variations</h3>
            <div className="sectionList">
              {arrangerProject.variations.map(variation => <span key={variation.name}>{variation.name} · {variation.energy}</span>)}
            </div>
          </article>
        </div>

        {sequencerOpen && (
          <div className="sequencerGridWrap">
            <h3>Sequencer Grid</h3>
            <div className="sequencerGrid">
              <div className="gridHeader">Bar</div>
              <div className="gridHeader">Section</div>
              <div className="gridHeader">Chord</div>
              <div className="gridHeader">Drums</div>
              <div className="gridHeader">Bass</div>
              <div className="gridHeader">Comp</div>
              <div className="gridHeader">Pad</div>
              <div className="gridHeader">Melody</div>
              <div className="gridHeader">Energy</div>
              <div className="gridHeader">Fill</div>
              <div className="gridHeader">Variation</div>
              {arrangerProject.grid.map(row => (
                <FragmentRow row={row} key={`${row.bar}-${row.section}`} />
              ))}
            </div>
          </div>
        )}

        <div className="playbackPlan">
          <h3>Demo Playback Plan</h3>
          <div className="timelineList">
            {arrangerProject.playbackPlan.timeline.map(item => (
              <span key={`${item.bar}-${item.event}`}>
                Bar {item.bar}: {item.event} · {item.bpm} BPM · {item.trackEvents.join(", ")}
              </span>
            ))}
          </div>
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

function FragmentRow({ row }) {
  return (
    <>
      <div>{row.bar}</div>
      <div>{row.section}</div>
      <div>{row.chord}</div>
      <div>{row.drumsPattern}</div>
      <div>{row.bassPattern}</div>
      <div>{row.chordCompPattern}</div>
      <div>{row.padPattern}</div>
      <div>{row.melodyGuide}</div>
      <div>{row.energyLevel}</div>
      <div>{row.fillTrigger}</div>
      <div>{row.variation}</div>
    </>
  );
}

function buildArrangerProject(request) {
  const selectedStyle = request.style && songStylePresets.styles[request.style]
    ? request.style
    : songStylePresets.defaultStyle;
  const preset = songStylePresets.styles[selectedStyle];
  const title = request.title.trim() || "Untitled UAOS Song Idea";
  const tempo = clampTempo(Number.parseInt(request.tempo, 10) || preset.tempo);
  const key = request.key.trim() || preset.key;
  const mood = request.mood.trim() || preset.mood;
  const chordPattern = chordPatternBlueprints.patterns[preset.chords] || chordPatternBlueprints.patterns["maqam-inspired"];
  const bassPattern = bassPatternBlueprints.patterns[preset.bass] || bassPatternBlueprints.patterns["root-pulse"];
  const drumsPattern = drumPatternBlueprints.patterns[preset.drums] || drumPatternBlueprints.patterns["basic-4-4"];
  const maqamName = preset.maqamSuggestions?.[0] || key.split(" ")[0] || "Nahawand";
  const maqam = maqamKeyBlueprints.keys[maqamName] || maqamKeyBlueprints.keys.Nahawand;

  let bar = 1;
  const sections = sectionBlueprints.sections.map((name, index) => {
    const bars = sectionBlueprints.barLengths[name] || 4;
    const section = {
      name,
      bars,
      startBar: bar,
      endBar: bar + bars - 1,
      role: inferSectionRole(name, index)
    };
    bar += bars;
    return section;
  });

  const grid = sections.flatMap((section, sectionIndex) => {
    return Array.from({ length: section.bars }, (_, offset) => {
      const chord = chordPattern[(sectionIndex + offset) % chordPattern.length];
      const energyLevel = getEnergy(section.name, sectionIndex);
      return {
        bar: section.startBar + offset,
        section: section.name,
        chord,
        drumsPattern: drumsPattern[offset % drumsPattern.length],
        bassPattern: bassPattern[offset % bassPattern.length],
        chordCompPattern: preset.chords,
        padPattern: preset.pad,
        melodyGuide: buildMelodyGuide(section.name, maqamName, offset),
        energyLevel,
        fillTrigger: getFillTrigger(section.name, offset, section.bars),
        variation: getVariation(energyLevel)
      };
    });
  });

  const tracks = arrangerTracks.map((name, index) => ({
    name,
    role: getTrackRole(name),
    events: grid.slice(0, 8).map(row => ({
      bar: row.bar,
      note: getTrackNote(name, row.chord, index),
      velocity: Math.min(112, 62 + row.energyLevel * 10)
    }))
  }));

  const playbackPlan = {
    bpm: tempo,
    totalBars: grid.length,
    timeline: sections.map(section => ({
      bar: section.startBar,
      event: `${section.name} starts`,
      bpm: tempo,
      trackEvents: ["drums", "bass", "chords", "melody guide"],
      chordEvents: grid.filter(row => row.bar >= section.startBar && row.bar <= section.endBar).slice(0, 4).map(row => row.chord),
      transition: section.name.includes("Fill") ? "fill trigger" : "section transition"
    })),
    noteEvents: tracks.flatMap(track => track.events.slice(0, 4).map(event => ({
      track: track.name,
      bar: event.bar,
      note: event.note,
      velocity: event.velocity
    }))),
    drumHits: grid.slice(0, 12).map(row => ({ bar: row.bar, hit: row.drumsPattern }))
  };

  return {
    version: "UAOS SONG TO ARRANGER SEQUENCER MVP V1",
    generatedAt: new Date().toISOString(),
    input: { ...request, title },
    analysis: {
      title,
      referenceStyle: request.reference.trim() || "UAOS internal style inference",
      genre: preset.genre,
      tempo,
      key,
      mood,
      maqam,
      plan: `Build ${preset.genre} arrangement with ${sections.length} sections, ${grid.length} bars, ${tracks.length} tracks, safe demo exports only.`
    },
    sections,
    tracks,
    variations: styleVariations.map(([name, energy]) => ({ name, energy })),
    grid,
    playbackPlan,
    exports: {
      json: true,
      htmlPreview: true,
      markdownSummary: true,
      demoMidi: false
    },
    safety: {
      internalProjectOnly: true,
      realDeviceWriter: "BLOCKED",
      realKeyboardOutput: "BLOCKED",
      forbiddenWriterFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
      copyrightedMelodyCopied: false
    }
  };
}

function inferSectionRole(name, index) {
  if (name.startsWith("Intro")) return index === 0 ? "melodic opening" : index === 1 ? "rhythmic setup" : "full band entry";
  if (name.startsWith("Verse")) return "story and groove";
  if (name === "Chorus") return "main hook";
  if (name === "Bridge") return "contrast";
  if (name.startsWith("Fill")) return "transition";
  if (name === "Break") return "stop and reset";
  return "ending cadence";
}

function getEnergy(sectionName, index) {
  if (sectionName.includes("Intro 1") || sectionName.includes("Verse A")) return 1;
  if (sectionName.includes("Intro 2") || sectionName.includes("Verse B") || sectionName.includes("Bridge")) return 2;
  if (sectionName.includes("Intro 3") || sectionName.includes("Chorus") || sectionName.includes("Fill")) return 3;
  if (sectionName.includes("Break")) return 2;
  if (sectionName.includes("Ending 3")) return 4;
  return Math.min(4, Math.max(1, (index % 4) + 1));
}

function getVariation(energy) {
  return ["Variation A", "Variation B", "Variation C", "Variation D"][Math.max(0, Math.min(3, energy - 1))];
}

function getFillTrigger(sectionName, offset, bars) {
  if (sectionName.startsWith("Fill")) return sectionName;
  if (offset === bars - 1 && !sectionName.startsWith("Ending")) return "Fill Up";
  if (sectionName === "Break") return "Break";
  return "none";
}

function buildMelodyGuide(sectionName, maqamName, offset) {
  if (sectionName.includes("Chorus")) return `${maqamName} rising hook ${offset + 1}`;
  if (sectionName.includes("Intro")) return `${maqamName} motif ${offset + 1}`;
  if (sectionName.includes("Ending")) return `${maqamName} cadence ${offset + 1}`;
  return `${maqamName} guide phrase ${offset + 1}`;
}

function getTrackRole(name) {
  const roles = {
    Drums: "main pulse",
    Percussion: "ornament and groove detail",
    Bass: "root motion",
    Chords: "harmonic comping",
    Pad: "sustained color",
    Strings: "build and response",
    "Lead / Melody Guide": "safe internal melody guide",
    "FX / Hits": "section markers"
  };
  return roles[name] || "arrangement support";
}

function getTrackNote(name, chord, index) {
  if (name === "Drums") return "drum-hit";
  if (name === "Percussion") return "perc-hit";
  if (name === "Bass") return `${chord}-root`;
  if (name === "Chords") return `${chord}-comp`;
  if (name === "Pad") return `${chord}-pad`;
  if (name === "Strings") return `${chord}-string-line`;
  if (name === "Lead / Melody Guide") return `guide-${index + 1}`;
  return "hit";
}

function clampTempo(value) {
  return Math.max(56, Math.min(156, value));
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "uaos-song";
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildSequencerHtml(project) {
  const rows = project.grid.map(row => `
    <tr>
      <td>${row.bar}</td><td>${row.section}</td><td>${row.chord}</td><td>${row.drumsPattern}</td>
      <td>${row.bassPattern}</td><td>${row.chordCompPattern}</td><td>${row.padPattern}</td>
      <td>${row.melodyGuide}</td><td>${row.energyLevel}</td><td>${row.fillTrigger}</td><td>${row.variation}</td>
    </tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${project.analysis.title} - UAOS Sequencer</title><style>body{font-family:Arial;background:#101827;color:#f8fafc;padding:24px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #334155;padding:8px}th{background:#172033}.safe{color:#86efac;font-weight:bold}</style></head><body><h1>${project.analysis.title}</h1><p class="safe">Internal UAOS demo project only. Real keyboard writer remains blocked.</p><table><thead><tr><th>Bar</th><th>Section</th><th>Chord</th><th>Drums</th><th>Bass</th><th>Comp</th><th>Pad</th><th>Melody</th><th>Energy</th><th>Fill</th><th>Variation</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function buildMarkdownSummary(project) {
  return `# ${project.analysis.title} - UAOS Arranger Summary

Style: ${project.analysis.genre}
Tempo: ${project.analysis.tempo} BPM
Key/Maqam: ${project.analysis.key}
Mood: ${project.analysis.mood}

## Arrangement Plan

${project.analysis.plan}

## Sections

${project.sections.map(section => `- ${section.name}: bars ${section.startBar}-${section.endBar}, ${section.role}`).join("\n")}

## Safety

- Internal UAOS demo project only.
- Real keyboard writer remains blocked.
- No real keyboard output.
- No .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST output.
`;
}
