import { chooseSampleForNote, normalizeSampleMap, samplePlaybackRate } from "./lib/sampleMap.js";
import { appendTimelineSection, DEFAULT_TIMELINE, normalizeTimeline, removeTimelineSection, timelineToStructure } from "./lib/styleTimeline.js";
import { describeMidiSupport, formatMidiMessage, summarizeMidiAccess } from "./lib/webMidi.js";

const API = "";
const saved = JSON.parse(localStorage.getItem("uaos.settings") || "{}");
let current = null;
let playing = false;
let timers = [];
let deferredPrompt = null;
let audioCtx = null;
let masterGain = null;
let sampleMapChecked = false;
let sampleMapEntries = [];
let samplesDecoded = false;
let sampleBuffers = [];
let activeSources = [];
let midiAccess = null;
let styleTimeline = normalizeTimeline(saved.timeline || DEFAULT_TIMELINE);

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (document.querySelector("#installBtn")) installBtn.style.display = "inline-block";
});

async function getJson(path, body) {
  const res = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function saveSettings() {
  localStorage.setItem("uaos.settings", JSON.stringify({
    tempo: tempo.value,
    section: section.value,
    chord: chord.value,
    maqam: maqam.value,
    mode: mode.value,
    timeline: styleTimeline
  }));
}

function log(message) {
  const row = document.createElement("div");
  row.className = "log-row";
  row.textContent = `${new Date().toLocaleTimeString()}  ${message}`;
  logs.prepend(row);
}

function writeMonitor(message) {
  const existing = monitor.textContent ? `${monitor.textContent}\n` : "";
  monitor.textContent = `${message}\n${existing}`.split("\n").slice(0, 80).join("\n");
}

function updateMidiState(summary = null) {
  if (!document.querySelector("#midiState")) return;
  const support = describeMidiSupport(navigator);

  if (!support.supported) {
    midiState.textContent = "Unavailable";
    return;
  }

  if (!summary) {
    midiState.textContent = "Ready";
    return;
  }

  midiState.textContent = `${summary.inputs.length} in / ${summary.outputs.length} out`;
}

function hz(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

async function initAudio() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") await audioCtx.resume();

  if (!masterGain) {
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.86;
    masterGain.connect(audioCtx.destination);
  }
}

function updateSamplerState() {
  if (!document.querySelector("#sampleState")) return;
  if (sampleBuffers.length) {
    sampleState.textContent = `${sampleBuffers.length} WAV ready`;
    return;
  }

  sampleState.textContent = sampleMapEntries.length ? `${sampleMapEntries.length} mapped` : "Synth fallback";
}

async function loadSamplerMap() {
  if (sampleMapChecked) return sampleMapEntries;
  sampleMapChecked = true;

  try {
    sampleMapEntries = normalizeSampleMap(await getJson("/api/sampler/map"));
    updateSamplerState();
    log(sampleMapEntries.length ? `Sampler map found ${sampleMapEntries.length} WAV slots` : "No WAV samples mapped; synth fallback ready");
  } catch (error) {
    sampleMapEntries = [];
    updateSamplerState();
    log("Sampler map unavailable; synth fallback ready");
  }

  return sampleMapEntries;
}

async function ensureDecodedSamples() {
  if (samplesDecoded) return;
  samplesDecoded = true;

  await initAudio();
  const map = await loadSamplerMap();
  const decoded = [];

  for (const sample of map) {
    try {
      const response = await fetch(sample.url);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const buffer = await audioCtx.decodeAudioData(await response.arrayBuffer());
      decoded.push({ ...sample, buffer });
    } catch (error) {
      log(`Sample skipped: ${sample.name}`);
    }
  }

  sampleBuffers = decoded;
  updateSamplerState();
  if (sampleBuffers.length) log(`Loaded ${sampleBuffers.length} WAV samples`);
}

function stop() {
  playing = false;
  timers.forEach(clearTimeout);
  timers = [];
  activeSources.forEach((source) => {
    try { source.stop(); } catch {}
  });
  activeSources = [];
  playState.textContent = "Stopped";
  log("Transport stopped");
}

function playSynthNote(ctx, note, velocity, channel, role, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = channel === 9 ? "square" : role === "bass" ? "triangle" : mode.value === "Soft" ? "sine" : "sawtooth";
  osc.frequency.value = channel === 9 ? (note === 36 ? 70 : 140) : hz(note);
  gain.gain.value = (velocity || 90) / (channel === 9 ? 850 : 1300);
  osc.connect(gain).connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + Math.max(0.05, (duration || 120) / 1000));
  activeSources.push(osc);
  osc.onended = () => activeSources = activeSources.filter((source) => source !== osc);
}

