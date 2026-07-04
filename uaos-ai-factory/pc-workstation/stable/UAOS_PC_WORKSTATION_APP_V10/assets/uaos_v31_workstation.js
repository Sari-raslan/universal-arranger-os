(function () {
  "use strict";

  const state = {
    panel: "dashboard",
    selectedSectionId: "intro",
    selectedPreset: "Arabic Strings Tremolo Light",
    audioContext: null,
    activeNodes: [],
    playTimer: null,
    arrangement: [
      { id: "intro", name: "Intro", bars: 4, chord: "Dm", focus: "quiet entrance" },
      { id: "verse", name: "Verse", bars: 16, chord: "Gm", focus: "steady groove" },
      { id: "chorus", name: "Chorus", bars: 16, chord: "A7", focus: "wide strings" },
      { id: "bridge", name: "Bridge", bars: 8, chord: "Bb", focus: "short lift" },
      { id: "fill", name: "Fill", bars: 1, chord: "A7", focus: "turnaround" },
      { id: "ending", name: "Ending", bars: 4, chord: "Dm", focus: "clean ending" }
    ],
    mixer: [
      { name: "Drums", volume: 72, muted: false },
      { name: "Bass", volume: 66, muted: false },
      { name: "Chords", volume: 62, muted: false },
      { name: "Pad", volume: 54, muted: false },
      { name: "Arabic Strings", volume: 78, muted: false },
      { name: "Melody Guide", volume: 58, muted: true }
    ],
    presets: ["Arabic Strings Tremolo Light", "Oriental Pad Soft", "Pop Bass Guide", "Darbuka Synthetic Guide"]
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function setLastAction(message) {
    $("#lastAction").textContent = `Last action: ${message}`;
    $("#inspectAction").textContent = message;
  }

  function currentSection() {
    return state.arrangement.find((section) => section.id === state.selectedSectionId) || state.arrangement[0];
  }

  function navigate(panel) {
    state.panel = panel;
    $all(".panel-view").forEach((view) => view.classList.toggle("active", view.id === panel));
    $all(".nav").forEach((button) => button.classList.toggle("active", button.dataset.panel === panel));
    setLastAction(`Opened ${panel}`);
  }

  function selectSection(sectionId) {
    state.selectedSectionId = sectionId;
    const section = currentSection();
    $("#sectionTitle").textContent = section.name;
    $("#sectionBars").value = section.bars;
    $("#sectionChord").value = section.chord;
    $("#sectionFocus").value = section.focus;
    $("#inspectSection").textContent = section.name;
    $("#inspectChord").textContent = section.chord;
    $("#currentChord").textContent = `Current chord: ${section.chord}`;
    renderTimeline();
    setLastAction(`Selected ${section.name}`);
  }

  function renderTimeline() {
    const html = state.arrangement.map((section) => `
      <button class="section-block ${section.id === state.selectedSectionId ? "active" : ""}" data-section="${section.id}" style="grid-column: span ${Math.max(section.bars, 1)}">
        <strong>${section.name}</strong>
        <span>${section.bars} bars</span>
        <span>${section.chord}</span>
      </button>`).join("");
    ["#timeline", "#arrangementTimeline"].forEach((selector) => {
      const target = $(selector);
      if (target) target.innerHTML = html;
    });
  }

  function saveSectionEdit() {
    const section = currentSection();
    section.bars = Number($("#sectionBars").value || section.bars);
    section.chord = $("#sectionChord").value.trim() || section.chord;
    section.focus = $("#sectionFocus").value.trim() || section.focus;
    selectSection(section.id);
    setLastAction(`Edited ${section.name}`);
  }

  function renderMixer() {
    const html = state.mixer.map((track, index) => `
      <div class="track-row" data-track="${index}">
        <span class="track-name">${track.name}</span>
        <button class="ghost mute ${track.muted ? "active" : ""}" data-track="${index}">Mute</button>
        <input class="volume" type="range" min="0" max="100" value="${track.volume}" data-track="${index}">
        <div class="meter"><div style="width:${track.muted ? 0 : track.volume}%"></div></div>
      </div>`).join("");
    ["#mixer", "#mixerPanel"].forEach((selector) => {
      const target = $(selector);
      if (target) target.innerHTML = html;
    });
  }

  function updateTrack(index, patch) {
    state.mixer[index] = Object.assign({}, state.mixer[index], patch);
    renderMixer();
    setLastAction(`Mixer ${state.mixer[index].name}`);
  }

  function renderPresets() {
    $("#presetRack").innerHTML = state.presets.map((preset) => `
      <button class="preset-card ${preset === state.selectedPreset ? "active" : ""}" data-preset="${preset}">
        <strong>${preset}</strong>
        <span>${preset === state.selectedPreset ? "selected" : "ready"}</span>
      </button>`).join("");
    $("#inspectPreset").textContent = state.selectedPreset;
    $("#libraryFocus").textContent = state.selectedPreset;
  }

  function exportJson(name, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
    setLastAction(`Exported ${name}`);
  }

  function projectPayload() {
    return {
      projectName: $("#projectName").value.trim(),
      styleName: $("#styleName").value.trim(),
      bpm: Number($("#projectBpm").value || $("#bpmInput").value || 96),
      mainChords: $("#projectChords").value.trim(),
      selectedPreset: state.selectedPreset,
      arrangement: state.arrangement,
      mixer: state.mixer,
      safety: ["PC_ONLY", "TEST_UNVERIFIED", "NOT_FOR_PA3X_LOAD"]
    };
  }

  function saveSession() {
    const payload = projectPayload();
    localStorage.setItem("uaos_v31_session", JSON.stringify(payload));
    $("#topProject").textContent = payload.projectName;
    $("#topStyle").textContent = payload.styleName;
    $("#bpmInput").value = payload.bpm;
    setLastAction("Session saved");
  }

  function loadSession() {
    const raw = localStorage.getItem("uaos_v31_session");
    if (!raw) {
      setLastAction("No saved session");
      return;
    }
    const payload = JSON.parse(raw);
    $("#projectName").value = payload.projectName || "Sari Oriental Ballad";
    $("#styleName").value = payload.styleName || "Arabic Pop Oriental";
    $("#projectBpm").value = payload.bpm || 96;
    $("#bpmInput").value = payload.bpm || 96;
    $("#projectChords").value = payload.mainChords || "Dm | Gm | A7 | Dm";
    state.arrangement = payload.arrangement || state.arrangement;
    state.mixer = payload.mixer || state.mixer;
    state.selectedPreset = payload.selectedPreset || state.selectedPreset;
    renderAll();
    setLastAction("Session loaded");
  }

  function stopPreview() {
    if (state.playTimer) clearInterval(state.playTimer);
    state.playTimer = null;
    state.activeNodes.forEach((node) => {
      try { node.stop(); } catch (error) { /* already stopped */ }
    });
    state.activeNodes = [];
    $("#playhead").style.width = "0%";
    setLastAction("Stopped");
  }

  function scheduleTone(frequency, start, duration, type, gainValue) {
    const context = state.audioContext;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    gain.gain.setValueAtTime(0.0001, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(gainValue, context.currentTime + start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.02);
    state.activeNodes.push(oscillator);
  }

  function playPreview(mode) {
    stopPreview();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      setLastAction("WebAudio unavailable");
      return;
    }
    state.audioContext = state.audioContext || new AudioContext();
    const section = currentSection();
    const modes = {
      full: [146.83, 220, 293.66, 349.23, 440, 587.33],
      chords: [146.83, 220, 293.66, 349.23],
      bass: [73.42, 98, 110, 146.83],
      strings: [293.66, 349.23, 440, 587.33]
    };
    (modes[mode] || modes.full).forEach((note, index) => {
      scheduleTone(note, index * 0.22, 0.46, mode === "bass" ? "triangle" : "sine", mode === "full" ? 0.06 : 0.08);
    });
    let progress = 0;
    state.playTimer = setInterval(() => {
      progress = Math.min(progress + 10, 100);
      $("#playhead").style.width = `${progress}%`;
      if (progress >= 100) clearInterval(state.playTimer);
    }, 160);
    setLastAction(`Playing ${mode} / ${section.chord}`);
  }

  function runSelfTest() {
    const required = [
      ".transport-bar", "#timeline", "#mixer", ".inspector", ".status-bar",
      "#sectionBars", "#presetRack", "#playFull", "#exportProject"
    ];
    const functionsOk = [
      selectSection, exportJson, playPreview, stopPreview, saveSession, loadSession, runSelfTest
    ].every((fn) => typeof fn === "function");
    const labelsOk = document.body.textContent.includes("PC_ONLY") && document.body.textContent.includes("No PA3X");
    const forbiddenTerms = [
      ["PA3X", "READY"],
      ["KORG", "COMPATIBLE"],
      ["LOAD", "TO", "PA3X"],
      ["USB", "COPY", "EXECUTED"],
      ["REAL", "PA3X", "SET"],
      ["HARDWARE", "VERIFIED"]
    ].map((parts) => parts.join("_"));
    const forbiddenOk = forbiddenTerms.every((term) => !document.body.textContent.includes(term));
    const ok = required.every((selector) => Boolean($(selector))) && functionsOk && labelsOk && forbiddenOk;
    $("#selfTestStatus").textContent = ok ? "PASS" : "WARN";
    setLastAction(ok ? "Self-test PASS" : "Self-test WARN");
    return ok;
  }

  function bindEvents() {
    $all(".nav").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.panel)));
    document.body.addEventListener("click", (event) => {
      const section = event.target.closest("[data-section]");
      if (section) selectSection(section.dataset.section);
      const mute = event.target.closest(".mute");
      if (mute) {
        const index = Number(mute.dataset.track);
        updateTrack(index, { muted: !state.mixer[index].muted });
      }
      const preset = event.target.closest("[data-preset]");
      if (preset) {
        state.selectedPreset = preset.dataset.preset;
        renderPresets();
        setLastAction(`Preset ${state.selectedPreset}`);
      }
    });
    document.body.addEventListener("input", (event) => {
      if (event.target.matches(".volume")) {
        updateTrack(Number(event.target.dataset.track), { volume: Number(event.target.value) });
      }
      if (event.target.id === "bpmInput") {
        $("#projectBpm").value = event.target.value;
      }
    });
    $("#saveSection").addEventListener("click", saveSectionEdit);
    $("#saveSession").addEventListener("click", saveSession);
    $("#loadSession").addEventListener("click", loadSession);
    $("#playFull").addEventListener("click", () => playPreview("full"));
    $("#stopPreview").addEventListener("click", stopPreview);
    $("#stopPlayer").addEventListener("click", stopPreview);
    $all(".play-mode").forEach((button) => button.addEventListener("click", () => playPreview(button.dataset.mode)));
    $("#exportProject").addEventListener("click", () => exportJson("uaos-v31-project.json", projectPayload()));
    $("#exportArrangement").addEventListener("click", () => exportJson("uaos-v31-arrangement.json", { sections: state.arrangement }));
    $("#exportLibrary").addEventListener("click", () => exportJson("uaos-v31-library.json", { selectedPreset: state.selectedPreset, presets: state.presets }));
    $("#openWriter").addEventListener("click", () => navigate("writer"));
    $("#writerButton").addEventListener("click", () => setLastAction("Writer path shown"));
    $("#runSelfTest").addEventListener("click", runSelfTest);
  }

  function renderAll() {
    renderTimeline();
    renderMixer();
    renderPresets();
    selectSection(state.selectedSectionId);
  }

  function init() {
    bindEvents();
    renderAll();
    runSelfTest();
    window.uaosV31 = { selectSection, exportJson, playPreview, stopPreview, saveSession, loadSession, runSelfTest };
  }

  document.addEventListener("DOMContentLoaded", init);
})();
