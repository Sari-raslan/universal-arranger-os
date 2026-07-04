const SAFETY_LABELS = [
  "PC_ONLY",
  "UAOS_FORMAT",
  "TEST_UNVERIFIED",
  "NOT_FOR_PA3X_LOAD",
  "NOT_FOR_USB_TRANSFER",
  "NOT_COMPATIBILITY_VERIFIED"
];

const defaultProject = {
  version: "V21",
  project_name: "Sari UAOS PC Workstation V21",
  style_name: "Arabic Pop Oriental Ballad",
  tempo_bpm: 102,
  meter: "4/4",
  key_scale: "Dm / Hijaz color hints",
  chords: "Dm / Bb / C / A7",
  mood: "Emotional Arabic pop ballad with modern PC workstation workflow",
  arabic_strings: "Arabic Strings Tremolo Light",
  notes: "Local browser project metadata only. Synthetic preview only. No samples included.",
  safety_labels: SAFETY_LABELS
};

const defaultSections = [
  { name: "Intro", bars: 4, chords: "Dm / C", energy: "low", focus_track: "arabic_strings" },
  { name: "Verse", bars: 8, chords: "Dm / Bb / C / A7", energy: "medium", focus_track: "bass" },
  { name: "Chorus", bars: 8, chords: "F / C / Dm / Bb", energy: "high", focus_track: "arabic_strings" },
  { name: "Bridge", bars: 4, chords: "Gm / Bb / A7 / A7", energy: "medium", focus_track: "pad" },
  { name: "Fill", bars: 1, chords: "A7", energy: "high", focus_track: "drums" },
  { name: "Ending", bars: 4, chords: "Dm / Bb / C / Dm", energy: "low", focus_track: "arabic_strings" }
];

const defaultTracks = [
  { id: "drums", label: "Drums", enabled: true, volume: 78, pan: 0, preset: "Synthetic Pop Kit Guide" },
  { id: "bass", label: "Bass", enabled: true, volume: 72, pan: -8, preset: "Soft Root Bass" },
  { id: "chords", label: "Chords", enabled: true, volume: 66, pan: 8, preset: "Warm Keys Guide" },
  { id: "pad", label: "Pad", enabled: true, volume: 58, pan: 18, preset: "Air Pad" },
  { id: "arabic_strings", label: "Arabic Strings", enabled: true, volume: 82, pan: 0, preset: "Arabic Strings Tremolo Light" },
  { id: "melody_guide", label: "Melody Guide", enabled: false, volume: 52, pan: 0, preset: "Sine Lead Placeholder" }
];

const presets = [
  { name: "Arabic Strings Ensemble Soft", family: "strings", articulations: ["sustain", "slide_hint", "ornament_hint"], role: "warm backing layers" },
  { name: "Arabic Strings Tremolo Light", family: "strings", articulations: ["sustain", "tremolo", "ornament_hint"], role: "light tremolo movement" },
  { name: "Arabic Strings Octave Lead", family: "strings", articulations: ["sustain", "slide_hint", "octave_layer"], role: "melody guide doubling" },
  { name: "Arabic Strings Pad Wide", family: "strings", articulations: ["sustain", "octave_layer"], role: "wide cinematic pad" },
  { name: "Arabic Violin Guide", family: "violin", articulations: ["sustain", "slide_hint", "ornament_hint"], role: "lead guide" },
  { name: "Syrian Strings Emotional Pad", family: "strings", articulations: ["sustain", "tremolo", "slide_hint"], role: "emotional bridge layer" },
  { name: "Oriental Strings Short Marcato", family: "strings", articulations: ["staccato", "ornament_hint"], role: "short rhythmic accents" },
  { name: "Arabic Strings Slow Swell", family: "strings", articulations: ["sustain", "slide_hint", "octave_layer"], role: "slow intro and ending swell" }
];

const appState = {
  view: "dashboard",
  project: structuredClone(defaultProject),
  sections: structuredClone(defaultSections),
  tracks: structuredClone(defaultTracks),
  selectedSection: 0,
  selectedPreset: 1,
  audioCtx: null,
  timers: [],
  oscillators: [],
  playing: false,
  currentChord: "-",
  currentSection: "-"
};

function $(id) {
  return document.getElementById(id);
}

function saveState() {
  const payload = {
    project: appState.project,
    sections: appState.sections,
    tracks: appState.tracks,
    selectedSection: appState.selectedSection,
    selectedPreset: appState.selectedPreset
  };
  localStorage.setItem("uaos_pc_workstation_v21_state", JSON.stringify(payload));
  setStatus("Session saved in browser memory.");
}