function playSamplerNote(ctx, note, velocity, channel, role, duration) {
  const sample = chooseSampleForNote(sampleBuffers, note, velocity, channel, role);
  if (!sample) return false;

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = sample.buffer;
  source.playbackRate.value = samplePlaybackRate(note, sample.rootNote);
  gain.gain.value = Math.max(0.04, Math.min(1, (velocity || 90) / 127));
  source.connect(gain).connect(masterGain);
  source.start();
  source.stop(ctx.currentTime + Math.max(0.08, (duration || 240) / 1000));
  activeSources.push(source);
  source.onended = () => activeSources = activeSources.filter((active) => active !== source);
  return true;
}

async function playPattern(pattern) {
  stop();
  await initAudio();
  await ensureDecodedSamples();
  playing = true;
  playState.textContent = "Playing";
  const beatMs = 60000 / pattern.tempo;
  let sampleHits = 0;

  for (const n of pattern.notes || []) {
    const id = setTimeout(() => {
      if (!playing) return;
      const usedSample = playSamplerNote(audioCtx, n.note, n.velocity, n.channel, n.role, n.duration);
      if (usedSample) sampleHits += 1;
      if (!usedSample) playSynthNote(audioCtx, n.note, n.velocity, n.channel, n.role, n.duration);
    }, n.time * beatMs / 480);
    timers.push(id);
  }

  const finishId = setTimeout(() => {
    if (playing) log(sampleHits ? `Playing ${pattern.name} with WAV sampler` : `Playing ${pattern.name} with synth fallback`);
  }, 20);
  timers.push(finishId);
}

function body() {
  saveSettings();
  return {
    tempo: Number(tempo.value),
    section: section.value,
    chord: chord.value,
    maqam: maqam.value,
    structure: timelineToStructure(styleTimeline),
    timeline: styleTimeline
  };
}

async function status() {
  const r = await getJson("/api/status");
  output.textContent = JSON.stringify(r, null, 2);
  apiStatus.textContent = "Online";
  log("Status checked");
}

async function presets() {
  const r = await getJson("/api/presets");
  output.textContent = JSON.stringify(r, null, 2);
  log("Presets loaded");
}

function bindMidiInputs(summary) {
  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = (event) => {
      const message = formatMidiMessage(event.data);
      writeMonitor(`${new Date().toLocaleTimeString()}  ${input.name || "MIDI Input"}  ${message}`);
      log(message);
    };
  }

  midiAccess.onstatechange = () => {
    const next = summarizeMidiAccess(midiAccess);
    updateMidiState(next);
    log(`MIDI devices: ${next.inputs.length} input / ${next.outputs.length} output`);
  };

  updateMidiState(summary);
}

async function enableMidi() {
  const support = describeMidiSupport(navigator);
  if (!support.supported) {
    updateMidiState();
    log(support.label);
    return;
  }

  try {
    midiAccess = await navigator.requestMIDIAccess({ sysex: false });
    const summary = summarizeMidiAccess(midiAccess);
    bindMidiInputs(summary);
    output.textContent = JSON.stringify({ midi: summary }, null, 2);
    log(`MIDI enabled: ${summary.inputs.length} input / ${summary.outputs.length} output`);
  } catch (error) {
    midiState.textContent = "Denied";
    log("MIDI permission denied or unavailable");
  }
}

async function generate() {
  current = await getJson("/api/song-generate", body());
  output.textContent = JSON.stringify(current, null, 2);
  monitor.textContent = current.notes.map(n => `${n.time}  CH${n.channel}  NOTE ${n.note}  VEL ${n.velocity}  ${n.role}`).join("\n");
  songName.textContent = current.name;
  log(`Generated ${current.name}`);
}

async function play() {
  if (!current) await generate();
  await playPattern(current);
}

async function downloadMidi() {
  const res = await fetch("/api/midi-export", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body())
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "uaos-style.mid";
  a.click();
  URL.revokeObjectURL(url);
  log("MIDI exported");
}

