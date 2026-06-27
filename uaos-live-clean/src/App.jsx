import { useMemo, useState } from "react";
import "./App.css";

const styleTemplates = [
  {
    id: "arabic-pop-ballad",
    name: "Arabic Pop Ballad",
    description: "Warm singer arrangement with emotional strings and a clear chorus lift.",
    tempo: 86,
    key: "D minor",
    groove: "Soft 4/4",
    sections: [
      { name: "Intro", bars: 4, energy: 35, chord: "Dm - Bb - C - Dm" },
      { name: "Verse", bars: 8, energy: 48, chord: "Dm - C - Bb - A" },
      { name: "Chorus", bars: 8, energy: 78, chord: "Bb - C - Dm - Dm" },
      { name: "Fill", bars: 2, energy: 90, chord: "A - A" },
      { name: "Chorus 2", bars: 8, energy: 85, chord: "Bb - C - Dm - Dm" },
      { name: "Ending", bars: 4, energy: 45, chord: "Bb - A - Dm" },
    ],
  },
  {
    id: "modern-dabke-live",
    name: "Modern Dabke Live",
    description: "Live keyboard energy with strong rhythm sections and a solo break.",
    tempo: 112,
    key: "G minor",
    groove: "Dabke 4/4",
    sections: [
      { name: "Intro", bars: 4, energy: 70, chord: "Gm - F - Eb - D" },
      { name: "Main A", bars: 8, energy: 86, chord: "Gm - Gm - F - Gm" },
      { name: "Break", bars: 4, energy: 92, chord: "D - Eb - F - Gm" },
      { name: "Solo", bars: 8, energy: 96, chord: "Gm - F - Eb - D" },
      { name: "Main B", bars: 8, energy: 90, chord: "Gm - Gm - F - Gm" },
      { name: "Ending", bars: 4, energy: 80, chord: "Eb - D - Gm" },
    ],
  },
  {
    id: "cinematic-strings",
    name: "Cinematic Strings",
    description: "Slow emotional arrangement for demos, film cues, and dramatic song ideas.",
    tempo: 76,
    key: "C minor",
    groove: "Slow cinematic",
    sections: [
      { name: "Intro", bars: 4, energy: 25, chord: "Cm - Ab - Eb - Bb" },
      { name: "Theme", bars: 8, energy: 52, chord: "Cm - Ab - Fm - G" },
      { name: "Build", bars: 8, energy: 82, chord: "Ab - Bb - Cm - Cm" },
      { name: "Finale", bars: 8, energy: 92, chord: "Fm - G - Cm" },
    ],
  },
];

const trackRoles = [
  {
    id: "drums",
    name: "Drums",
    family: "Rhythm",
    purpose: "Main beat and fills",
    patternByStyle: {
      "arabic-pop-ballad": "Soft kick, rim, and light oriental percussion",
      "modern-dabke-live": "Fast dabke groove with hand percussion",
      "cinematic-strings": "Low cinematic pulse and soft hits",
    },
  },
  {
    id: "bass",
    name: "Bass",
    family: "Low End",
    purpose: "Root movement and section power",
    patternByStyle: {
      "arabic-pop-ballad": "Simple root notes with chorus lift",
      "modern-dabke-live": "Driving live bass rhythm",
      "cinematic-strings": "Long low notes under harmony",
    },
  },
  {
    id: "chords",
    name: "Chords",
    family: "Harmony",
    purpose: "Piano or keyboard chord support",
    patternByStyle: {
      "arabic-pop-ballad": "Broken piano chords",
      "modern-dabke-live": "Short keyboard stabs",
      "cinematic-strings": "Wide soft piano harmony",
    },
  },
  {
    id: "pad",
    name: "Pad",
    family: "Atmosphere",
    purpose: "Background emotion and width",
    patternByStyle: {
      "arabic-pop-ballad": "Warm string pad",
      "modern-dabke-live": "Bright synth support",
      "cinematic-strings": "Layered string pad",
    },
  },
  {
    id: "melody",
    name: "Melody Guide",
    family: "Lead",
    purpose: "Singer guide or instrumental phrase",
    patternByStyle: {
      "arabic-pop-ballad": "Nay-style guide phrase",
      "modern-dabke-live": "Keyboard lead response",
      "cinematic-strings": "Simple violin theme guide",
    },
  },
];

const defaultTracks = ["drums", "bass", "chords", "pad", "melody"];

