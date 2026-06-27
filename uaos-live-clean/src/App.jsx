import React, { useMemo, useState } from "react";
import "./style.css";

const STORAGE_KEY = "uaos_real_workflow_v7_projects";
const ACTIVE_KEY = "uaos_real_workflow_v7_active_project_id";
const ONBOARDING_KEY = "uaos_real_workflow_v7_onboarding_closed";

const styleTemplates = [
  {
    id: "arabic-pop-ballad",
    name: "Arabic Pop Ballad",
    description: "Warm singer arrangement with emotional strings and clear chorus lift.",
    bpm: 86,
    key: "D minor",
    groove: "Soft 4/4",
    market: "Singer demo, Arabic pop, emotional performance",
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
    description: "Live keyboard energy with strong rhythm sections and solo break.",
    bpm: 112,
    key: "G minor",
    groove: "Dabke 4/4",
    market: "Live keyboard, party, dance, fast stage performance",
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
    description: "Slow emotional arrangement for demo, film, and dramatic song ideas.",
    bpm: 76,
    key: "C minor",
    groove: "Slow cinematic",
    market: "Film, dramatic demo, orchestral song sketch",
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
      "arabic-pop-ballad": "Soft kick, rim, light oriental percussion",
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
      "arabic-pop-ballad": "Warm strings pad",
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

const demoSlides = [
  {
    title: "What UAOS does",
    text: "UAOS helps create arranger-style music projects from a simple song idea: sections, chords, tracks, preview, and safe export.",
    points: ["Create a song project", "Generate arrangement sections", "Export safe review files"],
  },
  {
    title: "Who it helps",
    text: "UAOS is designed for singers, home musicians, keyboard players, and arrangers who need fast project drafts.",
    points: ["Singer demos", "Live keyboard ideas", "Developer or reviewer handoff"],
  },
  {
    title: "Why it matters",
    text: "The product turns music ideas into structured project data that can be reviewed, funded, and developed further.",
    points: ["Clear workflow", "Local safe prototype", "Ready for presentation"],
  },
  {
    title: "Safety position",
    text: "Public publishing and real keyboard/device writing remain blocked until explicit approval and real device tests.",
    points: ["No public publish", "No device writer", "Local-only export"],
  },
];

function uid() {
  return "uaos-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function createProject(template, title) {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: title.trim() || template.name,
    templateId: template.id,
    templateName: template.name,
    description: template.description,
    market: template.market,
    bpm: template.bpm,
    key: template.key,
    groove: template.groove,
    sections: template.sections,
    enabledTracks: ["drums", "bass", "chords", "pad", "melody"],
    arrangement: [],
    notes: "Write your song idea here.",
    createdAt: now,
    updatedAt: now,
    generatedAt: null,
    savedAt: null,
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
        pattern: track.patternByStyle[project.templateId] || "Musical pattern",
        intensity: Math.min(100, Math.max(10, section.energy + trackIndex * 2 - sectionIndex)),
      }));

    return {
      ...section,
      tracks,
      cue: section.energy > 85 ? "Big live moment" : section.energy > 65 ? "Full arrangement" : "Controlled intro/verse feel",
    };
  });
}

function readProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function cleanFilename(value) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "uaos_project";
}

function SectionHeader({ label, title, text }) {
  return (
    <div className="section-header">
      <p>{label}</p>
      <h2>{title}</h2>
      <span>{text}</span>
    </div>
  );
}