async function installApp() {
  if (!deferredPrompt) {
    log("Install prompt not available. Use browser menu: Install app.");
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
}

function exportProject() {
  const data = {
    exportedAt: new Date().toISOString(),
    app: "UAOS HyperStation",
    settings: JSON.parse(localStorage.getItem("uaos.settings") || "{}"),
    timeline: styleTimeline,
    pattern: current
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "uaos-project.json";
  a.click();
  log("Project exported");
}

function renderTimeline() {
  if (!document.querySelector("#timelineRows")) return;
  timelineRows.innerHTML = styleTimeline.map((item, index) => `
    <div class="timeline-row">
      <strong>${index + 1}. ${item.section}</strong>
      <span>${item.bars} bars</span>
      <button class="mini danger" data-remove-timeline="${index}">Remove</button>
    </div>
  `).join("");

  for (const button of timelineRows.querySelectorAll("[data-remove-timeline]")) {
    button.onclick = () => {
      styleTimeline = removeTimelineSection(styleTimeline, Number(button.dataset.removeTimeline));
      saveSettings();
      renderTimeline();
      log("Timeline section removed");
    };
  }
}

function addTimelineSection() {
  styleTimeline = appendTimelineSection(styleTimeline, timelineSection.value, timelineBars.value);
  saveSettings();
  renderTimeline();
  log(`Timeline added: ${timelineSection.value}`);
}

document.querySelector("#app").innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">U</div>
        <div>
          <h1>UAOS</h1>
          <p>HyperStation</p>
        </div>
      </div>

      <nav>
        <button class="nav active">Live Arranger</button>
        <button class="nav">MIDI Export</button>
        <button class="nav">Sound Library</button>
        <button class="nav">Mobile / Desktop</button>
      </nav>

      <div class="side-card"><span>Public API</span><strong id="apiStatus">Ready</strong></div>
      <div class="side-card"><span>Sampler</span><strong id="sampleState">Checking</strong></div>
      <div class="side-card"><span>MIDI</span><strong id="midiState">Checking</strong></div>
      <div class="side-card"><span>Transport</span><strong id="playState">Stopped</strong></div>
      <div class="side-card"><span>Build</span><strong>Web + APK + EXE</strong></div>
    </aside>

    <main class="main">
      <section class="topbar">
        <div>
          <p class="eyebrow">AEPlatform Final App Foundation</p>
          <h2 id="songName">UAOS HyperStation</h2>
        </div>
        <div class="top-actions">
          <button id="installBtn" class="ghost" style="display:none">Install App</button>
          <button id="statusBtn" class="ghost">Status</button>
          <button id="presetsBtn" class="ghost">Presets</button>
          <button id="midiInputBtn" class="ghost">Enable MIDI</button>
          <button id="midiBtn" class="primary">Export MIDI</button>
        </div>
      </section>

      <section class="hero-card">
        <div>
          <h3>Apple-like live arranger workstation</h3>
          <p>One public app for web, desktop, and Android. Generate sections, play audio, export MIDI, and save project state.</p>
        </div>
        <div class="pill-row">
          <span>Public Web</span>
          <span>Desktop EXE</span>
          <span>Android APK</span>
          <span>iOS Ready</span>
        </div>
      </section>

      <section class="grid">
        <div class="panel controls">
          <h3>Arranger Controls</h3>

          <label>Mode</label>
          <select id="mode">
            <option>Soft</option>
            <option>Bright</option>
          </select>

          <label>Section</label>
          <select id="section">
            <option>Intro</option><option selected>Main A</option><option>Main B</option><option>Fill</option><option>Break</option><option>Ending</option>
          </select>

          <label>Chord</label>
          <select id="chord">
            <option>Cm</option><option>Dm</option><option>G7</option><option>F</option><option>Bb</option><option>Am</option>
          </select>

          <label>Maqam</label>
          <select id="maqam">
            <option>Nahawand</option><option>Bayati</option><option>Hijaz</option><option>Rast</option><option>Saba</option><option>Kurd</option>
          </select>

          <label>Tempo <span id="tempoLabel">96</span></label>
          <input id="tempo" type="range" min="60" max="160" value="96"/>

          <div class="transport">
            <button id="generateBtn" class="primary">Generate</button>
            <button id="playBtn">Play</button>
            <button id="stopBtn" class="danger">Stop</button>
          </div>

          <button id="exportProjectBtn">Export Project JSON</button>
        </div>

        <div class="panel controls">
          <h3>Style Timeline</h3>
          <label>Section</label>
          <select id="timelineSection">
            <option>Intro</option><option>Main A</option><option>Main B</option><option>Main C</option><option>Main D</option><option>Fill</option><option>Break</option><option>Ending</option>
          </select>
          <label>Bars</label>
          <input id="timelineBars" type="number" min="1" max="64" value="4"/>
          <button id="timelineAddBtn" class="primary">Add Section</button>
          <div id="timelineRows" class="timeline-rows"></div>
        </div>

        <div class="panel"><h3>Pattern Output</h3><pre id="output">Ready.</pre></div>
        <div class="panel"><h3>MIDI Monitor</h3><pre id="monitor"></pre></div>
        <div class="panel"><h3>System Log</h3><div id="logs" class="logs"></div></div>
      </section>
    </main>
  </div>
`;

tempo.value = saved.tempo || 96;
section.value = saved.section || "Main A";
chord.value = saved.chord || "Cm";
maqam.value = saved.maqam || "Nahawand";
mode.value = saved.mode || "Soft";
tempoLabel.textContent = tempo.value;
renderTimeline();

tempo.oninput = () => { tempoLabel.textContent = tempo.value; saveSettings(); };
section.onchange = saveSettings;
chord.onchange = saveSettings;
maqam.onchange = saveSettings;
mode.onchange = saveSettings;

installBtn.onclick = installApp;
statusBtn.onclick = status;
presetsBtn.onclick = presets;
midiInputBtn.onclick = enableMidi;
generateBtn.onclick = generate;
playBtn.onclick = play;
stopBtn.onclick = stop;
midiBtn.onclick = downloadMidi;
exportProjectBtn.onclick = exportProject;
timelineAddBtn.onclick = addTimelineSection;

status().catch(() => log("Public API check failed"));
loadSamplerMap().catch(() => log("Sampler preload failed"));
updateMidiState();