function createProject(template, title) {
  return {
    id: `uaos-${Date.now()}`,
    title: title.trim() || template.name,
    templateId: template.id,
    templateName: template.name,
    description: template.description,
    tempo: template.tempo,
    key: template.key,
    groove: template.groove,
    sections: template.sections,
    enabledTracks: defaultTracks,
    arrangement: [],
    generatedAt: null,
  };
}

function buildArrangement(project) {
  return project.sections.map((section, sectionIndex) => {
    const tracks = trackRoles
      .filter((track) => project.enabledTracks.includes(track.id))
      .map((track, trackIndex) => ({
        id: `${section.name}-${track.id}`,
        name: track.name,
        family: track.family,
        purpose: track.purpose,
        pattern: track.patternByStyle[project.templateId],
        intensity: Math.min(100, Math.max(10, section.energy + trackIndex * 2 - sectionIndex)),
      }));

    return {
      ...section,
      tracks,
      cue:
        section.energy > 85
          ? "Big live moment"
          : section.energy > 65
            ? "Full arrangement"
            : "Controlled intro or verse feel",
    };
  });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function cleanFilename(value) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "uaos_project";
}

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [templateId, setTemplateId] = useState(styleTemplates[0].id);
  const [projectTitle, setProjectTitle] = useState("My UAOS Arrangement");
  const [project, setProject] = useState(() => createProject(styleTemplates[0], "My UAOS Arrangement"));
  const [selectedSectionName, setSelectedSectionName] = useState("Intro");
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("Ready for Real Workflow V3.");

  const selectedTemplate = useMemo(
    () => styleTemplates.find((template) => template.id === templateId) || styleTemplates[0],
    [templateId],
  );

  const arrangement = useMemo(
    () => (project.arrangement.length ? project.arrangement : buildArrangement(project)),
    [project],
  );

  const selectedSection = useMemo(
    () => arrangement.find((section) => section.name === selectedSectionName) || arrangement[0],
    [arrangement, selectedSectionName],
  );

  const totalBars = useMemo(
    () => project.sections.reduce((sum, section) => sum + section.bars, 0),
    [project.sections],
  );

  const generated = Boolean(project.generatedAt);

  function startProject() {
    const nextProject = createProject(selectedTemplate, projectTitle);
    setProject(nextProject);
    setSelectedSectionName(nextProject.sections[0]?.name || "Intro");
    setPlaying(false);
    setMessage("New musical project created.");
    setActiveView("project");
  }

  function toggleTrack(trackId) {
    setProject((current) => {
      const exists = current.enabledTracks.includes(trackId);
      const enabledTracks = exists
        ? current.enabledTracks.filter((id) => id !== trackId)
        : [...current.enabledTracks, trackId];

      return {
        ...current,
        enabledTracks,
        arrangement: [],
        generatedAt: null,
      };
    });
    setMessage("Track selection updated.");
    setActiveView("tracks");
  }

  function generateArrangement() {
    const nextArrangement = buildArrangement(project);
    setProject((current) => ({
      ...current,
      arrangement: nextArrangement,
      generatedAt: new Date().toISOString(),
    }));
    setSelectedSectionName(nextArrangement[0]?.name || "Intro");
    setMessage("Arrangement generated with sections and tracks.");
    setActiveView("arranger");
  }

  function exportManifest() {
    const manifest = {
      product: "UAOS - Universal Arranger OS",
      version: "Real Workflow V3",
      purpose: "Safe local project manifest for review, demo, and development handoff",
      safety: {
        publicPublish: false,
        realKeyboardOutput: false,
        localOnly: true,
      },
      project: {
        ...project,
        arrangement,
      },
      summary: {
        title: project.title,
        style: project.templateName,
        tempo: project.tempo,
        key: project.key,
        groove: project.groove,
        sections: project.sections.length,
        tracks: project.enabledTracks.length,
        totalBars,
        generated,
      },
    };

    downloadJson(`${cleanFilename(project.title)}_uaos_v3_manifest.json`, manifest);
    setMessage("Safe local manifest downloaded.");
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
          ["arranger", "Arranger"],
          ["tracks", "Tracks"],
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
        <header className="deskHeader heroHeader">
          <div>
            <p className="kicker">Real Workflow V3</p>
            <h1>{project.title}</h1>
            <span>{project.templateName} | {project.key} | {project.tempo} BPM | {project.groove}</span>
            <p className="heroCopy">
              UAOS now works more like a real arranger workstation: musical sections,
              named tracks, chord plans, energy levels, preview state, and safe local export.
            </p>
          </div>
          <div className="currentCard">
            <span>Current style</span>
            <strong>{project.templateName}</strong>
            <p>{project.description}</p>
            <div className="miniGrid">
              <b>{project.tempo} BPM</b>
              <b>{project.key}</b>
              <b>{project.groove}</b>
              <b>{generated ? "Generated" : "Draft"}</b>
            </div>
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
          <strong>{project.sections.length} sections</strong>
          <strong>{project.enabledTracks.length} tracks</strong>
          <strong>{totalBars} bars</strong>
          <strong>Output locked</strong>
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
                Musical style
                <select
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                >
                  {styleTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="primaryButton createButton" onClick={startProject} type="button">
                Create project
              </button>
            </div>

            <div className="templateGrid">
              {styleTemplates.map((template) => (
                <button
                  className={template.id === templateId ? "templateCard selected" : "templateCard"}
                  key={template.id}
                  onClick={() => setTemplateId(template.id)}
                  type="button"
                >
                  <strong>{template.name}</strong>
                  <span>{template.description}</span>
                  <small>{template.tempo} BPM | {template.key} | {template.groove}</small>
                </button>
              ))}
            </div>
          </article>

          <article className="arrangementPanel">
            <div className="panelTitle">
              <p className="kicker">Step 2</p>
              <h2>Arranger Timeline</h2>
            </div>
            <div className="generatorSummary">
              <strong>{project.templateName}</strong>
              <span>{project.description}</span>
              <button className="primaryButton" onClick={generateArrangement} type="button">
                Generate Musical Arrangement
              </button>
            </div>
            <div className="timeline">
              {arrangement.map((section) => (
                <button
                  className={selectedSection?.name === section.name ? "sectionBlock focus" : "sectionBlock"}
                  key={section.name}
                  onClick={() => {
                    setSelectedSectionName(section.name);
                    setMessage(`${section.name} selected.`);
                    setActiveView("arranger");
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
              <h2>Tracks and Instruments</h2>
            </div>
            <div className="trackRoleGrid">
              {trackRoles.map((track) => {
                const active = project.enabledTracks.includes(track.id);
                return (
                  <button
                    className={active ? "trackRoleCard selected" : "trackRoleCard"}
                    key={track.id}
                    onClick={() => toggleTrack(track.id)}
                    type="button"
                  >
                    <strong>{track.name}</strong>
                    <span>{track.family}</span>
                    <p>{track.purpose}</p>
                    <small>{active ? "Included" : "Muted"}</small>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="mixerPanel">
            <div className="panelTitle">
              <p className="kicker">Step 4</p>
              <h2>Player and Section Detail</h2>
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
            <div className="sectionDetail">
              <div className="sectionSummary">
                <span>Selected section</span>
                <strong>{selectedSection?.name}</strong>
                <p>{selectedSection?.chord}</p>
                <small>{selectedSection?.cue}</small>
              </div>
              <div className="generatedTracks">
                {(selectedSection?.tracks || []).map((track) => (
                  <article key={track.id}>
                    <strong>{track.name}</strong>
                    <span>{track.pattern}</span>
                    <p>{track.purpose}</p>
                    <div className="level"><div style={{ width: `${track.intensity}%` }} /></div>
                  </article>
                ))}
              </div>
            </div>
          </article>

          <article className="exportPanel">
            <div className="panelTitle">
              <p className="kicker">Step 5</p>
              <h2>Export Center</h2>
            </div>
            <div className="exportGrid three">
              <button onClick={exportManifest} type="button">
                <strong>V3 Manifest</strong>
                <span>Sections, chords, track roles, energy, and safety gates</span>
              </button>
              <button disabled type="button">
                <strong>MIDI Handoff</strong>
                <span>Future safe DAW review</span>
              </button>
              <button disabled type="button">
                <strong>Style Output</strong>
                <span>Blocked until real device tests and approval</span>
              </button>
            </div>
            <p className="safeNote">
              Export is a local review manifest. Keyboard output remains blocked.
            </p>
          </article>

          <article className="helpPanel">
            <div className="panelTitle">
              <p className="kicker">Help</p>
              <h2>Simple user workflow</h2>
            </div>
            <ol>
              <li>Create a project from a musical style.</li>
              <li>Generate sections with chords and energy.</li>
              <li>Choose drums, bass, chords, pad, and melody guide.</li>
              <li>Preview the selected section and its track patterns.</li>
              <li>Download a safe local manifest.</li>
            </ol>
          </article>
        </section>
      </section>
    </main>
  );
}

export default App;