function loadState() {
  const saved = localStorage.getItem("uaos_pc_workstation_v21_state");
  if (!saved) return;
  try {
    const payload = JSON.parse(saved);
    appState.project = { ...structuredClone(defaultProject), ...(payload.project || {}) };
    appState.sections = Array.isArray(payload.sections) ? payload.sections : structuredClone(defaultSections);
    appState.tracks = Array.isArray(payload.tracks) ? payload.tracks : structuredClone(defaultTracks);
    appState.selectedSection = Number.isInteger(payload.selectedSection) ? payload.selectedSection : 0;
    appState.selectedPreset = Number.isInteger(payload.selectedPreset) ? payload.selectedPreset : 1;
  } catch (error) {
    setStatus("Saved session could not be read. Defaults loaded.");
  }
}

function switchView(view) {
  appState.view = view;
  document.querySelectorAll(".nav-btn, .view").forEach((node) => node.classList.remove("active"));
  document.querySelector(`.nav-btn[data-view="${view}"]`)?.classList.add("active");
  $(view)?.classList.add("active");
  updateInspector();
  setStatus(`Opened ${view} panel.`);
}

function bindNavigation() {
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  document.querySelectorAll("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.goto));
  });
}

function projectPayload() {
  return {
    ...appState.project,
    version: "V21",
    format: "UAOS_FORMAT",
    safety_labels: SAFETY_LABELS
  };
}

function stylePayload() {
  return {
    version: "V21",
    format: "UAOS_FORMAT",
    style_name: appState.project.style_name,
    safety_labels: SAFETY_LABELS,
    sections: appState.sections,
    tracks: appState.tracks
  };
}

function arrangementPayload() {
  return {
    version: "V21",
    format: "UAOS_FORMAT",
    safety_labels: SAFETY_LABELS,
    project_name: appState.project.project_name,
    sections: appState.sections
  };
}

function libraryPayload() {
  return {
    version: "V21",
    format: "UAOS_FORMAT",
    safety_labels: SAFETY_LABELS,
    metadata_only: true,
    audio_files_included: false,
    selected_preset: presets[appState.selectedPreset],
    all_presets: presets
  };
}

function exportJson(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  setStatus(`Exported ${fileName}.`);
}

function bindExports() {
  $("saveSession").addEventListener("click", saveState);
  $("exportProjectTop").addEventListener("click", () => exportJson("uaos_project_v21.json", projectPayload()));
  $("exportStyleTop").addEventListener("click", () => exportJson("uaos_style_v21.json", stylePayload()));
  $("exportLibraryTop").addEventListener("click", () => exportJson("uaos_library_binding_v21.json", libraryPayload()));
  $("exportProject").addEventListener("click", () => exportJson("uaos_project_v21.json", projectPayload()));
  $("exportArrangement").addEventListener("click", () => exportJson("uaos_arrangement_v21.json", arrangementPayload()));
  $("exportStyle").addEventListener("click", () => exportJson("uaos_style_v21.json", stylePayload()));
  $("exportLibrary").addEventListener("click", () => exportJson("uaos_library_binding_v21.json", libraryPayload()));
}

function renderDashboard() {
  $("dashProject").textContent = appState.project.project_name;
  $("dashStyle").textContent = appState.project.style_name;
  $("dashTempo").textContent = `${appState.project.tempo_bpm} BPM`;
  $("dashChords").textContent = appState.project.chords;
  $("dashStrings").textContent = presets[appState.selectedPreset].name;
  $("topProjectName").textContent = `${appState.project.project_name} / ${appState.project.style_name}`;
  renderMiniTimeline("dashTimeline");
}

function renderProjectForm() {
  const p = appState.project;
  $("projectName").value = p.project_name;
  $("styleName").value = p.style_name;
  $("tempo").value = p.tempo_bpm;
  $("meter").value = p.meter;
  $("keyScale").value = p.key_scale;
  $("mood").value = p.mood;
  $("notes").value = p.notes;
}

function applyProjectChanges() {
  appState.project.project_name = $("projectName").value.trim() || defaultProject.project_name;
  appState.project.style_name = $("styleName").value.trim() || defaultProject.style_name;
  appState.project.tempo_bpm = Number($("tempo").value) || defaultProject.tempo_bpm;
  appState.project.meter = $("meter").value.trim() || defaultProject.meter;
  appState.project.key_scale = $("keyScale").value.trim() || defaultProject.key_scale;
  appState.project.mood = $("mood").value.trim() || defaultProject.mood;
  appState.project.notes = $("notes").value.trim();
  saveState();
  renderAll();
}

function resetProject() {
  appState.project = structuredClone(defaultProject);
  appState.sections = structuredClone(defaultSections);
  appState.tracks = structuredClone(defaultTracks);
  appState.selectedSection = 0;
  appState.selectedPreset = 1;
  localStorage.removeItem("uaos_pc_workstation_v21_state");
  renderAll();
  setStatus("V21 defaults restored.");
}

