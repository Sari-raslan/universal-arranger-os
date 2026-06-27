import { useMemo, useState } from "react";
import "./App.css";

const sectionTemplates = [
  { name: "Intro", bars: 4, energy: 32 },
  { name: "Verse", bars: 16, energy: 52 },
  { name: "Chorus", bars: 16, energy: 82 },
  { name: "Bridge", bars: 8, energy: 64 },
  { name: "Final", bars: 8, energy: 88 },
];

const instruments = [
  { name: "Studio Grand", family: "Keys", role: "Main harmony", color: "#f8fafc" },
  { name: "Warm Oud", family: "Strings", role: "Lead phrase", color: "#f7c873" },
  { name: "Arabic Violin", family: "Strings", role: "Counter melody", color: "#f4907a" },
  { name: "Deep Bass", family: "Bass", role: "Low groove", color: "#8bd3dd" },
  { name: "Live Drums", family: "Percussion", role: "Rhythm engine", color: "#9fe870" },
  { name: "Pad Air", family: "Synth", role: "Atmosphere", color: "#b6a7ff" },
];

const exportOptions = [
  ["MIDI", "Arrangement notes and track map"],
  ["Style", "Keyboard-style package preview"],
  ["Project", "Complete UAOS workspace"],
  ["All", "Everything in one safe bundle"],
];

const defaultProject = {
  title: "New Song Idea",
  artist: "Local session",
  style: "Modern Oriental Pop",
  key: "D minor",
  tempo: 96,
};

