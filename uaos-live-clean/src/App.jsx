import React, { useEffect, useMemo, useState } from "react";
import "./style.css";

const STORAGE_KEY = "uaos_v8_projects";
const ACTIVE_KEY = "uaos_v8_active_project";
const NOTES_KEY = "uaos_v8_notes";

const templates = [
  {
    id: "arabic-pop-ballad",
    name: "Arabic Pop Ballad",
    bpm: 86,
    key: "D minor",
    groove: "Soft 4/4",
    description: "Warm singer arrangement with emotional strings and a clean chorus lift.",
    sections: [
      { name: "Intro", bars: 4, energy: 35, chord: "Dm - Bb - C - Dm" },
      { name: "Verse", bars: 8, energy: 48, chord: "Dm - C - Bb - A" },
      { name: "Chorus", bars: 8, energy: 78, chord: "Bb - C - Dm - Dm" },
      { name: "Fill", bars: 2, energy: 90, chord: "A - A" },
      { name: "Ending", bars: 4, energy: 45, chord: "Bb - A - Dm" },
    ],
  },
  {
    id: "modern-dabke-live",
    name: "Modern Dabke Live",
    bpm: 112,
    key: "G minor",
    groove: "Dabke 4/4",
    description: "Live keyboard energy with strong rhythm and fast crowd feel.",
    sections: [
      { name: "Intro", bars: 4, energy: 70, chord: "Gm - F - Eb - D" },
      { name: "Main A", bars: 8, energy: 86, chord: "Gm - Gm - F - Gm" },
      { name: "Break", bars: 4, energy: 92, chord: "D - Eb - F - Gm" },
      { name: "Solo", bars: 8, energy: 96, chord: "Gm - F - Eb - D" },
      { name: "Ending", bars: 4, energy: 80, chord: "Eb - D - Gm" },
    ],
  },
  {
    id: "cinematic-strings",
    name: "Cinematic Strings",
    bpm: 76,
    key: "C minor",
    groove: "Slow cinematic",
    description: "Slow emotional arrangement for dramatic demos and orchestral sketches.",
    sections: [
      { name: "Intro", bars: 4, energy: 25, chord: "Cm - Ab - Eb - Bb" },
      { name: "Theme", bars: 8, energy: 52, chord: "Cm - Ab - Fm - G" },
      { name: "Build", bars: 8, energy: 82, chord: "Ab - Bb - Cm - Cm" },
      { name: "Finale", bars: 8, energy: 92, chord: "Fm - G - Cm" },
    ],
  },
];

const trackRoles = [
  { id: "drums", name: "Drums", pattern: "Beat / Fill / Groove support" },
  { id: "bass", name: "Bass", pattern: "Low-end root movement" },
  { id: "chords", name: "Chords", pattern: "Harmony support" },
  { id: "pad", name: "Pad", pattern: "Atmosphere and texture" },
  { id: "melody", name: "Melody Guide", pattern: "Lead phrase / singer guide" },
];

function uid() {
  return "uaos-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function createProject(template, title = "My UAOS Arrangement") {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title,
    templateId: template.id,
    templateName: template.name,
    bpm: template.bpm,
    key: template.key,
    groove: template.groove,
    description: template.description,
    sections: template.sections,
    enabledTracks: trackRoles.map((t) => t.id),
    generatedAt: null,
    savedAt: null,
    notes: "Project notes...",
    createdAt: now,
    updatedAt: now,
  };
}

function buildArrangement(project) {
  return project.sections.map((section, index) => ({
    ...section,
    cue:
      section.energy > 85
        ? "Big live moment"
        : section.energy > 60
        ? "Full arrangement"
        : "Controlled intro / verse feel",
    tracks: trackRoles
      .filter((track) => project.enabledTracks.includes(track.id))
      .map((track, trackIndex) => ({
        ...track,
        intensity: Math.min(100, Math.max(20, section.energy + trackIndex * 2 - index)),
      })),
  }));
}

function readProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
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

function agentReply(input) {
  const text = input.toLowerCase();

  if (text.includes("friend")) {
    return "For friend support: explain that UAOS is a serious local music workstation prototype, show the demo mode, and mention that your main current need is a stronger laptop for development, presentation, and testing.";
  }

  if (text.includes("jobcenter")) {
    return "For Jobcenter: present UAOS as a local prototype, explain what is already built, and clearly state that a stronger laptop or work computer is required as necessary work equipment.";
  }

  if (text.includes("laptop") || text.includes("computer")) {
    return "Your strongest support point is that the current computer slows development, builds, demos, and tests. A stronger laptop is not luxury here — it is essential work equipment.";
  }

  if (text.includes("music") || text.includes("project")) {
    return "Start by creating or opening a project, then generate the arrangement, review sections and tracks, save it, and export a safe summary.";
  }

  if (text.includes("marriage") || text.includes("wedding") || text.includes("love")) {
    return "On relationships, I suggest clarity and honesty first. If you want, I can help you write a thoughtful message or think through priorities before making decisions.";
  }

  if (text.includes("death") || text.includes("fear")) {
    return "If you are thinking about fear, death, or heavy life questions, I can stay with you calmly and help you think step by step. I am not a human being, but I can still help you reflect and organize your thoughts safely.";
  }

  return "I can help with UAOS, friend support, Jobcenter preparation, laptop funding explanation, music workflow, and thoughtful life questions in a calm safe way.";
}