function renderMiniTimeline(targetId) {
  const target = $(targetId);
  target.innerHTML = appState.sections.map((section, index) => `
    <button class="section-tile ${index === appState.selectedSection ? "active" : ""}" data-section="${index}" type="button">
      <h4>${section.name}</h4>
      <p>${section.bars} bars</p>
      <p>${section.chords}</p>
      <div class="energy" data-energy="${section.energy}"><span></span></div>
    </button>
  `).join("");
  target.querySelectorAll("[data-section]").forEach((tile) => {
    tile.addEventListener("click", () => selectSection(Number(tile.dataset.section)));
  });
}

function selectSection(index) {
  appState.selectedSection = Math.max(0, Math.min(index, appState.sections.length - 1));
  appState.currentSection = appState.sections[appState.selectedSection].name;
  renderAll();
  setStatus(`Selected arrangement section: ${appState.currentSection}.`);
}

function duplicateSection() {
  const source = appState.sections[appState.selectedSection];
  const copy = { ...source, name: `${source.name} Copy` };
  appState.sections.splice(appState.selectedSection + 1, 0, copy);
  appState.selectedSection += 1;
  renderAll();
  saveState();
}

function renderArrangement() {
  renderMiniTimeline("arrangementTimeline");
  $("duplicateSection").onclick = duplicateSection;
}

function renderStyleEditor() {
  const sectionBody = $("sectionRows");
  sectionBody.innerHTML = appState.sections.map((section, index) => `
    <tr>
      <td><input value="${section.name}" data-section-field="name" data-index="${index}"></td>
      <td><input type="number" min="1" max="32" value="${section.bars}" data-section-field="bars" data-index="${index}"></td>
      <td><input value="${section.chords}" data-section-field="chords" data-index="${index}"></td>
      <td>
        <select data-section-field="energy" data-index="${index}">
          ${["low", "medium", "high"].map((value) => `<option value="${value}" ${value === section.energy ? "selected" : ""}>${value}</option>`).join("")}
        </select>
      </td>
      <td><input value="${section.focus_track}" data-section-field="focus_track" data-index="${index}"></td>
    </tr>
  `).join("");

  sectionBody.querySelectorAll("[data-section-field]").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.index);
      const field = input.dataset.sectionField;
      appState.sections[index][field] = field === "bars" ? Number(input.value) : input.value;
      renderAll();
      saveState();
    });
  });

  const mixer = $("mixerRows");
  mixer.innerHTML = appState.tracks.map((track, index) => `
    <article class="track-row">
      <header>
        <b>${track.label}</b>
        <label><input type="checkbox" ${track.enabled ? "checked" : ""} data-track-field="enabled" data-index="${index}"> Enabled</label>
      </header>
      <div class="slider-line"><span>Volume</span><input type="range" min="0" max="100" value="${track.volume}" data-track-field="volume" data-index="${index}"><b>${track.volume}</b></div>
      <div class="slider-line"><span>Pan</span><input type="range" min="-50" max="50" value="${track.pan}" data-track-field="pan" data-index="${index}"><b>${track.pan}</b></div>
      <p>${track.preset}</p>
    </article>
  `).join("");

  mixer.querySelectorAll("[data-track-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.index);
      const field = input.dataset.trackField;
      appState.tracks[index][field] = field === "enabled" ? input.checked : Number(input.value);
      renderStyleEditor();
      saveState();
      updateInspector();
    });
  });
}

function selectPreset(index) {
  appState.selectedPreset = index;
  appState.project.arabic_strings = presets[index].name;
  const stringTrack = appState.tracks.find((track) => track.id === "arabic_strings");
  if (stringTrack) stringTrack.preset = presets[index].name;
  renderAll();
  saveState();
  setStatus(`Selected library preset: ${presets[index].name}.`);
}

function renderLibrary() {
  $("presetGrid").innerHTML = presets.map((preset, index) => `
    <article class="preset-card ${index === appState.selectedPreset ? "active" : ""}" data-preset="${index}">
      <h3>${preset.name}</h3>
      <p>${preset.role}</p>
      <span class="badge gray">${preset.family}</span>
      <div class="badge-list">${preset.articulations.map((item) => `<span class="badge">${item}</span>`).join("")}</div>
    </article>
  `).join("");
  $("presetGrid").querySelectorAll("[data-preset]").forEach((card) => {
    card.addEventListener("click", () => selectPreset(Number(card.dataset.preset)));
  });
}

function noteFrequency(root) {
  const map = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392, A: 440, B: 493.88, Bb: 466.16, Dm: 293.66, Gm: 392, A7: 440 };
  return map[root] || map[root.replace("m", "")] || 293.66;
}

function getAudioContext() {
  if (!appState.audioCtx) appState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return appState.audioCtx;
}