function buildArrangement(project, intensity) {
  return sectionTemplates.map((section, index) => ({
    ...section,
    energy: Math.min(100, section.energy + intensity + index * 2),
    chord: ["Dm", "Bb", "C", "A7", "Dm"][index],
  }));
}

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [project, setProject] = useState(defaultProject);
  const [intensity, setIntensity] = useState(12);
  const [selectedInstrument, setSelectedInstrument] = useState(instruments[1].name);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("Project ready.");

  const arrangement = useMemo(
    () => buildArrangement(project, intensity),
    [project, intensity],
  );

  const tracks = useMemo(
    () => [
      { name: "Drums", instrument: "Live Drums", level: 86 },
      { name: "Bass", instrument: "Deep Bass", level: 70 },
      { name: "Chords", instrument: "Studio Grand", level: 76 },
      { name: "Lead", instrument: selectedInstrument, level: 82 },
      { name: "Pad", instrument: "Pad Air", level: 58 },
    ],
    [selectedInstrument],
  );

  function updateProject(field, value) {
    setProject((current) => ({ ...current, [field]: value }));
  }

  function generateArrangement() {
    setMessage(`${project.title} arranged as ${project.style}.`);
    setActiveView("generator");
  }

  function exportProject(type) {
    const payload = {
      type,
      project,
      leadInstrument: selectedInstrument,
      sections: arrangement,
      tracks,
      createdBy: "UAOS Real App UI V1",
      hardwareWriter: "disabled",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `uaos-${type.toLowerCase()}-${project.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`${type} export prepared locally.`);
  }

  return (
    <main className="workstationShell">
      <aside className="sideRail" aria-label="UAOS sections">
        <button className="brandMark" onClick={() => setActiveView("dashboard")} type="button">
          UAOS
        </button>
        {[
          ["dashboard", "Dashboard"],
          ["project", "New Project"],
          ["generator", "Generator"],
          ["library", "Library"],
          ["player", "Player"],
          ["export", "Export"],
          ["help", "Help"],
        ].map(([id, label]) => (
          <button
            className={activeView === id ? "active" : ""}
            key={id}
            onClick={() => setActiveView(id)}
            type="button"
          >
            <span>{label.slice(0, 2).toUpperCase()}</span>
            {label}
          </button>
        ))}
      </aside>

      <section className="mainDesk">
        <header className="deskHeader">
          <div>
            <p className="kicker">Universal Arranger OS</p>
            <h1>{project.title}</h1>
            <span>{project.style} | {project.key} | {project.tempo} BPM</span>
          </div>
          <div className="sessionActions">
            <button className="softButton" onClick={() => setActiveView("project")} type="button">
              New
            </button>
            <button className="primaryButton" onClick={generateArrangement} type="button">
              Generate
            </button>
          </div>
        </header>

        <section className="statusBar" role="status">
          <span>{message}</span>
          <strong>Local workspace</strong>
          <strong>Writer off</strong>
        </section>

        <section className="contentGrid">
          <article className="projectPanel">
            <div className="panelTitle">
              <p className="kicker">Project</p>
              <h2>Session setup</h2>
            </div>
            <div className="formGrid">
              <label>
                Song title
                <input
                  value={project.title}
                  onChange={(event) => updateProject("title", event.target.value)}
                />
              </label>
              <label>
                Artist
                <input
                  value={project.artist}
                  onChange={(event) => updateProject("artist", event.target.value)}
                />
              </label>
              <label>
                Style
                <select
                  value={project.style}
                  onChange={(event) => updateProject("style", event.target.value)}
                >
                  <option>Modern Oriental Pop</option>
                  <option>Dance Arranger</option>
                  <option>Ballad Studio</option>
                  <option>Live Dabke</option>
                </select>
              </label>
              <label>
                Key
                <select
                  value={project.key}
                  onChange={(event) => updateProject("key", event.target.value)}
                >
                  <option>D minor</option>
                  <option>C minor</option>
                  <option>G minor</option>
                  <option>A minor</option>
                </select>
              </label>
              <label>
                Tempo
                <input
                  max="160"
                  min="60"
                  type="number"
                  value={project.tempo}
                  onChange={(event) => updateProject("tempo", Number(event.target.value))}
                />
              </label>
              <label>
                Arrangement power
                <input
                  max="28"
                  min="0"
                  type="range"
                  value={intensity}
                  onChange={(event) => setIntensity(Number(event.target.value))}
                />
              </label>
            </div>
          </article>

          <article className="arrangementPanel">
            <div className="panelTitle">
              <p className="kicker">Generator</p>
              <h2>Song sections</h2>
            </div>
            <div className="timeline">
              {arrangement.map((section) => (
                <button
                  className={activeView === "generator" ? "sectionBlock focus" : "sectionBlock"}
                  key={section.name}
                  onClick={() => {
                    setActiveView("generator");
                    setMessage(`${section.name} selected.`);
                  }}
                  type="button"
                >
                  <strong>{section.name}</strong>
                  <span>{section.bars} bars</span>
                  <i style={{ width: `${section.energy}%` }} />
                  <small>{section.chord}</small>
                </button>
              ))}
            </div>
          </article>

          <article className="libraryPanel">
            <div className="panelTitle">
              <p className="kicker">Library</p>
              <h2>Instruments</h2>
            </div>
            <div className="instrumentGrid">
              {instruments.map((instrument) => (
                <button
                  className={selectedInstrument === instrument.name ? "instrumentCard selected" : "instrumentCard"}
                  key={instrument.name}
                  onClick={() => {
                    setSelectedInstrument(instrument.name);
                    setActiveView("library");
                    setMessage(`${instrument.name} loaded.`);
                  }}
                  type="button"
                >
                  <i style={{ background: instrument.color }} />
                  <strong>{instrument.name}</strong>
                  <span>{instrument.family}</span>
                  <small>{instrument.role}</small>
                </button>
              ))}
            </div>
          </article>

          <article className="mixerPanel">
            <div className="panelTitle">
              <p className="kicker">Player</p>
              <h2>Transport and mix</h2>
            </div>
            <div className="transport">
              <button onClick={() => setPlaying((value) => !value)} type="button">
                {playing ? "Pause" : "Play"}
              </button>
              <button onClick={() => setMessage("Returned to start.")} type="button">
                Stop
              </button>
              <strong>{playing ? "Playing preview" : "Ready"}</strong>
            </div>
            <div className="trackList">
              {tracks.map((track) => (
                <div className="trackRow" key={track.name}>
                  <span>{track.name}</span>
                  <strong>{track.instrument}</strong>
                  <i><b style={{ width: `${track.level}%` }} /></i>
                </div>
              ))}
            </div>
          </article>

          <article className="exportPanel">
            <div className="panelTitle">
              <p className="kicker">Export</p>
              <h2>Local output center</h2>
            </div>
            <div className="exportGrid">
              {exportOptions.map(([type, detail]) => (
                <button key={type} onClick={() => exportProject(type)} type="button">
                  <strong>{type}</strong>
                  <span>{detail}</span>
                </button>
              ))}
            </div>
            <p className="safeNote">
              Hardware writing stays disabled in this version. Exports are local files only.
            </p>
          </article>

          <article className="helpPanel">
            <div className="panelTitle">
              <p className="kicker">Help</p>
              <h2>Daily workflow</h2>
            </div>
            <ol>
              <li>Create or rename a project.</li>
              <li>Choose a style, tempo, key, and lead sound.</li>
              <li>Generate the arrangement and preview the player.</li>
              <li>Export a local package when the idea is ready.</li>
            </ol>
          </article>
        </section>
      </section>
    </main>
  );
}

export default App;
