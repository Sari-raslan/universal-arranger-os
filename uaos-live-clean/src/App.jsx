import { useMemo, useState } from "react";
import "./App.css";

const templates = [
  {
    id: "oriental-pop",
    name: "Modern Oriental Pop",
    tempo: 96,
    key: "D minor",
    mood: "Warm vocal song with live arranger energy",
    sections: ["Intro", "Verse", "Chorus", "Bridge", "Final"],
  },
  {
    id: "live-dabke",
    name: "Live Dabke",
    tempo: 112,
    key: "G minor",
    mood: "Fast stage rhythm for keyboard performance",
    sections: ["Intro", "Main", "Break", "Solo", "Main", "Ending"],
  },
  {
    id: "studio-ballad",
    name: "Studio Ballad",
    tempo: 78,
    key: "C minor",
    mood: "Slow emotional arrangement for singer demos",
    sections: ["Intro", "Verse", "Pre Chorus", "Chorus", "Final"],
  },
];

const library = [
  { id: "live-drums", name: "Live Drums", family: "Percussion", role: "Rhythm engine", color: "#9fe870", ready: true },
  { id: "deep-bass", name: "Deep Bass", family: "Bass", role: "Low groove", color: "#8bd3dd", ready: true },
  { id: "studio-grand", name: "Studio Grand", family: "Keys", role: "Chord support", color: "#f8fafc", ready: true },
  { id: "warm-oud", name: "Warm Oud", family: "Strings", role: "Lead phrase", color: "#f7c873", ready: true },
  { id: "arabic-violin", name: "Arabic Violin", family: "Strings", role: "Counter melody", color: "#f4907a", ready: true },
  { id: "pad-air", name: "Pad Air", family: "Synth", role: "Atmosphere", color: "#b6a7ff", ready: true },
];

const starterInstrumentIds = ["live-drums", "deep-bass", "studio-grand", "warm-oud", "pad-air"];

function makeProject(template, title) {
  return {
    title: title.trim() || "New UAOS Song",
    artist: "Local session",
    templateId: template.id,
    style: template.name,
    key: template.key,
    tempo: template.tempo,
    mood: template.mood,
    instruments: starterInstrumentIds,
    generated: false,
    sections: template.sections.map((name, index) => ({
      id: `${template.id}-${name}-${index}`,
      name,
      bars: name === "Intro" || name === "Ending" || name === "Final" ? 4 : 8,
      chord: ["Dm", "Bb", "C", "A7", "Gm", "F"][index] || template.key,
      energy: index === 0 ? 34 : index === template.sections.length - 1 ? 88 : 58 + index * 7,
    })),
    tracks: [],
  };
}