function tone(frequency, start, duration, type, gain, pan = 0) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const stereo = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  osc.type = type;
  osc.frequency.value = frequency;
  amp.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.025);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  if (stereo) {
    stereo.pan.value = pan;
    osc.connect(amp).connect(stereo).connect(ctx.destination);
  } else {
    osc.connect(amp).connect(ctx.destination);
  }
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.04);
  appState.oscillators.push(osc);
}

function stopAudio() {
  appState.timers.forEach(clearTimeout);
  appState.timers = [];
  appState.oscillators.forEach((osc) => {
    try { osc.stop(); } catch (error) { /* already stopped */ }
  });
  appState.oscillators = [];
  appState.playing = false;
  appState.currentChord = "-";
  appState.currentSection = "-";
  $("playhead").classList.remove("playing");
  renderPlayerState();
  setStatus("Preview stopped.");
}

function playPreview(mode) {
  stopAudio();
  appState.playing = true;
  $("playhead").classList.add("playing");
  const sections = appState.sections;
  const chords = appState.project.chords.split("/").map((chord) => chord.trim()).filter(Boolean);
  const step = 0.62;
  const loops = Math.max(8, chords.length * 3);
  for (let i = 0; i < loops; i += 1) {
    const chord = chords[i % chords.length];
    const section = sections[i % sections.length];
    const rootFrequency = noteFrequency(chord.split(" ")[0]);
    appState.timers.push(setTimeout(() => {
      appState.currentChord = chord;
      appState.currentSection = section.name;
      renderPlayerState();
      updateInspector();
    }, i * step * 1000));
    if (mode === "bass" || mode === "full") tone(rootFrequency / 2, i * step, 0.46, "sine", 0.14, -0.2);
    if (mode === "chords" || mode === "full") {
      tone(rootFrequency, i * step, 0.42, "triangle", 0.07, 0.08);
      tone(rootFrequency * 1.25, i * step, 0.42, "triangle", 0.05, -0.08);
      tone(rootFrequency * 1.5, i * step, 0.42, "triangle", 0.04, 0.14);
    }
    if (mode === "strings" || mode === "full") {
      tone(rootFrequency * 2, i * step, 0.58, "sawtooth", 0.025, -0.18);
      tone(rootFrequency * 2.01, i * step, 0.58, "sawtooth", 0.022, 0.18);
    }
  }
  appState.timers.push(setTimeout(stopAudio, loops * step * 1000 + 400));
  setStatus(`Playing ${mode} synthetic preview. No samples.`);
  renderPlayerState();
}

function renderPlayerState() {
  $("nowMode").textContent = appState.playing ? "Playing" : "Stopped";
  $("nowChord").textContent = appState.currentChord;
  $("nowSection").textContent = appState.currentSection;
}

function bindPlayer() {
  document.querySelectorAll("[data-play]").forEach((button) => {
    button.addEventListener("click", () => playPreview(button.dataset.play));
  });
  $("stopAudio").addEventListener("click", stopAudio);
}

function updateInspector() {
  const section = appState.sections[appState.selectedSection] || appState.sections[0];
  const preset = presets[appState.selectedPreset];
  $("inspectorBody").innerHTML = `
    <div class="kv"><b>Project</b><span>${appState.project.project_name}</span></div>
    <div class="kv"><b>Style</b><span>${appState.project.style_name}</span></div>
    <div class="kv"><b>BPM</b><span>${appState.project.tempo_bpm} / ${appState.project.meter}</span></div>
    <div class="kv"><b>Chords</b><span>${appState.project.chords}</span></div>
    <div class="kv"><b>Section</b><span>${section.name}: ${section.bars} bars, ${section.energy}, ${section.focus_track}</span></div>
    <div class="kv"><b>Preset</b><span>${preset.name}</span></div>
    <div class="kv"><b>Now</b><span>${appState.currentSection} / ${appState.currentChord}</span></div>
    <div class="kv"><b>Safety</b><span>${SAFETY_LABELS.join(" / ")}</span></div>
  `;
}

function setStatus(message) {
  $("statusMessage").textContent = message;
}

function bindProjectButtons() {
  $("applyProject").addEventListener("click", applyProjectChanges);
  $("resetProject").addEventListener("click", resetProject);
}

function renderAll() {
  renderDashboard();
  renderProjectForm();
  renderArrangement();
  renderStyleEditor();
  renderLibrary();
  renderPlayerState();
  updateInspector();
}

function init() {
  loadState();
  bindNavigation();
  bindExports();
  bindProjectButtons();
  bindPlayer();
  renderAll();
  switchView("dashboard");
  setStatus("UAOS PC Workstation V21 ready. PC-only local interface.");
}

document.addEventListener("DOMContentLoaded", init);