function EmptyState({ title, text, action }) {
  return (
    <div className="uaos-empty">
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}

export default function App() {
  const initialTemplate = styleTemplates[0];
  const initialProject = createProject(initialTemplate, "My UAOS Arrangement");

  const [projects, setProjects] = useState(() => {
    const existing = readProjects();
    if (existing.length) return existing;
    return [initialProject];
  });

  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem(ACTIVE_KEY) || readProjects()[0]?.id || initialProject.id;
  });

  const activeProject = useMemo(() => {
    return projects.find((item) => item.id === activeProjectId) || projects[0] || initialProject;
  }, [projects, activeProjectId]);

  const [templateId, setTemplateId] = useState(activeProject.templateId || styleTemplates[0].id);
  const [projectTitle, setProjectTitle] = useState(activeProject.title || "My UAOS Arrangement");
  const [selectedSectionName, setSelectedSectionName] = useState(activeProject.sections?.[0]?.name || "Intro");
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("Ready");
  const [lastExportName, setLastExportName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(ONBOARDING_KEY) !== "closed");
  const [demoMode, setDemoMode] = useState(false);
  const [demoSlideIndex, setDemoSlideIndex] = useState(0);

  const selectedTemplate = useMemo(
    () => styleTemplates.find((template) => template.id === templateId) || styleTemplates[0],
    [templateId]
  );

  const arrangement = activeProject.arrangement?.length ? activeProject.arrangement : buildArrangement(activeProject);

  const selectedSection = useMemo(
    () => arrangement.find((section) => section.name === selectedSectionName) || arrangement[0],
    [arrangement, selectedSectionName]
  );

  const totalBars = useMemo(
    () => activeProject.sections.reduce((sum, section) => sum + section.bars, 0),
    [activeProject.sections]
  );

  const activeTrackCount = activeProject.enabledTracks.length;
  const generated = Boolean(activeProject.generatedAt);
  const saved = Boolean(activeProject.savedAt);

  const checklist = [
    { label: "Project created", done: Boolean(activeProject.title) },
    { label: "Tracks selected", done: activeTrackCount > 0 },
    { label: "Arrangement generated", done: generated },
    { label: "Project saved", done: saved },
    { label: "Export ready", done: generated && activeTrackCount > 0 },
  ];

  const completedChecklist = checklist.filter((item) => item.done).length;
  const completionScore = Math.round((completedChecklist / checklist.length) * 100);
  const activeSlide = demoSlides[demoSlideIndex];

  function persist(nextProjects, nextActiveId = activeProjectId) {
    setProjects(nextProjects);
    writeProjects(nextProjects);
    localStorage.setItem(ACTIVE_KEY, nextActiveId);
    setActiveProjectId(nextActiveId);
  }

  function updateActiveProject(patch) {
    const now = new Date().toISOString();
    const nextProjects = projects.map((project) =>
      project.id === activeProject.id
        ? { ...project, ...patch, updatedAt: now }
        : project
    );
    persist(nextProjects, activeProject.id);
  }

  function closeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, "closed");
    setShowOnboarding(false);
  }

  function startProject() {
    const nextProject = createProject(selectedTemplate, projectTitle);
    const nextProjects = [nextProject, ...projects];
    persist(nextProjects, nextProject.id);
    setSelectedSectionName(nextProject.sections[0]?.name || "Intro");
    setPlaying(false);
    setLastExportName("");
    setMessage("New project added to browser");
  }

  function openProject(projectId) {
    const found = projects.find((project) => project.id === projectId);
    if (!found) return;
    localStorage.setItem(ACTIVE_KEY, projectId);
    setActiveProjectId(projectId);
    setProjectTitle(found.title);
    setTemplateId(found.templateId);
    setSelectedSectionName(found.sections?.[0]?.name || "Intro");
    setPlaying(false);
    setMessage("Project opened");
  }

  function saveCurrentProject() {
    const savedProject = {
      ...activeProject,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      arrangement,
    };
    const nextProjects = projects.map((project) =>
      project.id === activeProject.id ? savedProject : project
    );
    persist(nextProjects, activeProject.id);
    setMessage("Project saved in browser library");
  }

  function renameCurrentProject() {
    const name = projectTitle.trim();
    if (!name) {
      setMessage("Project name is empty");
      return;
    }
    updateActiveProject({ title: name, savedAt: null });
    setMessage("Project renamed");
  }

  function duplicateCurrentProject() {
    const now = new Date().toISOString();
    const copy = {
      ...activeProject,
      id: uid(),
      title: `${activeProject.title} Copy`,
      createdAt: now,
      updatedAt: now,
      savedAt: now,
    };
    const nextProjects = [copy, ...projects];
    persist(nextProjects, copy.id);
    setProjectTitle(copy.title);
    setSelectedSectionName(copy.sections?.[0]?.name || "Intro");
    setMessage("Project duplicated");
  }

  function deleteCurrentProject() {
    if (projects.length <= 1) {
      setMessage("Keep at least one project");
      return;
    }
    const nextProjects = projects.filter((project) => project.id !== activeProject.id);
    const nextActive = nextProjects[0].id;
    persist(nextProjects, nextActive);
    setProjectTitle(nextProjects[0].title);
    setTemplateId(nextProjects[0].templateId);
    setSelectedSectionName(nextProjects[0].sections?.[0]?.name || "Intro");
    setPlaying(false);
    setMessage("Project deleted locally");
  }

  function toggleTrack(trackId) {
    const exists = activeProject.enabledTracks.includes(trackId);
    const enabledTracks = exists
      ? activeProject.enabledTracks.filter((id) => id !== trackId)
      : [...activeProject.enabledTracks, trackId];

    updateActiveProject({
      enabledTracks,
      arrangement: [],
      generatedAt: null,
      savedAt: null,
    });
    setMessage("Track selection updated");
  }

  function generateArrangement() {
    const nextArrangement = buildArrangement(activeProject);
    updateActiveProject({
      arrangement: nextArrangement,
      generatedAt: new Date().toISOString(),
      savedAt: null,
    });
    setSelectedSectionName(nextArrangement[0]?.name || "Intro");
    setMessage("Arrangement generated");
  }

  function nextSlide() {
    setDemoSlideIndex((index) => (index + 1) % demoSlides.length);
  }

  function previousSlide() {
    setDemoSlideIndex((index) => (index - 1 + demoSlides.length) % demoSlides.length);
  }

  function createManifest() {
    return {
      product: "UAOS - Universal Arranger OS",
      version: "Real Workflow V7",
      purpose: "Polished safe local multi-project music workstation with presentation mode",
      safety: {
        publicPublish: false,
        vercel: false,
        realDeviceWriter: false,
        keyboardOutput: false,
        localOnly: true,
      },
      demoPresentation: {
        enabled: demoMode,
        slides: demoSlides,
        recommendedAudience: ["Jobcenter", "Private reviewer", "Developer handoff"],
      },
      project: {
        ...activeProject,
        arrangement,
      },
      browserLibrary: {
        projectCount: projects.length,
        activeProjectId: activeProject.id,
      },
      session: {
        message,
        checklist,
        completionScore,
        selectedSection: selectedSection?.name,
        lastExportName,
      },
      summary: {
        title: activeProject.title,
        style: activeProject.templateName,
        market: activeProject.market,
        bpm: activeProject.bpm,
        key: activeProject.key,
        groove: activeProject.groove,
        sections: activeProject.sections.length,
        tracks: activeTrackCount,
        totalBars,
        generated,
        saved,
      },
    };
  }

  function exportManifest() {
    const filename = `${cleanFilename(activeProject.title)}_uaos_v7_manifest.json`;
    downloadJson(filename, createManifest());
    setLastExportName(filename);
    setMessage("V7 manifest downloaded");
  }

  function exportPresentationPack() {
    const pack = {
      type: "UAOS_DEMO_PRESENTATION_PACK",
      exportedAt: new Date().toISOString(),
      audience: ["Jobcenter", "Private reviewer", "Developer"],
      product: "UAOS - Universal Arranger OS",
      currentProject: activeProject.title,
      valueProposition: "A local music workstation prototype for turning song ideas into structured arranger projects.",
      safeStatus: {
        publicPublish: "Blocked",
        deviceWriter: "Blocked",
        localDemo: "Ready",
      },
      slides: demoSlides,
      projectSummary: {
        style: activeProject.templateName,
        bpm: activeProject.bpm,
        key: activeProject.key,
        sections: activeProject.sections.length,
        tracks: activeTrackCount,
        readiness: `${completionScore}%`,
      },
      suggestedDemoFlow: [
        "Open Demo Mode",
        "Explain what UAOS does",
        "Show project browser",
        "Generate arrangement",
        "Show sections and tracks",
        "Export safe summary",
      ],
    };
    const filename = `${cleanFilename(activeProject.title)}_uaos_v7_presentation_pack.json`;
    downloadJson(filename, pack);
    setLastExportName(filename);
    setMessage("Presentation pack downloaded");
  }

  if (demoMode) {
    return (
      <main className="uaos-demo-mode">
        <header className="uaos-demo-top">
          <div>
            <span>UAOS Presentation Mode</span>
            <strong>{activeProject.title}</strong>
          </div>
          <div className="uaos-demo-actions">
            <button onClick={previousSlide}>Previous</button>
            <button onClick={nextSlide}>Next</button>
            <button onClick={exportPresentationPack}>Export Pack</button>
            <button onClick={() => setDemoMode(false)}>Exit Demo</button>
          </div>
        </header>

        <section className="uaos-demo-slide">
          <p>Slide {demoSlideIndex + 1} / {demoSlides.length}</p>
          <h1>{activeSlide.title}</h1>
          <h2>{activeSlide.text}</h2>
          <div className="uaos-demo-points">
            {activeSlide.points.map((point) => (
              <article key={point}>
                <strong>{point}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="uaos-demo-footer">
          <div>
            <strong>Current project</strong>
            <span>{activeProject.templateName} · {activeProject.bpm} BPM · {activeProject.key}</span>
          </div>
          <div>
            <strong>Safety</strong>
            <span>No public publish · No device writer · Local demo only</span>
          </div>
          <div>
            <strong>Readiness</strong>
            <span>{completionScore}% session readiness</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="uaos-app">
      <aside className="uaos-sidebar">
        <div className="uaos-brand">
          <div className="uaos-logo">U</div>
          <div>
            <strong>UAOS</strong>
            <span>Arranger Workstation</span>
          </div>
        </div>

        <nav className="uaos-nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#browser">Projects</a>
          <a href="#project">Editor</a>
          <a href="#demo">Demo</a>
          <a href="#arranger">Arranger</a>
          <a href="#tracks">Tracks</a>
          <a href="#player">Player</a>
          <a href="#export">Export</a>
        </nav>

        <div className="uaos-safety">
          <strong>Safety gates</strong>
          <span>Public publish blocked</span>
          <span>Device writer blocked</span>
          <span>Local workflow only</span>
        </div>
      </aside>

      <section className="uaos-main">
        <div className="uaos-topbar">
          <div>
            <span>Active session</span>
            <strong>{activeProject.title}</strong>
          </div>
          <div className="uaos-topbar-actions">
            <button className="uaos-mini-button" onClick={saveCurrentProject}>Save</button>
            <button className="uaos-mini-button" onClick={generateArrangement}>Generate</button>
            <button className="uaos-mini-button strong" onClick={() => setDemoMode(true)}>Demo Mode</button>
          </div>
        </div>

        {showOnboarding && (
          <section className="uaos-onboarding">
            <div>
              <strong>Start here</strong>
              <p>Create or open a project, generate the arrangement, save it, then use Demo Mode for Jobcenter or reviewer presentation.</p>
            </div>
            <button className="uaos-button secondary" onClick={closeOnboarding}>Got it</button>
          </section>
        )}

        <header className="uaos-hero" id="dashboard">
          <div>
            <p className="uaos-kicker">Real Workflow V7</p>
            <h1>{activeProject.title}</h1>
            <p>
              UAOS now includes a clean presentation mode for funding, friend review,
              and developer handoff while keeping all safety gates active.
            </p>
            <div className="uaos-actions">
              <button className="uaos-button primary" onClick={() => setDemoMode(true)}>Open Demo Mode</button>
              <a className="uaos-button secondary" href="#arranger">Generate</a>
              <a className="uaos-button secondary" href="#export">Export</a>
            </div>
          </div>

          <div className="uaos-current-card">
            <span>Presentation readiness</span>
            <strong>{completionScore}% Ready</strong>
            <p>{activeProject.description}</p>
            <div className="uaos-mini-grid">
              <b>{activeProject.bpm} BPM</b>
              <b>{activeProject.key}</b>
              <b>{projects.length} Projects</b>
              <b>{saved ? "Saved" : "Unsaved"}</b>
            </div>
          </div>
        </header>

        <section className="uaos-status-grid">
          <article><span>Status</span><strong>{message}</strong></article>
          <article><span>Checklist</span><strong>{completedChecklist}/{checklist.length}</strong></article>
          <article><span>Tracks</span><strong>{activeTrackCount}</strong></article>
          <article><span>Total bars</span><strong>{totalBars}</strong></article>
        </section>

        <section className="uaos-panel uaos-checklist-panel">
          <SectionHeader
            label="Session"
            title="Session Checklist"
            text="A simple product readiness checklist for the current arrangement."
          />

          <div className="uaos-checklist">
            {checklist.map((item) => (
              <div className={item.done ? "uaos-check done" : "uaos-check"} key={item.label}>
                <span>{item.done ? "✓" : "•"}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="uaos-panel" id="demo">
          <SectionHeader
            label="Presentation"
            title="Demo / Presentation Mode"
            text="A clean full-screen explanation for Jobcenter, private reviewers, or developer handoff."
          />

          <div className="uaos-demo-card">
            <div>
              <strong>Ready to present UAOS</strong>
              <p>Use this mode when you want to explain the product clearly without technical noise.</p>
              <ul>
                <li>Explains what UAOS does.</li>
                <li>Shows who it helps.</li>
                <li>Highlights safe local prototype status.</li>
                <li>Keeps public publish and device writer blocked.</li>
              </ul>
            </div>
            <div className="uaos-demo-card-actions">
              <button className="uaos-button primary" onClick={() => setDemoMode(true)}>Open Demo Mode</button>
              <button className="uaos-button secondary" onClick={exportPresentationPack}>Download Presentation Pack</button>
            </div>
          </div>
        </section>

        <section className="uaos-panel" id="browser">
          <SectionHeader
            label="Step 1"
            title="Project Browser"
            text="Manage multiple UAOS projects locally in this browser."
          />

          {projects.length ? (
            <div className="uaos-project-browser">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={project.id === activeProject.id ? "uaos-browser-card active" : "uaos-browser-card"}
                  onClick={() => openProject(project.id)}
                >
                  <strong>{project.title}</strong>
                  <span>{project.templateName}</span>
                  <small>{project.bpm} BPM · {project.key} · {project.generatedAt ? "Generated" : "Draft"}</small>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No projects yet"
              text="Create your first UAOS project to begin."
              action={<button className="uaos-button primary" onClick={startProject}>Create Project</button>}
            />
          )}

          <div className="uaos-project-actions">
            <button className="uaos-button primary" onClick={saveCurrentProject}>Save Current</button>
            <button className="uaos-button secondary" onClick={renameCurrentProject}>Rename</button>
            <button className="uaos-button secondary" onClick={duplicateCurrentProject}>Duplicate</button>
            <button className="uaos-button secondary" onClick={deleteCurrentProject}>Delete Local</button>
          </div>
        </section>

        <section className="uaos-panel" id="project">
          <SectionHeader
            label="Step 2"
            title="Project Editor"
            text="Create a new musical project or edit the current one."
          />

          <div className="uaos-project-form">
            <label>
              Project name
              <input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} />
            </label>

            <label>
              Musical style
              <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                {styleTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </label>

            <button className="uaos-button primary" onClick={startProject}>Create New</button>
          </div>

          <label className="uaos-notes">
            Project notes
            <textarea
              value={activeProject.notes}
              onChange={(event) => updateActiveProject({ notes: event.target.value, savedAt: null })}
            />
          </label>
        </section>

        <section className="uaos-panel" id="arranger">
          <SectionHeader
            label="Step 3"
            title="Arranger Timeline"
            text="Generate and inspect musical sections with chords, bars, and energy."
          />

          <div className="uaos-arranger-layout">
            <div className="uaos-arranger-control">
              <strong>{activeProject.templateName}</strong>
              <p>{activeProject.description}</p>
              <div className="uaos-pill-row">
                <span>{activeProject.bpm} BPM</span>
                <span>{activeProject.key}</span>
                <span>{activeProject.groove}</span>
              </div>
              <button className="uaos-button primary full" onClick={generateArrangement}>
                Generate Musical Arrangement
              </button>
            </div>

            <div className="uaos-timeline">
              {arrangement.map((section) => (
                <button
                  key={section.name}
                  className={selectedSection?.name === section.name ? "uaos-section active" : "uaos-section"}
                  onClick={() => setSelectedSectionName(section.name)}
                >
                  <strong>{section.name}</strong>
                  <span>{section.bars} bars</span>
                  <small>{section.energy}%</small>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="uaos-panel" id="tracks">
          <SectionHeader
            label="Step 4"
            title="Tracks and Instruments"
            text="Select the musical layers used by the arranger."
          />

          <div className="uaos-track-role-grid">
            {trackRoles.map((track) => {
              const active = activeProject.enabledTracks.includes(track.id);
              return (
                <button
                  key={track.id}
                  className={active ? "uaos-track-role active" : "uaos-track-role"}
                  onClick={() => toggleTrack(track.id)}
                >
                  <strong>{track.name}</strong>
                  <span>{track.family}</span>
                  <p>{track.purpose}</p>
                  <small>{active ? "Included" : "Muted"}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="uaos-panel" id="player">
          <SectionHeader
            label="Step 5"
            title="Player and Section Detail"
            text="Preview the session structure and inspect the selected section."
          />

          <div className="uaos-transport">
            <button className="uaos-play" onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play"}
            </button>
            <div className="uaos-meter">
              <div className={playing ? "on" : ""}></div>
            </div>
            <div className="uaos-transport-text">
              <strong>{playing ? "Preview running" : "Preview stopped"}</strong>
              <span>{selectedSection?.name} · {activeProject.bpm} BPM · {activeProject.key}</span>
            </div>
          </div>

          <div className="uaos-section-detail">
            <div className="uaos-section-summary">
              <span>Selected section</span>
              <strong>{selectedSection?.name}</strong>
              <p>{selectedSection?.chord}</p>
              <small>{selectedSection?.cue}</small>
            </div>

            <div className="uaos-generated-tracks">
              {(selectedSection?.tracks || []).map((track) => (
                <article key={track.id}>
                  <strong>{track.name}</strong>
                  <span>{track.pattern}</span>
                  <p>{track.purpose}</p>
                  <div className="uaos-level">
                    <div style={{ width: `${track.intensity}%` }}></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="uaos-panel" id="export">
          <SectionHeader
            label="Step 6"
            title="Export Center"
            text="Export safe local files for review, handoff, and funding presentation."
          />

          <div className="uaos-export-grid">
            <article>
              <strong>V7 Project Manifest</strong>
              <p>Exports active project, presentation data, checklist, sections, and safe session data.</p>
              <button className="uaos-button primary" onClick={exportManifest}>Download Manifest</button>
            </article>

            <article>
              <strong>Presentation Pack</strong>
              <p>Clean presentation data for Jobcenter, private review, or developer handoff.</p>
              <button className="uaos-button primary" onClick={exportPresentationPack}>Download Pack</button>
            </article>

            <article>
              <strong>Keyboard Writer</strong>
              <p>Still blocked. No real keyboard output in this phase.</p>
              <button className="uaos-button secondary" disabled>Blocked</button>
            </article>
          </div>

          <div className="uaos-project-summary">
            <strong>Project Summary</strong>
            <p>{activeProject.templateName} · {activeProject.bpm} BPM · {activeProject.key} · {activeProject.groove}</p>
            <p>{activeProject.market}</p>
            <p>Completion: {completionScore}% · Last export: {lastExportName || "None yet"}</p>
          </div>
        </section>
      </section>
    </main>
  );
}