function buildTracks(project) {
  return library
    .filter((instrument) => project.instruments.includes(instrument.id))
    .map((instrument, index) => ({
      id: `${instrument.id}-${index}`,
      name: instrument.name,
      family: instrument.family,
      role: instrument.role,
      pattern:
        instrument.family === "Percussion"
          ? "Live groove"
          : instrument.family === "Bass"
            ? "Root movement"
            : instrument.family === "Synth"
              ? "Wide pad layer"
              : "Chord phrase",
      level: Math.min(92, 68 + index * 5),
    }));
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function cleanFileName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "uaos-project";
}

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0].id);
  const [projectTitle, setProjectTitle] = useState("My UAOS Song");
  const [project, setProject] = useState(() => makeProject(templates[0], "My UAOS Song"));
  const [selectedSectionId, setSelectedSectionId] = useState(project.sections[0]?.id || "");
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("Ready for Real Workflow V2.");

  const currentTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || templates[0],
    [selectedTemplateId],
  );

  const selectedInstruments = useMemo(
    () => library.filter((instrument) => project.instruments.includes(instrument.id)),
    [project.instruments],
  );

  const totalBars = useMemo(
    () => project.sections.reduce((sum, section) => sum + section.bars, 0),
    [project.sections],
  );

  function createProject() {
    const nextProject = makeProject(currentTemplate, projectTitle);
    setProject(nextProject);
    setSelectedSectionId(nextProject.sections[0]?.id || "");
    setPlaying(false);
    setMessage("New project created.");
    setActiveView("project");
  }

  function updateProject(field, value) {
    setProject((current) => ({ ...current, [field]: value, generated: false, tracks: [] }));
    setMessage("Project settings changed.");
  }

  function toggleInstrument(id) {
    setProject((current) => {
      const exists = current.instruments.includes(id);
      const instruments = exists
        ? current.instruments.filter((instrumentId) => instrumentId !== id)
        : [...current.instruments, id];

      return { ...current, instruments, generated: false, tracks: [] };
    });
    setMessage("Instrument selection changed.");
    setActiveView("library");
  }

  function generateArrangement() {
    const tracks = buildTracks(project);
    setProject((current) => ({
      ...current,
      generated: true,
      tracks,
      sections: current.sections.map((section, index) => ({
        ...section,
        energy: Math.min(96, section.energy + 8 + index * 2),
      })),
    }));
    setMessage("Arrangement generated.");
    setActiveView("generator");
  }

  function exportManifest() {
    const manifest = {
      product: "UAOS Universal Arranger OS",
      mode: "Real Workflow V2",
      safety: {
        localOnly: true,
        publicPublish: false,
        keyboardOutput: "locked",
      },
      project,
      selectedInstruments,
      summary: {
        sections: project.sections.length,
        tracks: project.tracks.length,
        bars: totalBars,
        generated: project.generated,
      },
    };

    downloadTextFile(
      `${cleanFileName(project.title)}-uaos-manifest.json`,
      JSON.stringify(manifest, null, 2),
    );
    setMessage("Local manifest exported.");
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
            <p className="kicker">Real Workflow V2</p>
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
          <strong>{project.generated ? "Generated" : "Draft"}</strong>
          <strong>{project.generated ? "Export ready" : "Needs generate"}</strong>
          <strong>Keyboard output locked</strong>
        </section>

        <section className="contentGrid">
          <article className="projectPanel">
            <div className="panelTitle">
              <p className="kicker">Step 1</p>
              <h2>New Project</h2>
            </div>
            <div className="formGrid">
              <label>
                Project name
                <input
                  value={projectTitle}
                  onChange={(event) => setProjectTitle(event.target.value)}
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
                Template
                <select
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
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
              <button className="primaryButton createButton" onClick={createProject} type="button">
                Create project
              </button>
            </div>

            <div className="templateGrid">
              {templates.map((template) => (
                <button
                  className={template.id === selectedTemplateId ? "templateCard selected" : "templateCard"}
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  type="button"
                >
                  <strong>{template.name}</strong>
                  <span>{template.mood}</span>
                  <small>{template.tempo} BPM | {template.key}</small>
                </button>
              ))}
            </div>
          </article>

          <article className="arrangementPanel">
            <div className="panelTitle">
              <p className="kicker">Step 2</p>
              <h2>Generator</h2>
            </div>
            <div className="generatorSummary">
              <strong>{project.style}</strong>
              <span>{selectedInstruments.length} instruments | {totalBars} bars</span>
              <button className="primaryButton" onClick={generateArrangement} type="button">
                Generate Arrangement
              </button>
            </div>
            <div className="timeline">
              {project.sections.map((section) => (
                <button
                  className={selectedSectionId === section.id ? "sectionBlock focus" : "sectionBlock"}
                  key={section.id}
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setMessage(`${section.name} selected.`);
                    setActiveView("generator");
                  }}
                  type="button"
                >
                  <strong>{section.name}</strong>
                  <span>{section.bars} bars</span>
                  <i><b style={{ width: `${section.energy}%` }} /></i>
                  <small>{section.chord}</small>
                </button>
              ))}
            </div>
          </article>

          <article className="libraryPanel">
            <div className="panelTitle">
              <p className="kicker">Step 3</p>
              <h2>Instrument Library</h2>
            </div>
            <div className="instrumentGrid">
              {library.map((instrument) => {
                const selected = project.instruments.includes(instrument.id);
                return (
                  <button
                    className={selected ? "instrumentCard selected" : "instrumentCard"}
                    key={instrument.id}
                    onClick={() => toggleInstrument(instrument.id)}
                    type="button"
                  >
                    <i style={{ background: instrument.color }} />
                    <strong>{instrument.name}</strong>
                    <span>{instrument.family}</span>
                    <small>{instrument.ready ? instrument.role : "Preview"}</small>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="mixerPanel">
            <div className="panelTitle">
              <p className="kicker">Step 4</p>
              <h2>Player / Transport</h2>
            </div>
            <div className="transport">
              <button onClick={() => setPlaying((value) => !value)} type="button">
                {playing ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setMessage("Preview stopped.");
                }}
                type="button"
              >
                Stop
              </button>
              <strong>{playing ? "Preview running" : "Preview stopped"}</strong>
              <div className="playMeter"><i className={playing ? "on" : ""} /></div>
            </div>
            <div className="trackList">
              {project.tracks.length ? (
                project.tracks.map((track) => (
                  <div className="trackRow" key={track.id}>
                    <span>{track.name}</span>
                    <strong>{track.pattern}</strong>
                    <i><b style={{ width: `${track.level}%` }} /></i>
                  </div>
                ))
              ) : (
                <div className="emptyState">
                  <strong>No generated tracks yet.</strong>
                  <span>Use Generate Arrangement to create the session tracks.</span>
                </div>
              )}
            </div>
          </article>

          <article className="exportPanel">
            <div className="panelTitle">
              <p className="kicker">Step 5</p>
              <h2>Export Center</h2>
            </div>
            <div className="exportGrid">
              <button disabled={!project.generated} onClick={exportManifest} type="button">
                <strong>Manifest</strong>
                <span>Download a local project summary</span>
              </button>
              <button disabled type="button">
                <strong>MIDI Draft</strong>
                <span>Planned DAW handoff</span>
              </button>
              <button disabled type="button">
                <strong>Style Draft</strong>
                <span>Review-only package concept</span>
              </button>
              <button disabled={!project.generated} onClick={exportManifest} type="button">
                <strong>All</strong>
                <span>Safe local bundle manifest</span>
              </button>
            </div>
            <p className="safeNote">
              Exports are local review files. Keyboard output remains locked.
            </p>
          </article>

          <article className="helpPanel">
            <div className="panelTitle">
              <p className="kicker">Help</p>
              <h2>How UAOS works now</h2>
            </div>
            <ol>
              <li>Create a project from a musical template.</li>
              <li>Choose the key, tempo, artist, and instrument library.</li>
              <li>Generate the arrangement to create sections and tracks.</li>
              <li>Preview the session with the player transport.</li>
              <li>Export a local manifest when the idea is ready.</li>
            </ol>
          </article>
        </section>
      </section>
    </main>
  );
}

export default App;