export default function App() {
  const initialTemplate = templates[0];
  const initialProject = createProject(initialTemplate);

  const [projects, setProjects] = useState(() => {
    const existing = readProjects();
    return existing.length ? existing : [initialProject];
  });

  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem(ACTIVE_KEY) || readProjects()[0]?.id || initialProject.id;
  });

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0] || initialProject,
    [projects, activeProjectId]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState(activeProject.templateId);
  const [title, setTitle] = useState(activeProject.title);
  const [message, setMessage] = useState("Ready");
  const [playing, setPlaying] = useState(false);
  const [selectedSectionName, setSelectedSectionName] = useState(activeProject.sections[0]?.name || "Intro");
  const [assistantName] = useState("UAOS Pixi");
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantVoiceOn, setAssistantVoiceOn] = useState(true);
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: "assistant",
      text: "Hello, I am UAOS Pixi. I can help you with your music project, friend support, Jobcenter preparation, and calm life questions.",
    },
  ]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeProject.id);
  }, [activeProject.id]);

  const arrangement = useMemo(() => buildArrangement(activeProject), [activeProject]);

  const selectedSection =
    arrangement.find((section) => section.name === selectedSectionName) || arrangement[0];

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) || templates[0];

  const checklist = [
    { label: "Project", done: Boolean(activeProject.title) },
    { label: "Tracks", done: activeProject.enabledTracks.length > 0 },
    { label: "Arrangement", done: Boolean(activeProject.generatedAt) },
    { label: "Saved", done: Boolean(activeProject.savedAt) },
    { label: "Export", done: Boolean(activeProject.generatedAt) },
  ];

  const completionScore = Math.round(
    (checklist.filter((item) => item.done).length / checklist.length) * 100
  );

  const managerReadiness = 90;
  const blockedFinalItems = [
    "Real device writer",
    "Real keyboard output",
    "Commercial final writer claim",
  ];

  function persist(nextProjects, nextActiveId) {
    setProjects(nextProjects);
    writeProjects(nextProjects);
    localStorage.setItem(ACTIVE_KEY, nextActiveId);
    setActiveProjectId(nextActiveId);
  }

  function updateProject(patch) {
    const now = new Date().toISOString();
    const nextProjects = projects.map((project) =>
      project.id === activeProject.id ? { ...project, ...patch, updatedAt: now } : project
    );
    persist(nextProjects, activeProject.id);
  }

  function createNewProject() {
    const created = createProject(selectedTemplate, title.trim() || selectedTemplate.name);
    const nextProjects = [created, ...projects];
    persist(nextProjects, created.id);
    setTitle(created.title);
    setSelectedSectionName(created.sections[0]?.name || "Intro");
    setMessage("New project created");
  }

  function saveProject() {
    updateProject({ savedAt: new Date().toISOString() });
    setMessage("Project saved locally");
  }

  function generateProject() {
    updateProject({ generatedAt: new Date().toISOString() });
    setMessage("Arrangement generated");
  }

  function exportSummary() {
    const data = {
      product: "UAOS",
      version: "V8 Unified Action Bar + Pixi Assistant",
      title: activeProject.title,
      template: activeProject.templateName,
      bpm: activeProject.bpm,
      key: activeProject.key,
      groove: activeProject.groove,
      completionScore, managerReadiness, blockedFinalItems,
      tracks: activeProject.enabledTracks,
      sections: arrangement,
      safety: {
        publicPublish: false,
        deviceWriter: false,
        keyboardOutput: false,
        localOnly: true,
      },
    };
    downloadJson(`${cleanFilename(activeProject.title)}_uaos_v8_summary.json`, data);
    setMessage("Summary exported");
  }

  function openFriendMode() {
    setMessage("Friend support mode ready");
    addAssistantSystemPrompt("Please help me explain UAOS to a friend who may support me financially.");
  }

  function openJobcenterMode() {
    setMessage("Jobcenter support mode ready");
    addAssistantSystemPrompt("Please help me prepare a Jobcenter explanation for UAOS and the need for a better laptop.");
  }

  function addAssistantSystemPrompt(text) {
    const reply = agentReply(text);
    const next = [
      ...assistantMessages,
      { role: "user", text },
      { role: "assistant", text: reply },
    ];
    setAssistantMessages(next);
    speakIfAllowed(reply);
  }

  function sendAssistantMessage() {
    const trimmed = assistantInput.trim();
    if (!trimmed) return;
    const reply = agentReply(trimmed);
    const next = [
      ...assistantMessages,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ];
    setAssistantMessages(next);
    setAssistantInput("");
    speakIfAllowed(reply);
  }

  function speakIfAllowed(text) {
    if (!assistantVoiceOn) return;
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function toggleTrack(trackId) {
    const exists = activeProject.enabledTracks.includes(trackId);
    const enabledTracks = exists
      ? activeProject.enabledTracks.filter((id) => id !== trackId)
      : [...activeProject.enabledTracks, trackId];

    updateProject({
      enabledTracks,
      generatedAt: null,
    });
    setMessage("Track selection updated");
  }

  function openProject(projectId) {
    const found = projects.find((p) => p.id === projectId);
    if (!found) return;
    setActiveProjectId(found.id);
    localStorage.setItem(ACTIVE_KEY, found.id);
    setTitle(found.title);
    setSelectedTemplateId(found.templateId);
    setSelectedSectionName(found.sections[0]?.name || "Intro");
    setMessage("Project opened");
  }

  return (
    <main className="uaos-v8-app">
      <aside className="uaos-v8-sidebar">
        <div className="uaos-v8-brand">
          <div className="uaos-v8-logo">U</div>
          <div>
            <strong>UAOS</strong>
            <span>Single-language workstation</span>
          </div>
        </div>

        <nav className="uaos-v8-nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#command-center">Command Center</a>
          <a href="#projects">Projects</a>
          <a href="#arranger">Arranger</a>
          <a href="#assistant">Pixi Assistant</a>
          <a href="#export">Export</a>
        </nav>

        <div className="uaos-v8-safety">
          <strong>Safety gates</strong>
          <span>One language only</span>
          <span>No public publish</span>
          <span>No device writer</span>
          <span>Local workflow only</span>
        </div>
      </aside>

      <section className="uaos-v8-main">
        <section className="uaos-v8-topbar" id="dashboard">
          <div>
            <span>Active session</span>
            <strong>{activeProject.title}</strong>
          </div>
          <div className="uaos-v8-topbar-status">
            <b>{managerReadiness}% Manager Ready</b>
            <small>{message}</small>
          </div>
        </section>

        <section className="uaos-v8-hero">
          <div>
            <p className="uaos-v8-kicker">UAOS V8.1 Manager Ready</p>
            <h1>Unified Command Session</h1>
            <p>
              One clean language, one grouped action bar, and one living-style assistant shell
              inside the product experience.
            </p>
          </div>
          <div className="uaos-v8-readiness">
            <span>Manager status</span>
            <strong>{managerReadiness}% Ready</strong>
            <p>Demo, support packs, assistant, export, and presentation are ready. Final writer remains blocked for real-device testing.</p>
          </div>
        </section>

        
        <section className="uaos-v8-panel" id="manager-readiness">
          <div className="uaos-v8-panel-header">
            <p>Manager View</p>
            <h2>Manager Readiness</h2>
            <span>This separates product-demo readiness from the active project session checklist.</span>
          </div>

          <div className="uaos-manager-ready-grid">
            <article>
              <strong>90%</strong>
              <p>Presentation / support / demo readiness</p>
            </article>
            <article>
              <strong>Ready</strong>
              <p>Unified UI, Command Center, Pixi Assistant, Friend/Jobcenter flow, safe export.</p>
            </article>
            <article>
              <strong>Blocked</strong>
              <p>Final writer and real keyboard output remain blocked until real hardware testing.</p>
            </article>
          </div>
        </section>

        <section className="uaos-v8-panel" id="command-center">
          <div className="uaos-v8-panel-header">
            <p>Action Bar</p>
            <h2>Command Center</h2>
            <span>All main actions grouped together in one place.</span>
          </div>

          <div className="uaos-v8-command-bar">
            <button onClick={createNewProject}>New Project</button>
            <button onClick={saveProject}>Save</button>
            <button onClick={generateProject}>Generate</button>
            <button onClick={openFriendMode}>Friend</button>
            <button onClick={openJobcenterMode}>Jobcenter</button>
            <button onClick={exportSummary}>Export</button>
            <button className="primary" onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play"}
            </button>
          </div>

          <div className="uaos-v8-checklist">
            {checklist.map((item) => (
              <div key={item.label} className={item.done ? "done" : ""}>
                <span>{item.done ? "✓" : "•"}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="uaos-v8-grid">
          <section className="uaos-v8-panel" id="projects">
            <div className="uaos-v8-panel-header">
              <p>Projects</p>
              <h2>Project Setup</h2>
              <span>Create and manage your current working arrangement.</span>
            </div>

            <div className="uaos-v8-form">
              <label>
                Project title
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>

              <label>
                Template
                <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="uaos-v8-project-list">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={project.id === activeProject.id ? "active" : ""}
                  onClick={() => openProject(project.id)}
                >
                  <strong>{project.title}</strong>
                  <span>{project.templateName}</span>
                  <small>{project.bpm} BPM · {project.key}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="uaos-v8-panel" id="arranger">
            <div className="uaos-v8-panel-header">
              <p>Arranger</p>
              <h2>Sections and Tracks</h2>
              <span>Review arrangement sections and enable or mute tracks.</span>
            </div>

            <div className="uaos-v8-sections">
              {arrangement.map((section) => (
                <button
                  key={section.name}
                  className={selectedSectionName === section.name ? "active" : ""}
                  onClick={() => setSelectedSectionName(section.name)}
                >
                  <strong>{section.name}</strong>
                  <span>{section.bars} bars</span>
                  <small>{section.energy}%</small>
                </button>
              ))}
            </div>

            <div className="uaos-v8-section-detail">
              <strong>{selectedSection?.name}</strong>
              <p>{selectedSection?.chord}</p>
              <span>{selectedSection?.cue}</span>
            </div>

            <div className="uaos-v8-tracks">
              {trackRoles.map((track) => {
                const active = activeProject.enabledTracks.includes(track.id);
                return (
                  <button
                    key={track.id}
                    className={active ? "active" : ""}
                    onClick={() => toggleTrack(track.id)}
                  >
                    <strong>{track.name}</strong>
                    <small>{track.pattern}</small>
                  </button>
                );
              })}
            </div>
          </section>
        </section>

        <section className="uaos-v8-panel" id="assistant">
          <div className="uaos-v8-panel-header">
            <p>Assistant</p>
            <h2>{assistantName}</h2>
            <span>A living-style in-app assistant shell for project help, support preparation, and calm questions.</span>
          </div>

          <div className="uaos-v8-assistant-shell">
            <div className="uaos-v8-assistant-head">
              <div className="uaos-v8-avatar">P</div>
              <div>
                <strong>{assistantName}</strong>
                <small>Voice enabled: {assistantVoiceOn ? "On" : "Off"}</small>
              </div>
              <button onClick={() => setAssistantVoiceOn(!assistantVoiceOn)}>
                {assistantVoiceOn ? "Mute Voice" : "Enable Voice"}
              </button>
            </div>

            <div className="uaos-v8-assistant-quick">
              <button onClick={() => addAssistantSystemPrompt("Help me prepare a friend support message.")}>Friend Help</button>
              <button onClick={() => addAssistantSystemPrompt("Help me prepare a Jobcenter explanation.")}>Jobcenter Help</button>
              <button onClick={() => addAssistantSystemPrompt("Why do I need a stronger laptop?")}>Laptop Need</button>
              <button onClick={() => addAssistantSystemPrompt("Help me plan my music project.")}>Music Plan</button>
              <button onClick={() => addAssistantSystemPrompt("I want to think about fear, death, or life questions.")}>Life Questions</button>
            </div>

            <div className="uaos-v8-chat">
              {assistantMessages.map((item, index) => (
                <div key={index} className={item.role === "assistant" ? "assistant" : "user"}>
                  <span>{item.role === "assistant" ? assistantName : "You"}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>

            <div className="uaos-v8-chat-input">
              <input
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="Ask Pixi about UAOS, support, laptop funding, music workflow, or life questions..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendAssistantMessage();
                }}
              />
              <button onClick={sendAssistantMessage}>Send</button>
            </div>
          </div>
        </section>

        <section className="uaos-v8-panel" id="export">
          <div className="uaos-v8-panel-header">
            <p>Export</p>
            <h2>Safe Export Center</h2>
            <span>Export safe local summary files only.</span>
          </div>

          <div className="uaos-v8-export-row">
            <article>
              <strong>Summary JSON</strong>
              <p>Exports a safe local project summary.</p>
              <button onClick={exportSummary}>Download Summary</button>
            </article>

            <article>
              <strong>Friend / Jobcenter flow</strong>
              <p>Use the action bar or Pixi quick prompts to prepare support explanations.</p>
            </article>

            <article>
              <strong>Writer status</strong>
              <p>Still blocked. No public publish, no device writer, no real keyboard output.</p>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}

