(function () {
  "use strict";

  const state = {
    activePage: "dashboard",
    selectedPreset: "كمنجات شرقية",
    audioContext: null,
    activeNodes: []
  };

  const styleSections = [
    { section: "Intro", chord: "Dm", feel: "مقدمة هادئة", status: "جاهز" },
    { section: "Verse", chord: "Gm", feel: "إيقاع ثابت", status: "جاهز" },
    { section: "Chorus", chord: "A7", feel: "كمنجات عريضة", status: "مراجعة" },
    { section: "Bridge", chord: "Bb", feel: "تحويل قصير", status: "اختياري" },
    { section: "Fill", chord: "A7", feel: "فاصل سريع", status: "جاهز" },
    { section: "Ending", chord: "Dm", feel: "نهاية واضحة", status: "جاهز" }
  ];

  const presets = [
    { name: "كمنجات شرقية", detail: "طبقة ناعمة للمعاينة العربية", status: "مختار" },
    { name: "وتر حساس", detail: "إحساس أوسع للكورس", status: "جاهز" },
    { name: "Pop Oriental", detail: "مزج حديث مع إيقاع ثابت", status: "جاهز" },
    { name: "Ballad Soft", detail: "هدوء للمقاطع البطيئة", status: "جاهز" }
  ];

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function navigate(pageId) {
    state.activePage = pageId;
    $all(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $all(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.page === pageId));
    const page = document.getElementById(pageId);
    $("#inspectorTitle").textContent = page ? page.dataset.title : "UAOS";
  }

  function projectData() {
    return {
      projectName: $("#projectName").value.trim(),
      styleName: $("#styleName").value.trim(),
      tempo: Number($("#tempo").value || 96),
      chords: $("#chords").value.trim(),
      maqam: $("#maqam").value.trim(),
      notes: $("#notes").value.trim(),
      selectedPreset: state.selectedPreset,
      safety: {
        PC_ONLY: true,
        TEST_UNVERIFIED: true,
        NOT_FOR_PA3X_LOAD: true,
        NOT_FOR_USB_TRANSFER: true,
        NOT_COMPATIBILITY_VERIFIED: true
      }
    };
  }

  function saveProject() {
    const data = projectData();
    localStorage.setItem("uaos_v30_project", JSON.stringify(data));
    $("#currentProjectName").textContent = data.projectName || "UAOS Project";
  }

  function loadProject() {
    const saved = localStorage.getItem("uaos_v30_project");
    if (!saved) return;
    const data = JSON.parse(saved);
    ["projectName", "styleName", "tempo", "chords", "maqam", "notes"].forEach((key) => {
      if (document.getElementById(key) && data[key] !== undefined) document.getElementById(key).value = data[key];
    });
    state.selectedPreset = data.selectedPreset || state.selectedPreset;
    $("#currentProjectName").textContent = data.projectName || "UAOS Project";
    renderPresets();
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
  }

  function renderStyleRows(activeSection) {
    $("#styleRows").innerHTML = styleSections
      .filter((item) => !activeSection || item.section === activeSection)
      .map((item) => `<tr><td>${item.section}</td><td>${item.chord}</td><td>${item.feel}</td><td>${item.status}</td></tr>`)
      .join("");
  }

  function renderPresets() {
    $("#presetGrid").innerHTML = presets.map((preset) => {
      const selected = preset.name === state.selectedPreset ? " selected" : "";
      return `<article class="preset-card${selected}" data-preset="${preset.name}">
        <span class="status safe">${preset.status}</span>
        <h3>${preset.name}</h3>
        <p>${preset.detail}</p>
        <button class="secondary" type="button">اختر</button>
      </article>`;
    }).join("");
    $("#selectedPreset").textContent = state.selectedPreset;
  }

  function stopAudio() {
    state.activeNodes.forEach((node) => {
      try { node.stop(); } catch (error) { /* already stopped */ }
    });
    state.activeNodes = [];
    $("#audioState").textContent = "متوقف";
  }

  function tone(frequency, start, duration, type) {
    const context = state.audioContext;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    gain.gain.setValueAtTime(0.0001, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.03);
    state.activeNodes.push(oscillator);
  }

  function playPreview(kind) {
    stopAudio();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      $("#audioState").textContent = "الصوت غير مدعوم";
      return;
    }
    state.audioContext = state.audioContext || new AudioContext();
    const patterns = {
      strings: [293.66, 349.23, 440, 587.33],
      chords: [146.83, 220, 293.66, 349.23],
      rhythm: [110, 110, 164.81, 110],
      full: [146.83, 293.66, 349.23, 440, 587.33]
    };
    const notes = patterns[kind] || patterns.full;
    notes.forEach((note, index) => tone(note, index * 0.22, 0.42, kind === "rhythm" ? "square" : "sine"));
    $("#audioState").textContent = "يعمل";
  }

  function runSelfTest() {
    const required = [
      "#dashboard", "#project", "#style", "#library", "#player", "#writer", "#files", "#safety",
      "#projectName", "#styleRows", "#presetGrid"
    ];
    const ok = required.every((selector) => Boolean($(selector)));
    $("#selfTestState").textContent = ok ? "PASS" : "WARN";
    return ok;
  }

  function bindEvents() {
    $all(".nav-button, .action-jump").forEach((button) => {
      button.addEventListener("click", () => navigate(button.dataset.page));
    });
    $("#saveProject").addEventListener("click", saveProject);
    $("#loadProject").addEventListener("click", loadProject);
    $("#exportProject").addEventListener("click", () => exportJson("uaos-v30-project.json", projectData()));
    $("#exportStyle").addEventListener("click", () => exportJson("uaos-v30-style.json", { sections: styleSections, project: projectData() }));
    $("#sectionChips").addEventListener("click", (event) => {
      const chip = event.target.closest(".chip");
      if (!chip) return;
      $all(".chip").forEach((item) => item.classList.toggle("active", item === chip));
      renderStyleRows(chip.dataset.section);
    });
    $("#presetGrid").addEventListener("click", (event) => {
      const card = event.target.closest(".preset-card");
      if (!card) return;
      state.selectedPreset = card.dataset.preset;
      renderPresets();
    });
    $all(".transport[data-sound]").forEach((button) => {
      button.addEventListener("click", () => playPreview(button.dataset.sound));
    });
    $("#stopAudio").addEventListener("click", stopAudio);
    $("#runSelfTest").addEventListener("click", runSelfTest);
  }

  function init() {
    renderStyleRows("Intro");
    renderPresets();
    bindEvents();
    loadProject();
    runSelfTest();
    window.uaosV30SelfTest = runSelfTest;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
